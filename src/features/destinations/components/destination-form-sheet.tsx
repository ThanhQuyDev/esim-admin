'use client';

import { useState, useRef } from 'react';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import { useMutation, useQuery } from '@tanstack/react-query';
import { createDestinationMutation, updateDestinationMutation } from '../api/mutations';
import { uploadToCloudinary, getDestinations } from '../api/service';
import type { Destination, CreateDestinationPayload, UpdateDestinationPayload } from '../api/types';
import { toast } from 'sonner';
import * as z from 'zod';
import {
  createDestinationSchema,
  updateDestinationSchema,
  type CreateDestinationFormValues,
  type UpdateDestinationFormValues
} from '../schemas/destination';

interface DestinationFormSheetProps {
  destination?: Destination;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DestinationFormSheet({
  destination,
  open,
  onOpenChange
}: DestinationFormSheetProps) {
  const isEdit = !!destination;

  if (isEdit) {
    return (
      <EditDestinationSheet
        key={destination.id}
        destination={destination}
        open={open}
        onOpenChange={onOpenChange}
      />
    );
  }

  return <CreateDestinationSheet open={open} onOpenChange={onOpenChange} />;
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
          <img src={previewUrl} alt={label} className='h-10 w-14 rounded border object-cover' />
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

function useDestinationOptions() {
  const { data } = useQuery({
    queryKey: ['destinations', 'countries-for-select'],
    queryFn: () =>
      getDestinations({
        page: 1,
        limit: 1000,
        filters: JSON.stringify({ parentId: null })
      })
  });
  return (data?.data ?? []).map((d) => ({
    value: String(d.id),
    label: `${d.name} (${d.countryCode})`
  }));
}

function SearchableCountrySelect({
  value,
  onChange,
  options,
  placeholder = 'Select country...'
}: {
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <div className='space-y-2'>
      <label className='text-sm font-medium'>Điểm đến cha</label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type='button'
            variant='outline'
            role='combobox'
            aria-expanded={open}
            className='w-full justify-between font-normal'
          >
            {selected ? selected.label : placeholder}
            <Icons.chevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
          </Button>
        </PopoverTrigger>
        <PopoverContent className='w-full p-0' align='start'>
          <Command>
            <CommandInput placeholder='Tìm quốc gia...' />
            <CommandList>
              <CommandEmpty>Không tìm thấy quốc gia.</CommandEmpty>
              <CommandGroup>
                <CommandItem
                  value='__none__'
                  onSelect={() => {
                    onChange('');
                    setOpen(false);
                  }}
                >
                  <Icons.check
                    className={cn('mr-2 h-4 w-4', !value ? 'opacity-100' : 'opacity-0')}
                  />
                  Không có
                </CommandItem>
                {options.map((opt) => (
                  <CommandItem
                    key={opt.value}
                    value={opt.label}
                    onSelect={() => {
                      onChange(opt.value);
                      setOpen(false);
                    }}
                  >
                    <Icons.check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value === opt.value ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    {opt.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

function CreateDestinationSheet({
  open,
  onOpenChange
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [flagFile, setFlagFile] = useState<File | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const parentOptions = useDestinationOptions();

  const createMutation = useMutation({
    ...createDestinationMutation,
    onSuccess: () => {
      toast.success('Tạo điểm đến thành công');
      onOpenChange(false);
      form.reset();
      setFlagFile(null);
      setAvatarFile(null);
    },
    onError: (error) => toast.error(error.message || 'Tạo điểm đến thất bại')
  });

  const form = useAppForm({
    defaultValues: {
      name: '',
      countryCode: '',
      slug: '',
      parentId: '',
      keySearch: '',
      isPopular: false,
      isActive: true,
      description: ''
    } as CreateDestinationFormValues,
    validators: {
      onSubmit: createDestinationSchema
    },
    onSubmit: async ({ value }) => {
      setUploading(true);
      try {
        let flagUrl: string | undefined;
        let avatarUrl: string | undefined;

        if (flagFile) {
          flagUrl = await uploadToCloudinary(flagFile);
        }
        if (avatarFile) {
          avatarUrl = await uploadToCloudinary(avatarFile);
        }

        const payload: CreateDestinationPayload = {
          name: value.name,
          countryCode: value.countryCode,
          ...(value.slug && { slug: value.slug }),
          ...(value.parentId && { parentId: Number(value.parentId) }),
          ...(flagUrl && { flagUrl }),
          ...(avatarUrl && { avatarUrl }),
          ...(value.keySearch && { keySearch: value.keySearch }),
          isPopular: value.isPopular ?? false,
          isActive: value.isActive ?? true,
          ...(value.description && { description: value.description })
        };

        await createMutation.mutateAsync(payload);
      } catch {
        toast.error('Tải ảnh lên thất bại');
      } finally {
        setUploading(false);
      }
    }
  });

  const { FormTextField, FormSelectField, FormSwitchField, FormTextareaField } =
    useFormFields<CreateDestinationFormValues>();

  const isPending = createMutation.isPending || uploading;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='flex flex-col'>
        <SheetHeader>
          <SheetTitle>Điểm đến mới</SheetTitle>
          <SheetDescription>Điền thông tin để tạo điểm đến mới.</SheetDescription>
        </SheetHeader>

        <div className='flex-1 overflow-auto'>
          <form.AppForm>
            <form.Form id='destination-form-sheet' className='space-y-4'>
              <FormTextField
                name='name'
                label='Tên'
                required
                placeholder='Nhật Bản'
                validators={{
                  onBlur: z.string().min(2, 'Tên phải có ít nhất 2 ký tự')
                }}
              />

              <div className='grid grid-cols-2 gap-4'>
                <FormTextField
                  name='countryCode'
                  label='Mã quốc gia'
                  required
                  placeholder='JP'
                  validators={{
                    onBlur: z.string().min(2, 'Phải có 2-3 ký tự').max(3, 'Phải có 2-3 ký tự')
                  }}
                />
                <FormTextField name='slug' label='Slug' placeholder='nhat-ban' />
              </div>

              <SearchableCountrySelect
                value={form.getFieldValue('parentId') ?? ''}
                onChange={(val) => form.setFieldValue('parentId', val)}
                options={parentOptions}
              />

              <FormTextField
                name='keySearch'
                label='Từ khóa tìm kiếm'
                placeholder='japan nippon tokyo'
              />

              <ImageUploadField label='Ảnh cờ' onFileSelect={setFlagFile} file={flagFile} />

              <ImageUploadField
                label='Ảnh đại diện'
                onFileSelect={setAvatarFile}
                file={avatarFile}
              />

              <div className='grid grid-cols-2 gap-4'>
                <FormSwitchField name='isPopular' label='Nổi bật' />
                <FormSwitchField name='isActive' label='Hoạt động' />
              </div>

              <FormTextareaField name='description' label='Mô tả' placeholder='Mô tả tùy chọn...' />
            </form.Form>
          </form.AppForm>
        </div>

        <SheetFooter>
          <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button type='submit' form='destination-form-sheet' isLoading={isPending}>
            <Icons.check /> Tạo mới
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function EditDestinationSheet({
  destination,
  open,
  onOpenChange
}: {
  destination: Destination;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [flagFile, setFlagFile] = useState<File | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const parentOptions = useDestinationOptions();

  const updateMutation = useMutation({
    ...updateDestinationMutation,
    onSuccess: () => {
      toast.success('Cập nhật điểm đến thành công');
      onOpenChange(false);
    },
    onError: (error) => toast.error(error.message || 'Cập nhật điểm đến thất bại')
  });

  const form = useAppForm({
    defaultValues: {
      name: destination.name,
      countryCode: destination.countryCode,
      slug: destination.slug ?? '',
      parentId: destination.parentId ? String(destination.parentId) : '',
      keySearch: destination.keySearch ?? '',
      isPopular: destination.isPopular,
      isActive: destination.isActive,
      description: destination.description ?? ''
    } as UpdateDestinationFormValues,
    validators: {
      onSubmit: updateDestinationSchema
    },
    onSubmit: async ({ value }) => {
      setUploading(true);
      try {
        let flagUrl: string | undefined;
        let avatarUrl: string | undefined;

        if (flagFile) {
          flagUrl = await uploadToCloudinary(flagFile);
        }
        if (avatarFile) {
          avatarUrl = await uploadToCloudinary(avatarFile);
        }

        const payload: UpdateDestinationPayload = {
          name: value.name,
          countryCode: value.countryCode,
          slug: value.slug || undefined,
          parentId: value.parentId ? Number(value.parentId) : null,
          ...(flagUrl && { flagUrl }),
          ...(avatarUrl && { avatarUrl }),
          keySearch: value.keySearch || undefined,
          isPopular: value.isPopular,
          isActive: value.isActive,
          description: value.description || undefined
        };

        await updateMutation.mutateAsync({
          id: destination.id,
          values: payload
        });
      } catch {
        toast.error('Tải ảnh lên thất bại');
      } finally {
        setUploading(false);
      }
    }
  });

  const { FormTextField, FormSelectField, FormSwitchField, FormTextareaField } =
    useFormFields<UpdateDestinationFormValues>();

  const isPending = updateMutation.isPending || uploading;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='flex flex-col'>
        <SheetHeader>
          <SheetTitle>Chỉnh sửa điểm đến</SheetTitle>
          <SheetDescription>Cập nhật thông tin điểm đến bên dưới.</SheetDescription>
        </SheetHeader>

        <div className='flex-1 overflow-auto'>
          <form.AppForm>
            <form.Form id='destination-form-sheet' className='space-y-4'>
              <FormTextField
                name='name'
                label='Tên'
                required
                placeholder='Nhật Bản'
                validators={{
                  onBlur: z.string().min(2, 'Tên phải có ít nhất 2 ký tự')
                }}
              />

              <div className='grid grid-cols-2 gap-4'>
                <FormTextField
                  name='countryCode'
                  label='Mã quốc gia'
                  required
                  placeholder='JP'
                  validators={{
                    onBlur: z.string().min(2, 'Phải có 2-3 ký tự').max(3, 'Phải có 2-3 ký tự')
                  }}
                />
                <FormTextField name='slug' label='Slug' placeholder='nhat-ban' />
              </div>

              <SearchableCountrySelect
                value={form.getFieldValue('parentId') ?? ''}
                onChange={(val) => form.setFieldValue('parentId', val)}
                options={parentOptions}
              />

              <FormTextField
                name='keySearch'
                label='Từ khóa tìm kiếm'
                placeholder='japan nippon tokyo'
              />

              <ImageUploadField
                label='Ảnh cờ'
                currentUrl={destination.flagUrl}
                onFileSelect={setFlagFile}
                file={flagFile}
              />

              <ImageUploadField
                label='Ảnh đại diện'
                currentUrl={destination.avatarUrl}
                onFileSelect={setAvatarFile}
                file={avatarFile}
              />

              <div className='grid grid-cols-2 gap-4'>
                <FormSwitchField name='isPopular' label='Nổi bật' />
                <FormSwitchField name='isActive' label='Hoạt động' />
              </div>

              <FormTextareaField name='description' label='Mô tả' placeholder='Mô tả tùy chọn...' />
            </form.Form>
          </form.AppForm>
        </div>

        <SheetFooter>
          <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button type='submit' form='destination-form-sheet' isLoading={isPending}>
            <Icons.check /> Cập nhật
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export function DestinationFormSheetTrigger() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)} size='sm'>
        <Icons.add className='mr-2 h-4 w-4' /> Thêm điểm đến
      </Button>
      <DestinationFormSheet open={open} onOpenChange={setOpen} />
    </>
  );
}
