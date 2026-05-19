'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { notFound } from 'next/navigation';
import { AlertModal } from '@/components/modal/alert-modal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Icons } from '@/components/icons';
import { ticketByIdQueryOptions } from '../api/queries';
import { deleteTicketMutation } from '../api/mutations';
import { ChangeStatusDropdown } from './change-status-dropdown';
import { StatusTag } from './status-tag';
import { SafeHtml } from './safe-html';
import { AttachmentsGrid } from './attachments-grid';
import type { Ticket } from '../api/types';

function formatDateTime(value: string) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(d);
}

interface TicketDetailViewProps {
  id: number;
}

export function TicketDetailView({ id }: TicketDetailViewProps) {
  const { data } = useSuspenseQuery(ticketByIdQueryOptions(id));
  if (!data) notFound();
  return <TicketDetailContent ticket={data} />;
}

function TicketDetailContent({ ticket }: { ticket: Ticket }) {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const deleteMutation = useMutation({
    ...deleteTicketMutation,
    onSuccess: () => {
      toast.success('Đã xóa ticket');
      router.push('/dashboard/tickets');
    },
    onError: (e) => toast.error(e.message || 'Xóa thất bại')
  });

  return (
    <div className='flex flex-col gap-6'>
      <AlertModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => deleteMutation.mutate(ticket.id)}
        loading={deleteMutation.isPending}
      />

      <div className='flex flex-wrap items-start justify-between gap-4'>
        <div className='flex items-start gap-3'>
          <Button asChild variant='outline' size='icon' className='mt-0.5'>
            <Link href='/dashboard/tickets' aria-label='Quay lại'>
              <Icons.chevronLeft className='h-4 w-4' />
            </Link>
          </Button>
          <div className='space-y-1'>
            <div className='flex items-center gap-2'>
              <span className='text-muted-foreground font-mono text-sm'>#{ticket.id}</span>
              <StatusTag status={ticket.status} />
            </div>
            <h1 className='text-xl font-semibold leading-tight break-words'>{ticket.subject}</h1>
          </div>
        </div>
        <div className='flex flex-wrap items-center gap-2'>
          <ChangeStatusDropdown id={ticket.id} status={ticket.status} />
          <Button variant='destructive' size='sm' onClick={() => setDeleteOpen(true)}>
            <Icons.trash className='mr-2 h-4 w-4' /> Xóa
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className='text-base'>Thông tin</CardTitle>
        </CardHeader>
        <CardContent className='grid gap-x-8 gap-y-4 sm:grid-cols-2'>
          <InfoField label='Email khách hàng'>
            <a href={`mailto:${ticket.customerEmail}`} className='text-primary hover:underline'>
              {ticket.customerEmail}
            </a>
          </InfoField>
          <InfoField label='Mã đơn hàng'>
            {ticket.orderId ? (
              <Link
                href={`/dashboard/orders/${ticket.orderId}`}
                className='text-primary inline-flex items-center gap-1 font-mono hover:underline'
              >
                {ticket.orderId}
                <Icons.externalLink className='h-3 w-3' />
              </Link>
            ) : (
              <Empty />
            )}
          </InfoField>
          <InfoField label='Thiết bị'>
            {ticket.deviceModel ? <span>{ticket.deviceModel}</span> : <Empty />}
          </InfoField>
          <InfoField label='ICCID'>
            {ticket.iccid ? <span className='font-mono text-sm'>{ticket.iccid}</span> : <Empty />}
          </InfoField>
          <InfoField label='Điểm đến gói cước'>
            {ticket.planDestination ? <span>{ticket.planDestination}</span> : <Empty />}
          </InfoField>
          <InfoField label='Thời gian'>
            <div className='space-y-0.5 text-sm'>
              <div>
                <span className='text-muted-foreground'>Tạo:</span>{' '}
                <span className='tabular-nums'>{formatDateTime(ticket.createdAt)}</span>
              </div>
              <div>
                <span className='text-muted-foreground'>Cập nhật:</span>{' '}
                <span className='tabular-nums'>{formatDateTime(ticket.updatedAt)}</span>
              </div>
            </div>
          </InfoField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className='text-base'>Mô tả</CardTitle>
        </CardHeader>
        <CardContent>
          {ticket.description ? (
            <SafeHtml html={ticket.description} />
          ) : (
            <p className='text-muted-foreground text-sm'>Không có mô tả.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className='text-base'>Tệp đính kèm</CardTitle>
        </CardHeader>
        <CardContent>
          <AttachmentsGrid attachments={ticket.attachments} />
        </CardContent>
      </Card>

      <Separator />

      <div className='flex flex-wrap items-center justify-end gap-2'>
        <ChangeStatusDropdown id={ticket.id} status={ticket.status} />
        <Button variant='destructive' size='sm' onClick={() => setDeleteOpen(true)}>
          <Icons.trash className='mr-2 h-4 w-4' /> Xóa ticket
        </Button>
      </div>
    </div>
  );
}

function InfoField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className='space-y-1'>
      <div className='text-muted-foreground text-xs font-medium uppercase tracking-wide'>
        {label}
      </div>
      <div className='text-sm break-words'>{children}</div>
    </div>
  );
}

function Empty() {
  return <span className='text-muted-foreground'>—</span>;
}

export function TicketDetailSkeleton() {
  return (
    <div className='flex flex-col gap-6'>
      <div className='flex items-start justify-between gap-4'>
        <div className='space-y-2'>
          <Skeleton className='h-4 w-24' />
          <Skeleton className='h-7 w-80' />
        </div>
        <Skeleton className='h-9 w-40' />
      </div>
      <Skeleton className='h-48 w-full' />
      <Skeleton className='h-40 w-full' />
      <Skeleton className='h-32 w-full' />
    </div>
  );
}
