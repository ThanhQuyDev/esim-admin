'use client';
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
                  Đăng ký {new Date(partner.createdAt).toLocaleDateString('vi-VN')}
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
