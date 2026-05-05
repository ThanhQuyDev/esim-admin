'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { FormDialog } from '@/components/ui/form-dialog';
import { Icons } from '@/components/icons';
import { useAppForm, useFormFields } from '@/components/ui/tanstack-form';
import { createFooterMutation, updateFooterMutation } from '../api/mutations';
import type { CreateFooterPayload, Footer, UpdateFooterPayload } from '../api/types';
import { footerSchema, type FooterFormValues } from '../schemas/footer';

interface FooterFormDialogProps {
  item?: Footer;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FooterFormDialog({ item, open, onOpenChange }: FooterFormDialogProps) {
  if (item) return <EditDialog key={item.id} item={item} open={open} onOpenChange={onOpenChange} />;
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
    ...createFooterMutation,
    onSuccess: () => {
      toast.success('Tạo footer thành công');
      onOpenChange(false);
      form.reset();
    },
    onError: (e) => toast.error(e.message || 'Thao tác thất bại')
  });

  const form = useAppForm({
    defaultValues: { title: '', titleVi: '', url: '', categories: '' } as FooterFormValues,
    validators: { onSubmit: footerSchema },
    onSubmit: async ({ value }) => {
      const payload: CreateFooterPayload = {
        title: value.title,
        titleVi: value.titleVi,
        url: value.url,
        categories: value.categories || null
      };
      await mutation.mutateAsync(payload);
    }
  });

  const { FormTextField, FormTextareaField } = useFormFields<FooterFormValues>();

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title='Footer mới'
      description='Thêm footer link cho landing page'
      formId='footer-form-dialog'
      isLoading={mutation.isPending}
      submitLabel='Tạo mới'
      metaInfo={
        <>
          <Icons.link className='h-4 w-4' />
          <span>Footer</span>
        </>
      }
    >
      <form.AppForm>
        <form.Form id='footer-form-dialog' className='space-y-6'>
          <FormTextField name='title' label='Title' placeholder='Enter default title' />
          <FormTextField
            name='titleVi'
            label='Tiêu đề tiếng Việt'
            placeholder='Nhập tiêu đề tiếng Việt'
          />
          <FormTextField name='url' label='URL' placeholder='https://...' />
          <FormTextareaField
            name='categories'
            label='Categories'
            placeholder='Nhập category (tuỳ chọn)'
          />
        </form.Form>
      </form.AppForm>
    </FormDialog>
  );
}

function EditDialog({
  item,
  open,
  onOpenChange
}: {
  item: Footer;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const mutation = useMutation({
    ...updateFooterMutation,
    onSuccess: () => {
      toast.success('Cập nhật footer thành công');
      onOpenChange(false);
    },
    onError: (e) => toast.error(e.message || 'Thao tác thất bại')
  });

  const form = useAppForm({
    defaultValues: {
      title: item.title,
      titleVi: item.titleVi,
      url: item.url,
      categories: item.categories || ''
    } as FooterFormValues,
    validators: { onSubmit: footerSchema },
    onSubmit: async ({ value }) => {
      const payload: UpdateFooterPayload = {
        title: value.title,
        titleVi: value.titleVi,
        url: value.url,
        categories: value.categories || null
      };
      await mutation.mutateAsync({ id: item.id, values: payload });
    }
  });

  const { FormTextField, FormTextareaField } = useFormFields<FooterFormValues>();

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title='Chỉnh sửa Footer'
      description='Cập nhật footer link'
      formId='footer-form-dialog'
      isLoading={mutation.isPending}
      submitLabel='Cập nhật'
      metaInfo={
        <>
          <Icons.edit className='h-4 w-4' />
          <span>ID: {item.id}</span>
        </>
      }
    >
      <form.AppForm>
        <form.Form id='footer-form-dialog' className='space-y-6'>
          <FormTextField name='title' label='Title' placeholder='Enter default title' />
          <FormTextField
            name='titleVi'
            label='Tiêu đề tiếng Việt'
            placeholder='Nhập tiêu đề tiếng Việt'
          />
          <FormTextField name='url' label='URL' placeholder='https://...' />
          <FormTextareaField
            name='categories'
            label='Categories'
            placeholder='Nhập category (tuỳ chọn)'
          />
        </form.Form>
      </form.AppForm>
    </FormDialog>
  );
}

export function FooterFormDialogTrigger() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)} size='sm'>
        <Icons.add className='mr-2 h-4 w-4' /> Thêm footer
      </Button>
      <FooterFormDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
