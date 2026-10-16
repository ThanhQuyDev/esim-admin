'use client';

/**
 * "Chi tiết eSIM" on the partner portal (doitac-1410 #039).
 *
 * The admin's eSIM page cut down to what a reseller needs to hand the eSIM to
 * their customer and support it: status and prices, the QR and install links,
 * the technical codes, the plan, the topups they bought — and the actions
 * (resend the email, report a fault, ask for a refund, top up for the customer).
 * No supplier name or supplier cost.
 */

import { useState } from 'react';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Icons } from '@/components/icons';
import { formatDateTimeVn, formatVnd } from '@/lib/format';

import {
  myEsimDetailQueryOptions,
  myEsimTopupPackagesQueryOptions,
  partnerPortalKeys
} from '../api/queries';
import { resendMyEsimEmail, topupMyEsim } from '../api/service';
import type { MyEsimDetail } from '../api/types';
import { PLAN_TYPE_LABEL, yesNo } from './portal-catalogue-dialogs';
import {
  EsimRequestDialog,
  type EsimRequestTarget,
  esimStatusLabel,
  formatData
} from './portal-esim-request-dialog';

const TOPUP_STATUS_LABEL: Record<string, string> = {
  completed: 'Thành công',
  paid: 'Đang nạp',
  pending: 'Chờ thanh toán',
  failed: 'Thất bại',
  manual_intervention: 'esim.vn đang xử lý'
};

function resetLabel(esim: MyEsimDetail): string {
  if (esim.dailyResetPolicy === 'calendar_day') {
    const offset = esim.dailyResetUtcOffset ?? 0;
    return `23:59 mỗi ngày theo giờ UTC${offset >= 0 ? '+' : ''}${offset}`;
  }
  if (esim.dailyResetPolicy === 'rolling_24h') return 'Mỗi 24 giờ kể từ khi kích hoạt';
  return esim.plan.type === 'daily'
    ? 'Nhà cung cấp chưa công bố'
    : 'Không áp dụng (gói không theo ngày)';
}

const dateOrDash = (value: string | null) => (value ? formatDateTimeVn(value) : '—');

function copy(value: string, label: string) {
  navigator.clipboard
    .writeText(value)
    .then(() => toast.success(`Đã sao chép ${label}`))
    .catch(() => toast.error('Không sao chép được, hãy chọn và sao chép thủ công.'));
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className='flex flex-col gap-0.5 border-b py-2 last:border-0 sm:flex-row sm:items-start sm:justify-between sm:gap-4'>
      <span className='text-muted-foreground shrink-0 text-sm'>{label}</span>
      <span className='min-w-0 text-sm font-medium break-words sm:text-right'>{value ?? '—'}</span>
    </div>
  );
}

/** A long code with a copy button — SM-DP+, activation code, install links. */
function CopyRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className='space-y-1 border-b py-2 last:border-0'>
      <div className='flex items-center justify-between gap-2'>
        <span className='text-muted-foreground text-sm'>{label}</span>
        {value && (
          <Button
            variant='ghost'
            size='sm'
            className='h-7 px-2'
            aria-label={`Sao chép ${label}`}
            onClick={() => copy(value, label)}
          >
            <Icons.copy className='size-4' />
          </Button>
        )}
      </div>
      <p className='font-mono text-xs break-all'>{value || '—'}</p>
    </div>
  );
}

export function PortalEsimDetailView({ iccid }: { iccid: string }) {
  const queryClient = useQueryClient();
  const { data: esim, isLoading, error } = useQuery(myEsimDetailQueryOptions(iccid));
  const [request, setRequest] = useState<EsimRequestTarget | null>(null);
  const [topupOpen, setTopupOpen] = useState(false);
  // Billion: topup only when this very eSIM has recharge products (#064).
  const perEsim = Boolean(esim?.plan?.topUpPerEsim);
  const { data: perEsimTopups, isLoading: checkingTopups } = useQuery(
    myEsimTopupPackagesQueryOptions(iccid, perEsim)
  );

  const resend = useMutation({
    mutationFn: () => resendMyEsimEmail(iccid),
    onSuccess: () =>
      toast.success(
        esim?.deliveryEmail
          ? `Đã gửi lại email eSIM tới ${esim.deliveryEmail}.`
          : 'Đã gửi lại email eSIM.'
      ),
    onError: (err: Error) => toast.error(err.message)
  });

  if (isLoading) {
    return (
      <div className='flex justify-center py-12'>
        <Icons.spinner className='size-6 animate-spin' />
      </div>
    );
  }
  if (error || !esim) {
    return (
      <div className='space-y-3 py-12 text-center'>
        <p className='text-sm'>{(error as Error | null)?.message ?? 'Không tìm thấy eSIM này.'}</p>
        <Button asChild variant='outline' size='sm'>
          <Link href='/dashboard/portal/esims'>Về danh sách eSIM</Link>
        </Button>
      </div>
    );
  }

  const badge = esimStatusLabel[esim.status ?? ''] ?? {
    label: esim.status ?? '—',
    variant: 'outline' as const
  };
  const closed = esim.status === 'refunded';
  const pending = Boolean(esim.openReport);
  const blockedReason = closed
    ? 'eSIM đã được hoàn tiền'
    : pending
      ? 'Đang có yêu cầu chờ esim.vn xử lý'
      : undefined;
  const plan = esim.plan;
  const canTopup = perEsim ? (perEsimTopups?.length ?? 0) > 0 : plan.topUp;

  return (
    <div className='grid min-w-0 grid-cols-1 gap-4'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <Button asChild variant='ghost' size='sm' className='px-2'>
          <Link href='/dashboard/portal/esims'>
            <Icons.chevronLeft className='size-4' />
            Danh sách eSIM
          </Link>
        </Button>
        <div className='flex flex-wrap gap-2' data-testid='esim-detail-actions'>
          <Button
            variant='outline'
            size='sm'
            disabled={resend.isPending}
            onClick={() => resend.mutate()}
          >
            <Icons.mail className='size-4' />
            {resend.isPending ? 'Đang gửi…' : 'Gửi lại email eSIM'}
          </Button>
          <Button
            variant='outline'
            size='sm'
            disabled={closed || pending}
            title={blockedReason}
            onClick={() =>
              setRequest({ iccid: esim.iccid, orderNumber: esim.orderNumber, kind: 'fault' })
            }
          >
            Báo lỗi
          </Button>
          <Button
            variant='outline'
            size='sm'
            disabled={closed || pending || !esim.refundable}
            title={
              blockedReason ?? (esim.refundable ? undefined : 'Gói này không hỗ trợ hoàn tiền')
            }
            onClick={() =>
              setRequest({ iccid: esim.iccid, orderNumber: esim.orderNumber, kind: 'refund' })
            }
          >
            Yêu cầu hoàn tiền
          </Button>
          <Button
            size='sm'
            disabled={closed || !canTopup}
            title={
              canTopup
                ? undefined
                : perEsim && checkingTopups
                  ? 'Đang kiểm tra gói topup của eSIM này…'
                  : perEsim
                    ? 'eSIM này không có gói topup'
                    : 'Gói này không hỗ trợ topup'
            }
            onClick={() => setTopupOpen(true)}
          >
            Topup hộ khách
          </Button>
        </div>
      </div>
      {pending && (
        <p className='text-muted-foreground text-sm'>
          {esim.openReport === 'refund'
            ? 'eSIM này đang có yêu cầu hoàn tiền chờ esim.vn xử lý.'
            : 'eSIM này đang có báo lỗi chờ esim.vn xử lý.'}
        </p>
      )}

      <div className='grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2'>
        <Card className='min-w-0'>
          <CardHeader>
            <CardTitle>Thông tin eSIM</CardTitle>
          </CardHeader>
          <CardContent>
            <InfoRow
              label='Trạng thái'
              value={<Badge variant={badge.variant}>{badge.label}</Badge>}
            />
            <InfoRow
              label='Mã đơn hàng'
              value={<span className='font-mono'>{esim.orderNumber}</span>}
            />
            <InfoRow label='ICCID' value={<span className='font-mono'>{esim.iccid}</span>} />
            <InfoRow label='APN' value={esim.apn || '—'} />
            <InfoRow
              label='Mã gói cước'
              value={<span className='font-mono'>{esim.planCode || '—'}</span>}
            />
            <InfoRow label='IP thoát mạng' value={esim.ipExport || '—'} />
            <InfoRow label='Hỗ trợ hoàn tiền' value={yesNo(esim.refundable)} />
            <InfoRow label='Reset dung lượng tốc độ cao' value={resetLabel(esim)} />
            <InfoRow label='Giá đại lý' value={formatVnd(esim.agentPriceVnd)} />
            <InfoRow label='Giá bán lẻ đề xuất' value={formatVnd(esim.suggestedRetailVnd)} />
            <InfoRow
              label='Dữ liệu đã dùng'
              value={`${formatData(esim.dataUsed)} / ${formatData(esim.dataTotal)}`}
            />
            <InfoRow label='Thời gian tạo' value={dateOrDash(esim.createdAt)} />
            <InfoRow label='Kích hoạt' value={dateOrDash(esim.activatedAt)} />
            <InfoRow label='Hết hạn' value={dateOrDash(esim.expiresAt)} />
            <InfoRow label='Cập nhật' value={dateOrDash(esim.updatedAt)} />
          </CardContent>
        </Card>

        <div className='grid min-w-0 grid-cols-1 content-start gap-4'>
          <Card className='min-w-0'>
            <CardHeader>
              <CardTitle>Mã QR cài đặt</CardTitle>
              <CardDescription>
                Khách quét mã bằng camera điện thoại, hoặc mở link cài đặt trên chính máy đó.
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-3'>
              {esim.lpa ? (
                <div className='flex justify-center rounded-lg bg-white p-4'>
                  <QRCodeSVG value={esim.lpa} size={200} data-testid='esim-qr' />
                </div>
              ) : (
                <p className='text-muted-foreground text-sm'>eSIM chưa có mã QR.</p>
              )}
              <CopyRow label='Link cài đặt iPhone' value={esim.appleInstallUrl} />
              <CopyRow label='Link cài đặt Android' value={esim.androidInstallUrl} />
            </CardContent>
          </Card>

          <Card className='min-w-0'>
            <CardHeader>
              <CardTitle>Thông tin kỹ thuật</CardTitle>
            </CardHeader>
            <CardContent>
              <CopyRow label='SM-DP+ Address' value={esim.smdpAddress} />
              <CopyRow label='Activation Code' value={esim.activationCode} />
              <CopyRow label='LPA' value={esim.lpa} />
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className='min-w-0'>
        <CardHeader>
          <CardTitle>Thông tin gói cước</CardTitle>
        </CardHeader>
        <CardContent className='grid grid-cols-1 gap-x-8 md:grid-cols-2'>
          <InfoRow label='Tên gói' value={plan.name || '—'} />
          <InfoRow
            label='Phút gọi / SMS'
            value={`${plan.call ? `${plan.call} phút` : 'Không'} / ${plan.sms ? `${plan.sms} SMS` : 'Không'}`}
          />
          <InfoRow label='Điểm đến' value={plan.destination || '—'} />
          <InfoRow label='Dung lượng' value={formatData(plan.dataMb)} />
          <InfoRow label='Thời hạn' value={plan.durationDays ? `${plan.durationDays} ngày` : '—'} />
          <InfoRow label='Nhà mạng' value={plan.operatorName || '—'} />
          <InfoRow label='Tốc độ' value={plan.speed || '—'} />
          <InfoRow label='Loại gói' value={PLAN_TYPE_LABEL[plan.type ?? ''] ?? plan.type ?? '—'} />
        </CardContent>
      </Card>

      <Card className='min-w-0'>
        <CardHeader>
          <CardTitle>Gói đã topup ({esim.topups.length})</CardTitle>
        </CardHeader>
        <CardContent className='space-y-2'>
          {esim.topups.length === 0 ? (
            <p className='text-muted-foreground text-sm'>Chưa topup gói nào cho eSIM này.</p>
          ) : (
            esim.topups.map((topup) => (
              <div key={topup.orderNumber} className='space-y-1 rounded-lg border p-3 text-sm'>
                <div className='flex flex-wrap items-center justify-between gap-2'>
                  <span className='font-medium'>{topup.packageName || '—'}</span>
                  <span className='font-semibold'>{formatVnd(topup.priceVnd)}</span>
                </div>
                <div className='text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-xs'>
                  <span>
                    Dung lượng: {topup.isUnlimited ? 'Không giới hạn' : topup.dataText || '—'}
                  </span>
                  <span>Thời hạn: {topup.durationDays ? `${topup.durationDays} ngày` : '—'}</span>
                  <span>Thời gian: {dateOrDash(topup.createdAt)}</span>
                  <span>Trạng thái: {TOPUP_STATUS_LABEL[topup.status] ?? topup.status}</span>
                  <Link
                    href={`/dashboard/portal/orders?search=${encodeURIComponent(topup.orderNumber)}`}
                    className='text-primary font-mono underline-offset-2 hover:underline'
                  >
                    {topup.orderNumber}
                  </Link>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <EsimRequestDialog target={request} onClose={() => setRequest(null)} />
      <TopupDialog
        iccid={esim.iccid}
        open={topupOpen}
        onOpenChange={setTopupOpen}
        onDone={() => void queryClient.invalidateQueries({ queryKey: partnerPortalKeys.all })}
      />
    </div>
  );
}

/**
 * "Topup hộ khách": pick a package, pay the agent price from the deposit wallet
 * (doitac-1410 #039).
 */
function TopupDialog({
  iccid,
  open,
  onOpenChange,
  onDone
}: {
  iccid: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone: () => void;
}) {
  const [packageId, setPackageId] = useState<string | null>(null);
  const {
    data: packages = [],
    isLoading,
    error
  } = useQuery(myEsimTopupPackagesQueryOptions(iccid, open));
  const picked = packages.find((p) => p.packageId === packageId) ?? null;

  const topup = useMutation({
    mutationFn: () => topupMyEsim(iccid, packageId!),
    onSuccess: (result) => {
      toast.success(
        result.status === 'completed'
          ? `Đã topup, trừ ví ${formatVnd(result.amountVnd)} (đơn ${result.orderNumber}).`
          : `Đã trừ ví ${formatVnd(result.amountVnd)}; đơn ${result.orderNumber} đang được esim.vn xử lý.`
      );
      onDone();
      onOpenChange(false);
      setPackageId(null);
    },
    onError: (err: Error) => toast.error(err.message)
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>Topup hộ khách</DialogTitle>
          <DialogDescription>
            Nạp thêm dung lượng cho chính eSIM này. Tiền được trừ vào ví ký quỹ theo giá đại lý.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className='flex justify-center py-6'>
            <Icons.spinner className='size-5 animate-spin' />
          </div>
        ) : error ? (
          <p className='text-destructive text-sm'>{(error as Error).message}</p>
        ) : packages.length === 0 ? (
          <p className='text-muted-foreground text-sm'>Hiện chưa có gói topup nào cho eSIM này.</p>
        ) : (
          <div className='max-h-[50vh] space-y-2 overflow-y-auto' role='radiogroup'>
            {packages.map((pkg) => (
              <button
                key={pkg.packageId}
                type='button'
                role='radio'
                aria-checked={packageId === pkg.packageId}
                disabled={!pkg.purchasable}
                onClick={() => setPackageId(pkg.packageId)}
                className={`w-full rounded-lg border p-3 text-left text-sm transition-colors disabled:opacity-50 ${
                  packageId === pkg.packageId ? 'border-primary bg-primary/5' : 'hover:bg-muted'
                }`}
              >
                <div className='flex items-center justify-between gap-2'>
                  <span className='font-medium'>{pkg.name}</span>
                  <span className='font-semibold'>
                    {pkg.purchasable ? formatVnd(pkg.agentPriceVnd) : 'Chưa có giá'}
                  </span>
                </div>
                <div className='text-muted-foreground mt-1 flex flex-wrap gap-x-4 text-xs'>
                  <span>{pkg.isUnlimited ? 'Không giới hạn' : pkg.dataText || '—'}</span>
                  <span>{pkg.durationDays ? `${pkg.durationDays} ngày` : '—'}</span>
                  {pkg.retailPriceVnd > 0 && <span>Giá lẻ: {formatVnd(pkg.retailPriceVnd)}</span>}
                </div>
              </button>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Huỷ
          </Button>
          <Button disabled={!picked || topup.isPending} onClick={() => topup.mutate()}>
            {topup.isPending
              ? 'Đang topup…'
              : picked
                ? `Topup – trừ ví ${formatVnd(picked.agentPriceVnd)}`
                : 'Chọn gói topup'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
