'use client';

import { formatDateVn } from '@/lib/format';
import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Icons } from '@/components/icons';

import { myProfileQueryOptions, myTicketsQueryOptions } from '../api/queries';
import { createTicketMutation } from '../api/mutations';

const STATUS_LABEL: Record<string, string> = {
  open: 'Đang mở',
  pending: 'Chờ xử lý',
  in_progress: 'Đang xử lý',
  resolved: 'Đã xử lý',
  closed: 'Đã đóng'
};

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'outline'> = {
  open: 'secondary',
  pending: 'secondary',
  in_progress: 'secondary',
  resolved: 'default',
  closed: 'outline'
};

export function PortalSupportView() {
  const { data: partner } = useQuery(myProfileQueryOptions());
  const { data: tickets, isLoading } = useQuery(myTicketsQueryOptions());
  const create = useMutation(createTicketMutation);

  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [orderId, setOrderId] = useState('');

  const submit = () => {
    if (!partner?.contactEmail) {
      toast.error('Không xác định được email liên hệ của bạn.');
      return;
    }
    if (!subject.trim() || !description.trim()) {
      toast.error('Vui lòng nhập chủ đề và nội dung.');
      return;
    }
    create.mutate(
      {
        customerEmail: partner.contactEmail,
        subject: subject.trim(),
        description: description.trim(),
        ...(orderId.trim() ? { orderId: orderId.trim() } : {})
      },
      {
        onSuccess: () => {
          toast.success('Đã gửi yêu cầu hỗ trợ.');
          setOpen(false);
          setSubject('');
          setDescription('');
          setOrderId('');
        },
        onError: (e: Error) => toast.error(e.message || 'Gửi yêu cầu thất bại')
      }
    );
  };

  return (
    <div className='space-y-4'>
      <div className='flex justify-end'>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Icons.add className='mr-2 h-4 w-4' />
              Gửi yêu cầu hỗ trợ
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Gửi yêu cầu hỗ trợ</DialogTitle>
            </DialogHeader>
            <div className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='ticket-subject'>Chủ đề *</Label>
                <Input
                  id='ticket-subject'
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder='VD: Hoa hồng đơn hàng chưa được cộng'
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='ticket-order'>Mã đơn liên quan</Label>
                <Input
                  id='ticket-order'
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  placeholder='Không bắt buộc'
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='ticket-description'>Nội dung *</Label>
                <Textarea
                  id='ticket-description'
                  rows={5}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder='Mô tả chi tiết vấn đề bạn gặp phải.'
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant='outline' onClick={() => setOpen(false)}>
                Hủy
              </Button>
              <Button onClick={submit} disabled={create.isPending}>
                {create.isPending ? 'Đang gửi…' : 'Gửi yêu cầu'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className='flex justify-center py-12'>
          <Icons.spinner className='h-6 w-6 animate-spin' />
        </div>
      ) : (tickets ?? []).length === 0 ? (
        <p className='text-muted-foreground py-12 text-center text-sm'>
          Bạn chưa gửi yêu cầu hỗ trợ nào.
        </p>
      ) : (
        <div className='space-y-2'>
          {(tickets ?? []).map((t) => (
            <div key={t.id} className='rounded-lg border p-3'>
              <div className='flex flex-wrap items-start justify-between gap-2'>
                <div className='min-w-0'>
                  <p className='text-sm font-medium'>{t.subject}</p>
                  <p className='text-muted-foreground mt-1 text-xs'>
                    #{t.id} · {formatDateVn(t.createdAt)}
                    {t.orderId ? ` · đơn ${t.orderId}` : ''}
                  </p>
                </div>
                <Badge variant={STATUS_VARIANT[t.status] ?? 'outline'}>
                  {STATUS_LABEL[t.status] ?? t.status}
                </Badge>
              </div>
              <p className='text-muted-foreground mt-2 line-clamp-3 text-xs whitespace-pre-wrap'>
                {t.description}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
