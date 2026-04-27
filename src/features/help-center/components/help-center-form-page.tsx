'use client';

import { useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAppForm, useFormFields } from '@/components/ui/tanstack-form';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { useMutation } from '@tanstack/react-query';
import { createHelpCenterMutation, updateHelpCenterMutation } from '../api/mutations';
import type {
  HelpCenterArticle,
  CreateHelpCenterPayload,
  UpdateHelpCenterPayload
} from '../api/types';
import { CATEGORY_OPTIONS, PARENT_OPTIONS } from '../api/types';
import { toast } from 'sonner';
import { helpCenterSchema, type HelpCenterFormValues } from '../schemas/help-center';
import { TiptapEditor } from '@/components/tiptap-editor';
import { Card, CardContent } from '@/components/ui/card';

interface HelpCenterFormPageProps {
  article?: HelpCenterArticle;
}

export function HelpCenterFormPage({ article }: HelpCenterFormPageProps) {
  const router = useRouter();
  const contentRef = useRef(article?.content ?? '');
  const isEdit = !!article;

  const createMut = useMutation({
    ...createHelpCenterMutation,
    onSuccess: () => {
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
      parent: article?.parent ?? 'setting_up'
    } as HelpCenterFormValues,
    validators: { onSubmit: helpCenterSchema },
    onSubmit: async ({ value }) => {
      if (isEdit) {
        const payload: UpdateHelpCenterPayload = {
          title: value.title,
          content: contentRef.current || value.content,
          order: value.order ? Number(value.order) : undefined,
          category: value.category,
          parent: value.parent
        };
        await updateMut.mutateAsync({ id: article.id, values: payload });
      } else {
        const payload: CreateHelpCenterPayload = {
          title: value.title,
          content: contentRef.current || value.content,
          order: value.order ? Number(value.order) : 0,
          category: value.category,
          parent: value.parent
        };
        await createMut.mutateAsync(payload);
      }
    }
  });

  const { FormTextField, FormSelectField } = useFormFields<HelpCenterFormValues>();
  const isPending = createMut.isPending || updateMut.isPending;

  return (
    <div className='mx-auto w-full max-w-5xl space-y-6'>
      <form.AppForm>
        <form.Form id='help-center-page-form' className='space-y-6'>
          <Card>
            <CardContent className='space-y-4 pt-6'>
              <FormTextField name='title' label='Tiêu đề' required placeholder='Nhập tiêu đề...' />
              <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
                <FormSelectField
                  name='category'
                  label='Danh mục'
                  required
                  options={CATEGORY_OPTIONS}
                />
                <FormSelectField name='parent' label='Thư mục' required options={PARENT_OPTIONS} />
                <FormTextField name='order' label='Thứ tự' placeholder='0' />
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
