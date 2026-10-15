'use client';

/**
 * Support: the partner's own tickets, and a popup to raise a new one.
 *
 * doitac-1410 #023: the page opens straight on the list — no "Tạo yêu cầu /
 * Yêu cầu của tôi" tabs — with "Tạo yêu cầu hỗ trợ" at the top right.
 *
 * Picking a topic swaps the hint under it — the guidance arrives before the
 * partner writes, not after they submit something unusable.
 */

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
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
import { formatDateTimeVn } from '@/lib/format';

import { createTicketMutation } from '../api/mutations';
import { uploadAttachment } from '../api/service';
import { TicketThreadDialog } from './ticket-thread-dialog';
import type { MyTicket } from '../api/types';
import { myProfileQueryOptions, myTicketsQueryOptions } from '../api/queries';

/**
 * Topic → what to include. Steers the request toward something answerable.
 *
 * Two lists, because the two programmes go wrong in different ways (#049): a
 * marketing partner writes in about an order that was not credited to them, a
 * distribution partner about an eSIM they paid for and cannot deliver.
 */
const AFFILIATE_TOPICS = [
  {
    value: 'missing',
    label: 'Đơn hàng chưa được ghi nhận',
    hint: 'Gửi mã đơn, thời điểm mua và link hoặc mã khách đã dùng.'
  },
  {
    value: 'commission',
    label: 'Hoa hồng',
    hint: 'Gửi mã đơn và mức hoa hồng bạn cho là chưa đúng.'
  },
  {
    value: 'payout',
    label: 'Rút tiền',
    hint: 'Gửi mã yêu cầu rút, số tiền và ngày tạo yêu cầu.'
  },
  {
    value: 'link',
    label: 'Link hoặc mã giảm giá',
    hint: 'Gửi link hoặc mã gặp lỗi, kèm thiết bị và trình duyệt đã thử.'
  },
  {
    value: 'account',
    label: 'Tài khoản',
    hint: 'Mô tả lỗi đăng nhập hoặc thông tin hồ sơ cần thay đổi.'
  }
];

const DISTRIBUTION_TOPICS = [
  {
    value: 'order',
    label: 'Đơn lấy hàng',
    hint: 'Gửi mã đơn và thời điểm mua. Nếu đơn thiếu eSIM, ghi rõ thiếu bao nhiêu mã.'
  },
  {
    value: 'esim',
    label: 'eSIM lỗi hoặc không kích hoạt được',
    hint: 'Gửi ICCID, mã đơn và mô tả lỗi khách gặp khi kích hoạt.'
  },
  {
    value: 'topup',
    label: 'Nạp tiền ký quỹ',
    hint: 'Gửi mã đối chiếu, số tiền và ảnh giao dịch ngân hàng nếu có.'
  },
  {
    value: 'pricing',
    label: 'Giá vốn và bảng giá',
    hint: 'Ghi rõ gói và mức giá bạn thấy chưa đúng so với hạng hiện tại.'
  },
  {
    value: 'account',
    label: 'Tài khoản',
    hint: 'Mô tả lỗi đăng nhập hoặc thông tin hồ sơ cần thay đổi.'
  }
];

const TICKET_STATUS: Record<string, { label: string; className: string }> = {
  open: {
    label: 'Chờ xử lý',
    className:
      'border-blue-200 bg-blue-100 text-blue-800 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300'
  },
  in_progress: {
    label: 'Đang xử lý',
    className:
      'border-orange-200 bg-orange-100 text-orange-800 dark:border-orange-900 dark:bg-orange-950 dark:text-orange-300'
  },
  need_info: {
    label: 'Cần bổ sung thông tin',
    className:
      'border-purple-200 bg-purple-100 text-purple-800 dark:border-purple-900 dark:bg-purple-950 dark:text-purple-300'
  },
  resolved: {
    label: 'Đã xử lý',
    className:
      'border-emerald-200 bg-emerald-100 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300'
  },
  closed: {
    label: 'Đã đóng',
    className:
      'border-gray-200 bg-gray-100 text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300'
  }
};

const MAX_FILES = 5;

/** "Tạo yêu cầu hỗ trợ" — the form, now in a popup (doitac-1410 #023). */
function CreateTicketDialog({
  open,
  onOpenChange,
  topics,
  customerEmail
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  topics: typeof AFFILIATE_TOPICS;
  customerEmail: string;
}) {
  const [topic, setTopic] = useState(topics[0]!.value);
  const [reference, setReference] = useState('');
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<{ name: string; url: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // A partner who switched programmes could be holding a topic the other list
  // does not have; fall back rather than show an empty hint.
  const hint = topics.find((t) => t.value === topic) ?? topics[0]!;

  const reset = () => {
    setReference('');
    setMessage('');
    setAttachments([]);
    setError(null);
  };

  const createTicket = useMutation({
    ...createTicketMutation,
    onSuccess: (ticket) => {
      reset();
      onOpenChange(false);
      toast.success(
        ticket?.ticketNumber
          ? `Đã gửi yêu cầu ${ticket.ticketNumber}. esim.vn đã gửi email xác nhận cho bạn.`
          : 'Đã gửi yêu cầu hỗ trợ. esim.vn đã gửi email xác nhận cho bạn.'
      );
    },
    onError: (e: Error) => toast.error(e.message || 'Không gửi được yêu cầu.')
  });

  const submit = () => {
    if (!message.trim()) {
      setError('Mô tả vấn đề bạn đang gặp.');
      return;
    }
    setError(null);
    createTicket.mutate({
      customerEmail,
      subject: hint.label,
      description: message.trim(),
      ...(reference.trim() ? { orderId: reference.trim() } : {}),
      ...(attachments.length ? { attachments: attachments.map((a) => a.url) } : {})
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[600px]' data-testid='create-ticket-dialog'>
        <DialogHeader>
          <DialogTitle>Tạo yêu cầu hỗ trợ</DialogTitle>
          <DialogDescription>
            Chọn đúng chủ đề để đội phụ trách tiếp nhận và phản hồi nhanh hơn. Phản hồi được gửi cả
            trong trang này và qua email.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='supportTopic'>Chủ đề</Label>
            <Select value={topic} onValueChange={setTopic}>
              <SelectTrigger id='supportTopic' className='w-full'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {topics.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className='bg-muted/40 flex gap-3 rounded-lg border p-3'>
              <Icons.info className='text-muted-foreground mt-0.5 size-4 shrink-0' />
              <div>
                <p className='text-xs font-medium'>Thông tin nên cung cấp</p>
                <p className='text-muted-foreground mt-0.5 text-xs'>{hint.hint}</p>
              </div>
            </div>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='supportReference'>Mã đơn hoặc mã yêu cầu</Label>
            <Input
              id='supportReference'
              placeholder='Không bắt buộc'
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='supportMessage'>
              Nội dung <span className='text-destructive'>*</span>
            </Label>
            <Textarea
              id='supportMessage'
              rows={5}
              placeholder='Mô tả chi tiết vấn đề cần hỗ trợ.'
              value={message}
              aria-invalid={Boolean(error)}
              aria-describedby='supportMessage-error'
              onChange={(e) => {
                setMessage(e.target.value);
                if (error) setError(null);
              }}
            />
            {error ? (
              <p id='supportMessage-error' className='text-destructive text-xs'>
                {error}
              </p>
            ) : (
              <p className='text-muted-foreground text-xs'>
                Ghi rõ thời điểm phát sinh và các bước bạn đã thử.
              </p>
            )}
          </div>

          <div className='space-y-2'>
            <input
              id='newTicketAttachment'
              type='file'
              className='hidden'
              accept='image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt'
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = '';
                if (!file) return;
                setUploading(true);
                try {
                  const url = await uploadAttachment(file);
                  setAttachments((current) => [...current, { name: file.name, url }]);
                } catch (err) {
                  toast.error((err as Error).message);
                } finally {
                  setUploading(false);
                }
              }}
            />
            <div className='flex flex-wrap items-center gap-2'>
              <Button
                size='sm'
                variant='outline'
                asChild
                disabled={uploading || attachments.length >= MAX_FILES}
              >
                <label htmlFor='newTicketAttachment' className='cursor-pointer'>
                  <Icons.upload className='size-4' />
                  {uploading ? 'Đang tải tệp…' : 'Đính kèm tài liệu'}
                </label>
              </Button>
              <span className='text-muted-foreground text-xs'>
                Ảnh, video, PDF, Word, Excel — tối đa {MAX_FILES} tệp.
              </span>
            </div>
            {attachments.length > 0 && (
              <ul className='space-y-1'>
                {attachments.map((a, i) => (
                  <li
                    key={a.url}
                    className='flex items-center justify-between gap-2 rounded-md border px-2 py-1 text-xs'
                  >
                    <span className='truncate'>{a.name}</span>
                    <button
                      type='button'
                      className='text-muted-foreground hover:text-destructive shrink-0'
                      aria-label={`Bỏ ${a.name}`}
                      onClick={() => setAttachments((cur) => cur.filter((_, j) => j !== i))}
                    >
                      <Icons.close className='size-3.5' />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button onClick={submit} isLoading={createTicket.isPending} disabled={uploading}>
            Gửi yêu cầu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function PortalSupportView() {
  const { data: me } = useQuery(myProfileQueryOptions());
  const { data: tickets } = useQuery(myTicketsQueryOptions());

  // Which ticket's conversation is open (#032). Kept by id so the dialog
  // always reads the ticket as the list now has it — a ticket closed while
  // the page was open must lose its reply box (#023).
  const [openTicketId, setOpenTicketId] = useState<number | null>(null);
  const openTicket = (tickets ?? []).find((t) => t.id === openTicketId) ?? null;
  const [creating, setCreating] = useState(false);
  const topics = me?.partnerType === 'distribution' ? DISTRIBUTION_TOPICS : AFFILIATE_TOPICS;
  const isAffiliate = me?.partnerType !== 'distribution';

  const open = useMemo(
    () => (tickets ?? []).filter((t) => t.status !== 'closed' && t.status !== 'resolved').length,
    [tickets]
  );

  return (
    <>
      <TicketThreadDialog ticket={openTicket} onOpenChange={(o) => !o && setOpenTicketId(null)} />
      {me && (
        <CreateTicketDialog
          key={me.partnerType}
          open={creating}
          onOpenChange={setCreating}
          topics={topics}
          customerEmail={me.contactEmail ?? ''}
        />
      )}

      {/* The scroll area sizes its content to the widest child, so the table
          would push the whole page wider than a phone (#023). */}
      <div className='grid min-w-0'>
        <Card data-testid='my-tickets' className='min-w-0'>
          <CardHeader>
            <CardTitle className='col-start-1 flex flex-wrap items-center gap-2'>
              Yêu cầu hỗ trợ của tôi
              <Badge variant='outline'>{(tickets ?? []).length} yêu cầu</Badge>
              {open > 0 && <Badge variant='secondary'>{open} đang mở</Badge>}
            </CardTitle>
            <CardDescription className='col-start-1'>
              Theo dõi trạng thái và phản hồi từ đội vận hành. Email hỗ trợ: partner@esim.vn · phản
              hồi trong 8 giờ làm việc (08:00–18:00, thứ Hai đến thứ Bảy).
            </CardDescription>
            {/* Top right on a wide screen; under the title on a phone. */}
            <CardAction className='col-start-1 row-start-3 justify-self-start sm:col-start-2 sm:row-span-2 sm:row-start-1 sm:justify-self-end'>
              <Button onClick={() => setCreating(true)} disabled={!me}>
                <Icons.add className='size-4' />
                Tạo yêu cầu hỗ trợ
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            <div className='overflow-x-auto rounded-lg border'>
              <Table>
                <TableHeader className='bg-muted'>
                  <TableRow>
                    <TableHead>Mã phiếu</TableHead>
                    <TableHead>Chủ đề</TableHead>
                    <TableHead>Tham chiếu</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Cập nhật</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(tickets ?? []).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className='h-24 text-center'>
                        <p className='text-muted-foreground text-sm'>Chưa có yêu cầu nào.</p>
                        <Button
                          size='sm'
                          variant='outline'
                          className='mt-3'
                          onClick={() => setCreating(true)}
                        >
                          Tạo yêu cầu đầu tiên
                        </Button>
                      </TableCell>
                    </TableRow>
                  )}
                  {(tickets ?? []).map((t) => {
                    const status = TICKET_STATUS[t.status];
                    return (
                      <TableRow
                        key={t.id}
                        className='hover:bg-accent/50 cursor-pointer'
                        onClick={() => setOpenTicketId(t.id)}
                      >
                        {/* The mã phiếu, matching the support emails, so a
                          partner can reconcile the two (#060). */}
                        <TableCell className='font-mono text-xs whitespace-nowrap'>
                          {t.ticketNumber ?? `#${t.id}`}
                        </TableCell>
                        <TableCell>
                          <p className='text-sm font-medium'>{t.subject}</p>
                          <p className='text-muted-foreground line-clamp-1 text-xs'>
                            {t.description}
                          </p>
                        </TableCell>
                        <TableCell className='font-mono text-xs whitespace-nowrap'>
                          {/* The order behind the request opens in the orders
                            list, filtered to it (#023). */}
                          {t.orderId && isAffiliate ? (
                            <Link
                              href={`/dashboard/portal/orders?orderNumber=${encodeURIComponent(t.orderId.trim())}`}
                              className='text-primary underline underline-offset-2'
                              onClick={(e) => e.stopPropagation()}
                            >
                              {t.orderId}
                            </Link>
                          ) : (
                            (t.orderId ?? '—')
                          )}
                        </TableCell>
                        <TableCell>
                          {status ? (
                            <Badge variant='outline' className={status.className}>
                              {status.label}
                            </Badge>
                          ) : (
                            <Badge variant='outline'>{t.status}</Badge>
                          )}
                        </TableCell>
                        <TableCell className='text-xs whitespace-nowrap'>
                          {formatDateTimeVn(t.updatedAt)}
                        </TableCell>
                        <TableCell className='text-right'>
                          <Button size='sm' variant='ghost'>
                            Xem trao đổi
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
