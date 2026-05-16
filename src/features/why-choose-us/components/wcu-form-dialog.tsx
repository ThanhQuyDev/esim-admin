'use client';

import { useRef, useState } from 'react';
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
import { uploadToCloudinary } from '@/features/blogs/api/service';
import { getFilePreviewUrl } from '@/features/landing-page/utils/file-preview';
import { MinimalTiptapEditor } from '@/components/minimal-tiptap-editor';

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

function IconUploadField({
  label,
  currentUrl,
  file,
  onFileSelect
}: {
  label: string;
  currentUrl?: string;
  file: File | null;
  onFileSelect: (file: File | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const previewUrl = file ? URL.createObjectURL(file) : currentUrl;

  return (
    <div className='space-y-2'>
      <label className='text-sm font-medium'>{label}</label>
      <div className='flex items-center gap-3'>
        {previewUrl && (
          <div className='relative h-12 w-12 overflow-hidden rounded-lg border-2 border-border/50 shadow-sm'>
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
        onChange={(event) => {
          onFileSelect(event.target.files?.[0] ?? null);
          event.target.value = '';
        }}
      />
      <p className='text-muted-foreground text-xs'>
        Chọn icon để upload hoặc nhập URL/file ID bên dưới.
      </p>
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
  const [uploading, setUploading] = useState(false);
  const descriptionRef = useRef('');

  const mutation = useMutation({
    ...createWcuMutation,
    onSuccess: () => {
      toast.success('Tạo mục thành công');
      onOpenChange(false);
      form.reset();
      setIconFile(null);
      descriptionRef.current = '';
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
      let icon = value.icon || undefined;

      if (iconFile) {
        setUploading(true);
        try {
          icon = await uploadToCloudinary(iconFile);
        } catch (error) {
          toast.error(error instanceof Error ? error.message : 'Tải icon lên thất bại');
          return;
        } finally {
          setUploading(false);
        }
      }

      const payload: CreateWhyChooseUsPayload = {
        title: value.title,
        description: descriptionRef.current || value.description,
        language: value.language,
        icon: icon || undefined,
        sortOrder: value.sortOrder ? Number(value.sortOrder) : 0,
        isActive: value.isActive ?? true
      };
      await mutation.mutateAsync(payload);
    }
  });

  const { FormTextField, FormSelectField, FormSwitchField } = useFormFields<WcuFormValues>();

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title='Mục mới'
      description='Thêm mục "Tại sao chọn chúng tôi" mới'
      formId='wcu-form-dialog'
      isLoading={mutation.isPending || uploading}
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
          <div className='space-y-2'>
            <label className='text-sm font-medium'>
              Mô tả <span className='text-destructive'>*</span>
            </label>
            <MinimalTiptapEditor
              content={descriptionRef.current}
              onChange={(html) => {
                descriptionRef.current = html;
                form.setFieldValue('description', html);
              }}
              placeholder='Nhập mô tả...'
            />
          </div>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <FormSelectField name='language' label='Ngôn ngữ' required options={LANG_OPTIONS} />
            <div>
              <IconUploadField label='Biểu tượng' file={iconFile} onFileSelect={setIconFile} />
              <FormTextField
                name='icon'
                label='Icon URL / file ID (tuỳ chọn)'
                placeholder='Dán URL hoặc file ID nếu không upload'
                description='Nếu chọn file, hệ thống sẽ upload icon và dùng URL mới.'
              />
            </div>
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
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const descriptionRef = useRef(item.description);

  const mutation = useMutation({
    ...updateWcuMutation,
    onSuccess: () => {
      toast.success('Cập nhật mục thành công');
      onOpenChange(false);
      setIconFile(null);
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
      let icon = value.icon || undefined;

      if (iconFile) {
        setUploading(true);
        try {
          icon = await uploadToCloudinary(iconFile);
        } catch (error) {
          toast.error(error instanceof Error ? error.message : 'Tải icon lên thất bại');
          return;
        } finally {
          setUploading(false);
        }
      }

      const payload: UpdateWhyChooseUsPayload = {
        title: value.title,
        description: descriptionRef.current || value.description,
        language: value.language,
        icon: icon || undefined,
        sortOrder: value.sortOrder ? Number(value.sortOrder) : undefined,
        isActive: value.isActive
      };
      await mutation.mutateAsync({ id: item.id, values: payload });
    }
  });

  const { FormTextField, FormSelectField, FormSwitchField } = useFormFields<WcuFormValues>();

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title='Chỉnh sửa mục'
      description='Cập nhật thông tin mục'
      formId='wcu-form-dialog'
      isLoading={mutation.isPending || uploading}
      submitLabel='Cập nhật'
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
          <div className='space-y-2'>
            <label className='text-sm font-medium'>
              Mô tả <span className='text-destructive'>*</span>
            </label>
            <MinimalTiptapEditor
              content={descriptionRef.current}
              onChange={(html) => {
                descriptionRef.current = html;
                form.setFieldValue('description', html);
              }}
              placeholder='Nhập mô tả...'
            />
          </div>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <FormSelectField name='language' label='Ngôn ngữ' required options={LANG_OPTIONS} />
            <div>
              <IconUploadField
                label='Biểu tượng'
                currentUrl={getFilePreviewUrl(item.icon)}
                file={iconFile}
                onFileSelect={setIconFile}
              />
              <FormTextField
                name='icon'
                label='Icon URL / file ID (tuỳ chọn)'
                placeholder='Dán URL hoặc file ID nếu không upload'
                description='Nếu chọn file, hệ thống sẽ upload icon và dùng URL mới.'
              />
            </div>
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
