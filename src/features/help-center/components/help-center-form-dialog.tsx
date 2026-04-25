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
import { CATEGORY_OPTIONS, PARENT_OPTIONS } from '../api/types';
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
      category: 'getting_started',
      parent: 'setting_up'
    } as HelpCenterFormValues,
    validators: { onSubmit: helpCenterSchema },
    onSubmit: async ({ value }) => {
      const payload: CreateHelpCenterPayload = {
        title: value.title,
        content: value.content,
        order: value.order ? Number(value.order) : 0,
        category: value.category,
        parent: value.parent
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
          <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
            <FormSelectField name='category' label='Danh mục' required options={CATEGORY_OPTIONS} />
            <FormSelectField name='parent' label='Thư mục' required options={PARENT_OPTIONS} />
          </div>
          <FormTextField name='order' label='Thứ tự' placeholder='0' />
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
      category: article.category,
      parent: article.parent
    } as HelpCenterFormValues,
    validators: { onSubmit: helpCenterSchema },
    onSubmit: async ({ value }) => {
      const payload: UpdateHelpCenterPayload = {
        title: value.title,
        content: value.content,
        order: value.order ? Number(value.order) : undefined,
        category: value.category,
        parent: value.parent
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
          <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
            <FormSelectField name='category' label='Danh mục' required options={CATEGORY_OPTIONS} />
            <FormSelectField name='parent' label='Thư mục' required options={PARENT_OPTIONS} />
          </div>
          <FormTextField name='order' label='Thứ tự' placeholder='0' />
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
