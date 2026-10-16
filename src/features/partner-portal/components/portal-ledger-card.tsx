'use client';

/**
 * "Lịch sử giao dịch" of the deposit wallet (doitac-1410 #031): filter by code,
 * kind and a from–to range, and export the very same view — with the deposit
 * and withdrawal histories on their own sheets — in one file.
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

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
import { Label } from '@/components/ui/label';
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
import { formatDateTimeVn, formatDateVn, formatVnd } from '@/lib/format';

import { myLedgerQueryOptions, myPayoutsQueryOptions } from '../api/queries';
import { myLedgerExportUrl } from '../api/service';
import type { MyLedgerFilters } from '../api/types';

const KINDS = [
  { value: 'all', label: 'Tất cả loại' },
  { value: 'purchase', label: 'Mua eSIM' },
  { value: 'refund', label: 'Hoàn tiền' },
  { value: 'deposit', label: 'Nạp tiền' },
  { value: 'payout', label: 'Rút tiền' },
  { value: 'adjustment', label: 'Điều chỉnh' }
];

export function PortalLedgerCard() {
  const [code, setCode] = useState('');
  const [kind, setKind] = useState('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const filters: MyLedgerFilters = {
    ...(code.trim() ? { code: code.trim() } : {}),
    ...(kind !== 'all' ? { kind } : {}),
    ...(from ? { from } : {}),
    ...(to ? { to } : {})
  };
  const { data: rows = [], isLoading } = useQuery(myLedgerQueryOptions(filters));
  const filtered = Object.keys(filters).length > 0;

  return (
    <Card data-testid='ledger-card'>
      <CardHeader>
        <CardTitle className='col-start-1 flex flex-wrap items-center gap-2'>
          Lịch sử giao dịch
          <Badge variant='outline'>{rows.length} giao dịch</Badge>
        </CardTitle>
        <CardDescription className='col-start-1'>
          Mọi khoản ghi có và ghi nợ trên ví ký quỹ. File xuất gồm cả lịch sử nạp tiền và rút tiền,
          mỗi phần một sheet.
        </CardDescription>
        <CardAction className='col-start-1 row-start-3 justify-self-start sm:col-start-2 sm:row-span-2 sm:row-start-1 sm:justify-self-end'>
          <Button asChild variant='outline' size='sm'>
            <a href={myLedgerExportUrl(filters)} data-testid='ledger-export'>
              <Icons.download className='size-4' />
              Xuất file
            </a>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4'>
          <div className='space-y-1.5'>
            <Label htmlFor='ledgerCode'>Mã giao dịch</Label>
            <Input
              id='ledgerCode'
              placeholder='Mã đơn, WD-…, mã đối chiếu'
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </div>
          <div className='space-y-1.5'>
            <Label htmlFor='ledgerKind'>Loại giao dịch</Label>
            <Select value={kind} onValueChange={setKind}>
              <SelectTrigger id='ledgerKind' className='w-full'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {KINDS.map((k) => (
                  <SelectItem key={k.value} value={k.value}>
                    {k.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className='min-w-0 space-y-1.5'>
            <Label htmlFor='ledgerFrom'>Từ ngày</Label>
            <Input
              id='ledgerFrom'
              type='date'
              value={from}
              max={to || undefined}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>
          <div className='min-w-0 space-y-1.5'>
            <Label htmlFor='ledgerTo'>Đến ngày</Label>
            <Input
              id='ledgerTo'
              type='date'
              value={to}
              min={from || undefined}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
        </div>
        {filtered && (
          <Button
            variant='ghost'
            size='sm'
            onClick={() => {
              setCode('');
              setKind('all');
              setFrom('');
              setTo('');
            }}
          >
            Xoá bộ lọc
          </Button>
        )}

        <div className='overflow-x-auto rounded-lg border'>
          <Table>
            <TableHeader className='bg-muted'>
              <TableRow>
                <TableHead>Thời điểm</TableHead>
                <TableHead>Loại giao dịch</TableHead>
                <TableHead>Mã giao dịch</TableHead>
                <TableHead>Nội dung</TableHead>
                <TableHead className='text-right'>Số tiền</TableHead>
                <TableHead className='text-right'>Số dư sau</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={6} className='text-muted-foreground h-24 text-center'>
                    Đang tải giao dịch…
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className='text-muted-foreground h-24 text-center'>
                    {filtered ? 'Không có giao dịch nào khớp bộ lọc.' : 'Chưa có giao dịch nào.'}
                  </TableCell>
                </TableRow>
              )}
              {rows.map((row) => {
                const credit = row.amountVnd > 0;
                return (
                  <TableRow key={row.id}>
                    <TableCell className='whitespace-nowrap'>
                      {formatDateTimeVn(row.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Badge variant='outline'>{row.kindLabel}</Badge>
                    </TableCell>
                    <TableCell className='font-mono text-xs whitespace-nowrap'>
                      {row.code ?? '—'}
                    </TableCell>
                    <TableCell className='min-w-[220px]'>{row.description}</TableCell>
                    <TableCell className='text-right whitespace-nowrap'>
                      <span
                        className={
                          credit
                            ? 'font-medium tabular-nums text-emerald-600 dark:text-emerald-400'
                            : 'font-medium tabular-nums text-red-600 dark:text-red-400'
                        }
                      >
                        {credit ? '+' : ''}
                        {formatVnd(row.amountVnd)}
                      </span>
                    </TableCell>
                    <TableCell className='text-right tabular-nums whitespace-nowrap'>
                      {formatVnd(row.balanceAfterVnd)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

const PAYOUT_STATUS: Record<string, { label: string; className: string }> = {
  pending: {
    label: 'Chờ duyệt',
    className:
      'border-orange-200 bg-orange-100 text-orange-800 dark:border-orange-900 dark:bg-orange-950 dark:text-orange-300'
  },
  approved: {
    label: 'Đã duyệt',
    className:
      'border-blue-200 bg-blue-100 text-blue-800 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300'
  },
  paid: {
    label: 'Đã chuyển',
    className:
      'border-emerald-200 bg-emerald-100 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300'
  },
  rejected: {
    label: 'Bị từ chối',
    className:
      'border-red-200 bg-red-100 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300'
  }
};

/** "Lịch sử rút tiền" under the deposits (doitac-1410 #031). */
export function PortalPayoutHistoryCard() {
  const { data: payouts = [] } = useQuery(myPayoutsQueryOptions());
  return (
    <Card data-testid='payout-history'>
      <CardHeader>
        <CardTitle className='flex flex-wrap items-center gap-2'>
          Lịch sử rút tiền
          <Badge variant='outline'>{payouts.length} yêu cầu</Badge>
        </CardTitle>
        <CardDescription>Các yêu cầu rút ký quỹ và hoa hồng, và trạng thái xử lý.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className='overflow-x-auto rounded-lg border'>
          <Table>
            <TableHeader className='bg-muted'>
              <TableRow>
                <TableHead>Mã yêu cầu</TableHead>
                <TableHead>Ngày tạo</TableHead>
                <TableHead className='text-right'>Số tiền</TableHead>
                <TableHead>Tài khoản nhận</TableHead>
                <TableHead>Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payouts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className='text-muted-foreground h-24 text-center'>
                    Chưa có yêu cầu rút tiền nào.
                  </TableCell>
                </TableRow>
              )}
              {payouts.map((p) => {
                const status = PAYOUT_STATUS[p.status];
                return (
                  <TableRow key={p.id}>
                    <TableCell className='font-mono text-xs'>
                      WD-{String(p.id).padStart(6, '0')}
                    </TableCell>
                    <TableCell className='whitespace-nowrap'>{formatDateVn(p.createdAt)}</TableCell>
                    <TableCell className='text-right font-medium tabular-nums'>
                      {formatVnd(p.amountVnd)}
                    </TableCell>
                    <TableCell className='text-muted-foreground text-xs'>
                      {p.bankAccountInfo || '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant='outline' className={status?.className}>
                        {status?.label ?? p.status}
                      </Badge>
                      {p.status === 'rejected' && p.adminNote && (
                        <p className='text-destructive mt-1 max-w-[280px] text-xs'>{p.adminNote}</p>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
