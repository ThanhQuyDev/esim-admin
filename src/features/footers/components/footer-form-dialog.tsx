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

/**
 * The footer fields in two columns, English on the left and Vietnamese on the
 * right, row by row: link title, URL, column heading — then order and icon
 * (#044). Shared by the create and edit dialogs so they cannot drift apart.
 *
 * The language select is gone: every row already carries both languages, and
 * the storefront never read it.
 */
function FooterFields({
  currentIconUrl,
  iconFile,
  onIconFileSelect
}: {
  currentIconUrl: string | null;
  iconFile: File | null;
  onIconFileSelect: (f: File | null) => void;
}) {
  const { FormTextField } = useFormFields<FooterFormValues>();

  return (
    <div className='grid grid-cols-1 gap-x-6 gap-y-6 md:grid-cols-2'>
      <FormTextField name='title' label='Tiêu đề tiếng Anh' placeholder='VD: About Us' />
      <FormTextField name='titleVi' label='Tiêu đề tiếng Việt' placeholder='VD: Về chúng tôi' />

      {/* One URL per language: the English site links elsewhere (#043). */}
      <FormTextField
        name='urlEn'
        label='URL tiếng Anh'
        placeholder='https://esim.vn/en/...'
        description='Bỏ trống thì bản tiếng Anh dùng URL tiếng Việt.'
      />
      <FormTextField name='url' label='URL tiếng Việt' placeholder='https://esim.vn/...' />

      {/* The heading this link sits under. `categories` doubles as the
          grouping key, so rows that belong together must share it exactly;
          the Vietnamese heading is display-only (#088). */}
      <FormTextField
        name='categories'
        label='Tiêu đề cột tiếng Anh'
        placeholder='VD: Support'
        description='Các link cùng một tiêu đề này sẽ nằm chung một cột.'
      />
      <FormTextField
        name='categoriesVi'
        label='Tiêu đề cột tiếng Việt'
        placeholder='VD: Hỗ trợ'
        description='Bỏ trống thì bản tiếng Việt dùng tiêu đề tiếng Anh.'
      />

      <FormTextField
        name='sortOrder'
        label='Thứ tự hiển thị'
        type='number'
        placeholder='0 (số nhỏ hiển thị trước)'
      />
      <div className='hidden md:block' aria-hidden='true' />

      <IconUploadField
        label='Icon'
        currentUrl={currentIconUrl}
        onFileSelect={onIconFileSelect}
        file={iconFile}
      />
      <FormTextField
        name='iconUrl'
        label='Hoặc nhập Icon URL'
        placeholder='https://... (bỏ qua nếu đã upload)'
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
      urlEn: '',
      sortOrder: 0,
      categories: '',
      categoriesVi: '',
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
        urlEn: value.urlEn?.trim() || null,
        sortOrder: value.sortOrder,
        categories: value.categories || null,
        categoriesVi: value.categoriesVi || null,
        iconUrl
      };
      await mutation.mutateAsync(payload);
    }
  });

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
        <form.Form id='footer-form-dialog'>
          <FooterFields currentIconUrl={null} iconFile={iconFile} onIconFileSelect={setIconFile} />
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
      urlEn: item.urlEn || '',
      sortOrder: item.sortOrder ?? 0,
      categories: item.categories || '',
      categoriesVi: item.categoriesVi || '',
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
        urlEn: value.urlEn?.trim() || null,
        sortOrder: value.sortOrder,
        categories: value.categories || null,
        categoriesVi: value.categoriesVi || null,
        iconUrl
      };
      await mutation.mutateAsync({ id: item.id, values: payload });
    }
  });

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
        <form.Form id='footer-form-dialog'>
          <FooterFields
            currentIconUrl={item.iconUrl ?? null}
            iconFile={iconFile}
            onIconFileSelect={setIconFile}
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
