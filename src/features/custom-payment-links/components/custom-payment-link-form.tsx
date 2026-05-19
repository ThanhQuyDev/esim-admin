'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Icons } from '@/components/icons';
import { useAppForm, useFormFields } from '@/components/ui/tanstack-form';
import { createCustomPaymentLinkMutation } from '../api/mutations';
import {
  createCustomPaymentLinkSchema,
  type CreateCustomPaymentLinkFormValues
} from '../schemas/custom-payment-link';
import type { CreateCustomPaymentLinkPayload, CustomPaymentLink } from '../api/types';

interface CustomPaymentLinkFormProps {
  onCreated?: (link: CustomPaymentLink) => void;
}

export function CustomPaymentLinkForm({ onCreated }: CustomPaymentLinkFormProps) {
  const mutation = useMutation({
    ...createCustomPaymentLinkMutation,
    onSuccess: async (link) => {
      try {
        await navigator.clipboard.writeText(link.paymentUrl);
        toast.success('Đã tạo link thanh toán & copy URL vào clipboard');
      } catch {
        toast.success('Đã tạo link thanh toán');
      }
      onCreated?.(link);
      form.reset();
    },
    onError: (e) => {
      toast.error(e.message || 'Tạo link thanh toán thất bại');
    }
  });

  const form = useAppForm({
    defaultValues: {
      customer_email: '',
      amount: '',
      description: ''
    } as CreateCustomPaymentLinkFormValues,
    validators: { onSubmit: createCustomPaymentLinkSchema },
    onSubmit: async ({ value }) => {
      const payload: CreateCustomPaymentLinkPayload = {
        customer_email: value.customer_email.trim(),
        amount: Number(value.amount),
        currency: 'VND',
        description: value.description.trim()
      };
      await mutation.mutateAsync(payload);
    }
  });

  const { FormTextField, FormTextareaField } = useFormFields<CreateCustomPaymentLinkFormValues>();

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Icons.creditCard className='h-4 w-4' />
          Tạo lệnh thanh toán mới
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form.AppForm>
          <form.Form id='custom-payment-link-form' className='space-y-4 p-0'>
            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              <FormTextField
                name='customer_email'
                label='Email khách hàng'
                required
                type='email'
                placeholder='wholesale-client@example.com'
              />
              <FormTextField
                name='amount'
                label='Số tiền (VND)'
                required
                type='number'
                placeholder='5000000'
                description='Số nguyên dương, đơn vị VND'
              />
            </div>
            <FormTextareaField
              name='description'
              label='Mô tả'
              required
              maxLength={500}
              showCount
              placeholder='Thanh toan don hang eSim Custom - 1000 Pack Asia'
            />
            <div className='flex justify-end'>
              <Button
                type='submit'
                form='custom-payment-link-form'
                isLoading={mutation.isPending}
                disabled={mutation.isPending}
              >
                <Icons.add className='mr-2 h-4 w-4' />
                Tạo link & copy URL
              </Button>
            </div>
          </form.Form>
        </form.AppForm>
      </CardContent>
    </Card>
  );
}
