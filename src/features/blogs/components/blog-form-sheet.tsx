'use client';

import { useState, useRef } from 'react';
import { useAppForm, useFormFields } from '@/components/ui/tanstack-form';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet';
import { Icons } from '@/components/icons';
import { useMutation } from '@tanstack/react-query';
import { createBlogMutation, updateBlogMutation } from '../api/mutations';
import { uploadToCloudinary } from '../api/service';
import type { Blog, CreateBlogPayload, UpdateBlogPayload } from '../api/types';
import { toast } from 'sonner';
import * as z from 'zod';
import { blogSchema, type BlogFormValues } from '../schemas/blog';
import { TiptapEditor } from '@/components/tiptap-editor';

const LANG_OPTIONS = [
  { value: 'vi', label: 'Vietnamese' },
  { value: 'en', label: 'English' }
];

interface BlogFormSheetProps {
  blog?: Blog;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BlogFormSheet({ blog, open, onOpenChange }: BlogFormSheetProps) {
  if (blog)
    return <EditBlogSheet key={blog.id} blog={blog} open={open} onOpenChange={onOpenChange} />;
  return <CreateBlogSheet open={open} onOpenChange={onOpenChange} />;
}

function ImageUploadField({
  label,
  currentUrl,
  onFileSelect,
  file
}: {
  label: string;
  currentUrl?: string | null;
  onFileSelect: (f: File | null) => void;
  file: File | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const previewUrl = file ? URL.createObjectURL(file) : currentUrl;
  return (
    <div className='space-y-2'>
      <label className='text-sm font-medium'>{label}</label>
      <div className='flex items-center gap-3'>
        {previewUrl && (
          <img src={previewUrl} alt={label} className='h-10 w-16 rounded border object-cover' />
        )}
        <Button type='button' variant='outline' size='sm' onClick={() => inputRef.current?.click()}>
          <Icons.upload className='mr-2 h-4 w-4' />
          {previewUrl ? 'Change' : 'Upload'}
        </Button>
        {file && (
          <Button type='button' variant='ghost' size='sm' onClick={() => onFileSelect(null)}>
            <Icons.close className='h-4 w-4' />
          </Button>
        )}
      </div>
      <input
        ref={inputRef}
        type='file'
        accept='image/*'
        className='hidden'
        onChange={(e) => {
          onFileSelect(e.target.files?.[0] ?? null);
          e.target.value = '';
        }}
      />
    </div>
  );
}

function CreateBlogSheet({
  open,
  onOpenChange
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [content, setContent] = useState('');

  const mutation = useMutation({
    ...createBlogMutation,
    onSuccess: () => {
      toast.success('Blog created');
      onOpenChange(false);
      form.reset();
      setCoverFile(null);
      setContent('');
    },
    onError: (e) => toast.error(e.message || 'Failed to create blog')
  });

  const form = useAppForm({
    defaultValues: {
      title: '',
      content: '',
      author: '',
      language: 'en',
      slug: '',
      tags: '',
      excerpt: '',
      isPublished: false
    } as BlogFormValues,
    validators: { onSubmit: blogSchema },
    onSubmit: async ({ value }) => {
      setUploading(true);
      try {
        let coverImage: string | undefined;
        if (coverFile) coverImage = await uploadToCloudinary(coverFile);
        const payload: CreateBlogPayload = {
          title: value.title,
          content: content || value.content,
          author: value.author,
          language: value.language,
          ...(value.slug && { slug: value.slug }),
          ...(value.tags && { tags: value.tags }),
          ...(value.excerpt && { excerpt: value.excerpt }),
          ...(coverImage && { coverImage }),
          isPublished: value.isPublished ?? false
        };
        await mutation.mutateAsync(payload);
      } catch {
        toast.error('Failed to upload image');
      } finally {
        setUploading(false);
      }
    }
  });

  const { FormTextField, FormSelectField, FormSwitchField, FormTextareaField } =
    useFormFields<BlogFormValues>();
  const isPending = mutation.isPending || uploading;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='flex flex-col sm:max-w-xl'>
        <SheetHeader>
          <SheetTitle>New Blog</SheetTitle>
          <SheetDescription>Create a new blog post.</SheetDescription>
        </SheetHeader>
        <div className='flex-1 overflow-auto'>
          <form.AppForm>
            <form.Form id='blog-form-sheet' className='space-y-4'>
              <FormTextField
                name='title'
                label='Title'
                required
                placeholder='Blog title'
                validators={{ onBlur: z.string().min(2) }}
              />
              <div className='grid grid-cols-2 gap-4'>
                <FormTextField name='author' label='Author' required placeholder='Author name' />
                <FormSelectField name='language' label='Language' required options={LANG_OPTIONS} />
              </div>
              <div className='grid grid-cols-2 gap-4'>
                <FormTextField name='slug' label='Slug' placeholder='blog-slug' />
                <FormTextField name='tags' label='Tags' placeholder='tag1, tag2' />
              </div>
              <ImageUploadField label='Cover Image' onFileSelect={setCoverFile} file={coverFile} />
              <FormTextareaField
                name='excerpt'
                label='Excerpt'
                placeholder='Short description...'
              />
              <div className='space-y-2'>
                <label className='text-sm font-medium'>Content *</label>
                <TiptapEditor
                  content={content}
                  onChange={(html) => {
                    setContent(html);
                    form.setFieldValue('content', html);
                  }}
                  placeholder='Write your blog content...'
                  onImageUpload={uploadToCloudinary}
                />
              </div>
              <FormSwitchField name='isPublished' label='Published' />
            </form.Form>
          </form.AppForm>
        </div>
        <SheetFooter>
          <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type='submit' form='blog-form-sheet' isLoading={isPending}>
            <Icons.check /> Create
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function EditBlogSheet({
  blog,
  open,
  onOpenChange
}: {
  blog: Blog;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [content, setContent] = useState(blog.content);

  const mutation = useMutation({
    ...updateBlogMutation,
    onSuccess: () => {
      toast.success('Blog updated');
      onOpenChange(false);
    },
    onError: (e) => toast.error(e.message || 'Failed to update blog')
  });

  const form = useAppForm({
    defaultValues: {
      title: blog.title,
      content: blog.content,
      author: blog.author,
      language: blog.language as 'vi' | 'en',
      slug: blog.slug ?? '',
      tags: blog.tags ?? '',
      excerpt: blog.excerpt ?? '',
      isPublished: blog.isPublished
    } as BlogFormValues,
    validators: { onSubmit: blogSchema },
    onSubmit: async ({ value }) => {
      setUploading(true);
      try {
        let coverImage: string | undefined;
        if (coverFile) coverImage = await uploadToCloudinary(coverFile);
        const payload: UpdateBlogPayload = {
          title: value.title,
          content: content || value.content,
          author: value.author,
          language: value.language,
          slug: value.slug || undefined,
          tags: value.tags || undefined,
          excerpt: value.excerpt || undefined,
          ...(coverImage && { coverImage }),
          isPublished: value.isPublished
        };
        await mutation.mutateAsync({ id: blog.id, values: payload });
      } catch {
        toast.error('Failed to upload image');
      } finally {
        setUploading(false);
      }
    }
  });

  const { FormTextField, FormSelectField, FormSwitchField, FormTextareaField } =
    useFormFields<BlogFormValues>();
  const isPending = mutation.isPending || uploading;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='flex flex-col sm:max-w-xl'>
        <SheetHeader>
          <SheetTitle>Edit Blog</SheetTitle>
          <SheetDescription>Update the blog post.</SheetDescription>
        </SheetHeader>
        <div className='flex-1 overflow-auto'>
          <form.AppForm>
            <form.Form id='blog-form-sheet' className='space-y-4'>
              <FormTextField
                name='title'
                label='Title'
                required
                placeholder='Blog title'
                validators={{ onBlur: z.string().min(2) }}
              />
              <div className='grid grid-cols-2 gap-4'>
                <FormTextField name='author' label='Author' required placeholder='Author name' />
                <FormSelectField name='language' label='Language' required options={LANG_OPTIONS} />
              </div>
              <div className='grid grid-cols-2 gap-4'>
                <FormTextField name='slug' label='Slug' placeholder='blog-slug' />
                <FormTextField name='tags' label='Tags' placeholder='tag1, tag2' />
              </div>
              <ImageUploadField
                label='Cover Image'
                currentUrl={blog.coverImage}
                onFileSelect={setCoverFile}
                file={coverFile}
              />
              <FormTextareaField
                name='excerpt'
                label='Excerpt'
                placeholder='Short description...'
              />
              <div className='space-y-2'>
                <label className='text-sm font-medium'>Content *</label>
                <TiptapEditor
                  content={content}
                  onChange={(html) => {
                    setContent(html);
                    form.setFieldValue('content', html);
                  }}
                  placeholder='Write your blog content...'
                  onImageUpload={uploadToCloudinary}
                />
              </div>
              <FormSwitchField name='isPublished' label='Published' />
            </form.Form>
          </form.AppForm>
        </div>
        <SheetFooter>
          <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type='submit' form='blog-form-sheet' isLoading={isPending}>
            <Icons.check /> Update
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export function BlogFormSheetTrigger() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)} size='sm'>
        <Icons.add className='mr-2 h-4 w-4' /> Add Blog
      </Button>
      <BlogFormSheet open={open} onOpenChange={setOpen} />
    </>
  );
}
