'use client';
import { useMutation, useQuery } from '@tanstack/react-query';
import { myProfileQueryOptions } from '../api/queries';
import { updateMyProfileMutation } from '../api/mutations';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Icons } from '@/components/icons';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';

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

export function PortalProfileView() {
  const { data: partner, isLoading, refetch } = useQuery(myProfileQueryOptions());
  const [form, setForm] = useState({
    contactName: '',
    contactPhone: '',
    companyName: '',
    businessAddress: ''
  });

  useEffect(() => {
    if (!partner) return;
    setForm({
      contactName: partner.contactName,
      contactPhone: partner.contactPhone,
      companyName: partner.companyName || '',
      businessAddress: partner.businessAddress || ''
    });
  }, [partner]);

  const updateMutation = useMutation({
    ...updateMyProfileMutation,
    onSuccess: () => {
      toast.success('Đã lưu thông tin.');
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

  return (
    <div className='max-w-lg space-y-6'>
      <div className='flex items-center gap-3'>
        <Badge variant='outline'>{PARTNER_TYPE_LABEL[partner.partnerType]}</Badge>
        <Badge variant={partner.status === 'active' ? 'default' : 'secondary'}>
          {STATUS_LABEL[partner.status]}
        </Badge>
        {partner.tierCode && <Badge variant='outline'>Hạng {partner.tierCode}</Badge>}
      </div>

      {partner.status === 'rejected' && partner.rejectionReason && (
        <div className='rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm'>
          <span className='font-medium'>Lý do từ chối: </span>
          {partner.rejectionReason}
        </div>
      )}

      <div className='space-y-4'>
        <div className='space-y-2'>
          <Label htmlFor='contactName'>Họ tên liên hệ</Label>
          <Input
            id='contactName'
            value={form.contactName}
            onChange={(e) => setForm((f) => ({ ...f, contactName: e.target.value }))}
          />
        </div>
        <div className='space-y-2'>
          <Label htmlFor='contactPhone'>Số điện thoại</Label>
          <Input
            id='contactPhone'
            value={form.contactPhone}
            onChange={(e) => setForm((f) => ({ ...f, contactPhone: e.target.value }))}
          />
        </div>
        {partner.legalType === 'company' && (
          <div className='space-y-2'>
            <Label htmlFor='companyName'>Tên công ty</Label>
            <Input
              id='companyName'
              value={form.companyName}
              onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))}
            />
          </div>
        )}
        <div className='space-y-2'>
          <Label htmlFor='businessAddress'>Địa chỉ</Label>
          <Input
            id='businessAddress'
            value={form.businessAddress}
            onChange={(e) => setForm((f) => ({ ...f, businessAddress: e.target.value }))}
          />
        </div>
        <Button onClick={() => updateMutation.mutate(form)} isLoading={updateMutation.isPending}>
          Lưu thay đổi
        </Button>
      </div>
    </div>
  );
}
