'use client';

import { useState, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { FormDialog } from '@/components/ui/form-dialog';
import { Icons } from '@/components/icons';
import { useAppForm, useFormFields } from '@/components/ui/tanstack-form';
import { uploadToCloudinary } from '@/features/destinations/api/service';
import { createFooterMutation, updateFooterMutation } from '../api/mutations';
import type { CreateFooterPayload, Footer, UpdateFooterPayload } from '../api/types';
import { footerSchema, type FooterFormValues } from '../schemas/footer';
import Image from 'next/image';

const LANG_OPTIONS = [
  { value: 'vi', label: 'Tiếng Việt' },
  { value: 'en', label: 'English' }
];

interface FooterFormDialogProps {
  item?: Footer;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FooterFormDialog({ item, open, onOpenChange }: FooterFormDialogProps) {
  if (item) return <EditDialog key={item.id} item={item} open={open} onOpenChange={onOpenChange} />;
  return <CreateDialog open={open} onOpenChange={onOpenChange} />;
}

function IconUploadField({
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
      <Label>{label}</Label>
      <div className='flex items-center gap-3'>
        {previewUrl && (
          <Image
            src={previewUrl}
            alt='icon preview'
            width={32}
            height={32}
            className='rounded-md border object-cover'
          />
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

function CreateDialog({
  open,
  onOpenChange
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [iconFile, setIconFile] = useState<File | null>(null);

  const mutation = useMutation({
    ...createFooterMutation,
    onSuccess: () => {
      toast.success('Tạo footer thành công');
      onOpenChange(false);
      form.reset();
      setIconFile(null);
    },
    onError: (e) => toast.error(e.message || 'Thao tác thất bại')
  });

  const form = useAppForm({
    defaultValues: {
      title: '',
      titleVi: '',
      url: '',
      language: 'en',
      categories: '',
      iconUrl: ''
    } as FooterFormValues,
    validators: { onSubmit: footerSchema },
    onSubmit: async ({ value }) => {
      let iconUrl: string | null = value.iconUrl || null;
      if (iconFile) {
        iconUrl = await uploadToCloudinary(iconFile);
      }
      const payload: CreateFooterPayload = {
        title: value.title,
        titleVi: value.titleVi,
        url: value.url,
        language: value.language,
        categories: value.categories || null,
        iconUrl
      };
      await mutation.mutateAsync(payload);
    }
  });

  const { FormTextField, FormTextareaField, FormSelectField } = useFormFields<FooterFormValues>();

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
          <FormSelectField
            name='language'
            label='Ngôn ngữ'
            placeholder='Chọn ngôn ngữ'
            options={LANG_OPTIONS}
          />
          <FormTextareaField
            name='categories'
            label='Categories'
            placeholder='Nhập category (tuỳ chọn)'
          />
          <IconUploadField
            label='Icon'
            currentUrl={null}
            onFileSelect={setIconFile}
            file={iconFile}
          />
          <FormTextField
            name='iconUrl'
            label='Hoặc nhập Icon URL'
            placeholder='https://... (bỏ qua nếu đã upload)'
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
  const [iconFile, setIconFile] = useState<File | null>(null);

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
      language: item.language || 'en',
      categories: item.categories || '',
      iconUrl: item.iconUrl || ''
    } as FooterFormValues,
    validators: { onSubmit: footerSchema },
    onSubmit: async ({ value }) => {
      let iconUrl: string | null = value.iconUrl || item.iconUrl || null;
      if (iconFile) {
        iconUrl = await uploadToCloudinary(iconFile);
      }
      const payload: UpdateFooterPayload = {
        title: value.title,
        titleVi: value.titleVi,
        url: value.url,
        language: value.language,
        categories: value.categories || null,
        iconUrl
      };
      await mutation.mutateAsync({ id: item.id, values: payload });
    }
  });

  const { FormTextField, FormTextareaField, FormSelectField } = useFormFields<FooterFormValues>();

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title='Chỉnh sửa Footer'
      description='Cập nhật footer link'
      formId='footer-form-dialog'
      isLoading={mutation.isPending}
      submitLabel='Cập nhật'
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
          <FormSelectField
            name='language'
            label='Ngôn ngữ'
            placeholder='Chọn ngôn ngữ'
            options={LANG_OPTIONS}
          />
          <FormTextareaField
            name='categories'
            label='Categories'
            placeholder='Nhập category (tuỳ chọn)'
          />
          <IconUploadField
            label='Icon'
            currentUrl={item.iconUrl}
            onFileSelect={setIconFile}
            file={iconFile}
          />
          <FormTextField
            name='iconUrl'
            label='Hoặc nhập Icon URL'
            placeholder='https://... (bỏ qua nếu đã upload)'
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
