'use client';

import { useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { FormDialog } from '@/components/ui/form-dialog';
import { Icons } from '@/components/icons';
import { useAppForm, useFormFields } from '@/components/ui/tanstack-form';
import { uploadToCloudinary } from '@/features/blogs/api/service';
import { createMenuSlideMutation, updateMenuSlideMutation } from '../api/mutations';
import type { CreateMenuSlidePayload, MenuSlide, UpdateMenuSlidePayload } from '../api/types';
import {
  LANGUAGE_OPTIONS,
  MENU_KEY_OPTIONS,
  menuSlideSchema,
  type MenuSlideFormValues
} from '../schemas/menu-slide';

interface MenuSlideFormDialogProps {
  item?: MenuSlide;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MenuSlideFormDialog({ item, open, onOpenChange }: MenuSlideFormDialogProps) {
  if (item) return <EditDialog key={item.id} item={item} open={open} onOpenChange={onOpenChange} />;
  return <CreateDialog open={open} onOpenChange={onOpenChange} />;
}

/**
 * The slide image. Shown at the carousel's own 2:1 shape so what the admin
 * approves here is what the menu renders.
 */
function SlideImageField({
  currentUrl,
  file,
  onFileSelect
}: {
  currentUrl?: string;
  file: File | null;
  onFileSelect: (file: File | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const previewUrl = file ? URL.createObjectURL(file) : currentUrl;

  return (
    <div className='space-y-2'>
      {/* A heading for the upload button and preview, not a label for one
          control — the file input is hidden and driven by the button. */}
      <div className='text-sm font-medium'>Hình ảnh slide</div>
      <div className='flex items-start gap-3'>
        {previewUrl && (
          <div className='border-border/50 relative h-[75px] w-[150px] overflow-hidden rounded-lg border-2 shadow-sm'>
            <img src={previewUrl} alt='Slide preview' className='h-full w-full object-cover' />
          </div>
        )}
        <div className='flex flex-col gap-2'>
          <Button
            type='button'
            variant='outline'
            size='sm'
            onClick={() => inputRef.current?.click()}
          >
            <Icons.upload className='mr-2 h-4 w-4' />
            {previewUrl ? 'Thay đổi' : 'Tải lên'}
          </Button>
          {file && (
            <Button type='button' variant='ghost' size='sm' onClick={() => onFileSelect(null)}>
              <Icons.close className='mr-2 h-4 w-4' /> Bỏ chọn
            </Button>
          )}
        </div>
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
        Kích thước hiển thị là 300×150 (tỉ lệ 2:1). Có thể upload ảnh hoặc dán URL bên dưới.
      </p>
    </div>
  );
}

/** The fields are identical for create and edit, so they live in one place. */
function SlideFields() {
  const { FormTextField, FormTextareaField, FormSelectField, FormSwitchField } =
    useFormFields<MenuSlideFormValues>();

  return (
    <>
      <div className='grid grid-cols-2 gap-4'>
        <FormSelectField
          name='menuKey'
          label='Menu'
          options={MENU_KEY_OPTIONS as unknown as { value: string; label: string }[]}
          placeholder='Chọn menu'
        />
        <FormSelectField
          name='language'
          label='Ngôn ngữ'
          options={LANGUAGE_OPTIONS as unknown as { value: string; label: string }[]}
          placeholder='Chọn ngôn ngữ'
        />
      </div>

      <FormTextField name='title' label='Tiêu đề' placeholder='eSIM Nhật Bản' />
      <FormTextareaField
        name='description'
        label='Mô tả'
        placeholder='Dữ liệu tốc độ cao, dùng ngay khi tới sân bay'
      />
      <FormTextField name='href' label='Đường dẫn' placeholder='/esim-nhat-ban' />

      <FormTextField
        name='image'
        label='URL hình ảnh'
        placeholder='Dán URL nếu không upload'
        description='Nếu chọn file ở trên, hệ thống sẽ upload và dùng URL mới.'
      />
      <FormTextField
        name='imageAlt'
        label='Alt của hình (tuỳ chọn)'
        placeholder='Để trống nếu ảnh chỉ mang tính trang trí'
      />

      <div className='grid grid-cols-2 gap-4'>
        <FormTextField
          name='sortOrder'
          label='Thứ tự'
          type='number'
          placeholder='0'
          description='Số nhỏ hiện trước.'
        />
        <FormSwitchField
          name='isActive'
          label='Đang hiển thị'
          description='Tắt để ẩn slide mà không xoá.'
        />
      </div>
    </>
  );
}

/** Form values → API payload, including the image upload. */
async function buildPayload(
  value: MenuSlideFormValues,
  imageFile: File | null
): Promise<CreateMenuSlidePayload> {
  // An uploaded file or a pasted URL — one of them is enough (#048).
  if (!imageFile && !value.image?.trim()) {
    throw new Error('Cần có hình ảnh — upload file hoặc dán URL');
  }
  const image = imageFile ? await uploadToCloudinary(imageFile) : value.image!.trim();

  return {
    menuKey: value.menuKey,
    title: value.title,
    description: value.description,
    href: value.href,
    image,
    imageAlt: value.imageAlt || null,
    language: value.language,
    sortOrder: value.sortOrder ? Number(value.sortOrder) : 0,
    isActive: value.isActive ?? true
  };
}

function CreateDialog({
  open,
  onOpenChange
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const mutation = useMutation({
    ...createMenuSlideMutation,
    onSuccess: () => {
      toast.success('Tạo slide thành công');
      onOpenChange(false);
      form.reset();
      setImageFile(null);
    },
    onError: (e) => toast.error(e.message || 'Thao tác thất bại')
  });

  const form = useAppForm({
    defaultValues: {
      menuKey: 'product',
      title: '',
      description: '',
      href: '',
      image: '',
      imageAlt: '',
      language: 'vi',
      sortOrder: '0',
      isActive: true
    } as MenuSlideFormValues,
    validators: { onSubmit: menuSlideSchema },
    onSubmit: async ({ value }) => {
      setUploading(!!imageFile);
      let payload: CreateMenuSlidePayload;
      try {
        payload = await buildPayload(value, imageFile);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Tải hình lên thất bại');
        return;
      } finally {
        setUploading(false);
      }
      await mutation.mutateAsync(payload);
    }
  });

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title='Slide menu mới'
      description='Thêm slide cho phần chạy slide trong main menu.'
      formId='menu-slide-form-dialog'
      isLoading={mutation.isPending || uploading}
      submitLabel='Tạo mới'
      metaInfo={
        <>
          <Icons.media className='h-4 w-4' />
          <span>Slide main menu</span>
        </>
      }
    >
      <form.AppForm>
        <form.Form id='menu-slide-form-dialog' className='space-y-5'>
          <SlideImageField file={imageFile} onFileSelect={setImageFile} />
          <SlideFields />
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
  item: MenuSlide;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const mutation = useMutation({
    ...updateMenuSlideMutation,
    onSuccess: () => {
      toast.success('Cập nhật slide thành công');
      onOpenChange(false);
      setImageFile(null);
    },
    onError: (e) => toast.error(e.message || 'Thao tác thất bại')
  });

  const form = useAppForm({
    defaultValues: {
      menuKey: item.menuKey,
      title: item.title,
      description: item.description,
      href: item.href,
      image: item.image,
      imageAlt: item.imageAlt ?? '',
      language: item.language,
      sortOrder: String(item.sortOrder ?? 0),
      isActive: item.isActive
    } as MenuSlideFormValues,
    validators: { onSubmit: menuSlideSchema },
    onSubmit: async ({ value }) => {
      setUploading(!!imageFile);
      let payload: UpdateMenuSlidePayload;
      try {
        payload = await buildPayload(value, imageFile);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Tải hình lên thất bại');
        return;
      } finally {
        setUploading(false);
      }
      await mutation.mutateAsync({ id: item.id, values: payload });
    }
  });

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title='Chỉnh sửa slide menu'
      description='Cập nhật hình ảnh và nội dung của slide.'
      formId='menu-slide-form-dialog'
      isLoading={mutation.isPending || uploading}
      submitLabel='Cập nhật'
      metaInfo={
        <>
          <Icons.media className='h-4 w-4' />
          <span>ID: {item.id}</span>
        </>
      }
    >
      <form.AppForm>
        <form.Form id='menu-slide-form-dialog' className='space-y-5'>
          <SlideImageField currentUrl={item.image} file={imageFile} onFileSelect={setImageFile} />
          <SlideFields />
        </form.Form>
      </form.AppForm>
    </FormDialog>
  );
}

export function MenuSlideFormDialogTrigger() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)} size='sm'>
        <Icons.add className='mr-2 h-4 w-4' /> Thêm slide
      </Button>
      <MenuSlideFormDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
