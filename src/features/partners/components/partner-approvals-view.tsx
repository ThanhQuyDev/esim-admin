'use client';

/**
 * "Duyệt đối tác" — applications waiting on a decision (#055, #056).
 *
 * Not only the pending ones: an admin comes here to find a particular applicant
 * as often as to work the queue, and a rejection is not a dead end — the
 * applicant sends the missing paper and the same screen has to approve them. So
 * the status filter offers all three states, and the row's actions follow what
 * the partner's state actually allows.
 */

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Icons } from '@/components/icons';
import { formatDateVn } from '@/lib/format';

import { approvePartnerMutation, rejectPartnerMutation } from '../api/mutations';
import { partnersQueryOptions } from '../api/queries';
import type { PartnerStatus, PartnerType } from '../api/types';
import { RejectPartnerModal } from './reject-partner-modal';

const PARTNER_TYPE_LABEL: Record<string, string> = {
  distribution: 'Đối tác phân phối',
  kol: 'KOL',
  api: 'Đối tác API'
};

/** Only the three states this screen is about (#055). */
const STATUS_LABEL: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }
> = {
  pending: { label: 'Đang chờ duyệt', variant: 'outline' },
  active: { label: 'Đã duyệt', variant: 'default' },
  rejected: { label: 'Bị từ chối', variant: 'destructive' },
  hold: { label: 'Tạm giữ', variant: 'secondary' },
  disabled: { label: 'Đã khoá', variant: 'secondary' }
};

const STATUS_FILTERS = [
  { value: 'pending', label: 'Đang chờ duyệt' },
  { value: 'rejected', label: 'Bị từ chối' },
  { value: 'active', label: 'Đã duyệt' },
  { value: 'all', label: 'Tất cả trạng thái' }
];

const TYPE_FILTERS = [
  { value: 'all', label: 'Tất cả loại đối tác' },
  { value: 'kol', label: 'KOL' },
  { value: 'distribution', label: 'Đối tác phân phối' }
];

/** The applicant's main sales channel, out of the free-form apply payload. */
function mainChannel(channelInfo: Record<string, unknown> | null): string {
  if (!channelInfo) return '—';
  const entries = Object.entries(channelInfo).filter(
    ([, value]) => typeof value === 'string' && value.trim()
  );
  if (entries.length === 0) return '—';
  const [key, value] = entries[0]!;
  return `${key}: ${String(value)}`;
}

export function PartnerApprovalsView() {
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<PartnerStatus | 'all'>('pending');
  const [partnerType, setPartnerType] = useState<PartnerType | 'all'>('all');

  const { data, refetch, isLoading } = useQuery(
    partnersQueryOptions({
      ...(status === 'all' ? {} : { status }),
      ...(partnerType === 'all' ? {} : { partnerType }),
      ...(search.trim() ? { search: search.trim() } : {}),
      limit: 50
    })
  );

  /**
   * Approved partners who still have no tier (#095).
   *
   * The commission rate comes from the partner's tier, and `approve()` does not
   * set one — it only flips the status. A partner left without a tier earns
   * **zero on every order**, silently: the backend skips the commission row
   * entirely, so nothing shows up in reconciliation and the partner just sees
   * "this order earned no commission" over and over.
   */
  const { data: activeData, refetch: refetchActive } = useQuery(
    partnersQueryOptions({ status: 'active', limit: 100 })
  );
  const missingTier = (activeData?.data ?? []).filter((p) => !p.tierCode);

  const approveMutation = useMutation({
    ...approvePartnerMutation,
    onSuccess: () => {
      // Approving is only half the job — say so, rather than letting the admin
      // walk away from a partner who cannot earn anything.
      toast.success('Đã duyệt đối tác. Nhớ gán hạng để đối tác bắt đầu có hoa hồng.');
      refetch();
      refetchActive();
    },
    onError: (e: Error) => toast.error(e.message || 'Duyệt thất bại')
  });

  const rejectMutation = useMutation({
    ...rejectPartnerMutation,
    onSuccess: () => {
      toast.success('Đã từ chối đối tác.');
      setRejectingId(null);
      refetch();
    },
    onError: (e: Error) => toast.error(e.message || 'Từ chối thất bại')
  });

  const partners = data?.data ?? [];

  return (
    <div className='space-y-4'>
      <RejectPartnerModal
        open={rejectingId !== null}
        onOpenChange={(open) => !open && setRejectingId(null)}
        onSubmit={(payload) =>
          rejectingId && rejectMutation.mutate({ id: rejectingId, data: payload })
        }
        isSubmitting={rejectMutation.isPending}
      />

      {missingTier.length > 0 && (
        <div
          className='rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/40'
          data-testid='partners-missing-tier'
        >
          <p className='text-sm font-medium'>
            {missingTier.length} đối tác đã duyệt nhưng chưa gán hạng
          </p>
          <p className='text-muted-foreground mt-1 text-xs'>
            Chưa có hạng thì mọi đơn của họ đều không phát sinh hoa hồng. Bấm vào tên để gán hạng.
          </p>
          <div className='mt-3 flex flex-wrap gap-2'>
            {missingTier.map((partner) => (
              <Link
                key={partner.id}
                href={`/dashboard/partners/${partner.id}`}
                className='bg-background rounded-md border px-2.5 py-1 text-sm hover:underline'
              >
                {partner.companyName || partner.contactName}
              </Link>
            ))}
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Hồ sơ đăng ký đối tác</CardTitle>
          <CardDescription>
            Tìm theo tên, email hoặc số điện thoại. Hồ sơ bị từ chối vẫn có thể duyệt lại bằng tay
            khi đối tác bổ sung giấy tờ.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex flex-wrap items-center gap-2'>
            <Input
              placeholder='Tìm tên, email hoặc số điện thoại'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className='max-w-[280px]'
            />
            <Select
              value={partnerType}
              onValueChange={(value) => setPartnerType(value as PartnerType | 'all')}
            >
              <SelectTrigger className='w-[200px]'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPE_FILTERS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={status}
              onValueChange={(value) => setStatus(value as PartnerStatus | 'all')}
            >
              <SelectTrigger className='w-[190px]'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_FILTERS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className='flex justify-center py-12'>
              <Icons.spinner className='h-6 w-6 animate-spin' />
            </div>
          ) : partners.length === 0 ? (
            <p className='text-muted-foreground py-12 text-center text-sm'>
              Không có hồ sơ nào khớp với bộ lọc này.
            </p>
          ) : (
            <div className='overflow-x-auto rounded-lg border'>
              <Table>
                <TableHeader className='bg-muted'>
                  <TableRow>
                    <TableHead>Tên</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Số điện thoại</TableHead>
                    <TableHead>Loại đối tác</TableHead>
                    <TableHead>Kênh bán chính</TableHead>
                    <TableHead>Ngày gửi đăng ký</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className='text-right'>Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {partners.map((partner) => {
                    const badge = STATUS_LABEL[partner.status] ?? {
                      label: partner.status,
                      variant: 'outline' as const
                    };
                    // A rejected application can still be approved by hand;
                    // one already approved has nothing left to decide (#056).
                    const canApprove =
                      partner.status === 'pending' || partner.status === 'rejected';
                    const canReject = partner.status === 'pending';

                    return (
                      <TableRow key={partner.id}>
                        <TableCell className='font-medium'>
                          {partner.companyName || partner.contactName}
                        </TableCell>
                        <TableCell className='text-xs'>{partner.contactEmail}</TableCell>
                        <TableCell className='text-xs'>{partner.contactPhone}</TableCell>
                        <TableCell>
                          <Badge variant='outline'>
                            {PARTNER_TYPE_LABEL[partner.partnerType] ?? partner.partnerType}
                          </Badge>
                        </TableCell>
                        <TableCell className='max-w-[220px] truncate text-xs'>
                          {mainChannel(partner.channelInfo)}
                        </TableCell>
                        <TableCell className='text-xs'>{formatDateVn(partner.createdAt)}</TableCell>
                        <TableCell>
                          <Badge variant={badge.variant}>{badge.label}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className='flex justify-end gap-2'>
                            <Button asChild size='sm' variant='outline'>
                              <Link href={`/dashboard/partners/${partner.id}`}>Xem</Link>
                            </Button>
                            {canApprove && (
                              <Button
                                size='sm'
                                onClick={() => approveMutation.mutate(partner.id)}
                                isLoading={approveMutation.isPending}
                              >
                                Duyệt
                              </Button>
                            )}
                            {canReject && (
                              <Button
                                size='sm'
                                variant='destructive'
                                onClick={() => setRejectingId(partner.id)}
                              >
                                Từ chối
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
