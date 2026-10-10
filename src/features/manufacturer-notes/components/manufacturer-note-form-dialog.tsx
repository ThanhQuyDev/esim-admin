'use client';

import { useQuery } from '@tanstack/react-query';
import { supportedDeviceManufacturersQueryOptions } from '@/features/supported-devices/api/queries';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { FormDialog } from '@/components/ui/form-dialog';
import { Icons } from '@/components/icons';
import { useAppForm, useFormFields } from '@/components/ui/tanstack-form';
import { createManufacturerNoteMutation, updateManufacturerNoteMutation } from '../api/mutations';
import type {
  CreateManufacturerNotePayload,
  ManufacturerNote,
  UpdateManufacturerNotePayload
} from '../api/types';
import {
  NOTE_LANGUAGE_OPTIONS,
  manufacturerNoteSchema,
  type ManufacturerNoteFormValues
} from '../schemas/manufacturer-note';

interface Props {
  item?: ManufacturerNote;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ManufacturerNoteFormDialog({ item, open, onOpenChange }: Props) {
  if (item) return <EditDialog key={item.id} item={item} open={open} onOpenChange={onOpenChange} />;
  return <CreateDialog open={open} onOpenChange={onOpenChange} />;
}

const DIALOG_NOTE = 'Ghi chú hiện dưới danh sách máy của hãng đó, ở trang "Thiết bị được hỗ trợ".';

/** Identical for create and edit, so the fields live in one place. */
function NoteFields({ current }: { current?: string }) {
  const { FormTextareaField, FormSelectField, FormSwitchField } =
    useFormFields<ManufacturerNoteFormValues>();

  // The brands on the device list, so a note always matches its rows and nobody
  // has to type the name (#052, test round 4). An older note's brand stays
  // selectable even if no device carries it any more.
  const { data: brands } = useQuery(supportedDeviceManufacturersQueryOptions());
  const brandOptions = [...new Set([...(brands ?? []), ...(current ? [current] : [])])].map(
    (name) => ({ value: name, label: name })
  );

  return (
    <>
      <div className='grid grid-cols-2 gap-4'>
        <FormSelectField
          name='manufacturer'
          label='Hãng'
          options={brandOptions}
          placeholder='Chọn hãng'
          description='Lấy từ danh sách "Thiết bị được hỗ trợ". Mỗi hãng một ghi chú cho mỗi ngôn ngữ.'
        />
        <FormSelectField
          name='language'
          label='Ngôn ngữ'
          options={NOTE_LANGUAGE_OPTIONS as unknown as { value: string; label: string }[]}
          placeholder='Chọn ngôn ngữ'
        />
      </div>

      <FormTextareaField
        name='note'
        label='Nội dung ghi chú'
        placeholder='VD: iPhone bán ở Trung Quốc đại lục không hỗ trợ eSIM…'
        description='Mỗi hãng một ghi chú cho mỗi ngôn ngữ.'
      />

      <FormSwitchField
        name='isActive'
        label='Đang hiển thị'
        description='Tắt để ẩn ghi chú mà không xoá nội dung.'
      />
    </>
  );
}

function toPayload(value: ManufacturerNoteFormValues): CreateManufacturerNotePayload {
  return {
    manufacturer: value.manufacturer.trim(),
    language: value.language,
    note: value.note,
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
  const mutation = useMutation({
    ...createManufacturerNoteMutation,
    onSuccess: () => {
      toast.success('Đã thêm ghi chú');
      onOpenChange(false);
      form.reset();
    },
    onError: (e) => toast.error(e.message || 'Thao tác thất bại')
  });

  const form = useAppForm({
    defaultValues: {
      manufacturer: '',
      language: 'vi',
      note: '',
      isActive: true
    } as ManufacturerNoteFormValues,
    validators: { onSubmit: manufacturerNoteSchema },
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync(toPayload(value));
    }
  });

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title='Thêm ghi chú theo hãng'
      description={DIALOG_NOTE}
      formId='manufacturer-note-form-dialog'
      isLoading={mutation.isPending}
      submitLabel='Thêm'
      metaInfo={
        <>
          <Icons.phone className='h-4 w-4' />
          <span>Ghi chú thiết bị</span>
        </>
      }
    >
      <form.AppForm>
        <form.Form id='manufacturer-note-form-dialog' className='space-y-5'>
          <NoteFields />
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
  item: ManufacturerNote;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const mutation = useMutation({
    ...updateManufacturerNoteMutation,
    onSuccess: () => {
      toast.success('Đã cập nhật ghi chú');
      onOpenChange(false);
    },
    onError: (e) => toast.error(e.message || 'Thao tác thất bại')
  });

  const form = useAppForm({
    defaultValues: {
      manufacturer: item.manufacturer,
      language: item.language,
      note: item.note,
      isActive: item.isActive
    } as ManufacturerNoteFormValues,
    validators: { onSubmit: manufacturerNoteSchema },
    onSubmit: async ({ value }) => {
      const payload: UpdateManufacturerNotePayload = toPayload(value);
      await mutation.mutateAsync({ id: item.id, values: payload });
    }
  });

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title='Sửa ghi chú theo hãng'
      description={DIALOG_NOTE}
      formId='manufacturer-note-form-dialog'
      isLoading={mutation.isPending}
      submitLabel='Cập nhật'
      metaInfo={
        <>
          <Icons.phone className='h-4 w-4' />
          <span>ID: {item.id}</span>
        </>
      }
    >
      <form.AppForm>
        <form.Form id='manufacturer-note-form-dialog' className='space-y-5'>
          <NoteFields current={item.manufacturer} />
        </form.Form>
      </form.AppForm>
    </FormDialog>
  );
}

export function ManufacturerNoteFormDialogTrigger() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)} size='sm'>
        <Icons.add className='mr-2 h-4 w-4' /> Thêm ghi chú
      </Button>
      <ManufacturerNoteFormDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
