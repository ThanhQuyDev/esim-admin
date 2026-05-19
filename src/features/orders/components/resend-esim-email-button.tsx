'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button, type buttonVariants } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { resendEsimEmailMutation } from '../api/mutations';
import type { ResendEsimEmailSkipReason } from '../api/types';
import type { VariantProps } from 'class-variance-authority';

const skipReasonMessage: Record<ResendEsimEmailSkipReason, string> = {
  'buyer-has-no-email': 'Người mua chưa có email trong hệ thống',
  'no-order-items': 'Đơn hàng không có sản phẩm nào',
  'no-esims-provisioned-yet': 'Chưa có eSIM nào được cấp cho đơn này'
};

interface ResendEsimEmailButtonProps extends VariantProps<typeof buttonVariants> {
  orderId: number;
  orderStatus?: string;
  className?: string;
  label?: string;
  showIcon?: boolean;
}

export function ResendEsimEmailButton({
  orderId,
  orderStatus,
  className,
  label = 'Gửi lại email eSIM',
  showIcon = true,
  variant = 'outline',
  size
}: ResendEsimEmailButtonProps) {
  const [cooldown, setCooldown] = useState(false);

  const mutation = useMutation({
    ...resendEsimEmailMutation,
    onSuccess: (data) => {
      if (data.sent === 0) {
        const reason = data.skippedReason
          ? (skipReasonMessage[data.skippedReason] ?? data.skippedReason)
          : 'Không gửi được email';
        toast.warning(`Không gửi được email: ${reason}`);
      } else {
        toast.success(`Đã gửi lại ${data.sent} email eSIM`);
      }
      // simple debounce — block re-submit for 5s
      setCooldown(true);
      setTimeout(() => setCooldown(false), 5000);
    },
    onError: (e) => {
      toast.error(e.message || 'Gửi lại email thất bại');
    }
  });

  const disabled =
    mutation.isPending || cooldown || (orderStatus !== undefined && orderStatus !== 'paid');

  return (
    <Button
      type='button'
      variant={variant}
      size={size}
      className={className}
      disabled={disabled}
      isLoading={mutation.isPending}
      onClick={() => mutation.mutate(orderId)}
    >
      {showIcon && !mutation.isPending && <Icons.send className='mr-2 h-4 w-4' />}
      {label}
    </Button>
  );
}
