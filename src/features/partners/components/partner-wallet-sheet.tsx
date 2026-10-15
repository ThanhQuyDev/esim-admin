'use client';

/**
 * "Điều chỉnh Ví & Hoa hồng" (doitac-1410 #004).
 *
 * Laid out like the eXu wallet's detail sheet, as the brief asks: a "Thông tin"
 * tab with the balance and the three actions, and a "Lịch sử giao dịch" tab.
 * The history holds only money a person moved — the admin's adjustments, plus
 * the deposits for a distribution partner — so an adjustment is not lost among
 * hundreds of order lines.
 */

import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { Icons } from '@/components/icons';
import { formatDateTimeVn, formatVnd } from '@/lib/format';

import { adjustPartnerWalletMutation, setPartnerWalletLockedMutation } from '../api/mutations';
import { partnerWalletHistoryQueryOptions, partnerWalletQueryOptions } from '../api/queries';
import type { PartnerStatus, PartnerType } from '../api/types';
import { AdjustPartnerWalletModal } from './adjust-partner-wallet-modal';

const TX_TYPE_LABELS: Record<string, string> = {
  deposit: 'Nạp ký quỹ',
  deposit_bonus: 'Khuyến mãi nạp ký quỹ',
  manual_credit: 'Admin cộng tiền',
  manual_debit: 'Admin trừ tiền'
};

interface PartnerWalletSheetProps {
  partnerId: number;
  partnerType: PartnerType;
  partnerStatus: PartnerStatus;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PartnerWalletSheet({
  partnerId,
  partnerType,
  partnerStatus,
  open,
  onOpenChange
}: PartnerWalletSheetProps) {
  const [tab, setTab] = useState<'info' | 'history'>('info');
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [lockOpen, setLockOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    if (open) setTab('info');
  }, [open, partnerId]);

  const isKol = partnerType === 'kol';
  const balanceLabel = isKol ? 'Số tiền hoa hồng' : 'Số dư ký quỹ';

  const { data: wallet, refetch: refetchWallet } = useQuery({
    ...partnerWalletQueryOptions(partnerId),
    enabled: open
  });
  const {
    data: history = [],
    isLoading: historyLoading,
    refetch: refetchHistory
  } = useQuery({ ...partnerWalletHistoryQueryOptions(partnerId), enabled: open });

  const refresh = () => {
    refetchWallet();
    refetchHistory();
  };

  const adjust = useMutation({
    ...adjustPartnerWalletMutation,
    onSuccess: (tx) => {
      toast.success(`Đã điều chỉnh. Số dư mới: ${formatVnd(tx.balanceAfterVnd)}`);
      setAdjustOpen(false);
      setCancelOpen(false);
      setCancelReason('');
      refresh();
    },
    onError: (e: Error) => toast.error(e.message || 'Điều chỉnh thất bại')
  });

  const lock = useMutation({
    ...setPartnerWalletLockedMutation,
    onSuccess: (summary) => {
      toast.success(summary.status === 'locked' ? 'Đã đóng băng ví.' : 'Đã mở lại ví.');
      setLockOpen(false);
      refresh();
    },
    onError: (e: Error) => toast.error(e.message || 'Cập nhật trạng thái ví thất bại')
  });

  const frozen = wallet?.status === 'locked';
  // What "Hủy số dư" takes away: what the partner could still use. Money
  // already claimed in a pending withdrawal is left for that request to settle.
  const cancellable = Math.max(0, wallet?.availableBalanceVnd ?? 0);
  // A held or locked account freezes the wallet with it; only unlocking the
  // account releases it (the server refuses otherwise).
  const accountFrozen = partnerStatus === 'hold' || partnerStatus === 'disabled';

  return (
    <>
      <AdjustPartnerWalletModal
        partnerId={partnerId}
        open={adjustOpen}
        onOpenChange={setAdjustOpen}
        onSubmit={(data) => adjust.mutate({ id: partnerId, data })}
        isSubmitting={adjust.isPending}
      />

      <Dialog open={lockOpen} onOpenChange={setLockOpen}>
        <DialogContent className='sm:max-w-[420px]'>
          <DialogHeader>
            <DialogTitle>{frozen ? 'Mở lại ví' : 'Tạm khóa ví'}</DialogTitle>
            <DialogDescription>
              {frozen
                ? 'Đối tác dùng lại được số dư như bình thường.'
                : isKol
                  ? 'Đóng băng số tiền hoa hồng: đối tác vẫn đăng nhập được nhưng không tạo được yêu cầu rút tiền.'
                  : 'Đóng băng số dư ký quỹ: đối tác vẫn đăng nhập được nhưng không đặt mua được.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant='outline' onClick={() => setLockOpen(false)}>
              Hủy
            </Button>
            <Button
              variant={frozen ? 'default' : 'destructive'}
              isLoading={lock.isPending}
              onClick={() => lock.mutate({ id: partnerId, locked: !frozen })}
            >
              {frozen ? 'Mở lại ví' : 'Tạm khóa ví'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={cancelOpen}
        onOpenChange={(next) => {
          setCancelOpen(next);
          if (!next) setCancelReason('');
        }}
      >
        <DialogContent className='sm:max-w-[450px]'>
          <DialogHeader>
            <DialogTitle>Hủy số dư</DialogTitle>
            <DialogDescription>
              Trừ toàn bộ {formatVnd(cancellable)} khả dụng của đối tác #{partnerId}. Thao tác này
              ghi vào lịch sử giao dịch của đối tác.
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-2'>
            <Label htmlFor='partner-cancel-reason'>
              Lý do <span className='text-destructive'>*</span>
            </Label>
            <Textarea
              id='partner-cancel-reason'
              rows={3}
              placeholder='Ví dụ: thu hồi hoa hồng gian lận đơn DS-18342'
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setCancelOpen(false)}>
              Hủy
            </Button>
            <Button
              variant='destructive'
              disabled={!cancelReason.trim() || cancellable <= 0}
              isLoading={adjust.isPending}
              onClick={() =>
                adjust.mutate({
                  id: partnerId,
                  data: { amountVnd: -cancellable, reason: cancelReason.trim() }
                })
              }
            >
              Hủy số dư
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className='w-full overflow-y-auto sm:max-w-[520px]'>
          <SheetHeader>
            <SheetTitle className='flex items-center gap-3'>
              <span>Ví & hoa hồng · đối tác #{partnerId}</span>
              {wallet && (
                <Badge variant={frozen ? 'destructive' : 'default'}>
                  {frozen ? 'Đang đóng băng' : 'Đang hoạt động'}
                </Badge>
              )}
            </SheetTitle>
            <SheetDescription>
              {isKol ? 'Hoa hồng của đối tác tiếp thị' : 'Số dư ký quỹ của đối tác phân phối'}
            </SheetDescription>
          </SheetHeader>

          <div className='mx-4 flex gap-1 rounded-lg border p-1'>
            {(
              [
                ['info', 'Thông tin'],
                ['history', 'Lịch sử giao dịch']
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type='button'
                onClick={() => setTab(value)}
                className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  tab === value ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {tab === 'info' && (
            <div className='space-y-6 px-4 pb-4'>
              {!wallet ? (
                <div className='flex justify-center py-8'>
                  <Icons.spinner className='h-6 w-6 animate-spin' />
                </div>
              ) : (
                <>
                  <div className='grid grid-cols-2 gap-4'>
                    <div className='rounded-lg border p-4'>
                      <p className='text-muted-foreground text-xs font-medium'>{balanceLabel}</p>
                      <p className='text-2xl font-bold tabular-nums'>
                        {formatVnd(wallet.balanceVnd)}
                      </p>
                    </div>
                    <div className='rounded-lg border p-4'>
                      <p className='text-muted-foreground text-xs font-medium'>Khả dụng</p>
                      <p className='text-2xl font-bold tabular-nums'>
                        {formatVnd(wallet.availableBalanceVnd)}
                      </p>
                    </div>
                    {isKol && (
                      <div className='rounded-lg border p-4'>
                        <p className='text-muted-foreground text-xs font-medium'>
                          Hoa hồng chờ duyệt
                        </p>
                        <p className='text-lg font-semibold tabular-nums'>
                          {formatVnd(wallet.pendingCommissionVnd ?? 0)}
                        </p>
                      </div>
                    )}
                    {wallet.pendingPayoutVnd > 0 && (
                      <div className='rounded-lg border p-4'>
                        <p className='text-muted-foreground text-xs font-medium'>Đang chờ rút</p>
                        <p className='text-lg font-semibold tabular-nums'>
                          {formatVnd(wallet.pendingPayoutVnd)}
                        </p>
                      </div>
                    )}
                  </div>

                  {accountFrozen && (
                    <p className='text-muted-foreground text-xs'>
                      Tài khoản đối tác đang bị khóa nên ví bị đóng băng theo. Mở khóa tài khoản để
                      mở lại ví.
                    </p>
                  )}

                  <div className='flex flex-wrap gap-2'>
                    <Button variant='outline' size='sm' onClick={() => setAdjustOpen(true)}>
                      <Icons.edit className='mr-2 h-4 w-4' />
                      Điều chỉnh số dư
                    </Button>
                    <Button
                      variant='outline'
                      size='sm'
                      disabled={frozen && accountFrozen}
                      onClick={() => setLockOpen(true)}
                    >
                      <Icons.lock className='mr-2 h-4 w-4' />
                      {frozen ? 'Mở lại ví' : 'Tạm khóa'}
                    </Button>
                    <Button
                      variant='destructive'
                      size='sm'
                      disabled={cancellable <= 0}
                      onClick={() => setCancelOpen(true)}
                    >
                      <Icons.trash className='mr-2 h-4 w-4' />
                      Hủy số dư
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}

          {tab === 'history' && (
            <div className='space-y-3 px-4 pb-4'>
              <p className='text-muted-foreground text-xs'>
                {isKol
                  ? 'Các lần admin cộng/trừ tiền hoa hồng.'
                  : 'Các lần đối tác nạp ký quỹ và admin cộng/trừ số dư.'}
              </p>
              {historyLoading ? (
                <div className='flex justify-center py-8'>
                  <Icons.spinner className='h-6 w-6 animate-spin' />
                </div>
              ) : history.length === 0 ? (
                <p className='text-muted-foreground py-8 text-center text-sm'>
                  Chưa có giao dịch nào.
                </p>
              ) : (
                history.map((tx) => {
                  const amount = Number(tx.amountVnd);
                  const isCredit = amount > 0;
                  return (
                    <div key={tx.id} className='flex items-start gap-3 rounded-lg border p-3'>
                      <div
                        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                          isCredit ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                        }`}
                      >
                        {isCredit ? (
                          <Icons.trendingUp className='h-4 w-4' />
                        ) : (
                          <Icons.trendingDown className='h-4 w-4' />
                        )}
                      </div>
                      <div className='min-w-0 flex-1'>
                        <p className='text-sm font-medium'>{TX_TYPE_LABELS[tx.type] ?? tx.type}</p>
                        {tx.reason && (
                          <p className='text-muted-foreground text-xs break-words'>{tx.reason}</p>
                        )}
                        <p className='text-muted-foreground text-xs'>
                          {formatDateTimeVn(tx.createdAt)}
                        </p>
                      </div>
                      <div className='shrink-0 text-right'>
                        <p
                          className={`text-sm font-semibold tabular-nums ${
                            isCredit ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {isCredit ? '+' : ''}
                          {formatVnd(amount)}
                        </p>
                        <p className='text-muted-foreground text-xs tabular-nums'>
                          Số dư: {formatVnd(Number(tx.balanceAfterVnd))}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
