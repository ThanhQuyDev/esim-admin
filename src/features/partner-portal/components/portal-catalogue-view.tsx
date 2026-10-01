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

import { useMemo, useState } from 'react';
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
import type { CataloguePlan } from '../api/types';

export function PortalCatalogueView() {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<CataloguePlan | null>(null);
  const [quantity, setQuantity] = useState('1');

  const { data: catalogue, isLoading } = useQuery(
    partnerCatalogueQueryOptions({ search: search.trim() || undefined, limit: 300 })
  );
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
      toast.success(
        `Đã đặt ${result.quantity} eSIM — đơn ${result.orderNumber}. Tải file Excel ở trang Đơn hàng.`
      );
      setSelected(null);
      setQuantity('1');
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
    <div className='flex flex-1 flex-col space-y-4'>
      <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
        <Card>
          <CardHeader>
            <CardDescription>Số dư khả dụng</CardDescription>
            <CardTitle className='text-2xl font-semibold tabular-nums'>
              {wallet ? formatVnd(wallet.availableBalanceVnd) : '…'}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>% cộng vào giá vốn (hạng của bạn)</CardDescription>
            <CardTitle className='text-2xl font-semibold tabular-nums'>
              {catalogue ? `${catalogue.markupPercent}%` : '…'}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Số gói đang bán</CardDescription>
            <CardTitle className='text-2xl font-semibold tabular-nums'>
              {isLoading ? '…' : plans.length.toLocaleString('vi-VN')}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bảng giá phân phối</CardTitle>
          <CardDescription>
            Giá vốn của bạn là giá gốc cộng {catalogue?.markupPercent ?? 0}% theo hạng hiện tại. Mua
            xong, toàn bộ mã eSIM của đơn được xuất ra một file Excel tải về ở trang Đơn hàng.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <Input
            placeholder='Tìm theo tên gói hoặc điểm đến'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='max-w-[320px]'
          />

          {isLoading ? (
            <div className='flex justify-center py-12'>
              <Icons.spinner className='size-6 animate-spin' />
            </div>
          ) : plans.length === 0 ? (
            <p className='text-muted-foreground py-12 text-center text-sm'>
              Không có gói nào khớp với tìm kiếm này.
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
                    <TableHead className='text-right'>Giá vốn của bạn</TableHead>
                    <TableHead className='text-right'>Giá niêm yết</TableHead>
                    <TableHead className='text-right'>Chênh lệch</TableHead>
                    <TableHead className='text-right'>Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plans.map((plan) => (
                    <TableRow key={plan.id}>
                      <TableCell className='max-w-[260px]'>{plan.name}</TableCell>
                      <TableCell className='text-xs'>{plan.destinationName ?? '—'}</TableCell>
                      <TableCell className='text-xs tabular-nums'>
                        {formatDataSize(plan.dataMb)}
                      </TableCell>
                      <TableCell className='text-xs tabular-nums'>
                        {plan.durationDays} ngày
                      </TableCell>
                      <TableCell className='text-right font-medium tabular-nums'>
                        {plan.purchasable ? formatVnd(plan.unitPriceVnd) : '—'}
                      </TableCell>
                      <TableCell className='text-muted-foreground text-right tabular-nums'>
                        {formatVnd(plan.listPriceVnd)}
                      </TableCell>
                      <TableCell className='text-right tabular-nums'>
                        <span
                          className={plan.marginVnd < 0 ? 'text-destructive' : 'text-green-600'}
                        >
                          {plan.marginVnd < 0 ? '−' : '+'}
                          {formatVnd(Math.abs(plan.marginVnd))}
                        </span>
                      </TableCell>
                      <TableCell className='text-right'>
                        {plan.purchasable ? (
                          <Button size='sm' onClick={() => setSelected(plan)}>
                            Đặt mua
                          </Button>
                        ) : (
                          <Badge variant='outline' title='Gói chưa có giá vốn'>
                            Chưa bán
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
                quoting ||
                Boolean(quote?.rejection) ||
                purchase.isPending
              }
              onClick={() =>
                selected && purchase.mutate({ planId: selected.id, quantity: parsedQuantity })
              }
            >
              {purchase.isPending ? 'Đang đặt…' : `Xác nhận trừ ${formatVnd(quote?.totalVnd ?? 0)}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
