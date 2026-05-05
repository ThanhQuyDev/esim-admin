'use client';

import { useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { FormDialog } from '@/components/ui/form-dialog';
import { Icons } from '@/components/icons';
import { useAppForm, useFormFields } from '@/components/ui/tanstack-form';
import { createHeroBannerMutation, updateHeroBannerMutation } from '../api/mutations';
import { uploadToCloudinary } from '@/features/blogs/api/service';
import type { CreateHeroBannerPayload, HeroBanner, UpdateHeroBannerPayload } from '../api/types';
import { heroBannerSchema, type HeroBannerFormValues } from '../schemas/hero-banner';

interface HeroBannerFormDialogProps {
  item?: HeroBanner;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HeroBannerFormDialog({ item, open, onOpenChange }: HeroBannerFormDialogProps) {
  if (item) {
    return <EditDialog key={item.id} item={item} open={open} onOpenChange={onOpenChange} />;
  }
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
  const [firstIconFile, setFirstIconFile] = useState<File | null>(null);
  const [secondIconFile, setSecondIconFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const mutation = useMutation({
    ...createHeroBannerMutation,
    onSuccess: () => {
      toast.success('Tạo hero banner thành công');
      onOpenChange(false);
      form.reset();
      setFirstIconFile(null);
      setSecondIconFile(null);
    },
    onError: (e) => toast.error(e.message || 'Thao tác thất bại')
  });

  const form = useAppForm({
    defaultValues: {
      title: '',
      firstIcon: '',
      firstContent: '',
      secondIcon: '',
      secondContent: '',
      description: '',
      language: 'en',
      active: true
    } as HeroBannerFormValues,
    validators: { onSubmit: heroBannerSchema },
    onSubmit: async ({ value }) => {
      let firstIcon = value.firstIcon;
      let secondIcon = value.secondIcon;

      if (firstIconFile || secondIconFile) {
        setUploading(true);
        try {
          if (firstIconFile) firstIcon = await uploadToCloudinary(firstIconFile);
          if (secondIconFile) secondIcon = await uploadToCloudinary(secondIconFile);
        } catch (error) {
          toast.error(error instanceof Error ? error.message : 'Tải icon lên thất bại');
          return;
        } finally {
          setUploading(false);
        }
      }

      const payload: CreateHeroBannerPayload = {
        title: value.title,
        firstIcon: firstIcon ?? '',
        firstContent: value.firstContent,
        secondIcon: secondIcon ?? '',
        secondContent: value.secondContent,
        description: value.description,
        language: value.language,
        active: value.active ?? true
      };
      await mutation.mutateAsync(payload);
    }
  });

  const { FormTextField, FormSelectField, FormSwitchField } = useFormFields<HeroBannerFormValues>();

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title='Hero Banner mới'
      description='Thêm hero banner cho landing page'
      formId='hero-banner-form-dialog'
      isLoading={mutation.isPending || uploading}
      submitLabel='Tạo mới'
      metaInfo={
        <>
          <Icons.media className='h-4 w-4' />
          <span>Hero Banner</span>
        </>
      }
    >
      <form.AppForm>
        <form.Form id='hero-banner-form-dialog' className='space-y-6'>
          <FormTextField name='title' label='Tiêu đề' placeholder='Nhập tiêu đề' />
          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-4'>
              <IconUploadField
                label='First Icon'
                file={firstIconFile}
                onFileSelect={setFirstIconFile}
              />
              <FormTextField
                name='firstIcon'
                label='First Icon URL/file ID (tuỳ chọn)'
                placeholder='URL hoặc file ID'
              />
            </div>
            <FormTextField
              name='firstContent'
              label='First Content'
              placeholder='Nội dung thứ nhất'
            />
          </div>
          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-4'>
              <IconUploadField
                label='Second Icon'
                file={secondIconFile}
                onFileSelect={setSecondIconFile}
              />
              <FormTextField
                name='secondIcon'
                label='Second Icon URL/file ID (tuỳ chọn)'
                placeholder='URL hoặc file ID'
              />
            </div>
            <FormTextField
              name='secondContent'
              label='Second Content'
              placeholder='Nội dung thứ hai'
            />
          </div>
          <FormTextField name='description' label='Mô tả' placeholder='Nhập mô tả' />
          <FormSelectField
            name='language'
            label='Ngôn ngữ'
            options={[
              { value: 'en', label: 'English' },
              { value: 'vi', label: 'Vietnamese' }
            ]}
            placeholder='Chọn ngôn ngữ'
          />
          <FormSwitchField name='active' label='Hoạt động' />
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
  item: HeroBanner;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [firstIconFile, setFirstIconFile] = useState<File | null>(null);
  const [secondIconFile, setSecondIconFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const mutation = useMutation({
    ...updateHeroBannerMutation,
    onSuccess: () => {
      toast.success('Cập nhật hero banner thành công');
      onOpenChange(false);
      setFirstIconFile(null);
      setSecondIconFile(null);
    },
    onError: (e) => toast.error(e.message || 'Thao tác thất bại')
  });

  const form = useAppForm({
    defaultValues: {
      title: item.title,
      firstIcon: item.firstIcon,
      firstContent: item.firstContent,
      secondIcon: item.secondIcon,
      secondContent: item.secondContent,
      description: item.description,
      language: item.language,
      active: item.active
    } as HeroBannerFormValues,
    validators: { onSubmit: heroBannerSchema },
    onSubmit: async ({ value }) => {
      let firstIcon = value.firstIcon;
      let secondIcon = value.secondIcon;

      if (firstIconFile || secondIconFile) {
        setUploading(true);
        try {
          if (firstIconFile) firstIcon = await uploadToCloudinary(firstIconFile);
          if (secondIconFile) secondIcon = await uploadToCloudinary(secondIconFile);
        } catch (error) {
          toast.error(error instanceof Error ? error.message : 'Tải icon lên thất bại');
          return;
        } finally {
          setUploading(false);
        }
      }

      const payload: UpdateHeroBannerPayload = {
        title: value.title,
        firstIcon,
        firstContent: value.firstContent,
        secondIcon,
        secondContent: value.secondContent,
        description: value.description,
        language: value.language,
        active: value.active ?? false
      };
      await mutation.mutateAsync({ id: item.id, values: payload });
    }
  });

  const { FormTextField, FormSelectField, FormSwitchField } = useFormFields<HeroBannerFormValues>();

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title='Chỉnh sửa Hero Banner'
      description='Cập nhật hero banner'
      formId='hero-banner-form-dialog'
      isLoading={mutation.isPending || uploading}
      submitLabel='Cập nhật'
      metaInfo={
        <>
          <Icons.edit className='h-4 w-4' />
          <span>ID: {item.id}</span>
        </>
      }
    >
      <form.AppForm>
        <form.Form id='hero-banner-form-dialog' className='space-y-6'>
          <FormTextField name='title' label='Tiêu đề' placeholder='Nhập tiêu đề' />
          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-4'>
              <IconUploadField
                label='First Icon'
                currentUrl={item.firstIcon}
                file={firstIconFile}
                onFileSelect={setFirstIconFile}
              />
              <FormTextField
                name='firstIcon'
                label='First Icon URL/file ID (tuỳ chọn)'
                placeholder='URL hoặc file ID'
              />
            </div>
            <FormTextField
              name='firstContent'
              label='First Content'
              placeholder='Nội dung thứ nhất'
            />
          </div>
          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-4'>
              <IconUploadField
                label='Second Icon'
                currentUrl={item.secondIcon}
                file={secondIconFile}
                onFileSelect={setSecondIconFile}
              />
              <FormTextField
                name='secondIcon'
                label='Second Icon URL/file ID (tuỳ chọn)'
                placeholder='URL hoặc file ID'
              />
            </div>
            <FormTextField
              name='secondContent'
              label='Second Content'
              placeholder='Nội dung thứ hai'
            />
          </div>
          <FormTextField name='description' label='Mô tả' placeholder='Nhập mô tả' />
          <FormSelectField
            name='language'
            label='Ngôn ngữ'
            options={[
              { value: 'en', label: 'English' },
              { value: 'vi', label: 'Vietnamese' }
            ]}
            placeholder='Chọn ngôn ngữ'
          />
          <FormSwitchField name='active' label='Hoạt động' />
        </form.Form>
      </form.AppForm>
    </FormDialog>
  );
}

export function HeroBannerFormDialogTrigger() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)} size='sm'>
        <Icons.add className='mr-2 h-4 w-4' /> Thêm hero banner
      </Button>
      <HeroBannerFormDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
