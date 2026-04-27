'use client';

import { useSuspenseQuery } from '@tanstack/react-query';
import { QRCodeSVG } from 'qrcode.react';
import { esimQueryOptions } from '../api/queries';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface EsimDetailViewProps {
  esimId: number;
}

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  available: 'outline',
  active: 'default',
  expired: 'destructive',
  deactivated: 'secondary'
};

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
  return new Date(date).toLocaleString('vi-VN');
}

export function EsimDetailView({ esimId }: EsimDetailViewProps) {
  const { data: esim } = useSuspenseQuery(esimQueryOptions(esimId));

  return (
    <div className='grid gap-6 md:grid-cols-2'>
      {/* eSIM Info */}
      <Card className='md:col-span-2'>
        <CardHeader>
          <CardTitle className='flex items-center gap-3'>
            Thông tin eSIM
            <Badge variant={statusVariant[esim.status] ?? 'outline'}>{esim.status}</Badge>
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

      {/* QR Code from LPA */}
      {esim.lpa && (
        <Card className='md:col-span-2'>
          <CardHeader>
            <CardTitle>QR Code cài đặt eSIM</CardTitle>
          </CardHeader>
          <CardContent className='flex flex-col items-center gap-4'>
            <div className='rounded-lg border bg-white p-4'>
              <QRCodeSVG value={esim.lpa} size={200} level='M' />
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
            <InfoRow label='Họ tên' value={`${esim.user.firstName} ${esim.user.lastName}`} />
            <InfoRow label='Email' value={esim.user.email} />
            <InfoRow label='Provider' value={esim.user.provider} />
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

      {/* Plan Info */}
      {esim.plan && (
        <Card>
          <CardHeader>
            <CardTitle>Gói eSIM</CardTitle>
          </CardHeader>
          <CardContent className='space-y-3'>
            <InfoRow label='Tên gói' value={esim.plan.name} />
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
