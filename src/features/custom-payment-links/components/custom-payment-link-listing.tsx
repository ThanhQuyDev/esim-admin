'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Icons } from '@/components/icons';
import { CustomPaymentLinkForm } from './custom-payment-link-form';
import type { CustomPaymentLink, CustomPaymentLinkStatus } from '../api/types';

const statusVariant: Record<
  CustomPaymentLinkStatus,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  PENDING: 'outline',
  PAID: 'default',
  FAILED: 'destructive'
};

const statusLabel: Record<CustomPaymentLinkStatus, string> = {
  PENDING: 'Chờ thanh toán',
  PAID: 'Đã thanh toán',
  FAILED: 'Thất bại'
};

function formatVnd(amount: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

function formatDateTime(date: string) {
  return new Date(date).toLocaleString('vi-VN');
}

export function CustomPaymentLinkListing() {
  const [links, setLinks] = useState<CustomPaymentLink[]>([]);

  function handleCopy(url: string) {
    navigator.clipboard
      .writeText(url)
      .then(() => toast.success('Đã copy link vào clipboard'))
      .catch(() => toast.error('Copy link thất bại'));
  }

  return (
    <div className='space-y-6'>
      <CustomPaymentLinkForm onCreated={(link) => setLinks((prev) => [link, ...prev])} />

      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Icons.galleryVerticalEnd className='h-4 w-4' />
            Link đã tạo trong phiên này
          </CardTitle>
        </CardHeader>
        <CardContent>
          {links.length === 0 ? (
            <div className='text-muted-foreground py-12 text-center text-sm'>
              Chưa có link nào trong phiên làm việc này. Sau khi tạo, link sẽ xuất hiện ở đây.
            </div>
          ) : (
            <div className='space-y-3'>
              {links.map((link) => (
                <div
                  key={link.id}
                  className='flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-start sm:justify-between'
                >
                  <div className='flex-1 space-y-2'>
                    <div className='flex flex-wrap items-center gap-2'>
                      <Badge variant={statusVariant[link.status]}>{statusLabel[link.status]}</Badge>
                      <span className='font-mono text-xs text-muted-foreground'>
                        {link.virtualOrderId}
                      </span>
                    </div>
                    <div className='text-sm font-medium'>{link.description}</div>
                    <div className='grid grid-cols-1 gap-2 text-xs text-muted-foreground sm:grid-cols-2'>
                      <div>
                        <span className='font-medium'>Khách hàng:</span> {link.customerEmail}
                      </div>
                      <div>
                        <span className='font-medium'>Số tiền:</span> {formatVnd(link.amount)}
                      </div>
                      <div>
                        <span className='font-medium'>Ngày tạo:</span>{' '}
                        {formatDateTime(link.createdAt)}
                      </div>
                      {link.createdBy?.email && (
                        <div>
                          <span className='font-medium'>Người tạo:</span> {link.createdBy.email}
                        </div>
                      )}
                    </div>
                    <div className='break-all rounded-md border bg-muted/30 px-3 py-2 font-mono text-xs'>
                      {link.paymentUrl}
                    </div>
                  </div>
                  <div className='flex shrink-0 gap-2 sm:flex-col'>
                    <Button
                      type='button'
                      size='sm'
                      variant='outline'
                      onClick={() => handleCopy(link.paymentUrl)}
                    >
                      <Icons.copy className='mr-2 h-4 w-4' />
                      Copy
                    </Button>
                    <Button asChild type='button' size='sm' variant='outline'>
                      <a href={link.paymentUrl} target='_blank' rel='noopener noreferrer'>
                        <Icons.externalLink className='mr-2 h-4 w-4' />
                        Mở
                      </a>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
