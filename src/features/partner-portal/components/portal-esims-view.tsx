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
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';

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

import { myEsimsQueryOptions } from '../api/queries';
import type { MyEsim } from '../api/types';
import { PLAN_TYPE_LABEL, yesNo } from './portal-catalogue-dialogs';
import {
  EsimRequestDialog,
  type EsimRequestTarget,
  type FaultKind,
  esimStatusLabel,
  formatData
} from './portal-esim-request-dialog';

const statusFilters = [
  { value: 'all', label: 'Tất cả trạng thái' },
  { value: 'available', label: 'Chưa kích hoạt' },
  { value: 'active', label: 'Đang dùng' },
  { value: 'expired', label: 'Đã hết hạn' },
  { value: 'deactivated', label: 'Đã ngừng' }
];

/** "Loại gói eSIM" (doitac-1410 #037). */
const PLAN_TYPE_FILTERS = [
  { value: 'all', label: 'Loại gói: tất cả' },
  { value: 'fixed', label: 'Cố định' },
  { value: 'daily', label: 'Theo ngày' },
  { value: 'unlimited', label: 'Không giới hạn' },
  { value: 'unlimited-reduce', label: 'Không giới hạn giảm tốc' }
];

export function PortalEsimsView() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  // Plan type, top-up and the created range (doitac-1410 #037).
  const [planType, setPlanType] = useState('all');
  const [topUp, setTopUp] = useState('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const filtered = Boolean(
    search.trim() || status !== 'all' || planType !== 'all' || topUp !== 'all' || from || to
  );
  /** eSIM đang được báo lỗi / xin hoàn tiền, hoặc null khi hộp thoại đóng (#046, A4; #038). */
  const [faulty, setFaulty] = useState<EsimRequestTarget | null>(null);

  const { data: esims = [], isLoading } = useQuery(
    myEsimsQueryOptions({
      search: search.trim() || undefined,
      status: status === 'all' ? undefined : status,
      limit: 200,
      ...(planType !== 'all' ? { planType } : {}),
      ...(topUp !== 'all' ? { topUp } : {}),
      ...(from ? { from } : {}),
      ...(to ? { to } : {})
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
          <div className='grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'>
            <Input
              placeholder='Tìm ICCID, mã đơn hoặc tên gói'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              data-testid='esim-search'
            />
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className='w-full' aria-label='Trạng thái'>
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
            <Select value={planType} onValueChange={setPlanType}>
              <SelectTrigger
                className='w-full'
                aria-label='Loại gói eSIM'
                data-testid='esim-plan-type'
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PLAN_TYPE_FILTERS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={topUp} onValueChange={setTopUp}>
              <SelectTrigger className='w-full' aria-label='Hỗ trợ topup' data-testid='esim-topup'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Hỗ trợ topup: tất cả</SelectItem>
                <SelectItem value='true'>Hỗ trợ topup: Có</SelectItem>
                <SelectItem value='false'>Hỗ trợ topup: Không</SelectItem>
              </SelectContent>
            </Select>
            <div className='flex min-w-0 items-center gap-2'>
              <span className='text-muted-foreground shrink-0 text-xs'>Tạo từ</span>
              <Input
                type='date'
                value={from}
                max={to || undefined}
                onChange={(e) => setFrom(e.target.value)}
                aria-label='Thời gian tạo từ'
                className='min-w-0 flex-1'
                data-testid='esim-from'
              />
            </div>
            <div className='flex min-w-0 items-center gap-2'>
              <span className='text-muted-foreground shrink-0 text-xs'>đến</span>
              <Input
                type='date'
                value={to}
                min={from || undefined}
                onChange={(e) => setTo(e.target.value)}
                aria-label='Thời gian tạo đến'
                className='min-w-0 flex-1'
                data-testid='esim-to'
              />
            </div>
          </div>
          {filtered && (
            <Button
              variant='ghost'
              size='sm'
              onClick={() => {
                setSearch('');
                setStatus('all');
                setPlanType('all');
                setTopUp('all');
                setFrom('');
                setTo('');
              }}
            >
              Xoá bộ lọc
            </Button>
          )}

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
                    <TableHead>Tên gói</TableHead>
                    <TableHead>Điểm đến</TableHead>
                    <TableHead>Mã đơn</TableHead>
                    <TableHead className='text-right'>Giá vốn</TableHead>
                    <TableHead>Loại gói</TableHead>
                    <TableHead>Dữ liệu đã dùng</TableHead>
                    <TableHead>Số ngày dùng</TableHead>
                    <TableHead>Call/SMS</TableHead>
                    <TableHead>Topup</TableHead>
                    <TableHead>Tiktok &amp; AI</TableHead>
                    <TableHead>Hoàn tiền</TableHead>
                    <TableHead>Kích hoạt</TableHead>
                    <TableHead>Hết hạn</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className='text-right'>Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {esims.map((esim) => {
                    const badge = esimStatusLabel[esim.status ?? ''] ?? {
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
                        <TableCell className='text-xs whitespace-nowrap'>
                          {PLAN_TYPE_LABEL[esim.planType ?? ''] ?? esim.planType ?? '—'}
                        </TableCell>
                        <TableCell className='text-xs whitespace-nowrap'>
                          {formatData(esim.dataUsed)} / {formatData(esim.dataTotal)}
                        </TableCell>
                        <TableCell className='text-xs tabular-nums'>
                          {esim.durationDays ? `${esim.durationDays} ngày` : '—'}
                        </TableCell>
                        <TableCell className='text-xs'>{yesNo(esim.hasCallSms)}</TableCell>
                        <TableCell className='text-xs'>{yesNo(esim.topUp)}</TableCell>
                        <TableCell className='text-xs'>{yesNo(esim.tiktokAi)}</TableCell>
                        <TableCell className='text-xs'>{yesNo(esim.refundable)}</TableCell>
                        <TableCell className='text-xs'>
                          {esim.activatedAt ? formatDateTimeVn(esim.activatedAt) : '—'}
                        </TableCell>
                        <TableCell className='text-xs'>
                          {esim.expiresAt ? formatDateTimeVn(esim.expiresAt) : '—'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={badge.variant}>{badge.label}</Badge>
                        </TableCell>
                        <TableCell className='text-right'>
                          {esim.iccid && esim.orderNumber ? (
                            <EsimActions
                              esim={esim}
                              onRequest={(kind) =>
                                setFaulty({
                                  iccid: esim.iccid!,
                                  orderNumber: esim.orderNumber!,
                                  kind
                                })
                              }
                            />
                          ) : (
                            <span className='text-muted-foreground text-xs'>—</span>
                          )}
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

      <EsimRequestDialog target={faulty} onClose={() => setFaulty(null)} />
    </div>
  );
}

/**
 * "Xem chi tiết", "Báo lỗi", "Yêu cầu hoàn tiền" on one eSIM (doitac-1410 #038).
 * A refunded eSIM, or one with a request still open, takes no new request; a
 * plan the supplier never refunds cannot ask for one.
 */
function EsimActions({ esim, onRequest }: { esim: MyEsim; onRequest: (kind: FaultKind) => void }) {
  const closed = esim.status === 'refunded';
  const pending = Boolean(esim.openReport);
  const blockedReason = closed
    ? 'eSIM đã được hoàn tiền'
    : pending
      ? 'Đang có yêu cầu chờ esim.vn xử lý'
      : undefined;
  return (
    <div className='flex flex-col items-end gap-1 whitespace-nowrap'>
      <Button variant='link' size='sm' className='h-auto p-0 text-xs' asChild>
        <Link href={`/dashboard/portal/esims/${encodeURIComponent(esim.iccid ?? '')}`}>
          Xem chi tiết
        </Link>
      </Button>
      <Button
        variant='ghost'
        size='sm'
        className='h-auto p-0 text-xs'
        disabled={closed || pending}
        title={blockedReason}
        onClick={() => onRequest('fault')}
      >
        Báo lỗi
      </Button>
      <Button
        variant='ghost'
        size='sm'
        className='h-auto p-0 text-xs'
        disabled={closed || pending || !esim.refundable}
        title={blockedReason ?? (esim.refundable ? undefined : 'Gói này không hỗ trợ hoàn tiền')}
        onClick={() => onRequest('refund')}
      >
        Yêu cầu hoàn tiền
      </Button>
      {pending && (
        <span className='text-muted-foreground text-[11px]'>
          {esim.openReport === 'refund' ? 'Đang chờ hoàn tiền' : 'Đang chờ xử lý lỗi'}
        </span>
      )}
    </div>
  );
}
