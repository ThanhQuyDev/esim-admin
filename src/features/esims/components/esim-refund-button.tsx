'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { getOrder, getOrders } from '@/features/orders/api/service';
import { refundOrderMutation } from '@/features/orders/api/mutations';
import { RefundOrderModal } from '@/features/orders/components/refund-order-modal';

/**
 * "Hoàn tiền" on an eSIM's page (vande-1411 #009): the order's own refund
 * popup — the same flow and warnings as on the order (vande-0411 #007–#009) —
 * opened with this eSIM ticked. Also for an order marked failed whose eSIM
 * came back anyway; the popup then reminds to check the customer paid.
 */
export function EsimRefundButton({
  esimId,
  orderNumber,
  refunded,
  refundable = true
}: {
  esimId: number;
  orderNumber?: string | null;
  refunded: boolean;
  /** The plan's own rule: local stock is not refundable (doitac-1410 #080). */
  refundable?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const code = (orderNumber ?? '').trim();

  const found = useQuery({
    queryKey: ['orders', 'by-number', code],
    enabled: !!code,
    queryFn: () =>
      getOrders({
        page: 1,
        limit: 5,
        filters: JSON.stringify({ orderNumber: code, includePartnerOrders: true })
      })
  });
  const orderId = found.data?.data.find(
    (o) => o.orderNumber.toLowerCase() === code.toLowerCase()
  )?.id;
  const detail = useQuery({
    queryKey: ['orders', 'detail', orderId],
    enabled: !!orderId,
    queryFn: () => getOrder(orderId!)
  });
  const order = detail.data;

  const refund = useMutation({
    ...refundOrderMutation,
    onSuccess: (result) => {
      toast.success(`Đã hoàn tiền eSIM trong đơn ${order?.orderNumber}`);
      if (result.supplierRequests?.length) {
        toast.info('Đã gửi yêu cầu hoàn tiền tới nhà cung cấp', {
          description: result.supplierRequests.join(' · '),
          duration: 20000
        });
      }
      if (result.supplierWarnings?.length) {
        toast.warning('Nhà cung cấp chưa hủy, cần liên hệ để lấy lại tiền', {
          description: result.supplierWarnings.join(' · '),
          duration: 20000
        });
      }
      setOpen(false);
      void detail.refetch();
    },
    onError: (e) => toast.error(e.message || 'Hoàn tiền thất bại')
  });

  // Only an order that took the customer's money: paid, or failed with the
  // eSIM delivered anyway. Never a pending one.
  const orderOk = !!order && ['paid', 'failed'].includes(String(order.status));
  const inOrder = !!order?.items?.some((item) => item.esims?.some((e) => e.id === esimId));
  const reason = refunded
    ? 'eSIM đã hoàn tiền'
    : !refundable
      ? 'Gói của eSIM này không hỗ trợ hoàn tiền'
      : !code
        ? 'eSIM chưa thuộc đơn hàng nào'
        : !order
          ? 'Đang tải đơn hàng…'
          : !orderOk
            ? `Đơn đang ở trạng thái ${order.status}, chưa hoàn tiền được`
            : !inOrder
              ? 'Không tìm thấy eSIM trong đơn hàng'
              : null;

  return (
    <>
      <span title={reason ?? undefined}>
        <Button
          variant='destructive'
          onClick={() => setOpen(true)}
          disabled={!!reason}
          data-testid='esim-refund'
        >
          <Icons.undo className='mr-2 h-4 w-4' />
          Hoàn tiền
        </Button>
      </span>
      {order && (
        <RefundOrderModal
          orderId={order.id}
          orderNumber={order.orderNumber}
          payableVndPrice={Number(order.payableVndPrice ?? order.vndPrice ?? 0)}
          // A failed order's eXU hold went back when it failed: cash only.
          walletSpentVndAmount={order.status === 'failed' ? 0 : order.walletSpentVndAmount}
          refundedAmountVnd={order.refundedAmountVnd}
          items={order.items}
          partnerPurchase={order.paymentMethod === 'partner_wallet'}
          benefits={{
            tier: order.membershipTierSnapshot ?? null,
            cashbackPercent: order.cashbackPercentSnapshot ?? null,
            cashbackVnd: Number(order.cashbackAmountVnd ?? 0),
            referral: order.referralReward ?? null
          }}
          initialEsimIds={[esimId]}
          notice={
            order.status === 'failed' ? (
              <Alert variant='destructive' data-testid='esim-refund-failed-note'>
                <Icons.warning className='h-4 w-4' />
                <AlertDescription>
                  Đơn đang ở trạng thái lỗi (failed) nhưng đã có mã QR eSIM. Kiểm tra đã nhận tiền
                  của khách trước khi hoàn. Chỉ hoàn được phần tiền mặt: eXU của đơn lỗi đã được trả
                  lại cho khách.
                </AlertDescription>
              </Alert>
            ) : null
          }
          open={open}
          onOpenChange={setOpen}
          onSubmit={(data) => refund.mutate({ id: order.id, data })}
          isSubmitting={refund.isPending}
        />
      )}
    </>
  );
}
