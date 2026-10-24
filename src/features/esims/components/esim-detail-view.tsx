'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import { esimQrLogoSettings } from '../lib/esim-qr';
import { AdminTopupDialog } from './admin-topup-dialog';
import { EsimFormDialog } from './esim-form-dialog';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { AlertModal } from '@/components/modal/alert-modal';
import { esimStatusLabel, esimStatusVariant } from '../lib/esim-status';
import { formatDataSize, formatDateTimeVn, formatVnd } from '@/lib/format';
import { esimQueryOptions } from '../api/queries';
import { deleteEsimMutation } from '../api/mutations';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  callSmsSummary,
  dailyResetText,
  isDailyPlanType,
  planDisplayName,
  planTypeLabel
} from '@/features/plans/utils/plan-label';
import { providerLabel } from '@/features/overview/api/constants';
import { formatUsd, planUsd } from '@/lib/plan-price';
import type { EsimDetail, EsimPlan } from '../api/types';

interface EsimDetailViewProps {
  esimId: number;
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className='flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4'>
      <span className='text-muted-foreground w-44 shrink-0 text-sm font-medium'>{label}</span>
      <span className='min-w-0 text-sm break-words'>{value || '—'}</span>
    </div>
  );
}

function YesNo({ value, testId }: { value: boolean | null | undefined; testId?: string }) {
  if (value === null || value === undefined) return <>—</>;
  return (
    <Badge variant={value ? 'default' : 'secondary'} data-testid={testId}>
      {value ? 'Có' : 'Không'}
    </Badge>
  );
}

/** Copy a value, with a short "copied" tick. */
function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type='button'
      className='text-muted-foreground hover:text-foreground inline-flex items-center'
      aria-label={label}
      title={label}
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? (
        <Icons.check className='size-3.5 text-green-500' />
      ) : (
        <Icons.copy className='size-3.5' />
      )}
    </button>
  );
}

/** Data used: "0 MB" when nothing yet, never "Không giới hạn". */
function usedData(mb: number): string {
  const rounded = Math.round(mb);
  return rounded > 0 ? formatDataSize(rounded) : '0 MB';
}

function formatDate(date: string | null | undefined) {
  if (!date) return '—';
  return formatDateTimeVn(date);
}

function isDailyPlan(plan: EsimPlan | null): boolean {
  return isDailyPlanType(plan?.type);
}

/** "Không" / "Có" / "Add-on" — Billion add-ons apart from top-ups (vande #019). */
function topUpLabel(plan: EsimPlan | null): string {
  if (!plan) return '—';
  if (plan.isAddOn) return 'Add-on';
  return plan.topUp ? 'Có' : 'Không';
}

/** The storefront's verdict on TikTok / AI apps (#045). */
function appSupportText(plan: EsimPlan | null): string | null {
  const support = plan?.appSupport;
  if (!support) return null;
  if (support.tiktokAllDevices && support.chatGpt) return 'Hỗ trợ tất cả TikTok, AI và App';
  if (!support.known) return 'Chưa rõ (APN chưa có trong bảng APN)';
  const works = [
    support.tiktokIos && !support.tiktokAndroid ? 'TikTok trên iPhone' : null,
    !support.tiktokIos && support.tiktokAndroid ? 'TikTok trên Android' : null,
    support.chatGpt ? 'ChatGPT' : null
  ].filter(Boolean);
  return works.length ? `Chỉ hỗ trợ ${works.join(', ')}` : 'Không hỗ trợ TikTok, ChatGPT và Claude';
}

/** Days used / total days, counted from activation (or install) to expiry. */
function daysProgress(esim: EsimDetail): { used: number; total: number } | null {
  const start = esim.activatedAt ?? esim.installedAt;
  const total =
    esim.chosenDays && esim.chosenDays > 0 ? esim.chosenDays : (esim.plan?.durationDays ?? 0);
  if (!total) return null;
  if (!start) return { used: 0, total };
  const end = esim.expiresAt ? new Date(esim.expiresAt).getTime() : Infinity;
  const now = Math.min(Date.now(), end);
  const used = Math.max(0, Math.ceil((now - new Date(start).getTime()) / 86_400_000));
  return { used: Math.min(used, total), total };
}

function dataProgress(esim: EsimDetail): { used: number; total: number } | null {
  const used = Number(esim.dataUsed) || 0;
  const total = Number(esim.dataTotal) || esim.plan?.dataMb || 0;
  if (!total) return null;
  return { used: Math.min(used, total), total };
}

function UsageBar({
  title,
  used,
  total,
  text,
  testId
}: {
  title: string;
  used: number;
  total: number;
  text: string;
  testId: string;
}) {
  const percent = total > 0 ? Math.round((used / total) * 100) : 0;
  return (
    <div className='space-y-2' data-testid={testId}>
      <div className='flex items-center justify-between text-sm'>
        <span className='font-medium'>{title}</span>
        <span className='text-muted-foreground'>
          {text} · {percent}%
        </span>
      </div>
      <Progress value={percent} aria-label={title} />
    </div>
  );
}

export function EsimDetailView({ esimId }: EsimDetailViewProps) {
  const { data: esim } = useSuspenseQuery(esimQueryOptions(esimId));
  const router = useRouter();
  const [topupOpen, setTopupOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const { mutate: deleteEsim, isPending: deleting } = useMutation({
    ...deleteEsimMutation,
    onSuccess: () => {
      toast.success('Đã xoá eSIM');
      router.push('/dashboard/esims');
    },
    onError: (e) => toast.error(e.message || 'Không xoá được eSIM')
  });

  const plan = esim.plan;
  // What the supplier said, else the plan's refund rule: refundable eSIMs
  // roam, local ones do not (doitac-1410 #080).
  const isRoaming = esim.isRoaming ?? plan?.isRefundable ?? false;
  // The standard name when the plan has one (vande #020).
  const planName = plan?.standardName || planDisplayName(plan);
  const usd = plan ? planUsd(plan) : null;
  const days = daysProgress(esim);
  const data = dataProgress(esim);
  // Airalo does not report when the plan itself started (vande #022).
  const showActivated = esim.provider !== 'airalo' && plan?.provider !== 'airalo';
  const lpa = esim.lpa || '';
  const iosLink = lpa ? `https://esimsetup.apple.com/esim_qrcode_provisioning?carddata=${lpa}` : '';
  const androidLink = lpa
    ? `https://esimsetup.android.com/esim_qrcode_provisioning?carddata=${lpa}`
    : '';

  return (
    <div className='grid gap-6 md:grid-cols-2'>
      {/* Admin actions first (vande #022). */}
      <Card className='md:col-span-2'>
        <CardHeader>
          <CardTitle>Thao tác quản trị</CardTitle>
        </CardHeader>
        <CardContent className='flex flex-wrap items-center gap-3'>
          {esim.iccid && (
            <Button variant='outline' onClick={() => setTopupOpen(true)}>
              <Icons.wallet className='mr-2 h-4 w-4' />
              Topup hộ khách
            </Button>
          )}
          <EsimFormDialog
            esim={esim}
            trigger={
              <Button variant='outline' data-testid='esim-edit'>
                <Icons.edit className='mr-2 h-4 w-4' />
                Sửa
              </Button>
            }
          />
          <Button
            variant='outline'
            className='text-destructive'
            onClick={() => setDeleteOpen(true)}
            data-testid='esim-delete'
          >
            <Icons.trash className='mr-2 h-4 w-4' />
            Xóa
          </Button>
        </CardContent>
      </Card>
      <AdminTopupDialog iccid={esim.iccid} open={topupOpen} onOpenChange={setTopupOpen} />
      <AlertModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        loading={deleting}
        onConfirm={() => deleteEsim(esim.id)}
        title='Xoá eSIM này?'
        description={`ICCID ${esim.iccid}. Hành động này không thể hoàn tác.`}
      />

      {/* eSIM info, named after its plan (vande #022). */}
      <Card className='md:col-span-2'>
        <CardHeader>
          <CardTitle className='flex flex-wrap items-center gap-3' data-testid='esim-info-title'>
            Thông tin eSIM{planName && planName !== '—' ? `: ${planName}` : ''}
            <Badge variant={esimStatusVariant(esim.lifecycleStatus ?? esim.status)}>
              {esimStatusLabel(esim.lifecycleStatus ?? esim.status)}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-6'>
          <div className='grid gap-4 md:grid-cols-2'>
            <div className='space-y-3' data-testid='esim-info-left'>
              {/* Which order the eSIM came from (doitac-1410 #069). */}
              <InfoRow
                label='Mã đơn hàng'
                value={
                  esim.orderNumber ? (
                    <Link
                      href={`/dashboard/orders/${encodeURIComponent(esim.orderNumber)}`}
                      className='text-primary font-mono text-xs hover:underline'
                      data-testid='esim-order-number'
                    >
                      {esim.orderNumber}
                    </Link>
                  ) : (
                    <span className='text-muted-foreground'>
                      Chưa gắn đơn hàng (eSIM trong kho)
                    </span>
                  )
                }
              />
              <InfoRow
                label='ICCID'
                value={
                  <span className='flex items-center gap-1.5 font-mono text-xs'>
                    {esim.iccid}
                    <CopyButton value={esim.iccid} label='Copy ICCID' />
                  </span>
                }
              />
              <InfoRow
                label='Dữ liệu'
                value={data ? `${usedData(data.used)} / ${formatDataSize(data.total)}` : '—'}
              />
              <InfoRow label='Phút gọi / SMS' value={callSmsSummary(plan) ?? 'Không (chỉ data)'} />
              <InfoRow label='Hỗ trợ Topup' value={topUpLabel(plan)} />
              <InfoRow label='Hỗ trợ hoàn tiền' value={<YesNo value={plan?.isRefundable} />} />
              <InfoRow label='Giá vốn VNĐ' value={plan ? formatVnd(plan.vndCostPrice ?? 0) : '—'} />
              <InfoRow label='Giá bán VNĐ' value={plan ? formatVnd(plan.vndPrice ?? 0) : '—'} />
              <InfoRow label='Giá bán $' value={usd ? formatUsd(usd.price) : '—'} />
            </div>
            <div className='space-y-3' data-testid='esim-info-right'>
              <InfoRow
                label='Nhà cung cấp'
                value={providerLabel(esim.provider || plan?.provider)}
              />
              <InfoRow label='Loại gói' value={planTypeLabel(plan?.type) ?? '—'} />
              <InfoRow
                label='Mã gói NCC'
                value={
                  plan?.providerPlanId ? (
                    <span className='flex items-center gap-1.5 font-mono text-xs'>
                      {plan.providerPlanId}
                      <CopyButton value={plan.providerPlanId} label='Copy mã gói' />
                    </span>
                  ) : (
                    '—'
                  )
                }
              />
              <InfoRow
                label='Slug gói eSIM'
                value={plan?.slug ? <span className='font-mono text-xs'>{plan.slug}</span> : '—'}
              />
              {/* The moments the supplier reports, in order (vande #011). */}
              <InfoRow label='Ngày tạo' value={formatDate(esim.createdAt)} />
              <InfoRow label='Cài đặt lúc' value={formatDate(esim.installedAt)} />
              {showActivated && (
                <InfoRow label='Kích hoạt gói lúc' value={formatDate(esim.activatedAt)} />
              )}
              <InfoRow label='Hết hạn lúc' value={formatDate(esim.expiresAt)} />
              <InfoRow label='Thời gian cập nhật' value={formatDate(esim.updatedAt)} />
            </div>
          </div>
          {/* Days and data used, side by side (vande #022). */}
          <div className='grid gap-6 border-t pt-4 md:grid-cols-2'>
            {days ? (
              <UsageBar
                title='Thời gian sử dụng'
                used={days.used}
                total={days.total}
                text={`${days.used} / ${days.total} ngày`}
                testId='esim-days-progress'
              />
            ) : (
              <p className='text-muted-foreground text-sm'>Thời gian sử dụng: —</p>
            )}
            {data ? (
              <UsageBar
                title='Data đã dùng'
                used={data.used}
                total={data.total}
                text={`${usedData(data.used)} / ${formatDataSize(data.total)}`}
                testId='esim-data-progress'
              />
            ) : (
              <p className='text-muted-foreground text-sm'>Data đã dùng: —</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Topups applied to this eSIM (#026). Read from the snapshot each topup
          order stored, so a package that has since been withdrawn or repriced
          still reports what was actually bought. */}
      {esim.topups && esim.topups.length > 0 && (
        <Card className='md:col-span-2'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Icons.refresh className='h-4 w-4' />
              Gói đã Topup / Mua thêm data ({esim.topups.length})
            </CardTitle>
          </CardHeader>
          <CardContent className='grid gap-4 md:grid-cols-2'>
            {esim.topups.map((topup) => (
              <div key={topup.orderId} className='space-y-2 rounded-lg border p-3'>
                <div className='flex flex-wrap items-center justify-between gap-2'>
                  <span className='text-sm font-semibold'>
                    Gói Topup: {topup.packageName || topup.packageId || '—'}
                  </span>
                  <span className='text-sm font-semibold'>{formatVnd(topup.vndPrice)}</span>
                </div>
                <div className='text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-xs'>
                  <span>
                    Dung lượng: {topup.isUnlimited ? 'Không giới hạn' : topup.dataText || '—'}
                  </span>
                  <span>Thời hạn: {topup.durationDays ? `${topup.durationDays} ngày` : '—'}</span>
                  <span>Giá vốn: {formatVnd(topup.vndCostPrice)}</span>
                  {topup.provider && <span>NCC: {topup.provider}</span>}
                </div>
                <div className='text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-xs'>
                  <span>
                    Đơn:{' '}
                    <Link
                      href={`/dashboard/orders/${topup.orderId}`}
                      className='text-primary underline underline-offset-4'
                    >
                      {topup.orderNumber}
                    </Link>
                  </span>
                  <span>Ngày: {formatDate(topup.createdAt)}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Technical details, two columns (vande #022). */}
      <Card className='md:col-span-2'>
        <CardHeader>
          <CardTitle>Thông tin kỹ thuật</CardTitle>
        </CardHeader>
        <CardContent className='grid gap-4 md:grid-cols-2'>
          <div className='space-y-3' data-testid='esim-tech-left'>
            <InfoRow label='Tên gói cước' value={plan?.name} />
            <InfoRow
              label='SMDP Address'
              value={<span className='font-mono text-xs break-all'>{esim.smdpAddress}</span>}
            />
            <InfoRow
              label='Activation Code'
              value={<span className='font-mono text-xs break-all'>{esim.activationCode}</span>}
            />
            <InfoRow
              label='LPA'
              value={<span className='font-mono text-xs break-all'>{lpa}</span>}
            />
            <InfoRow label='APN' value={esim.apnValue || plan?.apn} />
            <InfoRow label='Vị trí IP' value={plan?.ipExport} />
            <InfoRow
              label='Điểm đến'
              value={
                plan?.destination ? (
                  <span className='flex items-center gap-2'>
                    {plan.destination.flagUrl && (
                      <img
                        src={plan.destination.flagUrl}
                        alt={plan.destination.name}
                        className='h-4 w-6 rounded object-cover'
                      />
                    )}
                    {plan.destination.name}
                    {plan.destination.countryCode ? ` (${plan.destination.countryCode})` : ''}
                  </span>
                ) : (
                  (plan?.region?.name ?? '—')
                )
              }
            />
            <InfoRow
              label='Nhà mạng'
              value={
                plan?.operatorName
                  ? `${plan.operatorName}${plan.speed ? ` (${plan.speed})` : ''}`
                  : plan?.speed
              }
            />
            <InfoRow label='Tốc độ sau khi hết data' value={plan?.fupSpeed} />
          </div>
          <div className='space-y-3' data-testid='esim-tech-right'>
            <InfoRow
              label='Tổng dung lượng'
              value={
                plan
                  ? plan.dataMb > 0
                    ? `${formatDataSize(plan.dataMb)}${isDailyPlan(plan) ? ' / ngày' : ''}`
                    : 'Không giới hạn'
                  : '—'
              }
            />
            <InfoRow label='Tổng phút gọi / SMS' value={callSmsSummary(plan) ?? 'Không'} />
            <InfoRow
              label='Tổng thời gian'
              value={
                esim.chosenDays && esim.chosenDays > 0
                  ? `${esim.chosenDays} ngày (khách chọn)`
                  : plan
                    ? `${plan.durationDays} ngày`
                    : '—'
              }
            />
            <InfoRow label='eKYC' value={<YesNo value={plan?.isKyc} />} />
            <InfoRow label='Hot-Spot Allow' value={plan?.hotSpotAllow} />
            <InfoRow
              label='Số điện thoại'
              value={esim.phoneNumber ? `Có: ${esim.phoneNumber}` : 'Không'}
            />
            <InfoRow label='Roaming' value={<YesNo value={isRoaming} testId='esim-roaming' />} />
            <InfoRow label='Thời gian làm mới mỗi ngày' value={dailyResetText(plan)} />
            <InfoRow label='Hỗ trợ dùng TikTok & AI' value={appSupportText(plan)} />
          </div>
        </CardContent>
      </Card>

      {/* User on the left, QR on the right (vande #022). */}
      <Card>
        <CardHeader>
          <CardTitle>Thông tin người dùng</CardTitle>
        </CardHeader>
        <CardContent className='space-y-3' data-testid='esim-user'>
          {esim.user ? (
            <>
              <InfoRow label='ID' value={esim.user.id} />
              {/* Template-stringing the two names printed "null null" for an
                  account with no name on it (#024). */}
              <InfoRow
                label='Họ tên'
                value={[esim.user.firstName, esim.user.lastName].filter(Boolean).join(' ')}
              />
              <InfoRow label='Email' value={esim.user.email} />
              <InfoRow label='Số điện thoại' value={esim.phoneNumber} />
              <InfoRow
                label='Trạng thái'
                value={
                  <Badge variant={esim.user.status?.name === 'active' ? 'default' : 'secondary'}>
                    {esim.user.status?.name}
                  </Badge>
                }
              />
            </>
          ) : (
            <p className='text-muted-foreground text-sm'>Chưa gắn người dùng.</p>
          )}
          {/* The phone the eSIM went onto: settles "scanned on the wrong phone"
              and "phone is locked" claims (vande #011, #022). */}
          <InfoRow
            label='EID thiết bị'
            value={
              esim.eid ? (
                <span className='flex items-center gap-1.5 font-mono text-xs break-all'>
                  {esim.eid}
                  <CopyButton value={esim.eid} label='Copy EID' />
                </span>
              ) : (
                '—'
              )
            }
          />
          <InfoRow label='Thiết bị' value={esim.deviceModel} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>QR Code cài đặt eSIM</CardTitle>
        </CardHeader>
        <CardContent className='flex flex-col items-center gap-4' data-testid='esim-qr'>
          {lpa ? (
            <>
              <div className='rounded-lg border bg-white p-4'>
                <QRCodeSVG
                  value={lpa}
                  size={200}
                  level='H'
                  imageSettings={esimQrLogoSettings(200)}
                />
              </div>
              <p className='text-muted-foreground max-w-md text-center text-xs'>
                Quét mã QR này bằng camera điện thoại để cài đặt eSIM.
              </p>
              {/* One-tap install links to send the customer (vande #022). */}
              <div className='w-full space-y-2'>
                {[
                  { label: 'Cài đặt nhanh iOS', href: iosLink, testId: 'esim-quick-ios' },
                  {
                    label: 'Cài đặt nhanh Android',
                    href: androidLink,
                    testId: 'esim-quick-android'
                  }
                ].map((link) => (
                  <div
                    key={link.label}
                    className='flex items-center justify-between gap-2 rounded-md border px-3 py-2'
                    data-testid={link.testId}
                  >
                    <a
                      href={link.href}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='text-primary truncate text-sm hover:underline'
                    >
                      {link.label}
                    </a>
                    <CopyButton value={link.href} label={`Copy link ${link.label}`} />
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className='text-muted-foreground text-sm'>Chưa có LPA để tạo mã QR.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function EsimDetailSkeleton() {
  return (
    <div className='grid animate-pulse gap-6 md:grid-cols-2'>
      <div className='bg-muted h-24 rounded-lg md:col-span-2' />
      <div className='bg-muted h-72 rounded-lg md:col-span-2' />
      <div className='bg-muted h-64 rounded-lg md:col-span-2' />
      <div className='bg-muted h-64 rounded-lg' />
      <div className='bg-muted h-64 rounded-lg' />
    </div>
  );
}
