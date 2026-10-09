'use client';

import { useState } from 'react';
import { esimQrLogoSettings } from '../lib/esim-qr';
import { AdminTopupDialog } from './admin-topup-dialog';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { esimStatusLabel, esimStatusVariant } from '../lib/esim-status';
import { formatDateTimeVn, formatVnd } from '@/lib/format';
import Link from 'next/link';
import { useSuspenseQuery } from '@tanstack/react-query';
import { QRCodeSVG } from 'qrcode.react';
import { esimQueryOptions } from '../api/queries';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { callSmsSummary, planDisplayName } from '@/features/plans/utils/plan-label';

interface EsimDetailViewProps {
  esimId: number;
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className='flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4'>
      <span className='text-muted-foreground w-44 shrink-0 text-sm font-medium'>{label}</span>
      <span className='text-sm'>{value || '—'}</span>
    </div>
  );
}

function formatDate(date: string | null | undefined) {
  if (!date) return '—';
  return formatDateTimeVn(date);
}

export function EsimDetailView({ esimId }: EsimDetailViewProps) {
  const { data: esim } = useSuspenseQuery(esimQueryOptions(esimId));
  const [topupOpen, setTopupOpen] = useState(false);

  return (
    <div className='grid gap-6 md:grid-cols-2'>
      {/* eSIM Info */}
      <Card className='md:col-span-2'>
        <CardHeader>
          <CardTitle className='flex items-center gap-3'>
            Thông tin eSIM
            <Badge variant={esimStatusVariant(esim.lifecycleStatus ?? esim.status)}>
              {esimStatusLabel(esim.lifecycleStatus ?? esim.status)}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className='grid gap-4 md:grid-cols-2'>
          <div className='space-y-3'>
            <InfoRow label='ID' value={esim.id} />
            <InfoRow
              label='ICCID'
              value={<span className='font-mono text-xs'>{esim.iccid}</span>}
            />
            <InfoRow label='Nhà cung cấp' value={esim.provider} />
            <InfoRow label='Số điện thoại' value={esim.phoneNumber} />
            <InfoRow label='eSIM Tran No' value={esim.esimTranNo} />
            <InfoRow label='APN' value={esim.apnValue} />
          </div>
          <div className='space-y-3'>
            <InfoRow label='Dữ liệu' value={`${esim.dataUsed} / ${esim.dataTotal}`} />
            <InfoRow
              label='Roaming'
              value={
                <Badge variant={esim.isRoaming ? 'default' : 'secondary'}>
                  {esim.isRoaming ? 'Có' : 'Không'}
                </Badge>
              }
            />
            <InfoRow label='Kích hoạt lúc' value={formatDate(esim.activatedAt)} />
            <InfoRow label='Hết hạn lúc' value={formatDate(esim.expiresAt)} />
            <InfoRow label='Ngày tạo' value={formatDate(esim.createdAt)} />
            <InfoRow label='Cập nhật lúc' value={formatDate(esim.updatedAt)} />
          </div>
        </CardContent>
      </Card>

      {/* Admin actions */}
      {esim.iccid && (
        <Card className='md:col-span-2'>
          <CardHeader>
            <CardTitle>Thao tác quản trị</CardTitle>
          </CardHeader>
          <CardContent className='flex flex-wrap items-center gap-3'>
            <Button variant='outline' onClick={() => setTopupOpen(true)}>
              <Icons.wallet className='mr-2 h-4 w-4' />
              Topup hộ khách
            </Button>
            <span className='text-muted-foreground text-xs'>
              Nạp thêm dung lượng cho khách mà không qua cổng thanh toán.
            </span>
          </CardContent>
        </Card>
      )}

      <AdminTopupDialog iccid={esim.iccid} open={topupOpen} onOpenChange={setTopupOpen} />

      {/* QR Code from LPA */}
      {esim.lpa && (
        <Card className='md:col-span-2'>
          <CardHeader>
            <CardTitle>QR Code cài đặt eSIM</CardTitle>
          </CardHeader>
          <CardContent className='flex flex-col items-center gap-4'>
            <div className='rounded-lg border bg-white p-4'>
              <QRCodeSVG
                value={esim.lpa}
                size={200}
                level='H'
                imageSettings={esimQrLogoSettings(200)}
              />
            </div>
            <p className='text-muted-foreground max-w-md text-center text-xs'>
              Quét mã QR này bằng camera điện thoại để cài đặt eSIM. Mã được tạo từ LPA:{' '}
              <span className='font-mono'>{esim.lpa}</span>
            </p>
          </CardContent>
        </Card>
      )}

      {/* Technical Details */}
      <Card className='md:col-span-2'>
        <CardHeader>
          <CardTitle>Thông tin kỹ thuật</CardTitle>
        </CardHeader>
        <CardContent className='space-y-3'>
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
            value={<span className='font-mono text-xs break-all'>{esim.lpa}</span>}
          />
          <InfoRow
            label='Match ID'
            value={<span className='font-mono text-xs break-all'>{esim.matchId}</span>}
          />
          {esim.directAppleInstallationUrl && (
            <InfoRow
              label='Apple Install URL'
              value={
                <a
                  href={esim.directAppleInstallationUrl}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='text-primary underline break-all text-xs'
                >
                  {esim.directAppleInstallationUrl}
                </a>
              }
            />
          )}
        </CardContent>
      </Card>

      {/* User Info */}
      {esim.user && (
        <Card>
          <CardHeader>
            <CardTitle>Người dùng</CardTitle>
          </CardHeader>
          <CardContent className='space-y-3'>
            <InfoRow label='ID' value={esim.user.id} />
            {/* Template-stringing the two names printed "null null" for an
                account with no name on it (#024). */}
            <InfoRow
              label='Họ tên'
              value={[esim.user.firstName, esim.user.lastName].filter(Boolean).join(' ')}
            />
            <InfoRow label='Email' value={esim.user.email} />
            {/* Was "Provider", which showed the sign-in method (email / google)
                and read as if it were the eSIM's supplier. The useful field here
                is the eSIM's own phone number (#024). */}
            <InfoRow label='Số điện thoại' value={esim.phoneNumber} />
            <InfoRow
              label='Vai trò'
              value={<Badge variant='outline'>{esim.user.role?.name}</Badge>}
            />
            <InfoRow
              label='Trạng thái'
              value={
                <Badge variant={esim.user.status?.name === 'active' ? 'default' : 'secondary'}>
                  {esim.user.status?.name}
                </Badge>
              }
            />
          </CardContent>
        </Card>
      )}

      {/* Topups applied to this eSIM (#026). Read from the snapshot each topup
          order stored, so a package that has since been withdrawn or repriced
          still reports what was actually bought. */}
      {esim.topups && esim.topups.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Icons.refresh className='h-4 w-4' />
              Gói đã Topup ({esim.topups.length})
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
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

      {/* Plan Info */}
      {esim.plan && (
        <Card>
          <CardHeader>
            <CardTitle>Gói eSIM</CardTitle>
          </CardHeader>
          <CardContent className='space-y-3'>
            <InfoRow label='Tên gói' value={planDisplayName(esim.plan)} />
            <InfoRow
              label='Phút gọi / SMS'
              value={callSmsSummary(esim.plan) ?? 'Không (chỉ data)'}
            />
            <InfoRow label='Nhà cung cấp' value={esim.plan.provider} />
            <InfoRow label='Provider Plan ID' value={esim.plan.providerPlanId} />
            {esim.plan.destination && (
              <>
                <Separator />
                <InfoRow
                  label='Điểm đến'
                  value={
                    <span className='flex items-center gap-2'>
                      {esim.plan.destination.flagUrl && (
                        <img
                          src={esim.plan.destination.flagUrl}
                          alt={esim.plan.destination.name}
                          className='h-4 w-6 rounded object-cover'
                        />
                      )}
                      {esim.plan.destination.name}
                    </span>
                  }
                />
                <InfoRow label='Mã quốc gia' value={esim.plan.destination.countryCode} />
              </>
            )}
            <Separator />
            <InfoRow label='Dung lượng' value={`${esim.plan.dataMb} MB`} />
            <InfoRow label='Thời hạn' value={`${esim.plan.durationDays} ngày`} />
            <InfoRow label='Tốc độ' value={esim.plan.speed} />
            <InfoRow label='Nhà mạng' value={esim.plan.operatorName} />
            <InfoRow label='Loại' value={esim.plan.type} />
            <InfoRow
              label='Top-up'
              value={
                <Badge variant={esim.plan.topUp ? 'default' : 'secondary'}>
                  {esim.plan.topUp ? 'Có' : 'Không'}
                </Badge>
              }
            />
            <Separator />
            <InfoRow label='Giá gốc' value={`${esim.plan.costPrice} ${esim.plan.currency}`} />
            <InfoRow label='Giá bán' value={`${esim.plan.price} ${esim.plan.currency}`} />
            <InfoRow label='Giá lẻ' value={`${esim.plan.retailPrice} ${esim.plan.currency}`} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export function EsimDetailSkeleton() {
  return (
    <div className='grid animate-pulse gap-6 md:grid-cols-2'>
      <div className='bg-muted h-72 rounded-lg md:col-span-2' />
      <div className='bg-muted h-72 rounded-lg md:col-span-2' />
      <div className='bg-muted h-64 rounded-lg' />
      <div className='bg-muted h-64 rounded-lg' />
    </div>
  );
}
