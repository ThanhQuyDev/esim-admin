'use client';

/**
 * The deleted links and the per-channel figures of the marketing link page
 * (doitac-1410 #019, figures 3 and 4 of the brief).
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
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
  TableFooter,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { formatDateTimeVn, formatDateVn, formatVnd } from '@/lib/format';

import { myChannelPerformanceQueryOptions } from '../api/queries';
import type { MyLink } from '../api/types';
import {
  CHANNELS,
  LINK_PERIODS,
  type LinkPeriod,
  channelOf,
  landingOf,
  periodRange,
  shortLinkOf
} from './portal-link-utils';

const DAY = 24 * 60 * 60 * 1000;

/** "Link đã xóa" — figure 3. */
export function DeletedLinksTable({
  links,
  isLoading,
  onDetail,
  onRestore,
  onRequestRestore,
  restoring
}: {
  links: MyLink[];
  isLoading: boolean;
  onDetail: (link: MyLink) => void;
  onRestore: (link: MyLink) => void;
  onRequestRestore: (link: MyLink) => void;
  restoring: boolean;
}) {
  return (
    <div className='space-y-2' data-testid='deleted-links'>
      <p className='text-muted-foreground text-xs'>
        Link đã xóa vẫn cộng vào tổng số liệu. Khôi phục được trong 30 ngày; tên link được giữ chỗ
        vĩnh viễn.
      </p>
      <div className='overflow-x-auto rounded-lg border'>
        <Table>
          <TableHeader className='bg-muted'>
            <TableRow>
              <TableHead>Tên liên kết</TableHead>
              <TableHead>Trang đích</TableHead>
              <TableHead>Link tiếp thị</TableHead>
              <TableHead>Kênh quảng bá</TableHead>
              <TableHead>Xóa lúc · bởi</TableHead>
              <TableHead>Hạn khôi phục</TableHead>
              <TableHead className='text-right'>Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={7} className='text-muted-foreground h-20 text-center'>
                  Đang tải…
                </TableCell>
              </TableRow>
            )}
            {!isLoading && links.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className='text-muted-foreground h-20 text-center'>
                  Chưa có liên kết nào bị xóa.
                </TableCell>
              </TableRow>
            )}
            {links.map((l) => {
              const until = l.restorableUntil ? new Date(l.restorableUntil) : null;
              const daysLeft = until ? Math.ceil((until.getTime() - Date.now()) / DAY) : 0;
              return (
                <TableRow key={l.id} data-testid={`deleted-row-${l.id}`}>
                  <TableCell className='font-medium'>{l.label}</TableCell>
                  <TableCell className='text-muted-foreground max-w-[180px] truncate text-xs'>
                    {landingOf(l.targetPath)}
                  </TableCell>
                  <TableCell className='font-mono text-xs whitespace-nowrap'>
                    {shortLinkOf(l.code)}
                  </TableCell>
                  <TableCell className='text-xs'>{channelOf(l.targetPath)}</TableCell>
                  <TableCell className='text-xs whitespace-nowrap'>
                    <span className='block'>
                      {l.deletedAt ? formatDateTimeVn(l.deletedAt) : '—'}
                    </span>
                    <span className='text-muted-foreground block'>
                      bởi {l.deletedBy === 'admin' ? 'esim.vn' : 'Bạn'}
                    </span>
                  </TableCell>
                  <TableCell className='text-xs whitespace-nowrap'>
                    <span className='block'>{until ? formatDateVn(until.toISOString()) : '—'}</span>
                    <span className='text-muted-foreground block'>
                      {daysLeft > 0 ? `còn ${daysLeft} ngày` : 'đã quá hạn'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className='flex justify-end gap-1'>
                      <Button size='sm' variant='outline' onClick={() => onDetail(l)}>
                        Chi tiết
                      </Button>
                      {l.restoreRequestedAt ? (
                        <Button size='sm' disabled>
                          Đang chờ admin phê duyệt
                        </Button>
                      ) : l.canSelfRestore ? (
                        <Button size='sm' disabled={restoring} onClick={() => onRestore(l)}>
                          Khôi phục
                        </Button>
                      ) : (
                        <Button size='sm' variant='secondary' onClick={() => onRequestRestore(l)}>
                          Gửi yêu cầu khôi phục
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

const channelName = (value: string) =>
  CHANNELS.find((c) => c.value === value)?.label ?? (value === 'other' ? 'Kênh khác' : value);

const pct = (v: number) => `${v.toLocaleString('vi-VN', { maximumFractionDigits: 1 })}%`;

/** "Hiệu suất theo kênh" — figure 4. */
export function ChannelPerformanceCard() {
  const [period, setPeriod] = useState<LinkPeriod>('month');
  const { data, isLoading } = useQuery(myChannelPerformanceQueryOptions(periodRange(period)));
  const periodLabel = LINK_PERIODS.find((p) => p.value === period)?.label ?? '';

  return (
    <Card data-testid='channel-performance'>
      <CardHeader>
        <CardTitle>Hiệu suất theo kênh</CardTitle>
        <CardDescription>
          Tổng hợp doanh thu quy đổi và hoa hồng theo từng kênh quảng bá. Kỳ thống kê:{' '}
          <span className='font-medium'>{periodLabel}</span>. Tỷ lệ chuyển đổi = số đơn ÷ số click
          hợp lệ × 100% — tỷ lệ cao nghĩa là người bấm link của kênh đó dễ mua hơn, kênh đó đáng đầu
          tư thêm.
        </CardDescription>
        <CardAction>
          <Select value={period} onValueChange={(v) => setPeriod(v as LinkPeriod)}>
            <SelectTrigger className='w-[150px]' aria-label='Kỳ thống kê'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LINK_PERIODS.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className='overflow-x-auto rounded-lg border'>
          <Table>
            <TableHeader className='bg-muted'>
              <TableRow>
                <TableHead>Kênh</TableHead>
                <TableHead className='text-right'>Doanh thu quy đổi</TableHead>
                <TableHead className='text-right'>Hoa hồng</TableHead>
                <TableHead className='text-right'>Tỷ lệ chuyển đổi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={4} className='text-muted-foreground h-16 text-center'>
                    Đang tải…
                  </TableCell>
                </TableRow>
              )}
              {data?.channels.map((c) => (
                <TableRow key={c.channel}>
                  <TableCell>
                    {channelName(c.channel)}
                    <span className='text-muted-foreground'> · {c.links} link</span>
                  </TableCell>
                  <TableCell className='text-right tabular-nums'>
                    {formatVnd(c.revenueVnd)}
                  </TableCell>
                  <TableCell className='text-right tabular-nums'>
                    {formatVnd(c.commissionVnd)}
                  </TableCell>
                  <TableCell className='text-right tabular-nums'>
                    {pct(c.conversionPercent)}
                    <span className='text-muted-foreground block text-xs'>
                      {c.orders} đơn / {c.clicks} click
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            {data && data.channels.length > 0 && (
              <TableFooter>
                <TableRow className='font-semibold'>
                  <TableCell>Tổng</TableCell>
                  <TableCell className='text-right tabular-nums'>
                    {formatVnd(data.total.revenueVnd)}
                  </TableCell>
                  <TableCell className='text-right tabular-nums'>
                    {formatVnd(data.total.commissionVnd)}
                  </TableCell>
                  <TableCell className='text-right tabular-nums'>
                    {pct(data.total.conversionPercent)}
                  </TableCell>
                </TableRow>
              </TableFooter>
            )}
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
