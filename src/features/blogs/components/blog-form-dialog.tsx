'use client';

import { useState, useRef } from 'react';
import { useAppForm, useFormFields } from '@/components/ui/tanstack-form';
import { FormDialog } from '@/components/ui/form-dialog';
import { Button } from '@/components/ui/button';
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

interface BlogFormDialogProps {
  blog?: Blog;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BlogFormDialog({ blog, open, onOpenChange }: BlogFormDialogProps) {
  if (blog)
    return <EditBlogDialog key={blog.id} blog={blog} open={open} onOpenChange={onOpenChange} />;
  return <CreateBlogDialog open={open} onOpenChange={onOpenChange} />;
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
          <div className='relative h-16 w-20 overflow-hidden rounded-lg border-2 border-border/50 shadow-sm'>
            <img src={previewUrl} alt={label} className='h-full w-full object-cover' />
          </div>
        )}
        <Button type='button' variant='outline' size='sm' onClick={() => inputRef.current?.click()}>
          <Icons.upload className='mr-2 h-4 w-4' />
          {previewUrl ? 'Thay đổi' : 'Tải lên'}
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

function CreateBlogDialog({
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
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title='Bài viết mới'
      description='Tạo bài viết mới cho blog'
      formId='blog-form-dialog'
      isLoading={isPending}
      submitLabel='Tạo mới'
      metaInfo={
        <>
          <Icons.page className='h-4 w-4' />
          <span>Quản lý blog</span>
        </>
      }
    >
      <form.AppForm>
        <form.Form id='blog-form-dialog' className='space-y-6'>
          <FormTextField
            name='title'
            label='Tiêu đề'
            required
            placeholder='Tiêu đề bài viết'
            validators={{ onBlur: z.string().min(2) }}
          />
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <FormTextField name='author' label='Tác giả' required placeholder='Tên tác giả' />
            <FormSelectField name='language' label='Ngôn ngữ' required options={LANG_OPTIONS} />
          </div>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
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
    </FormDialog>
  );
}

function EditBlogDialog({
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
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title='Chỉnh sửa bài viết'
      description='Cập nhật thông tin bài viết'
      formId='blog-form-dialog'
      isLoading={isPending}
      submitLabel='Cập nhật'
      metaInfo={
        <>
          <Icons.edit className='h-4 w-4' />
          <span>ID: {blog.id}</span>
        </>
      }
    >
      <form.AppForm>
        <form.Form id='blog-form-dialog' className='space-y-6'>
          <FormTextField
            name='title'
            label='Tiêu đề'
            required
            placeholder='Tiêu đề bài viết'
            validators={{ onBlur: z.string().min(2) }}
          />
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <FormTextField name='author' label='Tác giả' required placeholder='Tên tác giả' />
            <FormSelectField name='language' label='Ngôn ngữ' required options={LANG_OPTIONS} />
          </div>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
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
    </FormDialog>
  );
}

export function BlogFormDialogTrigger() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)} size='sm'>
        <Icons.add className='mr-2 h-4 w-4' /> Thêm bài viết
      </Button>
      <BlogFormDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
