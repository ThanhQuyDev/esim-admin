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
  const contentRef = useRef('');

  const mutation = useMutation({
    ...createBlogMutation,
    onSuccess: () => {
      toast.success('Tạo bài viết thành công');
      onOpenChange(false);
      form.reset();
      setCoverFile(null);
      contentRef.current = '';
    },
    onError: (e) => toast.error(e.message || 'Tạo bài viết thất bại')
  });

  const form = useAppForm({
    defaultValues: {
      title: '',
      content: '',
      author: '',
      language: 'en',
      slug: '',
      category: '',
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
          content: contentRef.current || value.content || '',
          author: value.author,
          language: value.language,
          ...(value.slug && { slug: value.slug }),
          ...(value.category && { category: value.category }),
          ...(value.excerpt && { excerpt: value.excerpt }),
          ...(coverImage && { coverImage }),
          isPublished: value.isPublished ?? false
        };
        await mutation.mutateAsync(payload);
      } catch {
        toast.error('Tải ảnh lên thất bại');
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
          <SheetTitle>Bài viết mới</SheetTitle>
          <SheetDescription>Tạo bài viết mới.</SheetDescription>
        </SheetHeader>
        <div className='flex-1 overflow-auto'>
          <form.AppForm>
            <form.Form id='blog-form-sheet' className='space-y-4'>
              <FormTextField
                name='title'
                label='Tiêu đề'
                required
                placeholder='Tiêu đề bài viết'
                validators={{ onBlur: z.string().min(2) }}
              />
              <div className='grid grid-cols-2 gap-4'>
                <FormTextField name='author' label='Tác giả' required placeholder='Tên tác giả' />
                <FormSelectField name='language' label='Ngôn ngữ' required options={LANG_OPTIONS} />
              </div>
              <div className='grid grid-cols-2 gap-4'>
                <FormTextField name='slug' label='Slug' placeholder='duong-dan-bai-viet' />
                <FormTextField name='category' label='Danh mục' placeholder='danh mục bài viết' />
              </div>
              <ImageUploadField label='Ảnh bìa' onFileSelect={setCoverFile} file={coverFile} />
              <FormTextareaField name='excerpt' label='Tóm tắt' placeholder='Mô tả ngắn...' />
              <div className='space-y-2'>
                <label className='text-sm font-medium'>Nội dung *</label>
                <TiptapEditor
                  content={contentRef.current}
                  onChange={(html) => {
                    contentRef.current = html;
                  }}
                  placeholder='Viết nội dung bài viết...'
                  onImageUpload={uploadToCloudinary}
                />
              </div>
              <FormSwitchField name='isPublished' label='Xuất bản' />
            </form.Form>
          </form.AppForm>
        </div>
        <SheetFooter>
          <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button type='submit' form='blog-form-sheet' isLoading={isPending}>
            <Icons.check /> Tạo mới
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
  const contentRef = useRef(blog.content);

  const mutation = useMutation({
    ...updateBlogMutation,
    onSuccess: () => {
      toast.success('Cập nhật bài viết thành công');
      onOpenChange(false);
    },
    onError: (e) => toast.error(e.message || 'Cập nhật bài viết thất bại')
  });

  const form = useAppForm({
    defaultValues: {
      title: blog.title,
      content: blog.content,
      author: blog.author,
      language: blog.language as 'vi' | 'en',
      slug: blog.slug ?? '',
      category: blog.category ?? '',
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
          content: contentRef.current || value.content || '',
          author: value.author,
          language: value.language,
          slug: value.slug || undefined,
          category: value.category || undefined,
          excerpt: value.excerpt || undefined,
          ...(coverImage && { coverImage }),
          isPublished: value.isPublished
        };
        await mutation.mutateAsync({ id: blog.id, values: payload });
      } catch {
        toast.error('Tải ảnh lên thất bại');
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
          <SheetTitle>Chỉnh sửa bài viết</SheetTitle>
          <SheetDescription>Cập nhật bài viết.</SheetDescription>
        </SheetHeader>
        <div className='flex-1 overflow-auto'>
          <form.AppForm>
            <form.Form id='blog-form-sheet' className='space-y-4'>
              <FormTextField
                name='title'
                label='Tiêu đề'
                required
                placeholder='Tiêu đề bài viết'
                validators={{ onBlur: z.string().min(2) }}
              />
              <div className='grid grid-cols-2 gap-4'>
                <FormTextField name='author' label='Tác giả' required placeholder='Tên tác giả' />
                <FormSelectField name='language' label='Ngôn ngữ' required options={LANG_OPTIONS} />
              </div>
              <div className='grid grid-cols-2 gap-4'>
                <FormTextField name='slug' label='Slug' placeholder='duong-dan-bai-viet' />
                <FormTextField name='category' label='Danh mục' placeholder='danh mục bài viết' />
              </div>
              <ImageUploadField
                label='Ảnh bìa'
                currentUrl={blog.coverImage}
                onFileSelect={setCoverFile}
                file={coverFile}
              />
              <FormTextareaField name='excerpt' label='Tóm tắt' placeholder='Mô tả ngắn...' />
              <div className='space-y-2'>
                <label className='text-sm font-medium'>Nội dung *</label>
                <TiptapEditor
                  content={contentRef.current}
                  onChange={(html) => {
                    contentRef.current = html;
                  }}
                  placeholder='Viết nội dung bài viết...'
                  onImageUpload={uploadToCloudinary}
                />
              </div>
              <FormSwitchField name='isPublished' label='Xuất bản' />
            </form.Form>
          </form.AppForm>
        </div>
        <SheetFooter>
          <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button type='submit' form='blog-form-sheet' isLoading={isPending}>
            <Icons.check /> Cập nhật
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
        <Icons.add className='mr-2 h-4 w-4' /> Thêm bài viết
      </Button>
      <BlogFormSheet open={open} onOpenChange={setOpen} />
    </>
  );
}
