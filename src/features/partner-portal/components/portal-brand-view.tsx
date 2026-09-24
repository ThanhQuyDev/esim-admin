'use client';

/**
 * Brand settings: the name, logo and tagline a partner shows to their own
 * customers, with a live preview of the result.
 */

import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';

import { updateMyProfileMutation } from '../api/mutations';
import { myProfileQueryOptions } from '../api/queries';
import type { PartnerBrandInfo } from '../api/types';

function readBrand(info: Record<string, unknown> | null): PartnerBrandInfo {
  return {
    displayName: typeof info?.displayName === 'string' ? info.displayName : '',
    logoUrl: typeof info?.logoUrl === 'string' ? info.logoUrl : '',
    tagline: typeof info?.tagline === 'string' ? info.tagline : ''
  };
}

export function PortalBrandView() {
  const { data: partner, isLoading } = useQuery(myProfileQueryOptions());
  const [form, setForm] = useState<PartnerBrandInfo>({
    displayName: '',
    logoUrl: '',
    tagline: ''
  });

  // Seed once: `partner` is refetched on window focus and after each save, and
  // re-seeding then would discard edits the partner had not saved yet.
  const seededFor = useRef<number | null>(null);
  useEffect(() => {
    if (!partner || seededFor.current === partner.id) return;
    seededFor.current = partner.id;
    setForm(readBrand(partner.brandInfo ?? null));
  }, [partner]);

  const update = useMutation({
    ...updateMyProfileMutation,
    onSuccess: () => toast.success('Đã lưu cấu hình thương hiệu.'),
    onError: (e: Error) => toast.error(e.message || 'Lưu thất bại.')
  });

  if (isLoading || !partner) {
    return (
      <div className='grid gap-4 lg:grid-cols-3'>
        <Skeleton className='h-80 lg:col-span-2' />
        <Skeleton className='h-80' />
      </div>
    );
  }

  const previewName = form.displayName?.trim() || partner.contactName;

  return (
    <div className='grid gap-4 lg:grid-cols-3'>
      <Card className='lg:col-span-2'>
        <CardHeader>
          <CardTitle>Nhận diện thương hiệu</CardTitle>
          <CardDescription>
            Tên, logo và câu giới thiệu hiển thị với khách hàng của bạn.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='displayName'>Tên hiển thị</Label>
            <Input
              id='displayName'
              value={form.displayName}
              placeholder={partner.contactName}
              aria-describedby='displayName-help'
              onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
            />
            <p id='displayName-help' className='text-muted-foreground text-xs'>
              Tên khách nhìn thấy, thay cho tên trên hồ sơ pháp lý.
            </p>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='logoUrl'>Đường dẫn logo</Label>
            <Input
              id='logoUrl'
              type='url'
              value={form.logoUrl}
              placeholder='https://…/logo.png'
              onChange={(e) => setForm((f) => ({ ...f, logoUrl: e.target.value }))}
            />
            <p className='text-muted-foreground text-xs'>
              Ảnh vuông, tối thiểu 256×256 để hiển thị sắc nét.
            </p>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='tagline'>Câu giới thiệu ngắn</Label>
            <Input
              id='tagline'
              value={form.tagline}
              placeholder='Ví dụ: eSIM du lịch giá tốt cùng Minh Trần'
              onChange={(e) => setForm((f) => ({ ...f, tagline: e.target.value }))}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button
            isLoading={update.isPending}
            onClick={() =>
              update.mutate({
                brandInfo: {
                  displayName: form.displayName?.trim() || undefined,
                  logoUrl: form.logoUrl?.trim() || undefined,
                  tagline: form.tagline?.trim() || undefined
                }
              })
            }
          >
            Lưu thay đổi
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Xem trước</CardTitle>
          <CardDescription>Cách khách hàng nhìn thấy thương hiệu của bạn.</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex items-center gap-3 rounded-lg border p-4'>
            <Avatar className='size-12'>
              <AvatarImage src={form.logoUrl || undefined} alt='' />
              <AvatarFallback>{previewName.trim().charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className='min-w-0'>
              <p className='truncate font-medium'>{previewName}</p>
              <p className='text-muted-foreground truncate text-xs'>
                {form.tagline || 'Đối tác của esim.vn'}
              </p>
            </div>
          </div>
          <p className='text-muted-foreground text-xs'>
            Cấu hình này áp dụng cho trang đối tác của bạn. Muốn hiển thị luôn trên trang đích mà
            link tiếp thị trỏ tới thì cần bật thêm ở phía website bán hàng.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
