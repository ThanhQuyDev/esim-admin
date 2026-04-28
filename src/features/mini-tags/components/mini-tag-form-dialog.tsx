'use client';

import { useState, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Icons } from '@/components/icons';
import { FormDialog } from '@/components/ui/form-dialog';
import { useAppForm } from '@/components/ui/tanstack-form';
import { uploadToCloudinary } from '@/features/destinations/api/service';
import { createMiniTagMutation, updateMiniTagMutation } from '../api/mutations';
import type { MiniTag } from '../api/types';
import Image from 'next/image';

const FORM_ID = 'mini-tag-form-dialog';

interface MiniTagFormDialogProps {
  miniTag?: MiniTag;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MiniTagFormDialog({ miniTag, open, onOpenChange }: MiniTagFormDialogProps) {
  const isEdit = !!miniTag;
  return isEdit ? (
    <EditMiniTagDialog miniTag={miniTag} open={open} onOpenChange={onOpenChange} />
  ) : (
    <CreateMiniTagDialog open={open} onOpenChange={onOpenChange} />
  );
}

function ImageUploadField({
  label,
  currentUrl,
  onFileSelect,
  file
}: {
  label: string;
  currentUrl?: string;
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
            alt='preview'
            width={64}
            height={64}
            className='rounded-md border object-cover'
          />
        )}
        <Button type='button' variant='outline' size='sm' onClick={() => inputRef.current?.click()}>
          <Icons.upload className='mr-2 h-4 w-4' />
          Chọn ảnh
        </Button>
      </div>
      <input
        ref={inputRef}
        type='file'
        accept='image/*'
        className='hidden'
        onChange={(e) => {
          const f = e.target.files?.[0] ?? null;
          onFileSelect(f);
        }}
      />
    </div>
  );
}

function CreateMiniTagDialog({
  open,
  onOpenChange
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [imageFile, setImageFile] = useState<File | null>(null);

  const mutation = useMutation({
    ...createMiniTagMutation,
    onSuccess: () => {
      toast.success('Đã tạo mini tag');
      onOpenChange(false);
      setImageFile(null);
    }
  });

  const form = useAppForm({
    defaultValues: {
      title: '',
      description: '',
      contentButton: '',
      linkUrl: ''
    },
    onSubmit: async ({ value }) => {
      let imageUrl = '';
      if (imageFile) {
        imageUrl = await uploadToCloudinary(imageFile);
      }
      mutation.mutate({
        image: imageUrl,
        title: value.title,
        description: value.description,
        contentButton: value.contentButton,
        linkUrl: value.linkUrl
      });
    }
  });

  return (
    <FormDialog
      formId={FORM_ID}
      isLoading={mutation.isPending}
      submitLabel='Tạo mới'
      title='Tạo Mini Tag'
      description='Thêm mini tag mới'
      open={open}
      onOpenChange={onOpenChange}
    >
      <form.AppForm>
        <form.Form id={FORM_ID} className='space-y-4'>
          <ImageUploadField label='Ảnh' onFileSelect={setImageFile} file={imageFile} />
          <form.AppField name='title'>
            {(field) => (
              <div className='space-y-2'>
                <Label>Tiêu đề</Label>
                <Input
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder='Nhập tiêu đề'
                />
              </div>
            )}
          </form.AppField>
          <form.AppField name='description'>
            {(field) => (
              <div className='space-y-2'>
                <Label>Mô tả</Label>
                <Input
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder='Nhập mô tả'
                />
              </div>
            )}
          </form.AppField>
          <form.AppField name='contentButton'>
            {(field) => (
              <div className='space-y-2'>
                <Label>Nội dung nút</Label>
                <Input
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder='Nhập nội dung nút bấm'
                />
              </div>
            )}
          </form.AppField>
          <form.AppField name='linkUrl'>
            {(field) => (
              <div className='space-y-2'>
                <Label>Link URL</Label>
                <Input
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder='https://...'
                />
              </div>
            )}
          </form.AppField>
        </form.Form>
      </form.AppForm>
    </FormDialog>
  );
}

function EditMiniTagDialog({
  miniTag,
  open,
  onOpenChange
}: {
  miniTag: MiniTag;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [imageFile, setImageFile] = useState<File | null>(null);

  const mutation = useMutation({
    ...updateMiniTagMutation,
    onSuccess: () => {
      toast.success('Đã cập nhật mini tag');
      onOpenChange(false);
      setImageFile(null);
    }
  });

  const form = useAppForm({
    defaultValues: {
      title: miniTag.title ?? '',
      description: miniTag.description ?? '',
      contentButton: miniTag.contentButton ?? '',
      linkUrl: miniTag.linkUrl ?? ''
    },
    onSubmit: async ({ value }) => {
      let imageUrl = miniTag.image;
      if (imageFile) {
        imageUrl = await uploadToCloudinary(imageFile);
      }
      mutation.mutate({
        id: miniTag.id,
        values: {
          image: imageUrl,
          title: value.title,
          description: value.description,
          contentButton: value.contentButton,
          linkUrl: value.linkUrl
        }
      });
    }
  });

  return (
    <FormDialog
      formId={FORM_ID}
      isLoading={mutation.isPending}
      submitLabel='Cập nhật'
      title='Sửa Mini Tag'
      description='Chỉnh sửa thông tin mini tag'
      open={open}
      onOpenChange={onOpenChange}
    >
      <form.AppForm>
        <form.Form id={FORM_ID} className='space-y-4'>
          <ImageUploadField
            label='Ảnh'
            currentUrl={miniTag.image}
            onFileSelect={setImageFile}
            file={imageFile}
          />
          <form.AppField name='title'>
            {(field) => (
              <div className='space-y-2'>
                <Label>Tiêu đề</Label>
                <Input
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder='Nhập tiêu đề'
                />
              </div>
            )}
          </form.AppField>
          <form.AppField name='description'>
            {(field) => (
              <div className='space-y-2'>
                <Label>Mô tả</Label>
                <Input
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder='Nhập mô tả'
                />
              </div>
            )}
          </form.AppField>
          <form.AppField name='contentButton'>
            {(field) => (
              <div className='space-y-2'>
                <Label>Nội dung nút</Label>
                <Input
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder='Nhập nội dung nút bấm'
                />
              </div>
            )}
          </form.AppField>
          <form.AppField name='linkUrl'>
            {(field) => (
              <div className='space-y-2'>
                <Label>Link URL</Label>
                <Input
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder='https://...'
                />
              </div>
            )}
          </form.AppField>
        </form.Form>
      </form.AppForm>
    </FormDialog>
  );
}

export function MiniTagFormDialogTrigger() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <MiniTagFormDialog open={open} onOpenChange={setOpen} />
      <Button onClick={() => setOpen(true)} size='sm'>
        <Icons.add className='mr-2 h-4 w-4' /> Thêm Mini Tag
      </Button>
    </>
  );
}
