'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { FormDialog } from '@/components/ui/form-dialog';
import { Icons } from '@/components/icons';
import { useAppForm, useFormFields } from '@/components/ui/tanstack-form';
import { createSiteScriptMutation, updateSiteScriptMutation } from '../api/mutations';
import type { CreateSiteScriptPayload, SiteScript, UpdateSiteScriptPayload } from '../api/types';
import {
  PLACEMENT_OPTIONS,
  siteScriptSchema,
  type SiteScriptFormValues
} from '../schemas/site-script';

interface SiteScriptFormDialogProps {
  item?: SiteScript;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SiteScriptFormDialog({ item, open, onOpenChange }: SiteScriptFormDialogProps) {
  if (item) return <EditDialog key={item.id} item={item} open={open} onOpenChange={onOpenChange} />;
  return <CreateDialog open={open} onOpenChange={onOpenChange} />;
}

/** Identical for create and edit, so the fields live in one place. */
function ScriptFields() {
  const { FormTextField, FormTextareaField, FormSelectField, FormSwitchField } =
    useFormFields<SiteScriptFormValues>();

  return (
    <>
      <FormTextField
        name='name'
        label='Tên'
        placeholder='Google Analytics 4'
        description='Chỉ để anh em nhận biết trong danh sách, không xuất hiện trên web.'
      />

      <FormTextareaField
        name='content'
        label='Đoạn mã'
        placeholder='<!-- Google tag (gtag.js) -->&#10;<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXX"></script>&#10;<script>…</script>'
        description='Dán nguyên đoạn mã nhà cung cấp đưa, không sửa gì. Chèn được nhiều thẻ script trong cùng một ô — thứ tự giữ đúng như đã dán.'
        // A long tag scrolls inside the box instead of growing the dialog (#049).
        className='max-h-72 overflow-y-auto font-mono text-xs'
        rows={8}
      />

      <div className='grid grid-cols-2 gap-4'>
        <FormSelectField
          name='placement'
          label='Vị trí chèn'
          options={PLACEMENT_OPTIONS as unknown as { value: string; label: string }[]}
          placeholder='Chọn vị trí'
        />
        <FormTextField
          name='sortOrder'
          label='Thứ tự'
          type='number'
          placeholder='0'
          description='Số nhỏ chạy trước. Quan trọng khi một mã cần chạy sau mã nạp của nó.'
        />
      </div>

      <FormSwitchField
        name='isActive'
        label='Đang hoạt động'
        description='Tắt là mã biến khỏi toàn bộ website ngay, không cần deploy.'
      />
    </>
  );
}

function toPayload(value: SiteScriptFormValues): CreateSiteScriptPayload {
  return {
    name: value.name,
    content: value.content,
    placement: value.placement,
    isActive: value.isActive ?? true,
    sortOrder: value.sortOrder ? Number(value.sortOrder) : 0
  };
}

const DIALOG_NOTE =
  'Mã ở đây tự động chèn vào MỌI trang, không phải điền từng trang như trong SEO Configs.';

function CreateDialog({
  open,
  onOpenChange
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const mutation = useMutation({
    ...createSiteScriptMutation,
    onSuccess: () => {
      toast.success('Đã thêm mã script');
      onOpenChange(false);
      form.reset();
    },
    onError: (e) => toast.error(e.message || 'Thao tác thất bại')
  });

  const form = useAppForm({
    defaultValues: {
      name: '',
      content: '',
      placement: 'head',
      isActive: true,
      sortOrder: '0'
    } as SiteScriptFormValues,
    validators: { onSubmit: siteScriptSchema },
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync(toPayload(value));
    }
  });

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title='Thêm mã script toàn site'
      description={DIALOG_NOTE}
      formId='site-script-form-dialog'
      isLoading={mutation.isPending}
      submitLabel='Thêm'
      metaInfo={
        <>
          <Icons.code className='h-4 w-4' />
          <span>Script toàn site</span>
        </>
      }
    >
      <form.AppForm>
        <form.Form id='site-script-form-dialog' className='space-y-5'>
          <ScriptFields />
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
  item: SiteScript;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const mutation = useMutation({
    ...updateSiteScriptMutation,
    onSuccess: () => {
      toast.success('Đã cập nhật mã script');
      onOpenChange(false);
    },
    onError: (e) => toast.error(e.message || 'Thao tác thất bại')
  });

  const form = useAppForm({
    defaultValues: {
      name: item.name,
      content: item.content,
      placement: item.placement,
      isActive: item.isActive,
      sortOrder: String(item.sortOrder ?? 0)
    } as SiteScriptFormValues,
    validators: { onSubmit: siteScriptSchema },
    onSubmit: async ({ value }) => {
      const payload: UpdateSiteScriptPayload = toPayload(value);
      await mutation.mutateAsync({ id: item.id, values: payload });
    }
  });

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title='Sửa mã script toàn site'
      description={DIALOG_NOTE}
      formId='site-script-form-dialog'
      isLoading={mutation.isPending}
      submitLabel='Cập nhật'
      metaInfo={
        <>
          <Icons.code className='h-4 w-4' />
          <span>ID: {item.id}</span>
        </>
      }
    >
      <form.AppForm>
        <form.Form id='site-script-form-dialog' className='space-y-5'>
          <ScriptFields />
        </form.Form>
      </form.AppForm>
    </FormDialog>
  );
}

export function SiteScriptFormDialogTrigger() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)} size='sm'>
        <Icons.add className='mr-2 h-4 w-4' /> Thêm mã script
      </Button>
      <SiteScriptFormDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
