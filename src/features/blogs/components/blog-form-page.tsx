'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAppForm, useFormFields } from '@/components/ui/tanstack-form';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { useMutation, useQuery } from '@tanstack/react-query';
import { createBlogMutation, updateBlogMutation } from '../api/mutations';
import { uploadToCloudinary } from '../api/service';
import type { Blog, CreateBlogPayload, UpdateBlogPayload } from '../api/types';
import { toast } from 'sonner';
import * as z from 'zod';
import { blogSchema, type BlogFormValues } from '../schemas/blog';
import { TiptapEditor } from '@/components/tiptap-editor';
import { Card, CardContent } from '@/components/ui/card';
import { miniTagsQueryOptions } from '@/features/mini-tags/api/queries';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command';
import { cn } from '@/lib/utils';
import type { MiniTag } from '@/features/mini-tags/api/types';

const LANG_OPTIONS = [
  { value: 'vi', label: 'Vietnamese' },
  { value: 'en', label: 'English' }
];

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
          <div className='relative h-20 w-32 overflow-hidden rounded-lg border-2 border-border/50 shadow-sm'>
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

function MiniTagSelector({
  miniTags,
  value,
  selectedTitle,
  onChange
}: {
  miniTags: MiniTag[];
  value: string;
  selectedTitle?: string;
  onChange: (val: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className='space-y-2'>
      <Label>Mini Tag</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant='outline'
            role='combobox'
            aria-expanded={open}
            className='w-full justify-between'
          >
            {selectedTitle || 'Chọn mini tag...'}
            <Icons.chevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
          </Button>
        </PopoverTrigger>
        <PopoverContent className='w-full p-0' align='start'>
          <Command>
            <CommandInput placeholder='Tìm mini tag...' />
            <CommandList>
              <CommandEmpty>Không tìm thấy.</CommandEmpty>
              <CommandGroup>
                <CommandItem
                  onSelect={() => {
                    onChange('');
                    setOpen(false);
                  }}
                >
                  <Icons.check
                    className={cn('mr-2 h-4 w-4', !value ? 'opacity-100' : 'opacity-0')}
                  />
                  Không chọn
                </CommandItem>
                {miniTags.map((tag) => (
                  <CommandItem
                    key={tag.id}
                    onSelect={() => {
                      onChange(String(tag.id));
                      setOpen(false);
                    }}
                  >
                    <Icons.check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value === String(tag.id) ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    {tag.title}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

interface BlogFormPageProps {
  blog?: Blog;
}

export function BlogFormPage({ blog }: BlogFormPageProps) {
  const router = useRouter();
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const contentRef = useRef(blog?.content ?? '');
  const isEdit = !!blog;

  const createMut = useMutation({
    ...createBlogMutation,
    onSuccess: () => {
      toast.success('Tạo bài viết thành công');
      router.push('/dashboard/blogs');
    },
    onError: (e) => toast.error(e.message || 'Tạo bài viết thất bại')
  });

  const updateMut = useMutation({
    ...updateBlogMutation,
    onSuccess: () => {
      toast.success('Cập nhật bài viết thành công');
      router.push('/dashboard/blogs');
    },
    onError: (e) => toast.error(e.message || 'Cập nhật bài viết thất bại')
  });

  const { data: miniTagsData } = useQuery(miniTagsQueryOptions({ page: 1, limit: 100 }));
  const miniTags = miniTagsData?.data ?? [];

  const form = useAppForm({
    defaultValues: {
      title: blog?.title ?? '',
      content: blog?.content ?? '',
      author: blog?.author ?? '',
      language: (blog?.language as 'vi' | 'en') ?? 'en',
      slug: blog?.slug ?? '',
      category: blog?.category ?? '',
      excerpt: blog?.excerpt ?? '',
      isPublished: blog?.isPublished ?? false,
      miniTagId: blog?.miniTagId ?? '',
      planIdsText: blog?.planIds?.join(', ') ?? '',
      timeRead: blog?.timeRead ?? undefined
    } as BlogFormValues,
    validators: { onSubmit: blogSchema },
    onSubmit: async ({ value }) => {
      setUploading(true);
      try {
        let coverImage: string | undefined;
        if (coverFile) coverImage = await uploadToCloudinary(coverFile);

        const planIds = value.planIdsText
          ? value.planIdsText
              .split(',')
              .map((s) => Number(s.trim()))
              .filter((n) => !isNaN(n) && n > 0)
          : [];

        if (isEdit) {
          const payload: UpdateBlogPayload = {
            title: value.title,
            content: contentRef.current || value.content || '',
            author: value.author,
            language: value.language,
            slug: value.slug || undefined,
            category: value.category || undefined,
            excerpt: value.excerpt || undefined,
            ...(coverImage && { coverImage }),
            isPublished: value.isPublished,
            miniTagId: value.miniTagId || undefined,
            planIds,
            timeRead: value.timeRead || undefined
          };
          await updateMut.mutateAsync({ id: blog.id, values: payload });
        } else {
          const payload: CreateBlogPayload = {
            title: value.title,
            content: contentRef.current || value.content || '',
            author: value.author,
            language: value.language,
            ...(value.slug && { slug: value.slug }),
            ...(value.category && { category: value.category }),
            ...(value.excerpt && { excerpt: value.excerpt }),
            ...(coverImage && { coverImage }),
            isPublished: value.isPublished ?? false,
            miniTagId: value.miniTagId || undefined,
            planIds,
            timeRead: value.timeRead || undefined
          };
          await createMut.mutateAsync(payload);
        }
      } catch {
        toast.error('Tải ảnh lên thất bại');
      } finally {
        setUploading(false);
      }
    }
  });

  const { FormTextField, FormSelectField, FormSwitchField, FormTextareaField } =
    useFormFields<BlogFormValues>();
  const isPending = createMut.isPending || updateMut.isPending || uploading;

  return (
    <div className='mx-auto w-full max-w-5xl space-y-6'>
      <form.AppForm>
        <form.Form id='blog-page-form' className='space-y-6'>
          {/* Meta fields */}
          <Card>
            <CardContent className='space-y-4 pt-6'>
              <FormTextField
                name='title'
                label='Tiêu đề'
                required
                placeholder='Tiêu đề bài viết'
                validators={{ onBlur: z.string().min(2) }}
              />
              <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                <FormTextField name='author' label='Tác giả' required placeholder='Tên tác giả' />
                <FormSelectField name='language' label='Ngôn ngữ' required options={LANG_OPTIONS} />
              </div>
              <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                <FormTextField name='slug' label='Slug' placeholder='duong-dan-bai-viet' />
                <FormTextField name='category' label='Danh mục' placeholder='danh mục bài viết' />
              </div>
              <form.AppField name='timeRead'>
                {(field) => (
                  <div className='space-y-2'>
                    <Label>Thời gian đọc (phút)</Label>
                    <Input
                      type='number'
                      min={1}
                      value={field.state.value ?? ''}
                      onChange={(e) =>
                        field.handleChange(e.target.value ? Number(e.target.value) : undefined)
                      }
                      placeholder='VD: 5'
                    />
                  </div>
                )}
              </form.AppField>
              <ImageUploadField
                label='Ảnh bìa'
                currentUrl={blog?.coverImage}
                onFileSelect={setCoverFile}
                file={coverFile}
              />
              <FormTextareaField name='excerpt' label='Tóm tắt' placeholder='Mô tả ngắn...' />

              {/* Mini Tag selector */}
              <form.AppField name='miniTagId'>
                {(field) => {
                  const selectedTag = miniTags.find((t) => String(t.id) === field.state.value);
                  return (
                    <MiniTagSelector
                      miniTags={miniTags}
                      value={field.state.value ?? ''}
                      selectedTitle={selectedTag?.title}
                      onChange={(val) => field.handleChange(val)}
                    />
                  );
                }}
              </form.AppField>

              {/* Plan IDs */}
              <FormTextField
                name='planIdsText'
                label='Plan IDs (liên quan)'
                placeholder='Nhập ID gói, cách nhau bằng dấu phẩy: 1, 2, 3'
              />

              <FormSwitchField name='isPublished' label='Xuất bản' />
            </CardContent>
          </Card>

          {/* Content editor - full width */}
          <Card>
            <CardContent className='pt-6'>
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
            </CardContent>
          </Card>

          {/* Actions */}
          <div className='flex items-center justify-end gap-3'>
            <Button type='button' variant='outline' onClick={() => router.push('/dashboard/blogs')}>
              Hủy
            </Button>
            <Button type='submit' form='blog-page-form' isLoading={isPending}>
              <Icons.check className='mr-2 h-4 w-4' />
              {isEdit ? 'Cập nhật' : 'Tạo mới'}
            </Button>
          </div>
        </form.Form>
      </form.AppForm>
    </div>
  );
}
