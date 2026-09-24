'use client';

/**
 * Discount codes issued to this partner.
 *
 * The portal has no self-serve coupon creation — an admin issues the code — so
 * "Đề nghị mã mới" files a support ticket rather than pretending to create one.
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
import { Textarea } from '@/components/ui/textarea';
import { Icons } from '@/components/icons';
import { formatDateVn, formatVnd } from '@/lib/format';

import { createTicketMutation } from '../api/mutations';
import { myCouponsQueryOptions, myProfileQueryOptions } from '../api/queries';
import type { MyCoupon } from '../api/types';

/** Codes inside this window get a "sắp hết hạn" warning. */
const EXPIRING_SOON_DAYS = 30;

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

  const [open, setOpen] = useState(false);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const requestCoupon = useMutation({
    ...createTicketMutation,
    onSuccess: () => {
      setOpen(false);
      setNote('');
      toast.success('Đã gửi đề nghị cấp mã giảm giá.');
    },
    onError: (e: Error) => toast.error(e.message || 'Không gửi được đề nghị.')
  });

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
              Mã giúp ghi nhận đơn hàng cho bạn khi khách không bấm link tiếp thị hoặc mua trên
              thiết bị khác.
            </li>
            <li>
              Hoa hồng tính trên doanh thu sau giảm giá. Mức giảm nằm trong quyền hạn quản trị viên
              cấp cho hạng của bạn.
            </li>
          </ul>
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className='flex flex-wrap items-center gap-2'>
            Mã được cấp
            <Badge variant='outline'>{list.length} mã</Badge>
          </CardTitle>
          <CardDescription>Theo dõi lượt sử dụng và doanh số từ từng mã.</CardDescription>
          <CardAction>
            <Button size='sm' variant='outline' onClick={() => setOpen(true)}>
              <Icons.add />
              Đề nghị mã mới
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          {isLoading && <p className='text-muted-foreground py-8 text-center text-sm'>Đang tải…</p>}

          {!isLoading && list.length === 0 && (
            <div className='rounded-lg border border-dashed py-12 text-center'>
              <p className='text-sm font-medium'>Chưa có mã giảm giá nào</p>
              <p className='text-muted-foreground mx-auto mt-1 max-w-md text-xs'>
                Mã giảm giá do quản trị viên cấp. Gửi đề nghị kèm mức giảm, thời hạn và kênh bạn
                định dùng để được xét.
              </p>
              <Button size='sm' className='mt-4' onClick={() => setOpen(true)}>
                <Icons.add />
                Đề nghị mã mới
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
                  <CardFooter>
                    <Button
                      size='sm'
                      variant='outline'
                      className='w-full'
                      onClick={() => copy(coupon.code)}
                    >
                      <Icons.copy />
                      Sao chép mã
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Đề nghị cấp mã giảm giá</DialogTitle>
            <DialogDescription>
              Đề nghị được gửi tới đội vận hành dưới dạng một yêu cầu hỗ trợ.
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-2'>
            <Label htmlFor='couponNote'>
              Nội dung đề nghị <span className='text-destructive'>*</span>
            </Label>
            <Textarea
              id='couponNote'
              rows={5}
              value={note}
              placeholder='Ví dụ: mã giảm 10% cho chiến dịch Nhật Bản tháng 8, dự kiến 200 lượt dùng, chạy tới 30/09.'
              aria-invalid={Boolean(error)}
              aria-describedby='couponNote-error'
              onChange={(e) => {
                setNote(e.target.value);
                if (error) setError(null);
              }}
              onBlur={() => setError(note.trim() ? null : 'Mô tả đề nghị của bạn.')}
            />
            {error ? (
              <p id='couponNote-error' className='text-destructive text-xs'>
                {error}
              </p>
            ) : (
              <p className='text-muted-foreground text-xs'>
                Nêu rõ mức giảm mong muốn, thời hạn và kênh sẽ dùng mã.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setOpen(false)}>
              Huỷ
            </Button>
            <Button
              isLoading={requestCoupon.isPending}
              onClick={() => {
                if (!note.trim()) {
                  setError('Mô tả đề nghị của bạn.');
                  return;
                }
                requestCoupon.mutate({
                  customerEmail: me?.contactEmail ?? '',
                  subject: 'Đề nghị cấp mã giảm giá',
                  description: note.trim()
                });
              }}
            >
              Gửi đề nghị
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
