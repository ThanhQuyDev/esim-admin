'use client';

import { useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAppForm, useFormFields } from '@/components/ui/tanstack-form';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useMutation } from '@tanstack/react-query';
import { createHelpCenterMutation, updateHelpCenterMutation } from '../api/mutations';
import { createSeoConfig } from '@/features/seo-configs/api/service';
import type {
  HelpCenterArticle,
  CreateHelpCenterPayload,
  UpdateHelpCenterPayload
} from '../api/types';
import { CATEGORY_OPTIONS, PARENT_OPTIONS, LANG_OPTIONS } from '../api/types';
import { toast } from 'sonner';
import { helpCenterSchema, type HelpCenterFormValues } from '../schemas/help-center';
import { TiptapEditor } from '@/components/tiptap-editor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface HelpCenterFormPageProps {
  article?: HelpCenterArticle;
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function HelpCenterFormPage({ article }: HelpCenterFormPageProps) {
  const router = useRouter();
  const contentRef = useRef(article?.content ?? '');
  const isEdit = !!article;

  const syncSeoConfig = async (value: HelpCenterFormValues, slug: string) => {
    try {
      const locale = value.language || 'en';
      const categorySlug = value.category.replace(/_/g, '-');
      const parentSlug = value.parent.replace(/_/g, '-');
      const seoUrl = `/${locale}/help-center/${categorySlug}/${parentSlug}/${slug}`;
      await createSeoConfig({
        url: seoUrl,
        metaTitle: value.seoTitle || value.title,
        metaDescription: value.seoDescription || '',
        metaKeywords: value.seoKeywords || '',
        isActive: true
      });
    } catch {
      // SEO sync is best-effort, don't block the main save
    }
  };

  const createMut = useMutation({
    ...createHelpCenterMutation,
    onSuccess: (_data, variables) => {
      toast.success('Tạo bài viết thành công');
      router.push('/dashboard/help-center');
    },
    onError: (e) => toast.error(e.message || 'Tạo bài viết thất bại')
  });

  const updateMut = useMutation({
    ...updateHelpCenterMutation,
    onSuccess: () => {
      toast.success('Cập nhật bài viết thành công');
      router.push('/dashboard/help-center');
    },
    onError: (e) => toast.error(e.message || 'Cập nhật bài viết thất bại')
  });

  const form = useAppForm({
    defaultValues: {
      title: article?.title ?? '',
      content: article?.content ?? '',
      order: String(article?.order ?? 0),
      category: article?.category ?? 'getting_started',
      parent: article?.parent ?? 'setting_up',
      language: (article?.language as 'vi' | 'en') ?? 'en',
      slug: article?.slug ?? '',
      isPublished: article?.isPublished ?? false,
      seoTitle: article?.seoTitle ?? '',
      seoDescription: article?.seoDescription ?? '',
      seoKeywords: article?.seoKeywords ?? ''
    } as HelpCenterFormValues,
    validators: { onSubmit: helpCenterSchema },
    onSubmit: async ({ value }) => {
      const slug = value.slug || generateSlug(value.title);
      if (isEdit) {
        const payload: UpdateHelpCenterPayload = {
          title: value.title,
          content: contentRef.current || value.content,
          order: value.order ? Number(value.order) : undefined,
          category: value.category,
          parent: value.parent,
          language: value.language || undefined,
          slug,
          isPublished: value.isPublished,
          seoTitle: value.seoTitle || undefined,
          seoDescription: value.seoDescription || undefined,
          seoKeywords: value.seoKeywords || undefined
        };
        await updateMut.mutateAsync({ id: article.id, values: payload });
        await syncSeoConfig(value, slug);
      } else {
        const payload: CreateHelpCenterPayload = {
          title: value.title,
          content: contentRef.current || value.content,
          order: value.order ? Number(value.order) : 0,
          category: value.category,
          parent: value.parent,
          language: value.language || undefined,
          slug,
          isPublished: value.isPublished,
          seoTitle: value.seoTitle || undefined,
          seoDescription: value.seoDescription || undefined,
          seoKeywords: value.seoKeywords || undefined
        };
        await createMut.mutateAsync(payload);
        await syncSeoConfig(value, slug);
      }
    }
  });

  const { FormTextField, FormSelectField, FormCheckboxField } =
    useFormFields<HelpCenterFormValues>();
  const isPending = createMut.isPending || updateMut.isPending;

  return (
    <div className='mx-auto w-full max-w-5xl space-y-6'>
      <form.AppForm>
        <form.Form id='help-center-page-form' className='space-y-6'>
          <Card>
            <CardContent className='space-y-4 pt-6'>
              <div className='flex items-center justify-between'>
                <FormTextField
                  name='title'
                  label='Tiêu đề'
                  required
                  placeholder='Nhập tiêu đề...'
                />
              </div>
              <FormTextField
                name='slug'
                label='Slug (URL)'
                placeholder='Tự động tạo từ tiêu đề nếu để trống'
              />
              <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                <FormSelectField
                  name='category'
                  label='Danh mục'
                  required
                  options={CATEGORY_OPTIONS}
                />
                <FormSelectField name='parent' label='Thư mục' required options={PARENT_OPTIONS} />
              </div>
              <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                <FormSelectField name='language' label='Ngôn ngữ' options={LANG_OPTIONS} />
                <FormTextField name='order' label='Thứ tự' placeholder='0' />
              </div>
              <div className='flex items-center gap-3 pt-2'>
                <form.Field name='isPublished'>
                  {(field) => (
                    <div className='flex items-center gap-2'>
                      <Switch
                        id='isPublished'
                        checked={field.state.value ?? false}
                        onCheckedChange={(checked) => field.handleChange(checked)}
                      />
                      <Label htmlFor='isPublished'>Xuất bản (Publish)</Label>
                    </div>
                  )}
                </form.Field>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='pt-6'>
              <div className='space-y-2'>
                <label className='text-sm font-medium'>Nội dung *</label>
                <TiptapEditor
                  content={contentRef.current}
                  onChange={(html) => {
                    contentRef.current = html;
                    form.setFieldValue('content', html);
                  }}
                  placeholder='Viết nội dung bài viết...'
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className='text-base'>Cấu hình SEO</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <FormTextField
                name='seoTitle'
                label='SEO Title'
                placeholder='Tiêu đề hiển thị trên kết quả tìm kiếm'
              />
              <FormTextField
                name='seoDescription'
                label='SEO Description'
                placeholder='Mô tả ngắn cho công cụ tìm kiếm'
              />
              <FormTextField
                name='seoKeywords'
                label='SEO Keywords'
                placeholder='Từ khóa, phân cách bằng dấu phẩy'
              />
            </CardContent>
          </Card>

          <div className='flex items-center justify-end gap-3'>
            <Button
              type='button'
              variant='outline'
              onClick={() => router.push('/dashboard/help-center')}
            >
              Hủy
            </Button>
            <Button type='submit' form='help-center-page-form' isLoading={isPending}>
              <Icons.check className='mr-2 h-4 w-4' />
              {isEdit ? 'Cập nhật' : 'Tạo mới'}
            </Button>
          </div>
        </form.Form>
      </form.AppForm>
    </div>
  );
}
