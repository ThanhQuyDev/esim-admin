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
  assignPartnerTierMutation,
  adjustPartnerWalletMutation,
  setPartnerAdminNoteMutation,
  setPartnerAffiliateGrantMutation,
  setPartnerLinkCodePermissionMutation
} from '../api/mutations';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';
import { AdjustPartnerWalletModal } from './adjust-partner-wallet-modal';
import { BulkStatusModal } from './bulk-status-modal';
import { PartnerContractCard } from './partner-contract-card';
import { PartnerPerformanceCard } from './partner-performance-card';
import { RejectPartnerModal } from './reject-partner-modal';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import type { PartnerStatus } from '../api/types';

const PARTNER_TYPE_LABELS = {
  distribution: 'Đối tác phân phối',
  kol: 'KOL'
} as const;
const LEGAL_TYPE_LABELS = {
  individual: 'Cá nhân',
  company: 'Doanh nghiệp'
} as const;
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
  const [statusOpen, setStatusOpen] = useState(false);
  const { data: partner, refetch } = useSuspenseQuery(partnerQueryOptions(partnerId));
  const { data: tiers = [] } = useQuery(tiersQueryOptions());
  // Not suspense: the partner's own details should render even if this extra
  // call is slow or fails.
  const { data: marketing } = useQuery(partnerMarketingQueryOptions(partnerId));

  // Seeded from the partner and kept local while the admin types; the Save
  // button is the only thing that writes it back (#056).
  const [adminNote, setAdminNote] = useState('');
  const loadedNote = partner.adminNote ?? '';
  useEffect(() => {
    setAdminNote(loadedNote);
  }, [loadedNote]);

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

  const tierMutation = useMutation({
    ...assignPartnerTierMutation,
    onSuccess: () => {
      toast.success('Đã gán hạng đối tác.');
      refetch();
    },
    onError: (e: Error) => toast.error(e.message || 'Gán hạng thất bại')
  });

  const linkCodeMutation = useMutation({
    ...setPartnerLinkCodePermissionMutation,
    onSuccess: (updated) => {
      toast.success(
        updated.canCustomLinkCode
          ? 'Đã cho phép đối tác đặt tên link tiếp thị.'
          : 'Đã tắt quyền đặt tên link tiếp thị.'
      );
      refetch();
    },
    onError: (e: Error) => toast.error(e.message || 'Cập nhật quyền thất bại')
  });

  const adminNoteMutation = useMutation({
    ...setPartnerAdminNoteMutation,
    onSuccess: () => {
      toast.success('Đã lưu ghi chú.');
      refetch();
    },
    onError: (e: Error) => toast.error(e.message || 'Lưu ghi chú thất bại')
  });

  const affiliateGrantMutation = useMutation({
    ...setPartnerAffiliateGrantMutation,
    onSuccess: (updated) => {
      toast.success(
        updated.canAffiliate
          ? 'Đã bật chương trình tiếp thị cho đối tác này.'
          : 'Đã tắt chương trình tiếp thị của đối tác này.'
      );
      refetch();
    },
    onError: (e: Error) => toast.error(e.message || 'Cập nhật quyền thất bại')
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
          {/*
            Every one of these opens the same dialog, which is where the reason
            is collected (#061). The server refuses a hold or a lock without
            one, so a button that fired straight off would only ever 400.
          */}
          {partner.status === 'active' && (
            <Button size='sm' variant='outline' onClick={() => setStatusOpen(true)}>
              Tạm khoá
            </Button>
          )}
          {(partner.status === 'hold' || partner.status === 'disabled') && (
            <Button size='sm' onClick={() => setStatusOpen(true)}>
              Mở khoá
            </Button>
          )}
          {partner.status === 'active' && (
            <Button size='sm' variant='destructive' onClick={() => setStatusOpen(true)}>
              Khoá tài khoản
            </Button>
          )}
          {/*
            No wallet while the application is still being decided (#056): a
            partner who has not been approved has no balance to adjust, and the
            button only invites a change with nothing behind it.
          */}
          {partner.status !== 'pending' && partner.status !== 'rejected' && (
            <Button size='sm' variant='outline' onClick={() => setAdjustOpen(true)}>
              <Icons.wallet className='mr-2 h-4 w-4' /> Điều chỉnh ví
            </Button>
          )}
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
                  {/* Internal tiers are assignable only from here, so the
                      list has to say which is which (#074). */}
                  {tier.isInternal ? `${tier.tierName} (nội bộ)` : tier.tierName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {relevantTiers.find((t) => t.tierCode === partner.tierCode)?.isInternal && (
          <p className='text-muted-foreground mt-2 text-xs'>
            Đối tác đang ở hạng nội bộ — hệ thống sẽ không tự xét lại hạng cho đối tác này.
          </p>
        )}
        <p className='text-muted-foreground mt-2 text-xs'>
          {partner.tierEffectiveFrom
            ? `Hạng này áp dụng từ ${formatDateVn(partner.tierEffectiveFrom)}. Đổi hạng chỉ tính cho đơn phát sinh sau thời điểm đổi — đơn trước đó giữ mức hoa hồng cũ (#042).`
            : 'Đổi hạng chỉ tính cho đơn phát sinh sau thời điểm đổi — đơn trước đó giữ mức hoa hồng cũ, hệ thống không tính hồi tố.'}
        </p>

        {partner.partnerType === 'distribution' && (
          <div className='mt-4 flex items-start justify-between gap-4 border-t pt-4'>
            <div>
              <p className='text-sm font-medium'>Được phân quyền affiliate</p>
              <p className='text-muted-foreground text-xs'>
                Cho phép đối tác phân phối tham gia luôn chương trình tiếp thị. Khi bật, cổng đối
                tác của họ mới hiện các mục Link tiếp thị, Mã giảm giá, Hoa hồng và Rút tiền (#048).
                Tắt đi thì các mục đó ẩn lại, nhưng link và mã đã tạo vẫn còn hiệu lực và hoa hồng
                đã ghi nhận vẫn là của họ.
              </p>
            </div>
            <Switch
              checked={Boolean(partner.canAffiliate)}
              disabled={affiliateGrantMutation.isPending}
              onCheckedChange={(checked) =>
                affiliateGrantMutation.mutate({
                  id: partnerId,
                  canAffiliate: checked
                })
              }
              aria-label='Cho phép tham gia chương trình tiếp thị'
            />
          </div>
        )}

        {partner.partnerType === 'kol' && (
          <div className='mt-4 flex items-start justify-between gap-4 border-t pt-4'>
            <div>
              <p className='text-sm font-medium'>Được đặt tên link tiếp thị</p>
              <p className='text-muted-foreground text-xs'>
                Cho phép đối tác tự đặt tên link (esim.vn/go/TENCHIENDICH, 8–50 ký tự chữ và số).
                Thường chỉ bật cho đối tác hạng cao cần tên dễ nhớ cho chiến dịch.
              </p>
            </div>
            <Switch
              checked={Boolean(partner.canCustomLinkCode)}
              disabled={linkCodeMutation.isPending}
              onCheckedChange={(checked) =>
                linkCodeMutation.mutate({
                  id: partnerId,
                  canCustomLinkCode: checked
                })
              }
              aria-label='Cho phép đặt tên link tiếp thị'
            />
          </div>
        )}
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

      <BulkStatusModal
        open={statusOpen}
        onOpenChange={setStatusOpen}
        partnerIds={[partnerId]}
        onDone={refetch}
      />

      {/* How the partner has been doing, and what the contract says (#061). */}
      <PartnerPerformanceCard partnerId={partnerId} />
      <PartnerContractCard partner={partner} onSaved={refetch} />

      {partner.notes && (
        <div className='rounded-lg border p-4'>
          <p className='text-muted-foreground text-xs font-medium'>Ghi chú của đối tác</p>
          <p className='text-sm'>{partner.notes}</p>
        </div>
      )}

      {/*
        The reviewer's own note (#056). Separate from the applicant's: this is
        who was called, what was checked, and what to look at next time — and it
        is what support reads back when the partner asks why.
      */}
      <div className='rounded-lg border p-4'>
        <p className='text-muted-foreground text-xs font-medium'>Ghi chú của quản trị viên</p>
        <Textarea
          className='mt-2'
          rows={3}
          placeholder='Ví dụ: đã gọi xác minh kênh bán, giấy phép hợp lệ.'
          value={adminNote}
          onChange={(e) => setAdminNote(e.target.value)}
        />
        <div className='mt-2 flex items-center gap-2'>
          <Button
            size='sm'
            isLoading={adminNoteMutation.isPending}
            disabled={adminNote === (partner.adminNote ?? '')}
            onClick={() => adminNoteMutation.mutate({ id: partnerId, adminNote })}
          >
            Lưu ghi chú
          </Button>
          {adminNote !== (partner.adminNote ?? '') && (
            <Button size='sm' variant='ghost' onClick={() => setAdminNote(partner.adminNote ?? '')}>
              Hoàn tác
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
