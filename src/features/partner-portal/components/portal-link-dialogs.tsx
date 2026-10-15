'use client';

/**
 * The popups behind each row of the marketing link list (doitac-1410 #018):
 * "Xem chi tiết" (figure 1 of the brief), "Sửa", "Tạm tắt", "Xóa" (figure 2)
 * and "Gửi kháng nghị".
 */

import { useEffect, useMemo, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
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
import { Textarea } from '@/components/ui/textarea';
import { Icons } from '@/components/icons';
import { formatDateTimeVn, formatDateVn, formatVnd } from '@/lib/format';

import { updateLinkMutation } from '../api/mutations';
import { myLinkDetailQueryOptions, myProfileQueryOptions, partnerPortalKeys } from '../api/queries';
import { appealMyLink, createMyTicket, deleteMyLink } from '../api/service';
import type { MyLink, MyLinkEvent } from '../api/types';
import {
  CHANNELS,
  LINK_PERIODS,
  LINK_STATE,
  type LinkPeriod,
  buildTargetPath,
  channelOf,
  channelValueOf,
  landingOf,
  linkState,
  periodRange,
  shortLinkOf,
  subidOf
} from './portal-link-utils';

const who = (role: string) =>
  role === 'admin' ? 'esim.vn' : role === 'system' ? 'Hệ thống' : 'Bạn';

/** How one history line reads (figure 1). */
function describeEvent(e: MyLinkEvent): { title: string; lines: string[] } {
  const d = (e.detail ?? {}) as Record<string, string | null>;
  const actor = who(e.actorRole);
  switch (e.action) {
    case 'created':
      return {
        title: `${actor} tạo liên kết`,
        lines: [
          `esim.vn${landingOf(d.targetPath) === 'Trang chủ' ? '' : landingOf(d.targetPath)}`,
          `Tên «${d.label ?? ''}» · kênh ${channelOf(d.targetPath)}`
        ]
      };
    case 'renamed':
      return { title: `${actor} đổi tên`, lines: [`${d.from ?? ''} → ${d.to ?? ''}`] };
    case 'retargeted':
      return {
        title: `${actor} đổi đích đến`,
        lines: [`${landingOf(d.from)} → ${landingOf(d.to)}`]
      };
    case 'paused':
      return { title: `${actor} tạm tắt liên kết`, lines: [] };
    case 'resumed':
      return { title: `${actor} bật lại liên kết`, lines: [] };
    case 'deleted':
      return {
        title: `${actor} xóa liên kết`,
        lines: d.restorableUntil ? [`Có thể khôi phục đến ${formatDateVn(d.restorableUntil)}`] : []
      };
    case 'restored':
      return { title: `${actor} khôi phục liên kết`, lines: [] };
    case 'suspended':
      return { title: 'esim.vn đình chỉ liên kết', lines: d.reason ? [`Lý do: ${d.reason}`] : [] };
    case 'unsuspended':
      return {
        title: 'esim.vn gỡ đình chỉ liên kết',
        lines: d.reason ? [`Lý do: ${d.reason}`] : []
      };
    case 'appealed':
      return { title: `${actor} gửi kháng nghị`, lines: [] };
    default:
      return { title: e.action, lines: [] };
  }
}

function downloadHistoryCsv(link: MyLink, events: MyLinkEvent[]) {
  const rows = [['Thời gian', 'Người thực hiện', 'Thao tác', 'Chi tiết']];
  for (const e of events) {
    const { title, lines } = describeEvent(e);
    rows.push([formatDateTimeVn(e.createdAt), who(e.actorRole), title, lines.join(' | ')]);
  }
  const csv = rows
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `Lich-su-lien-ket_${link.code}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

function Tile({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className='bg-muted/50 rounded-lg p-3'>
      <p className='text-muted-foreground text-xs'>{label}</p>
      <p className='mt-0.5 text-sm font-semibold'>{value}</p>
    </div>
  );
}

/** "Xem chi tiết" — figure 1. */
export function LinkDetailDialog({
  link,
  onClose,
  onEdit,
  onPause,
  onResume,
  onDelete
}: {
  link: MyLink;
  onClose: () => void;
  onEdit: () => void;
  onPause: () => void;
  onResume: () => void;
  onDelete: () => void;
}) {
  const [period, setPeriod] = useState<LinkPeriod>('month');
  const { data: detail, isLoading } = useQuery(
    myLinkDetailQueryOptions(link.id, periodRange(period))
  );
  const state = linkState(link);
  const url = `https://${shortLinkOf(link.code)}`;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='sm:max-w-[560px]' data-testid='link-detail'>
        <DialogHeader>
          <DialogTitle>{link.label}</DialogTitle>
          <DialogDescription className='font-mono'>{shortLinkOf(link.code)}</DialogDescription>
        </DialogHeader>
        <div className='flex flex-wrap items-center gap-2'>
          <Badge variant={LINK_STATE[state].variant}>{LINK_STATE[state].label}</Badge>
          <span className='text-muted-foreground text-xs'>{channelOf(link.targetPath)}</span>
        </div>

        {state === 'inactive' && detail && (
          <div className='border-primary/40 bg-primary/5 rounded-lg border-l-4 p-3 text-sm'>
            <p className='font-medium'>
              Liên kết đang tạm tắt từ {formatDateTimeVn(detail.statusSince)}
            </p>
            <p className='text-muted-foreground'>
              Lượt nhấp mới không được ghi nhận cho bạn. Đơn đã phát sinh vẫn được tính.
            </p>
          </div>
        )}
        {state === 'suspended' && (
          <div className='border-destructive/40 bg-destructive/5 rounded-lg border-l-4 p-3 text-sm'>
            <p className='font-medium'>Liên kết đang bị đình chỉ</p>
            <p className='text-muted-foreground'>
              {link.suspendedByAdmin
                ? `Lý do: ${link.suspendedReason ?? '—'}`
                : 'Tài khoản của bạn đang bị khóa nên mọi liên kết tạm dừng theo.'}
            </p>
          </div>
        )}

        {state !== 'suspended' && state !== 'deleted' && (
          <div className='flex items-center gap-3 rounded-lg border p-3'>
            <QRCodeCanvas value={url} size={72} level='M' />
            <div className='min-w-0 flex-1'>
              <p className='truncate font-mono text-xs'>{url}</p>
              <Button
                size='sm'
                variant='outline'
                className='mt-2'
                onClick={async () => {
                  await navigator.clipboard?.writeText(url);
                  toast.success('Đã sao chép liên kết.');
                }}
              >
                <Icons.copy /> Sao chép
              </Button>
            </div>
          </div>
        )}

        {isLoading || !detail ? (
          <div className='flex justify-center py-8'>
            <Icons.spinner className='size-6 animate-spin' />
          </div>
        ) : (
          <>
            <div>
              <p className='text-sm font-semibold'>Mốc thời gian</p>
              <p className='text-muted-foreground text-xs'>
                Giờ Việt Nam (GMT+7), do hệ thống esim.vn ghi nhận
              </p>
              <div className='mt-2 grid grid-cols-2 gap-2'>
                <Tile
                  label='Tạo lúc'
                  value={`${formatDateTimeVn(detail.createdAt)} · bởi ${who(detail.createdBy)}`}
                />
                <Tile
                  label='Cập nhật lần cuối'
                  value={
                    detail.lastChangedAt
                      ? `${formatDateTimeVn(detail.lastChangedAt)} · bởi ${who(detail.lastChangedBy)}`
                      : '—'
                  }
                />
                <Tile
                  label='Trạng thái hiện tại'
                  value={`${LINK_STATE[state].label}, từ ${formatDateTimeVn(detail.statusSince)}`}
                />
                <Tile
                  label='Lần nhấp gần nhất'
                  value={
                    detail.lastClickedAt
                      ? formatDateTimeVn(detail.lastClickedAt)
                      : 'Chưa có lượt nhấp'
                  }
                />
                <Tile
                  label='Đã chỉnh sửa'
                  value={`${detail.editCount ?? 0} lần (${detail.retargetCount} lần đổi đích đến)`}
                />
                <Tile
                  label='Đích đến hiện tại'
                  value={`esim.vn${landingOf(detail.targetPath) === 'Trang chủ' ? '' : landingOf(detail.targetPath)}`}
                />
              </div>
            </div>

            <div>
              <div className='flex items-center justify-between gap-2'>
                <p className='text-sm font-semibold'>Hiệu quả</p>
                <Select value={period} onValueChange={(v) => setPeriod(v as LinkPeriod)}>
                  <SelectTrigger className='h-8 w-[140px]'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LINK_PERIODS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className='mt-2 grid grid-cols-3 gap-2'>
                <Tile
                  label='Click hợp lệ'
                  value={(detail.periodClicks ?? 0).toLocaleString('vi-VN')}
                />
                <Tile label='Đơn' value={(detail.periodOrders ?? 0).toLocaleString('vi-VN')} />
                <Tile label='Hoa hồng' value={formatVnd(detail.periodCommissionVnd ?? 0)} />
              </div>
              <p className='text-muted-foreground mt-1 text-xs'>
                Click hợp lệ không tính bot, trình xem trước link và click kiểm thử. Số liệu có thể
                thay đổi khi đơn được xác minh hoặc đối soát.
              </p>
            </div>

            <div>
              <div className='flex items-center justify-between gap-2'>
                <p className='text-sm font-semibold'>Lịch sử thay đổi</p>
                <Button
                  size='sm'
                  variant='outline'
                  onClick={() => downloadHistoryCsv(link, detail.events)}
                >
                  <Icons.download /> Tải CSV
                </Button>
              </div>
              <ol className='mt-2 space-y-3 border-l pl-4' data-testid='link-history'>
                {detail.events.map((e) => {
                  const { title, lines } = describeEvent(e);
                  return (
                    <li key={e.id} className='relative'>
                      <span className='bg-foreground absolute top-1.5 -left-[21px] h-2 w-2 rounded-full' />
                      <p className='text-muted-foreground text-xs'>
                        {formatDateTimeVn(e.createdAt)}
                      </p>
                      <p className='text-sm font-medium'>{title}</p>
                      {lines.map((l) => (
                        <p key={l} className='text-muted-foreground text-xs break-words'>
                          {l}
                        </p>
                      ))}
                    </li>
                  );
                })}
              </ol>
            </div>
          </>
        )}

        <DialogFooter className='gap-2'>
          {state !== 'deleted' && state !== 'suspended' && (
            <>
              <Button variant='outline' onClick={onEdit}>
                Sửa
              </Button>
              {state === 'active' ? (
                <Button variant='outline' onClick={onPause}>
                  Tạm tắt
                </Button>
              ) : (
                <Button onClick={onResume}>Bật lại</Button>
              )}
              <Button variant='outline' className='text-destructive' onClick={onDelete}>
                Xóa
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** "Sửa" — the creation fields, the short link greyed out. */
export function EditLinkDialog({ link, onClose }: { link: MyLink; onClose: () => void }) {
  const queryClient = useQueryClient();
  const initialLanding =
    landingOf(link.targetPath) === 'Trang chủ'
      ? ''
      : `https://esim.vn${landingOf(link.targetPath)}`;
  const initialChannel = channelValueOf(link.targetPath) || 'other';
  const [label, setLabel] = useState(link.label);
  const [landing, setLanding] = useState(initialLanding);
  const [channel, setChannel] = useState(initialChannel);
  // The destination is only sent when the partner changed it, so a rename
  // does not also read "đổi đích đến" in the link's history.
  const destinationChanged = landing !== initialLanding || channel !== initialChannel;
  const save = useMutation({
    ...updateLinkMutation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: partnerPortalKeys.links() });
      toast.success('Đã lưu liên kết.');
      onClose();
    },
    onError: (e: Error) => toast.error(e.message || 'Không lưu được liên kết.')
  });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='sm:max-w-[520px]'>
        <DialogHeader>
          <DialogTitle>Sửa liên kết «{link.label}»</DialogTitle>
        </DialogHeader>
        <div className='space-y-4'>
          <div className='space-y-1.5'>
            <Label htmlFor='edit-label'>Tên liên kết</Label>
            <Input id='edit-label' value={label} onChange={(e) => setLabel(e.target.value)} />
          </div>
          <div className='space-y-1.5'>
            <Label htmlFor='edit-landing'>Trang đích</Label>
            <Input
              id='edit-landing'
              type='url'
              placeholder='https://esim.vn/esim/nhat-ban — để trống: trang chủ'
              value={landing}
              onChange={(e) => setLanding(e.target.value)}
            />
          </div>
          <div className='space-y-1.5'>
            <Label htmlFor='edit-code'>Link tiếp thị</Label>
            <Input id='edit-code' value={shortLinkOf(link.code)} disabled readOnly />
            <p className='text-muted-foreground text-xs'>
              Không đổi được vì đã nằm trên nội dung bạn đã đăng hoặc đã in mã QR.
            </p>
          </div>
          <div className='space-y-1.5'>
            <Label htmlFor='edit-channel'>Kênh quảng bá</Label>
            <Select value={channel} onValueChange={setChannel}>
              <SelectTrigger id='edit-channel' className='w-full'>
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
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={onClose}>
            Hủy
          </Button>
          <Button
            disabled={!label.trim()}
            isLoading={save.isPending}
            onClick={() =>
              save.mutate({
                id: link.id,
                data: {
                  label: label.trim(),
                  ...(destinationChanged
                    ? {
                        targetPath:
                          buildTargetPath(landing, channel, subidOf(link.targetPath)) ?? ''
                      }
                    : {})
                }
              })
            }
          >
            Lưu thay đổi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** The 30-day and 7-day figures a pause or a delete is weighed against. */
function useRecentStats(linkId: number) {
  const { data: last30 } = useQuery(myLinkDetailQueryOptions(linkId, periodRange('30d')));
  const { data: last7 } = useQuery(myLinkDetailQueryOptions(linkId, periodRange('7d')));
  return { last30, last7 };
}

const THREE_THINGS = (verb: 'tạm tắt' | 'xóa') => [
  'Đơn đã phát sinh vẫn được tính hoa hồng; lượt nhấp đã ghi nhận vẫn hợp lệ đến hết thời hạn theo dõi.',
  `Từ khi ${verb}, khách bấm link không còn được ghi nhận cho bạn. Họ vẫn tới trang đích như cũ.`,
  'Mã giảm giá của bạn không bị ảnh hưởng.'
];

/** "Tạm tắt". */
export function PauseLinkDialog({ link, onClose }: { link: MyLink; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { last30 } = useRecentStats(link.id);
  const pause = useMutation({
    ...updateLinkMutation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: partnerPortalKeys.links() });
      toast.success('Đã tạm tắt liên kết. Bạn có thể bật lại bất cứ lúc nào.');
      onClose();
    },
    onError: (e: Error) => toast.error(e.message || 'Không tạm tắt được liên kết.')
  });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='sm:max-w-[520px]'>
        <DialogHeader>
          <DialogTitle>Tạm tắt liên kết «{link.label}»</DialogTitle>
          <DialogDescription className='font-mono'>{shortLinkOf(link.code)}</DialogDescription>
        </DialogHeader>
        <div className='grid grid-cols-2 gap-2'>
          <Tile
            label='Click hợp lệ 30 ngày qua'
            value={(last30?.periodClicks ?? 0).toLocaleString('vi-VN')}
          />
          <Tile
            label='Đơn 30 ngày qua'
            value={(last30?.periodOrders ?? 0).toLocaleString('vi-VN')}
          />
        </div>
        <div>
          <p className='text-sm font-semibold'>Ba điều cần biết</p>
          <ul className='text-muted-foreground mt-1 list-disc space-y-1 pl-5 text-sm'>
            {THREE_THINGS('tạm tắt').map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
        <p className='bg-muted/50 rounded-lg p-3 text-sm'>
          Bạn có thể bật lại liên kết bất cứ lúc nào. Tạm tắt an toàn hơn xóa nếu bạn chỉ cần dừng
          tạm thời.
        </p>
        <DialogFooter>
          <Button variant='outline' onClick={onClose}>
            Hủy
          </Button>
          <Button
            isLoading={pause.isPending}
            onClick={() => pause.mutate({ id: link.id, data: { isActive: false } })}
          >
            Tạm tắt liên kết
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Clicks in seven days that make a link "busy" enough to warn about. */
const BUSY_CLICKS_7D = 50;

/** "Xóa" — figure 2. */
export function DeleteLinkDialog({
  link,
  onClose,
  onPauseInstead
}: {
  link: MyLink;
  onClose: () => void;
  onPauseInstead: () => void;
}) {
  const queryClient = useQueryClient();
  const { last30, last7 } = useRecentStats(link.id);
  const [typed, setTyped] = useState('');
  const restoreBy = useMemo(() => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), []);
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const busy = (last7?.periodClicks ?? 0) >= BUSY_CLICKS_7D;
  const remove = useMutation({
    mutationFn: () => deleteMyLink(link.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: partnerPortalKeys.links() });
      toast.success('Đã xóa liên kết. Bạn có thể khôi phục trong 30 ngày.');
      onClose();
    },
    onError: (e: Error) => toast.error(e.message || 'Không xóa được liên kết.')
  });
  const confirmed = typed.trim() === link.label.trim();

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='sm:max-w-[560px]' data-testid='link-delete'>
        <DialogHeader>
          <DialogTitle>Xóa liên kết «{link.label}»</DialogTitle>
          <DialogDescription className='font-mono'>{shortLinkOf(link.code)}</DialogDescription>
        </DialogHeader>
        <div className='grid grid-cols-2 gap-2'>
          <Tile
            label='Click hợp lệ 30 ngày qua'
            value={(last30?.periodClicks ?? 0).toLocaleString('vi-VN')}
          />
          <Tile
            label='Đơn trong thời hạn theo dõi'
            value={(last30?.periodOrders ?? 0).toLocaleString('vi-VN')}
          />
        </div>
        {busy && (
          <p className='border-primary/40 rounded-lg border-l-4 p-3 text-sm'>
            Link đang nhận nhiều lượt truy cập ({(last7?.periodClicks ?? 0).toLocaleString('vi-VN')}{' '}
            click hợp lệ trong 7 ngày qua).
          </p>
        )}
        <div>
          <p className='text-sm font-semibold'>Ba điều cần biết</p>
          <ul className='text-muted-foreground mt-1 list-disc space-y-1 pl-5 text-sm'>
            {THREE_THINGS('xóa').map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
        <div className='border-primary/40 bg-primary/5 rounded-lg border-l-4 p-3 text-sm'>
          <p className='font-semibold'>
            Có thể khôi phục đến {formatDateVn(restoreBy.toISOString())}
          </p>
          <p className='text-muted-foreground'>
            Sau 30 ngày chỉ esim.vn khôi phục được. Tên link{' '}
            <span className='font-mono'>{link.code}</span> được giữ chỗ vĩnh viễn, không cấp lại cho
            ai.
          </p>
        </div>
        <div className='space-y-1.5'>
          <Label htmlFor='delete-confirm'>
            {busy ? 'Link có nhiều lượt truy cập. ' : ''}Gõ lại tên liên kết để xác nhận
          </Label>
          <Input
            id='delete-confirm'
            placeholder={link.label}
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
          />
        </div>
        <p className='text-muted-foreground text-xs'>
          Thao tác được ghi lại theo giờ hệ thống (GMT+7), hiện là{' '}
          {formatDateTimeVn(now.toISOString())}. Nhật ký không thể sửa hoặc xóa.
        </p>
        <DialogFooter className='gap-2'>
          <Button variant='outline' onClick={onClose}>
            Hủy
          </Button>
          {link.status === 'active' && (
            <Button variant='outline' onClick={onPauseInstead}>
              Tạm tắt thay vì xóa
            </Button>
          )}
          <Button
            variant='outline'
            className='text-destructive border-destructive/40'
            disabled={!confirmed}
            isLoading={remove.isPending}
            onClick={() => remove.mutate()}
          >
            Xóa liên kết
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** "Gửi kháng nghị" — a support ticket, already filled in. */
export function AppealLinkDialog({ link, onClose }: { link: MyLink; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { data: me } = useQuery(myProfileQueryOptions());
  const [message, setMessage] = useState('');
  const send = useMutation({
    mutationFn: async () => {
      const ticket = await createMyTicket({
        customerEmail: me?.contactEmail ?? '',
        subject: 'Link hoặc mã giảm giá',
        description: message.trim(),
        orderId: `https://${shortLinkOf(link.code)}`
      });
      return appealMyLink(link.id, Number((ticket as { id?: number }).id) || undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: partnerPortalKeys.links() });
      toast.success('Đã gửi kháng nghị. esim.vn sẽ phản hồi trong mục Hỗ trợ.');
      onClose();
    },
    onError: (e: Error) => toast.error(e.message || 'Không gửi được kháng nghị.')
  });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='sm:max-w-[520px]'>
        <DialogHeader>
          <DialogTitle>Gửi kháng nghị</DialogTitle>
          <DialogDescription>
            Liên kết «{link.label}» bị esim.vn đình chỉ. Lý do: {link.suspendedReason ?? '—'}
          </DialogDescription>
        </DialogHeader>
        <div className='space-y-3'>
          <div className='space-y-1.5'>
            <Label>Chủ đề</Label>
            <Input value='Link hoặc mã giảm giá' disabled readOnly />
          </div>
          <div className='space-y-1.5'>
            <Label>Mã đơn hoặc mã yêu cầu</Label>
            <Input value={`https://${shortLinkOf(link.code)}`} disabled readOnly />
          </div>
          <div className='space-y-1.5'>
            <Label htmlFor='appeal-message'>
              Nội dung kháng nghị <span className='text-destructive'>*</span>
            </Label>
            <Textarea
              id='appeal-message'
              rows={4}
              placeholder='Giải thích vì sao bạn cho rằng liên kết không vi phạm…'
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={onClose}>
            Hủy
          </Button>
          <Button
            disabled={!message.trim()}
            isLoading={send.isPending}
            onClick={() => send.mutate()}
          >
            Gửi yêu cầu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
