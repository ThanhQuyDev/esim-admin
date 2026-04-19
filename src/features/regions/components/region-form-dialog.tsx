'use client';

import { useState, useRef } from 'react';
import { useAppForm, useFormFields } from '@/components/ui/tanstack-form';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { useMutation } from '@tanstack/react-query';
import { createRegionMutation, updateRegionMutation } from '../api/mutations';
import { uploadToCloudinary } from '../api/service';
import type { Region, CreateRegionPayload, UpdateRegionPayload } from '../api/types';
import { toast } from 'sonner';
import * as z from 'zod';
import {
  createRegionSchema,
  updateRegionSchema,
  type CreateRegionFormValues,
  type UpdateRegionFormValues
} from '../schemas/region';
import { FormDialog } from '@/components/ui/form-dialog';

interface RegionFormDialogProps {
  region?: Region;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RegionFormDialog({ region, open, onOpenChange }: RegionFormDialogProps) {
  if (region) {
    return <EditDialog key={region.id} region={region} open={open} onOpenChange={onOpenChange} />;
  }
  return <CreateDialog open={open} onOpenChange={onOpenChange} />;
}

function ImageUploadField({
  label,
  currentUrl,
  onFileSelect,
  file
}: {
  label: string;
  currentUrl?: string | null;
  onFileSelect: (file: File | null) => void;
  file: File | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const previewUrl = file ? URL.createObjectURL(file) : currentUrl;

  return (
    <div className='space-y-2'>
      <label className='text-sm font-medium'>{label}</label>
      <div className='flex items-center gap-3'>
        {previewUrl && (
          <img
            src={previewUrl}
            alt={label}
            className='h-10 w-10 rounded-full border object-cover'
          />
        )}
        <Button type='button' variant='outline' size='sm' onClick={() => inputRef.current?.click()}>
          <Icons.upload className='mr-2 h-4 w-4' />
          {previewUrl ? 'Change' : 'Upload'}
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
          const selected = e.target.files?.[0] ?? null;
          onFileSelect(selected);
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
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const createMutation = useMutation({
    ...createRegionMutation,
    onSuccess: () => {
      toast.success('Tạo khu vực thành công');
      onOpenChange(false);
      form.reset();
      setAvatarFile(null);
    },
    onError: (error) => toast.error(error.message || 'Tạo khu vực thất bại')
  });

  const form = useAppForm({
    defaultValues: {
      name: '',
      slug: '',
      isPopular: false,
      isActive: true
    } as CreateRegionFormValues,
    validators: {
      onSubmit: createRegionSchema
    },
    onSubmit: async ({ value }) => {
      setUploading(true);
      try {
        let avatarUrl: string | undefined;

        if (avatarFile) {
          avatarUrl = await uploadToCloudinary(avatarFile);
        }

        const payload: CreateRegionPayload = {
          name: value.name,
          ...(value.slug && { slug: value.slug }),
          ...(avatarUrl && { avatarUrl }),
          isPopular: value.isPopular ?? false,
          isActive: value.isActive ?? true
        };

        await createMutation.mutateAsync(payload);
      } catch {
        toast.error('Tải ảnh lên thất bại');
      } finally {
        setUploading(false);
      }
    }
  });

  const { FormTextField, FormSwitchField } = useFormFields<CreateRegionFormValues>();

  const isPending = createMutation.isPending || uploading;

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title='Khu vực mới'
      description='Điền thông tin để tạo khu vực mới.'
      formId='region-form-dialog'
      isLoading={isPending}
      submitLabel='Tạo mới'
      metaInfo={
        <div className='flex items-center gap-2 text-xs text-muted-foreground'>
          <Icons.dashboard className='h-3.5 w-3.5' />
          <span>Quản lý khu vực</span>
        </div>
      }
    >
      <form.AppForm>
        <form.Form id='region-form-dialog' className='space-y-5'>
          <FormTextField
            name='name'
            label='Tên'
            required
            placeholder='Liên minh Châu Âu'
            validators={{
              onBlur: z.string().min(2, 'Tên phải có ít nhất 2 ký tự')
            }}
          />

          <FormTextField name='slug' label='Slug' placeholder='lien-minh-chau-au' />

          <ImageUploadField label='Ảnh đại diện' onFileSelect={setAvatarFile} file={avatarFile} />

          <div className='grid grid-cols-2 gap-4'>
            <FormSwitchField name='isPopular' label='Nổi bật' />
            <FormSwitchField name='isActive' label='Hoạt động' />
          </div>
        </form.Form>
      </form.AppForm>
    </FormDialog>
  );
}

function EditDialog({
  region,
  open,
  onOpenChange
}: {
  region: Region;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const updateMutation = useMutation({
    ...updateRegionMutation,
    onSuccess: () => {
      toast.success('Cập nhật khu vực thành công');
      onOpenChange(false);
    },
    onError: (error) => toast.error(error.message || 'Cập nhật khu vực thất bại')
  });

  const form = useAppForm({
    defaultValues: {
      name: region.name,
      slug: region.slug ?? '',
      isPopular: region.isPopular,
      isActive: region.isActive
    } as UpdateRegionFormValues,
    validators: {
      onSubmit: updateRegionSchema
    },
    onSubmit: async ({ value }) => {
      setUploading(true);
      try {
        let avatarUrl: string | undefined;

        if (avatarFile) {
          avatarUrl = await uploadToCloudinary(avatarFile);
        }

        const payload: UpdateRegionPayload = {
          name: value.name,
          slug: value.slug || undefined,
          ...(avatarUrl && { avatarUrl }),
          isPopular: value.isPopular,
          isActive: value.isActive
        };

        await updateMutation.mutateAsync({
          id: region.id,
          values: payload
        });
      } catch {
        toast.error('Tải ảnh lên thất bại');
      } finally {
        setUploading(false);
      }
    }
  });

  const { FormTextField, FormSwitchField } = useFormFields<UpdateRegionFormValues>();

  const isPending = updateMutation.isPending || uploading;

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title='Chỉnh sửa khu vực'
      description='Cập nhật thông tin khu vực bên dưới.'
      formId='region-form-dialog'
      isLoading={isPending}
      submitLabel='Cập nhật'
      metaInfo={
        <div className='flex items-center gap-2 text-xs text-muted-foreground'>
          <Icons.dashboard className='h-3.5 w-3.5' />
          <span>ID: {region.id}</span>
        </div>
      }
    >
      <form.AppForm>
        <form.Form id='region-form-dialog' className='space-y-5'>
          <FormTextField
            name='name'
            label='Tên'
            required
            placeholder='Liên minh Châu Âu'
            validators={{
              onBlur: z.string().min(2, 'Tên phải có ít nhất 2 ký tự')
            }}
          />

          <FormTextField name='slug' label='Slug' placeholder='lien-minh-chau-au' />

          <ImageUploadField
            label='Ảnh đại diện'
            currentUrl={region.avatarUrl}
            onFileSelect={setAvatarFile}
            file={avatarFile}
          />

          <div className='grid grid-cols-2 gap-4'>
            <FormSwitchField name='isPopular' label='Nổi bật' />
            <FormSwitchField name='isActive' label='Hoạt động' />
          </div>
        </form.Form>
      </form.AppForm>
    </FormDialog>
  );
}

export function RegionFormDialogTrigger() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)} size='sm'>
        <Icons.add className='mr-2 h-4 w-4' /> Thêm khu vực
      </Button>
      <RegionFormDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
