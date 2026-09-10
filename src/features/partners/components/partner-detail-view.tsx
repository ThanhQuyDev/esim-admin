'use client';
import { formatDateTimeVn, formatDateVn, formatVnd } from '@/lib/format';
import { useMutation, useQuery, useSuspenseQuery } from '@tanstack/react-query';
import {
  partnerMarketingQueryOptions,
  partnerQueryOptions,
  tiersQueryOptions
} from '../api/queries';

/** Where a partner's links point, matching the partner portal's own display. */
const PUBLIC_ORIGIN = process.env.NEXT_PUBLIC_SITE_URL || 'https://esim.vn';
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

/** Vietnamese labels for the free-form `channelInfo` keys the apply form sends. */
const CHANNEL_INFO_LABELS: Record<string, string> = {
  url: 'Đường dẫn kênh',
  followers: 'Số người theo dõi'
};

/** `followers` is a count; everything else is shown as-is. */
function formatChannelValue(key: string, value: unknown): string {
  if (key === 'followers' && typeof value === 'number') {
    return formatDateTimeVn(value);
  }
  return typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value ?? '');
}

export function PartnerDetailView({ partnerId }: { partnerId: number }) {
  const [rejectOpen, setRejectOpen] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);

  const { data: partner, refetch } = useSuspenseQuery(partnerQueryOptions(partnerId));
  const { data: tiers = [] } = useQuery(tiersQueryOptions());
  // Not suspense: the partner's own details should render even if this extra
  // call is slow or fails.
  const { data: marketing } = useQuery(partnerMarketingQueryOptions(partnerId));

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
          <p className='text-sm font-medium'>{formatDateVn(partner.createdAt)}</p>
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

      {/*
        "bấm xem chi tiết đối tác để xem các mã/liên kết đối tác đã tạo" (#095).
        Without this an admin chasing a reconciliation query or a suspicious
        order could not tell which codes belong to which partner without opening
        the database.
      */}
      <div className='rounded-lg border p-4' data-testid='partner-marketing'>
        <p className='mb-3 text-sm font-medium'>Liên kết & mã giới thiệu</p>
        {marketing === undefined ? (
          <p className='text-muted-foreground text-sm'>Đang tải...</p>
        ) : marketing.links.length === 0 && marketing.coupons.length === 0 ? (
          <p className='text-muted-foreground text-sm'>
            Đối tác này chưa tạo liên kết hoặc mã giảm giá nào.
          </p>
        ) : (
          <div className='space-y-4'>
            {marketing.links.length > 0 && (
              <div className='space-y-2'>
                {marketing.links.map((link) => (
                  <div
                    key={link.id}
                    className='flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2'
                  >
                    <div className='min-w-0'>
                      <p className='text-sm font-medium'>{link.label}</p>
                      <p className='text-muted-foreground font-mono text-xs'>
                        {PUBLIC_ORIGIN}/go/{link.code}
                        {link.status !== 'active' && ' · đã tắt'}
                      </p>
                    </div>
                    <div className='text-muted-foreground flex gap-3 text-xs tabular-nums'>
                      <span>{link.clickCount} lượt bấm</span>
                      <span>{link.conversionCount} đơn</span>
                      <span>{formatVnd(Number(link.totalCommissionVnd) || 0)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {marketing.coupons.length > 0 && (
              <div className='space-y-2'>
                <p className='text-muted-foreground text-xs font-medium'>Mã giảm giá</p>
                {marketing.coupons.map((coupon) => (
                  <div
                    key={coupon.id}
                    className='flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2'
                  >
                    <div>
                      <span className='font-mono text-sm font-medium'>{coupon.code}</span>
                      {coupon.discountPercent ? (
                        <span className='text-muted-foreground ml-2 text-xs'>
                          -{coupon.discountPercent}%
                        </span>
                      ) : null}
                      {!coupon.isActive && (
                        <span className='text-muted-foreground ml-2 text-xs'>· đã tắt</span>
                      )}
                    </div>
                    <div className='text-muted-foreground flex gap-3 text-xs tabular-nums'>
                      <span>{coupon.myOrders} đơn của đối tác</span>
                      <span>đã giảm {formatVnd(coupon.discountGivenVnd)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {partner.businessAddress && (
        <div className='rounded-lg border p-4'>
          <p className='text-muted-foreground text-xs font-medium'>Địa chỉ</p>
          <p className='text-sm'>{partner.businessAddress}</p>
        </div>
      )}

      {partner.channelInfo && Object.keys(partner.channelInfo).length > 0 && (
        <div className='rounded-lg border p-4'>
          <p className='text-muted-foreground mb-3 text-xs font-medium'>Thông tin kênh</p>
          <dl className='grid gap-2 sm:grid-cols-2'>
            {Object.entries(partner.channelInfo).map(([key, value]) => (
              <div key={key} className='min-w-0'>
                <dt className='text-muted-foreground text-xs'>{CHANNEL_INFO_LABELS[key] ?? key}</dt>
                <dd className='truncate text-sm'>{formatChannelValue(key, value)}</dd>
              </div>
            ))}
          </dl>
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
