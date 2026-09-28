'use client';

/**
 * A distribution partner's eSIM stock — "Quản lý eSIM" (#046).
 *
 * The one screen a marketing partner has no equivalent of: they never hold
 * stock, they never touch an eSIM. A distribution partner does, so they need to
 * see which of the eSIMs they paid for the customer has switched on, which are
 * still sitting unused, and which have run out — an unactivated eSIM is money
 * spent that has not come back yet.
 */

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { Badge } from '@/components/ui/badge';
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

import { myEsimsQueryOptions } from '../api/queries';

/** How the provider's status words read to a partner counting stock. */
const statusLabel: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }
> = {
  available: { label: 'Chưa kích hoạt', variant: 'outline' },
  active: { label: 'Đang dùng', variant: 'default' },
  expired: { label: 'Đã hết hạn', variant: 'destructive' },
  deactivated: { label: 'Đã ngừng', variant: 'secondary' }
};

const statusFilters = [
  { value: 'all', label: 'Tất cả trạng thái' },
  { value: 'available', label: 'Chưa kích hoạt' },
  { value: 'active', label: 'Đang dùng' },
  { value: 'expired', label: 'Đã hết hạn' },
  { value: 'deactivated', label: 'Đã ngừng' }
];

/** Provider figures are in MB; a partner reads GB. */
function formatData(mb: number | null): string {
  if (mb == null) return '—';
  if (mb >= 1024) return `${(mb / 1024).toFixed(1).replace('.0', '')} GB`;
  return `${Math.round(mb)} MB`;
}

export function PortalEsimsView() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');

  const { data: esims = [], isLoading } = useQuery(
    myEsimsQueryOptions({
      search: search.trim() || undefined,
      status: status === 'all' ? undefined : status,
      limit: 200
    })
  );

  const totals = useMemo(() => {
    const activated = esims.filter((e) => e.activatedAt).length;
    return {
      count: esims.length,
      activated,
      idle: esims.length - activated,
      costVnd: esims.reduce((sum, e) => sum + e.costVnd, 0)
    };
  }, [esims]);

  return (
    <div className='flex flex-1 flex-col space-y-4'>
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4'>
        <Card>
          <CardHeader>
            <CardDescription>eSIM đã lấy hàng</CardDescription>
            <CardTitle className='text-2xl font-semibold tabular-nums'>
              {isLoading ? '…' : totals.count.toLocaleString('vi-VN')}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Đã kích hoạt</CardDescription>
            <CardTitle className='text-2xl font-semibold tabular-nums'>
              {isLoading ? '…' : totals.activated.toLocaleString('vi-VN')}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Chưa kích hoạt</CardDescription>
            <CardTitle className='text-2xl font-semibold tabular-nums'>
              {isLoading ? '…' : totals.idle.toLocaleString('vi-VN')}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Giá trị đã chi</CardDescription>
            <CardTitle className='text-2xl font-semibold tabular-nums'>
              {isLoading ? '…' : formatVnd(totals.costVnd)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách eSIM</CardTitle>
          <CardDescription>
            eSIM từ các đơn bạn đã mua. Số liệu dung lượng do nhà mạng cập nhật nên có thể chậm hơn
            thực tế vài phút.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex flex-wrap items-center gap-2'>
            <Input
              placeholder='Tìm ICCID, mã đơn hoặc tên gói'
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
          ) : esims.length === 0 ? (
            <p className='text-muted-foreground py-12 text-center text-sm'>
              Chưa có eSIM nào khớp với tìm kiếm này.
            </p>
          ) : (
            <div className='overflow-x-auto'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ICCID</TableHead>
                    <TableHead>Gói</TableHead>
                    <TableHead>Điểm đến</TableHead>
                    <TableHead>Mã đơn</TableHead>
                    <TableHead className='text-right'>Giá vốn</TableHead>
                    <TableHead>Dung lượng</TableHead>
                    <TableHead>Kích hoạt</TableHead>
                    <TableHead>Hết hạn</TableHead>
                    <TableHead>Trạng thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {esims.map((esim) => {
                    const badge = statusLabel[esim.status ?? ''] ?? {
                      label: esim.status ?? '—',
                      variant: 'outline' as const
                    };
                    return (
                      <TableRow key={`${esim.iccid}-${esim.orderNumber}`}>
                        <TableCell className='font-mono text-xs'>{esim.iccid ?? '—'}</TableCell>
                        <TableCell>{esim.planName ?? '—'}</TableCell>
                        <TableCell>{esim.destination ?? '—'}</TableCell>
                        <TableCell className='font-mono text-xs'>
                          {esim.orderNumber ?? '—'}
                        </TableCell>
                        <TableCell className='text-right tabular-nums'>
                          {formatVnd(esim.costVnd)}
                        </TableCell>
                        <TableCell className='text-xs'>
                          {formatData(esim.dataUsed)} / {formatData(esim.dataTotal)}
                        </TableCell>
                        <TableCell className='text-xs'>
                          {esim.activatedAt ? formatDateTimeVn(esim.activatedAt) : '—'}
                        </TableCell>
                        <TableCell className='text-xs'>
                          {esim.expiresAt ? formatDateTimeVn(esim.expiresAt) : '—'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={badge.variant}>{badge.label}</Badge>
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
