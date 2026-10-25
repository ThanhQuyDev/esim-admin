'use client';

/**
 * "Thanh toán" — the distribution partner's ký quỹ wallet (#047).
 *
 * doitac-1410 #030: depositing and withdrawing open from the balance cards —
 * "Nạp tiền" on the deposit balance, "Rút tiền" on the available balance —
 * each in its own popup (portal-wallet-dialogs).
 *
 * There is no request to raise and nobody to wait for any more: the partner
 * types what they want to put in and pays. A bank transfer shows a SePay QR and
 * is credited the moment the transfer lands; a card goes through OnePay, which
 * charges for it, and the brief puts that on the partner — send 100.000đ by
 * card and 94.000đ reaches the wallet. The form says so before they choose,
 * because finding out afterwards is how a partner loses trust in the balance.
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
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Icons } from '@/components/icons';
import { formatDateVn, formatVnd } from '@/lib/format';

import { PortalLedgerCard, PortalPayoutHistoryCard } from './portal-ledger-card';
import { DepositDialog, WithdrawDialog } from './portal-wallet-dialogs';
import {
  DEPOSIT_METHOD_LABEL,
  DepositDetailDialog,
  ManualDepositDialog
} from './portal-manual-deposit';
import {
  myDepositRequestsQueryOptions,
  myProfileQueryOptions,
  myWalletQueryOptions
} from '../api/queries';
import type { MyDepositRequest } from '../api/types';

const DEPOSIT_STATUS: Record<string, { label: string; className: string }> = {
  pending: {
    label: 'Chờ thanh toán',
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
  },
  // A manual top-up waits on esim.vn, not on a payment (vande #069).
  review: {
    label: 'Chờ xử lý',
    className:
      'border-amber-200 bg-amber-100 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300'
  },
  // Refused by esim.vn, with the reason under it (doitac-1410 #063).
  rejected: {
    label: 'Từ chối',
    className:
      'border-red-200 bg-red-100 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300'
  }
};

/** A manual top-up waiting on esim.vn reads "Chờ xử lý", not "Chờ thanh toán". */
const statusKey = (req: MyDepositRequest) =>
  req.status === 'pending' && req.method === 'manual_transfer' ? 'review' : req.status;

export function PortalWalletView() {
  const { data: wallet, isLoading } = useQuery(myWalletQueryOptions());
  const { data: me } = useQuery(myProfileQueryOptions());
  // Withdrawing belongs to the affiliate programme (#048); with it, the
  // payouts live here rather than on a menu of their own (doitac-1410 #032).
  const canWithdraw = Boolean(me?.canAffiliate);
  const { data: deposits = [] } = useQuery(myDepositRequestsQueryOptions());

  const [dialog, setDialog] = useState<'deposit' | 'withdraw' | null>(null);
  const [detailOf, setDetailOf] = useState<MyDepositRequest | null>(null);
  // "Nạp tiền thủ công" (vande #068/#069): a company reports its own bank
  // transfer with proof instead of paying by QR or card.
  const manual = me?.depositMode === 'manual';

  // Buying on credit (vande #056): the wallet is this month's limit, not a
  // deposit, and there is nothing to top up.
  const credit = wallet?.creditLimit ?? null;
  const cards = credit
    ? [
        {
          label: 'Hạn mức giao dịch / tháng',
          value: formatVnd(credit.limitVnd),
          badge: 'Không cần ký quỹ',
          icon: Icons.wallet,
          footerStrong: 'Tự đặt lại lúc 0h ngày 1 hằng tháng',
          footer: 'Tiền hàng đối soát và thanh toán vào tháng sau'
        },
        {
          label: 'Hạn mức còn lại',
          value: formatVnd(credit.remainingVnd),
          badge: 'Dùng được',
          icon: Icons.check,
          footerStrong: 'Có thể tạo đơn',
          footer: 'Trừ ngay khi đơn được tạo thành công'
        },
        {
          label: 'Đã dùng tháng này',
          value: formatVnd(credit.usedVnd),
          badge: 'Cần thanh toán',
          icon: Icons.clock,
          footerStrong: 'Gửi đối soát qua email tháng sau',
          footer: 'Kèm file chi tiết từng giao dịch'
        }
      ]
    : [
        {
          label: 'Số dư ký quỹ',
          value: formatVnd(wallet?.balanceVnd),
          badge: wallet?.status === 'locked' ? 'Đang khoá' : 'Hoạt động',
          icon: Icons.wallet,
          footerStrong: 'Tổng số dư trên ví',
          footer: 'Gồm cả phần đang chờ rút',
          action: { label: 'Nạp tiền', open: 'deposit' as const }
        },
        {
          label: 'Khả dụng',
          value: formatVnd(wallet?.availableBalanceVnd),
          badge: 'Dùng được',
          icon: Icons.check,
          footerStrong: 'Có thể tạo đơn hoặc rút',
          footer: 'Trừ ngay khi đơn được tạo thành công',
          action: canWithdraw ? { label: 'Rút tiền', open: 'withdraw' as const } : null
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

  // A nudge, not a block: stopping the partner early would cause exactly the
  // thing this is meant to prevent, an order failing halfway (#077).
  const warnVnd = wallet?.lowDepositWarningVnd ?? 0;
  const lowBalance =
    !isLoading && !credit && warnVnd > 0 && (wallet?.availableBalanceVnd ?? 0) < warnVnd;

  return (
    <div className='flex flex-1 flex-col space-y-4'>
      {lowBalance && (
        <div className='border-amber-500/40 bg-amber-500/10 flex flex-wrap items-center gap-2 rounded-lg border p-3 text-sm'>
          <Icons.warning className='h-4 w-4 shrink-0 text-amber-600' />
          <span>
            Số dư ký quỹ khả dụng còn {formatVnd(wallet?.availableBalanceVnd)} — dưới mức nhắc nạp{' '}
            {formatVnd(warnVnd)}. Bạn nên nạp thêm để không bị gián đoạn khi đặt đơn.
          </span>
        </div>
      )}
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
                {'action' in card && card.action && (
                  <Button
                    size='sm'
                    className='mt-2'
                    variant={card.action.open === 'deposit' ? 'default' : 'outline'}
                    disabled={card.action.open === 'withdraw' && wallet?.status === 'locked'}
                    onClick={() => setDialog(card.action!.open)}
                    data-testid={`wallet-${card.action.open}`}
                  >
                    {card.action.open === 'deposit' ? (
                      <Icons.add className='size-4' />
                    ) : (
                      <Icons.arrowRight className='size-4' />
                    )}
                    {card.action.label}
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* "Lịch sử giao dịch" with filters and the one-file export (doitac-1410 #031). */}
      <PortalLedgerCard />

      {/* Nothing to top up on credit (vande #056); older top-ups stay listed. */}
      {(!credit || deposits.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className='flex flex-wrap items-center gap-2'>
              Lịch sử nạp tiền
              <Badge variant='outline'>{deposits.length} lần</Badge>
            </CardTitle>
            <CardDescription>
              Mỗi lần nạp có mã đối chiếu riêng. Với thẻ tín dụng, cột "Cộng vào ví" đã trừ phí cổng
              thanh toán.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='rounded-lg border'>
              <Table>
                <TableHeader className='bg-muted'>
                  <TableRow>
                    <TableHead>Ngày tạo</TableHead>
                    <TableHead>Hình thức</TableHead>
                    <TableHead className='text-right'>Số tiền</TableHead>
                    <TableHead className='text-right'>Cộng vào ví</TableHead>
                    <TableHead>Mã đối chiếu</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className='text-right'>Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deposits.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className='h-24 text-center'>
                        <p className='text-muted-foreground text-sm'>Chưa có lần nạp nào.</p>
                        <p className='text-muted-foreground mt-1 text-xs'>
                          Bấm "Nạp tiền" ở ô số dư ký quỹ để nạp.
                        </p>
                      </TableCell>
                    </TableRow>
                  )}
                  {deposits.map((req) => {
                    const status = DEPOSIT_STATUS[statusKey(req)];
                    return (
                      <TableRow key={req.id}>
                        <TableCell className='whitespace-nowrap'>
                          {formatDateVn(req.createdAt)}
                        </TableCell>
                        <TableCell>
                          <Badge variant='outline'>
                            {DEPOSIT_METHOD_LABEL[req.method ?? 'bank_transfer'] ?? req.method}
                          </Badge>
                        </TableCell>
                        <TableCell className='text-right font-medium tabular-nums'>
                          {formatVnd(req.amountVnd)}
                          {Number(req.feeVnd) > 0 ? (
                            <div className='text-muted-foreground text-xs'>
                              phí {formatVnd(req.feeVnd)}
                            </div>
                          ) : null}
                        </TableCell>
                        <TableCell className='text-right font-medium tabular-nums'>
                          {formatVnd(req.creditedVnd ?? req.amountVnd)}
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
                          {req.status === 'rejected' && req.rejectionReason && (
                            <div
                              className='text-muted-foreground mt-1 max-w-[240px] text-xs'
                              data-testid='deposit-rejection'
                            >
                              Lý do: {req.rejectionReason}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className='text-right'>
                          <Button
                            size='sm'
                            variant='outline'
                            data-testid={`deposit-detail-${req.id}`}
                            onClick={() => setDetailOf(req)}
                          >
                            Xem chi tiết
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Under the transactions: the deposits and the withdrawals (doitac-1410 #031). */}
      {canWithdraw && <PortalPayoutHistoryCard />}

      {manual ? (
        <ManualDepositDialog
          open={dialog === 'deposit'}
          onOpenChange={(o) => setDialog(o ? 'deposit' : null)}
        />
      ) : (
        <DepositDialog
          open={dialog === 'deposit'}
          onOpenChange={(o) => setDialog(o ? 'deposit' : null)}
        />
      )}
      {detailOf && (
        <DepositDetailDialog
          request={detailOf}
          statusLabel={DEPOSIT_STATUS[statusKey(detailOf)]?.label ?? detailOf.status}
          onClose={() => setDetailOf(null)}
        />
      )}
      <WithdrawDialog
        open={dialog === 'withdraw'}
        onOpenChange={(o) => setDialog(o ? 'withdraw' : null)}
      />
    </div>
  );
}
