'use client';

/**
 * "Hoa hồng theo đơn" — one row per commission (doitac-1410 #056): partner
 * (a company by its own name), tier and rate, period, order, its value,
 * where the attribution came from, when it was placed, the commission, what
 * the system flagged, and the status.
 */

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import {
  PortalListPagination,
  type PortalPagination
} from '@/features/partner-portal/components/portal-list-pagination';
import { formatDateTimeVn, formatVnd } from '@/lib/format';
import { commissionRejectionText } from '@/lib/commission-rejection';
import { attributionWarningLabels } from '@/features/orders/components/order-detail-view';

import { commissionsQueryOptions } from '../api/queries';
import type { OrderPartnerCommission } from '../api/types';
import { CommissionRowActions } from './commission-row-actions';

const STATUS_LABEL: Record<string, string> = {
  pending: 'Chờ xác nhận (24h)',
  unpaid: 'Đơn chưa thanh toán',
  credited: 'Đã cộng vào ví',
  reversed: 'Đã hoàn',
  rejected: 'Bị loại hoa hồng'
};
const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive'> = {
  pending: 'secondary',
  credited: 'default',
  reversed: 'destructive',
  rejected: 'destructive'
};

/** The statuses a commission actually has (doitac-1410 #056). */
const STATUS_FILTERS = [
  { value: 'all', label: 'Tất cả trạng thái' },
  { value: 'pending', label: 'Chờ đơn thanh toán' },
  { value: 'credited', label: 'Đã cộng vào ví' },
  { value: 'reversed', label: 'Đã hoàn' },
  { value: 'rejected', label: 'Bị loại hoa hồng' }
];

/** The last twelve reconciliation periods, newest first (#064). */
function recentPeriods(): { value: string; label: string }[] {
  const now = new Date();
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return {
      value: `${d.getFullYear()}-${month}`,
      label: `Tháng ${month}/${d.getFullYear()}`
    };
  });
}

function sourceText(c: OrderPartnerCommission): string {
  if (c.source?.type === 'link') return `Link ${c.source.code}`;
  // Short, as asked: "MÃ: TESTMA" — a long code name made the cell long
  // (doitac-0911 #025).
  if (c.source?.type === 'coupon') return `MÃ: ${c.source.code}`;
  return 'Khách gắn với đối tác';
}

/** "Thông tin từ hệ thống": why it was refused, and what was flagged. */
function systemInfo(c: OrderPartnerCommission): string[] {
  const lines: string[] = [];
  if (c.rejectionReason)
    lines.push(commissionRejectionText(c.rejectionReason) ?? c.rejectionReason);
  for (const code of (c.attributionWarning ?? '').split(',').filter(Boolean)) {
    lines.push(attributionWarningLabels[code.trim()]?.badge ?? code.trim());
  }
  return lines;
}

export function CommissionsView() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [period, setPeriod] = useState('all');
  // Paged like the admin's tables, by the server (doitac-3010 #037).
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  const { data, isLoading } = useQuery(
    commissionsQueryOptions({
      page: pageIndex + 1,
      limit: pageSize,
      ...(search.trim() && { search: search.trim() }),
      ...(status !== 'all' && { status }),
      ...(period !== 'all' && { period })
    })
  );
  const commissions = data?.data ?? [];
  const totalCount = data?.totalCount ?? 0;
  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));
  const pagination: PortalPagination = {
    total: totalCount,
    pageIndex: Math.min(pageIndex, pageCount - 1),
    pageCount,
    pageSize,
    setPageIndex,
    setPageSize: (size: number) => {
      setPageSize(size);
      setPageIndex(0);
    }
  };

  return (
    <div className='space-y-4'>
      <div className='flex flex-wrap items-center gap-2'>
        <Input
          placeholder='Tìm tên, email, SĐT hoặc ID đối tác'
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPageIndex(0);
          }}
          className='max-w-[280px]'
          data-testid='commission-search'
        />
        <Select
          value={period}
          onValueChange={(value) => {
            setPeriod(value);
            setPageIndex(0);
          }}
        >
          <SelectTrigger className='w-[180px]' aria-label='Kỳ đối soát'>
            <SelectValue placeholder='Kỳ đối soát' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>Mọi kỳ đối soát</SelectItem>
            {recentPeriods().map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={status}
          onValueChange={(value) => {
            setStatus(value);
            setPageIndex(0);
          }}
        >
          <SelectTrigger
            className='w-[190px]'
            aria-label='Trạng thái'
            data-testid='commission-status'
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTERS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {/* One click back to the whole list (doitac-0911 #025). */}
        {(search.trim() || status !== 'all' || period !== 'all') && (
          <Button
            variant='outline'
            size='sm'
            className='h-9 border-dashed'
            onClick={() => {
              setSearch('');
              setStatus('all');
              setPeriod('all');
              setPageIndex(0);
            }}
            data-testid='commission-clear-filters'
          >
            <Icons.close className='size-4' />
            Xóa bộ lọc
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className='flex justify-center py-12'>
          <Icons.spinner className='h-6 w-6 animate-spin' />
        </div>
      ) : (
        // Header pinned while the list scrolls (doitac-3010 #037).
        <div
          className='max-h-[70vh] overflow-auto rounded-lg border'
          data-testid='commissions-table-scroll'
        >
          <Table>
            <TableHeader className='bg-muted sticky top-0 z-10 shadow-[0_1px_0_var(--border)] [&_th]:bg-muted'>
              <TableRow>
                <TableHead>Tên đối tác</TableHead>
                <TableHead>Hạng</TableHead>
                <TableHead>Kỳ đối soát</TableHead>
                <TableHead>Mã đơn hàng</TableHead>
                <TableHead className='text-right'>Doanh thu đơn</TableHead>
                <TableHead>Nguồn ghi nhận</TableHead>
                <TableHead>Thời gian đặt hàng</TableHead>
                <TableHead className='text-right'>Hoa hồng</TableHead>
                <TableHead>Thông tin từ hệ thống</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className='w-12 text-right'>Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody data-testid='commission-rows'>
              {commissions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={11} className='text-muted-foreground h-24 text-center'>
                    Chưa có hoa hồng nào.
                  </TableCell>
                </TableRow>
              )}
              {commissions.map((c) => {
                const info = systemInfo(c);
                const percent =
                  c.commissionPercentSnapshot != null && c.commissionPercentSnapshot !== ''
                    ? `${Number(c.commissionPercentSnapshot)}%`
                    : null;
                return (
                  <TableRow key={c.id}>
                    <TableCell className='text-xs'>
                      <Link
                        href={`/dashboard/partners/${c.partnerId}`}
                        className='font-medium hover:underline'
                      >
                        {c.partnerName ?? `Đối tác #${c.partnerId}`}
                      </Link>
                      <div className='text-muted-foreground font-mono'>#{c.partnerId}</div>
                    </TableCell>
                    <TableCell className='text-xs whitespace-nowrap'>
                      {c.tierSnapshot ?? '—'}
                      {percent && <span className='text-muted-foreground'> · {percent}</span>}
                    </TableCell>
                    <TableCell className='text-xs'>{c.period ?? '—'}</TableCell>
                    <TableCell className='font-mono text-xs'>
                      {c.orderNumber ? (
                        <Link
                          href={`/dashboard/orders/${encodeURIComponent(c.orderNumber)}`}
                          className='hover:underline'
                        >
                          {c.orderNumber}
                        </Link>
                      ) : (
                        `#${c.orderId}`
                      )}
                    </TableCell>
                    <TableCell className='text-right text-xs tabular-nums'>
                      {formatVnd(c.orderRevenueVnd ?? 0)}
                    </TableCell>
                    <TableCell className='text-xs'>{sourceText(c)}</TableCell>
                    <TableCell className='text-xs whitespace-nowrap'>
                      {formatDateTimeVn(c.orderAt ?? c.createdAt)}
                    </TableCell>
                    <TableCell className='text-right font-medium tabular-nums'>
                      {formatVnd(c.commissionVnd)}
                    </TableCell>
                    {/* A fixed width that wraps: table cells do not wrap by
                        default, so a long reason ran over the status badge
                        (doitac-0911 #025). */}
                    <TableCell className='w-[220px] max-w-[220px] min-w-[220px] text-xs whitespace-normal break-words'>
                      {info.length ? (
                        info.map((line) => (
                          <div key={line} className='text-destructive'>
                            {line}
                          </div>
                        ))
                      ) : (
                        <span className='text-muted-foreground'>—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[c.status]}>{STATUS_LABEL[c.status]}</Badge>
                    </TableCell>
                    {/* "Duyệt / Xoá hoa hồng" for one stuck waiting (vande-1411 #048). */}
                    <TableCell className='text-right'>
                      <CommissionRowActions commission={c} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
      {totalCount > 0 && (
        <PortalListPagination
          pagination={pagination}
          unit='hoa hồng'
          testId='commissions-pagination'
          pageSizes={[10, 20, 30, 40, 50, 100, 200]}
        />
      )}
    </div>
  );
}
