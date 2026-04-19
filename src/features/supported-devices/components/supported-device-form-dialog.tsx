'use client';

import { useState } from 'react';
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

const DEVICE_TYPE_OPTIONS = [
  { value: 'Smart Phones', label: 'Smart Phones' },
  { value: 'Smart Watches', label: 'Smart Watches' },
  { value: 'Tablets', label: 'Tablets' },
  { value: 'Laptops', label: 'Laptops' }
];

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

  const createMut = useMutation({
    ...createSupportedDeviceMutation,
    onSuccess: () => {
      toast.success('Tạo thiết bị thành công');
      onOpenChange(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: supportedDeviceKeys.all });
    },
    onError: (error) => toast.error(error.message || 'Tạo thiết bị thất bại')
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

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title='Thiết bị mới'
      description='Thêm một thiết bị được hỗ trợ mới.'
      formId='supported-device-form-dialog'
      isLoading={createMut.isPending}
      submitLabel='Tạo mới'
      metaInfo={
        <div className='flex items-center gap-2 text-xs text-muted-foreground'>
          <Icons.dashboard className='h-3.5 w-3.5' />
          <span>Quản lý thiết bị</span>
        </div>
      }
    >
      <form.AppForm>
        <form.Form id='supported-device-form-dialog' className='space-y-5'>
          <FormTextField
            name='device'
            label='Tên thiết bị'
            required
            placeholder='iPhone 15 Pro'
            validators={{
              onBlur: z.string().min(2, 'Tên thiết bị phải có ít nhất 2 ký tự')
            }}
          />

          <FormTextField
            name='manufacturer'
            label='Nhà sản xuất'
            required
            placeholder='Apple'
            validators={{
              onBlur: z.string().min(2, 'Tên nhà sản xuất phải có ít nhất 2 ký tự')
            }}
          />

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
      formId='supported-device-form-dialog'
      isLoading={updateMut.isPending}
      submitLabel='Cập nhật'
      metaInfo={
        <div className='flex items-center gap-2 text-xs text-muted-foreground'>
          <Icons.dashboard className='h-3.5 w-3.5' />
          <span>ID: {device.id}</span>
        </div>
      }
    >
      <form.AppForm>
        <form.Form id='supported-device-form-dialog' className='space-y-5'>
          <FormTextField
            name='device'
            label='Tên thiết bị'
            placeholder='iPhone 15 Pro'
            validators={{
              onBlur: z.string().min(2, 'Tên thiết bị phải có ít nhất 2 ký tự')
            }}
          />

          <FormTextField
            name='manufacturer'
            label='Nhà sản xuất'
            placeholder='Apple'
            validators={{
              onBlur: z.string().min(2, 'Tên nhà sản xuất phải có ít nhất 2 ký tự')
            }}
          />

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
