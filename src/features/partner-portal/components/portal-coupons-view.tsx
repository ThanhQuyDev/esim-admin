'use client';

/**
 * Discount codes a partner funds out of their own commission (#028).
 *
 * The code is how a partner decides to split the commission they already earn:
 * keep it, or hand part of it to the customer as a discount. The two shares
 * always add up to the original commission, never more — so the form shows both
 * as the partner types, and the API caps the discount at their own rate.
 */

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
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
import { Label } from '@/components/ui/label';
import { Icons } from '@/components/icons';
import { formatDateVn, formatVnd } from '@/lib/format';

import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';

import { createCouponMutation, setCouponActiveMutation } from '../api/mutations';
import {
  myCouponsQueryOptions,
  myProfileQueryOptions,
  mySummaryQueryOptions
} from '../api/queries';
import type { MyCoupon } from '../api/types';

/** Codes inside this window get a "sắp hết hạn" warning. */
const EXPIRING_SOON_DAYS = 30;

/** Bounds the API enforces on a code the partner names (#028). */
const CODE_MIN = 6;
const CODE_MAX = 20;

const EMPTY_COUPON = {
  code: '',
  discountPercent: '',
  maxDiscountAmount: '',
  minOrderAmount: '',
  expiresAt: '',
  maxUsage: '',
  maxUsagePerUser: ''
};

function couponState(coupon: MyCoupon): {
  label: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
} {
  if (!coupon.isActive) return { label: 'Ngừng hoạt động', variant: 'secondary' };
  if (coupon.maxUsage != null && coupon.usageCount >= coupon.maxUsage) {
    return { label: 'Hết lượt', variant: 'destructive' };
  }
  if (coupon.expiresAt) {
    const days = (new Date(coupon.expiresAt).getTime() - Date.now()) / 86_400_000;
    if (days < 0) return { label: 'Đã hết hạn', variant: 'destructive' };
    if (days <= EXPIRING_SOON_DAYS) return { label: 'Sắp hết hạn', variant: 'outline' };
  }
  return { label: 'Đang hoạt động', variant: 'default' };
}

export function PortalCouponsView() {
  const { data: coupons, isLoading } = useQuery(myCouponsQueryOptions());
  const { data: me } = useQuery(myProfileQueryOptions());

  const { data: summary } = useQuery(mySummaryQueryOptions());
  const commissionPercent = summary?.tier.current
    ? Number(summary.tier.current.commissionPercent)
    : 0;

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_COUPON);
  const [error, setError] = useState<string | null>(null);

  const discount = Number(form.discountPercent || 0);
  const keptPercent = Math.max(0, Math.round((commissionPercent - discount) * 100) / 100);

  const createCoupon = useMutation({
    ...createCouponMutation,
    onSuccess: (created) => {
      setOpen(false);
      setForm(EMPTY_COUPON);
      toast.success(`Đã tạo mã ${created.code}, bạn giữ lại ${created.keptPercent}% hoa hồng.`);
    },
    onError: (e: Error) => setError(e.message || 'Không tạo được mã giảm giá.')
  });

  const toggleCoupon = useMutation({
    ...setCouponActiveMutation,
    onSuccess: () => toast.success('Đã cập nhật trạng thái mã.'),
    onError: (e: Error) => toast.error(e.message || 'Không đổi được trạng thái mã.')
  });

  const submitCoupon = () => {
    const code = form.code.trim();
    if (code.length < CODE_MIN || code.length > CODE_MAX || !/^[A-Za-z0-9]+$/.test(code)) {
      setError(`Mã cần ${CODE_MIN}–${CODE_MAX} ký tự, chỉ gồm chữ và số.`);
      return;
    }
    if (!(discount > 0)) {
      setError('Nhập mức giảm cho khách.');
      return;
    }
    if (commissionPercent > 0 && discount > commissionPercent) {
      setError(
        `Mức giảm tối đa bằng đúng tỷ lệ hoa hồng của bạn (${commissionPercent}%) — phần giữ lại cộng phần nhường khách luôn bằng hoa hồng gốc.`
      );
      return;
    }
    setError(null);

    const asNumber = (value: string) => (value.trim() ? Number(value) : undefined);
    createCoupon.mutate({
      code,
      discountPercent: discount,
      maxDiscountAmount: asNumber(form.maxDiscountAmount),
      minOrderAmount: asNumber(form.minOrderAmount),
      maxUsage: asNumber(form.maxUsage),
      maxUsagePerUser: asNumber(form.maxUsagePerUser),
      ...(form.expiresAt ? { expiresAt: new Date(form.expiresAt).toISOString() } : {})
    });
  };

  const copy = async (code: string) => {
    await navigator.clipboard?.writeText(code);
    toast.success(`Đã sao chép mã ${code}.`);
  };

  const list = coupons ?? [];

  return (
    <div className='flex flex-1 flex-col space-y-4'>
      <Alert>
        <Icons.info />
        <AlertTitle>Mã giảm giá hoạt động thế nào</AlertTitle>
        <AlertDescription>
          <ul className='list-disc space-y-1 pl-4'>
            <li>
              Mã giúp ghi nhận đơn cho bạn khi khách xem link trên máy tính nhưng lại mua trên điện
              thoại, hoặc vào thẳng web để mua.
            </li>
            <li>
              Mã giảm là cách bạn tự chia ngân sách hoa hồng của mình: giữ lại bao nhiêu, nhường
              khách bao nhiêu.{' '}
              <span className='font-medium'>
                Tổng hai phần luôn bằng đúng hoa hồng gốc, không bao giờ vượt quá.
              </span>
              {commissionPercent > 0 && ` Hoa hồng hiện tại của bạn là ${commissionPercent}%.`}
            </li>
            <li>
              Mã của bạn <span className='font-medium'>không hiện sẵn</span> ở trang giỏ hàng —
              khách phải tự nhập. Mã giảm chung của web vẫn hiện bình thường, và khi khách dùng mã
              chung thì hoa hồng của bạn tính trên giá trị đơn sau khi đã trừ mã đó.
            </li>
          </ul>
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className='flex flex-wrap items-center gap-2'>
            Mã giảm giá của bạn
            <Badge variant='outline'>{list.length} mã</Badge>
          </CardTitle>
          <CardDescription>Theo dõi lượt sử dụng và doanh số từ từng mã.</CardDescription>
          <CardAction>
            <Button size='sm' onClick={() => setOpen(true)}>
              <Icons.add />
              Tạo mã giảm giá
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          {isLoading && <p className='text-muted-foreground py-8 text-center text-sm'>Đang tải…</p>}

          {!isLoading && list.length === 0 && (
            <div className='rounded-lg border border-dashed py-12 text-center'>
              <p className='text-sm font-medium'>Chưa có mã giảm giá nào</p>
              <p className='text-muted-foreground mx-auto mt-1 max-w-md text-xs'>
                Tạo mã của riêng bạn để khách nhập khi thanh toán. Phần bạn nhường khách được trừ
                vào hoa hồng của chính bạn.
              </p>
              <Button size='sm' className='mt-4' onClick={() => setOpen(true)}>
                <Icons.add />
                Tạo mã giảm giá
              </Button>
            </div>
          )}

          <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
            {list.map((coupon) => {
              const state = couponState(coupon);
              return (
                <Card key={coupon.id} className='@container/card'>
                  <CardHeader>
                    <CardDescription className='font-mono text-xs tracking-wider'>
                      {coupon.code}
                    </CardDescription>
                    <CardTitle className='text-2xl font-semibold tabular-nums'>
                      {coupon.discountPercent}%
                    </CardTitle>
                    <CardAction>
                      <Badge variant={state.variant}>{state.label}</Badge>
                    </CardAction>
                  </CardHeader>
                  <CardContent className='space-y-2 text-xs'>
                    <div className='flex items-center justify-between'>
                      <span className='text-muted-foreground'>Lượt dùng</span>
                      <span className='font-medium tabular-nums'>
                        {coupon.usageCount.toLocaleString('vi-VN')}
                        {coupon.maxUsage != null && ` / ${coupon.maxUsage.toLocaleString('vi-VN')}`}
                      </span>
                    </div>
                    <div className='flex items-center justify-between'>
                      <span className='text-muted-foreground'>Đơn của bạn</span>
                      <span className='font-medium tabular-nums'>
                        {coupon.myOrders.toLocaleString('vi-VN')}
                      </span>
                    </div>
                    <div className='flex items-center justify-between'>
                      <span className='text-muted-foreground'>Đã giảm cho khách</span>
                      <span className='font-medium tabular-nums'>
                        {formatVnd(coupon.discountGivenVnd)}
                      </span>
                    </div>
                    <div className='flex items-center justify-between'>
                      <span className='text-muted-foreground'>Hết hạn</span>
                      <span className='font-medium'>
                        {coupon.expiresAt ? formatDateVn(coupon.expiresAt) : 'Không giới hạn'}
                      </span>
                    </div>
                  </CardContent>
                  <CardFooter className='justify-between gap-2'>
                    <Button size='sm' variant='outline' onClick={() => copy(coupon.code)}>
                      <Icons.copy />
                      Sao chép mã
                    </Button>
                    <Switch
                      checked={coupon.isActive}
                      disabled={toggleCoupon.isPending}
                      onCheckedChange={(checked) =>
                        toggleCoupon.mutate({ id: coupon.id, isActive: checked })
                      }
                      aria-label={coupon.isActive ? 'Tắt mã' : 'Bật mã'}
                    />
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className='sm:max-w-lg'>
          <DialogHeader>
            <DialogTitle>Tạo mã giảm giá</DialogTitle>
            <DialogDescription>
              Phần bạn nhường khách được trừ vào hoa hồng của chính bạn — phần giữ lại cộng phần
              nhường khách luôn bằng hoa hồng gốc.
            </DialogDescription>
          </DialogHeader>

          <div className='grid gap-4 sm:grid-cols-2'>
            <div className='space-y-2 sm:col-span-2'>
              <Label htmlFor='couponCode'>
                Tên mã <span className='text-destructive'>*</span>
              </Label>
              <Input
                id='couponCode'
                placeholder='VANA2026'
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              />
              <p className='text-muted-foreground text-xs'>
                {CODE_MIN}–{CODE_MAX} ký tự, chỉ chữ và số, duy nhất trên hệ thống.
              </p>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='couponPercent'>
                Mức giảm cho khách (%) <span className='text-destructive'>*</span>
              </Label>
              <Input
                id='couponPercent'
                type='number'
                min={1}
                max={commissionPercent || 100}
                value={form.discountPercent}
                onChange={(e) => setForm({ ...form, discountPercent: e.target.value })}
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='couponMaxDiscount'>Giảm tối đa (đ)</Label>
              <Input
                id='couponMaxDiscount'
                type='number'
                min={0}
                step={10000}
                placeholder='50000'
                value={form.maxDiscountAmount}
                onChange={(e) => setForm({ ...form, maxDiscountAmount: e.target.value })}
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='couponMinOrder'>Đơn tối thiểu (đ)</Label>
              <Input
                id='couponMinOrder'
                type='number'
                min={0}
                step={50000}
                placeholder='500000'
                value={form.minOrderAmount}
                onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })}
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='couponExpires'>Hiệu lực đến</Label>
              <Input
                id='couponExpires'
                type='date'
                value={form.expiresAt}
                onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='couponMaxUsage'>Tổng lượt dùng tối đa</Label>
              <Input
                id='couponMaxUsage'
                type='number'
                min={1}
                placeholder='100'
                value={form.maxUsage}
                onChange={(e) => setForm({ ...form, maxUsage: e.target.value })}
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='couponPerUser'>Lượt dùng mỗi khách</Label>
              <Input
                id='couponPerUser'
                type='number'
                min={1}
                placeholder='1'
                value={form.maxUsagePerUser}
                onChange={(e) => setForm({ ...form, maxUsagePerUser: e.target.value })}
              />
            </div>
          </div>

          {commissionPercent > 0 && (
            <div className='bg-muted/50 rounded-lg border p-3 text-sm'>
              <p className='font-medium'>Hoa hồng gốc {commissionPercent}% được chia thành:</p>
              <p className='text-muted-foreground mt-1'>
                Nhường khách <span className='text-foreground font-medium'>{discount || 0}%</span> ·
                Bạn giữ lại <span className='text-foreground font-medium'>{keptPercent}%</span>
              </p>
            </div>
          )}

          {error && <p className='text-destructive text-sm'>{error}</p>}

          <DialogFooter>
            <Button variant='outline' onClick={() => setOpen(false)}>
              Huỷ
            </Button>
            <Button onClick={submitCoupon} disabled={createCoupon.isPending}>
              Tạo mã
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
