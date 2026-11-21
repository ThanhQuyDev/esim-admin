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
  NOTE_SCOPE_OPTIONS,
  manufacturerNoteFormSchema,
  type ManufacturerNoteFormValues
} from '../schemas/manufacturer-note';
import { useFormContext } from '@/components/ui/form-context';

interface Props {
  item?: ManufacturerNote;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ManufacturerNoteFormDialog({ item, open, onOpenChange }: Props) {
  if (item) return <EditDialog key={item.id} item={item} open={open} onOpenChange={onOpenChange} />;
  return <CreateDialog open={open} onOpenChange={onOpenChange} />;
}

const DIALOG_NOTE =
  'Ghi chú của một hãng hiện dưới danh sách máy của hãng đó; ghi chú của một danh mục hiện ngay dưới câu dẫn của tab đó, ở trang "Thiết bị được hỗ trợ".';

/** Identical for create and edit, so the fields live in one place. */
function NoteFields({ current }: { current?: string }) {
  const { FormTextareaField, FormSelectField, FormSwitchField, FormTextField } =
    useFormFields<ManufacturerNoteFormValues>();

  // The brands on the device list, so a note always matches its rows and nobody
  // has to type the name (#052, test round 4). An older note's brand stays
  // selectable even if no device carries it any more.
  const { data: brands } = useQuery(supportedDeviceManufacturersQueryOptions());
  const brandOptions = [...new Set([...(brands ?? []), ...(current ? [current] : [])])].map(
    (name) => ({ value: name, label: name })
  );

  // The shared context is untyped; only the scope is read here.
  const form = useFormContext() as unknown as {
    Subscribe: (props: {
      selector: (state: { values: ManufacturerNoteFormValues }) => string;
      children: (scope: string) => React.ReactNode;
    }) => React.ReactElement;
  };

  return (
    <>
      <div className='grid grid-cols-2 gap-4'>
        <FormSelectField
          name='scope'
          label='Áp dụng cho'
          options={NOTE_SCOPE_OPTIONS as unknown as { value: string; label: string }[]}
          placeholder='Chọn'
          description='Một hãng, hoặc cả một danh mục thiết bị (vd. ghi chú chung cho đồng hồ).'
        />
        <FormSelectField
          name='language'
          label='Ngôn ngữ'
          options={NOTE_LANGUAGE_OPTIONS as unknown as { value: string; label: string }[]}
          placeholder='Chọn ngôn ngữ'
        />
      </div>

      <form.Subscribe selector={(state) => state.values.scope}>
        {(scope: string) =>
          scope === 'brand' ? (
            <FormSelectField
              name='manufacturer'
              label='Hãng'
              options={brandOptions}
              placeholder='Chọn hãng'
              description='Lấy từ danh sách "Thiết bị được hỗ trợ".'
            />
          ) : null
        }
      </form.Subscribe>

      <FormTextareaField
        name='note'
        label='Nội dung ghi chú'
        placeholder='VD: iPhone bán ở Trung Quốc đại lục không hỗ trợ eSIM…'
        description='Một hãng có thể có nhiều ghi chú — mỗi ghi chú hiện thành một ô riêng dưới danh sách máy. Xuống dòng được giữ nguyên.'
      />

      <FormTextField
        name='sortOrder'
        label='Thứ tự'
        type='number'
        placeholder='0'
        description='Các ghi chú của cùng hãng xếp từ số nhỏ đến số lớn.'
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
    manufacturer: value.scope === 'brand' ? value.manufacturer.trim() : '',
    deviceType: value.scope === 'brand' ? null : value.scope,
    language: value.language,
    note: value.note,
    isActive: value.isActive ?? true,
    sortOrder: Number(value.sortOrder) || 0
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
      scope: 'brand',
      manufacturer: '',
      language: 'vi',
      note: '',
      isActive: true,
      sortOrder: '0'
    } as ManufacturerNoteFormValues,
    validators: { onSubmit: manufacturerNoteFormSchema },
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync(toPayload(value));
    }
  });

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title='Thêm ghi chú theo hãng / danh mục'
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
      scope: item.deviceType || 'brand',
      manufacturer: item.manufacturer,
      language: item.language,
      note: item.note,
      isActive: item.isActive,
      sortOrder: String(item.sortOrder ?? 0)
    } as ManufacturerNoteFormValues,
    validators: { onSubmit: manufacturerNoteFormSchema },
    onSubmit: async ({ value }) => {
      const payload: UpdateManufacturerNotePayload = toPayload(value);
      await mutation.mutateAsync({ id: item.id, values: payload });
    }
  });

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title='Sửa ghi chú theo hãng / danh mục'
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
