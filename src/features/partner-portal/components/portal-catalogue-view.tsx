'use client';

/**
 * "Sản phẩm & bảng giá" cho đối tác phân phối (#046).
 *
 * Màn hình này là chỗ đối tác tiêu tiền ký quỹ, nên mọi con số phải nói đúng
 * một điều: bấm xong thì ví còn lại bao nhiêu. Số tiền trên nút xác nhận lấy
 * từ **cùng một API** mà máy chủ dùng lúc trừ ví, không tự nhân lại ở trình
 * duyệt — nhân lại là cách chắc chắn nhất để hai con số lệch nhau.
 *
 * Quyết định đã chốt 02/10/2026: mua được mọi gói đang bán, không giới hạn số
 * lượng (đủ tiền là mua được), giao hàng bằng một file Excel tải về.
 */

import { useDeferredValue, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
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
import { formatDataSize, formatVnd } from '@/lib/format';

import { createPurchaseMutation } from '../api/mutations';
import {
  myWalletQueryOptions,
  partnerCatalogueQueryOptions,
  purchaseQuoteQueryOptions
} from '../api/queries';
import type { CataloguePlan, CatalogueFilters } from '../api/types';
import { EMPTY_CATALOGUE_FILTERS, PortalCatalogueFilters } from './portal-catalogue-filters';
import { PortalCartBar } from './portal-cart-bar';
import { PriceVndUsd } from './price-vnd-usd';
import {
  AddToCartDialog,
  PLAN_TYPE_LABEL,
  PlanDetailDialog,
  yesNo
} from './portal-catalogue-dialogs';

export function PortalCatalogueView() {
  // The admin's filters (doitac-1410 #033); typing is deferred so each key
  // press does not fire its own request.
  const [filters, setFilters] = useState<CatalogueFilters>(EMPTY_CATALOGUE_FILTERS);
  const [limit, setLimit] = useState(100);
  const deferredFilters = useDeferredValue(filters);
  const [selected, setSelected] = useState<CataloguePlan | null>(null);
  const [quantity, setQuantity] = useState('1');
  // "Xem chi tiết" and "Thêm giỏ hàng" (doitac-1410 #034).
  const [detail, setDetail] = useState<CataloguePlan | null>(null);
  const [carting, setCarting] = useState<CataloguePlan | null>(null);
  // The customer the QR codes are emailed to (doitac-1410 #034).
  const [recipientEmail, setRecipientEmail] = useState('');
  const emailValid =
    !recipientEmail.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail.trim());

  const { data: catalogue, isLoading } = useQuery(
    partnerCatalogueQueryOptions({ ...deferredFilters, limit })
  );
  const totalCount = catalogue?.totalCount ?? 0;
  const { data: wallet } = useQuery(myWalletQueryOptions());

  const plans = catalogue?.plans ?? [];

  // Số lượng chỉ hợp lệ khi là số nguyên dương. Một ô trống hoặc "abc" phải
  // tắt hẳn báo giá thay vì gửi NaN lên máy chủ.
  const parsedQuantity = useMemo(() => {
    const value = Number(quantity);
    return Number.isInteger(value) && value > 0 ? value : 0;
  }, [quantity]);

  const { data: quote, isFetching: quoting } = useQuery(
    purchaseQuoteQueryOptions(selected?.id ?? 0, parsedQuantity)
  );

  const purchase = useMutation({
    ...createPurchaseMutation,
    onSuccess: (result) => {
      // eSIMs from most providers arrive a little after the order, by webhook
      // (doitac-1410 #006), so the order is placed but not all of them are in.
      toast.success(
        result.pendingEsims > 0
          ? `Đã đặt ${result.quantity} eSIM — đơn ${result.orderNumber}. Nhà cung cấp đang cấp ${result.pendingEsims} eSIM, sẽ hiện ở Quản lý eSIM trong ít phút.`
          : recipientEmail.trim()
            ? `Đã đặt ${result.quantity} eSIM — đơn ${result.orderNumber}. Mã QR đã gửi tới ${recipientEmail.trim()}.`
            : `Đã đặt ${result.quantity} eSIM — đơn ${result.orderNumber}. Tải file Excel ở trang Đơn hàng.`
      );
      setSelected(null);
      setQuantity('1');
      setRecipientEmail('');
    },
    onError: (error: Error) => toast.error(error.message)
  });

  const closeDialog = (open: boolean) => {
    if (!open) {
      setSelected(null);
      setQuantity('1');
    }
  };

  return (
    <div className='grid min-w-0 flex-1 grid-cols-1 gap-4'>
      {/*
        No cards above the list (doitac-1410 #006): the balance moved to the top
        bar, and the % added to cost price is a trade secret never shown to a
        partner.
      */}
      <Card className='min-w-0'>
        <CardHeader>
          <CardTitle>Bảng giá phân phối</CardTitle>
          <CardDescription>
            Giá đại lý theo hạng hiện tại của bạn. Mua xong, toàn bộ mã eSIM của đơn được xuất ra
            một file Excel tải về ở trang Đơn hàng.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <PortalCatalogueFilters
            value={filters}
            onChange={(next) => {
              setFilters(next);
              setLimit(100);
            }}
          />
          {/* Balance, cart and checkout between filters and list (doitac-1410 #035). */}
          <PortalCartBar filters={deferredFilters} />
          {!isLoading && (
            <p className='text-muted-foreground text-xs' data-testid='catalogue-count'>
              {totalCount.toLocaleString('vi-VN')} gói đang bán phù hợp
              {plans.length < totalCount ? ` · đang hiện ${plans.length}` : ''}
            </p>
          )}

          {isLoading ? (
            <div className='flex justify-center py-12'>
              <Icons.spinner className='size-6 animate-spin' />
            </div>
          ) : plans.length === 0 ? (
            <p className='text-muted-foreground py-12 text-center text-sm'>
              Không có gói nào khớp với bộ lọc này.
            </p>
          ) : (
            <div className='overflow-x-auto'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tên gói</TableHead>
                    <TableHead>Điểm đến</TableHead>
                    <TableHead>Dữ liệu</TableHead>
                    <TableHead>Thời hạn</TableHead>
                    <TableHead>Tốc độ sau giảm tốc</TableHead>
                    <TableHead>Gọi / SMS</TableHead>
                    <TableHead>Loại gói</TableHead>
                    <TableHead>Topup</TableHead>
                    <TableHead>Tiktok & AI</TableHead>
                    <TableHead>Hoàn tiền</TableHead>
                    <TableHead className='text-right'>Giá đại lý</TableHead>
                    <TableHead className='text-right'>Giá bán lẻ đề xuất</TableHead>
                    <TableHead>Rẻ nhất</TableHead>
                    <TableHead className='text-right'>Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plans.map((plan) => (
                    <TableRow key={plan.id} data-testid={`plan-row-${plan.id}`}>
                      <TableCell className='max-w-[240px] min-w-[180px]'>{plan.name}</TableCell>
                      <TableCell className='text-xs'>{plan.destinationName ?? '—'}</TableCell>
                      <TableCell className='text-xs whitespace-nowrap tabular-nums'>
                        {formatDataSize(plan.dataMb)}
                      </TableCell>
                      <TableCell className='text-xs whitespace-nowrap tabular-nums'>
                        {plan.durationDays} ngày
                      </TableCell>
                      <TableCell className='text-xs'>{plan.throttleSpeed || '—'}</TableCell>
                      <TableCell className='text-xs whitespace-nowrap'>
                        {/* One cell for the three, calls and SMS beneath (#034). */}
                        <span className='block'>{yesNo(plan.hasCallSms)}</span>
                        {plan.hasCallSms && (
                          <>
                            <span className='text-muted-foreground block'>
                              Gọi: {plan.call ?? 0} phút
                            </span>
                            <span className='text-muted-foreground block'>
                              SMS: {plan.sms ?? 0}
                            </span>
                          </>
                        )}
                      </TableCell>
                      <TableCell className='text-xs'>
                        {PLAN_TYPE_LABEL[plan.type ?? ''] ?? plan.type ?? '—'}
                      </TableCell>
                      <TableCell className='text-xs'>{yesNo(plan.topUp)}</TableCell>
                      <TableCell className='text-xs'>{yesNo(plan.tiktokAi)}</TableCell>
                      <TableCell className='text-xs'>
                        <span className={plan.refundable ? '' : 'text-destructive'}>
                          {yesNo(plan.refundable)}
                        </span>
                      </TableCell>
                      <TableCell className='text-right font-medium whitespace-nowrap tabular-nums'>
                        {plan.purchasable ? (
                          <PriceVndUsd vnd={plan.unitPriceVnd} usd={plan.unitPriceUsd} />
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell className='text-right whitespace-nowrap tabular-nums'>
                        {plan.purchasable ? (
                          <PriceVndUsd
                            vnd={plan.suggestedRetailVnd ?? 0}
                            usd={plan.suggestedRetailUsd}
                          />
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell className='text-xs'>{yesNo(plan.isCheapest)}</TableCell>
                      <TableCell className='text-right'>
                        <div className='flex justify-end gap-1'>
                          <Button size='sm' variant='ghost' onClick={() => setDetail(plan)}>
                            Xem chi tiết
                          </Button>
                          {plan.purchasable ? (
                            <>
                              <Button
                                size='sm'
                                variant='outline'
                                onClick={() => setCarting(plan)}
                                aria-label='Thêm giỏ hàng'
                              >
                                <Icons.shoppingCart className='size-4' />
                                Thêm giỏ hàng
                              </Button>
                              <Button size='sm' onClick={() => setSelected(plan)}>
                                Đặt mua
                              </Button>
                            </>
                          ) : (
                            <Badge variant='outline' title='Gói chưa có giá vốn'>
                              Chưa bán
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {plans.length < totalCount && (
                <div className='flex justify-center pt-3'>
                  <Button variant='outline' size='sm' onClick={() => setLimit((l) => l + 100)}>
                    Xem thêm gói
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={selected !== null} onOpenChange={closeDialog}>
        <DialogContent className='sm:max-w-lg'>
          <DialogHeader>
            <DialogTitle>Đặt mua eSIM</DialogTitle>
            <DialogDescription>{selected?.name}</DialogDescription>
          </DialogHeader>

          <div className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='purchase-quantity'>Số lượng</Label>
              <Input
                id='purchase-quantity'
                type='number'
                min={1}
                step={1}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
              <p className='text-muted-foreground text-xs'>
                Không giới hạn số lượng — chỉ cần đủ số dư trong ví ký quỹ.
              </p>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='purchase-email'>Email nhận mã QR eSIM</Label>
              <Input
                id='purchase-email'
                type='email'
                placeholder='khachhang@email.com'
                value={recipientEmail}
                aria-invalid={!emailValid}
                onChange={(e) => setRecipientEmail(e.target.value)}
              />
              <p
                className={
                  emailValid ? 'text-muted-foreground text-xs' : 'text-destructive text-xs'
                }
              >
                {emailValid
                  ? 'Hệ thống gửi thẳng mã QR của từng eSIM tới email này, kèm logo thương hiệu của bạn. Để trống thì chỉ tải mã eSIM bằng file Excel ở trang Đơn hàng.'
                  : 'Email không hợp lệ.'}
              </p>
            </div>

            <div className='bg-muted/50 space-y-2 rounded-md p-3 text-sm'>
              <Row label='Giá vốn một eSIM' value={formatVnd(quote?.unitPriceVnd ?? 0)} />
              <Row
                label='Tổng trừ ví'
                value={quoting ? '…' : formatVnd(quote?.totalVnd ?? 0)}
                strong
              />
              <Row
                label='Doanh thu bán ra (giá niêm yết)'
                value={formatVnd(quote?.listTotalVnd ?? 0)}
              />
              <Row
                label='Chênh lệch nếu bán đúng giá niêm yết'
                value={`${(quote?.marginVnd ?? 0) < 0 ? '−' : '+'}${formatVnd(
                  Math.abs(quote?.marginVnd ?? 0)
                )}`}
              />
              <Row
                label='Số dư sau khi mua'
                value={formatVnd(
                  Math.max(0, (wallet?.availableBalanceVnd ?? 0) - (quote?.totalVnd ?? 0))
                )}
              />
            </div>

            {quote?.rejection && <p className='text-destructive text-sm'>{quote.rejection}</p>}
          </div>

          <DialogFooter>
            <Button variant='outline' onClick={() => closeDialog(false)}>
              Huỷ
            </Button>
            <Button
              disabled={
                !selected ||
                parsedQuantity < 1 ||
                !emailValid ||
                quoting ||
                Boolean(quote?.rejection) ||
                purchase.isPending
              }
              onClick={() =>
                selected &&
                purchase.mutate({
                  planId: selected.id,
                  quantity: parsedQuantity,
                  ...(recipientEmail.trim() ? { recipientEmail: recipientEmail.trim() } : {})
                })
              }
            >
              {purchase.isPending ? 'Đang đặt…' : `Xác nhận trừ ${formatVnd(quote?.totalVnd ?? 0)}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PlanDetailDialog plan={detail} onOpenChange={(o) => !o && setDetail(null)} />
      <AddToCartDialog plan={carting} onOpenChange={(o) => !o && setCarting(null)} />
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className='flex items-center justify-between gap-4'>
      <span className='text-muted-foreground'>{label}</span>
      <span className={`tabular-nums ${strong ? 'font-semibold' : ''}`}>{value}</span>
    </div>
  );
}
