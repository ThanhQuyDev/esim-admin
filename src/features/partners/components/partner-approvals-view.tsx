'use client';
import { formatDateVn } from '@/lib/format';
import { useMutation, useQuery } from '@tanstack/react-query';
import { partnersQueryOptions } from '../api/queries';
import { approvePartnerMutation, rejectPartnerMutation } from '../api/mutations';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { toast } from 'sonner';
import { useState } from 'react';
import { RejectPartnerModal } from './reject-partner-modal';
import Link from 'next/link';

const PARTNER_TYPE_LABEL: Record<string, string> = {
  distribution: 'Đối tác phân phối',
  kol: 'KOL'
};

export function PartnerApprovalsView() {
  const [rejectingId, setRejectingId] = useState<number | null>(null);

  const { data, refetch, isLoading } = useQuery(
    partnersQueryOptions({ status: 'pending', limit: 50 })
  );

  /**
   * Approved partners who still have no tier (#095).
   *
   * The commission rate comes from the partner's tier, and `approve()` does not
   * set one — it only flips the status. A partner left without a tier earns
   * **zero on every order**, silently: the backend skips the commission row
   * entirely, so nothing shows up in reconciliation and the partner just sees
   * "this order earned no commission" over and over. The brief asks for the
   * rate to be set as part of approving; until that flow exists, at least the
   * broken state is visible where an admin will see it.
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
          <p className='flex items-center gap-2 text-sm font-medium'>
            <Icons.warning className='h-4 w-4 text-amber-600' />
            {missingTier.length} đối tác đã duyệt nhưng chưa gán hạng
          </p>
          <p className='text-muted-foreground mt-1 text-sm'>
            Chưa có hạng thì mức hoa hồng bằng 0 — đơn hàng của họ không phát sinh hoa hồng nào cả.
            Bấm vào tên để gán hạng.
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

      {isLoading ? (
        <div className='flex justify-center py-12'>
          <Icons.spinner className='h-6 w-6 animate-spin' />
        </div>
      ) : partners.length === 0 ? (
        <p className='text-muted-foreground py-12 text-center text-sm'>
          Không có đăng ký nào đang chờ duyệt.
        </p>
      ) : (
        <div className='space-y-3'>
          {partners.map((partner) => (
            <div
              key={partner.id}
              className='flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4'
            >
              <div>
                <div className='flex items-center gap-2'>
                  <Link
                    href={`/dashboard/partners/${partner.id}`}
                    className='font-medium hover:underline'
                  >
                    {partner.companyName || partner.contactName}
                  </Link>
                  <Badge variant='outline'>{PARTNER_TYPE_LABEL[partner.partnerType]}</Badge>
                </div>
                <p className='text-muted-foreground text-sm'>
                  {partner.contactEmail} · {partner.contactPhone}
                </p>
                <p className='text-muted-foreground text-xs'>
                  Đăng ký {formatDateVn(partner.createdAt)}
                </p>
              </div>
              <div className='flex gap-2'>
                <Button
                  size='sm'
                  onClick={() => approveMutation.mutate(partner.id)}
                  isLoading={approveMutation.isPending}
                >
                  <Icons.check className='mr-2 h-4 w-4' /> Duyệt
                </Button>
                <Button size='sm' variant='destructive' onClick={() => setRejectingId(partner.id)}>
                  <Icons.close className='mr-2 h-4 w-4' /> Từ chối
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
