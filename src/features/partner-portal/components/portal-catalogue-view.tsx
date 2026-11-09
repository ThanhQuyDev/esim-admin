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

import { purchaseKindLabel } from '@/lib/plan-purchase-kind';
import { useDeferredValue, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
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
import { formatDataSize, formatVnd } from '@/lib/format';
import { cn } from '@/lib/utils';

import { createPurchaseMutation } from '../api/mutations';
import {
  myWalletQueryOptions,
  partnerCatalogueQueryOptions,
  purchaseQuoteQueryOptions
} from '../api/queries';
import type { CataloguePlan, CatalogueFilters } from '../api/types';
import { EMPTY_CATALOGUE_FILTERS, PortalCatalogueFilters } from './portal-catalogue-filters';
import { PortalCartBar } from './portal-cart-bar';
import { ColumnVisibilityMenu, useHiddenColumns } from './portal-column-visibility';
import { PortalListPagination, type PortalPagination } from './portal-list-pagination';
import { PriceVndUsd } from './price-vnd-usd';
import {
  AddToCartDialog,
  DestinationLabel,
  PLAN_TYPE_LABEL,
  PlanDetailDialog,
  tiktokAiLabel,
  yesNo
} from './portal-catalogue-dialogs';

type CatalogueColumn = {
  key: string;
  label: string;
  headClassName?: string;
  cellClassName?: string;
  cell: (plan: CataloguePlan) => React.ReactNode;
};

/**
 * The price list's columns, in the order of doitac-3010 #026 ("Thời hạn"
 * before "Dữ liệu", shorter headers), each one hideable from "Hiển thị".
 */
const CATALOGUE_COLUMNS: CatalogueColumn[] = [
  {
    key: 'name',
    label: 'Tên gói',
    cellClassName: 'max-w-[260px]',
    // Too long for the column: "…", the whole name on hover (doitac-3010 #026).
    cell: (plan) => (
      <span className='block truncate' title={plan.name} data-testid='plan-name'>
        {plan.name}
      </span>
    )
  },
  {
    key: 'destination',
    label: 'Điểm đến',
    cellClassName: 'text-xs',
    cell: (plan) => <DestinationLabel plan={plan} compact />
  },
  {
    key: 'duration',
    label: 'Thời hạn',
    cellClassName: 'text-xs whitespace-nowrap tabular-nums',
    cell: (plan) => `${plan.durationDays} ngày`
  },
  {
    key: 'data',
    label: 'Dữ liệu',
    cellClassName: 'text-xs whitespace-nowrap tabular-nums',
    cell: (plan) => formatDataSize(plan.dataMb)
  },
  {
    key: 'throttle',
    label: 'Sau giảm tốc',
    cellClassName: 'text-xs',
    cell: (plan) => plan.throttleSpeed || '—'
  },
  {
    key: 'callSms',
    label: 'Gọi / SMS',
    cellClassName: 'text-xs whitespace-nowrap',
    // One cell for the three, calls and SMS beneath (#034).
    cell: (plan) => (
      <>
        <span className='block'>{yesNo(plan.hasCallSms)}</span>
        {plan.hasCallSms && (
          <>
            <span className='text-muted-foreground block'>Gọi: {plan.call ?? 0} phút</span>
            <span className='text-muted-foreground block'>SMS: {plan.sms ?? 0}</span>
          </>
        )}
      </>
    )
  },
  {
    key: 'type',
    label: 'Loại gói',
    cellClassName: 'text-xs whitespace-nowrap',
    cell: (plan) => PLAN_TYPE_LABEL[plan.type ?? ''] ?? plan.type ?? '—'
  },
  {
    key: 'topUp',
    label: 'Mua thêm',
    cellClassName: 'text-xs',
    cell: (plan) => purchaseKindLabel(plan)
  },
  {
    key: 'tiktokAi',
    label: 'Tiktok & AI',
    cellClassName: 'text-xs whitespace-nowrap',
    cell: (plan) => (
      <span className={plan.tiktokAiKnown === false ? 'text-muted-foreground' : ''}>
        {tiktokAiLabel(plan)}
      </span>
    )
  },
  {
    key: 'refundable',
    label: 'Hoàn tiền',
    cellClassName: 'text-xs',
    cell: (plan) => (
      <span className={plan.refundable ? '' : 'text-destructive'}>{yesNo(plan.refundable)}</span>
    )
  },
  {
    key: 'unitPrice',
    label: 'Giá đại lý',
    headClassName: 'text-right',
    cellClassName: 'text-right font-medium whitespace-nowrap tabular-nums',
    cell: (plan) =>
      plan.purchasable ? <PriceVndUsd vnd={plan.unitPriceVnd} usd={plan.unitPriceUsd} /> : '—'
  },
  {
    key: 'retail',
    label: 'Giá bán lẻ',
    headClassName: 'text-right',
    cellClassName: 'text-right whitespace-nowrap tabular-nums',
    cell: (plan) =>
      plan.purchasable ? (
        <PriceVndUsd vnd={plan.suggestedRetailVnd ?? 0} usd={plan.suggestedRetailUsd} />
      ) : (
        '—'
      )
  },
  {
    key: 'cheapest',
    label: 'Rẻ nhất',
    cellClassName: 'text-xs',
    // Coloured as on the admin's list: the column partners scan first.
    cell: (plan) => (
      <Badge variant={plan.isCheapest ? 'default' : 'secondary'} data-testid='plan-cheapest'>
        {yesNo(plan.isCheapest)}
      </Badge>
    )
  }
];

const HIDDEN_COLUMNS_KEY = 'portal-catalogue-hidden-columns';

export function PortalCatalogueView() {
  // The admin's filters (doitac-1410 #033); typing is deferred so each key
  // press does not fire its own request.
  const [filters, setFilters] = useState<CatalogueFilters>(EMPTY_CATALOGUE_FILTERS);
  // Paged like the admin's plan list, 10–100 rows (doitac-3010 #025).
  const [pageSize, setPageSize] = useState(10);
  const [pageIndex, setPageIndex] = useState(0);
  const deferredFilters = useDeferredValue(filters);
  const [selected, setSelected] = useState<CataloguePlan | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [daysText, setDaysText] = useState('1');
  const { hidden: hiddenColumns, toggle: toggleColumn } = useHiddenColumns(HIDDEN_COLUMNS_KEY);
  const visibleColumns = CATALOGUE_COLUMNS.filter((c) => !hiddenColumns.includes(c.key));
  // "Xem chi tiết" and "Thêm giỏ hàng" (doitac-1410 #034).
  const [detail, setDetail] = useState<CataloguePlan | null>(null);
  const [carting, setCarting] = useState<CataloguePlan | null>(null);
  // The customer the QR codes are emailed to (doitac-1410 #034).
  const [recipientEmail, setRecipientEmail] = useState('');
  const emailValid =
    !recipientEmail.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail.trim());

  const { data: catalogue, isLoading } = useQuery(
    partnerCatalogueQueryOptions({ ...deferredFilters, page: pageIndex + 1, limit: pageSize })
  );
  const totalCount = catalogue?.totalCount ?? 0;
  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));
  const pagination: PortalPagination = {
    total: totalCount,
    pageIndex: Math.min(pageIndex, pageCount - 1),
    pageCount,
    pageSize,
    setPageIndex,
    setPageSize: (size: number) => {
      setPageSize(size);
      setPageIndex(0);
    }
  };
  const { data: wallet } = useQuery(myWalletQueryOptions());

  const plans = catalogue?.plans ?? [];

  // Số lượng chỉ hợp lệ khi là số nguyên dương. Một ô trống hoặc "abc" phải
  // tắt hẳn báo giá thay vì gửi NaN lên máy chủ.
  const parsedQuantity = useMemo(() => {
    const value = Number(quantity);
    return Number.isInteger(value) && value > 0 ? value : 0;
  }, [quantity]);

  // A day pass is bought for the days the customer needs: it could only be
  // bought for 1 day here (vande-0411 #002).
  const multiday = !!selected?.isAbleMultidate;
  const days = multiday ? Number(daysText) : 1;
  const daysValid = !multiday || (Number.isInteger(days) && days >= 1 && days <= 365);

  const { data: quote, isFetching: quoting } = useQuery(
    purchaseQuoteQueryOptions(selected?.id ?? 0, daysValid ? parsedQuantity : 0, days)
  );

  const purchase = useMutation({
    ...createPurchaseMutation,
    onSuccess: (result) => {
      // eSIMs from most providers arrive a little after the order, by webhook
      // (doitac-1410 #006), so the order is placed but not all of them are in.
      toast.success(
        (result.notReceivedEsims ?? 0) > 0
          ? `Đã đặt đơn ${result.orderNumber}. Nhà cung cấp chưa nhận đơn, hệ thống sẽ tự gọi lại trong 3–5 phút (xem ở chi tiết đơn hàng).`
          : result.pendingEsims > 0
            ? `Đã đặt ${result.quantity} eSIM — đơn ${result.orderNumber}. Nhà cung cấp đang cấp ${result.pendingEsims} eSIM, sẽ hiện ở Quản lý eSIM trong ít phút.`
            : recipientEmail.trim()
              ? `Đã đặt ${result.quantity} eSIM — đơn ${result.orderNumber}. Mã QR đã gửi tới ${recipientEmail.trim()}.`
              : `Đã đặt ${result.quantity} eSIM — đơn ${result.orderNumber}. Tải file Excel ở trang Đơn hàng.`
      );
      setSelected(null);
      setQuantity('1');
      setDaysText('1');
      setRecipientEmail('');
    },
    onError: (error: Error) => toast.error(error.message)
  });

  const closeDialog = (open: boolean) => {
    if (!open) {
      setSelected(null);
      setQuantity('1');
      setDaysText('1');
    }
  };

  return (
    <div className='grid min-w-0 flex-1 grid-cols-1 gap-4'>
      {/*
        No cards above the list (doitac-1410 #006): the balance moved to the top
        bar, and the % added to cost price is a trade secret never shown to a
        partner.
      */}
      {/* Three boxes (doitac-3010 #025): the filters, then the balance, cart,
          checkout and bulk order, then the price list on its own. */}
      <Card className='min-w-0 gap-3 py-4' data-testid='catalogue-filter-card'>
        <CardContent className='px-4'>
          <PortalCatalogueFilters
            value={filters}
            onChange={(next) => {
              setFilters(next);
              setPageIndex(0);
            }}
          />
        </CardContent>
      </Card>

      {/* Balance, cart and checkout between filters and list (doitac-1410 #035). */}
      <Card className='min-w-0 gap-3 py-3' data-testid='catalogue-cart-card'>
        <CardContent className='px-4'>
          <PortalCartBar filters={deferredFilters} />
        </CardContent>
      </Card>

      <Card className='min-w-0' data-testid='catalogue-list-card'>
        <CardHeader>
          <CardTitle>Bảng giá phân phối</CardTitle>
          <CardDescription>
            Giá đại lý theo hạng hiện tại của bạn. Mua xong, toàn bộ mã eSIM của đơn được xuất ra
            một file Excel tải về ở trang Đơn hàng.
          </CardDescription>
          <CardAction>
            <ColumnVisibilityMenu
              columns={CATALOGUE_COLUMNS}
              hidden={hiddenColumns}
              onToggle={toggleColumn}
              testId='catalogue-columns'
            />
          </CardAction>
        </CardHeader>
        <CardContent className='space-y-4'>
          {isLoading ? (
            <div className='flex justify-center py-12'>
              <Icons.spinner className='size-6 animate-spin' />
            </div>
          ) : plans.length === 0 ? (
            <p className='text-muted-foreground py-12 text-center text-sm'>
              Không có gói nào khớp với bộ lọc này.
            </p>
          ) : (
            // Header pinned while the list scrolls (doitac-3010 #026).
            <div
              className='max-h-[70vh] overflow-auto rounded-md border'
              data-testid='catalogue-table-scroll'
            >
              <Table>
                <TableHeader className='bg-muted sticky top-0 z-10 shadow-[0_1px_0_var(--border)]'>
                  <TableRow>
                    {visibleColumns.map((column) => (
                      <TableHead
                        key={column.key}
                        className={cn('bg-muted whitespace-nowrap', column.headClassName)}
                      >
                        {column.label}
                      </TableHead>
                    ))}
                    <TableHead className='bg-muted text-right'>Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plans.map((plan) => (
                    <TableRow key={plan.id} data-testid={`plan-row-${plan.id}`}>
                      {visibleColumns.map((column) => (
                        <TableCell key={column.key} className={column.cellClassName}>
                          {column.cell(plan)}
                        </TableCell>
                      ))}
                      <TableCell className='text-right'>
                        <div className='flex justify-end gap-1'>
                          <Button size='sm' variant='outline' onClick={() => setDetail(plan)}>
                            Xem chi tiết
                          </Button>
                          {plan.purchasable ? (
                            <>
                              {/* An icon with a plus, "add to cart" (doitac-3010 #026). */}
                              <Button
                                size='sm'
                                variant='outline'
                                onClick={() => setCarting(plan)}
                                aria-label='Thêm giỏ hàng'
                                title='Thêm vào giỏ hàng'
                                data-testid={`add-to-cart-${plan.id}`}
                              >
                                <Icons.add className='size-3.5' />
                                <Icons.shoppingCart className='size-4' />
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
            </div>
          )}
          {totalCount > 0 && (
            <PortalListPagination
              pagination={pagination}
              unit='gói'
              testId='catalogue-pagination'
            />
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
            {multiday && (
              <div className='space-y-2'>
                <Label htmlFor='purchase-days'>Số ngày dùng (1–365)</Label>
                <Input
                  id='purchase-days'
                  type='number'
                  min={1}
                  max={365}
                  step={1}
                  value={daysText}
                  onChange={(e) => setDaysText(e.target.value)}
                  data-testid='purchase-days'
                />
                {!daysValid && (
                  <p className='text-destructive text-xs'>Số ngày phải từ 1 đến 365.</p>
                )}
              </div>
            )}

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
              {/* The retail price the list shows the partner, not the
                  storefront's own price (doitac-3010 #026). */}
              <Row
                label='Doanh thu bán ra (giá bán lẻ đề xuất)'
                value={formatVnd(quote?.suggestedRetailTotalVnd ?? 0)}
              />
              <Row
                label='Chênh lệch nếu bán đúng giá bán lẻ đề xuất'
                value={`${(quote?.suggestedMarginVnd ?? 0) < 0 ? '−' : '+'}${formatVnd(
                  Math.abs(quote?.suggestedMarginVnd ?? 0)
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
                !daysValid ||
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
                  ...(days > 1 ? { periodNum: days } : {}),
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
