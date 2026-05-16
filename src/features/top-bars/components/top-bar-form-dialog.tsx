'use client';

import { useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { FormDialog } from '@/components/ui/form-dialog';
import { Icons } from '@/components/icons';
import { useAppForm, useFormFields } from '@/components/ui/tanstack-form';
import { createTopBarMutation, updateTopBarMutation } from '../api/mutations';
import { uploadToCloudinary } from '@/features/blogs/api/service';
import type { CreateTopBarPayload, TopBar, UpdateTopBarPayload } from '../api/types';
import { topBarSchema, type TopBarFormValues } from '../schemas/top-bar';
import { getFilePreviewUrl } from '@/features/landing-page/utils/file-preview';

interface TopBarFormDialogProps {
  item?: TopBar;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TopBarFormDialog({ item, open, onOpenChange }: TopBarFormDialogProps) {
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

  const mutation = useMutation({
    ...createTopBarMutation,
    onSuccess: () => {
      toast.success('Tạo top bar thành công');
      onOpenChange(false);
      form.reset();
      setIconFile(null);
    },
    onError: (e) => toast.error(e.message || 'Thao tác thất bại')
  });

  const form = useAppForm({
    defaultValues: {
      icon: '',
      title: '',
      buttonContent: '',
      language: 'en',
      url: ''
    } as TopBarFormValues,
    validators: { onSubmit: topBarSchema },
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

      const payload: CreateTopBarPayload = {
        icon,
        title: value.title,
        buttonContent: value.buttonContent,
        language: value.language,
        url: value.url
      };
      await mutation.mutateAsync(payload);
    }
  });

  const { FormTextField, FormSelectField } = useFormFields<TopBarFormValues>();

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title='Top Bar mới'
      description='Thêm top bar cho landing page'
      formId='top-bar-form-dialog'
      isLoading={mutation.isPending || uploading}
      submitLabel='Tạo mới'
      metaInfo={
        <>
          <Icons.panelLeft className='h-4 w-4' />
          <span>Top Bar</span>
        </>
      }
    >
      <form.AppForm>
        <form.Form id='top-bar-form-dialog' className='space-y-6'>
          <IconUploadField label='Icon' file={iconFile} onFileSelect={setIconFile} />
          <FormTextField
            name='icon'
            label='Icon URL / file ID (tuỳ chọn)'
            placeholder='Dán URL hoặc file ID nếu không upload'
            description='Nếu chọn file, hệ thống sẽ upload icon và dùng URL mới.'
          />
          <FormTextField name='title' label='Title' placeholder='Enter default title' />
          <FormTextField
            name='buttonContent'
            label='Button content'
            placeholder='Nhập nội dung nút'
          />
          <FormSelectField
            name='language'
            label='Ngôn ngữ'
            options={[
              { value: 'en', label: 'English' },
              { value: 'vi', label: 'Vietnamese' }
            ]}
            placeholder='Chọn ngôn ngữ'
          />
          <FormTextField name='url' label='URL' placeholder='https://...' />
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
  item: TopBar;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const mutation = useMutation({
    ...updateTopBarMutation,
    onSuccess: () => {
      toast.success('Cập nhật top bar thành công');
      onOpenChange(false);
      setIconFile(null);
    },
    onError: (e) => toast.error(e.message || 'Thao tác thất bại')
  });

  const form = useAppForm({
    defaultValues: {
      icon: getFilePreviewUrl(item.icon),
      title: item.title,
      buttonContent: item.buttonContent,
      language: item.language,
      url: item.url
    } as TopBarFormValues,
    validators: { onSubmit: topBarSchema },
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

      const payload: UpdateTopBarPayload = {
        icon,
        title: value.title,
        buttonContent: value.buttonContent,
        language: value.language,
        url: value.url
      };
      await mutation.mutateAsync({ id: item.id, values: payload });
    }
  });

  const { FormTextField, FormSelectField } = useFormFields<TopBarFormValues>();

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title='Chỉnh sửa Top Bar'
      description='Cập nhật top bar'
      formId='top-bar-form-dialog'
      isLoading={mutation.isPending || uploading}
      submitLabel='Cập nhật'
    >
      <form.AppForm>
        <form.Form id='top-bar-form-dialog' className='space-y-6'>
          <IconUploadField
            label='Icon'
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
          <FormTextField name='title' label='Title' placeholder='Enter default title' />
          <FormTextField
            name='buttonContent'
            label='Button content'
            placeholder='Nhập nội dung nút'
          />
          <FormSelectField
            name='language'
            label='Ngôn ngữ'
            options={[
              { value: 'en', label: 'English' },
              { value: 'vi', label: 'Vietnamese' }
            ]}
            placeholder='Chọn ngôn ngữ'
          />
          <FormTextField name='url' label='URL' placeholder='https://...' />
        </form.Form>
      </form.AppForm>
    </FormDialog>
  );
}

export function TopBarFormDialogTrigger() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)} size='sm'>
        <Icons.add className='mr-2 h-4 w-4' /> Thêm top bar
      </Button>
      <TopBarFormDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
