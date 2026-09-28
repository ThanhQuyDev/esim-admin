'use client';

/**
 * Support: raise a request, and track the partner's own tickets.
 *
 * Picking a topic swaps the hint under it — the guidance arrives before the
 * partner writes, not after they submit something unusable.
 */

import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { parseAsStringLiteral, useQueryState } from 'nuqs';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Icons } from '@/components/icons';
import { formatDateTimeVn } from '@/lib/format';

import { createTicketMutation } from '../api/mutations';
import { TicketThreadDialog } from './ticket-thread-dialog';
import type { MyTicket } from '../api/types';
import { myProfileQueryOptions, myTicketsQueryOptions } from '../api/queries';

const TAB_VALUES = ['create', 'mine'] as const;

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

export function PortalSupportView() {
  const { data: me } = useQuery(myProfileQueryOptions());
  const { data: tickets } = useQuery(myTicketsQueryOptions());

  const [tab, setTab] = useQueryState(
    'tab',
    parseAsStringLiteral(TAB_VALUES).withDefault('create').withOptions({ shallow: true })
  );

  // Which ticket's conversation is open (#032).
  const [openTicket, setOpenTicket] = useState<MyTicket | null>(null);
  const topics = me?.partnerType === 'distribution' ? DISTRIBUTION_TOPICS : AFFILIATE_TOPICS;
  const [topic, setTopic] = useState(AFFILIATE_TOPICS[0]!.value);
  const [reference, setReference] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  // A partner who switched programmes could be holding a topic the other list
  // does not have; fall back rather than show an empty hint.
  const hint = topics.find((t) => t.value === topic) ?? topics[0]!;

  const open = useMemo(
    () => (tickets ?? []).filter((t) => t.status !== 'closed' && t.status !== 'resolved').length,
    [tickets]
  );

  const createTicket = useMutation({
    ...createTicketMutation,
    onSuccess: () => {
      setMessage('');
      setReference('');
      setTab('mine');
      toast.success('Đã gửi yêu cầu hỗ trợ.');
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
      customerEmail: me?.contactEmail ?? '',
      subject: hint.label,
      description: message.trim(),
      ...(reference.trim() ? { orderId: reference.trim() } : {})
    });
  };

  return (
    <>
      <TicketThreadDialog
        ticket={openTicket}
        onOpenChange={(open) => !open && setOpenTicket(null)}
      />
      <Tabs value={tab} onValueChange={(v) => setTab(v as (typeof TAB_VALUES)[number])}>
        <TabsList>
          <TabsTrigger value='create'>Tạo yêu cầu</TabsTrigger>
          <TabsTrigger value='mine'>
            Yêu cầu của tôi
            {open > 0 && (
              <Badge variant='secondary' className='ml-2'>
                {open}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value='create' className='mt-4'>
          <div className='grid gap-4 lg:grid-cols-3'>
            <Card className='lg:col-span-2'>
              <CardHeader>
                <CardTitle>Tạo yêu cầu hỗ trợ</CardTitle>
                <CardDescription>
                  Chọn đúng chủ đề để đội phụ trách tiếp nhận và phản hồi nhanh hơn.
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
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
                    rows={6}
                    placeholder='Mô tả chi tiết vấn đề cần hỗ trợ.'
                    value={message}
                    aria-invalid={Boolean(error)}
                    aria-describedby='supportMessage-error'
                    onChange={(e) => {
                      setMessage(e.target.value);
                      if (error) setError(null);
                    }}
                    onBlur={() => setError(message.trim() ? null : 'Mô tả vấn đề bạn đang gặp.')}
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
              </CardContent>
              <CardFooter>
                <Button onClick={submit} isLoading={createTicket.isPending}>
                  Gửi yêu cầu
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className='text-base'>Kênh hỗ trợ đối tác</CardTitle>
                <CardDescription>
                  Mỗi yêu cầu có mã riêng để theo dõi và trao đổi tiếp.
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-3'>
                {[
                  ['Email', 'partner@esim.vn'],
                  ['Thời gian phản hồi', 'Trong 8 giờ làm việc'],
                  ['Giờ hỗ trợ', '08:00–18:00, thứ Hai đến thứ Bảy']
                ].map(([label, value]) => (
                  <div key={label} className='space-y-0.5'>
                    <p className='text-muted-foreground text-xs'>{label}</p>
                    <p className='text-sm font-medium'>{value}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value='mine' className='mt-4'>
          <Card>
            <CardHeader>
              <CardTitle className='flex flex-wrap items-center gap-2'>
                Yêu cầu hỗ trợ của tôi
                <Badge variant='outline'>{(tickets ?? []).length} yêu cầu</Badge>
              </CardTitle>
              <CardDescription>Theo dõi trạng thái và phản hồi từ đội vận hành.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='rounded-lg border'>
                <Table>
                  <TableHeader className='bg-muted'>
                    <TableRow>
                      <TableHead>Mã</TableHead>
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
                            onClick={() => setTab('create')}
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
                          onClick={() => setOpenTicket(t)}
                        >
                          <TableCell className='font-mono text-xs'>#{t.id}</TableCell>
                          <TableCell>
                            <p className='text-sm font-medium'>{t.subject}</p>
                            <p className='text-muted-foreground line-clamp-1 text-xs'>
                              {t.description}
                            </p>
                          </TableCell>
                          <TableCell className='font-mono text-xs'>{t.orderId ?? '—'}</TableCell>
                          <TableCell>
                            {status ? (
                              <Badge variant='outline' className={status.className}>
                                {status.label}
                              </Badge>
                            ) : (
                              <Badge variant='outline'>{t.status}</Badge>
                            )}
                          </TableCell>
                          <TableCell className='whitespace-nowrap text-xs'>
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
        </TabsContent>
      </Tabs>
    </>
  );
}
