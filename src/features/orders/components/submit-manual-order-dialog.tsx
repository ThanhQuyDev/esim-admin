'use client';

import { useEffect, useState } from 'react';
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
import { PlanPicker, type PickedPlan } from './plan-picker';

interface SubmitManualOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SubmitManualOrderDialog({ open, onOpenChange }: SubmitManualOrderDialogProps) {
  const router = useRouter();
  const [plan, setPlan] = useState<PickedPlan | null>(null);

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
      customerName: '',
      packageCode: '',
      slug: '',
      quantity: '1'
    } as SubmitManualOrderFormValues,
    validators: { onSubmit: submitManualOrderSchema },
    onSubmit: async ({ value }) => {
      const customerName = value.customerName.trim();
      const payload: SubmitManualOrderPayload = {
        email: value.email.trim(),
        // Omitted when blank, so the backend leaves a new account nameless
        // rather than storing an empty string (#041).
        ...(customerName && { customerName }),
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
      setPlan(null);
    }
  }, [open, form]);

  /**
   * The picker owns both identifiers, so they are written together (#040). The
   * backend rejects an order whose slug and packageCode disagree, and typing
   * them into two boxes was the only way to make that happen.
   */
  const handlePlanChange = (picked: PickedPlan | null) => {
    setPlan(picked);
    form.setFieldValue('slug', picked?.slug ?? '');
    form.setFieldValue('packageCode', picked?.packageCode ?? '');
  };

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
                <li>
                  Email <strong>chưa có tài khoản</strong> vẫn đặt được — hệ thống tự tạo tài khoản
                  khách (chưa đặt mật khẩu, khách tự dùng &quot;Quên mật khẩu&quot; nếu muốn đăng
                  nhập).
                </li>
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
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            <FormTextField
              name='email'
              label='Email khách hàng'
              required
              type='email'
              placeholder='khachquen@example.com'
            />
            <FormTextField
              name='customerName'
              label='Tên khách hàng'
              placeholder='Nguyễn Văn A'
              description='Chỉ dùng khi email chưa có tài khoản'
            />
          </div>
          <PlanPicker value={plan} onChange={handlePlanChange} required />
          {/* `slug` and `packageCode` are no longer inputs, so their validation
              errors have nowhere to appear — surface them on the picker, or a
              failed submit looks like nothing happened. */}
          <form.Subscribe selector={(state) => state.submissionAttempts}>
            {(attempts) =>
              !plan && attempts > 0 ? (
                <p className='text-destructive text-xs' data-testid='plan-picker-error'>
                  Hãy chọn một gói eSIM.
                </p>
              ) : (
                <p className='text-muted-foreground text-xs'>
                  Tìm theo tên gói, điểm đến hoặc khu vực. Chọn một gói để hệ thống tự điền slug và
                  package code khớp nhau — không cần nhập tay nữa.
                </p>
              )
            }
          </form.Subscribe>
          <FormTextField name='quantity' label='Số lượng' required type='number' placeholder='1' />
        </form.Form>
      </form.AppForm>
    </FormDialog>
  );
}
