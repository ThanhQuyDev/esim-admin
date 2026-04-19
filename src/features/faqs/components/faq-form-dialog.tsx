'use client';

import { useState } from 'react';
import { useAppForm, useFormFields } from '@/components/ui/tanstack-form';
import { FormDialog } from '@/components/ui/form-dialog';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { useMutation } from '@tanstack/react-query';
import { createFaqMutation, updateFaqMutation } from '../api/mutations';
import type { Faq, CreateFaqPayload, UpdateFaqPayload } from '../api/types';
import { toast } from 'sonner';
import * as z from 'zod';
import { faqSchema, type FaqFormValues } from '../schemas/faq';

const LANG_OPTIONS = [
  { value: 'vi', label: 'Vietnamese' },
  { value: 'en', label: 'English' }
];

interface FaqFormDialogProps {
  faq?: Faq;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FaqFormDialog({ faq, open, onOpenChange }: FaqFormDialogProps) {
  if (faq) return <EditDialog key={faq.id} faq={faq} open={open} onOpenChange={onOpenChange} />;
  return <CreateDialog open={open} onOpenChange={onOpenChange} />;
}

function CreateDialog({
  open,
  onOpenChange
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const mutation = useMutation({
    ...createFaqMutation,
    onSuccess: () => {
      toast.success('Tạo câu hỏi thành công');
      onOpenChange(false);
      form.reset();
    },
    onError: (e) => toast.error(e.message || 'Thao tác thất bại')
  });

  const form = useAppForm({
    defaultValues: {
      question: '',
      answer: '',
      language: 'en',
      sortOrder: '0',
      isActive: true
    } as FaqFormValues,
    validators: { onSubmit: faqSchema },
    onSubmit: async ({ value }) => {
      const payload: CreateFaqPayload = {
        question: value.question,
        answer: value.answer,
        language: value.language,
        sortOrder: value.sortOrder ? Number(value.sortOrder) : 0,
        isActive: value.isActive ?? true
      };
      await mutation.mutateAsync(payload);
    }
  });

  const { FormTextField, FormSelectField, FormSwitchField, FormTextareaField } =
    useFormFields<FaqFormValues>();

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title='Câu hỏi mới'
      description='Thêm câu hỏi thường gặp mới'
      formId='faq-form-dialog'
      isLoading={mutation.isPending}
      submitLabel='Tạo mới'
      metaInfo={
        <>
          <Icons.question className='h-4 w-4' />
          <span>FAQs</span>
        </>
      }
    >
      <form.AppForm>
        <form.Form id='faq-form-dialog' className='space-y-6'>
          <FormTextField
            name='question'
            label='Câu hỏi'
            required
            placeholder='Làm thế nào để...?'
            validators={{ onBlur: z.string().min(2) }}
          />
          <FormTextareaField
            name='answer'
            label='Câu trả lời'
            required
            placeholder='Câu trả lời là...'
          />
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <FormSelectField name='language' label='Ngôn ngữ' required options={LANG_OPTIONS} />
            <FormTextField name='sortOrder' label='Thứ tự' placeholder='0' />
          </div>
          <FormSwitchField name='isActive' label='Hoạt động' />
        </form.Form>
      </form.AppForm>
    </FormDialog>
  );
}

function EditDialog({
  faq,
  open,
  onOpenChange
}: {
  faq: Faq;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const mutation = useMutation({
    ...updateFaqMutation,
    onSuccess: () => {
      toast.success('Cập nhật câu hỏi thành công');
      onOpenChange(false);
    },
    onError: (e) => toast.error(e.message || 'Thao tác thất bại')
  });

  const form = useAppForm({
    defaultValues: {
      question: faq.question,
      answer: faq.answer,
      language: faq.language as 'vi' | 'en',
      sortOrder: String(faq.sortOrder ?? 0),
      isActive: faq.isActive
    } as FaqFormValues,
    validators: { onSubmit: faqSchema },
    onSubmit: async ({ value }) => {
      const payload: UpdateFaqPayload = {
        question: value.question,
        answer: value.answer,
        language: value.language,
        sortOrder: value.sortOrder ? Number(value.sortOrder) : undefined,
        isActive: value.isActive
      };
      await mutation.mutateAsync({ id: faq.id, values: payload });
    }
  });

  const { FormTextField, FormSelectField, FormSwitchField, FormTextareaField } =
    useFormFields<FaqFormValues>();

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title='Chỉnh sửa câu hỏi'
      description='Cập nhật thông tin câu hỏi thường gặp'
      formId='faq-form-dialog'
      isLoading={mutation.isPending}
      submitLabel='Cập nhật'
      metaInfo={
        <>
          <Icons.edit className='h-4 w-4' />
          <span>ID: {faq.id}</span>
        </>
      }
    >
      <form.AppForm>
        <form.Form id='faq-form-dialog' className='space-y-6'>
          <FormTextField
            name='question'
            label='Câu hỏi'
            required
            placeholder='Làm thế nào để...?'
            validators={{ onBlur: z.string().min(2) }}
          />
          <FormTextareaField
            name='answer'
            label='Câu trả lời'
            required
            placeholder='Câu trả lời là...'
          />
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <FormSelectField name='language' label='Ngôn ngữ' required options={LANG_OPTIONS} />
            <FormTextField name='sortOrder' label='Thứ tự' placeholder='0' />
          </div>
          <FormSwitchField name='isActive' label='Hoạt động' />
        </form.Form>
      </form.AppForm>
    </FormDialog>
  );
}

export function FaqFormDialogTrigger() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)} size='sm'>
        <Icons.add className='mr-2 h-4 w-4' /> Thêm câu hỏi
      </Button>
      <FaqFormDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
