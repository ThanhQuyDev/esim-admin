'use client';

import { useState } from 'react';
import { useAppForm, useFormFields } from '@/components/ui/tanstack-form';
import { FormDialog } from '@/components/ui/form-dialog';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { useMutation } from '@tanstack/react-query';
import { createHelpCenterMutation, updateHelpCenterMutation } from '../api/mutations';
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

interface HelpCenterFormDialogProps {
  article?: HelpCenterArticle;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HelpCenterFormDialog({ article, open, onOpenChange }: HelpCenterFormDialogProps) {
  if (article)
    return (
      <EditDialog key={article.id} article={article} open={open} onOpenChange={onOpenChange} />
    );
  return <CreateDialog open={open} onOpenChange={onOpenChange} />;
}

function CreateDialog({
  open,
  onOpenChange
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const mutation = useMutation({
    ...createHelpCenterMutation,
    onSuccess: () => {
      toast.success('Tạo bài viết thành công');
      onOpenChange(false);
      form.reset();
    },
    onError: (e) => toast.error(e.message || 'Thao tác thất bại')
  });

  const form = useAppForm({
    defaultValues: {
      title: '',
      content: '',
      order: '0',
      category: 'getting-started',
      parent: 'setting-up',
      language: 'en',
      isPopular: false
    } as HelpCenterFormValues,
    validators: { onSubmit: helpCenterSchema },
    onSubmit: async ({ value }) => {
      const lang = value.language || 'en';
      const payload: CreateHelpCenterPayload = {
        title: value.title,
        content: value.content,
        order: value.order ? Number(value.order) : 0,
        category: getCategoryApiKey(value.category, lang),
        parent: getParentApiKey(value.parent, lang),
        language: value.language || undefined,
        isPopular: value.isPopular
      };
      await mutation.mutateAsync(payload);
    }
  });

  const { FormTextField, FormSelectField, FormTextareaField } =
    useFormFields<HelpCenterFormValues>();

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title='Bài viết mới'
      description='Thêm bài viết trung tâm hỗ trợ mới'
      formId='help-center-form-dialog'
      isLoading={mutation.isPending}
      submitLabel='Tạo mới'
      metaInfo={
        <>
          <Icons.help className='h-4 w-4' />
          <span>Help Center</span>
        </>
      }
    >
      <form.AppForm>
        <form.Form id='help-center-form-dialog' className='space-y-6'>
          <FormTextField name='title' label='Tiêu đề' required placeholder='Nhập tiêu đề...' />
          <FormTextareaField
            name='content'
            label='Nội dung'
            required
            placeholder='Nhập nội dung...'
          />
          <form.Subscribe selector={(s) => s.values.language}>
            {(language) => (
              <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
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
          <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
            <FormSelectField name='language' label='Ngôn ngữ' options={LANG_OPTIONS} />
            <FormTextField name='order' label='Thứ tự' placeholder='0' />
          </div>
        </form.Form>
      </form.AppForm>
    </FormDialog>
  );
}

function EditDialog({
  article,
  open,
  onOpenChange
}: {
  article: HelpCenterArticle;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const mutation = useMutation({
    ...updateHelpCenterMutation,
    onSuccess: () => {
      toast.success('Cập nhật bài viết thành công');
      onOpenChange(false);
    },
    onError: (e) => toast.error(e.message || 'Thao tác thất bại')
  });

  const form = useAppForm({
    defaultValues: {
      title: article.title,
      content: article.content,
      order: String(article.order ?? 0),
      category: getCategoryKeyFromLabel(article.category) ?? 'getting-started',
      parent: getParentKeyFromLabel(article.parent) ?? 'setting-up',
      language: (article.language as 'vi' | 'en') ?? 'en',
      isPopular: article.isPopular ?? false
    } as HelpCenterFormValues,
    validators: { onSubmit: helpCenterSchema },
    onSubmit: async ({ value }) => {
      const lang = value.language || 'en';
      const payload: UpdateHelpCenterPayload = {
        title: value.title,
        content: value.content,
        order: value.order ? Number(value.order) : undefined,
        category: getCategoryApiKey(value.category, lang),
        parent: getParentApiKey(value.parent, lang),
        language: value.language || undefined,
        isPopular: value.isPopular
      };
      await mutation.mutateAsync({ id: article.id, values: payload });
    }
  });

  const { FormTextField, FormSelectField, FormTextareaField } =
    useFormFields<HelpCenterFormValues>();

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title='Chỉnh sửa bài viết'
      description='Cập nhật thông tin bài viết trung tâm hỗ trợ'
      formId='help-center-form-dialog'
      isLoading={mutation.isPending}
      submitLabel='Cập nhật'
      metaInfo={
        <>
          <Icons.edit className='h-4 w-4' />
          <span>ID: {article.id.slice(0, 8)}...</span>
        </>
      }
    >
      <form.AppForm>
        <form.Form id='help-center-form-dialog' className='space-y-6'>
          <FormTextField name='title' label='Tiêu đề' required placeholder='Nhập tiêu đề...' />
          <FormTextareaField
            name='content'
            label='Nội dung'
            required
            placeholder='Nhập nội dung...'
          />
          <form.Subscribe selector={(s) => s.values.language}>
            {(language) => (
              <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
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
          <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
            <FormSelectField name='language' label='Ngôn ngữ' options={LANG_OPTIONS} />
            <FormTextField name='order' label='Thứ tự' placeholder='0' />
          </div>
        </form.Form>
      </form.AppForm>
    </FormDialog>
  );
}

export function HelpCenterFormDialogTrigger() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)} size='sm'>
        <Icons.add className='mr-2 h-4 w-4' /> Thêm bài viết
      </Button>
      <HelpCenterFormDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
