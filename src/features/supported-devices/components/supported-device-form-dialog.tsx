'use client';

import { useState, useRef } from 'react';
import { useAppForm, useFormFields } from '@/components/ui/tanstack-form';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createSupportedDeviceMutation,
  updateSupportedDeviceMutation,
  supportedDeviceKeys
} from '../api/queries';
import type {
  SupportedDevice,
  CreateSupportedDevicePayload,
  UpdateSupportedDevicePayload
} from '../api/types';
import { toast } from 'sonner';
import * as z from 'zod';
import {
  createSupportedDeviceSchema,
  updateSupportedDeviceSchema,
  type CreateSupportedDeviceFormValues,
  type UpdateSupportedDeviceFormValues
} from '../schemas/supported-device';
import { FormDialog } from '@/components/ui/form-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverAnchor } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command';
import { cn } from '@/lib/utils';

const DEVICE_TYPE_OPTIONS = [
  { value: 'Smart Phones', label: 'Smart Phones' },
  { value: 'Smart Watches', label: 'Smart Watches' },
  { value: 'Tablets', label: 'Tablets' },
  { value: 'Laptops', label: 'Laptops' }
];

const MANUFACTURER_SUGGESTIONS = [
  'Apple',
  'Samsung',
  'Google',
  'Xiaomi',
  'Huawei',
  'OnePlus',
  'Sony',
  'Oppo',
  'Vivo',
  'Motorola',
  'Nokia',
  'Asus',
  'Lenovo',
  'Microsoft',
  'Dell',
  'HP'
];

function CreatableManufacturerField({
  value,
  onChange
}: {
  value: string;
  onChange: (val: string) => void;
}) {
  const [open, setOpen] = useState(false);

  const filteredSuggestions = MANUFACTURER_SUGGESTIONS.filter((m) =>
    m.toLowerCase().includes(value.toLowerCase())
  );

  return (
    <div className='space-y-2'>
      <Label>Nhà sản xuất *</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverAnchor asChild>
          <div className='relative'>
            <Input
              value={value}
              onChange={(e) => {
                onChange(e.target.value);
                if (!open) setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              placeholder='Nhập hoặc chọn nhà sản xuất...'
              className='w-full'
            />
            <button
              type='button'
              onClick={() => setOpen((prev) => !prev)}
              className='absolute top-1/2 right-3 -translate-y-1/2'
              aria-label='Mở danh sách nhà sản xuất'
              tabIndex={-1}
            >
              <Icons.chevronsUpDown className='h-4 w-4 opacity-50' />
            </button>
          </div>
        </PopoverAnchor>
        <PopoverContent className='w-full p-0' align='start'>
          <Command>
            <CommandInput
              placeholder='Tìm nhà sản xuất...'
              value={value}
              onValueChange={(val) => {
                onChange(val);
              }}
            />
            <CommandList>
              <CommandEmpty>
                {value ? (
                  <div className='p-2 text-sm'>
                    Sử dụng &quot;{value}&quot; làm nhà sản xuất mới
                  </div>
                ) : (
                  'Không tìm thấy.'
                )}
              </CommandEmpty>
              <CommandGroup>
                {filteredSuggestions.map((manufacturer) => (
                  <CommandItem
                    key={manufacturer}
                    onSelect={() => {
                      onChange(manufacturer);
                      setOpen(false);
                    }}
                  >
                    <Icons.check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value === manufacturer ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    {manufacturer}
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

interface SupportedDeviceFormDialogProps {
  device?: SupportedDevice;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SupportedDeviceFormDialog({
  device,
  open,
  onOpenChange
}: SupportedDeviceFormDialogProps) {
  if (device) {
    return <EditDialog key={device.id} device={device} open={open} onOpenChange={onOpenChange} />;
  }
  return <CreateDialog open={open} onOpenChange={onOpenChange} />;
}

function CreateDialog({
  open,
  onOpenChange
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const saveAndCreateRef = useRef(false);

  const createMut = useMutation({
    ...createSupportedDeviceMutation,
    onSuccess: () => {
      toast.success('Tạo thiết bị thành công');
      queryClient.invalidateQueries({ queryKey: supportedDeviceKeys.all });
      if (saveAndCreateRef.current) {
        // Save & Create Another: reset form but keep dialog open
        form.reset();
        saveAndCreateRef.current = false;
      } else {
        onOpenChange(false);
        form.reset();
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Tạo thiết bị thất bại');
      saveAndCreateRef.current = false;
    }
  });

  const form = useAppForm({
    defaultValues: {
      device: '',
      manufacturer: '',
      type: ''
    } as CreateSupportedDeviceFormValues,
    validators: {
      onSubmit: createSupportedDeviceSchema
    },
    onSubmit: async ({ value }) => {
      const payload: CreateSupportedDevicePayload = {
        device: value.device,
        manufacturer: value.manufacturer,
        type: value.type as 'Smart Phones' | 'Smart Watches' | 'Tablets' | 'Laptops'
      };
      await createMut.mutateAsync(payload);
    }
  });

  const { FormTextField, FormSelectField } = useFormFields<CreateSupportedDeviceFormValues>();

  const handleSaveAndCreateAnother = () => {
    saveAndCreateRef.current = true;
    const formEl = document.getElementById('create-device-form') as HTMLFormElement | null;
    formEl?.requestSubmit();
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title='Thiết bị mới'
      description='Thêm một thiết bị được hỗ trợ mới.'
      formId='create-device-form'
      isLoading={createMut.isPending}
      submitLabel='Lưu'
      metaInfo={
        <div className='flex items-center gap-2 text-xs text-muted-foreground'>
          <Icons.dashboard className='h-3.5 w-3.5' />
          <span>Quản lý thiết bị</span>
        </div>
      }
      extraActions={
        <Button
          type='button'
          variant='outline'
          size='sm'
          onClick={handleSaveAndCreateAnother}
          disabled={createMut.isPending}
        >
          <Icons.add className='mr-2 h-4 w-4' />
          Lưu và tạo mới
        </Button>
      }
    >
      <form.AppForm>
        <form.Form id='create-device-form' className='space-y-5'>
          <FormTextField
            name='device'
            label='Tên thiết bị'
            required
            placeholder='iPhone 15 Pro'
            validators={{
              onBlur: z.string().min(2, 'Tên thiết bị phải có ít nhất 2 ký tự')
            }}
          />

          <form.Field name='manufacturer'>
            {(field) => (
              <CreatableManufacturerField
                value={field.state.value}
                onChange={(val) => field.handleChange(val)}
              />
            )}
          </form.Field>

          <FormSelectField
            name='type'
            label='Loại thiết bị'
            required
            options={DEVICE_TYPE_OPTIONS}
            placeholder='Chọn loại thiết bị'
          />
        </form.Form>
      </form.AppForm>
    </FormDialog>
  );
}

function EditDialog({
  device,
  open,
  onOpenChange
}: {
  device: SupportedDevice;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();

  const updateMut = useMutation({
    ...updateSupportedDeviceMutation,
    onSuccess: () => {
      toast.success('Cập nhật thiết bị thành công');
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: supportedDeviceKeys.all });
    },
    onError: (error) => toast.error(error.message || 'Cập nhật thiết bị thất bại')
  });

  const form = useAppForm({
    defaultValues: {
      device: device.device,
      manufacturer: device.manufacturer,
      type: device.type
    } as UpdateSupportedDeviceFormValues,
    validators: {
      onSubmit: updateSupportedDeviceSchema
    },
    onSubmit: async ({ value }) => {
      const payload: UpdateSupportedDevicePayload = {
        device: value.device,
        manufacturer: value.manufacturer,
        type: value.type as 'Smart Phones' | 'Smart Watches' | 'Tablets' | 'Laptops'
      };
      await updateMut.mutateAsync({ id: device.id, values: payload });
    }
  });

  const { FormTextField, FormSelectField } = useFormFields<UpdateSupportedDeviceFormValues>();

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title='Chỉnh sửa thiết bị'
      description='Cập nhật thông tin thiết bị bên dưới.'
      formId='edit-device-form'
      isLoading={updateMut.isPending}
      submitLabel='Cập nhật'
    >
      <form.AppForm>
        <form.Form id='edit-device-form' className='space-y-5'>
          <FormTextField
            name='device'
            label='Tên thiết bị'
            placeholder='iPhone 15 Pro'
            validators={{
              onBlur: z.string().min(2, 'Tên thiết bị phải có ít nhất 2 ký tự')
            }}
          />

          <form.Field name='manufacturer'>
            {(field) => (
              <CreatableManufacturerField
                value={field.state.value ?? ''}
                onChange={(val) => field.handleChange(val)}
              />
            )}
          </form.Field>

          <FormSelectField
            name='type'
            label='Loại thiết bị'
            options={DEVICE_TYPE_OPTIONS}
            placeholder='Chọn loại thiết bị'
          />
        </form.Form>
      </form.AppForm>
    </FormDialog>
  );
}

export function SupportedDeviceFormDialogTrigger() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)} size='sm'>
        <Icons.add className='mr-2 h-4 w-4' /> Thêm thiết bị
      </Button>
      <SupportedDeviceFormDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
