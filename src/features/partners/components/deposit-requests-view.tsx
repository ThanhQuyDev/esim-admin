'use client';

/**
 * "Yêu cầu nạp ký quỹ" as a list (doitac-1410 #063): who asked — by name and
 * ID, a company by its own name — the code, the amount, the fee, what reaches
 * the wallet, how it was paid, when, and where it stands.
 *
 * "Xác nhận đã nhận tiền" credits the wallet; "Từ chối" needs a reason, which
 * the partner reads in their deposit history, and credits nothing. Neither can
 * be undone, so both ask first.
 */

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Textarea } from '@/components/ui/textarea';
import { Icons } from '@/components/icons';
import { formatDateTimeVn, formatVnd } from '@/lib/format';

import { partnerKeys, depositRequestsQueryOptions } from '../api/queries';
import { confirmDepositRequest, rejectDepositRequest } from '../api/service';
import type { PartnerDepositRequest } from '../api/types';

const STATUS_FILTERS = [
  { value: 'all', label: 'Tất cả trạng thái' },
  { value: 'pending', label: 'Chờ xác nhận' },
  { value: 'confirmed', label: 'Đã xác nhận' },
  { value: 'rejected', label: 'Từ chối' }
];

const STATUS: Record<string, { label: string; className: string }> = {
  pending: {
    label: 'Chờ xác nhận',
    className:
      'border-orange-200 bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300'
  },
  confirmed: {
    label: 'Đã xác nhận',
    className:
      'border-emerald-200 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
  },
  rejected: {
    label: 'Từ chối',
    className: 'border-red-200 bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
  },
  cancelled: {
    label: 'Đã huỷ',
    className: 'border-gray-200 bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300'
  }
};

const METHOD_LABEL: Record<string, string> = {
  bank_transfer: 'Chuyển khoản',
  card: 'Thẻ tín dụng'
};

export function DepositRequestsView() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('pending');
  const [confirming, setConfirming] = useState<PartnerDepositRequest | null>(null);
  const [rejecting, setRejecting] = useState<PartnerDepositRequest | null>(null);
  const [reason, setReason] = useState('');

  const queryClient = useQueryClient();
  const { data: requests = [], isLoading } = useQuery(
    depositRequestsQueryOptions(status === 'all' ? undefined : status, search.trim() || undefined)
  );

  const refresh = () => void queryClient.invalidateQueries({ queryKey: partnerKeys.all });

  const confirm = useMutation({
    mutationFn: (id: number) => confirmDepositRequest(id),
    onSuccess: () => {
      toast.success('Đã xác nhận và cộng tiền vào ví đối tác.');
      setConfirming(null);
      refresh();
    },
    onError: (e: Error) => toast.error(e.message || 'Xác nhận thất bại')
  });

  const reject = useMutation({
    mutationFn: ({ id, text }: { id: number; text: string }) => rejectDepositRequest(id, text),
    onSuccess: () => {
      toast.success('Đã từ chối yêu cầu nạp tiền.');
      setRejecting(null);
      setReason('');
      refresh();
    },
    onError: (e: Error) => toast.error(e.message || 'Từ chối thất bại')
  });

  return (
    <div className='grid min-w-0 grid-cols-1 gap-4'>
      <div className='flex flex-wrap items-center gap-2'>
        <Input
          placeholder='Tìm tên, ID, email đối tác hoặc mã đối chiếu'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className='w-full sm:w-[340px]'
          data-testid='deposit-search'
        />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger
            className='w-full sm:w-[200px]'
            aria-label='Trạng thái'
            data-testid='deposit-status'
          >
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
      ) : (
        <div className='overflow-x-auto rounded-lg border' data-testid='deposit-rows'>
          <Table>
            <TableHeader className='bg-muted'>
              <TableRow>
                <TableHead>Tên đối tác</TableHead>
                <TableHead>Mã đối chiếu</TableHead>
                <TableHead className='text-right'>Số tiền nạp</TableHead>
                <TableHead className='text-right'>Phí nạp tiền</TableHead>
                <TableHead className='text-right'>Cộng vào ví</TableHead>
                <TableHead>Hình thức nạp</TableHead>
                <TableHead>Ngày giờ tạo</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className='text-right'>Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className='text-muted-foreground h-24 text-center'>
                    Không có yêu cầu nạp ký quỹ nào khớp bộ lọc.
                  </TableCell>
                </TableRow>
              )}
              {requests.map((req) => {
                const badge = STATUS[req.status] ?? { label: req.status, className: '' };
                return (
                  <TableRow key={req.id}>
                    <TableCell>
                      <Link
                        href={`/dashboard/partners/${req.partnerId}`}
                        className='text-sm font-medium hover:underline'
                      >
                        {req.partnerName ?? req.contactName ?? `Đối tác ${req.partnerId}`}
                      </Link>
                      <div className='text-muted-foreground text-xs'>
                        ID {req.partnerId}
                        {req.contactEmail ? ` · ${req.contactEmail}` : ''}
                      </div>
                    </TableCell>
                    <TableCell className='font-mono text-xs'>{req.bankTransferCode}</TableCell>
                    <TableCell className='text-right font-medium tabular-nums'>
                      {formatVnd(Number(req.amountVnd))}
                    </TableCell>
                    <TableCell className='text-right tabular-nums'>
                      {Number(req.feeVnd ?? 0) > 0 ? formatVnd(Number(req.feeVnd)) : '—'}
                    </TableCell>
                    <TableCell className='text-right font-medium tabular-nums'>
                      {formatVnd(Number(req.creditedVnd ?? req.amountVnd))}
                    </TableCell>
                    <TableCell className='text-sm whitespace-nowrap'>
                      {METHOD_LABEL[req.method ?? 'bank_transfer'] ?? req.method}
                    </TableCell>
                    <TableCell className='text-sm whitespace-nowrap'>
                      {formatDateTimeVn(req.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Badge variant='outline' className={badge.className}>
                        {badge.label}
                      </Badge>
                      {req.status === 'rejected' && req.rejectionReason && (
                        <div className='text-muted-foreground mt-1 max-w-[220px] text-xs'>
                          {req.rejectionReason}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className='text-right'>
                      {req.status === 'pending' ? (
                        <div className='flex justify-end gap-2'>
                          <Button size='sm' onClick={() => setConfirming(req)}>
                            <Icons.check className='mr-1 h-4 w-4' /> Xác nhận đã nhận tiền
                          </Button>
                          <Button
                            size='sm'
                            variant='outline'
                            className='text-destructive'
                            onClick={() => {
                              setReason('');
                              setRejecting(req);
                            }}
                          >
                            Từ chối
                          </Button>
                        </div>
                      ) : (
                        <span className='text-muted-foreground text-xs'>Đã xử lý</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {confirming && (
        <Dialog open onOpenChange={(open) => !open && setConfirming(null)}>
          <DialogContent className='sm:max-w-md'>
            <DialogHeader>
              <DialogTitle>Xác nhận đã nhận tiền?</DialogTitle>
              <DialogDescription>
                Hệ thống cộng {formatVnd(Number(confirming.creditedVnd ?? confirming.amountVnd))}{' '}
                vào ví của {confirming.partnerName ?? `đối tác ${confirming.partnerId}`} (mã{' '}
                {confirming.bankTransferCode}). Thao tác này không thể hoàn tác.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant='outline' onClick={() => setConfirming(null)}>
                Hủy
              </Button>
              <Button disabled={confirm.isPending} onClick={() => confirm.mutate(confirming.id)}>
                {confirm.isPending ? 'Đang xác nhận…' : 'Xác nhận'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {rejecting && (
        <Dialog open onOpenChange={(open) => !open && setRejecting(null)}>
          <DialogContent className='sm:max-w-md'>
            <DialogHeader>
              <DialogTitle>Từ chối yêu cầu nạp tiền</DialogTitle>
              <DialogDescription>
                {rejecting.partnerName ?? `Đối tác ${rejecting.partnerId}`} ·{' '}
                {formatVnd(Number(rejecting.amountVnd))} · mã {rejecting.bankTransferCode}. Không
                cộng tiền vào ví và không thể hoàn tác.
              </DialogDescription>
            </DialogHeader>
            <div className='space-y-2'>
              <Label htmlFor='deposit-reject-reason'>Lý do từ chối (đối tác nhìn thấy)</Label>
              <Textarea
                id='deposit-reject-reason'
                rows={3}
                maxLength={500}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder='Ví dụ: Không nhận được tiền chuyển khoản với mã đối chiếu này'
              />
            </div>
            <DialogFooter>
              <Button variant='outline' onClick={() => setRejecting(null)}>
                Hủy
              </Button>
              <Button
                variant='destructive'
                disabled={reject.isPending || reason.trim().length < 5}
                onClick={() => reject.mutate({ id: rejecting.id, text: reason.trim() })}
              >
                {reject.isPending ? 'Đang từ chối…' : 'Từ chối'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
