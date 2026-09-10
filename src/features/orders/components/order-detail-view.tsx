'use client';

import { esimQrLogoSettings } from '@/features/esims/lib/esim-qr';
import { useSuspenseQuery, useMutation } from '@tanstack/react-query';
import { orderQueryOptions } from '../api/queries';
import { refundOrderMutation, retryOrderProvisioningMutation } from '../api/mutations';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { OrderItemEsim, OrderItemPlan } from '../api/types';
import { Icons } from '@/components/icons';
import { QRCodeSVG } from 'qrcode.react';
import { useState } from 'react';
import { toast } from 'sonner';
import { RefundOrderModal } from './refund-order-modal';
import { ResendEsimEmailButton } from './resend-esim-email-button';
import { CreateInvoiceDialog } from './create-invoice-dialog';
import { InvoiceViewDialog } from './invoice-view-dialog';
import { formatCountry, formatDateTimeVn } from '@/lib/format';

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

const esimStatusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  available: 'outline',
  active: 'default',
  expired: 'destructive',
  deactivated: 'secondary'
};

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

function EsimDetailCard({ esim, plan }: { esim: OrderItemEsim; plan?: OrderItemPlan | null }) {
  return (
    <div className='rounded-lg border p-4 space-y-4'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <span className='font-mono text-xs font-medium'>{esim.iccid}</span>
          <Badge variant={esimStatusVariant[esim.status] ?? 'outline'}>{esim.status}</Badge>
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
          <InfoRow
            label='Match ID'
            value={<span className='font-mono text-xs break-all'>{esim.matchId || '—'}</span>}
          />
          <InfoRow label='APN' value={esim.apnValue || '—'} />
          <InfoRow
            label='eSIM Tran No'
            value={<span className='font-mono text-xs'>{esim.esimTranNo || '—'}</span>}
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
          <InfoRow label='Đã dùng' value={formatDataMb(esim.dataUsed)} />
          <InfoRow label='Còn lại' value={remainingData(esim.dataUsed, esim.dataTotal)} />
          <InfoRow label='Tổng dung lượng' value={formatDataMb(esim.dataTotal)} />
          <InfoRow label='SĐT' value={esim.phoneNumber || '—'} />
          <InfoRow
            label='Roaming'
            value={
              <Badge variant={esim.isRoaming ? 'default' : 'secondary'}>
                {esim.isRoaming ? 'Có' : 'Không'}
              </Badge>
            }
          />
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
  return 'Chờ đối soát';
}

function commissionStatusVariant(
  status: string
): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'credited') return 'default';
  if (status === 'reversed') return 'destructive';
  return 'secondary';
}
export function OrderDetailView({ orderId }: OrderDetailViewProps) {
  const { data: order } = useSuspenseQuery(orderQueryOptions(orderId));
  const [refundOpen, setRefundOpen] = useState(false);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [invoiceViewOpen, setInvoiceViewOpen] = useState(false);

  const retryMutation = useMutation({
    ...retryOrderProvisioningMutation,
    onSuccess: (result) => {
      if (result.retriedItemIds.length === 0) {
        // Nothing was re-ordered — say so plainly instead of a green tick.
        toast.info(result.message);
      } else {
        toast.success(
          `${result.message} Nhà cung cấp giao bất đồng bộ có thể mất vài phút mới trả eSIM về.`
        );
      }
    },
    onError: (e) => toast.error(e.message || 'Gọi lại nhà cung cấp thất bại')
  });

  const refundMutation = useMutation({
    ...refundOrderMutation,
    onSuccess: () => {
      toast.success(`Đã hoàn tiền cho đơn hàng ${order.orderNumber}`);
      setRefundOpen(false);
    },
    onError: () => {
      toast.error('Hoàn tiền thất bại');
    }
  });

  const canRefund = order.status === 'paid';
  const canResendEmail = order.status === 'paid';

  return (
    <div className='grid gap-6'>
      <RefundOrderModal
        orderId={order.id}
        orderNumber={order.orderNumber}
        payableVndPrice={order.vndPrice}
        walletSpentVndAmount={order.walletSpentVndAmount}
        refundedAmountVnd={order.refundedAmountVnd}
        items={order.items}
        open={refundOpen}
        onOpenChange={setRefundOpen}
        onSubmit={(data) => refundMutation.mutate({ id: order.id, data })}
        isSubmitting={refundMutation.isPending}
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
          <ResendEsimEmailButton
            orderId={order.id}
            orderStatus={canResendEmail ? 'paid' : order.status}
            size='sm'
          />
          {/* #030: re-ask the supplier for eSIMs this order never received,
              e.g. after the deposit with them ran dry mid-order. */}
          {order.status === 'paid' && (
            <Button
              type='button'
              size='sm'
              variant='outline'
              disabled={retryMutation.isPending}
              onClick={() => retryMutation.mutate(order.id)}
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
          ) : (
            <Button type='button' size='sm' variant='outline' onClick={() => setInvoiceOpen(true)}>
              <Icons.fileTypePdf className='mr-2 h-4 w-4' />
              Xuất hóa đơn
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
            <InfoRow label='Tổng tiền' value={formatCurrency(order.totalAmount, order.currency)} />
            <InfoRow
              label='Giá bán VND'
              value={formatCurrency(
                Number(order.vndPrice ?? 0) + Number(order.walletSpentVndAmount ?? 0),
                'VND'
              )}
            />
            <InfoRow label='Giá vốn VND' value={formatCurrency(order.vndCostPrice, 'VND')} />
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
        </CardContent>
      </Card>

      {/* eXU Wallet Payment Breakdown */}
      {(order.walletSpentVndAmount != null && order.walletSpentVndAmount > 0) ||
      (order.cashbackAmountVnd != null && order.cashbackAmountVnd > 0) ? (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Icons.creditCard className='h-4 w-4' />
              Thanh toán eXU Wallet
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-3'>
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
                    <span className='font-semibold'>{formatCurrency(order.vndPrice, 'VND')}</span>
                  }
                />
              </>
            )}
            {order.cashbackAmountVnd != null && order.cashbackAmountVnd > 0 && (
              <InfoRow
                label='Hoàn lại vào ví eXU'
                value={
                  <span className='font-semibold text-green-600'>
                    +{formatCurrency(order.cashbackAmountVnd, 'VND')}
                  </span>
                }
              />
            )}
          </CardContent>
        </Card>
      ) : null}

      {/* Refund Action */}
      {canRefund && (
        <Card>
          <CardContent className='flex items-center justify-between pt-6'>
            <div>
              <p className='text-sm font-medium'>Hoàn tiền đơn hàng</p>
              <p className='text-muted-foreground text-xs'>
                Hoàn tiền về ví eXu hoặc chuyển khoản trực tiếp
              </p>
            </div>
            <Button variant='destructive' size='sm' onClick={() => setRefundOpen(true)}>
              <Icons.undo className='mr-2 h-4 w-4' />
              Hoàn tiền
            </Button>
          </CardContent>
        </Card>
      )}

      {/* User Info */}
      {order.user && (
        <Card>
          <CardHeader>
            <CardTitle>Khách hàng</CardTitle>
          </CardHeader>
          <CardContent className='space-y-3'>
            <InfoRow label='ID' value={order.user.id} />
            <InfoRow label='Email' value={order.user.email} />
            <InfoRow
              label='Họ và tên'
              value={[order.user.firstName, order.user.lastName].filter(Boolean).join(' ') || '—'}
            />
            <InfoRow label='Số điện thoại' value={order.user.phoneNumber || '—'} />
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
            </CardTitle>
          </CardHeader>
          <CardContent className='grid gap-4 md:grid-cols-2'>
            <div className='space-y-3'>
              <InfoRow
                label='Đối tác'
                value={
                  order.partnerCommission.partnerName || `#${order.partnerCommission.partnerId}`
                }
              />
              <InfoRow
                label='Mã liên kết'
                value={
                  order.partnerCommission.linkCode ? (
                    <Badge variant='outline'>{order.partnerCommission.linkCode}</Badge>
                  ) : (
                    order.referralCode || '—'
                  )
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
                value={formatCurrency(order.partnerCommission.commissionVnd, 'VND')}
              />
              <InfoRow
                label='Tỷ lệ trên giá trị đơn'
                value={
                  order.partnerCommission.commissionPercent > 0
                    ? `${order.partnerCommission.commissionPercent}%`
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
              <InfoRow label='Mã' value={<Badge variant='secondary'>{order.coupon.code}</Badge>} />
              <InfoRow label='Giảm giá' value={`${order.coupon.discountPercent}%`} />
              <InfoRow
                label='Đơn tối thiểu'
                value={formatCurrency(order.coupon.minOrderAmount, order.currency)}
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

      {/* Order Items */}
      {order.items && order.items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Sản phẩm ({order.items.length})</CardTitle>
          </CardHeader>
          <CardContent className='space-y-6'>
            {order.items.map((item) => (
              <div key={item.id} className='space-y-4'>
                <div className='rounded-lg border p-4'>
                  <div className='mb-3 flex items-center justify-between'>
                    <h4 className='text-sm font-semibold'>
                      {item.plan?.name || `Plan #${item.planId}`}
                    </h4>
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
                  <div className='grid gap-3 md:grid-cols-2'>
                    <div className='space-y-2'>
                      <InfoRow label='ID' value={item.id} />
                      <InfoRow label='Số lượng' value={item.quantity} />
                      <InfoRow label='Giá' value={formatCurrency(item.price, item.currency)} />
                      <InfoRow label='Giá VND' value={formatCurrency(item.vndPrice, 'VND')} />
                      <InfoRow
                        label='Giá vốn VND'
                        value={formatCurrency(item.vndCostPrice, 'VND')}
                      />
                    </div>
                    <div className='space-y-2'>
                      {item.plan && (
                        <>
                          <InfoRow label='Nhà cung cấp' value={item.plan.provider} />
                          <InfoRow label='Quốc gia' value={formatCountry(item.plan.countryCode)} />
                          <InfoRow label='Thời hạn' value={`${item.plan.durationDays} ngày`} />
                          <InfoRow
                            label='Dung lượng'
                            value={
                              item.plan.dataMb >= 1024
                                ? `${(item.plan.dataMb / 1024).toFixed(1)} GB`
                                : `${item.plan.dataMb} MB`
                            }
                          />
                          <InfoRow label='Tốc độ' value={item.plan.speed} />
                          {item.plan.locationInfo && (
                            <InfoRow
                              label='Điểm đến'
                              value={
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
                                  <Badge variant='outline' className='text-[10px]'>
                                    {item.plan.locationInfo.type}
                                  </Badge>
                                </div>
                              }
                            />
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
