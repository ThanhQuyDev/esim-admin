'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAppForm, useFormFields } from '@/components/ui/tanstack-form';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useMutation, useQuery } from '@tanstack/react-query';
import { createHelpCenterMutation, updateHelpCenterMutation } from '../api/mutations';
import { uploadToCloudinary } from '@/features/blogs/api/service';
import { createSeoConfig, updateSeoConfig } from '@/features/seo-configs/api/service';
import { seoConfigByUrlQueryOptions } from '@/features/seo-configs/api/queries';
import type {
  HelpCenterArticle,
  CreateHelpCenterPayload,
  UpdateHelpCenterPayload
} from '../api/types';
import {
  getCategoryOptions,
  getParentOptions,
  getCategoryApiKey,
  getParentApiKey,
  getCategoryKeyFromLabel,
  getParentKeyFromLabel,
  LANG_OPTIONS
} from '../api/types';
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

/**
 * Build the canonical SEO URL for a help-center article.
 *
 * Correct URL shapes (no category/parent segments, no `/vi/` prefix):
 *   English:     /en/help-center/{slug}
 *   Vietnamese:  /ho-tro/{slug}
 */
function buildHelpCenterSeoUrl(args: { language?: string | null; slug?: string | null }): string {
  const isVi = args.language === 'vi';
  const basePath = isVi ? 'ho-tro' : 'help-center';
  const cleanSlug = (args.slug ?? '').replace(/^\/+|\/+$/g, '');
  // Vietnamese uses the localized base path directly (no locale segment);
  // English keeps the /en/ locale segment.
  return isVi ? `/${basePath}/${cleanSlug}` : `/en/${basePath}/${cleanSlug}`;
}

export function HelpCenterFormPage({ article }: HelpCenterFormPageProps) {
  const router = useRouter();
  const contentRef = useRef(article?.content ?? '');
  const isEdit = !!article;

  // Look up an existing SEO config for this article (edit mode only).
  // Fall back to a slug derived from the title so we still query when the
  // backend stored the article without a slug field.
  const seoUrlForLookup = article
    ? buildHelpCenterSeoUrl({
        language: article.language,
        slug: article.slug || generateSlug(article.title)
      })
    : '';
  const { data: existingSeo } = useQuery(seoConfigByUrlQueryOptions(seoUrlForLookup));

  const syncSeoConfig = async (value: HelpCenterFormValues, slug: string) => {
    if (!value.seoTitle && !value.seoDescription && !value.seoKeywords) return;
    try {
      const seoUrl = buildHelpCenterSeoUrl({
        language: value.language,
        slug
      });
      const seoPayload = {
        url: seoUrl,
        metaTitle: value.seoTitle || value.title,
        metaDescription: value.seoDescription || '',
        metaKeywords: value.seoKeywords || '',
        isActive: true
      };
      if (existingSeo?.id) {
        await updateSeoConfig(existingSeo.id, seoPayload);
      } else {
        await createSeoConfig(seoPayload);
      }
    } catch {
      // SEO sync is best-effort, don't block the main save
    }
  };

  const goBackToListing = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/dashboard/help-center');
    }
  };

  const createMut = useMutation({
    ...createHelpCenterMutation,
    onSuccess: (_data, variables) => {
      toast.success('Tạo bài viết thành công');
      goBackToListing();
    },
    onError: (e) => toast.error(e.message || 'Tạo bài viết thất bại')
  });

  const updateMut = useMutation({
    ...updateHelpCenterMutation,
    onSuccess: () => {
      toast.success('Cập nhật bài viết thành công');
      goBackToListing();
    },
    onError: (e) => toast.error(e.message || 'Cập nhật bài viết thất bại')
  });

  const form = useAppForm({
    defaultValues: {
      title: article?.title ?? '',
      content: article?.content ?? '',
      order: String(article?.order ?? 0),
      category: article
        ? (getCategoryKeyFromLabel(article.category) ?? 'getting-started')
        : 'getting-started',
      parent: article ? (getParentKeyFromLabel(article.parent) ?? 'setting-up') : 'setting-up',
      language: (article?.language as 'vi' | 'en') ?? 'en',
      slug: article?.slug ?? '',
      isPublished: article?.isPublished ?? false,
      isPopular: article?.isPopular ?? false,
      seoTitle: article?.seoTitle ?? '',
      seoDescription: article?.seoDescription ?? '',
      seoKeywords: article?.seoKeywords ?? ''
    } as HelpCenterFormValues,
    validators: { onSubmit: helpCenterSchema },
    onSubmit: async ({ value }) => {
      const slug = value.slug || generateSlug(value.title);
      const lang = value.language || 'en';
      const apiCategory = getCategoryApiKey(value.category, lang);
      const apiParent = getParentApiKey(value.parent, lang);
      if (isEdit) {
        const payload: UpdateHelpCenterPayload = {
          title: value.title,
          content: contentRef.current || value.content,
          order: value.order ? Number(value.order) : undefined,
          category: apiCategory,
          parent: apiParent,
          language: value.language || undefined,
          slug,
          isPublished: value.isPublished,
          isPopular: value.isPopular,
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
          category: apiCategory,
          parent: apiParent,
          language: value.language || undefined,
          slug,
          isPublished: value.isPublished,
          isPopular: value.isPopular,
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

  // Hydrate SEO fields from the looked-up SEO config when editing.
  // The SEO config record is the source of truth, so it overwrites the
  // article-level seo* fields whenever a matching record is found.
  useEffect(() => {
    if (!existingSeo) return;
    form.setFieldValue('seoTitle', existingSeo.metaTitle ?? '');
    form.setFieldValue('seoDescription', existingSeo.metaDescription ?? '');
    form.setFieldValue('seoKeywords', existingSeo.metaKeywords ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingSeo?.id]);

  return (
    <div className='mx-auto w-full max-w-5xl space-y-6'>
      <form.AppForm>
        <form.Form id='help-center-page-form' className='space-y-6'>
          <Card>
            <CardContent className='space-y-4 pt-6'>
              <FormTextField name='title' label='Tiêu đề' required placeholder='Nhập tiêu đề...' />
              <FormTextField
                name='slug'
                label='Slug (URL)'
                placeholder='Tự động tạo từ tiêu đề nếu để trống'
              />
              <form.Subscribe selector={(s) => s.values.language}>
                {(language) => (
                  <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                    <FormSelectField
                      name='category'
                      label='Danh mục'
                      required
                      options={getCategoryOptions(language)}
                    />
                    <FormSelectField
                      name='parent'
                      label='Thư mục'
                      required
                      options={getParentOptions(language)}
                    />
                  </div>
                )}
              </form.Subscribe>
              <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                <FormSelectField name='language' label='Ngôn ngữ' options={LANG_OPTIONS} />
                <FormTextField name='order' label='Thứ tự' placeholder='0' />
              </div>
              <div className='flex flex-wrap items-center gap-6 pt-2'>
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
                <form.Field name='isPopular'>
                  {(field) => (
                    <div className='flex items-center gap-2'>
                      <Switch
                        id='isPopular'
                        checked={field.state.value ?? false}
                        onCheckedChange={(checked) => field.handleChange(checked)}
                      />
                      <Label htmlFor='isPopular'>Phổ biến (Popular)</Label>
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
                  onImageUpload={uploadToCloudinary}
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
            <Button type='button' variant='outline' onClick={goBackToListing}>
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
