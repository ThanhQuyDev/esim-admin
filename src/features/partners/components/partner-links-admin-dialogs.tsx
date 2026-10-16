'use client';

/**
 * The two dialogs of the admin's "Tiếp thị liên kết" toolbar (doitac-1410
 * #053): "Thay đổi trạng thái" for the ticked links, and "Tạo link giúp đối
 * tác".
 */

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

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
import { Textarea } from '@/components/ui/textarea';
import { CHANNELS, buildTargetPath } from '@/features/partner-portal/components/portal-link-utils';

import { partnerKeys, partnersQueryOptions } from '../api/queries';
import { adminCreateLinkForPartner, bulkLinkStatus } from '../api/service';

export type BulkLinkAction = 'suspend' | 'unsuspend' | 'restore';

export const BULK_ACTION_LABEL: Record<BulkLinkAction, string> = {
  suspend: 'Đình chỉ',
  unsuspend: 'Gỡ đình chỉ',
  restore: 'Khôi phục'
};

/** "Thay đổi trạng thái" for the ticked links — the reason is required. */
export function BulkLinkStatusDialog({
  linkIds,
  open,
  onOpenChange,
  onDone
}: {
  linkIds: number[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone: () => void;
}) {
  const queryClient = useQueryClient();
  const [action, setAction] = useState<BulkLinkAction>('suspend');
  const [reason, setReason] = useState('');

  const run = useMutation({
    mutationFn: () => bulkLinkStatus({ linkIds, action, reason: reason.trim() }),
    onSuccess: (result) => {
      const verb = BULK_ACTION_LABEL[action].toLowerCase();
      if (result.done.length) toast.success(`Đã ${verb} ${result.done.length} liên kết.`);
      if (result.skipped.length) {
        toast.warning(
          `Bỏ qua ${result.skipped.length} liên kết: ${result.skipped
            .slice(0, 3)
            .map((s) => s.reason)
            .join('; ')}`
        );
      }
      void queryClient.invalidateQueries({ queryKey: partnerKeys.all });
      setReason('');
      onDone();
      onOpenChange(false);
    },
    onError: (err: Error) => toast.error(err.message)
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Thay đổi trạng thái</DialogTitle>
          <DialogDescription>
            Áp dụng cho {linkIds.length} liên kết đã chọn. Lý do hiện trong &quot;Lịch sử thay
            đổi&quot; khi đối tác xem chi tiết liên kết. Liên kết không phù hợp với thao tác (ví dụ
            chưa bị đình chỉ mà chọn Gỡ đình chỉ) sẽ được bỏ qua.
          </DialogDescription>
        </DialogHeader>
        <div className='space-y-3'>
          <div className='space-y-2'>
            <Label htmlFor='bulk-action'>Thao tác</Label>
            <Select value={action} onValueChange={(v) => setAction(v as BulkLinkAction)}>
              <SelectTrigger id='bulk-action' className='w-full' data-testid='bulk-action'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(BULK_ACTION_LABEL) as BulkLinkAction[]).map((a) => (
                  <SelectItem key={a} value={a}>
                    {BULK_ACTION_LABEL[a]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className='space-y-2'>
            <Label htmlFor='bulk-reason'>Lý do (bắt buộc)</Label>
            <Textarea
              id='bulk-reason'
              rows={3}
              maxLength={500}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder='Ví dụ: liên kết dẫn tới nội dung vi phạm chính sách quảng cáo'
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Huỷ
          </Button>
          <Button
            disabled={reason.trim().length < 5 || run.isPending || linkIds.length === 0}
            onClick={() => run.mutate()}
          >
            {run.isPending ? 'Đang xử lý…' : BULK_ACTION_LABEL[action]}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const partnerName = (p: { companyName?: string | null; contactName: string; legalType?: string }) =>
  (p.legalType === 'company' && p.companyName) || p.contactName;

const EMPTY_LINK = { label: '', landing: '', code: '', channel: 'youtube', subid: '' };

/** "Tạo link giúp đối tác": pick the partner, then the same fields they see. */
export function CreateLinkForPartnerDialog({
  open,
  onOpenChange
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [partnerId, setPartnerId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_LINK);
  const { data: partners } = useQuery({
    ...partnersQueryOptions({
      status: 'active',
      ...(search.trim() ? { search: search.trim() } : {}),
      limit: 20
    }),
    enabled: open
  });
  const options = partners?.data ?? [];
  const picked = options.find((p) => p.id === partnerId);

  const create = useMutation({
    mutationFn: () =>
      adminCreateLinkForPartner(partnerId!, {
        label: form.label.trim(),
        ...(form.code.trim() ? { code: form.code.trim() } : {}),
        targetPath: buildTargetPath(form.landing, form.channel, form.subid)
      }),
    onSuccess: () => {
      toast.success('Đã tạo liên kết cho đối tác.');
      void queryClient.invalidateQueries({ queryKey: partnerKeys.all });
      setForm(EMPTY_LINK);
      setPartnerId(null);
      setSearch('');
      onOpenChange(false);
    },
    onError: (err: Error) => toast.error(err.message)
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>Tạo link giúp đối tác</DialogTitle>
          <DialogDescription>
            Liên kết thuộc về đối tác được chọn; lịch sử ghi &quot;Tạo bởi Admin&quot;.
          </DialogDescription>
        </DialogHeader>
        <div className='space-y-3'>
          <div className='space-y-2'>
            <Label htmlFor='create-partner-search'>Đối tác</Label>
            <Input
              id='create-partner-search'
              placeholder='Tìm tên / email / SĐT / mã ID'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Select
              value={partnerId ? String(partnerId) : undefined}
              onValueChange={(v) => setPartnerId(Number(v))}
            >
              <SelectTrigger className='w-full' data-testid='create-partner'>
                <SelectValue placeholder='Chọn đối tác' />
              </SelectTrigger>
              <SelectContent>
                {options.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    #{p.id} · {partnerName(p)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
            <div className='space-y-2 sm:col-span-2'>
              <Label htmlFor='create-label'>Tên liên kết</Label>
              <Input
                id='create-label'
                maxLength={255}
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
              />
            </div>
            <div className='space-y-2 sm:col-span-2'>
              <Label htmlFor='create-landing'>Trang đích</Label>
              <Input
                id='create-landing'
                placeholder='/khuyen-mai/sim-nhat-ban (bỏ trống = trang chủ)'
                value={form.landing}
                onChange={(e) => setForm({ ...form, landing: e.target.value })}
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='create-code'>Link tiếp thị (mã)</Label>
              <Input
                id='create-code'
                placeholder='Bỏ trống để hệ thống tự tạo'
                maxLength={50}
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
              />
              <p className='text-muted-foreground text-xs'>
                esim.vn/go/{form.code.trim().toUpperCase() || '…'}
              </p>
            </div>
            <div className='space-y-2'>
              <Label htmlFor='create-channel'>Kênh quảng bá</Label>
              <Select value={form.channel} onValueChange={(v) => setForm({ ...form, channel: v })}>
                <SelectTrigger id='create-channel' className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CHANNELS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-2 sm:col-span-2'>
              <Label htmlFor='create-subid'>Mã phân biệt nguồn</Label>
              <Input
                id='create-subid'
                maxLength={60}
                placeholder='Ví dụ: youtube_nhatban_01'
                value={form.subid}
                onChange={(e) => setForm({ ...form, subid: e.target.value })}
              />
            </div>
          </div>
          {picked && (
            <p className='text-muted-foreground text-xs'>
              Tạo cho #{picked.id} · {partnerName(picked)}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Huỷ
          </Button>
          <Button
            disabled={!partnerId || !form.label.trim() || create.isPending}
            onClick={() => create.mutate()}
          >
            {create.isPending ? 'Đang tạo…' : 'Tạo liên kết'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
