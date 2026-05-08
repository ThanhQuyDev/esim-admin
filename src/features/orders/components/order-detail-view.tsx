'use client';

import { useSuspenseQuery, useMutation } from '@tanstack/react-query';
import { orderQueryOptions } from '../api/queries';
import { refundOrderMutation } from '../api/mutations';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import type { OrderItemEsim } from '../api/types';
import { Icons } from '@/components/icons';
import { useState } from 'react';
import { toast } from 'sonner';
import { RefundOrderModal } from './refund-order-modal';

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
  return new Date(date).toLocaleString('vi-VN');
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

function EsimRow({ esim }: { esim: OrderItemEsim }) {
  return (
    <TableRow>
      <TableCell className='font-mono text-xs'>{esim.iccid}</TableCell>
      <TableCell>
        <Badge variant={esimStatusVariant[esim.status] ?? 'outline'}>{esim.status}</Badge>
      </TableCell>
      <TableCell>{esim.provider || '—'}</TableCell>
      <TableCell>
        {esim.dataUsed} / {esim.dataTotal}
      </TableCell>
      <TableCell>{esim.phoneNumber || '—'}</TableCell>
      <TableCell>
        <Badge variant={esim.isRoaming ? 'default' : 'secondary'}>
          {esim.isRoaming ? 'Có' : 'Không'}
        </Badge>
      </TableCell>
      <TableCell>{formatDate(esim.activatedAt)}</TableCell>
      <TableCell>{formatDate(esim.expiresAt)}</TableCell>
    </TableRow>
  );
}

export function OrderDetailView({ orderId }: OrderDetailViewProps) {
  const { data: order } = useSuspenseQuery(orderQueryOptions(orderId));
  const [refundOpen, setRefundOpen] = useState(false);

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

  const canRefund = order.status === 'paid' || order.status === 'refunded';

  return (
    <div className='grid gap-6'>
      <RefundOrderModal
        orderId={order.id}
        orderNumber={order.orderNumber}
        payableVndPrice={order.vndPrice}
        open={refundOpen}
        onOpenChange={setRefundOpen}
        onSubmit={(data) => refundMutation.mutate({ id: order.id, data })}
        isSubmitting={refundMutation.isPending}
      />
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
            <InfoRow label='Giá VND' value={formatCurrency(order.vndPrice, 'VND')} />
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
              value={formatCurrency(order.discountAmount, order.currency)}
            />
            <InfoRow label='Ngày tạo' value={formatDate(order.createdAt)} />
            <InfoRow label='Cập nhật' value={formatDate(order.updatedAt)} />
          </div>
        </CardContent>
      </Card>

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
                          <InfoRow label='Quốc gia' value={item.plan.countryCode} />
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
                        </>
                      )}
                    </div>
                  </div>

                  {/* eSIMs for this item */}
                  {item.esims && item.esims.length > 0 && (
                    <div className='mt-4'>
                      <h5 className='text-muted-foreground mb-2 text-xs font-semibold uppercase'>
                        eSIM ({item.esims.length})
                      </h5>
                      <div className='overflow-x-auto rounded-md border'>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>ICCID</TableHead>
                              <TableHead>Trạng thái</TableHead>
                              <TableHead>Provider</TableHead>
                              <TableHead>Dữ liệu</TableHead>
                              <TableHead>SĐT</TableHead>
                              <TableHead>Roaming</TableHead>
                              <TableHead>Kích hoạt</TableHead>
                              <TableHead>Hết hạn</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {item.esims.map((esim) => (
                              <EsimRow key={esim.id} esim={esim} />
                            ))}
                          </TableBody>
                        </Table>
                      </div>
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
