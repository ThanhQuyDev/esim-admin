'use client';

/**
 * A distribution partner's own orders — "Đơn hàng" (#046).
 *
 * The portal's other order screen answers the marketing question: orders
 * somebody else placed that were credited to this partner. A distribution
 * partner has no such orders. Theirs are the ones they placed themselves, which
 * is what this lists — by order number and by when they bought.
 */

import { useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Icons } from '@/components/icons';
import { formatDateTimeVn, formatVnd } from '@/lib/format';

import { myPurchasesQueryOptions } from '../api/queries';
import { myPurchasesExportUrl, resendPurchaseEmail } from '../api/service';
import type { MyPurchase } from '../api/types';

const statusLabel: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }
> = {
  pending: { label: 'Chờ thanh toán', variant: 'outline' },
  paid: { label: 'Đã thanh toán', variant: 'default' },
  processing: { label: 'Đang xử lý', variant: 'secondary' },
  completed: { label: 'Hoàn tất', variant: 'default' },
  cancelled: { label: 'Đã huỷ', variant: 'destructive' },
  failed: { label: 'Thất bại', variant: 'destructive' },
  refunded: { label: 'Đã hoàn tiền', variant: 'destructive' }
};

const statusFilters = [
  { value: 'all', label: 'Tất cả trạng thái' },
  { value: 'paid', label: 'Đã thanh toán' },
  { value: 'completed', label: 'Hoàn tất' },
  { value: 'pending', label: 'Chờ thanh toán' },
  { value: 'cancelled', label: 'Đã huỷ' },
  { value: 'failed', label: 'Thất bại' },
  { value: 'refunded', label: 'Đã hoàn tiền' }
];

/** "Loại đơn" (doitac-1410 #041). */
const ORDER_TYPE_FILTERS = [
  { value: 'all', label: 'Loại đơn: tất cả' },
  { value: 'BUY_NEW', label: 'Đơn eSIM thường' },
  { value: 'TOPUP', label: 'Đơn nạp topup' }
];

const EMPTY_FILTERS = {
  orderNumber: '',
  planName: '',
  iccid: '',
  email: '',
  orderType: 'all',
  status: 'all',
  from: '',
  to: ''
};

export function PortalPurchasesView() {
  // A topup on an eSIM's page links here with its order code (doitac-1410 #039).
  const searchParams = useSearchParams();
  // The "Đơn hàng" filters (doitac-1410 #041).
  const [filters, setFilters] = useState(() => ({
    ...EMPTY_FILTERS,
    orderNumber: searchParams.get('search') ?? ''
  }));
  const set = (key: keyof typeof EMPTY_FILTERS) => (value: string) =>
    setFilters((current) => ({ ...current, [key]: value }));
  const filtered = Object.entries(filters).some(
    ([key, value]) => value !== EMPTY_FILTERS[key as keyof typeof EMPTY_FILTERS]
  );

  const listFilters = {
    orderNumber: filters.orderNumber.trim() || undefined,
    planName: filters.planName.trim() || undefined,
    iccid: filters.iccid.trim() || undefined,
    email: filters.email.trim() || undefined,
    orderType: filters.orderType,
    status: filters.status,
    from: filters.from || undefined,
    to: filters.to || undefined
  };
  const { data: purchases = [], isLoading } = useQuery(
    myPurchasesQueryOptions({ ...listFilters, limit: 200 })
  );

  const totals = useMemo(
    () => ({
      orders: purchases.length,
      paidVnd: purchases.reduce((sum, p) => sum + p.paidVnd, 0),
      esims: purchases.reduce((sum, p) => sum + p.esimCount, 0),
      refundedVnd: purchases.reduce((sum, p) => sum + p.refundedVnd, 0)
    }),
    [purchases]
  );

  return (
    <div className='grid min-w-0 grid-cols-1 gap-4'>
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4'>
        <Card>
          <CardHeader>
            <CardDescription>Số đơn</CardDescription>
            <CardTitle className='text-2xl font-semibold tabular-nums'>
              {isLoading ? '…' : totals.orders.toLocaleString('vi-VN')}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Tổng đã chi</CardDescription>
            <CardTitle className='text-2xl font-semibold tabular-nums'>
              {isLoading ? '…' : formatVnd(totals.paidVnd)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Số eSIM đã lấy</CardDescription>
            <CardTitle className='text-2xl font-semibold tabular-nums'>
              {isLoading ? '…' : totals.esims.toLocaleString('vi-VN')}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Đã hoàn tiền</CardDescription>
            <CardTitle className='text-2xl font-semibold tabular-nums'>
              {isLoading ? '…' : formatVnd(totals.refundedVnd)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card className='min-w-0'>
        <CardHeader>
          <CardTitle>Đơn hàng của bạn</CardTitle>
          <CardAction className='col-start-1 row-start-3 justify-self-start sm:col-start-2 sm:row-span-2 sm:row-start-1 sm:justify-self-end'>
            <Button asChild size='sm' variant='outline'>
              <a data-testid='purchases-export' href={myPurchasesExportUrl(listFilters)}>
                <Icons.download className='size-4' />
                Xuất file
              </a>
            </Button>
          </CardAction>
          <CardDescription>
            Lọc theo mã đơn, gói cước, ICCID, email khách, loại đơn, trạng thái và thời gian. Số
            tiền là số đã thanh toán cho esim.vn, đã trừ phần hoàn tiền nếu có.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4'>
            <Input
              placeholder='Mã đơn hàng'
              aria-label='Mã đơn hàng'
              value={filters.orderNumber}
              onChange={(e) => set('orderNumber')(e.target.value)}
              data-testid='purchase-order-number'
            />
            <Input
              placeholder='Tên gói cước'
              aria-label='Tên gói cước'
              value={filters.planName}
              onChange={(e) => set('planName')(e.target.value)}
              data-testid='purchase-plan-name'
            />
            <Input
              placeholder='ICCID'
              aria-label='ICCID'
              value={filters.iccid}
              onChange={(e) => set('iccid')(e.target.value)}
              data-testid='purchase-iccid'
            />
            <Input
              placeholder='Email khách hàng'
              aria-label='Email khách hàng'
              value={filters.email}
              onChange={(e) => set('email')(e.target.value)}
              data-testid='purchase-email'
            />
            <Select value={filters.orderType} onValueChange={set('orderType')}>
              <SelectTrigger className='w-full' aria-label='Loại đơn' data-testid='purchase-type'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ORDER_TYPE_FILTERS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filters.status} onValueChange={set('status')}>
              <SelectTrigger
                className='w-full'
                aria-label='Trạng thái đơn'
                data-testid='purchase-status'
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusFilters.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className='flex min-w-0 items-center gap-2'>
              <span className='text-muted-foreground shrink-0 text-xs'>Từ</span>
              <Input
                type='date'
                value={filters.from}
                max={filters.to || undefined}
                onChange={(e) => set('from')(e.target.value)}
                aria-label='Thời gian từ'
                className='min-w-0 flex-1'
                data-testid='purchase-from'
              />
            </div>
            <div className='flex min-w-0 items-center gap-2'>
              <span className='text-muted-foreground shrink-0 text-xs'>Đến</span>
              <Input
                type='date'
                value={filters.to}
                min={filters.from || undefined}
                onChange={(e) => set('to')(e.target.value)}
                aria-label='Thời gian đến'
                className='min-w-0 flex-1'
                data-testid='purchase-to'
              />
            </div>
          </div>
          {filtered && (
            <Button variant='ghost' size='sm' onClick={() => setFilters(EMPTY_FILTERS)}>
              Xoá bộ lọc
            </Button>
          )}

          {isLoading ? (
            <div className='flex justify-center py-12'>
              <Icons.spinner className='size-6 animate-spin' />
            </div>
          ) : purchases.length === 0 ? (
            <p className='text-muted-foreground py-12 text-center text-sm'>
              Chưa có đơn nào khớp với tìm kiếm này.
            </p>
          ) : (
            <div className='overflow-x-auto'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã đơn hàng</TableHead>
                    <TableHead>Khách hàng</TableHead>
                    <TableHead>Sản phẩm</TableHead>
                    <TableHead className='text-right'>Tổng tiền</TableHead>
                    <TableHead>Loại đơn</TableHead>
                    <TableHead>Ngày mua</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className='text-right'>Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchases.map((purchase) => {
                    const badge = statusLabel[purchase.status] ?? {
                      label: purchase.status,
                      variant: 'outline' as const
                    };
                    return (
                      <TableRow key={purchase.orderNumber}>
                        <TableCell className='font-mono text-xs'>
                          <Link
                            href={`/dashboard/portal/orders/${encodeURIComponent(purchase.orderNumber)}`}
                            className='hover:underline'
                          >
                            {purchase.orderNumber}
                          </Link>
                        </TableCell>
                        <TableCell className='max-w-[200px] truncate text-xs'>
                          {purchase.deliveryEmail || (
                            <span className='text-muted-foreground'>—</span>
                          )}
                        </TableCell>
                        <TableCell className='max-w-[260px] text-xs'>
                          <ProductSummary purchase={purchase} />
                        </TableCell>
                        <TableCell className='text-right tabular-nums'>
                          {formatVnd(purchase.paidVnd)}
                          {purchase.refundedVnd > 0 && (
                            <div className='text-destructive text-xs'>
                              −{formatVnd(purchase.refundedVnd)} hoàn
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant='outline'>
                            {purchase.orderType === 'TOPUP' ? 'Topup' : 'Mua eSIM'}
                          </Badge>
                        </TableCell>
                        <TableCell className='text-xs whitespace-nowrap'>
                          {formatDateTimeVn(purchase.createdAt)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={badge.variant}>{badge.label}</Badge>
                        </TableCell>
                        <TableCell className='text-right'>
                          <PurchaseActions purchase={purchase} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * "Tên sản phẩm × số lượng", then "+ N sản phẩm khác" (doitac-1410 #042) —
 * the prices of each line are on the order's own page.
 */
function ProductSummary({ purchase }: { purchase: MyPurchase }) {
  if (purchase.orderType === 'TOPUP') {
    return <span>{purchase.topupPackageName || 'Gói topup'}</span>;
  }
  const [first, ...rest] = purchase.items;
  if (!first) return <span className='text-muted-foreground'>—</span>;
  return (
    <div className='space-y-0.5'>
      <div>
        {first.planName ?? '—'} × {first.quantity}
      </div>
      {rest.length > 0 && (
        <div className='text-muted-foreground'>+ {rest.length} sản phẩm khác</div>
      )}
    </div>
  );
}

/** "Xem chi tiết" and "Gửi lại email eSIM" on one order (doitac-1410 #042). */
function PurchaseActions({ purchase }: { purchase: MyPurchase }) {
  const resend = useMutation({
    mutationFn: () => resendPurchaseEmail(purchase.orderNumber),
    onSuccess: (result) =>
      toast.success(
        `Đã gửi lại ${result.sent} email eSIM${purchase.deliveryEmail ? ` tới ${purchase.deliveryEmail}` : ''}.`
      ),
    onError: (err: Error) => toast.error(err.message)
  });
  const canResend = purchase.orderType !== 'TOPUP' && purchase.esimCount > 0;
  return (
    <div className='flex flex-col items-end gap-1 whitespace-nowrap'>
      <Button variant='link' size='sm' className='h-auto p-0 text-xs' asChild>
        <Link href={`/dashboard/portal/orders/${encodeURIComponent(purchase.orderNumber)}`}>
          Xem chi tiết
        </Link>
      </Button>
      <Button
        variant='ghost'
        size='sm'
        className='h-auto p-0 text-xs'
        disabled={!canResend || resend.isPending}
        title={canResend ? undefined : 'Đơn chưa có eSIM để gửi'}
        onClick={() => resend.mutate()}
      >
        {resend.isPending ? 'Đang gửi…' : 'Gửi lại email eSIM'}
      </Button>
    </div>
  );
}
