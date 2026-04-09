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
import { createPlanMutation, updatePlanMutation } from '../api/mutations';
import type { Plan, CreatePlanPayload, UpdatePlanPayload } from '../api/types';
import { toast } from 'sonner';
import * as z from 'zod';
import {
  createPlanSchema,
  updatePlanSchema,
  type CreatePlanFormValues,
  type UpdatePlanFormValues
} from '../schemas/plan';

const PLAN_TYPE_OPTIONS = [
  { value: 'daily-unlimited', label: 'Daily Unlimited' },
  { value: 'fixed-data', label: 'Fixed Data' },
  { value: 'unlimited', label: 'Unlimited' }
];

const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD' },
  { value: 'EUR', label: 'EUR' }
];

interface PlanFormSheetProps {
  plan?: Plan;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PlanFormSheet({ plan, open, onOpenChange }: PlanFormSheetProps) {
  const isEdit = !!plan;

  if (isEdit) {
    return <EditPlanSheet key={plan.id} plan={plan} open={open} onOpenChange={onOpenChange} />;
  }

  return <CreatePlanSheet open={open} onOpenChange={onOpenChange} />;
}

function CreatePlanSheet({
  open,
  onOpenChange
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const createMut = useMutation({
    ...createPlanMutation,
    onSuccess: () => {
      toast.success('Plan created successfully');
      onOpenChange(false);
      form.reset();
    },
    onError: (error) => toast.error(error.message || 'Failed to create plan')
  });

  const form = useAppForm({
    defaultValues: {
      name: '',
      provider: '',
      providerPlanId: '',
      slug: '',
      countryCode: '',
      destinationId: '',
      regionId: '',
      durationDays: '',
      dataGb: '',
      costPrice: '',
      price: '',
      retailPrice: '',
      currency: 'USD',
      type: '',
      topUp: false,
      isActive: true
    } as CreatePlanFormValues,
    validators: {
      onSubmit: createPlanSchema
    },
    onSubmit: async ({ value }) => {
      const payload: CreatePlanPayload = {
        name: value.name,
        ...(value.provider && { provider: value.provider }),
        ...(value.providerPlanId && { providerPlanId: value.providerPlanId }),
        ...(value.slug && { slug: value.slug }),
        ...(value.countryCode && { countryCode: value.countryCode }),
        ...(value.destinationId && { destinationId: Number(value.destinationId) }),
        ...(value.regionId && { regionId: Number(value.regionId) }),
        ...(value.durationDays && { durationDays: Number(value.durationDays) }),
        ...(value.dataGb && { dataGb: value.dataGb }),
        ...(value.costPrice && { costPrice: value.costPrice }),
        ...(value.price && { price: value.price }),
        ...(value.retailPrice && { retailPrice: value.retailPrice }),
        ...(value.currency && { currency: value.currency }),
        ...(value.type && { type: value.type }),
        topUp: value.topUp ?? false,
        isActive: value.isActive ?? true
      };
      await createMut.mutateAsync(payload);
    }
  });

  const { FormTextField, FormSelectField, FormSwitchField } = useFormFields<CreatePlanFormValues>();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='flex flex-col'>
        <SheetHeader>
          <SheetTitle>New eSIM Plan</SheetTitle>
          <SheetDescription>Fill in the details to create a new plan.</SheetDescription>
        </SheetHeader>

        <div className='flex-1 overflow-auto'>
          <form.AppForm>
            <form.Form id='plan-form-sheet' className='space-y-4'>
              <FormTextField
                name='name'
                label='Plan Name'
                required
                placeholder='Unlimited - 3 days'
                validators={{
                  onBlur: z.string().min(2, 'Name must be at least 2 characters')
                }}
              />

              <div className='grid grid-cols-2 gap-4'>
                <FormTextField name='provider' label='Provider' placeholder='airalo' />
                <FormTextField
                  name='providerPlanId'
                  label='Provider Plan ID'
                  placeholder='plan-id'
                />
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <FormTextField name='countryCode' label='Country Code' placeholder='US' />
                <FormTextField name='slug' label='Slug' placeholder='plan-slug' />
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <FormTextField name='destinationId' label='Destination ID' placeholder='1' />
                <FormTextField name='regionId' label='Region ID' placeholder='1' />
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <FormTextField name='durationDays' label='Duration (days)' placeholder='3' />
                <FormTextField name='dataGb' label='Data (GB)' placeholder='0.00' />
              </div>

              <div className='grid grid-cols-3 gap-4'>
                <FormTextField name='costPrice' label='Cost Price' placeholder='6.30' />
                <FormTextField name='price' label='Price' placeholder='6.30' />
                <FormTextField name='retailPrice' label='Retail Price' placeholder='11.50' />
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <FormSelectField name='currency' label='Currency' options={CURRENCY_OPTIONS} />
                <FormSelectField
                  name='type'
                  label='Type'
                  options={PLAN_TYPE_OPTIONS}
                  placeholder='Select type'
                />
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <FormSwitchField name='topUp' label='Top-Up' />
                <FormSwitchField name='isActive' label='Active' />
              </div>
            </form.Form>
          </form.AppForm>
        </div>

        <SheetFooter>
          <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type='submit' form='plan-form-sheet' isLoading={createMut.isPending}>
            <Icons.check /> Create
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function EditPlanSheet({
  plan,
  open,
  onOpenChange
}: {
  plan: Plan;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const updateMut = useMutation({
    ...updatePlanMutation,
    onSuccess: () => {
      toast.success('Plan updated successfully');
      onOpenChange(false);
    },
    onError: (error) => toast.error(error.message || 'Failed to update plan')
  });

  const form = useAppForm({
    defaultValues: {
      name: plan.name,
      provider: plan.provider ?? '',
      providerPlanId: plan.providerPlanId ?? '',
      slug: plan.slug ?? '',
      countryCode: plan.countryCode ?? '',
      destinationId: plan.destinationId ? String(plan.destinationId) : '',
      regionId: plan.regionId ? String(plan.regionId) : '',
      durationDays: String(plan.durationDays ?? ''),
      dataGb: plan.dataGb ?? '',
      costPrice: plan.costPrice ?? '',
      price: plan.price ?? '',
      retailPrice: plan.retailPrice ?? '',
      currency: plan.currency ?? 'USD',
      type: plan.type ?? '',
      topUp: plan.topUp,
      isActive: plan.isActive
    } as UpdatePlanFormValues,
    validators: {
      onSubmit: updatePlanSchema
    },
    onSubmit: async ({ value }) => {
      const payload: UpdatePlanPayload = {
        name: value.name,
        provider: value.provider || undefined,
        providerPlanId: value.providerPlanId || undefined,
        slug: value.slug || undefined,
        countryCode: value.countryCode || undefined,
        destinationId: value.destinationId ? Number(value.destinationId) : undefined,
        regionId: value.regionId ? Number(value.regionId) : undefined,
        durationDays: value.durationDays ? Number(value.durationDays) : undefined,
        dataGb: value.dataGb || undefined,
        costPrice: value.costPrice || undefined,
        price: value.price || undefined,
        retailPrice: value.retailPrice || undefined,
        currency: value.currency || undefined,
        type: value.type || undefined,
        topUp: value.topUp,
        isActive: value.isActive
      };
      await updateMut.mutateAsync({ id: plan.id, values: payload });
    }
  });

  const { FormTextField, FormSelectField, FormSwitchField } = useFormFields<UpdatePlanFormValues>();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='flex flex-col'>
        <SheetHeader>
          <SheetTitle>Edit eSIM Plan</SheetTitle>
          <SheetDescription>Update the plan details below.</SheetDescription>
        </SheetHeader>

        <div className='flex-1 overflow-auto'>
          <form.AppForm>
            <form.Form id='plan-form-sheet' className='space-y-4'>
              <FormTextField
                name='name'
                label='Plan Name'
                required
                placeholder='Unlimited - 3 days'
                validators={{
                  onBlur: z.string().min(2, 'Name must be at least 2 characters')
                }}
              />

              <div className='grid grid-cols-2 gap-4'>
                <FormTextField name='provider' label='Provider' placeholder='airalo' />
                <FormTextField
                  name='providerPlanId'
                  label='Provider Plan ID'
                  placeholder='plan-id'
                />
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <FormTextField name='countryCode' label='Country Code' placeholder='US' />
                <FormTextField name='slug' label='Slug' placeholder='plan-slug' />
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <FormTextField name='destinationId' label='Destination ID' placeholder='1' />
                <FormTextField name='regionId' label='Region ID' placeholder='1' />
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <FormTextField name='durationDays' label='Duration (days)' placeholder='3' />
                <FormTextField name='dataGb' label='Data (GB)' placeholder='0.00' />
              </div>

              <div className='grid grid-cols-3 gap-4'>
                <FormTextField name='costPrice' label='Cost Price' placeholder='6.30' />
                <FormTextField name='price' label='Price' placeholder='6.30' />
                <FormTextField name='retailPrice' label='Retail Price' placeholder='11.50' />
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <FormSelectField name='currency' label='Currency' options={CURRENCY_OPTIONS} />
                <FormSelectField
                  name='type'
                  label='Type'
                  options={PLAN_TYPE_OPTIONS}
                  placeholder='Select type'
                />
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <FormSwitchField name='topUp' label='Top-Up' />
                <FormSwitchField name='isActive' label='Active' />
              </div>
            </form.Form>
          </form.AppForm>
        </div>

        <SheetFooter>
          <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type='submit' form='plan-form-sheet' isLoading={updateMut.isPending}>
            <Icons.check /> Update
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export function PlanFormSheetTrigger() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)} size='sm'>
        <Icons.add className='mr-2 h-4 w-4' /> Add Plan
      </Button>
      <PlanFormSheet open={open} onOpenChange={setOpen} />
    </>
  );
}
