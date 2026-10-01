'use client';

/**
 * "Doanh thu và đơn hàng" cho đối tác phân phối (#046).
 *
 * Màn hình đối chiếu ba cột: *Doanh thu bán ra* − *Giá vốn đã trừ ví* =
 * *Chênh lệch*.
 *
 * "Doanh thu bán ra" là **giá niêm yết của esim.vn** (chốt 02/10/2026, phương
 * án a). Nó không phải tiền thật đối tác thu được nếu họ bán giá khác, nên
 * trang nói rõ điều đó thay vì để con số tự nhận là doanh thu thực — hứa một
 * khoản lãi mà dữ liệu không chứng minh được là cách nhanh nhất để mất lòng
 * tin vào cả bảng.
 *
 * "Giá vốn đã trừ ví" lấy từ **sổ ví**, không phải tổng đơn: hoàn tiền eSIM
 * lỗi ghi vào ví và không đụng tới đơn.
 */

import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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

import { cancelPurchaseMutation } from '../api/mutations';
import { myPurchasesQueryOptions } from '../api/queries';

const statusLabel: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }
> = {
  pending: { label: 'Chờ xử lý', variant: 'outline' },
  paid: { label: 'Đã thanh toán', variant: 'default' },
  processing: { label: 'Đang xử lý', variant: 'secondary' },
  completed: { label: 'Hoàn tất', variant: 'default' },
  cancelled: { label: 'Đã huỷ', variant: 'destructive' },
  failed: { label: 'Thất bại', variant: 'destructive' },
  refunded: { label: 'Đã hoàn tiền', variant: 'destructive' }
};

const statusFilters = [
  { value: 'all', label: 'Tất cả trạng thái' },
  { value: 'completed', label: 'Hoàn tất' },
  { value: 'processing', label: 'Đang xử lý' },
  { value: 'pending', label: 'Chờ xử lý' },
  { value: 'cancelled', label: 'Đã huỷ' }
];

export function PortalRevenueView() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');

  const { data: purchases = [], isLoading } = useQuery(
    myPurchasesQueryOptions({
      search: search.trim() || undefined,
      status: status === 'all' ? undefined : status,
      limit: 200
    })
  );

  const cancel = useMutation({
    ...cancelPurchaseMutation,
    onSuccess: (result) =>
      toast.success(
        `Đã huỷ đơn ${result.orderNumber}. Hoàn ${formatVnd(result.refundedVnd)} vào ví.`
      ),
    onError: (error: Error) => toast.error(error.message)
  });

  const totals = useMemo(
    () => ({
      listPriceVnd: purchases.reduce((sum, p) => sum + p.listPriceVnd, 0),
      walletCostVnd: purchases.reduce((sum, p) => sum + p.walletCostVnd, 0),
      marginVnd: purchases.reduce((sum, p) => sum + p.marginVnd, 0)
    }),
    [purchases]
  );

  return (
    <div className='flex flex-1 flex-col space-y-4'>
      <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
        <Card>
          <CardHeader>
            <CardDescription>Doanh thu bán ra</CardDescription>
            <CardTitle className='text-2xl font-semibold tabular-nums'>
              {isLoading ? '…' : formatVnd(totals.listPriceVnd)}
            </CardTitle>
            <p className='text-muted-foreground text-xs'>Tính theo giá niêm yết esim.vn</p>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Giá vốn đã trừ ví</CardDescription>
            <CardTitle className='text-2xl font-semibold tabular-nums'>
              {isLoading ? '…' : formatVnd(totals.walletCostVnd)}
            </CardTitle>
            <p className='text-muted-foreground text-xs'>Đã trừ các khoản hoàn eSIM lỗi</p>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Chênh lệch</CardDescription>
            <CardTitle
              className={`text-2xl font-semibold tabular-nums ${
                totals.marginVnd < 0 ? 'text-destructive' : ''
              }`}
            >
              {isLoading
                ? '…'
                : `${totals.marginVnd < 0 ? '−' : ''}${formatVnd(Math.abs(totals.marginVnd))}`}
            </CardTitle>
            <p className='text-muted-foreground text-xs'>Nếu bán đúng giá niêm yết</p>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dòng tiền theo từng đơn</CardTitle>
          <CardDescription>
            &ldquo;Doanh thu bán ra&rdquo; là giá niêm yết của esim.vn, không phải giá bạn bán cho
            khách của mình. Nếu bạn bán giá khác thì chênh lệch thực tế sẽ khác con số ở đây.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex flex-wrap items-center gap-2'>
            <Input
              placeholder='Tìm mã đơn hoặc tên gói'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className='max-w-[260px]'
            />
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className='w-[180px]'>
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
          </div>

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
                    <TableHead>Ngày</TableHead>
                    <TableHead>Mã đơn</TableHead>
                    <TableHead>Sản phẩm</TableHead>
                    <TableHead className='text-right'>Doanh thu bán ra</TableHead>
                    <TableHead className='text-right'>Giá vốn đã trừ ví</TableHead>
                    <TableHead className='text-right'>Chênh lệch</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className='text-right'>eSIM</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchases.map((purchase) => {
                    const badge = statusLabel[purchase.status] ?? {
                      label: purchase.status,
                      variant: 'outline' as const
                    };
                    // Đối tác chỉ tự huỷ được đơn chưa cấp eSIM nào (A5) —
                    // eSIM đã cấp là hàng đã giao, có thể đã bán đi rồi.
                    const canCancel =
                      purchase.esimCount === 0 &&
                      !['cancelled', 'refunded', 'failed'].includes(purchase.status);

                    return (
                      <TableRow key={purchase.orderNumber}>
                        <TableCell className='text-xs'>
                          {formatDateTimeVn(purchase.createdAt)}
                        </TableCell>
                        <TableCell className='font-mono text-xs'>
                          <div>{purchase.orderNumber}</div>
                          <div className='mt-1 flex gap-2'>
                            {purchase.esimCount > 0 && (
                              <a
                                className='text-primary text-xs underline'
                                href={`/api/partner-portal/purchases/${encodeURIComponent(
                                  purchase.orderNumber
                                )}/esims`}
                              >
                                Tải Excel
                              </a>
                            )}
                            {canCancel && (
                              <Button
                                variant='ghost'
                                size='sm'
                                className='text-destructive h-auto p-0 text-xs'
                                disabled={cancel.isPending}
                                onClick={() => cancel.mutate(purchase.orderNumber)}
                              >
                                Huỷ đơn
                              </Button>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className='max-w-[240px]'>
                          {purchase.items.length === 0 ? (
                            <span className='text-muted-foreground text-xs'>—</span>
                          ) : (
                            purchase.items.map((item, index) => (
                              <div key={`${purchase.orderNumber}-${index}`} className='text-xs'>
                                {item.planName ?? '—'}
                                {item.quantity > 1 ? ` ×${item.quantity}` : ''}
                              </div>
                            ))
                          )}
                        </TableCell>
                        <TableCell className='text-right tabular-nums'>
                          {formatVnd(purchase.listPriceVnd)}
                        </TableCell>
                        <TableCell className='text-right tabular-nums'>
                          −{formatVnd(purchase.walletCostVnd)}
                        </TableCell>
                        <TableCell className='text-right tabular-nums'>
                          <span
                            className={
                              purchase.marginVnd < 0 ? 'text-destructive' : 'text-green-600'
                            }
                          >
                            {purchase.marginVnd < 0 ? '−' : '+'}
                            {formatVnd(Math.abs(purchase.marginVnd))}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={badge.variant}>{badge.label}</Badge>
                        </TableCell>
                        <TableCell className='text-right tabular-nums'>
                          {purchase.esimCount}
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
