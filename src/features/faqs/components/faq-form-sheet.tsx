'use client';
import { useState } from 'react';
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
import { createFaqMutation, updateFaqMutation } from '../api/mutations';
import type { Faq, CreateFaqPayload, UpdateFaqPayload } from '../api/types';
import { toast } from 'sonner';
import * as z from 'zod';
import { faqSchema, type FaqFormValues } from '../schemas/faq';

const LANG_OPTIONS = [
  { value: 'vi', label: 'Vietnamese' },
  { value: 'en', label: 'English' }
];

interface FaqFormSheetProps {
  faq?: Faq;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FaqFormSheet({ faq, open, onOpenChange }: FaqFormSheetProps) {
  if (faq) return <EditSheet key={faq.id} faq={faq} open={open} onOpenChange={onOpenChange} />;
  return <CreateSheet open={open} onOpenChange={onOpenChange} />;
}

function CreateSheet({
  open,
  onOpenChange
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const mutation = useMutation({
    ...createFaqMutation,
    onSuccess: () => {
      toast.success('FAQ created');
      onOpenChange(false);
      form.reset();
    },
    onError: (e) => toast.error(e.message || 'Failed')
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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='flex flex-col'>
        <SheetHeader>
          <SheetTitle>New FAQ</SheetTitle>
          <SheetDescription>Add a new FAQ.</SheetDescription>
        </SheetHeader>
        <div className='flex-1 overflow-auto'>
          <form.AppForm>
            <form.Form id='faq-form-sheet' className='space-y-4'>
              <FormTextField
                name='question'
                label='Question'
                required
                placeholder='How do I...?'
                validators={{ onBlur: z.string().min(2) }}
              />
              <FormTextareaField
                name='answer'
                label='Answer'
                required
                placeholder='The answer is...'
              />
              <div className='grid grid-cols-2 gap-4'>
                <FormSelectField name='language' label='Language' required options={LANG_OPTIONS} />
                <FormTextField name='sortOrder' label='Sort Order' placeholder='0' />
              </div>
              <FormSwitchField name='isActive' label='Active' />
            </form.Form>
          </form.AppForm>
        </div>
        <SheetFooter>
          <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type='submit' form='faq-form-sheet' isLoading={mutation.isPending}>
            <Icons.check /> Create
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function EditSheet({
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
      toast.success('FAQ updated');
      onOpenChange(false);
    },
    onError: (e) => toast.error(e.message || 'Failed')
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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='flex flex-col'>
        <SheetHeader>
          <SheetTitle>Edit FAQ</SheetTitle>
          <SheetDescription>Update the FAQ.</SheetDescription>
        </SheetHeader>
        <div className='flex-1 overflow-auto'>
          <form.AppForm>
            <form.Form id='faq-form-sheet' className='space-y-4'>
              <FormTextField
                name='question'
                label='Question'
                required
                placeholder='How do I...?'
                validators={{ onBlur: z.string().min(2) }}
              />
              <FormTextareaField
                name='answer'
                label='Answer'
                required
                placeholder='The answer is...'
              />
              <div className='grid grid-cols-2 gap-4'>
                <FormSelectField name='language' label='Language' required options={LANG_OPTIONS} />
                <FormTextField name='sortOrder' label='Sort Order' placeholder='0' />
              </div>
              <FormSwitchField name='isActive' label='Active' />
            </form.Form>
          </form.AppForm>
        </div>
        <SheetFooter>
          <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type='submit' form='faq-form-sheet' isLoading={mutation.isPending}>
            <Icons.check /> Update
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export function FaqFormSheetTrigger() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)} size='sm'>
        <Icons.add className='mr-2 h-4 w-4' /> Add FAQ
      </Button>
      <FaqFormSheet open={open} onOpenChange={setOpen} />
    </>
  );
}
