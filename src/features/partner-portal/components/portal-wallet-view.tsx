'use client';

/**
 * Escrow wallet for distribution partners: balance, top-up requests and the
 * transaction ledger.
 */

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

import { createDepositRequestMutation } from '../api/mutations';
import {
  myDepositRequestsQueryOptions,
  myWalletQueryOptions,
  myWalletTransactionsQueryOptions
} from '../api/queries';

const MIN_DEPOSIT_VND = 100_000;

const DEPOSIT_STATUS: Record<string, { label: string; className: string }> = {
  pending: {
    label: 'Chờ xác nhận',
    className:
      'border-orange-200 bg-orange-100 text-orange-800 dark:border-orange-900 dark:bg-orange-950 dark:text-orange-300'
  },
  confirmed: {
    label: 'Đã xác nhận',
    className:
      'border-emerald-200 bg-emerald-100 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300'
  },
  cancelled: {
    label: 'Đã huỷ',
    className:
      'border-gray-200 bg-gray-100 text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300'
  }
};

export function PortalWalletView() {
  const { data: wallet, isLoading } = useQuery(myWalletQueryOptions());
  const { data: transactions = [], isLoading: txLoading } = useQuery(
    myWalletTransactionsQueryOptions()
  );
  const { data: deposits = [] } = useQuery(myDepositRequestsQueryOptions());

  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);

  const createDeposit = useMutation({
    ...createDepositRequestMutation,
    onSuccess: () => {
      setOpen(false);
      setAmount('');
      toast.success('Đã tạo yêu cầu nạp. Vui lòng chuyển khoản theo hướng dẫn.');
    },
    onError: (e: Error) => toast.error(e.message || 'Tạo yêu cầu thất bại.')
  });

  const validate = (): string | null => {
    const value = Number(amount || 0);
    if (!amount.trim()) return 'Nhập số tiền muốn nạp.';
    if (Number.isNaN(value)) return 'Số tiền không hợp lệ.';
    if (value < MIN_DEPOSIT_VND) return `Số tiền tối thiểu là ${formatVnd(MIN_DEPOSIT_VND)}.`;
    return null;
  };

  const cards = [
    {
      label: 'Số dư ký quỹ',
      value: formatVnd(wallet?.balanceVnd),
      badge: wallet?.status === 'locked' ? 'Đang khoá' : 'Hoạt động',
      icon: Icons.wallet,
      footerStrong: 'Tổng số dư trên ví',
      footer: 'Gồm cả phần đang chờ rút'
    },
    {
      label: 'Khả dụng',
      value: formatVnd(wallet?.availableBalanceVnd),
      badge: 'Dùng được',
      icon: Icons.check,
      footerStrong: 'Có thể tạo đơn hoặc rút',
      footer: 'Trừ ngay khi đơn được tạo thành công'
    },
    {
      label: 'Đang chờ rút',
      value: formatVnd(wallet?.pendingPayoutVnd),
      badge: 'Đã gửi yêu cầu',
      icon: Icons.clock,
      footerStrong: 'Chờ duyệt',
      footer: 'Khoản này tạm giữ cho tới khi xử lý xong'
    }
  ];

  return (
    <div className='flex flex-1 flex-col space-y-4'>
      <div className='*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs sm:grid-cols-3'>
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label} className='@container/card'>
              <CardHeader>
                <CardDescription>{card.label}</CardDescription>
                <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
                  {isLoading ? '…' : card.value}
                </CardTitle>
                <CardAction>
                  <Badge variant='outline'>
                    <Icon />
                    {card.badge}
                  </Badge>
                </CardAction>
              </CardHeader>
              <CardFooter className='flex-col items-start gap-1.5 text-sm'>
                <div className='line-clamp-1 flex gap-2 font-medium'>{card.footerStrong}</div>
                <div className='text-muted-foreground'>{card.footer}</div>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className='flex flex-wrap items-center gap-2'>
            Yêu cầu nạp ký quỹ
            <Badge variant='outline'>{deposits.length} yêu cầu</Badge>
          </CardTitle>
          <CardDescription>
            Mỗi yêu cầu được cấp một mã chuyển khoản riêng để đối chiếu tự động.
          </CardDescription>
          <CardAction>
            <Button size='sm' onClick={() => setOpen(true)}>
              <Icons.add />
              Tạo yêu cầu nạp
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <div className='rounded-lg border'>
            <Table>
              <TableHeader className='bg-muted'>
                <TableRow>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead className='text-right'>Số tiền</TableHead>
                  <TableHead>Mã chuyển khoản</TableHead>
                  <TableHead>Trạng thái</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deposits.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className='h-24 text-center'>
                      <p className='text-muted-foreground text-sm'>Chưa có yêu cầu nạp nào.</p>
                      <p className='text-muted-foreground mt-1 text-xs'>
                        Tạo yêu cầu để nhận mã chuyển khoản và nạp vào ví ký quỹ.
                      </p>
                    </TableCell>
                  </TableRow>
                )}
                {deposits.map((req) => {
                  const status = DEPOSIT_STATUS[req.status];
                  return (
                    <TableRow key={req.id}>
                      <TableCell className='whitespace-nowrap'>
                        {formatDateVn(req.createdAt)}
                      </TableCell>
                      <TableCell className='text-right font-medium tabular-nums'>
                        {formatVnd(req.amountVnd)}
                      </TableCell>
                      <TableCell className='font-mono text-xs break-all'>
                        {req.bankTransferCode}
                      </TableCell>
                      <TableCell>
                        {status ? (
                          <Badge variant='outline' className={status.className}>
                            {status.label}
                          </Badge>
                        ) : (
                          <Badge variant='outline'>{req.status}</Badge>
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

      <Card>
        <CardHeader>
          <CardTitle>Lịch sử giao dịch</CardTitle>
          <CardDescription>Mọi khoản ghi có và ghi nợ trên ví ký quỹ.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='rounded-lg border'>
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
                {txLoading && (
                  <TableRow>
                    <TableCell colSpan={4} className='text-muted-foreground h-24 text-center'>
                      Đang tải giao dịch…
                    </TableCell>
                  </TableRow>
                )}
                {!txLoading && transactions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className='h-24 text-center'>
                      <p className='text-muted-foreground text-sm'>Chưa có giao dịch nào.</p>
                    </TableCell>
                  </TableRow>
                )}
                {transactions.map((tx) => {
                  const isCredit = tx.amountVnd > 0;
                  return (
                    <TableRow key={tx.id}>
                      <TableCell className='whitespace-nowrap'>
                        {formatDateTimeVn(tx.createdAt)}
                      </TableCell>
                      <TableCell>{tx.reason || tx.type}</TableCell>
                      <TableCell className='text-right'>
                        <span
                          className={
                            isCredit
                              ? 'font-medium tabular-nums text-emerald-600 dark:text-emerald-400'
                              : 'font-medium tabular-nums text-red-600 dark:text-red-400'
                          }
                        >
                          {isCredit ? '+' : ''}
                          {formatVnd(tx.amountVnd)}
                        </span>
                      </TableCell>
                      <TableCell className='text-right tabular-nums'>
                        {formatVnd(tx.balanceAfterVnd)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tạo yêu cầu nạp ký quỹ</DialogTitle>
            <DialogDescription>
              Hệ thống cấp một mã chuyển khoản để đối chiếu giao dịch của bạn.
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-2'>
            <Label htmlFor='depositAmount'>
              Số tiền muốn nạp <span className='text-destructive'>*</span>
            </Label>
            <Input
              id='depositAmount'
              type='number'
              inputMode='numeric'
              min={MIN_DEPOSIT_VND}
              step={1000}
              value={amount}
              placeholder={String(MIN_DEPOSIT_VND)}
              aria-invalid={Boolean(error)}
              aria-describedby='depositAmount-error'
              onChange={(e) => {
                setAmount(e.target.value);
                if (error) setError(null);
              }}
              onBlur={() => setError(validate())}
            />
            {error ? (
              <p id='depositAmount-error' className='text-destructive text-xs'>
                {error}
              </p>
            ) : (
              <p className='text-muted-foreground text-xs'>
                Tối thiểu {formatVnd(MIN_DEPOSIT_VND)}.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setOpen(false)}>
              Huỷ
            </Button>
            <Button
              isLoading={createDeposit.isPending}
              onClick={() => {
                const next = validate();
                setError(next);
                if (next) return;
                createDeposit.mutate({ amountVnd: Number(amount) });
              }}
            >
              Tạo yêu cầu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
