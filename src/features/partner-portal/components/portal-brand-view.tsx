'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Icons } from '@/components/icons';

import { myProfileQueryOptions } from '../api/queries';
import { updateMyProfileMutation } from '../api/mutations';
import type { PartnerBrandInfo } from '../api/types';

function readBrand(info: Record<string, unknown> | null): PartnerBrandInfo {
  return {
    displayName: typeof info?.displayName === 'string' ? info.displayName : '',
    logoUrl: typeof info?.logoUrl === 'string' ? info.logoUrl : '',
    tagline: typeof info?.tagline === 'string' ? info.tagline : ''
  };
}

export function PortalBrandView() {
  const { data: partner, isLoading, refetch } = useQuery(myProfileQueryOptions());
  const [form, setForm] = useState<PartnerBrandInfo>({
    displayName: '',
    logoUrl: '',
    tagline: ''
  });

  useEffect(() => {
    if (!partner) return;
    setForm(readBrand(partner.brandInfo ?? null));
  }, [partner]);

  const update = useMutation({
    ...updateMyProfileMutation,
    onSuccess: () => {
      toast.success('Đã lưu cấu hình thương hiệu.');
      refetch();
    },
    onError: (e: Error) => toast.error(e.message || 'Lưu thất bại')
  });

  if (isLoading || !partner) {
    return (
      <div className='flex justify-center py-12'>
        <Icons.spinner className='h-6 w-6 animate-spin' />
      </div>
    );
  }

  // Falls back to the contact name so the preview always shows something real.
  const previewName = form.displayName?.trim() || partner.contactName;

  return (
    <div className='grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]'>
      <div className='space-y-4'>
        <div className='space-y-2'>
          <Label htmlFor='displayName'>Tên hiển thị</Label>
          <Input
            id='displayName'
            value={form.displayName}
            placeholder={partner.contactName}
            onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
          />
          <p className='text-muted-foreground text-xs'>
            Tên khách nhìn thấy thay cho tên trên hồ sơ pháp lý.
          </p>
        </div>

        <div className='space-y-2'>
          <Label htmlFor='logoUrl'>Đường dẫn logo</Label>
          <Input
            id='logoUrl'
            value={form.logoUrl}
            placeholder='https://…/logo.png'
            onChange={(e) => setForm((f) => ({ ...f, logoUrl: e.target.value }))}
          />
        </div>

        <div className='space-y-2'>
          <Label htmlFor='tagline'>Câu giới thiệu ngắn</Label>
          <Input
            id='tagline'
            value={form.tagline}
            placeholder='VD: eSIM du lịch giá tốt cùng Hà'
            onChange={(e) => setForm((f) => ({ ...f, tagline: e.target.value }))}
          />
        </div>

        <Button
          onClick={() =>
            update.mutate({
              brandInfo: {
                displayName: form.displayName?.trim() || undefined,
                logoUrl: form.logoUrl?.trim() || undefined,
                tagline: form.tagline?.trim() || undefined
              }
            })
          }
          isLoading={update.isPending}
        >
          Lưu thay đổi
        </Button>
      </div>

      {/* Live preview so the partner sees exactly what they are configuring. */}
      <div className='space-y-2'>
        <p className='text-sm font-medium'>Xem trước</p>
        <div className='rounded-lg border p-4'>
          <div className='flex items-center gap-3'>
            {form.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={form.logoUrl}
                alt=''
                className='h-12 w-12 rounded-full border object-cover'
              />
            ) : (
              <div className='bg-muted text-muted-foreground flex h-12 w-12 items-center justify-center rounded-full text-sm font-semibold'>
                {previewName.trim().charAt(0).toUpperCase()}
              </div>
            )}
            <div className='min-w-0'>
              <p className='truncate font-medium'>{previewName}</p>
              <p className='text-muted-foreground truncate text-xs'>
                {form.tagline || 'Đối tác của esim.vn'}
              </p>
            </div>
          </div>
        </div>
        <p className='text-muted-foreground text-xs'>
          Cấu hình này áp dụng cho trang đối tác của bạn. Nếu muốn hiển thị luôn trên trang đích mà
          link tiếp thị trỏ tới, cần bật thêm ở phía website bán hàng — nói với esim.vn khi bạn cần.
        </p>
      </div>
    </div>
  );
}
