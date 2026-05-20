'use client';
import { useRef, useState } from 'react';
import { useAppForm, useFormFields } from '@/components/ui/tanstack-form';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet';
import { Icons } from '@/components/icons';
import { useMutation } from '@tanstack/react-query';
import { createWcuMutation, updateWcuMutation } from '../api/mutations';
import type { WhyChooseUs, CreateWhyChooseUsPayload, UpdateWhyChooseUsPayload } from '../api/types';
import { toast } from 'sonner';
import * as z from 'zod';
import {
  wcuSchema,
  WCU_TYPE_OPTIONS,
  parseWcuTypeString,
  serializeWcuType,
  type WcuFormValues
} from '../schemas/wcu';
import { uploadToCloudinary } from '@/features/blogs/api/service';
import { getFilePreviewUrl } from '@/features/landing-page/utils/file-preview';
import { MinimalTiptapEditor } from '@/components/minimal-tiptap-editor';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

const LANG_OPTIONS = [
  { value: 'vi', label: 'Vietnamese' },
  { value: 'en', label: 'English' }
];

function TypesField({ value, onChange }: { value: string[]; onChange: (value: string[]) => void }) {
  return (
    <div className='space-y-2'>
      <label className='text-sm font-medium'>Loại hiển thị</label>
      <ToggleGroup
        type='multiple'
        variant='outline'
        size='sm'
        value={value}
        onValueChange={onChange}
        className='flex w-full flex-wrap justify-start gap-2'
      >
        {WCU_TYPE_OPTIONS.map((opt) => (
          <ToggleGroupItem
            key={opt.value}
            value={opt.value}
            aria-label={opt.label}
            className='!rounded-md !border data-[state=on]:!border-primary data-[state=on]:!bg-primary/10 data-[state=on]:!text-primary'
          >
            {opt.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <p className='text-muted-foreground text-xs'>
        Có thể chọn nhiều, hoặc không chọn để hiển thị mặc định.
      </p>
    </div>
  );
}

interface WcuFormSheetProps {
  item?: WhyChooseUs;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WcuFormSheet({ item, open, onOpenChange }: WcuFormSheetProps) {
  if (item) return <EditSheet key={item.id} item={item} open={open} onOpenChange={onOpenChange} />;
  return <CreateSheet open={open} onOpenChange={onOpenChange} />;
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

function CreateSheet({
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
      isActive: true,
      type: []
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
        isActive: value.isActive ?? true,
        type: serializeWcuType(value.type)
      };
      await mutation.mutateAsync(payload);
    }
  });
  const { FormTextField, FormSelectField, FormSwitchField } = useFormFields<WcuFormValues>();
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='flex flex-col'>
        <SheetHeader>
          <SheetTitle>Mục mới</SheetTitle>
          <SheetDescription>Thêm mục "Tại sao chọn chúng tôi" mới.</SheetDescription>
        </SheetHeader>
        <div className='flex-1 overflow-auto'>
          <form.AppForm>
            <form.Form id='wcu-form-sheet' className='space-y-4'>
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
              <div className='grid grid-cols-2 gap-4'>
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
              <div className='grid grid-cols-2 gap-4'>
                <FormTextField name='sortOrder' label='Thứ tự' placeholder='0' />
                <FormSwitchField name='isActive' label='Hoạt động' />
              </div>
              <form.Field name='type'>
                {(field) => (
                  <TypesField
                    value={(field.state.value as string[] | undefined) ?? []}
                    onChange={(v) => field.handleChange(v as WcuFormValues['type'])}
                  />
                )}
              </form.Field>
            </form.Form>
          </form.AppForm>
        </div>
        <SheetFooter>
          <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button type='submit' form='wcu-form-sheet' isLoading={mutation.isPending || uploading}>
            <Icons.check /> Tạo mới
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function EditSheet({
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
      isActive: item.isActive,
      type: parseWcuTypeString(item.type)
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
        isActive: value.isActive,
        type: serializeWcuType(value.type) ?? ''
      };
      await mutation.mutateAsync({ id: item.id, values: payload });
    }
  });
  const { FormTextField, FormSelectField, FormSwitchField } = useFormFields<WcuFormValues>();
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='flex flex-col'>
        <SheetHeader>
          <SheetTitle>Chỉnh sửa mục</SheetTitle>
          <SheetDescription>Cập nhật thông tin mục.</SheetDescription>
        </SheetHeader>
        <div className='flex-1 overflow-auto'>
          <form.AppForm>
            <form.Form id='wcu-form-sheet' className='space-y-4'>
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
              <div className='grid grid-cols-2 gap-4'>
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
              <div className='grid grid-cols-2 gap-4'>
                <FormTextField name='sortOrder' label='Thứ tự' placeholder='0' />
                <FormSwitchField name='isActive' label='Hoạt động' />
              </div>
              <form.Field name='type'>
                {(field) => (
                  <TypesField
                    value={(field.state.value as string[] | undefined) ?? []}
                    onChange={(v) => field.handleChange(v as WcuFormValues['type'])}
                  />
                )}
              </form.Field>
            </form.Form>
          </form.AppForm>
        </div>
        <SheetFooter>
          <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button type='submit' form='wcu-form-sheet' isLoading={mutation.isPending || uploading}>
            <Icons.check /> Cập nhật
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export function WcuFormSheetTrigger() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)} size='sm'>
        <Icons.add className='mr-2 h-4 w-4' /> Thêm mục
      </Button>
      <WcuFormSheet open={open} onOpenChange={setOpen} />
    </>
  );
}
