'use client';

import { formatDateTimeVn } from '@/lib/format';
import { useState } from 'react';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Icons } from '@/components/icons';
import { Skeleton } from '@/components/ui/skeleton';
import { CustomPaymentLinkForm } from './custom-payment-link-form';
import { PaymentLinkQrDialog } from './payment-link-qr-dialog';
import { customPaymentLinkKeys, customPaymentLinksQueryOptions } from '../api/queries';
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

/** Filter chips over the saved history (#084). */
const STATUS_FILTERS: { key: 'ALL' | CustomPaymentLinkStatus; label: string }[] = [
  { key: 'ALL', label: 'Tất cả' },
  { key: 'PENDING', label: 'Chờ thanh toán' },
  { key: 'PAID', label: 'Đã thanh toán' },
  { key: 'FAILED', label: 'Thất bại' }
];

const PAGE_SIZE = 20;

function formatVnd(amount: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

function formatDateTime(date: string) {
  return formatDateTimeVn(date);
}

/**
 * History of "lệnh thanh toán tùy ý" (#084).
 *
 * This page used to keep the created links in React state alone: a refresh —
 * or simply opening the page on another machine — showed an empty list, and
 * the status shown was whatever it had been at the moment of creation, never
 * the payment result that arrived later over the OnePay IPN. It now reads the
 * saved records, so the history survives and the status is the current one.
 */
export function CustomPaymentLinkListing() {
  const queryClient = useQueryClient();

  const [status, setStatus] = useState<'ALL' | CustomPaymentLinkStatus>('ALL');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  /** Links created in this session, highlighted until the list catches up. */
  const [justCreated, setJustCreated] = useState<string[]>([]);
  /** The order whose QR code is on screen (#085). */
  const [qrLink, setQrLink] = useState<CustomPaymentLink | null>(null);

  const filters = {
    page,
    limit: PAGE_SIZE,
    ...(status === 'ALL' ? {} : { status }),
    ...(search ? { search } : {})
  };

  const { data, isLoading, isFetching, refetch } = useQuery(
    customPaymentLinksQueryOptions(filters)
  );

  const links = data?.data ?? [];
  const totalCount = data?.totalCount ?? links.length;

  function handleCopy(url: string) {
    navigator.clipboard
      .writeText(url)
      .then(() => toast.success('Đã copy link vào clipboard'))
      .catch(() => toast.error('Copy link thất bại'));
  }

  function handleCreated(link: CustomPaymentLink) {
    setJustCreated((prev) => [link.id, ...prev]);
    // Show the code immediately: this is the moment it gets handed over.
    setQrLink(link);
    // Back to the newest page so the link just created is on screen.
    setStatus('ALL');
    setSearch('');
    setSearchInput('');
    setPage(1);
    void queryClient.invalidateQueries({ queryKey: customPaymentLinkKeys.all });
  }

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  }

  return (
    <div className='space-y-6'>
      <PaymentLinkQrDialog link={qrLink} onOpenChange={(open) => !open && setQrLink(null)} />

      <CustomPaymentLinkForm onCreated={handleCreated} />

      <Card>
        <CardHeader className='gap-4'>
          <div className='flex flex-wrap items-center justify-between gap-2'>
            <CardTitle className='flex items-center gap-2'>
              <Icons.galleryVerticalEnd className='h-4 w-4' />
              Lịch sử lệnh thanh toán
              <span className='text-muted-foreground text-sm font-normal'>({totalCount})</span>
            </CardTitle>
            <Button
              type='button'
              size='sm'
              variant='outline'
              onClick={() => void refetch()}
              disabled={isFetching}
            >
              <Icons.refresh className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
              Làm mới
            </Button>
          </div>

          <div className='flex flex-wrap items-center gap-2'>
            {STATUS_FILTERS.map((filter) => (
              <button
                key={filter.key}
                type='button'
                data-testid={`payment-link-filter-${filter.key}`}
                onClick={() => {
                  setStatus(filter.key);
                  setPage(1);
                }}
                className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                  status === filter.key
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'hover:bg-muted'
                }`}
              >
                {filter.label}
              </button>
            ))}

            <form onSubmit={submitSearch} className='ml-auto flex items-center gap-2'>
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder='Tìm email, nội dung, mã đơn...'
                className='h-8 w-56'
              />
              <Button type='submit' size='sm' variant='outline'>
                <Icons.search className='h-4 w-4' />
              </Button>
            </form>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className='space-y-3'>
              <Skeleton className='h-24 w-full' />
              <Skeleton className='h-24 w-full' />
            </div>
          ) : links.length === 0 ? (
            <div className='text-muted-foreground py-12 text-center text-sm'>
              {search || status !== 'ALL'
                ? 'Không có lệnh thanh toán nào khớp bộ lọc.'
                : 'Chưa có lệnh thanh toán nào. Sau khi tạo, lệnh sẽ xuất hiện ở đây.'}
            </div>
          ) : (
            <div className='space-y-3'>
              {links.map((link) => (
                <div
                  key={link.id}
                  data-testid={`payment-link-${link.virtualOrderId}`}
                  className={`flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-start sm:justify-between ${
                    justCreated.includes(link.id) ? 'border-primary/60 bg-primary/5' : ''
                  }`}
                >
                  <div className='flex-1 space-y-2'>
                    <div className='flex flex-wrap items-center gap-2'>
                      <Badge variant={statusVariant[link.status]}>{statusLabel[link.status]}</Badge>
                      <span className='text-muted-foreground font-mono text-xs'>
                        {link.virtualOrderId}
                      </span>
                      {link.paymentId && (
                        <span className='text-muted-foreground text-xs'>
                          Mã giao dịch: <span className='font-mono'>{link.paymentId}</span>
                        </span>
                      )}
                    </div>
                    <div className='text-sm font-medium'>{link.description}</div>
                    <div className='text-muted-foreground grid grid-cols-1 gap-2 text-xs sm:grid-cols-2'>
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
                      {/* When the status last changed — for a paid link this is
                          when the money actually landed (#084). */}
                      {link.status !== 'PENDING' && link.updatedAt && (
                        <div>
                          <span className='font-medium'>
                            {link.status === 'PAID' ? 'Thanh toán lúc:' : 'Cập nhật lúc:'}
                          </span>{' '}
                          {formatDateTime(link.updatedAt)}
                        </div>
                      )}
                      {link.createdBy?.email && (
                        <div>
                          <span className='font-medium'>Người tạo:</span> {link.createdBy.email}
                        </div>
                      )}
                    </div>
                    <div className='bg-muted/30 rounded-md border px-3 py-2 font-mono text-xs break-all'>
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
                    <Button
                      type='button'
                      size='sm'
                      variant='outline'
                      data-testid={`payment-link-qr-${link.virtualOrderId}`}
                      onClick={() => setQrLink(link)}
                    >
                      <Icons.qrCode className='mr-2 h-4 w-4' />
                      QR
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

          {(page > 1 || data?.hasNextPage) && (
            <div className='mt-4 flex items-center justify-between'>
              <Button
                type='button'
                size='sm'
                variant='outline'
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || isFetching}
              >
                Trang trước
              </Button>
              <span className='text-muted-foreground text-xs'>Trang {page}</span>
              <Button
                type='button'
                size='sm'
                variant='outline'
                onClick={() => setPage((p) => p + 1)}
                disabled={!data?.hasNextPage || isFetching}
              >
                Trang sau
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
