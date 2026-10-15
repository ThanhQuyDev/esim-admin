'use client';

/**
 * "Lịch sử giao dịch" on a marketing partner's Thanh toán page
 * (doitac-1410 #004).
 *
 * The marketing side had nowhere to show an admin adjusting the commission, so
 * a deduction simply appeared as a smaller balance. This is the same ledger a
 * distribution partner reads on their wallet page — every credit and debit,
 * with the reason the admin had to give.
 */

import { useQuery } from '@tanstack/react-query';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { formatDateTimeVn, formatVnd } from '@/lib/format';

import { myWalletTransactionsQueryOptions } from '../api/queries';

/** What a line is, when it carries no reason of its own. */
const TYPE_LABEL: Record<string, string> = {
  commission_earned: 'Hoa hồng được duyệt',
  commission_reversed: 'Thu hồi hoa hồng (đơn hoàn/hủy)',
  payout: 'Rút tiền',
  payout_rejected: 'Hoàn lại yêu cầu rút bị từ chối',
  manual_credit: 'esim.vn cộng tiền',
  manual_debit: 'esim.vn trừ tiền',
  deposit: 'Nạp ký quỹ'
};

export function PortalTransactionHistoryCard() {
  const { data: transactions = [], isLoading } = useQuery(myWalletTransactionsQueryOptions());

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lịch sử giao dịch</CardTitle>
        <CardDescription>
          Mọi khoản cộng/trừ vào số tiền hoa hồng, kể cả các lần esim.vn điều chỉnh kèm lý do.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className='overflow-x-auto rounded-lg border'>
          <Table>
            <TableHeader className='bg-muted'>
              <TableRow>
                <TableHead>Thời điểm</TableHead>
                <TableHead>Nội dung</TableHead>
                <TableHead className='text-right'>Số tiền</TableHead>
                <TableHead className='text-right'>Số dư sau</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={4} className='text-muted-foreground h-24 text-center'>
                    Đang tải giao dịch…
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && transactions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className='h-24 text-center'>
                    <p className='text-muted-foreground text-sm'>Chưa có giao dịch nào.</p>
                  </TableCell>
                </TableRow>
              )}
              {transactions.map((tx) => {
                const amount = Number(tx.amountVnd);
                const isCredit = amount > 0;
                const label = TYPE_LABEL[tx.type] ?? tx.type;
                return (
                  <TableRow key={tx.id}>
                    <TableCell className='whitespace-nowrap'>
                      {formatDateTimeVn(tx.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div className='flex flex-col'>
                        <span className='text-sm'>{label}</span>
                        {tx.reason && tx.reason !== label && (
                          <span className='text-muted-foreground text-xs'>{tx.reason}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className='text-right'>
                      <span
                        className={
                          isCredit
                            ? 'font-medium tabular-nums text-emerald-600 dark:text-emerald-400'
                            : 'font-medium tabular-nums text-red-600 dark:text-red-400'
                        }
                      >
                        {isCredit ? '+' : ''}
                        {formatVnd(amount)}
                      </span>
                    </TableCell>
                    <TableCell className='text-right tabular-nums'>
                      {formatVnd(Number(tx.balanceAfterVnd))}
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
