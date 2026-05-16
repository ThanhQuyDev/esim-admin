'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { FormDialog } from '@/components/ui/form-dialog';
import { Icons } from '@/components/icons';
import { useAppForm, useFormFields } from '@/components/ui/tanstack-form';
import { createProfitMarginTierMutation, updateProfitMarginTierMutation } from '../api/mutations';
import type {
  CreateProfitMarginTierPayload,
  ProfitMarginTier,
  UpdateProfitMarginTierPayload
} from '../api/types';
import { profitMarginTierSchema, type ProfitMarginTierFormValues } from '../schemas/profit-margin';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ProfitMarginTierFormDialogProps {
  item?: ProfitMarginTier;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProfitMarginTierFormDialog({
  item,
  open,
  onOpenChange
}: ProfitMarginTierFormDialogProps) {
  if (item) {
    return <EditDialog key={item.id} item={item} open={open} onOpenChange={onOpenChange} />;
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
  const mutation = useMutation({
    ...createProfitMarginTierMutation,
    onSuccess: () => {
      toast.success('Tier created. All plan prices have been recalculated.');
      onOpenChange(false);
      form.reset();
    },
    onError: (e) => {
      toast.error(e.message || 'Operation failed');
    }
  });

  const form = useAppForm({
    defaultValues: {
      minVnd: '0',
      maxVnd: '0',
      percentage: '30',
      isActive: true
    } as ProfitMarginTierFormValues,
    validators: { onSubmit: profitMarginTierSchema },
    onSubmit: async ({ value }) => {
      const payload: CreateProfitMarginTierPayload = {
        minVnd: Number(value.minVnd),
        maxVnd: Number(value.maxVnd),
        percentage: Number(value.percentage),
        isActive: value.isActive
      };
      await mutation.mutateAsync(payload);
    }
  });

  const { FormTextField, FormSwitchField } = useFormFields<ProfitMarginTierFormValues>();

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title='New Profit Margin Tier'
      description='Add a new tiered profit margin range.'
      formId='profit-margin-tier-form-dialog'
      isLoading={mutation.isPending}
      submitLabel='Create'
      metaInfo={
        <>
          <Icons.trendingUp className='h-4 w-4' />
          <span>Profit Margin Tier</span>
        </>
      }
    >
      <form.AppForm>
        <form.Form id='profit-margin-tier-form-dialog' className='space-y-6'>
          <Alert>
            <Icons.info className='h-4 w-4' />
            <AlertDescription>
              Saving will recalculate all plan prices based on the updated tiers.
            </AlertDescription>
          </Alert>
          <div className='grid grid-cols-2 gap-4'>
            <FormTextField name='minVnd' label='Min Price (VND)' placeholder='0' type='number' />
            <FormTextField
              name='maxVnd'
              label='Max Price (VND)'
              placeholder='100000'
              type='number'
            />
          </div>
          <FormTextField name='percentage' label='Profit %' placeholder='30' type='number' />
          <FormSwitchField name='isActive' label='Active' />
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
  item: ProfitMarginTier;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const mutation = useMutation({
    ...updateProfitMarginTierMutation,
    onSuccess: () => {
      toast.success('Tier updated. All plan prices have been recalculated.');
      onOpenChange(false);
    },
    onError: (e) => {
      toast.error(e.message || 'Operation failed');
    }
  });

  const form = useAppForm({
    defaultValues: {
      minVnd: String(item.minVnd),
      maxVnd: String(item.maxVnd),
      percentage: String(item.percentage),
      isActive: item.isActive
    } as ProfitMarginTierFormValues,
    validators: { onSubmit: profitMarginTierSchema },
    onSubmit: async ({ value }) => {
      const payload: UpdateProfitMarginTierPayload = {
        minVnd: Number(value.minVnd),
        maxVnd: Number(value.maxVnd),
        percentage: Number(value.percentage),
        isActive: value.isActive
      };
      await mutation.mutateAsync({ id: item.id, values: payload });
    }
  });

  const { FormTextField, FormSwitchField } = useFormFields<ProfitMarginTierFormValues>();

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title='Edit Profit Margin Tier'
      description='Update tiered profit margin range.'
      formId='profit-margin-tier-form-dialog'
      isLoading={mutation.isPending}
      submitLabel='Update'
    >
      <form.AppForm>
        <form.Form id='profit-margin-tier-form-dialog' className='space-y-6'>
          <Alert>
            <Icons.info className='h-4 w-4' />
            <AlertDescription>
              Saving will recalculate all plan prices based on the updated tiers.
            </AlertDescription>
          </Alert>
          <div className='grid grid-cols-2 gap-4'>
            <FormTextField name='minVnd' label='Min Price (VND)' placeholder='0' type='number' />
            <FormTextField
              name='maxVnd'
              label='Max Price (VND)'
              placeholder='100000'
              type='number'
            />
          </div>
          <FormTextField name='percentage' label='Profit %' placeholder='30' type='number' />
          <FormSwitchField name='isActive' label='Active' />
        </form.Form>
      </form.AppForm>
    </FormDialog>
  );
}

export function ProfitMarginTierFormDialogTrigger() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)} size='sm'>
        <Icons.add className='mr-2 h-4 w-4' /> Add Tier
      </Button>
      <ProfitMarginTierFormDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
