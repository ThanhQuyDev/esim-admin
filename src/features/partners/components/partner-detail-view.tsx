'use client';
import { useMutation, useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { partnerQueryOptions, tiersQueryOptions } from '../api/queries';
import {
  approvePartnerMutation,
  rejectPartnerMutation,
  updatePartnerStatusMutation,
  assignPartnerTierMutation,
  adjustPartnerWalletMutation
} from '../api/mutations';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { toast } from 'sonner';
import { useState } from 'react';
import { AdjustPartnerWalletModal } from './adjust-partner-wallet-modal';
import { RejectPartnerModal } from './reject-partner-modal';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import type { PartnerStatus } from '../api/types';

const PARTNER_TYPE_LABELS = { distribution: 'Đối tác phân phối', kol: 'KOL' } as const;
const LEGAL_TYPE_LABELS = { individual: 'Cá nhân', company: 'Doanh nghiệp' } as const;
const STATUS_LABELS: Record<PartnerStatus, string> = {
  pending: 'Chờ duyệt',
  active: 'Đang hoạt động',
  hold: 'Tạm giữ',
  disabled: 'Đã khóa',
  rejected: 'Bị từ chối'
};
const STATUS_VARIANTS: Record<PartnerStatus, 'default' | 'secondary' | 'destructive' | 'outline'> =
  {
    pending: 'secondary',
    active: 'default',
    hold: 'outline',
    disabled: 'destructive',
    rejected: 'destructive'
  };

export function PartnerDetailView({ partnerId }: { partnerId: number }) {
  const [rejectOpen, setRejectOpen] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);

  const { data: partner, refetch } = useSuspenseQuery(partnerQueryOptions(partnerId));
  const { data: tiers = [] } = useQuery(tiersQueryOptions());

  const approveMutation = useMutation({
    ...approvePartnerMutation,
    onSuccess: () => {
      toast.success('Đã duyệt đối tác.');
      refetch();
    },
    onError: (e: Error) => toast.error(e.message || 'Duyệt thất bại')
  });

  const rejectMutation = useMutation({
    ...rejectPartnerMutation,
    onSuccess: () => {
      toast.success('Đã từ chối đối tác.');
      setRejectOpen(false);
      refetch();
    },
    onError: (e: Error) => toast.error(e.message || 'Từ chối thất bại')
  });

  const statusMutation = useMutation({
    ...updatePartnerStatusMutation,
    onSuccess: () => {
      toast.success('Đã cập nhật trạng thái.');
      refetch();
    },
    onError: (e: Error) => toast.error(e.message || 'Cập nhật thất bại')
  });

  const tierMutation = useMutation({
    ...assignPartnerTierMutation,
    onSuccess: () => {
      toast.success('Đã gán hạng đối tác.');
      refetch();
    },
    onError: (e: Error) => toast.error(e.message || 'Gán hạng thất bại')
  });

  const adjustMutation = useMutation({
    ...adjustPartnerWalletMutation,
    onSuccess: () => {
      toast.success('Đã điều chỉnh ví.');
      setAdjustOpen(false);
    },
    onError: (e: Error) => toast.error(e.message || 'Điều chỉnh thất bại')
  });

  const relevantTiers = tiers.filter((t) => t.partnerType === partner.partnerType);

  return (
    <div className='space-y-6'>
      <AdjustPartnerWalletModal
        partnerId={partnerId}
        open={adjustOpen}
        onOpenChange={setAdjustOpen}
        onSubmit={(data) => adjustMutation.mutate({ id: partnerId, data })}
        isSubmitting={adjustMutation.isPending}
      />
      <RejectPartnerModal
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        onSubmit={(data) => rejectMutation.mutate({ id: partnerId, data })}
        isSubmitting={rejectMutation.isPending}
      />

      <div className='flex flex-wrap items-start justify-between gap-4'>
        <div>
          <div className='flex items-center gap-3'>
            <h2 className='text-xl font-semibold'>{partner.companyName || partner.contactName}</h2>
            <Badge variant={STATUS_VARIANTS[partner.status]}>{STATUS_LABELS[partner.status]}</Badge>
            <Badge variant='outline'>{PARTNER_TYPE_LABELS[partner.partnerType]}</Badge>
          </div>
          <p className='text-muted-foreground text-sm'>
            {partner.contactEmail} · {partner.contactPhone}
          </p>
        </div>
        <div className='flex flex-wrap gap-2'>
          {partner.status === 'pending' && (
            <>
              <Button
                size='sm'
                onClick={() => approveMutation.mutate(partnerId)}
                isLoading={approveMutation.isPending}
              >
                <Icons.check className='mr-2 h-4 w-4' /> Duyệt
              </Button>
              <Button size='sm' variant='destructive' onClick={() => setRejectOpen(true)}>
                <Icons.close className='mr-2 h-4 w-4' /> Từ chối
              </Button>
            </>
          )}
          {partner.status === 'active' && (
            <Button
              size='sm'
              variant='outline'
              onClick={() => statusMutation.mutate({ id: partnerId, data: { status: 'hold' } })}
            >
              Tạm giữ
            </Button>
          )}
          {(partner.status === 'hold' || partner.status === 'disabled') && (
            <Button
              size='sm'
              onClick={() => statusMutation.mutate({ id: partnerId, data: { status: 'active' } })}
            >
              Kích hoạt lại
            </Button>
          )}
          {partner.status === 'active' && (
            <Button
              size='sm'
              variant='destructive'
              onClick={() => statusMutation.mutate({ id: partnerId, data: { status: 'disabled' } })}
            >
              Khóa
            </Button>
          )}
          <Button size='sm' variant='outline' onClick={() => setAdjustOpen(true)}>
            <Icons.wallet className='mr-2 h-4 w-4' /> Điều chỉnh ví
          </Button>
        </div>
      </div>

      {partner.status === 'rejected' && partner.rejectionReason && (
        <div className='rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm'>
          <span className='font-medium'>Lý do từ chối: </span>
          {partner.rejectionReason}
        </div>
      )}

      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
        <div className='rounded-lg border p-4'>
          <p className='text-muted-foreground text-xs font-medium'>Loại pháp nhân</p>
          <p className='text-sm font-medium'>{LEGAL_TYPE_LABELS[partner.legalType]}</p>
        </div>
        {partner.companyName && (
          <div className='rounded-lg border p-4'>
            <p className='text-muted-foreground text-xs font-medium'>Mã số thuế</p>
            <p className='text-sm font-medium'>{partner.taxCode || '—'}</p>
          </div>
        )}
        <div className='rounded-lg border p-4'>
          <p className='text-muted-foreground text-xs font-medium'>Ngày đăng ký</p>
          <p className='text-sm font-medium'>
            {new Date(partner.createdAt).toLocaleDateString('vi-VN')}
          </p>
        </div>
      </div>

      <div className='rounded-lg border p-4'>
        <p className='mb-3 text-sm font-medium'>Hạng đối tác</p>
        <div className='flex items-center gap-3'>
          <Select
            value={partner.tierCode || ''}
            onValueChange={(tierCode) => tierMutation.mutate({ id: partnerId, data: { tierCode } })}
          >
            <SelectTrigger className='w-[220px]'>
              <SelectValue placeholder='Chưa gán hạng' />
            </SelectTrigger>
            <SelectContent>
              {relevantTiers.map((tier) => (
                <SelectItem key={tier.tierCode} value={tier.tierCode}>
                  {tier.tierName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {partner.businessAddress && (
        <div className='rounded-lg border p-4'>
          <p className='text-muted-foreground text-xs font-medium'>Địa chỉ</p>
          <p className='text-sm'>{partner.businessAddress}</p>
        </div>
      )}

      {partner.channelInfo && Object.keys(partner.channelInfo).length > 0 && (
        <div className='rounded-lg border p-4'>
          <p className='text-muted-foreground mb-2 text-xs font-medium'>Thông tin kênh</p>
          <pre className='overflow-x-auto text-xs'>
            {JSON.stringify(partner.channelInfo, null, 2)}
          </pre>
        </div>
      )}

      {partner.notes && (
        <div className='rounded-lg border p-4'>
          <p className='text-muted-foreground text-xs font-medium'>Ghi chú</p>
          <p className='text-sm'>{partner.notes}</p>
        </div>
      )}
    </div>
  );
}
