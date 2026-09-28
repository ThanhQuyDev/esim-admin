'use client';

/**
 * "Đơn hàng đối tác" (#071).
 *
 * One tab per partner type, because "đơn hàng" means two different things: for
 * a marketing partner it is somebody else's order credited to them, for a
 * distribution partner it is an order they placed themselves. Both tabs read
 * the same endpoints the partners' own screens read, so a partner disputing a
 * figure and the admin looking it up cannot be shown different numbers.
 */

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Icons } from '@/components/icons';
import { formatDateTimeVn, formatVnd } from '@/lib/format';

import { partnerOptionsQueryOptions, partnerOrdersQueryOptions } from '../api/queries';
import type { AdminDistributionOrderRow, AdminMarketingOrderRow } from '../api/types';

const ORDER_STATUS = [
  { value: 'all', label: 'Tất cả trạng thái' },
  { value: 'pending', label: 'Chờ thanh toán' },
  { value: 'paid', label: 'Đã thanh toán' },
  { value: 'completed', label: 'Hoàn thành' },
  { value: 'cancelled', label: 'Đã huỷ' },
  { value: 'refunded', label: 'Đã hoàn tiền' }
];

const COMMISSION_STATUS_LABEL: Record<string, string> = {
  pending: 'Chờ xác nhận',
  credited: 'Đã cộng ví',
  reversed: 'Đã hoàn',
  rejected: 'Bị loại'
};

const productsOf = (items: { planName: string | null; quantity: number }[]) =>
  items.map((item) => `${item.planName ?? '—'} ×${item.quantity}`).join(', ') || '—';

export function PartnerOrdersView() {
  return (
    <Tabs defaultValue='kol' className='space-y-4'>
      <TabsList>
        <TabsTrigger value='kol'>Đối tác tiếp thị</TabsTrigger>
        <TabsTrigger value='distribution'>Đối tác phân phối</TabsTrigger>
      </TabsList>
      <TabsContent value='kol'>
        <OrdersTab partnerType='kol' />
      </TabsContent>
      <TabsContent value='distribution'>
        <OrdersTab partnerType='distribution' />
      </TabsContent>
    </Tabs>
  );
}

function OrdersTab({ partnerType }: { partnerType: 'kol' | 'distribution' }) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [partnerId, setPartnerId] = useState('all');

  const filters = useMemo(
    () => ({
      partnerType,
      limit: 200,
      ...(search.trim() && { search: search.trim() }),
      ...(status !== 'all' && { status }),
      ...(partnerId !== 'all' && { partnerId: Number(partnerId) })
    }),
    [partnerType, search, status, partnerId]
  );

  const { data: options = [] } = useQuery(partnerOptionsQueryOptions(partnerType));
  const distribution = partnerType === 'distribution';
  // One endpoint, two row shapes: which one comes back is decided by the tab,
  // so the query is typed as either and each table narrows it.
  const { data, isLoading } = useQuery(
    partnerOrdersQueryOptions<AdminMarketingOrderRow | AdminDistributionOrderRow>(filters)
  );
  const rows = data ?? [];

  return (
    <div className='space-y-4'>
      <div className='flex flex-wrap items-center gap-2'>
        <Input
          placeholder='Tìm mã đơn hàng hoặc mã giảm giá'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className='max-w-[280px]'
        />
        {/* The extra select box the brief asks for: the same filters the
            partner has, plus "whose orders am I looking at". */}
        <Select value={partnerId} onValueChange={setPartnerId}>
          <SelectTrigger className='w-[240px]'>
            <SelectValue placeholder='Lọc theo đối tác' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>Tất cả đối tác</SelectItem>
            {options.map((option) => (
              <SelectItem key={option.id} value={String(option.id)}>
                {option.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className='w-[180px]'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ORDER_STATUS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant='outline'
          className='ml-auto'
          onClick={() => {
            const query = new URLSearchParams(
              Object.entries(filters).reduce<Record<string, string>>((acc, [k, v]) => {
                if (k !== 'limit') acc[k] = String(v);
                return acc;
              }, {})
            ).toString();
            window.location.href = `/api/partners/orders/export-excel?${query}`;
          }}
        >
          <Icons.download className='mr-2 h-4 w-4' />
          Xuất file
        </Button>
      </div>

      {isLoading ? (
        <div className='flex justify-center py-12'>
          <Icons.spinner className='h-6 w-6 animate-spin' />
        </div>
      ) : rows.length === 0 ? (
        <p className='text-muted-foreground py-12 text-center text-sm'>
          Không có đơn hàng nào khớp bộ lọc.
        </p>
      ) : (
        <div className='rounded-lg border'>
          {distribution ? (
            <DistributionTable rows={rows as AdminDistributionOrderRow[]} />
          ) : (
            <MarketingTable rows={rows as AdminMarketingOrderRow[]} />
          )}
        </div>
      )}
    </div>
  );
}

/** The affiliate tab: somebody else's order, credited to a partner. */
function MarketingTable({ rows }: { rows: AdminMarketingOrderRow[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Mã đơn hàng</TableHead>
          <TableHead>Đối tác</TableHead>
          <TableHead>Sản phẩm</TableHead>
          <TableHead className='text-right'>Doanh thu</TableHead>
          <TableHead>Nguồn ghi nhận</TableHead>
          <TableHead>Khách hàng</TableHead>
          <TableHead className='text-right'>eSIM</TableHead>
          <TableHead className='text-right'>Hoa hồng</TableHead>
          <TableHead>Trạng thái</TableHead>
          <TableHead>Ngày đặt</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.orderNumber}>
            <TableCell className='font-mono text-xs'>{row.orderNumber}</TableCell>
            <TableCell>
              <div className='text-sm font-medium'>
                {row.partnerName ?? `Đối tác #${row.partnerId}`}
              </div>
              <div className='text-muted-foreground text-xs'>#{row.partnerId}</div>
            </TableCell>
            <TableCell className='max-w-[220px] text-sm'>{productsOf(row.items)}</TableCell>
            <TableCell className='text-right tabular-nums'>{formatVnd(row.vndPrice)}</TableCell>
            <TableCell className='text-sm'>
              {row.linkCode ? (
                <Badge variant='outline'>Link {row.linkCode}</Badge>
              ) : row.couponCode ? (
                <Badge variant='outline'>Mã {row.couponCode}</Badge>
              ) : (
                <span className='text-muted-foreground'>—</span>
              )}
            </TableCell>
            <TableCell className='text-sm'>
              {row.customerType === 'new' ? 'Khách mới' : 'Khách cũ'}
            </TableCell>
            <TableCell className='text-right tabular-nums'>{row.esimCount}</TableCell>
            <TableCell className='text-right tabular-nums'>
              {row.commissionVnd == null ? (
                <span className='text-muted-foreground'>—</span>
              ) : (
                <>
                  {formatVnd(row.commissionVnd)}
                  {row.commissionPercent != null && (
                    <span className='text-muted-foreground text-xs'>
                      {' '}
                      ({row.commissionPercent}%)
                    </span>
                  )}
                </>
              )}
            </TableCell>
            <TableCell>
              <Badge variant='outline'>{row.status}</Badge>
              {row.commissionStatus && (
                <div className='text-muted-foreground mt-1 text-xs'>
                  {COMMISSION_STATUS_LABEL[row.commissionStatus] ?? row.commissionStatus}
                </div>
              )}
            </TableCell>
            <TableCell className='text-sm whitespace-nowrap'>
              {formatDateTimeVn(row.createdAt)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

/** The distribution tab: an order the partner placed themselves. */
function DistributionTable({ rows }: { rows: AdminDistributionOrderRow[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Mã đơn hàng</TableHead>
          <TableHead>Đối tác</TableHead>
          <TableHead>Sản phẩm</TableHead>
          <TableHead className='text-right'>Giá niêm yết</TableHead>
          <TableHead className='text-right'>Đã thanh toán</TableHead>
          <TableHead className='text-right'>Hoàn tiền</TableHead>
          <TableHead className='text-right'>eSIM</TableHead>
          <TableHead>Trạng thái</TableHead>
          <TableHead>Ngày đặt</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.orderNumber}>
            <TableCell className='font-mono text-xs'>{row.orderNumber}</TableCell>
            <TableCell>
              <div className='text-sm font-medium'>
                {row.partnerName ?? `Đối tác #${row.partnerId}`}
              </div>
              <div className='text-muted-foreground text-xs'>#{row.partnerId}</div>
            </TableCell>
            <TableCell className='max-w-[220px] text-sm'>{productsOf(row.items)}</TableCell>
            <TableCell className='text-muted-foreground text-right tabular-nums'>
              {formatVnd(row.listVnd)}
            </TableCell>
            <TableCell className='text-right font-medium tabular-nums'>
              {formatVnd(row.paidVnd)}
            </TableCell>
            <TableCell className='text-right tabular-nums'>
              {row.refundedVnd > 0 ? (
                <span className='text-destructive'>{formatVnd(row.refundedVnd)}</span>
              ) : (
                <span className='text-muted-foreground'>—</span>
              )}
            </TableCell>
            <TableCell className='text-right tabular-nums'>{row.esimCount}</TableCell>
            <TableCell>
              <Badge variant='outline'>{row.status}</Badge>
            </TableCell>
            <TableCell className='text-sm whitespace-nowrap'>
              {formatDateTimeVn(row.createdAt)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
