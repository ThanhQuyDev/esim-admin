'use client';

import { esimQrLogoSettings } from '@/features/esims/lib/esim-qr';
import { esimStatusLabel, esimStatusVariant } from '@/features/esims/lib/esim-status';
import {
  callSmsSummary,
  dailyResetText,
  hasCallOrSms,
  isDailyPlanType,
  planDisplayName,
  planTypeLabel
} from '@/features/plans/utils/plan-label';
import { useSuspenseQuery, useMutation } from '@tanstack/react-query';
import { orderQueryOptions } from '../api/queries';
import { refundOrderMutation, retryOrderProvisioningMutation } from '../api/mutations';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Order, OrderItemEsim, OrderItemPlan } from '../api/types';
import { Icons } from '@/components/icons';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import { useState } from 'react';
import { toast } from 'sonner';
import { RefundOrderModal } from './refund-order-modal';
import { OrderNotesSection } from './order-notes-section';
import { ResendEsimEmailButton } from './resend-esim-email-button';
import { RetryProvisioningDialog } from './retry-provisioning-dialog';
import { CreateInvoiceDialog } from './create-invoice-dialog';
import { InvoiceViewDialog } from './invoice-view-dialog';
import { canIssueInvoice } from '../utils/invoice-filter';
import { formatCountry, formatDataSize, formatDateTimeVn } from '@/lib/format';
import { ValueAfterRefund } from '../utils/refund-values';
import { commissionRejectionText } from '@/lib/commission-rejection';
import { providerLabel } from '@/features/overview/api/constants';

interface OrderDetailViewProps {
  orderId: number;
}

const orderStatusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'outline',
  confirmed: 'default',
  processing: 'secondary',
  completed: 'default',
  cancelled: 'destructive',
  refunded: 'destructive'
};

/**
 * What each attribution warning on an order means (#036, #040).
 *
 * The column carries one or more codes, comma-separated, and none of them
 * withholds the commission — they mark a pattern worth a look at the partner's
 * other orders.
 */
export const attributionWarningLabels: Record<string, { badge: string; note: string }> = {
  same_device_or_ip: {
    badge: 'Cùng thiết bị / IP',
    note: 'Đơn này phát sinh từ cùng thiết bị hoặc cùng IP với một đơn khác của đối tác.'
  },
  // The partner's own computer or network (doitac-1410 #025).
  partner_device: {
    badge: 'Cùng thiết bị với đối tác',
    note: 'Đơn này đặt từ đúng thiết bị (cùng IP và trình duyệt) mà đối tác dùng để vào trang đối tác trong 30 ngày qua.'
  },
  partner_ip: {
    badge: 'Cùng IP với đối tác',
    note: 'Đơn này đặt từ cùng mạng (IP) mà đối tác dùng để vào trang đối tác trong 30 ngày qua.'
  },
  no_browsing: {
    badge: 'Không xem gói nào',
    note: 'Phiên mua này đi thẳng từ link tới trang thanh toán, không xem gói nào — dấu hiệu của đơn dựng bằng script (hoặc trình duyệt đã chặn đoạn mã theo dõi).'
  },
  inhuman_speed: {
    badge: 'Xem gói quá nhanh',
    note: 'Phiên mua này xem hàng chục gói chỉ trong vài giây, không phải tốc độ của người thật.'
  }
};

function parseAttributionWarnings(warning?: string | null) {
  return (warning ?? '')
    .split(',')
    .map((code) => code.trim())
    .filter(Boolean)
    .map(
      (code) =>
        attributionWarningLabels[code] ?? {
          badge: code,
          note: `Hệ thống đánh dấu đơn này: ${code}.`
        }
    );
}

// The local copy of this map had no `refunded` entry, so a refunded eSIM fell
// back to a grey outline badge reading the raw status — invisible when scrolling
// a multi-eSIM order (#019). The shared helper colours it red and labels it "Đã
// hoàn tiền", and keeps this page in step with the eSIM list.

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className='flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4'>
      <span className='text-muted-foreground w-44 shrink-0 text-sm font-medium'>{label}</span>
      <span className='text-sm'>{value || '—'}</span>
    </div>
  );
}

function formatDate(date: string | null | undefined) {
  if (!date) return '—';
  return formatDateTimeVn(date);
}

/** Usage counters arrive as strings of MB from the provider sync. */
function toMb(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatDataMb(value: string | number | null | undefined): string {
  const mb = toMb(value);
  if (mb === null) return '—';
  return mb >= 1024 ? `${(mb / 1024).toFixed(2)} GB` : `${mb} MB`;
}

/**
 * Remaining allowance. Shown explicitly rather than leaving the admin to
 * subtract "used / total" in their head while a customer waits on the phone.
 */
function remainingData(
  used: string | number | null | undefined,
  total: string | number | null | undefined
): string {
  const usedMb = toMb(used);
  const totalMb = toMb(total);
  if (usedMb === null || totalMb === null) return '—';
  if (totalMb <= 0) return 'Không giới hạn';
  return formatDataMb(Math.max(totalMb - usedMb, 0));
}

function formatCurrency(amount: number, currency: string) {
  if (currency === 'VND') {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD'
  }).format(amount);
}

function CopyLinkButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success('Đã copy vào clipboard');
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Button
      type='button'
      variant='outline'
      size='icon'
      onClick={handleCopy}
      className='h-8 w-8 shrink-0'
      aria-label='Copy link'
      title={copied ? 'Đã copy!' : 'Copy'}
    >
      {copied ? (
        <Icons.check className='size-3.5 text-green-500' />
      ) : (
        <Icons.copy className='size-3.5' />
      )}
    </Button>
  );
}

/** "Có" / "Không", or "—" when the plan is not loaded (doitac-1410 #081). */
function yesNo(value: boolean | undefined | null): string {
  if (value === undefined || value === null) return '—';
  return value ? 'Có' : 'Không';
}

function EsimDetailCard({ esim, plan }: { esim: OrderItemEsim; plan?: OrderItemPlan | null }) {
  return (
    <div className='rounded-lg border p-4 space-y-4'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <span className='font-mono text-xs font-medium'>{esim.iccid}</span>
          {/* The eSIM list's status — "Đã gửi eSIM", "Đang dùng", "Hết hạn",
              "Đã hoàn tiền" — not the supplier's raw one (vande #024). */}
          <Badge
            variant={esimStatusVariant(esim.lifecycleStatus ?? esim.status)}
            data-testid='order-esim-status'
          >
            {esimStatusLabel(esim.lifecycleStatus ?? esim.status)}
          </Badge>
        </div>
        {esim.provider && <Badge variant='outline'>{esim.provider}</Badge>}
      </div>

      <div className='grid gap-4 md:grid-cols-2'>
        {/* Technical Info */}
        <div className='space-y-2'>
          <h6 className='text-xs font-semibold uppercase text-muted-foreground'>
            Thông tin kỹ thuật
          </h6>
          <InfoRow
            label='SMDP Address'
            value={<span className='font-mono text-xs break-all'>{esim.smdpAddress || '—'}</span>}
          />
          <InfoRow
            label='Activation Code'
            value={
              <span className='font-mono text-xs break-all'>{esim.activationCode || '—'}</span>
            }
          />
          <InfoRow
            label='LPA'
            value={<span className='font-mono text-xs break-all'>{esim.lpa || '—'}</span>}
          />
          {/* IP instead of Match ID, plus the phone number and what the eSIM
              supports (doitac-1410 #081). */}
          <InfoRow
            label='IP'
            value={
              <span className='font-mono text-xs' data-testid='esim-ip'>
                {plan?.ipExport || '—'}
              </span>
            }
          />
          <InfoRow label='APN' value={esim.apnValue || '—'} />
          {/* KYC instead of the supplier's transaction number (vande #024). */}
          <InfoRow
            label='Yêu cầu KYC'
            value={<span data-testid='esim-kyc'>{yesNo(plan?.isKyc)}</span>}
          />
          <InfoRow label='Số điện thoại' value={esim.phoneNumber || '—'} />
          <InfoRow
            label='Hỗ trợ Topup'
            value={<span data-testid='esim-topup'>{yesNo(plan?.topUp)}</span>}
          />
          <InfoRow
            label='Hỗ trợ hoàn tiền'
            value={<span data-testid='esim-refundable'>{yesNo(plan?.isRefundable)}</span>}
          />
          <InfoRow
            label='Giờ làm mới mỗi ngày'
            value={<span data-testid='esim-daily-reset'>{dailyResetText(plan) ?? '—'}</span>}
          />
        </div>

        {/* Network & Usage */}
        <div className='space-y-2'>
          <h6 className='text-xs font-semibold uppercase text-muted-foreground'>Mạng & Sử dụng</h6>
          {plan && (
            <>
              <InfoRow label='Nhà mạng' value={plan.operatorName || '—'} />
              <InfoRow label='Tốc độ' value={plan.speed || '—'} />
              <InfoRow label='Tốc độ sau khi hết data' value={plan.fupSpeed || '—'} />
            </>
          )}
          {/* Total first, then what is used of it (vande #024). */}
          <InfoRow label='Tổng dung lượng' value={formatDataMb(esim.dataTotal)} />
          <InfoRow label='Đã dùng' value={formatDataMb(esim.dataUsed)} />
          <InfoRow label='Còn lại' value={remainingData(esim.dataUsed, esim.dataTotal)} />
          {/* Minutes / SMS instead of the Roaming flag, which said nothing useful
              about the eSIM (#013). Shown only when the plan carries an
              allowance, so a data-only eSIM does not grow a "Không" row. */}
          {plan && hasCallOrSms(plan) && (
            <InfoRow
              label='Phút gọi / SMS'
              value={<span className='font-medium'>{callSmsSummary(plan)}</span>}
            />
          )}
          {/* The phone the eSIM went on (vande #011). */}
          <InfoRow label='EID' value={esim.eid || '—'} />
          {esim.deviceModel && <InfoRow label='Thiết bị' value={esim.deviceModel} />}
          <InfoRow label='Cài đặt' value={formatDate(esim.installedAt)} />
          <InfoRow label='Kích hoạt' value={formatDate(esim.activatedAt)} />
          <InfoRow label='Hết hạn' value={formatDate(esim.expiresAt)} />
        </div>
      </div>

      {/* QR Code & Install Links */}
      <div className='space-y-2'>
        <h6 className='text-xs font-semibold uppercase text-muted-foreground'>
          Kích hoạt & Cài đặt
        </h6>
        <div className='grid gap-4 md:grid-cols-2'>
          {esim.lpa && (
            <div className='flex flex-col items-center gap-2 rounded-md border p-3'>
              <span className='text-xs font-medium text-muted-foreground'>Mã QR kích hoạt</span>
              <QRCodeSVG
                value={esim.lpa}
                size={128}
                level='H'
                imageSettings={esimQrLogoSettings(128)}
              />
            </div>
          )}
          <div className='space-y-2'>
            {esim.lpa && (
              <>
                <div className='space-y-1'>
                  <span className='text-xs font-medium text-muted-foreground'>
                    Link cài đặt iOS
                  </span>
                  <div className='flex items-center gap-2'>
                    <a
                      href={`https://esimsetup.apple.com/esim_qrcode_provisioning?carddata=${esim.lpa}`}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='block min-w-0 flex-1 truncate rounded-md border px-3 py-2 text-xs text-blue-600 hover:underline'
                    >
                      {`https://esimsetup.apple.com/esim_qrcode_provisioning?carddata=${esim.lpa}`}
                    </a>
                    <CopyLinkButton
                      value={`https://esimsetup.apple.com/esim_qrcode_provisioning?carddata=${esim.lpa}`}
                    />
                  </div>
                </div>
                <div className='space-y-1'>
                  <span className='text-xs font-medium text-muted-foreground'>
                    Link cài đặt Android
                  </span>
                  <div className='flex items-center gap-2'>
                    <a
                      href={`https://esimsetup.android.com/esim_qrcode_provisioning?carddata=${esim.lpa}`}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='block min-w-0 flex-1 truncate rounded-md border px-3 py-2 text-xs text-blue-600 hover:underline'
                    >
                      {`https://esimsetup.android.com/esim_qrcode_provisioning?carddata=${esim.lpa}`}
                    </a>
                    <CopyLinkButton
                      value={`https://esimsetup.android.com/esim_qrcode_provisioning?carddata=${esim.lpa}`}
                    />
                  </div>
                </div>
                <div className='space-y-1'>
                  <span className='text-xs font-medium text-muted-foreground'>LPA</span>
                  <div className='flex items-center gap-2'>
                    <p className='min-w-0 flex-1 rounded-md border px-3 py-2 font-mono text-xs break-all'>
                      {esim.lpa}
                    </p>
                    <CopyLinkButton value={esim.lpa} />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Commission lifecycle as an admin reads it (#095). */
function commissionStatusLabel(status: string): string {
  if (status === 'credited') return 'Đã ghi có';
  if (status === 'reversed') return 'Đã hoàn lại';
  if (status === 'rejected') return 'Bị loại hoa hồng';
  return 'Chờ đối soát';
}

function commissionStatusVariant(
  status: string
): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'credited') return 'default';
  if (status === 'reversed' || status === 'rejected') return 'destructive';
  return 'secondary';
}

/**
 * Why a commission was refused outright (#041).
 *
 * The partner will write in to ask, so whoever answers needs the detail that
 * matched rather than "đơn này không phát sinh hoa hồng".
 */
// The words are shared with the partner portal (doitac-1410 #027).
const rejectionReasonLabel = commissionRejectionText;
const DEVICE_TYPE_LABEL: Record<string, string> = {
  desktop: 'Máy tính',
  mobile: 'Di động',
  tablet: 'Máy tính bảng'
};

/** "Di động · Safari 18 · iOS 18"; "—" for orders made in the CMS or before #082. */
function deviceLabel(device: Order['device']): string {
  if (!device) return '—';
  const parts = [
    device.type ? DEVICE_TYPE_LABEL[device.type] : null,
    device.browser,
    device.os
  ].filter(Boolean);
  return parts.length ? parts.join(' · ') : '—';
}

/**
 * "Ho Chi Minh City, Vietnam - IP: 14.161.22.33" (vande #058). Orders placed
 * before it was recorded, and orders placed by staff, have neither.
 */
function buyerLocationText(location?: string | null, ip?: string | null): string {
  if (!location && !ip) return '—';
  if (!ip) return location!;
  return location ? `${location} - IP: ${ip}` : `IP: ${ip}`;
}

export function OrderDetailView({ orderId }: OrderDetailViewProps) {
  const { data: order } = useSuspenseQuery(orderQueryOptions(orderId));
  const [refundOpen, setRefundOpen] = useState(false);
  const [retryOpen, setRetryOpen] = useState(false);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [invoiceViewOpen, setInvoiceViewOpen] = useState(false);

  const retryMutation = useMutation({
    ...retryOrderProvisioningMutation,
    onSuccess: (result) => {
      setRetryOpen(false);
      if (result.retriedItemIds.length === 0) {
        // Nothing was re-ordered — say so plainly instead of a green tick.
        toast.info(result.message);
      } else {
        // The message already says whether the eSIM email went out, which
        // depends on whether the supplier answers synchronously (#014).
        toast.success(result.message);
      }
    },
    onError: (e) => toast.error(e.message || 'Gọi lại nhà cung cấp thất bại')
  });

  const refundMutation = useMutation({
    ...refundOrderMutation,
    onSuccess: (result) => {
      toast.success(`Đã hoàn tiền cho đơn hàng ${order.orderNumber}`);
      // Refund requests sent to Airalo (#079) and Billion (vande #004), with
      // their request number.
      if (result.supplierRequests?.length) {
        toast.info('Đã gửi yêu cầu hoàn tiền tới nhà cung cấp', {
          description: result.supplierRequests.join(' · '),
          duration: 20000
        });
      }
      // The customer is refunded either way; a supplier that refused to cancel
      // means our own money is still with them (v3 #002).
      if (result.supplierWarnings?.length) {
        toast.warning('Nhà cung cấp chưa hủy, cần liên hệ để lấy lại tiền', {
          description: result.supplierWarnings.join(' · '),
          duration: 20000
        });
      }
      setRefundOpen(false);
    },
    onError: (e) => {
      toast.error(e.message || 'Hoàn tiền thất bại');
    }
  });

  // Money after refunds, from the API (#009); the original sits struck through.
  const after = order.afterRefund;
  // Cash + eXU. `payableVndPrice` is the cash on every kind of order; a
  // topup keeps its full price in `vndPrice`, which double-counted eXU.
  const paidVnd =
    Number(order.payableVndPrice ?? order.vndPrice ?? 0) + Number(order.walletSpentVndAmount ?? 0);
  const canRefund = order.status === 'paid';
  const canResendEmail = order.status === 'paid';
  const hasWalletPayment =
    (order.walletSpentVndAmount ?? 0) > 0 || (order.cashbackAmountVnd ?? 0) > 0;

  return (
    // `min-w-0` on every card: a long install link (an eSIM's LPA) used to
    // stretch the whole page to 1300px on a phone (vande #058).
    <div className='grid min-w-0 grid-cols-1 gap-6 *:min-w-0'>
      <RefundOrderModal
        orderId={order.id}
        orderNumber={order.orderNumber}
        payableVndPrice={Number(order.payableVndPrice ?? order.vndPrice ?? 0)}
        walletSpentVndAmount={order.walletSpentVndAmount}
        refundedAmountVnd={order.refundedAmountVnd}
        items={order.items}
        benefits={{
          tier: order.membershipTierSnapshot ?? null,
          cashbackPercent: order.cashbackPercentSnapshot ?? null,
          cashbackVnd: Number(order.cashbackAmountVnd ?? 0),
          referral: order.referralReward ?? null
        }}
        open={refundOpen}
        onOpenChange={setRefundOpen}
        onSubmit={(data) => refundMutation.mutate({ id: order.id, data })}
        isSubmitting={refundMutation.isPending}
      />
      <RetryProvisioningDialog
        orderNumber={order.orderNumber}
        items={order.items}
        open={retryOpen}
        onOpenChange={setRetryOpen}
        onSubmit={(itemIds) => retryMutation.mutate({ orderId: order.id, itemIds })}
        isSubmitting={retryMutation.isPending}
      />
      <CreateInvoiceDialog
        orderId={order.id}
        orderNumber={order.orderNumber}
        open={invoiceOpen}
        onOpenChange={setInvoiceOpen}
        defaultEmail={order.user?.email}
      />
      {order.invoice && (
        <InvoiceViewDialog
          invoice={order.invoice}
          orderNumber={order.orderNumber}
          open={invoiceViewOpen}
          onOpenChange={setInvoiceViewOpen}
        />
      )}

      {/* Admin actions */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Icons.settings className='h-4 w-4' />
            Thao tác quản trị
          </CardTitle>
        </CardHeader>
        <CardContent className='flex flex-wrap gap-3'>
          {/* A bulk "file" order is delivered as this list (vande #057). */}
          {order.bulkMode === 'file' && (
            <Button type='button' size='sm' asChild data-testid='bulk-esim-list'>
              <a href={`/api/admin/orders/${order.id}/esim-list`}>
                <Icons.download className='mr-2 h-4 w-4' />
                Tải file danh sách eSIM
              </a>
            </Button>
          )}
          <ResendEsimEmailButton
            orderId={order.id}
            orderStatus={canResendEmail ? 'paid' : order.status}
            size='sm'
          />
          {/* #030: re-ask the supplier for eSIMs this order never received,
              e.g. after the deposit with them ran dry mid-order. #014 added the
              picker, so an order with several eSIMs can be retried line by line. */}
          {order.status === 'paid' && (
            <Button
              type='button'
              size='sm'
              variant='outline'
              disabled={retryMutation.isPending}
              onClick={() => setRetryOpen(true)}
            >
              {retryMutation.isPending ? (
                <Icons.spinner className='mr-2 h-4 w-4 animate-spin' />
              ) : (
                <Icons.send className='mr-2 h-4 w-4' />
              )}
              Gọi lại API lấy eSIM
            </Button>
          )}
          {order.invoice ? (
            // An invoice that already exists stays viewable whatever happened to
            // the order afterwards — hiding it would hide the record (#011).
            <Button
              type='button'
              size='sm'
              variant='outline'
              onClick={() => setInvoiceViewOpen(true)}
            >
              <Icons.eye className='mr-2 h-4 w-4' />
              Xem hóa đơn
              <Badge
                variant={order.invoice.status === 'ISSUED' ? 'default' : 'outline'}
                className='ml-2 px-1.5 py-0 text-[10px]'
              >
                {order.invoice.status}
              </Badge>
            </Button>
          ) : canIssueInvoice(order.status) ? (
            <Button type='button' size='sm' variant='outline' onClick={() => setInvoiceOpen(true)}>
              <Icons.fileTypePdf className='mr-2 h-4 w-4' />
              Xuất hóa đơn
            </Button>
          ) : null}
          {/* Refund sits with the other admin actions instead of in a card of its
              own further down the page (#012). */}
          {canRefund && (
            <Button
              type='button'
              variant='destructive'
              size='sm'
              onClick={() => setRefundOpen(true)}
              title='Hoàn tiền về ví eXu hoặc chuyển khoản trực tiếp'
            >
              <Icons.undo className='mr-2 h-4 w-4' />
              Hoàn tiền
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Order Info */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-3'>
            Thông tin đơn hàng
            <Badge variant={orderStatusVariant[order.status] ?? 'outline'}>{order.status}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className='grid gap-4 md:grid-cols-2'>
          <div className='space-y-3'>
            <InfoRow label='ID' value={order.id} />
            <InfoRow
              label='Mã đơn hàng'
              value={<span className='font-mono text-xs font-medium'>{order.orderNumber}</span>}
            />
            {/* Desktop / mobile / tablet and the browser it was bought from (#082). */}
            <InfoRow
              label='Thiết bị'
              value={<span data-testid='order-device'>{deviceLabel(order.device)}</span>}
            />
            {/* After refunds, the original struck through beside it (#009). */}
            <InfoRow
              label='Tổng tiền'
              value={
                <ValueAfterRefund
                  value={after?.totalAmount ?? Number(order.totalAmount)}
                  original={after?.originalTotalAmount ?? Number(order.totalAmount)}
                  format={(n) => formatCurrency(n, order.currency)}
                />
              }
            />
            <InfoRow
              label='Giá bán VND'
              value={
                <ValueAfterRefund
                  value={after?.orderValueVnd ?? paidVnd}
                  original={after?.originalOrderValueVnd ?? paidVnd}
                  format={(n) => formatCurrency(n, 'VND')}
                />
              }
            />
            <InfoRow
              label='Giá vốn VND'
              value={
                <ValueAfterRefund
                  value={after?.vndCostPrice ?? Number(order.vndCostPrice)}
                  original={after?.originalVndCostPrice ?? Number(order.vndCostPrice)}
                  format={(n) => formatCurrency(n, 'VND')}
                />
              }
            />
            {after && after.refundedVnd > 0 && (
              <InfoRow
                label='Đã hoàn tiền'
                value={
                  <span className='font-medium text-amber-600'>
                    -{formatCurrency(after.refundedVnd, 'VND')}
                    <span className='text-muted-foreground ml-1 text-xs font-normal'>
                      (ví eXU {formatCurrency(after.refundedToWalletVnd, 'VND')} · chuyển khoản{' '}
                      {formatCurrency(after.refundedDirectVnd, 'VND')})
                    </span>
                  </span>
                }
              />
            )}
          </div>
          <div className='space-y-3'>
            <InfoRow label='Thanh toán' value={order.paymentMethod} />
            <InfoRow
              label='Payment ID'
              value={<span className='font-mono text-xs'>{order.paymentId}</span>}
            />
            <InfoRow
              label='Coupon'
              value={order.couponCode ? <Badge variant='secondary'>{order.couponCode}</Badge> : '—'}
            />
            <InfoRow
              label='Giảm giá'
              value={formatCurrency(order.couponDiscountVndAmount, 'VND')}
            />
            {order.referralCode && (
              <>
                <InfoRow
                  label='Mã giới thiệu'
                  value={<Badge variant='outline'>{order.referralCode}</Badge>}
                />
                <InfoRow
                  label='Giảm giá giới thiệu'
                  value={
                    <span className='font-semibold text-blue-600'>
                      -{formatCurrency(order.referralDiscountVndAmount || 10000, 'VND')}
                    </span>
                  }
                />
              </>
            )}
            <InfoRow label='Ngày tạo' value={formatDate(order.createdAt)} />
            <InfoRow label='Cập nhật' value={formatDate(order.updatedAt)} />
          </div>
          {/* Notes and the refund history (doitac-1410 #067). */}
          <OrderNotesSection
            orderId={order.id}
            notes={order.notes ?? []}
            refunds={order.refunds ?? []}
          />
        </CardContent>
      </Card>

      {/* Topup: what the package gave, what it cost, and the eSIM it was applied
          to — none of which reached this page before (#015). */}
      {order.topup && (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Icons.refresh className='h-4 w-4' />
              Gói Topup
            </CardTitle>
            <CardDescription>
              Nạp thêm cho eSIM đã mua trước đó. Đối chiếu kết quả với eSIM ở cột bên phải.
            </CardDescription>
          </CardHeader>
          <CardContent className='grid gap-6 md:grid-cols-2'>
            <div className='space-y-3'>
              <p className='text-muted-foreground text-xs font-semibold uppercase'>
                Ưu đãi của gói
              </p>
              <InfoRow label='Tên gói' value={order.topup.packageName || '—'} />
              <InfoRow
                label='Dung lượng'
                value={order.topup.isUnlimited ? 'Không giới hạn' : order.topup.dataText || '—'}
              />
              <InfoRow
                label='Thời hạn'
                value={order.topup.durationDays ? `${order.topup.durationDays} ngày` : '—'}
              />
              <InfoRow label='Nhà cung cấp' value={order.topup.provider || '—'} />
              <InfoRow
                label='Mã gói'
                value={
                  <span className='font-mono text-xs break-all'>
                    {order.topup.packageId || '—'}
                  </span>
                }
              />
              <InfoRow label='Giá bán' value={formatCurrency(order.vndPrice, 'VND')} />
              <InfoRow label='Giá vốn' value={formatCurrency(order.vndCostPrice, 'VND')} />
              <InfoRow
                label='Lợi nhuận'
                value={
                  <span className='font-semibold'>
                    {formatCurrency(
                      Number(order.vndPrice ?? 0) - Number(order.vndCostPrice ?? 0),
                      'VND'
                    )}
                  </span>
                }
              />
            </div>

            <div className='space-y-3'>
              <p className='text-muted-foreground text-xs font-semibold uppercase'>eSIM được nạp</p>
              <InfoRow
                label='ICCID'
                value={
                  <span className='font-mono text-xs break-all'>{order.topup.targetIccid}</span>
                }
              />
              {order.topup.targetEsim ? (
                <>
                  <InfoRow label='Gói eSIM gốc' value={order.topup.targetEsim.planName || '—'} />
                  <InfoRow
                    label='Trạng thái eSIM'
                    value={
                      <Badge variant={esimStatusVariant(order.topup.targetEsim.status)}>
                        {esimStatusLabel(order.topup.targetEsim.status)}
                      </Badge>
                    }
                  />
                  <InfoRow label='Đã dùng' value={formatDataMb(order.topup.targetEsim.dataUsed)} />
                  <InfoRow
                    label='Tổng dung lượng'
                    value={formatDataMb(order.topup.targetEsim.dataTotal)}
                  />
                  <InfoRow
                    label='Kích hoạt'
                    value={formatDate(order.topup.targetEsim.activatedAt)}
                  />
                  <InfoRow label='Hết hạn' value={formatDate(order.topup.targetEsim.expiresAt)} />
                  {order.topup.targetEsim.originalOrderId && (
                    <InfoRow
                      label='Đơn mua gốc'
                      value={
                        <Link
                          href={`/dashboard/orders/${order.topup.targetEsim.originalOrderId}`}
                          className='text-primary underline underline-offset-4'
                        >
                          {/* The order number staff know it by, not the id (#021). */}
                          {order.topup.targetEsim.originalOrderNumber ??
                            `#${order.topup.targetEsim.originalOrderId}`}
                        </Link>
                      }
                    />
                  )}
                </>
              ) : (
                <p className='text-muted-foreground text-sm'>
                  Không tìm thấy eSIM với ICCID này trong hệ thống — kiểm tra lại mã ICCID khách đã
                  nhập.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Customer, with the eXU wallet breakdown as its right-hand column (#012)
          — both were full-width cards of their own on an already long page. */}
      {(order.user || hasWalletPayment) && (
        <Card>
          <CardHeader>
            {/* The customer's ID sits beside the title, boxed, so the rows
                below have room for "Vị trí & IP" (vande #058). */}
            <CardTitle className='flex flex-wrap items-center justify-between gap-2'>
              Khách hàng
              {order.user && (
                <span
                  className='rounded-md border px-2 py-0.5 font-mono text-xs font-medium'
                  data-testid='customer-id'
                >
                  ID: {order.user.id}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent
            className={order.user && hasWalletPayment ? 'grid gap-6 md:grid-cols-2' : 'space-y-3'}
          >
            {order.user && (
              <div className='space-y-3'>
                <InfoRow label='Email' value={order.user.email} />
                <InfoRow
                  label='Họ và tên'
                  value={
                    [order.user.firstName, order.user.lastName].filter(Boolean).join(' ') || '—'
                  }
                />
                <InfoRow label='Số điện thoại' value={order.user.phoneNumber || '—'} />
                <InfoRow
                  label='Vị trí & IP'
                  value={
                    <span data-testid='customer-location'>
                      {buyerLocationText(order.buyerLocation, order.buyerIp)}
                    </span>
                  }
                />
              </div>
            )}
            {hasWalletPayment && (
              <div className='space-y-3'>
                <p className='flex items-center gap-2 text-sm font-medium'>
                  <Icons.creditCard className='h-4 w-4' />
                  Thanh toán eXU Wallet
                </p>
                {order.walletSpentVndAmount != null && order.walletSpentVndAmount > 0 && (
                  <>
                    <InfoRow
                      label='Số tiền dùng từ ví eXU'
                      value={
                        <span className='font-semibold text-orange-600'>
                          {formatCurrency(order.walletSpentVndAmount, 'VND')}
                        </span>
                      }
                    />
                    <InfoRow
                      label='Còn lại thanh toán tiền'
                      value={
                        <span className='font-semibold'>
                          {formatCurrency(order.vndPrice, 'VND')}
                        </span>
                      }
                    />
                  </>
                )}
                {order.cashbackAmountVnd != null && order.cashbackAmountVnd > 0 && (
                  <InfoRow
                    label='Hoàn lại vào ví eXU'
                    value={
                      <ValueAfterRefund
                        className='font-semibold text-green-600'
                        value={after?.cashbackVnd ?? Number(order.cashbackAmountVnd)}
                        original={after?.originalCashbackVnd ?? Number(order.cashbackAmountVnd)}
                        format={(n) => `+${formatCurrency(n, 'VND')}`}
                      />
                    }
                  />
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Affiliate: who earned on this order, and how much (#095). The list
          used to show only the referral code, which named nobody. */}
      {order.partnerCommission && (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-3'>
              Đối tác Affiliate
              <Badge variant={commissionStatusVariant(order.partnerCommission.status)}>
                {commissionStatusLabel(order.partnerCommission.status)}
              </Badge>
              {parseAttributionWarnings(order.attributionWarning).map((warning) => (
                <Badge
                  key={warning.badge}
                  variant='outline'
                  className='border-amber-300 text-amber-700'
                >
                  <Icons.warning className='mr-1 size-3' />
                  {warning.badge}
                </Badge>
              ))}
            </CardTitle>
            {rejectionReasonLabel(order.partnerCommission.rejectionReason) && (
              <CardDescription className='text-destructive' data-testid='commission-rejection'>
                Không ghi nhận hoa hồng cho đơn này. Lý do:{' '}
                {rejectionReasonLabel(order.partnerCommission.rejectionReason)}
              </CardDescription>
            )}
            {order.attributionWarning && (
              <CardDescription>
                {parseAttributionWarnings(order.attributionWarning)
                  .map((warning) => warning.note)
                  .join(' ')}{' '}
                Hoa hồng vẫn được ghi nhận — nên xem thêm các giao dịch khác của đối tác này.
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className='grid gap-4 md:grid-cols-2'>
            <div className='space-y-3'>
              <InfoRow
                label='Đối tác'
                value={
                  order.partnerCommission.partnerName || `#${order.partnerCommission.partnerId}`
                }
              />
              {/* Named as on the partner pages (vande #027): the link the
                  customer came through, or the partner's own discount code. */}
              <InfoRow
                label='Nguồn ghi nhận'
                value={
                  <span data-testid='affiliate-source'>
                    {order.partnerCommission.linkCode ? (
                      <Badge variant='outline'>Link {order.partnerCommission.linkCode}</Badge>
                    ) : order.couponCode ? (
                      <Badge variant='outline'>Mã {order.couponCode}</Badge>
                    ) : (
                      'Khách gắn với đối tác'
                    )}
                  </span>
                }
              />
              <InfoRow
                label='Hạng lúc phát sinh'
                value={order.partnerCommission.tierSnapshot || '—'}
              />
            </div>
            <div className='space-y-3'>
              <InfoRow
                label='Hoa hồng trả đối tác'
                value={
                  <ValueAfterRefund
                    value={order.partnerCommission.commissionVnd}
                    original={after?.originalCommissionVnd ?? order.partnerCommission.commissionVnd}
                    format={(n) => formatCurrency(n, 'VND')}
                  />
                }
              />
              {/* Four decimals (vande #007): one decimal times the order
                  value missed the commission by a few hundred đồng. */}
              <InfoRow
                label='Tỷ lệ trên giá trị đơn'
                value={
                  order.partnerCommission.commissionPercent > 0
                    ? `${order.partnerCommission.commissionPercent.toLocaleString('vi-VN', {
                        maximumFractionDigits: 4
                      })}%`
                    : '—'
                }
              />
            </div>
          </CardContent>
        </Card>
      )}
      {/* Coupon Info */}
      {order.coupon && (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-3'>
              Thông tin Coupon
              <Badge variant={order.coupon.isActive ? 'default' : 'destructive'}>
                {order.coupon.isActive ? 'Đang hoạt động' : 'Hết hạn'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className='grid gap-4 md:grid-cols-2'>
            <div className='space-y-3'>
              {/* Public or private code beside it (vande #027). */}
              <InfoRow
                label='Mã'
                value={
                  <span className='flex flex-wrap items-center gap-2'>
                    <Badge variant='secondary'>{order.coupon.code}</Badge>
                    <Badge variant='outline' data-testid='coupon-visibility'>
                      {order.coupon.isPublic === false ? 'Mã riêng tư' : 'Mã chung'}
                    </Badge>
                  </span>
                }
              />
              {/* A percentage shows its cap in đồng beside it (vande #027). */}
              <InfoRow
                label='Giảm giá'
                value={
                  <span data-testid='coupon-discount'>
                    {order.coupon.discountType === 'fixed'
                      ? formatCurrency(Number(order.coupon.discountAmount ?? 0), 'VND')
                      : `${Number(order.coupon.discountPercent)}%${
                          Number(order.coupon.maxDiscountAmount) > 0
                            ? ` (tối đa ${formatCurrency(Number(order.coupon.maxDiscountAmount), 'VND')})`
                            : ''
                        }`}
                  </span>
                }
              />
              {/* In đồng, not the order's currency (vande #027). */}
              <InfoRow
                label='Đơn tối thiểu'
                value={
                  <span data-testid='coupon-min-order'>
                    {formatCurrency(Number(order.coupon.minOrderAmount ?? 0), 'VND')}
                  </span>
                }
              />
            </div>
            <div className='space-y-3'>
              <InfoRow
                label='Sử dụng'
                value={`${order.coupon.usageCount} / ${order.coupon.maxUsage}`}
              />
              <InfoRow label='Tối đa/người' value={order.coupon.maxUsagePerUser} />
              <InfoRow label='Hết hạn' value={formatDate(order.coupon.expiresAt)} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* A bulk order is announced instead of its eSIMs listed (vande #057). */}
      {order.bulkMode && (
        <Alert data-testid='bulk-order-note'>
          <Icons.info className='h-4 w-4' />
          <AlertTitle>
            {order.bulkMode === 'file'
              ? 'Đơn đặt hàng loạt — xuất file danh sách eSIM'
              : 'Đơn đặt hàng loạt — gửi email mã QR lần lượt'}
          </AlertTitle>
          <AlertDescription>
            {order.bulkMode === 'file'
              ? 'Không gửi email cho khách. Thông tin gói cước và mã QR của từng eSIM nằm trong file "Tải file danh sách eSIM" ở Thao tác quản trị.'
              : `Email mã QR của đơn này được gửi lần lượt cùng các đơn khác trong cùng file, cách nhau ${order.bulkEmailIntervalSec ?? 30} giây.`}
          </AlertDescription>
        </Alert>
      )}

      {/* Order Items — left out of a bulk "file" order, too many to show (vande #057). */}
      {order.bulkMode !== 'file' && order.items && order.items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Sản phẩm ({order.items.length})</CardTitle>
          </CardHeader>
          <CardContent className='space-y-6'>
            {order.items.map((item) => (
              <div key={item.id} className='space-y-4'>
                <div className='rounded-lg border p-4'>
                  <div className='mb-3 flex flex-wrap items-center justify-between gap-2'>
                    <div className='flex flex-wrap items-center gap-2'>
                      <h4 className='text-sm font-semibold' data-testid='order-item-name'>
                        {item.plan?.standardName ||
                          planDisplayName(item.plan, `Plan #${item.planId}`)}
                      </h4>
                      {/* Kind of plan, in a thin frame beside the name (vande #024). */}
                      {planTypeLabel(item.plan?.type) && (
                        <span
                          className='text-muted-foreground rounded border px-1.5 py-0.5 text-xs'
                          data-testid='order-item-type'
                        >
                          {planTypeLabel(item.plan?.type)}
                        </span>
                      )}
                    </div>
                    <Badge
                      variant={
                        item.status === 'completed'
                          ? 'default'
                          : item.status === 'cancelled'
                            ? 'destructive'
                            : 'outline'
                      }
                    >
                      {item.status}
                    </Badge>
                  </div>
                  {/* The supplier refused this line (vande #003): paid, no eSIM. */}
                  {item.provisioning?.lastError && (
                    <div
                      className='border-destructive/40 bg-destructive/5 text-destructive mb-3 space-y-1 rounded-md border p-3 text-sm'
                      data-testid={`provision-error-${item.id}`}
                    >
                      <p className='font-semibold'>
                        Nhà cung cấp chưa nhận đơn — đã thử {item.provisioning.attempts} lần
                      </p>
                      <p className='break-words'>Lỗi: {item.provisioning.lastError}</p>
                      <p className='text-muted-foreground'>
                        Lần thử gần nhất: {formatDate(item.provisioning.lastAttemptAt)}.{' '}
                        {item.provisioning.nextAutoRetryAt
                          ? `Hệ thống tự gọi lại lúc ${formatDate(item.provisioning.nextAutoRetryAt)}.`
                          : 'Hệ thống đã ngừng tự gọi lại — bấm "Gọi lại API lấy eSIM" hoặc hoàn tiền cho khách.'}
                      </p>
                    </div>
                  )}
                  {/* Product left, supplier and offer right (vande #024). The
                      dollar price is the line's, quantity included — it used to
                      show the unit price beside a line total in đồng. */}
                  <div className='grid gap-3 md:grid-cols-2'>
                    <div className='space-y-2' data-testid='order-item-left'>
                      <InfoRow
                        label='Tên gói cước'
                        value={
                          item.plan?.standardName ||
                          planDisplayName(item.plan, `Plan #${item.planId}`)
                        }
                      />
                      <InfoRow label='Số lượng' value={item.quantity} />
                      <InfoRow
                        label='Giá vốn VND'
                        value={formatCurrency(item.vndCostPrice, 'VND')}
                      />
                      <InfoRow label='Giá bán VND' value={formatCurrency(item.vndPrice, 'VND')} />
                      <InfoRow
                        label='Giá bán $'
                        value={
                          <span data-testid='order-item-usd'>
                            {formatCurrency(
                              Math.round(Number(item.price) * Number(item.quantity || 1) * 100) /
                                100,
                              item.currency
                            )}
                            {Number(item.quantity) > 1 && (
                              <span className='text-muted-foreground'>
                                {' '}
                                ({formatCurrency(Number(item.price), item.currency)} ×{' '}
                                {item.quantity})
                              </span>
                            )}
                          </span>
                        }
                      />
                      <InfoRow
                        label='Mã gói NCC'
                        value={
                          item.plan?.providerPlanId ? (
                            <span className='font-mono text-xs'>{item.plan.providerPlanId}</span>
                          ) : (
                            '—'
                          )
                        }
                      />
                      <InfoRow
                        label='Slug gói eSIM'
                        value={
                          item.plan?.slug ? (
                            <span className='font-mono text-xs'>{item.plan.slug}</span>
                          ) : (
                            '—'
                          )
                        }
                      />
                    </div>
                    <div className='space-y-2' data-testid='order-item-right'>
                      {item.plan && (
                        <>
                          <InfoRow label='Nhà cung cấp' value={providerLabel(item.plan.provider)} />
                          <InfoRow
                            label='Điểm đến'
                            value={
                              item.plan.locationInfo ? (
                                <div className='flex items-center gap-2'>
                                  {item.plan.locationInfo.thumbnailUrl && (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                      src={item.plan.locationInfo.thumbnailUrl}
                                      alt={item.plan.locationInfo.slug}
                                      className='h-5 w-5 rounded object-cover'
                                    />
                                  )}
                                  <span>
                                    {item.plan.locationInfo.titleVi ??
                                      item.plan.locationInfo.title ??
                                      item.plan.locationInfo.slug}
                                  </span>
                                </div>
                              ) : (
                                formatCountry(item.plan.countryCode)
                              )
                            }
                          />
                          {/* A day pass is sold for the days the customer picked;
                              the plan itself says 1 day (vande #006). */}
                          <InfoRow
                            label='Thời hạn'
                            value={
                              item.periodNum && item.periodNum > 0
                                ? `${item.periodNum} ngày (khách chọn)`
                                : `${item.plan.durationDays} ngày`
                            }
                          />
                          <InfoRow
                            label='Dung lượng'
                            value={
                              <span data-testid='order-item-data'>
                                {item.plan.dataMb > 0
                                  ? `${formatDataSize(item.plan.dataMb)}${
                                      isDailyPlanType(item.plan.type) ? '/ngày' : ''
                                    }`
                                  : item.plan.fupSpeed
                                    ? `Không giới hạn ${item.plan.fupSpeed}`
                                    : 'Không giới hạn'}
                              </span>
                            }
                          />
                          <InfoRow label='Throttling' value={item.plan.fupSpeed || '—'} />
                          {/* Allowance on the product line too, so it is visible
                              without opening the eSIM cards below (#013). */}
                          {hasCallOrSms(item.plan) && (
                            <InfoRow label='Phút gọi / SMS' value={callSmsSummary(item.plan)} />
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* eSIMs for this item */}
                  {item.esims && item.esims.length > 0 && (
                    <div className='mt-4 space-y-3'>
                      <h5 className='text-muted-foreground text-xs font-semibold uppercase'>
                        eSIM ({item.esims.length})
                      </h5>
                      {item.esims.map((esim) => (
                        <EsimDetailCard key={esim.id} esim={esim} plan={item.plan} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export function OrderDetailSkeleton() {
  return (
    <div className='grid animate-pulse gap-6'>
      <div className='bg-muted h-64 rounded-lg' />
      <div className='bg-muted h-32 rounded-lg' />
      <div className='bg-muted h-48 rounded-lg' />
    </div>
  );
}
