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

type MiniTagFormValues = {
  title: string;
  description: string;
  contentButton: string;
  linkUrl: string;
  titleEn: string;
  descriptionEn: string;
  contentButtonEn: string;
  linkUrlEn: string;
};

/**
 * The text fields, Vietnamese and English side by side (#059). The English
 * column is optional: an English post uses the Vietnamese text for anything
 * left empty.
 */
const TEXT_FIELDS: {
  vi: keyof MiniTagFormValues;
  en: keyof MiniTagFormValues;
  label: string;
  placeholderVi: string;
  placeholderEn: string;
}[] = [
  {
    vi: 'title',
    en: 'titleEn',
    label: 'Tiêu đề',
    placeholderVi: 'Nhập tiêu đề',
    placeholderEn: 'Title in English'
  },
  {
    vi: 'description',
    en: 'descriptionEn',
    label: 'Mô tả',
    placeholderVi: 'Nhập mô tả',
    placeholderEn: 'Description in English'
  },
  {
    vi: 'contentButton',
    en: 'contentButtonEn',
    label: 'Nội dung nút',
    placeholderVi: 'Nhập nội dung nút bấm',
    placeholderEn: 'Button text in English'
  },
  {
    vi: 'linkUrl',
    en: 'linkUrlEn',
    label: 'Link URL',
    placeholderVi: 'https://esim.vn/...',
    placeholderEn: 'https://esim.vn/en/...'
  }
];

/** An empty English field is stored as null, so the post falls back to Vietnamese. */
const english = (text: string) => text.trim() || null;

function toPayload(value: MiniTagFormValues) {
  return {
    title: value.title,
    description: value.description,
    contentButton: value.contentButton,
    linkUrl: value.linkUrl,
    titleEn: english(value.titleEn),
    descriptionEn: english(value.descriptionEn),
    contentButtonEn: english(value.contentButtonEn),
    linkUrlEn: english(value.linkUrlEn)
  };
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

function BilingualFields({
  form
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: any;
}) {
  return (
    <div className='space-y-4'>
      <div className='text-muted-foreground hidden grid-cols-2 gap-4 text-xs font-medium md:grid'>
        <span>Tiếng Việt</span>
        <span>English (bỏ trống = dùng tiếng Việt)</span>
      </div>
      {TEXT_FIELDS.map((field) => (
        <div key={field.vi} className='grid grid-cols-1 gap-4 md:grid-cols-2'>
          {(
            [
              [field.vi, `${field.label}`, field.placeholderVi],
              [field.en, `${field.label} (English)`, field.placeholderEn]
            ] as const
          ).map(([name, label, placeholder]) => (
            <form.AppField key={name} name={name}>
              {(input: { state: { value: string }; handleChange: (value: string) => void }) => (
                <div className='space-y-2'>
                  <Label>{label}</Label>
                  <Input
                    value={input.state.value}
                    onChange={(e) => input.handleChange(e.target.value)}
                    placeholder={placeholder}
                  />
                </div>
              )}
            </form.AppField>
          ))}
        </div>
      ))}
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
      linkUrl: '',
      titleEn: '',
      descriptionEn: '',
      contentButtonEn: '',
      linkUrlEn: ''
    } as MiniTagFormValues,
    onSubmit: async ({ value }) => {
      let imageUrl = '';
      if (imageFile) {
        imageUrl = await uploadToCloudinary(imageFile);
      }
      mutation.mutate({ image: imageUrl, ...toPayload(value) });
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
          <BilingualFields form={form} />
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
      linkUrl: miniTag.linkUrl ?? '',
      titleEn: miniTag.titleEn ?? '',
      descriptionEn: miniTag.descriptionEn ?? '',
      contentButtonEn: miniTag.contentButtonEn ?? '',
      linkUrlEn: miniTag.linkUrlEn ?? ''
    } as MiniTagFormValues,
    onSubmit: async ({ value }) => {
      let imageUrl = miniTag.image;
      if (imageFile) {
        imageUrl = await uploadToCloudinary(imageFile);
      }
      mutation.mutate({
        id: miniTag.id,
        values: { image: imageUrl, ...toPayload(value) }
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
          <BilingualFields form={form} />
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
