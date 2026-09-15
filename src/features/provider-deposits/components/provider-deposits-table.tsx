'use client';

import { useState } from 'react';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Icons } from '@/components/icons';
import { formatDate, formatVnd } from '@/lib/format';
import { PROVIDER_LABELS } from '@/features/overview/api/constants';
import { providerDepositSummaryQueryOptions } from '../api/queries';
import { ProviderDepositFormDialog } from './provider-deposit-form-dialog';
import { ProviderDepositEntriesDialog } from './provider-deposit-entries-dialog';
import type { ProviderDepositSummary } from '../api/types';

/**
 * How far the supplier's own figure is from ours. Anything non-zero is worth
 * chasing, so it is coloured rather than left as one more number in a row.
 */
function DriftCell({ row }: { row: ProviderDepositSummary }) {
  if (row.differenceVnd === null) {
    return <span className='text-muted-foreground text-sm'>Chưa đối soát</span>;
  }

  if (row.differenceVnd === 0) {
    return (
      <Badge variant='default' className='gap-1'>
        <Icons.check className='h-3 w-3' />
        Khớp
      </Badge>
    );
  }

  return (
    <Badge variant='destructive' className='font-mono'>
      {row.differenceVnd > 0 ? '+' : ''}
      {formatVnd(row.differenceVnd)}
    </Badge>
  );
}

export function ProviderDepositsTable() {
  const { data } = useSuspenseQuery(providerDepositSummaryQueryOptions());
  const [entryProvider, setEntryProvider] = useState<string | null>(null);
  const [historyProvider, setHistoryProvider] = useState<string | null>(null);

  const rows = data.data;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Ký quỹ theo nhà cung cấp</CardTitle>
          <CardDescription>
            &quot;Đã dùng&quot; được cộng tự động từ giá vốn của các đơn đã hoàn tất, nên số dư dự
            kiến luôn khớp với trang Tổng quan. Cột chênh lệch so số dư đối tác báo với số dư dự
            kiến.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='overflow-x-auto'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nhà cung cấp</TableHead>
                  <TableHead className='text-right'>Đã ký quỹ</TableHead>
                  <TableHead className='text-right'>Đã dùng</TableHead>
                  <TableHead className='text-right'>Số dư dự kiến</TableHead>
                  <TableHead className='text-right'>Nhà cung cấp báo</TableHead>
                  <TableHead>Chênh lệch</TableHead>
                  <TableHead>Đối soát lúc</TableHead>
                  <TableHead className='text-right'>Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className='text-muted-foreground py-10 text-center'>
                      Chưa có dữ liệu. Bấm &quot;Ghi nhận ký quỹ&quot; để nhập số tiền đã chuyển cho
                      nhà cung cấp.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row) => (
                    <TableRow key={row.provider}>
                      <TableCell className='font-medium'>
                        {PROVIDER_LABELS[row.provider] ?? row.provider}
                      </TableCell>
                      <TableCell className='text-right font-mono'>
                        {formatVnd(row.totalDepositedVnd)}
                      </TableCell>
                      <TableCell className='text-right font-mono'>
                        {formatVnd(row.totalSpentVnd)}
                      </TableCell>
                      <TableCell
                        className={`text-right font-mono font-medium ${
                          row.expectedBalanceVnd < 0 ? 'text-destructive' : ''
                        }`}
                      >
                        {formatVnd(row.expectedBalanceVnd)}
                      </TableCell>
                      <TableCell className='text-right font-mono'>
                        {row.reportedBalanceVnd === null ? '—' : formatVnd(row.reportedBalanceVnd)}
                      </TableCell>
                      <TableCell>
                        <DriftCell row={row} />
                      </TableCell>
                      <TableCell className='text-muted-foreground text-sm'>
                        {row.reportedAt ? formatDate(row.reportedAt) : '—'}
                      </TableCell>
                      <TableCell className='text-right whitespace-nowrap'>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => setHistoryProvider(row.provider)}
                        >
                          Lịch sử ({row.entryCount})
                        </Button>
                        <Button
                          variant='outline'
                          size='sm'
                          className='ml-2'
                          onClick={() => setEntryProvider(row.provider)}
                        >
                          Ghi nhận
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {entryProvider && (
        <ProviderDepositFormDialog
          key={entryProvider}
          provider={entryProvider}
          open
          onOpenChange={(open) => !open && setEntryProvider(null)}
        />
      )}

      {historyProvider && (
        <ProviderDepositEntriesDialog
          key={historyProvider}
          provider={historyProvider}
          open
          onOpenChange={(open) => !open && setHistoryProvider(null)}
        />
      )}
    </>
  );
}

export function ProviderDepositsTableSkeleton() {
  return (
    <div className='flex flex-1 animate-pulse flex-col gap-4'>
      <div className='bg-muted h-10 w-full rounded' />
      <div className='bg-muted h-96 w-full rounded-lg' />
    </div>
  );
}
