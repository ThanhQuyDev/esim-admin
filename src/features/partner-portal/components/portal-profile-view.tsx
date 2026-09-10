'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Icons } from '@/components/icons';

import { myProfileQueryOptions } from '../api/queries';
import { updateMyProfileMutation } from '../api/mutations';

const PARTNER_TYPE_LABEL: Record<string, string> = {
  distribution: 'Đối tác phân phối',
  kol: 'KOL'
};

const STATUS_LABEL: Record<string, string> = {
  pending: 'Chờ duyệt',
  active: 'Đang hoạt động',
  hold: 'Tạm giữ',
  disabled: 'Đã khóa',
  rejected: 'Bị từ chối'
};

/** `channelInfo` is free-form jsonb; these are the keys the apply form writes. */
function channelString(info: Record<string, unknown> | null, key: string): string {
  const v = info?.[key];
  return v === undefined || v === null ? '' : String(v);
}

export function PortalProfileView() {
  const { data: partner, isLoading, refetch } = useQuery(myProfileQueryOptions());

  const [form, setForm] = useState({
    contactName: '',
    contactPhone: '',
    companyName: '',
    taxCode: '',
    businessAddress: '',
    channelUrl: '',
    channelFollowers: '',
    bankName: '',
    bankAccountNumber: '',
    bankAccountHolder: '',
    bankBranch: ''
  });

  useEffect(() => {
    if (!partner) return;
    setForm({
      contactName: partner.contactName,
      contactPhone: partner.contactPhone,
      companyName: partner.companyName || '',
      taxCode: partner.taxCode || '',
      businessAddress: partner.businessAddress || '',
      channelUrl: channelString(partner.channelInfo, 'url'),
      channelFollowers: channelString(partner.channelInfo, 'followers'),
      bankName: partner.bankName || '',
      bankAccountNumber: partner.bankAccountNumber || '',
      bankAccountHolder: partner.bankAccountHolder || '',
      bankBranch: partner.bankBranch || ''
    });
  }, [partner]);

  const update = useMutation({
    ...updateMyProfileMutation,
    onSuccess: () => {
      toast.success('Đã lưu thông tin.');
      refetch();
    },
    onError: (e: Error) => toast.error(e.message || 'Lưu thất bại')
  });

  const set = (key: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [key]: v }));

  const saveBasic = () =>
    update.mutate({
      contactName: form.contactName,
      contactPhone: form.contactPhone,
      companyName: form.companyName,
      taxCode: form.taxCode,
      businessAddress: form.businessAddress
    });

  const saveChannel = () =>
    update.mutate({
      channelInfo: {
        ...(form.channelUrl ? { url: form.channelUrl } : {}),
        ...(form.channelFollowers ? { followers: Number(form.channelFollowers) || 0 } : {})
      }
    });

  const savePayment = () =>
    update.mutate({
      bankName: form.bankName,
      bankAccountNumber: form.bankAccountNumber,
      bankAccountHolder: form.bankAccountHolder,
      bankBranch: form.bankBranch
    });

  if (isLoading || !partner) {
    return (
      <div className='flex justify-center py-12'>
        <Icons.spinner className='h-6 w-6 animate-spin' />
      </div>
    );
  }

  const field = (id: keyof typeof form, label: string, placeholder?: string) => (
    <div className='space-y-2'>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={form[id]}
        placeholder={placeholder}
        onChange={(e) => set(id)(e.target.value)}
      />
    </div>
  );

  return (
    <div className='max-w-2xl space-y-6'>
      <div className='flex flex-wrap items-center gap-2'>
        <Badge variant='outline'>{PARTNER_TYPE_LABEL[partner.partnerType]}</Badge>
        <Badge variant={partner.status === 'active' ? 'default' : 'secondary'}>
          {STATUS_LABEL[partner.status]}
        </Badge>
        {partner.tierCode && <Badge variant='outline'>Hạng {partner.tierCode}</Badge>}
      </div>

      {partner.status === 'rejected' && partner.rejectionReason && (
        <div className='border-destructive/50 bg-destructive/10 rounded-lg border p-3 text-sm'>
          <span className='font-medium'>Lý do từ chối: </span>
          {partner.rejectionReason}
        </div>
      )}

      <Tabs defaultValue='basic'>
        <TabsList>
          <TabsTrigger value='basic'>Cơ bản</TabsTrigger>
          <TabsTrigger value='channel'>Kênh</TabsTrigger>
          <TabsTrigger value='payment'>Thanh toán</TabsTrigger>
          <TabsTrigger value='security'>Bảo mật</TabsTrigger>
        </TabsList>

        <TabsContent value='basic' className='space-y-4 pt-4'>
          {field('contactName', 'Họ tên liên hệ')}
          {field('contactPhone', 'Số điện thoại')}
          {partner.legalType === 'company' && (
            <>
              {field('companyName', 'Tên công ty')}
              {field('taxCode', 'Mã số thuế')}
            </>
          )}
          {field('businessAddress', 'Địa chỉ')}
          <Button onClick={saveBasic} isLoading={update.isPending}>
            Lưu thay đổi
          </Button>
        </TabsContent>

        <TabsContent value='channel' className='space-y-4 pt-4'>
          {field('channelUrl', 'Đường dẫn kênh', 'https://tiktok.com/@kenh')}
          {field('channelFollowers', 'Số người theo dõi', 'VD: 250000')}
          <p className='text-muted-foreground text-xs'>
            Thông tin kênh giúp đội ngũ esim.vn đánh giá và đề xuất chính sách phù hợp.
          </p>
          <Button onClick={saveChannel} isLoading={update.isPending}>
            Lưu thay đổi
          </Button>
        </TabsContent>

        <TabsContent value='payment' className='space-y-4 pt-4'>
          {field('bankName', 'Tên ngân hàng', 'VD: Vietcombank')}
          {field('bankAccountNumber', 'Số tài khoản')}
          {field('bankAccountHolder', 'Chủ tài khoản')}
          {field('bankBranch', 'Chi nhánh', 'Không bắt buộc')}
          <p className='text-muted-foreground text-xs'>
            Tài khoản này được điền sẵn khi bạn tạo yêu cầu rút tiền. Mỗi yêu cầu đã tạo vẫn giữ
            nguyên tài khoản tại thời điểm gửi, nên sửa ở đây không ảnh hưởng các yêu cầu cũ.
          </p>
          <Button onClick={savePayment} isLoading={update.isPending}>
            Lưu thay đổi
          </Button>
        </TabsContent>

        <TabsContent value='security' className='space-y-4 pt-4'>
          <div className='space-y-2'>
            <Label>Email đăng nhập</Label>
            <Input value={partner.contactEmail} disabled />
          </div>
          <p className='text-muted-foreground text-xs'>
            Đổi mật khẩu được thực hiện qua chức năng “Quên mật khẩu” ở màn đăng nhập — esim.vn sẽ
            gửi liên kết đặt lại về email trên.
          </p>
          <Button variant='outline' asChild>
            <Link href='/auth/sign-in'>Tới màn đăng nhập</Link>
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
}
