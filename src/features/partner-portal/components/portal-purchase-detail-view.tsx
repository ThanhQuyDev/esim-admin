'use client';

/**
 * "Chi tiết đơn hàng" of a distribution partner's own order (doitac-1410 #042).
 *
 * The admin's order page without the customer block: the order (with the
 * email the QR codes went to), each product with its total at the agent price
 * and at the suggested retail price, and the eSIMs under it. The actions on
 * top work on the whole order — resend every eSIM's email, report a fault or
 * ask for a refund (a support ticket with no ICCID, since one order can hold
 * many eSIMs).
 */

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

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
import { formatDateTimeVn, formatVnd } from '@/lib/format';

import { adminPartnerOrderDetailQueryOptions } from '@/features/partners/api/queries';
import type { AdminOrderPartner } from '@/features/partners/api/types';
import { PartnerPurchaseRefundDialog } from '@/features/partners/components/partner-purchase-refund-dialog';

import { myPurchaseDetailQueryOptions } from '../api/queries';
import { resendPurchaseEmail } from '../api/service';
import type { MyPurchaseDetail } from '../api/types';
import { PLAN_TYPE_LABEL } from './portal-catalogue-dialogs';
import {
  EsimRequestDialog,
  type EsimRequestTarget,
  esimStatusLabel,
  formatData
} from './portal-esim-request-dialog';

const ORDER_STATUS: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }
> = {
  pending: { label: 'Chờ thanh toán', variant: 'outline' },
  paid: { label: 'Đã thanh toán', variant: 'default' },
  processing: { label: 'Đang xử lý', variant: 'secondary' },
  completed: { label: 'Hoàn tất', variant: 'default' },
  cancelled: { label: 'Đã huỷ', variant: 'destructive' },
  failed: { label: 'Thất bại', variant: 'destructive' },
  refunded: { label: 'Đã hoàn tiền', variant: 'destructive' },
  manual_intervention: { label: 'esim.vn đang xử lý', variant: 'secondary' }
};

const dateOrDash = (value: string | null) => (value ? formatDateTimeVn(value) : '—');

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className='flex flex-col gap-0.5 border-b py-2 last:border-0 sm:flex-row sm:items-start sm:justify-between sm:gap-4'>
      <span className='text-muted-foreground shrink-0 text-sm'>{label}</span>
      <span className='min-w-0 text-sm font-medium break-words sm:text-right'>{value ?? '—'}</span>
    </div>
  );
}

/**
 * `admin` is the admin's "Xem chi tiết" from "Đơn hàng đối tác" (doitac-1410
 * #058): the same page the partner reads, with who the partner is and a
 * "Hoàn tiền" that picks products or eSIMs instead of the partner's requests.
 */
export function PortalPurchaseDetailView({
  orderNumber,
  admin = false
}: {
  orderNumber: string;
  admin?: boolean;
}) {
  const mine = useQuery({ ...myPurchaseDetailQueryOptions(orderNumber), enabled: !admin });
  const asAdmin = useQuery({
    ...adminPartnerOrderDetailQueryOptions<MyPurchaseDetail & { partner: AdminOrderPartner }>(
      orderNumber,
      'distribution'
    ),
    enabled: admin
  });
  const { data: order, isLoading, error } = admin ? asAdmin : mine;
  const partner = admin ? asAdmin.data?.partner : undefined;
  const listHref = admin
    ? '/dashboard/partners/orders?tab=distribution'
    : '/dashboard/portal/orders';
  const [request, setRequest] = useState<EsimRequestTarget | null>(null);
  const [refundOpen, setRefundOpen] = useState(false);

  const resend = useMutation({
    mutationFn: () => resendPurchaseEmail(orderNumber),
    onSuccess: (result) =>
      toast.success(
        `Đã gửi lại ${result.sent} email eSIM${order?.deliveryEmail ? ` tới ${order.deliveryEmail}` : ''}.`
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
  if (error || !order) {
    return (
      <div className='space-y-3 py-12 text-center'>
        <p className='text-sm'>
          {(error as Error | null)?.message ?? 'Không tìm thấy đơn hàng này.'}
        </p>
        <Button asChild variant='outline' size='sm'>
          <Link href={listHref}>Về danh sách đơn hàng</Link>
        </Button>
      </div>
    );
  }

  const badge = ORDER_STATUS[order.status ?? ''] ?? {
    label: order.status ?? '—',
    variant: 'outline' as const
  };
  const isTopup = order.orderType === 'TOPUP';
  const closed = order.status === 'refunded';
  const anyRefundable = order.products.some((p) => p.refundable);

  return (
    <div className='grid min-w-0 grid-cols-1 gap-4'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <Button asChild variant='ghost' size='sm' className='px-2'>
          <Link href={listHref}>
            <Icons.chevronLeft className='size-4' />
            Danh sách đơn hàng
          </Link>
        </Button>
        {admin ? (
          <div className='flex flex-wrap gap-2' data-testid='purchase-detail-actions'>
            <Button
              variant='destructive'
              size='sm'
              disabled={closed || order.paidVnd - order.refundedVnd <= 0}
              title={closed ? 'Đơn đã được hoàn tiền' : undefined}
              onClick={() => setRefundOpen(true)}
            >
              Hoàn tiền
            </Button>
          </div>
        ) : (
          <div className='flex flex-wrap gap-2' data-testid='purchase-detail-actions'>
            {/* Every eSIM with its plan, LPA and QR link — how a bulk "file"
                order is delivered (vande #057). */}
            {!isTopup && order.esimCount > 0 && (
              <Button asChild size='sm' data-testid='purchase-esim-list'>
                <a
                  href={`/api/partner-portal/purchases/${encodeURIComponent(order.orderNumber)}/esim-list`}
                >
                  <Icons.download className='size-4' />
                  Tải danh sách eSIM + mã QR
                </a>
              </Button>
            )}
            <Button
              variant='outline'
              size='sm'
              disabled={isTopup || order.esimCount === 0 || resend.isPending}
              title={isTopup ? 'Đơn topup không có eSIM mới để gửi' : undefined}
              onClick={() => resend.mutate()}
            >
              <Icons.mail className='size-4' />
              {resend.isPending ? 'Đang gửi…' : 'Gửi lại email eSIM'}
            </Button>
            <Button
              variant='outline'
              size='sm'
              disabled={closed}
              onClick={() => setRequest({ orderNumber: order.orderNumber, kind: 'fault' })}
            >
              Báo lỗi
            </Button>
            <Button
              variant='outline'
              size='sm'
              disabled={closed || (!isTopup && !anyRefundable)}
              title={
                closed
                  ? 'Đơn đã được hoàn tiền'
                  : !isTopup && !anyRefundable
                    ? 'Các gói trong đơn này không hỗ trợ hoàn tiền'
                    : undefined
              }
              onClick={() => setRequest({ orderNumber: order.orderNumber, kind: 'refund' })}
            >
              Yêu cầu hoàn tiền
            </Button>
          </div>
        )}
      </div>

      <Card className='min-w-0'>
        <CardHeader>
          <CardTitle>Thông tin đơn hàng</CardTitle>
        </CardHeader>
        <CardContent className='grid grid-cols-1 gap-x-8 md:grid-cols-2'>
          {partner && (
            <InfoRow
              label='Đối tác'
              value={
                <Link
                  href={`/dashboard/partners/${partner.id}`}
                  className='text-primary hover:underline'
                  data-testid='detail-partner'
                >
                  {partner.name} · #{partner.id}
                </Link>
              }
            />
          )}
          <InfoRow
            label='Mã đơn hàng'
            value={<span className='font-mono'>{order.orderNumber}</span>}
          />
          <InfoRow
            label='Trạng thái'
            value={<Badge variant={badge.variant}>{badge.label}</Badge>}
          />
          <InfoRow label='Loại đơn' value={isTopup ? 'Topup' : 'Mua eSIM'} />
          <InfoRow label='Email nhận mã QR eSIM' value={order.deliveryEmail || '—'} />
          <InfoRow label='Phương thức thanh toán' value={order.paymentMethod} />
          <InfoRow label='Đã thanh toán' value={formatVnd(order.paidVnd)} />
          {order.refundedVnd > 0 && (
            <InfoRow label='Đã hoàn' value={formatVnd(order.refundedVnd)} />
          )}
          {!isTopup && (
            <>
              <InfoRow label='Tổng theo giá đại lý' value={formatVnd(order.agentTotalVnd)} />
              <InfoRow
                label='Tổng theo giá bán lẻ đề xuất'
                value={formatVnd(order.suggestedRetailTotalVnd)}
              />
            </>
          )}
          <InfoRow label='Ngày mua' value={dateOrDash(order.createdAt)} />
          <InfoRow label='Cập nhật' value={dateOrDash(order.updatedAt)} />
        </CardContent>
      </Card>

      {order.topup && (
        <Card className='min-w-0'>
          <CardHeader>
            <CardTitle>Gói topup</CardTitle>
          </CardHeader>
          <CardContent className='grid grid-cols-1 gap-x-8 md:grid-cols-2'>
            <InfoRow label='Gói' value={order.topup.packageName || '—'} />
            <InfoRow
              label='Dung lượng'
              value={order.topup.isUnlimited ? 'Không giới hạn' : order.topup.dataText || '—'}
            />
            <InfoRow
              label='Thời hạn'
              value={order.topup.durationDays ? `${order.topup.durationDays} ngày` : '—'}
            />
            <InfoRow
              label='eSIM được topup'
              value={
                order.topup.iccid && admin ? (
                  <span className='font-mono'>{order.topup.iccid}</span>
                ) : order.topup.iccid ? (
                  <Link
                    href={`/dashboard/portal/esims/${encodeURIComponent(order.topup.iccid)}`}
                    className='text-primary font-mono hover:underline'
                  >
                    {order.topup.iccid}
                  </Link>
                ) : (
                  '—'
                )
              }
            />
          </CardContent>
        </Card>
      )}

      {order.products.map((product, index) => (
        <Card key={`${product.planName}-${index}`} className='min-w-0'>
          <CardHeader>
            <CardTitle>
              {product.planName || 'Sản phẩm'} × {product.quantity}
            </CardTitle>
            <CardDescription>
              Giá đại lý {formatVnd(product.agentTotalVnd)} · Giá bán lẻ đề xuất{' '}
              {formatVnd(product.suggestedRetailTotalVnd)}
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid grid-cols-1 gap-x-8 md:grid-cols-2'>
              <InfoRow label='Điểm đến' value={product.destination || '—'} />
              <InfoRow label='Dung lượng' value={formatData(product.dataMb)} />
              <InfoRow
                label='Gọi / SMS'
                value={`${product.call ? `${product.call} phút` : 'Không'} / ${product.sms ? `${product.sms} SMS` : 'Không'}`}
              />
              <InfoRow
                label='Thời hạn dùng'
                value={product.durationDays ? `${product.durationDays} ngày` : '—'}
              />
              <InfoRow label='Nhà mạng' value={product.operatorName || '—'} />
              <InfoRow label='Tốc độ mạng' value={product.speed || '—'} />
              <InfoRow
                label='Loại gói'
                value={PLAN_TYPE_LABEL[product.type ?? ''] ?? product.type ?? '—'}
              />
              <InfoRow label='Hỗ trợ hoàn tiền' value={product.refundable ? 'Có' : 'Không'} />
            </div>

            <div className='overflow-x-auto'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ICCID</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Dữ liệu đã dùng</TableHead>
                    <TableHead>Kích hoạt</TableHead>
                    <TableHead>Hết hạn</TableHead>
                    <TableHead className='text-right'>Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {product.esims.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className='text-muted-foreground text-center text-sm'>
                        Chưa có eSIM nào được cấp.
                      </TableCell>
                    </TableRow>
                  ) : (
                    product.esims.map((esim) => {
                      const s = esimStatusLabel[esim.status ?? ''] ?? {
                        label: esim.status ?? '—',
                        variant: 'outline' as const
                      };
                      return (
                        <TableRow key={esim.iccid}>
                          <TableCell className='font-mono text-xs'>{esim.iccid}</TableCell>
                          <TableCell>
                            <Badge variant={s.variant}>{s.label}</Badge>
                            {esim.openReport && (
                              <div className='text-muted-foreground mt-1 text-[11px]'>
                                {esim.openReport === 'refund'
                                  ? 'Đang chờ hoàn tiền'
                                  : 'Đang chờ xử lý lỗi'}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className='text-xs whitespace-nowrap'>
                            {formatData(esim.dataUsed)} / {formatData(esim.dataTotal)}
                          </TableCell>
                          <TableCell className='text-xs'>{dateOrDash(esim.activatedAt)}</TableCell>
                          <TableCell className='text-xs'>{dateOrDash(esim.expiresAt)}</TableCell>
                          <TableCell className='text-right'>
                            {!admin && (
                              <Button
                                variant='link'
                                size='sm'
                                className='h-auto p-0 text-xs'
                                asChild
                              >
                                <Link
                                  href={`/dashboard/portal/esims/${encodeURIComponent(esim.iccid)}`}
                                >
                                  Xem chi tiết
                                </Link>
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ))}

      {(order.refunds ?? []).length > 0 && (
        <Card className='min-w-0' data-testid='purchase-refunds'>
          <CardHeader>
            <CardTitle>Lịch sử hoàn tiền về ví</CardTitle>
          </CardHeader>
          <CardContent className='space-y-2'>
            {(order.refunds ?? []).map((refund, index) => (
              <div
                key={`${refund.at}-${index}`}
                className='flex flex-col gap-0.5 border-b pb-2 text-sm last:border-0 sm:flex-row sm:justify-between sm:gap-4'
              >
                <span className='min-w-0 break-words'>{refund.reason ?? 'Hoàn tiền'}</span>
                <span className='shrink-0 tabular-nums'>
                  +{formatVnd(refund.amountVnd)} · {dateOrDash(refund.at)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {admin ? (
        <PartnerPurchaseRefundDialog order={order} open={refundOpen} onOpenChange={setRefundOpen} />
      ) : (
        <EsimRequestDialog target={request} onClose={() => setRequest(null)} />
      )}
    </div>
  );
}
