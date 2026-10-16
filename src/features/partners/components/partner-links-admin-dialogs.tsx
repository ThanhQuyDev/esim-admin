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
import { Badge } from '@/components/ui/badge';
import { formatDateTimeVn, formatVnd } from '@/lib/format';
import { describeEvent } from '@/features/partner-portal/components/portal-link-dialogs';
import {
  CHANNELS,
  buildTargetPath,
  channelOf,
  landingOf,
  shortLinkOf,
  subidOf
} from '@/features/partner-portal/components/portal-link-utils';

import { adminLinkDetailQueryOptions, partnerKeys, partnersQueryOptions } from '../api/queries';
import { addLinkNote, adminCreateLinkForPartner, bulkLinkStatus } from '../api/service';

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
  onDone,
  fixedAction,
  title,
  stateLabel
}: {
  linkIds: number[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone: () => void;
  /** One row's own button (doitac-1410 #054): the action is already chosen. */
  fixedAction?: BulkLinkAction;
  title?: string;
  /** The link's state label, shown with "từ <time>" (doitac-1410 #055). */
  stateLabel?: { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' };
}) {
  const queryClient = useQueryClient();
  const [chosen, setAction] = useState<BulkLinkAction>('suspend');
  const action = fixedAction ?? chosen;
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  // One link: how long it has been in its current state (doitac-1410 #055).
  const single = fixedAction && linkIds.length === 1 ? linkIds[0] : null;
  const { data: current } = useQuery({
    ...adminLinkDetailQueryOptions(single),
    enabled: open && single !== null
  });

  const run = useMutation({
    mutationFn: () =>
      bulkLinkStatus({
        linkIds,
        action,
        reason: reason.trim(),
        ...(note.trim() ? { internalNote: note.trim() } : {})
      }),
    onSuccess: (result) => {
      const verb = BULK_ACTION_LABEL[action].toLowerCase();
      if (result.done.length) toast.success(`Đã ${verb} ${result.done.length} liên kết.`);
      if (result.skipped.length && fixedAction) {
        // One link: what stopped it is the error.
        toast.error(result.skipped[0].reason);
      } else if (result.skipped.length) {
        toast.warning(
          `Bỏ qua ${result.skipped.length} liên kết: ${result.skipped
            .slice(0, 3)
            .map((s) => s.reason)
            .join('; ')}`
        );
      }
      void queryClient.invalidateQueries({ queryKey: partnerKeys.all });
      setReason('');
      setNote('');
      onDone();
      onOpenChange(false);
    },
    onError: (err: Error) => toast.error(err.message)
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>{title ?? 'Thay đổi trạng thái'}</DialogTitle>
          <DialogDescription>
            {fixedAction
              ? 'Lý do hiện trong "Lịch sử thay đổi" khi đối tác xem chi tiết liên kết, và được gửi thông báo cho đối tác.'
              : `Áp dụng cho ${linkIds.length} liên kết đã chọn. Lý do hiện trong "Lịch sử thay đổi" khi đối tác xem chi tiết liên kết. Liên kết không phù hợp với thao tác (ví dụ chưa bị đình chỉ mà chọn Gỡ đình chỉ) sẽ được bỏ qua.`}
          </DialogDescription>
        </DialogHeader>
        <div className='space-y-3'>
          {single !== null && stateLabel && (
            <div className='flex flex-wrap items-center gap-2 text-sm' data-testid='status-since'>
              <Badge variant={stateLabel.variant}>{stateLabel.label}</Badge>
              <span className='text-muted-foreground'>|</span>
              <span>từ {current ? formatDateTimeVn(current.statusSince) : '…'}</span>
            </div>
          )}
          <div className={fixedAction ? 'hidden' : 'space-y-2'}>
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
          <div className='space-y-2'>
            <Label htmlFor='bulk-note'>Ghi chú nội bộ (chỉ admin xem)</Label>
            <Textarea
              id='bulk-note'
              rows={2}
              maxLength={1000}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder='Không hiện cho đối tác'
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

const ACTOR: Record<string, string> = { admin: 'Admin', partner: 'Đối tác', system: 'Hệ thống' };

/**
 * "Xem chi tiết" of one link for the admin (doitac-1410 #054): what the
 * partner sees — state, link, figures — and its full change history.
 */
export function AdminLinkDetailDialog({
  linkId,
  stateLabel,
  onClose,
  actions
}: {
  linkId: number | null;
  stateLabel?: { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' };
  onClose: () => void;
  /** The row's own status buttons, repeated at the foot of the popup. */
  actions?: React.ReactNode;
}) {
  const { data: link, isLoading } = useQuery(adminLinkDetailQueryOptions(linkId));
  return (
    <Dialog open={linkId !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className='max-h-[90vh] overflow-y-auto sm:max-w-[600px]'
        data-testid='admin-link-detail'
      >
        <DialogHeader>
          <DialogTitle>{link?.label ?? 'Chi tiết liên kết'}</DialogTitle>
          <DialogDescription className='font-mono'>
            {link ? shortLinkOf(link.code) : ''}
          </DialogDescription>
        </DialogHeader>
        {isLoading || !link ? (
          <p className='text-muted-foreground py-6 text-center text-sm'>Đang tải…</p>
        ) : (
          <div className='space-y-4 text-sm'>
            <div className='flex flex-wrap items-center gap-2'>
              {stateLabel && <Badge variant={stateLabel.variant}>{stateLabel.label}</Badge>}
              <span className='text-muted-foreground text-xs'>
                từ {formatDateTimeVn(link.statusSince)}
              </span>
            </div>
            {link.suspendedReason && (
              <p className='border-destructive/40 bg-destructive/5 rounded-lg border-l-4 p-3'>
                Lý do đình chỉ: {link.suspendedReason}
              </p>
            )}
            {link.restoreRequestReason && (
              <p className='bg-muted/50 rounded-lg p-3'>
                Đối tác xin khôi phục: {link.restoreRequestReason}
              </p>
            )}
            <div className='grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3'>
              {[
                ['Đối tác', `${link.partner.name ?? '—'} (#${link.partner.id})`],
                ['Trang đích', landingOf(link.targetPath)],
                ['Kênh quảng bá', channelOf(link.targetPath)],
                ['Mã phân biệt nguồn', subidOf(link.targetPath) || '—'],
                [
                  'Tạo lúc',
                  `${formatDateTimeVn(link.createdAt)} · ${ACTOR[link.createdBy] ?? link.createdBy}`
                ],
                ['Số lần sửa', String(link.editCount)],
                ['Lượt nhấp (tháng)', link.periodClicks.toLocaleString('vi-VN')],
                ['Số đơn (tháng)', link.periodOrders.toLocaleString('vi-VN')],
                ['Hoa hồng (tháng)', formatVnd(link.periodCommissionVnd)]
              ].map(([label, value]) => (
                <div key={label} className='min-w-0'>
                  <p className='text-muted-foreground text-xs'>{label}</p>
                  <p className='truncate font-medium'>{value}</p>
                </div>
              ))}
            </div>
            <InternalNotes linkId={link.id} notes={link.internalNotes ?? []} />
            <div>
              <p className='mb-2 font-medium'>Lịch sử thay đổi</p>
              <ol className='space-y-2' data-testid='admin-link-history'>
                {link.events.map((e) => {
                  const { title, lines } = describeEvent(e, 'admin');
                  return (
                    <li key={e.id} className='border-l-2 pl-3'>
                      <p className='text-xs font-medium'>{title}</p>
                      {lines.map((l) => (
                        <p key={l} className='text-muted-foreground text-xs'>
                          {l}
                        </p>
                      ))}
                      <p className='text-muted-foreground text-[11px]'>
                        {formatDateTimeVn(e.createdAt)}
                      </p>
                    </li>
                  );
                })}
                {link.events.length === 0 && (
                  <li className='text-muted-foreground text-xs'>Chưa có thay đổi nào.</li>
                )}
              </ol>
            </div>
          </div>
        )}
        {actions && <DialogFooter className='flex-wrap gap-2'>{actions}</DialogFooter>}
      </DialogContent>
    </Dialog>
  );
}

/**
 * "Ghi chú nội bộ" of a link (doitac-1410 #055): seen by admins only, never
 * in the history the partner reads.
 */
function InternalNotes({
  linkId,
  notes
}: {
  linkId: number;
  notes: { id: number; body: string; createdAt: string; by: string }[];
}) {
  const queryClient = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [body, setBody] = useState('');
  const save = useMutation({
    mutationFn: () => addLinkNote(linkId, body.trim()),
    onSuccess: () => {
      toast.success('Đã thêm ghi chú nội bộ.');
      setBody('');
      setAdding(false);
      void queryClient.invalidateQueries({ queryKey: partnerKeys.all });
    },
    onError: (err: Error) => toast.error(err.message)
  });
  return (
    <div className='bg-muted/40 space-y-2 rounded-lg p-3' data-testid='internal-notes'>
      <div className='flex items-center justify-between gap-2'>
        <p className='font-medium'>Ghi chú nội bộ</p>
        {!adding && (
          <Button size='sm' variant='outline' onClick={() => setAdding(true)}>
            Thêm ghi chú nội bộ
          </Button>
        )}
      </div>
      {adding && (
        <div className='space-y-2'>
          <Textarea
            aria-label='Ghi chú nội bộ'
            rows={2}
            maxLength={1000}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder='Chỉ admin xem được'
          />
          <div className='flex justify-end gap-2'>
            <Button size='sm' variant='ghost' onClick={() => setAdding(false)}>
              Huỷ
            </Button>
            <Button
              size='sm'
              disabled={body.trim().length < 2 || save.isPending}
              onClick={() => save.mutate()}
            >
              {save.isPending ? 'Đang lưu…' : 'Lưu ghi chú'}
            </Button>
          </div>
        </div>
      )}
      {notes.length === 0 ? (
        <p className='text-muted-foreground text-xs'>Chưa có ghi chú nội bộ.</p>
      ) : (
        <ul className='space-y-1.5'>
          {notes.map((n) => (
            <li key={n.id} className='text-xs'>
              <p className='whitespace-pre-wrap'>{n.body}</p>
              <p className='text-muted-foreground text-[11px]'>
                {n.by} · {formatDateTimeVn(n.createdAt)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
