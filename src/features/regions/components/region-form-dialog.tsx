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
import { DestinationSelector } from './destination-selector';

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
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedDestinationIds, setSelectedDestinationIds] = useState<number[]>([]);

  const createMutation = useMutation({
    ...createRegionMutation,
    onSuccess: () => {
      toast.success('Tạo khu vực thành công');
      onOpenChange(false);
      form.reset();
      setAvatarFile(null);
      setIconFile(null);
      setSelectedDestinationIds([]);
    },
    onError: (error) => toast.error(error.message || 'Tạo khu vực thất bại')
  });

  const form = useAppForm({
    defaultValues: {
      name: '',
      slug: '',
      isPopular: false,
      isActive: true,
      title: '',
      titleVi: '',
      description: '',
      descriptionVi: '',
      providers: '',
      destinationIds: []
    } as CreateRegionFormValues,
    validators: {
      onSubmit: createRegionSchema
    },
    onSubmit: async ({ value }) => {
      setUploading(true);
      try {
        let avatarUrl: string | undefined;
        let iconUrl: string | undefined;

        if (avatarFile) {
          avatarUrl = await uploadToCloudinary(avatarFile);
        }
        if (iconFile) {
          iconUrl = await uploadToCloudinary(iconFile);
        }

        const payload: CreateRegionPayload = {
          name: value.name,
          ...(value.slug && { slug: value.slug }),
          ...(avatarUrl && { avatarUrl }),
          ...(iconUrl && { iconUrl }),
          isPopular: value.isPopular ?? false,
          isActive: value.isActive ?? true,
          ...(value.title && { title: value.title }),
          ...(value.titleVi && { titleVi: value.titleVi }),
          ...(value.description && { description: value.description }),
          ...(value.descriptionVi && { descriptionVi: value.descriptionVi }),
          ...(value.providers && { providers: value.providers }),
          ...(selectedDestinationIds.length > 0 && { destinationIds: selectedDestinationIds })
        };

        await createMutation.mutateAsync(payload);
      } catch {
        toast.error('Tải ảnh lên thất bại');
      } finally {
        setUploading(false);
      }
    }
  });

  const { FormTextField, FormSwitchField, FormTextareaField } =
    useFormFields<CreateRegionFormValues>();

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

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <ImageUploadField label='Ảnh đại diện' onFileSelect={setAvatarFile} file={avatarFile} />
            <ImageUploadField label='Icon' onFileSelect={setIconFile} file={iconFile} />
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <FormSwitchField name='isPopular' label='Nổi bật' />
            <FormSwitchField name='isActive' label='Hoạt động' />
          </div>

          <FormTextField name='providers' label='Providers' placeholder='Provider1, Provider2...' />

          <DestinationSelector
            selectedIds={selectedDestinationIds}
            onChange={setSelectedDestinationIds}
          />

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <FormTextField name='title' label='Tiêu đề (EN)' placeholder='Title in English' />
            <FormTextField name='titleVi' label='Tiêu đề (VI)' placeholder='Tiêu đề tiếng Việt' />
          </div>

          <FormTextareaField
            name='description'
            label='Mô tả (EN)'
            placeholder='Mô tả tiếng Anh...'
          />

          <FormTextareaField
            name='descriptionVi'
            label='Mô tả (VI)'
            placeholder='Mô tả tiếng Việt...'
          />
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
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedDestinationIds, setSelectedDestinationIds] = useState<number[]>(
    region.destinations?.map((d) => d.id) ?? []
  );

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
      isActive: region.isActive,
      title: region.title ?? '',
      titleVi: region.titleVi ?? '',
      description: region.description ?? '',
      descriptionVi: region.descriptionVi ?? '',
      providers: region.providers ?? '',
      destinationIds: region.destinations?.map((d) => d.id) ?? []
    } as UpdateRegionFormValues,
    validators: {
      onSubmit: updateRegionSchema
    },
    onSubmit: async ({ value }) => {
      setUploading(true);
      try {
        let avatarUrl: string | undefined;
        let iconUrl: string | undefined;

        if (avatarFile) {
          avatarUrl = await uploadToCloudinary(avatarFile);
        }
        if (iconFile) {
          iconUrl = await uploadToCloudinary(iconFile);
        }

        const payload: UpdateRegionPayload = {
          name: value.name,
          slug: value.slug || undefined,
          ...(avatarUrl && { avatarUrl }),
          ...(iconUrl && { iconUrl }),
          isPopular: value.isPopular,
          isActive: value.isActive,
          title: value.title || undefined,
          titleVi: value.titleVi || undefined,
          description: value.description || undefined,
          descriptionVi: value.descriptionVi || undefined,
          providers: value.providers || undefined,
          destinationIds: selectedDestinationIds
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

  const { FormTextField, FormSwitchField, FormTextareaField } =
    useFormFields<UpdateRegionFormValues>();

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

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <ImageUploadField
              label='Ảnh đại diện'
              currentUrl={region.avatarUrl}
              onFileSelect={setAvatarFile}
              file={avatarFile}
            />
            <ImageUploadField
              label='Icon'
              currentUrl={region.iconUrl}
              onFileSelect={setIconFile}
              file={iconFile}
            />
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <FormSwitchField name='isPopular' label='Nổi bật' />
            <FormSwitchField name='isActive' label='Hoạt động' />
          </div>

          <FormTextField name='providers' label='Providers' placeholder='Provider1, Provider2...' />

          <DestinationSelector
            selectedIds={selectedDestinationIds}
            onChange={setSelectedDestinationIds}
            initialDestinations={region.destinations}
          />

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <FormTextField name='title' label='Tiêu đề (EN)' placeholder='Title in English' />
            <FormTextField name='titleVi' label='Tiêu đề (VI)' placeholder='Tiêu đề tiếng Việt' />
          </div>

          <FormTextareaField
            name='description'
            label='Mô tả (EN)'
            placeholder='Mô tả tiếng Anh...'
          />

          <FormTextareaField
            name='descriptionVi'
            label='Mô tả (VI)'
            placeholder='Mô tả tiếng Việt...'
          />
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
