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
import { createWcuMutation, updateWcuMutation } from '../api/mutations';
import type { WhyChooseUs, CreateWhyChooseUsPayload, UpdateWhyChooseUsPayload } from '../api/types';
import { toast } from 'sonner';
import * as z from 'zod';
import { wcuSchema, type WcuFormValues } from '../schemas/wcu';

const LANG_OPTIONS = [
  { value: 'vi', label: 'Vietnamese' },
  { value: 'en', label: 'English' }
];

interface WcuFormSheetProps {
  item?: WhyChooseUs;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WcuFormSheet({ item, open, onOpenChange }: WcuFormSheetProps) {
  if (item) return <EditSheet key={item.id} item={item} open={open} onOpenChange={onOpenChange} />;
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
    ...createWcuMutation,
    onSuccess: () => {
      toast.success('Created');
      onOpenChange(false);
      form.reset();
    },
    onError: (e) => toast.error(e.message || 'Failed')
  });
  const form = useAppForm({
    defaultValues: {
      title: '',
      description: '',
      language: 'en',
      icon: '',
      sortOrder: '0',
      isActive: true
    } as WcuFormValues,
    validators: { onSubmit: wcuSchema },
    onSubmit: async ({ value }) => {
      const payload: CreateWhyChooseUsPayload = {
        title: value.title,
        description: value.description,
        language: value.language,
        icon: value.icon || undefined,
        sortOrder: value.sortOrder ? Number(value.sortOrder) : 0,
        isActive: value.isActive ?? true
      };
      await mutation.mutateAsync(payload);
    }
  });
  const { FormTextField, FormSelectField, FormSwitchField, FormTextareaField } =
    useFormFields<WcuFormValues>();
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='flex flex-col'>
        <SheetHeader>
          <SheetTitle>New Item</SheetTitle>
          <SheetDescription>Add a new Why Choose Us item.</SheetDescription>
        </SheetHeader>
        <div className='flex-1 overflow-auto'>
          <form.AppForm>
            <form.Form id='wcu-form-sheet' className='space-y-4'>
              <FormTextField
                name='title'
                label='Title'
                required
                placeholder='Title'
                validators={{ onBlur: z.string().min(2) }}
              />
              <FormTextareaField
                name='description'
                label='Description'
                required
                placeholder='Description...'
              />
              <div className='grid grid-cols-2 gap-4'>
                <FormSelectField name='language' label='Language' required options={LANG_OPTIONS} />
                <FormTextField name='icon' label='Icon' placeholder='icon-name' />
              </div>
              <div className='grid grid-cols-2 gap-4'>
                <FormTextField name='sortOrder' label='Sort Order' placeholder='0' />
                <FormSwitchField name='isActive' label='Active' />
              </div>
            </form.Form>
          </form.AppForm>
        </div>
        <SheetFooter>
          <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type='submit' form='wcu-form-sheet' isLoading={mutation.isPending}>
            <Icons.check /> Create
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
  const mutation = useMutation({
    ...updateWcuMutation,
    onSuccess: () => {
      toast.success('Updated');
      onOpenChange(false);
    },
    onError: (e) => toast.error(e.message || 'Failed')
  });
  const form = useAppForm({
    defaultValues: {
      title: item.title,
      description: item.description,
      language: item.language as 'vi' | 'en',
      icon: item.icon ?? '',
      sortOrder: String(item.sortOrder ?? 0),
      isActive: item.isActive
    } as WcuFormValues,
    validators: { onSubmit: wcuSchema },
    onSubmit: async ({ value }) => {
      const payload: UpdateWhyChooseUsPayload = {
        title: value.title,
        description: value.description,
        language: value.language,
        icon: value.icon || undefined,
        sortOrder: value.sortOrder ? Number(value.sortOrder) : undefined,
        isActive: value.isActive
      };
      await mutation.mutateAsync({ id: item.id, values: payload });
    }
  });
  const { FormTextField, FormSelectField, FormSwitchField, FormTextareaField } =
    useFormFields<WcuFormValues>();
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='flex flex-col'>
        <SheetHeader>
          <SheetTitle>Edit Item</SheetTitle>
          <SheetDescription>Update the item.</SheetDescription>
        </SheetHeader>
        <div className='flex-1 overflow-auto'>
          <form.AppForm>
            <form.Form id='wcu-form-sheet' className='space-y-4'>
              <FormTextField
                name='title'
                label='Title'
                required
                placeholder='Title'
                validators={{ onBlur: z.string().min(2) }}
              />
              <FormTextareaField
                name='description'
                label='Description'
                required
                placeholder='Description...'
              />
              <div className='grid grid-cols-2 gap-4'>
                <FormSelectField name='language' label='Language' required options={LANG_OPTIONS} />
                <FormTextField name='icon' label='Icon' placeholder='icon-name' />
              </div>
              <div className='grid grid-cols-2 gap-4'>
                <FormTextField name='sortOrder' label='Sort Order' placeholder='0' />
                <FormSwitchField name='isActive' label='Active' />
              </div>
            </form.Form>
          </form.AppForm>
        </div>
        <SheetFooter>
          <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type='submit' form='wcu-form-sheet' isLoading={mutation.isPending}>
            <Icons.check /> Update
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
        <Icons.add className='mr-2 h-4 w-4' /> Add Item
      </Button>
      <WcuFormSheet open={open} onOpenChange={setOpen} />
    </>
  );
}
