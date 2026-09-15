'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Icons } from '@/components/icons';
import { formatDate, formatVnd } from '@/lib/format';
import { PROVIDER_LABELS } from '@/features/overview/api/constants';
import { providerDepositEntriesQueryOptions } from '../api/queries';
import { deleteProviderDepositEntryMutation } from '../api/mutations';
import { ENTRY_TYPE_OPTIONS } from '../api/types';

const TYPE_LABELS = Object.fromEntries(ENTRY_TYPE_OPTIONS.map((o) => [o.value, o.label]));

interface ProviderDepositEntriesDialogProps {
  provider: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Every hand-entered movement for one supplier, newest first. */
export function ProviderDepositEntriesDialog({
  provider,
  open,
  onOpenChange
}: ProviderDepositEntriesDialogProps) {
  const { data, isLoading } = useQuery(
    providerDepositEntriesQueryOptions({ provider, limit: 100 })
  );

  const remove = useMutation({
    ...deleteProviderDepositEntryMutation,
    onSuccess: () => toast.success('Đã xoá bản ghi.'),
    onError: (e) => toast.error(e.message || 'Không xoá được')
  });

  const entries = data?.data ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-3xl'>
        <DialogHeader>
          <DialogTitle>Lịch sử ký quỹ — {PROVIDER_LABELS[provider] ?? provider}</DialogTitle>
          <DialogDescription>
            Chỉ gồm các bản ghi nhập tay. Tiền đã dùng lấy tự động từ đơn hàng nên không nằm trong
            danh sách này.
          </DialogDescription>
        </DialogHeader>

        <div className='max-h-[60vh] overflow-auto'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Thời điểm</TableHead>
                <TableHead>Loại</TableHead>
                <TableHead className='text-right'>Số tiền</TableHead>
                <TableHead className='text-right'>Nhà cung cấp báo</TableHead>
                <TableHead>Ghi chú</TableHead>
                <TableHead className='w-10' />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className='py-8 text-center'>
                    Đang tải…
                  </TableCell>
                </TableRow>
              ) : entries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className='text-muted-foreground py-8 text-center'>
                    Chưa có bản ghi nào.
                  </TableCell>
                </TableRow>
              ) : (
                entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className='whitespace-nowrap'>
                      {formatDate(entry.occurredAt)}
                    </TableCell>
                    <TableCell>
                      <Badge variant='secondary'>{TYPE_LABELS[entry.type] ?? entry.type}</Badge>
                    </TableCell>
                    <TableCell className='text-right font-mono'>
                      {entry.type === 'reconciliation' ? '—' : formatVnd(Number(entry.amountVnd))}
                    </TableCell>
                    <TableCell className='text-right font-mono'>
                      {entry.reportedBalanceVnd === null
                        ? '—'
                        : formatVnd(Number(entry.reportedBalanceVnd))}
                    </TableCell>
                    <TableCell className='text-muted-foreground max-w-xs text-sm'>
                      <span className='line-clamp-2'>{entry.note ?? '—'}</span>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant='ghost'
                        size='icon'
                        disabled={remove.isPending}
                        onClick={() => remove.mutate(entry.id)}
                        aria-label='Xoá bản ghi'
                      >
                        <Icons.trash className='h-4 w-4' />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
