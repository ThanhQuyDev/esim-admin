'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Icons } from '@/components/icons';
import type { Order, ResendEsimEmailSkipReason } from '../../api/types';
import { resendEsimEmailMutation } from '../../api/mutations';
import { CreateInvoiceDialog } from '../create-invoice-dialog';

interface CellActionProps {
  data: Order;
}

const skipReasonMessage: Record<ResendEsimEmailSkipReason, string> = {
  'buyer-has-no-email': 'Người mua chưa có email trong hệ thống',
  'no-order-items': 'Đơn hàng không có sản phẩm nào',
  'no-esims-provisioned-yet': 'Chưa có eSIM nào được cấp cho đơn này'
};

export function CellAction({ data }: CellActionProps) {
  const router = useRouter();
  const [invoiceOpen, setInvoiceOpen] = useState(false);

  const resendMutation = useMutation({
    ...resendEsimEmailMutation,
    onSuccess: (res) => {
      if (res.sent === 0) {
        const reason = res.skippedReason
          ? (skipReasonMessage[res.skippedReason] ?? res.skippedReason)
          : 'Không gửi được email';
        toast.warning(`Không gửi được email: ${reason}`);
      } else {
        toast.success(`Đã gửi lại ${res.sent} email eSIM`);
      }
    },
    onError: (e) => {
      toast.error(e.message || 'Gửi lại email thất bại');
    }
  });

  const canResend = data.status === 'paid';

  return (
    <>
      <CreateInvoiceDialog
        orderId={data.id}
        orderNumber={data.orderNumber}
        open={invoiceOpen}
        onOpenChange={setInvoiceOpen}
        defaultEmail={data.user?.email}
      />
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' className='h-8 w-8 p-0'>
            <span className='sr-only'>Mở menu</span>
            <Icons.ellipsis className='h-4 w-4' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => router.push(`/dashboard/orders/${data.id}`)}>
            <Icons.eye className='mr-2 h-4 w-4' /> Xem chi tiết
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            disabled={!canResend || resendMutation.isPending}
            onClick={(e) => {
              e.preventDefault();
              if (!canResend) return;
              resendMutation.mutate(data.id);
            }}
          >
            <Icons.send className='mr-2 h-4 w-4' /> Gửi lại email eSIM
          </DropdownMenuItem>
          {data.hasInvoice ? (
            <DropdownMenuItem onClick={() => router.push(`/dashboard/orders/${data.id}`)}>
              <Icons.eye className='mr-2 h-4 w-4' /> Xem hóa đơn
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={() => setInvoiceOpen(true)}>
              <Icons.fileTypePdf className='mr-2 h-4 w-4' /> Xuất hóa đơn
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
