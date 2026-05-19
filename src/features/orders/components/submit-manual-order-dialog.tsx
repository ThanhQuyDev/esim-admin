'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { FormDialog } from '@/components/ui/form-dialog';
import { Icons } from '@/components/icons';
import { useAppForm, useFormFields } from '@/components/ui/tanstack-form';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { submitManualOrderMutation } from '../api/mutations';
import { submitManualOrderSchema, type SubmitManualOrderFormValues } from '../schemas/admin';
import type { SubmitManualOrderPayload } from '../api/types';

interface SubmitManualOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SubmitManualOrderDialog({ open, onOpenChange }: SubmitManualOrderDialogProps) {
  const router = useRouter();

  const mutation = useMutation({
    ...submitManualOrderMutation,
    onSuccess: (order) => {
      toast.success(`Đã đặt đơn hộ thành công: ${order.orderNumber}`, {
        description: 'Hãy mở chi tiết đơn để xác nhận eSIM đã được provision.',
        action: {
          label: 'Mở chi tiết',
          onClick: () => router.push(`/dashboard/orders/${order.id}`)
        }
      });
      onOpenChange(false);
    },
    onError: (e) => {
      toast.error(e.message || 'Đặt đơn hộ thất bại');
    }
  });

  const form = useAppForm({
    defaultValues: {
      email: '',
      packageCode: '',
      slug: '',
      quantity: '1'
    } as SubmitManualOrderFormValues,
    validators: { onSubmit: submitManualOrderSchema },
    onSubmit: async ({ value }) => {
      const payload: SubmitManualOrderPayload = {
        email: value.email.trim(),
        packageCode: value.packageCode.trim(),
        slug: value.slug.trim(),
        quantity: Number(value.quantity)
      };
      await mutation.mutateAsync(payload);
    }
  });

  useEffect(() => {
    if (!open) {
      form.reset();
    }
  }, [open, form]);

  const { FormTextField } = useFormFields<SubmitManualOrderFormValues>();

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title='Đặt đơn hộ khách'
      description='Tạo đơn hàng đã thanh toán cho người dùng có sẵn. Bypass cổng thanh toán.'
      formId='submit-manual-order-form'
      isLoading={mutation.isPending}
      submitLabel='Tạo đơn'
      metaInfo={
        <>
          <Icons.order className='h-4 w-4' />
          <span>Đơn hàng thủ công</span>
        </>
      }
    >
      <form.AppForm>
        <form.Form id='submit-manual-order-form' className='space-y-6'>
          <Alert>
            <Icons.warning className='h-4 w-4' />
            <AlertTitle>Lưu ý quan trọng</AlertTitle>
            <AlertDescription>
              <ul className='list-disc space-y-1 pl-4 text-xs'>
                <li>Email phải là user đã tồn tại trong hệ thống.</li>
                <li>
                  Đơn được đặt trực tiếp với trạng thái <strong>paid</strong>, không qua cổng thanh
                  toán.
                </li>
                <li>
                  Hệ thống <strong>KHÔNG gửi email tự động</strong>. Sau khi xác nhận tiền về, dùng
                  nút &quot;Gửi lại email eSIM&quot; trên trang chi tiết đơn.
                </li>
              </ul>
            </AlertDescription>
          </Alert>
          <FormTextField
            name='email'
            label='Email khách hàng'
            required
            type='email'
            placeholder='khachquen@example.com'
          />
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            <FormTextField
              name='slug'
              label='Plan slug'
              required
              placeholder='ID_1_7'
              description='Định danh chính của plan'
            />
            <FormTextField
              name='packageCode'
              label='Package Code'
              required
              placeholder='JC056'
              description='Provider plan ID — phải khớp với slug'
            />
          </div>
          <FormTextField name='quantity' label='Số lượng' required type='number' placeholder='1' />
        </form.Form>
      </form.AppForm>
    </FormDialog>
  );
}
