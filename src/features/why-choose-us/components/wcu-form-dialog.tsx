'use client';

import { useState } from 'react';
import { useAppForm, useFormFields } from '@/components/ui/tanstack-form';
import { FormDialog } from '@/components/ui/form-dialog';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { useMutation } from '@tanstack/react-query';
import { createWcuMutation, updateWcuMutation } from '../api/mutations';
import type { WhyChooseUs, CreateWhyChooseUsPayload, UpdateWhyChooseUsPayload } from '../api/types';
import { toast } from 'sonner';
import * as z from 'zod';
import { wcuSchema, type WcuFormValues } from '../schemas/wcu';

const LANG_OPTIONS = [
  { value: 'vi', label: 'Vietnamese' },
  { value: 'en', label: 'English' }
];

interface WcuFormDialogProps {
  item?: WhyChooseUs;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WcuFormDialog({ item, open, onOpenChange }: WcuFormDialogProps) {
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
    ...createWcuMutation,
    onSuccess: () => {
      toast.success('Tạo mục thành công');
      onOpenChange(false);
      form.reset();
    },
    onError: (e) => toast.error(e.message || 'Thao tác thất bại')
  });

  const form = useAppForm({
    defaultValues: {
      title: '',
      description: '',
      language: 'en',
      icon: '',
      sortOrder: '0',
      isActive: true
    } as WcuFormValues,
    validators: { onSubmit: wcuSchema },
    onSubmit: async ({ value }) => {
      const payload: CreateWhyChooseUsPayload = {
        title: value.title,
        description: value.description,
        language: value.language,
        icon: value.icon || undefined,
        sortOrder: value.sortOrder ? Number(value.sortOrder) : 0,
        isActive: value.isActive ?? true
      };
      await mutation.mutateAsync(payload);
    }
  });

  const { FormTextField, FormSelectField, FormSwitchField, FormTextareaField } =
    useFormFields<WcuFormValues>();

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title='Mục mới'
      description='Thêm mục "Tại sao chọn chúng tôi" mới'
      formId='wcu-form-dialog'
      isLoading={mutation.isPending}
      submitLabel='Tạo mới'
      metaInfo={
        <>
          <Icons.info className='h-4 w-4' />
          <span>Why Choose Us</span>
        </>
      }
    >
      <form.AppForm>
        <form.Form id='wcu-form-dialog' className='space-y-6'>
          <FormTextField
            name='title'
            label='Tiêu đề'
            required
            placeholder='Tiêu đề'
            validators={{ onBlur: z.string().min(2) }}
          />
          <FormTextareaField name='description' label='Mô tả' required placeholder='Mô tả...' />
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <FormSelectField name='language' label='Ngôn ngữ' required options={LANG_OPTIONS} />
            <FormTextField name='icon' label='Biểu tượng' placeholder='icon-name' />
          </div>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <FormTextField name='sortOrder' label='Thứ tự' placeholder='0' />
            <FormSwitchField name='isActive' label='Hoạt động' />
          </div>
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
  item: WhyChooseUs;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const mutation = useMutation({
    ...updateWcuMutation,
    onSuccess: () => {
      toast.success('Cập nhật mục thành công');
      onOpenChange(false);
    },
    onError: (e) => toast.error(e.message || 'Thao tác thất bại')
  });

  const form = useAppForm({
    defaultValues: {
      title: item.title,
      description: item.description,
      language: item.language as 'vi' | 'en',
      icon: item.icon ?? '',
      sortOrder: String(item.sortOrder ?? 0),
      isActive: item.isActive
    } as WcuFormValues,
    validators: { onSubmit: wcuSchema },
    onSubmit: async ({ value }) => {
      const payload: UpdateWhyChooseUsPayload = {
        title: value.title,
        description: value.description,
        language: value.language,
        icon: value.icon || undefined,
        sortOrder: value.sortOrder ? Number(value.sortOrder) : undefined,
        isActive: value.isActive
      };
      await mutation.mutateAsync({ id: item.id, values: payload });
    }
  });

  const { FormTextField, FormSelectField, FormSwitchField, FormTextareaField } =
    useFormFields<WcuFormValues>();

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title='Chỉnh sửa mục'
      description='Cập nhật thông tin mục'
      formId='wcu-form-dialog'
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
        <form.Form id='wcu-form-dialog' className='space-y-6'>
          <FormTextField
            name='title'
            label='Tiêu đề'
            required
            placeholder='Tiêu đề'
            validators={{ onBlur: z.string().min(2) }}
          />
          <FormTextareaField name='description' label='Mô tả' required placeholder='Mô tả...' />
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <FormSelectField name='language' label='Ngôn ngữ' required options={LANG_OPTIONS} />
            <FormTextField name='icon' label='Biểu tượng' placeholder='icon-name' />
          </div>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <FormTextField name='sortOrder' label='Thứ tự' placeholder='0' />
            <FormSwitchField name='isActive' label='Hoạt động' />
          </div>
        </form.Form>
      </form.AppForm>
    </FormDialog>
  );
}

export function WcuFormDialogTrigger() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)} size='sm'>
        <Icons.add className='mr-2 h-4 w-4' /> Thêm mục
      </Button>
      <WcuFormDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
