'use client';
import { formatDateVn } from '@/lib/format';
import { useMutation, useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { partnerQueryOptions, tiersQueryOptions } from '../api/queries';
import {
  approvePartnerMutation,
  rejectPartnerMutation,
  assignPartnerTierMutation,
  setPartnerAdminNoteMutation,
  setPartnerAffiliateGrantMutation,
  setPartnerLinkCodePermissionMutation
} from '../api/mutations';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { toast } from 'sonner';
import { useCallback, useEffect, useRef, useState } from 'react';
import { BulkStatusModal } from './bulk-status-modal';
import { PartnerContractCard, type PartnerContractCardHandle } from './partner-contract-card';
import { PartnerStatsSection } from './partner-stats-section';
import { PartnerWalletSheet } from './partner-wallet-sheet';
import { RejectPartnerModal } from './reject-partner-modal';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import type { PartnerStatus } from '../api/types';

/**
 * One partner, laid out in the order the brief gives (doitac-1410 #004):
 * 1 the partner, 2 their sales channel, 3 tier and affiliate rights, 4 their
 * figures over a chosen period, 5 the contract and deposit limits, 6 the
 * admin's note — with every action, "Lưu lại" included, at the head of the
 * page. The link and discount-code lists and "create a link for the partner"
 * moved to the "Tiếp thị liên kết" menu, so they are not repeated here.
 */

const PARTNER_TYPE_LABELS = {
  distribution: 'Đối tác phân phối',
  kol: 'Đối tác tiếp thị (KOL)'
} as const;
const LEGAL_TYPE_LABELS = {
  individual: 'Cá nhân',
  company: 'Doanh nghiệp'
} as const;
const STATUS_LABELS: Record<PartnerStatus, string> = {
  pending: 'Chờ duyệt',
  active: 'Đang hoạt động',
  hold: 'Tạm khóa tài khoản',
  disabled: 'Khóa tài khoản',
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

/** The registration form's "Kênh bán chính" choices. */
const CHANNEL_LABELS: Record<string, string> = {
  youtube: 'YouTube',
  tiktok: 'TikTok',
  facebook: 'Facebook',
  instagram: 'Instagram',
  website: 'Website',
  store: 'Cửa hàng hoặc điểm bán',
  travel: 'Công ty du lịch / đại lý vé',
  other: 'Kênh khác'
};

/** One labelled value in a section. */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className='min-w-0'>
      <p className='text-muted-foreground text-xs font-medium'>{label}</p>
      <div className='text-sm font-medium break-words'>{children || '—'}</div>
    </div>
  );
}

export function PartnerDetailView({ partnerId }: { partnerId: number }) {
  const [rejectOpen, setRejectOpen] = useState(false);
  const [walletOpen, setWalletOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [statusTarget, setStatusTarget] = useState<PartnerStatus>('hold');
  const openStatus = (target: PartnerStatus) => {
    setStatusTarget(target);
    setStatusOpen(true);
  };
  const { data: partner, refetch } = useSuspenseQuery(partnerQueryOptions(partnerId));
  const { data: tiers = [] } = useQuery(tiersQueryOptions());

  // Seeded from the partner and kept local while the admin types; "Lưu lại"
  // is the only thing that writes it back (#056).
  const [adminNote, setAdminNote] = useState('');
  const loadedNote = partner.adminNote ?? '';
  useEffect(() => {
    setAdminNote(loadedNote);
  }, [loadedNote]);
  const noteDirty = adminNote !== loadedNote;

  // Section 5 saves through the same button (doitac-1410 #004).
  const contractRef = useRef<PartnerContractCardHandle>(null);
  const [contractDirty, setContractDirty] = useState(false);
  const onContractDirty = useCallback((dirty: boolean) => setContractDirty(dirty), []);
  const [saving, setSaving] = useState(false);

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
    onSuccess: () => toast.success('Đã lưu ghi chú.'),
    onError: (e: Error) => toast.error(e.message || 'Lưu ghi chú thất bại')
  });

  const affiliateGrantMutation = useMutation({
    ...setPartnerAffiliateGrantMutation,
    onSuccess: (updated) => {
      toast.success(
        updated.canAffiliate
          ? 'Đã bật phân quyền affiliate cho đối tác này.'
          : 'Đã tắt phân quyền affiliate của đối tác này.'
      );
      refetch();
    },
    onError: (e: Error) => toast.error(e.message || 'Cập nhật quyền thất bại')
  });

  const saveAll = async () => {
    setSaving(true);
    try {
      await Promise.all([
        contractRef.current?.save(),
        noteDirty ? adminNoteMutation.mutateAsync({ id: partnerId, adminNote }) : undefined
      ]);
      await refetch();
    } catch {
      // Each save has already said what went wrong.
    } finally {
      setSaving(false);
    }
  };

  // Only a tier in use can be assigned; the list now carries inactive ones (#059).
  const relevantTiers = tiers.filter((t) => t.partnerType === partner.partnerType && t.isActive);
  const isKol = partner.partnerType === 'kol';
  const isCompany = partner.legalType === 'company';
  const decided = partner.status !== 'pending' && partner.status !== 'rejected';
  const isLocked = partner.status === 'hold' || partner.status === 'disabled';
  // A marketing partner always runs the programme; a distribution partner
  // only once it has been granted (#048).
  const runsProgramme = isKol || Boolean(partner.canAffiliate);

  const channel = partner.channelInfo ?? {};
  const channelName =
    typeof channel.channel === 'string' ? (CHANNEL_LABELS[channel.channel] ?? channel.channel) : '';
  const followers =
    channel.followers != null && channel.followers !== ''
      ? Number(channel.followers).toLocaleString('vi-VN')
      : '';
  const otherChannels = Object.entries(channel).filter(
    ([key, value]) =>
      !['model', 'channel', 'url', 'followers'].includes(key) &&
      typeof value === 'string' &&
      value.trim()
  );

  return (
    <div className='space-y-6'>
      <RejectPartnerModal
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        onSubmit={(data) => rejectMutation.mutate({ id: partnerId, data })}
        isSubmitting={rejectMutation.isPending}
      />
      <BulkStatusModal
        open={statusOpen}
        onOpenChange={setStatusOpen}
        partnerIds={[partnerId]}
        initialStatus={statusTarget}
        onDone={refetch}
      />
      <PartnerWalletSheet
        partnerId={partnerId}
        partnerType={partner.partnerType}
        partnerStatus={partner.status}
        open={walletOpen}
        onOpenChange={setWalletOpen}
      />

      <div className='flex flex-wrap items-start justify-between gap-4'>
        <div>
          <div className='flex flex-wrap items-center gap-3'>
            <h2 className='text-xl font-semibold'>{partner.companyName || partner.contactName}</h2>
            <span className='text-muted-foreground font-mono text-sm'>#{partner.id}</span>
            <Badge variant={STATUS_VARIANTS[partner.status]}>{STATUS_LABELS[partner.status]}</Badge>
            {/* Applied for API integration (#053, test round 4). */}
            {partner.requestedType === 'api' && (
              <Badge variant='secondary'>Đăng ký: tích hợp API</Badge>
            )}
          </div>
        </div>
        <div className='flex flex-wrap gap-2'>
          <Button
            size='sm'
            onClick={saveAll}
            isLoading={saving}
            disabled={!noteDirty && !contractDirty}
          >
            <Icons.check className='mr-2 h-4 w-4' /> Lưu lại
          </Button>
          {/* A rejection can be overturned by hand (#056, doitac-1410 #049). */}
          {(partner.status === 'pending' || partner.status === 'rejected') && (
            <>
              <Button
                size='sm'
                variant='outline'
                onClick={() => approveMutation.mutate(partnerId)}
                isLoading={approveMutation.isPending}
              >
                <Icons.check className='mr-2 h-4 w-4' /> Duyệt
              </Button>
              {partner.status === 'pending' && (
                <Button size='sm' variant='destructive' onClick={() => setRejectOpen(true)}>
                  <Icons.close className='mr-2 h-4 w-4' /> Từ chối
                </Button>
              )}
            </>
          )}
          {/*
            Each opens the status dialog on its own action, which is where the
            reason is collected (#061) — the server refuses a hold or a lock
            without one.
          */}
          {isLocked && (
            <Button size='sm' variant='outline' onClick={() => openStatus('active')}>
              Mở khóa
            </Button>
          )}
          {decided && partner.status !== 'hold' && (
            <Button size='sm' variant='outline' onClick={() => openStatus('hold')}>
              Tạm khóa
            </Button>
          )}
          {decided && partner.status !== 'disabled' && (
            <Button size='sm' variant='destructive' onClick={() => openStatus('disabled')}>
              Khóa tài khoản
            </Button>
          )}
          {/* No wallet while the application is still being decided (#056). */}
          {decided && (
            <Button size='sm' variant='outline' onClick={() => setWalletOpen(true)}>
              <Icons.wallet className='mr-2 h-4 w-4' /> Điều chỉnh Ví & Hoa hồng
            </Button>
          )}
        </div>
      </div>

      {partner.status === 'rejected' && partner.rejectionReason && (
        <div className='border-destructive/50 bg-destructive/10 rounded-lg border p-3 text-sm'>
          <span className='font-medium'>Lý do từ chối: </span>
          {partner.rejectionReason}
        </div>
      )}

      {/* 1 — who the partner is. */}
      <Card>
        <CardHeader>
          <CardTitle>1. {decided ? 'Thông tin đối tác' : 'Thông tin đăng ký'}</CardTitle>
        </CardHeader>
        <CardContent className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          <Field label={isCompany ? 'Tên doanh nghiệp' : 'Họ tên'}>
            {partner.companyName || partner.contactName}
          </Field>
          {isCompany && <Field label='Người liên hệ'>{partner.contactName}</Field>}
          <Field label={decided ? 'Loại đối tác' : 'Loại hình hợp tác'}>
            {partner.requestedType === 'api'
              ? 'Đối tác API'
              : PARTNER_TYPE_LABELS[partner.partnerType]}
          </Field>
          <Field label='Email'>{partner.contactEmail}</Field>
          <Field label='Số điện thoại'>{partner.contactPhone}</Field>
          <Field label='Loại pháp nhân'>{LEGAL_TYPE_LABELS[partner.legalType]}</Field>
          {isCompany && <Field label='Mã số thuế'>{partner.taxCode}</Field>}
          {isCompany && <Field label='Địa chỉ'>{partner.businessAddress}</Field>}
          <Field label='Ngày gửi đăng ký'>{formatDateVn(partner.createdAt)}</Field>
          {/* What the applicant attached (doitac-1410 #013), opened through the admin-only route. */}
          <div className='sm:col-span-2 lg:col-span-3' data-testid='partner-documents'>
            <p className='text-muted-foreground text-xs font-medium'>Tài liệu đính kèm</p>
            {partner.documents?.length ? (
              <ul className='mt-1 flex flex-wrap gap-2'>
                {partner.documents.map((doc) => (
                  <li key={doc.id}>
                    <a
                      href={`/api/partners/${partner.id}/documents/${encodeURIComponent(doc.id)}`}
                      target='_blank'
                      rel='noreferrer'
                      className='hover:bg-muted inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-sm'
                    >
                      <Icons.post className='size-4' />
                      <span className='max-w-[220px] truncate'>{doc.name}</span>
                      <span className='text-muted-foreground text-xs'>
                        {(doc.sizeBytes / 1024 / 1024).toFixed(1)} MB
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className='text-sm'>—</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 2 — what they sell through, as given on the registration form. */}
      <Card>
        <CardHeader>
          <CardTitle>2. {isKol ? 'Kênh giới thiệu' : 'Kênh bán hàng'}</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
            <Field label='Kênh bán chính'>{channelName}</Field>
            <Field label='Đường dẫn kênh'>
              {typeof channel.url === 'string' && channel.url ? (
                <a
                  href={channel.url}
                  target='_blank'
                  rel='noreferrer'
                  className='text-primary underline-offset-2 hover:underline'
                >
                  {channel.url}
                </a>
              ) : (
                ''
              )}
            </Field>
            <Field label={isKol ? 'Số người theo dõi' : 'Lượng truy cập mỗi tháng'}>
              {followers}
            </Field>
            {otherChannels.map(([key, value]) => (
              <Field key={key} label={CHANNEL_LABELS[key] ?? key}>
                {String(value)}
              </Field>
            ))}
          </div>
          {partner.notes && (
            <Field label='Ghi chú của đối tác khi đăng ký'>
              <span className='font-normal'>{partner.notes}</span>
            </Field>
          )}
        </CardContent>
      </Card>

      {/*
        3 — tier, and what the partner is allowed to do. Like 4 and 5 below,
        only once the partner is approved: an application under review shows
        just what the applicant filled in (doitac-1410 #049).
      */}
      {decided && (
        <Card>
          <CardHeader>
            <CardTitle>3. Hạng đối tác và phân quyền</CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              value={partner.tierCode || ''}
              onValueChange={(tierCode) =>
                tierMutation.mutate({ id: partnerId, data: { tierCode } })
              }
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

            {!isKol && (
              <div className='mt-4 flex items-start justify-between gap-4 border-t pt-4'>
                <div>
                  <p className='text-sm font-medium'>Được phân quyền affiliate</p>
                  <p className='text-muted-foreground text-xs'>
                    Cho phép đối tác phân phối tham gia luôn chương trình tiếp thị: cổng đối tác
                    hiện thêm Link tiếp thị, Mã giảm giá, Hoa hồng và Thanh toán (#048). Tắt đi thì
                    các mục đó ẩn lại, nhưng hoa hồng đã ghi nhận vẫn là của họ.
                  </p>
                </div>
                <Switch
                  checked={Boolean(partner.canAffiliate)}
                  disabled={affiliateGrantMutation.isPending}
                  onCheckedChange={(checked) =>
                    affiliateGrantMutation.mutate({ id: partnerId, canAffiliate: checked })
                  }
                  aria-label='Được phân quyền affiliate'
                />
              </div>
            )}

            {/* Only shown once the partner runs the programme (doitac-1410 #004). */}
            {runsProgramme && (
              <div className='mt-4 flex items-start justify-between gap-4 border-t pt-4'>
                <div>
                  <p className='text-sm font-medium'>Được đặt tên link tiếp thị</p>
                  <p className='text-muted-foreground text-xs'>
                    Cho phép đối tác tự đặt tên link (esim.vn/go/TENCHIENDICH, 8–50 ký tự chữ và
                    số). Thường chỉ bật cho đối tác hạng cao cần tên dễ nhớ cho chiến dịch.
                  </p>
                </div>
                <Switch
                  checked={Boolean(partner.canCustomLinkCode)}
                  disabled={linkCodeMutation.isPending}
                  onCheckedChange={(checked) =>
                    linkCodeMutation.mutate({ id: partnerId, canCustomLinkCode: checked })
                  }
                  aria-label='Được đặt tên link tiếp thị'
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 4 — the partner's figures over a chosen period. */}
      {decided && <PartnerStatsSection partner={partner} />}

      {/* 5 — contract lines and this partner's own deposit limits. */}
      {decided && (
        <PartnerContractCard ref={contractRef} partner={partner} onDirtyChange={onContractDirty} />
      )}

      {/*
        6 — the reviewer's own note (#056). Separate from the applicant's: who
        was called, what was checked, what to look at next time.
      */}
      <Card>
        <CardHeader>
          <CardTitle>{decided ? 6 : 3}. Ghi chú của quản trị viên</CardTitle>
        </CardHeader>
        <CardContent className='space-y-2'>
          <Textarea
            rows={3}
            placeholder='Ví dụ: đã gọi xác minh kênh bán, giấy phép hợp lệ.'
            value={adminNote}
            onChange={(e) => setAdminNote(e.target.value)}
            aria-label='Ghi chú của quản trị viên'
          />
          {noteDirty && (
            <div className='flex items-center gap-2'>
              <p className='text-muted-foreground text-xs'>
                Có thay đổi chưa lưu — bấm &quot;Lưu lại&quot; ở đầu trang.
              </p>
              <Button size='sm' variant='ghost' onClick={() => setAdminNote(loadedNote)}>
                Hoàn tác
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
