'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { updateInvoiceStatusMutation } from '../api/mutations';
import type { AdminOrderInvoice, InvoiceStatus } from '../api/types';

interface InvoiceViewDialogProps {
  invoice: AdminOrderInvoice;
  orderNumber: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusVariant: Record<InvoiceStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  PENDING: 'outline',
  ISSUED: 'default',
  FAILED: 'destructive'
};

const statusLabel: Record<InvoiceStatus, string> = {
  PENDING: 'Chờ phát hành',
  ISSUED: 'Đã phát hành',
  FAILED: 'Phát hành lỗi'
};

function formatDate(date: string | Date | null | undefined) {
  if (!date) return '—';
  return new Date(date).toLocaleString('vi-VN');
}

function InvoiceField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className='flex flex-col gap-1 sm:flex-row sm:items-start sm:gap-4'>
      <span className='text-muted-foreground w-40 shrink-0 text-sm font-medium'>{label}</span>
      <span className='text-sm break-words'>{value || '—'}</span>
    </div>
  );
}

export function InvoiceViewDialog({
  invoice,
  orderNumber,
  open,
  onOpenChange
}: InvoiceViewDialogProps) {
  const issueMutation = useMutation({
    ...updateInvoiceStatusMutation,
    onSuccess: () => {
      toast.success('Đã phát hành hóa đơn');
      onOpenChange(false);
    },
    onError: (e) => {
      toast.error(e.message || 'Phát hành hóa đơn thất bại');
    }
  });

  const canIssue = invoice.status === 'PENDING';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Icons.fileTypePdf className='h-5 w-5' />
            Hóa đơn VAT
          </DialogTitle>
          <DialogDescription>
            Thông tin hóa đơn cho đơn hàng <span className='font-mono'>{orderNumber}</span>
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-3'>
          <InvoiceField
            label='Trạng thái'
            value={
              <Badge variant={statusVariant[invoice.status]}>{statusLabel[invoice.status]}</Badge>
            }
          />
          <InvoiceField
            label='Mã hóa đơn'
            value={<span className='font-mono text-xs break-all'>{invoice.id}</span>}
          />
          <InvoiceField label='Tên công ty' value={invoice.companyName} />
          <InvoiceField
            label='Mã số thuế'
            value={<span className='font-mono'>{invoice.taxCode}</span>}
          />
          <InvoiceField label='Email nhận' value={invoice.invoiceEmail} />
          <InvoiceField label='Địa chỉ' value={invoice.address} />
          <InvoiceField label='Tạo lúc' value={formatDate(invoice.createdAt)} />
          <InvoiceField label='Cập nhật' value={formatDate(invoice.updatedAt)} />
        </div>

        <DialogFooter className='gap-2 sm:gap-2'>
          <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
          {canIssue && (
            <Button
              type='button'
              onClick={() => issueMutation.mutate({ invoiceId: invoice.id, status: 'ISSUED' })}
              isLoading={issueMutation.isPending}
            >
              <Icons.check className='mr-2 h-4 w-4' />
              Phát hành
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
