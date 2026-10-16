'use client';

/**
 * A distribution partner's eSIM stock — "Quản lý eSIM" (#046).
 *
 * The one screen a marketing partner has no equivalent of: they never hold
 * stock, they never touch an eSIM. A distribution partner does, so they need to
 * see which of the eSIMs they paid for the customer has switched on, which are
 * still sitting unused, and which have run out — an unactivated eSIM is money
 * spent that has not come back yet.
 */

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Textarea } from '@/components/ui/textarea';
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
import { Icons } from '@/components/icons';
import { formatDateTimeVn, formatVnd } from '@/lib/format';

import { reportEsimFaultMutation } from '../api/mutations';
import { myEsimsQueryOptions, partnerPortalKeys } from '../api/queries';
import { uploadAttachment } from '../api/service';
import type { MyEsim } from '../api/types';
import { PLAN_TYPE_LABEL, yesNo } from './portal-catalogue-dialogs';

/** How the provider's status words read to a partner counting stock. */
const statusLabel: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }
> = {
  available: { label: 'Chưa kích hoạt', variant: 'outline' },
  // Local stock handed to the partner, not switched on yet (doitac-1410 #038).
  sold: { label: 'Chưa kích hoạt', variant: 'outline' },
  active: { label: 'Đang dùng', variant: 'default' },
  expired: { label: 'Đã hết hạn', variant: 'destructive' },
  deactivated: { label: 'Đã ngừng', variant: 'secondary' },
  refunded: { label: 'Đã hoàn tiền', variant: 'secondary' }
};

type FaultKind = 'fault' | 'refund';

/** What each request reads as — the subject goes on the support ticket (doitac-1410 #038). */
const FAULT_COPY: Record<FaultKind, { title: string; subject: string; submit: string }> = {
  fault: {
    title: 'Báo lỗi eSIM',
    subject: 'eSIM lỗi hoặc không kích hoạt được',
    submit: 'Gửi báo lỗi'
  },
  refund: {
    title: 'Yêu cầu hoàn tiền',
    subject: 'Hoàn tiền đơn hàng / eSIM lỗi',
    submit: 'Gửi yêu cầu hoàn tiền'
  }
};

const REASON_MAX = 2000;
const MAX_FILES = 5;

const statusFilters = [
  { value: 'all', label: 'Tất cả trạng thái' },
  { value: 'available', label: 'Chưa kích hoạt' },
  { value: 'active', label: 'Đang dùng' },
  { value: 'expired', label: 'Đã hết hạn' },
  { value: 'deactivated', label: 'Đã ngừng' }
];

/** Provider figures are in MB; a partner reads GB. */
function formatData(mb: number | null): string {
  if (mb == null) return '—';
  if (mb >= 1024) return `${(mb / 1024).toFixed(1).replace('.0', '')} GB`;
  return `${Math.round(mb)} MB`;
}

/** "Loại gói eSIM" (doitac-1410 #037). */
const PLAN_TYPE_FILTERS = [
  { value: 'all', label: 'Loại gói: tất cả' },
  { value: 'fixed', label: 'Cố định' },
  { value: 'daily', label: 'Theo ngày' },
  { value: 'unlimited', label: 'Không giới hạn' },
  { value: 'unlimited-reduce', label: 'Không giới hạn giảm tốc' }
];

export function PortalEsimsView() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  // Plan type, top-up and the created range (doitac-1410 #037).
  const [planType, setPlanType] = useState('all');
  const [topUp, setTopUp] = useState('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const filtered = Boolean(
    search.trim() || status !== 'all' || planType !== 'all' || topUp !== 'all' || from || to
  );
  /** eSIM đang được báo lỗi / xin hoàn tiền, hoặc null khi hộp thoại đóng (#046, A4; #038). */
  const [faulty, setFaulty] = useState<{
    iccid: string;
    orderNumber: string;
    kind: FaultKind;
  } | null>(null);
  const [reason, setReason] = useState('');
  const [attachments, setAttachments] = useState<{ name: string; url: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

  const closeFault = () => {
    setFaulty(null);
    setReason('');
    setAttachments([]);
  };

  const reportFault = useMutation({
    ...reportEsimFaultMutation,
    onSuccess: () => {
      toast.success(
        faulty?.kind === 'refund'
          ? 'Đã gửi yêu cầu hoàn tiền. esim.vn sẽ kiểm tra và phản hồi qua phiếu hỗ trợ.'
          : 'Đã gửi báo lỗi. esim.vn sẽ kiểm tra và phản hồi qua phiếu hỗ trợ.'
      );
      closeFault();
      void queryClient.invalidateQueries({ queryKey: partnerPortalKeys.all });
    },
    onError: (error: Error) => toast.error(error.message)
  });

  const { data: esims = [], isLoading } = useQuery(
    myEsimsQueryOptions({
      search: search.trim() || undefined,
      status: status === 'all' ? undefined : status,
      limit: 200,
      ...(planType !== 'all' ? { planType } : {}),
      ...(topUp !== 'all' ? { topUp } : {}),
      ...(from ? { from } : {}),
      ...(to ? { to } : {})
    })
  );

  const totals = useMemo(() => {
    const activated = esims.filter((e) => e.activatedAt).length;
    return {
      count: esims.length,
      activated,
      idle: esims.length - activated,
      costVnd: esims.reduce((sum, e) => sum + e.costVnd, 0)
    };
  }, [esims]);

  return (
    <div className='flex flex-1 flex-col space-y-4'>
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4'>
        <Card>
          <CardHeader>
            <CardDescription>eSIM đã lấy hàng</CardDescription>
            <CardTitle className='text-2xl font-semibold tabular-nums'>
              {isLoading ? '…' : totals.count.toLocaleString('vi-VN')}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Đã kích hoạt</CardDescription>
            <CardTitle className='text-2xl font-semibold tabular-nums'>
              {isLoading ? '…' : totals.activated.toLocaleString('vi-VN')}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Chưa kích hoạt</CardDescription>
            <CardTitle className='text-2xl font-semibold tabular-nums'>
              {isLoading ? '…' : totals.idle.toLocaleString('vi-VN')}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Giá trị đã chi</CardDescription>
            <CardTitle className='text-2xl font-semibold tabular-nums'>
              {isLoading ? '…' : formatVnd(totals.costVnd)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách eSIM</CardTitle>
          <CardDescription>
            eSIM từ các đơn bạn đã mua. Số liệu dung lượng do nhà mạng cập nhật nên có thể chậm hơn
            thực tế vài phút.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'>
            <Input
              placeholder='Tìm ICCID, mã đơn hoặc tên gói'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              data-testid='esim-search'
            />
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className='w-full' aria-label='Trạng thái'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusFilters.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={planType} onValueChange={setPlanType}>
              <SelectTrigger
                className='w-full'
                aria-label='Loại gói eSIM'
                data-testid='esim-plan-type'
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PLAN_TYPE_FILTERS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={topUp} onValueChange={setTopUp}>
              <SelectTrigger className='w-full' aria-label='Hỗ trợ topup' data-testid='esim-topup'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Hỗ trợ topup: tất cả</SelectItem>
                <SelectItem value='true'>Hỗ trợ topup: Có</SelectItem>
                <SelectItem value='false'>Hỗ trợ topup: Không</SelectItem>
              </SelectContent>
            </Select>
            <div className='flex min-w-0 items-center gap-2'>
              <span className='text-muted-foreground shrink-0 text-xs'>Tạo từ</span>
              <Input
                type='date'
                value={from}
                max={to || undefined}
                onChange={(e) => setFrom(e.target.value)}
                aria-label='Thời gian tạo từ'
                className='min-w-0 flex-1'
                data-testid='esim-from'
              />
            </div>
            <div className='flex min-w-0 items-center gap-2'>
              <span className='text-muted-foreground shrink-0 text-xs'>đến</span>
              <Input
                type='date'
                value={to}
                min={from || undefined}
                onChange={(e) => setTo(e.target.value)}
                aria-label='Thời gian tạo đến'
                className='min-w-0 flex-1'
                data-testid='esim-to'
              />
            </div>
          </div>
          {filtered && (
            <Button
              variant='ghost'
              size='sm'
              onClick={() => {
                setSearch('');
                setStatus('all');
                setPlanType('all');
                setTopUp('all');
                setFrom('');
                setTo('');
              }}
            >
              Xoá bộ lọc
            </Button>
          )}

          {isLoading ? (
            <div className='flex justify-center py-12'>
              <Icons.spinner className='size-6 animate-spin' />
            </div>
          ) : esims.length === 0 ? (
            <p className='text-muted-foreground py-12 text-center text-sm'>
              Chưa có eSIM nào khớp với tìm kiếm này.
            </p>
          ) : (
            <div className='overflow-x-auto'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ICCID</TableHead>
                    <TableHead>Tên gói</TableHead>
                    <TableHead>Điểm đến</TableHead>
                    <TableHead>Mã đơn</TableHead>
                    <TableHead className='text-right'>Giá vốn</TableHead>
                    <TableHead>Loại gói</TableHead>
                    <TableHead>Dữ liệu đã dùng</TableHead>
                    <TableHead>Số ngày dùng</TableHead>
                    <TableHead>Call/SMS</TableHead>
                    <TableHead>Topup</TableHead>
                    <TableHead>Tiktok &amp; AI</TableHead>
                    <TableHead>Hoàn tiền</TableHead>
                    <TableHead>Kích hoạt</TableHead>
                    <TableHead>Hết hạn</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className='text-right'>Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {esims.map((esim) => {
                    const badge = statusLabel[esim.status ?? ''] ?? {
                      label: esim.status ?? '—',
                      variant: 'outline' as const
                    };
                    return (
                      <TableRow key={`${esim.iccid}-${esim.orderNumber}`}>
                        <TableCell className='font-mono text-xs'>{esim.iccid ?? '—'}</TableCell>
                        <TableCell>{esim.planName ?? '—'}</TableCell>
                        <TableCell>{esim.destination ?? '—'}</TableCell>
                        <TableCell className='font-mono text-xs'>
                          {esim.orderNumber ?? '—'}
                        </TableCell>
                        <TableCell className='text-right tabular-nums'>
                          {formatVnd(esim.costVnd)}
                        </TableCell>
                        <TableCell className='text-xs whitespace-nowrap'>
                          {PLAN_TYPE_LABEL[esim.planType ?? ''] ?? esim.planType ?? '—'}
                        </TableCell>
                        <TableCell className='text-xs whitespace-nowrap'>
                          {formatData(esim.dataUsed)} / {formatData(esim.dataTotal)}
                        </TableCell>
                        <TableCell className='text-xs tabular-nums'>
                          {esim.durationDays ? `${esim.durationDays} ngày` : '—'}
                        </TableCell>
                        <TableCell className='text-xs'>{yesNo(esim.hasCallSms)}</TableCell>
                        <TableCell className='text-xs'>{yesNo(esim.topUp)}</TableCell>
                        <TableCell className='text-xs'>{yesNo(esim.tiktokAi)}</TableCell>
                        <TableCell className='text-xs'>{yesNo(esim.refundable)}</TableCell>
                        <TableCell className='text-xs'>
                          {esim.activatedAt ? formatDateTimeVn(esim.activatedAt) : '—'}
                        </TableCell>
                        <TableCell className='text-xs'>
                          {esim.expiresAt ? formatDateTimeVn(esim.expiresAt) : '—'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={badge.variant}>{badge.label}</Badge>
                        </TableCell>
                        <TableCell className='text-right'>
                          {esim.iccid && esim.orderNumber ? (
                            <EsimActions
                              esim={esim}
                              onRequest={(kind) =>
                                setFaulty({
                                  iccid: esim.iccid!,
                                  orderNumber: esim.orderNumber!,
                                  kind
                                })
                              }
                            />
                          ) : (
                            <span className='text-muted-foreground text-xs'>—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={faulty !== null} onOpenChange={(open) => !open && closeFault()}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>{FAULT_COPY[faulty?.kind ?? 'fault'].title}</DialogTitle>
            <DialogDescription>
              Yêu cầu được gửi thành phiếu hỗ trợ. esim.vn kiểm tra với nhà cung cấp rồi mới hoàn
              tiền vào ví — phiếu này không trừ hay cộng tiền ngay.
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-3'>
            <div className='space-y-2'>
              <Label htmlFor='fault-subject'>Tiêu đề</Label>
              <Input
                id='fault-subject'
                tabIndex={-1}
                readOnly
                value={FAULT_COPY[faulty?.kind ?? 'fault'].subject}
              />
            </div>
            <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
              <div className='space-y-2'>
                <Label htmlFor='fault-order'>Mã đơn hàng</Label>
                <Input
                  id='fault-order'
                  tabIndex={-1}
                  readOnly
                  className='font-mono'
                  value={faulty?.orderNumber ?? ''}
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='fault-iccid'>ICCID</Label>
                <Input
                  id='fault-iccid'
                  tabIndex={-1}
                  readOnly
                  className='font-mono'
                  value={faulty?.iccid ?? ''}
                />
              </div>
            </div>
            <div className='space-y-2'>
              <Label htmlFor='fault-reason'>Mô tả</Label>
              <Textarea
                id='fault-reason'
                rows={4}
                maxLength={REASON_MAX}
                placeholder='Ví dụ: quét QR báo mã đã được dùng'
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
              <p className='text-muted-foreground text-right text-xs tabular-nums'>
                {reason.length}/{REASON_MAX}
              </p>
            </div>
            <div className='space-y-2'>
              <input
                id='faultAttachment'
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
                  <label htmlFor='faultAttachment' className='cursor-pointer'>
                    <Icons.upload className='size-4' />
                    {uploading ? 'Đang tải tệp…' : 'Đính kèm tài liệu'}
                  </label>
                </Button>
                <span className='text-muted-foreground text-xs'>
                  Ảnh chụp màn hình, video… tối đa {MAX_FILES} tệp
                </span>
              </div>
              {attachments.length > 0 && (
                <ul className='space-y-1 text-xs' data-testid='fault-attachments'>
                  {attachments.map((file, index) => (
                    <li key={file.url} className='flex items-center justify-between gap-2'>
                      <span className='truncate'>{file.name}</span>
                      <Button
                        variant='ghost'
                        size='sm'
                        className='h-auto p-0 text-xs'
                        onClick={() =>
                          setAttachments((current) => current.filter((_, i) => i !== index))
                        }
                      >
                        Bỏ
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant='outline' onClick={closeFault}>
              Huỷ
            </Button>
            <Button
              disabled={reason.trim().length < 5 || reportFault.isPending || uploading}
              onClick={() =>
                faulty &&
                reportFault.mutate({
                  orderNumber: faulty.orderNumber,
                  iccid: faulty.iccid,
                  reason: reason.trim(),
                  kind: faulty.kind,
                  attachments: attachments.map((file) => file.url)
                })
              }
            >
              {reportFault.isPending ? 'Đang gửi…' : FAULT_COPY[faulty?.kind ?? 'fault'].submit}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/**
 * "Xem chi tiết", "Báo lỗi", "Yêu cầu hoàn tiền" on one eSIM (doitac-1410 #038).
 * A refunded eSIM, or one with a request still open, takes no new request; a
 * plan the supplier never refunds cannot ask for one.
 */
function EsimActions({ esim, onRequest }: { esim: MyEsim; onRequest: (kind: FaultKind) => void }) {
  const closed = esim.status === 'refunded';
  const pending = Boolean(esim.openReport);
  const blockedReason = closed
    ? 'eSIM đã được hoàn tiền'
    : pending
      ? 'Đang có yêu cầu chờ esim.vn xử lý'
      : undefined;
  return (
    <div className='flex flex-col items-end gap-1 whitespace-nowrap'>
      <Button variant='link' size='sm' className='h-auto p-0 text-xs' asChild>
        <Link href={`/dashboard/portal/esims/${encodeURIComponent(esim.iccid ?? '')}`}>
          Xem chi tiết
        </Link>
      </Button>
      <Button
        variant='ghost'
        size='sm'
        className='h-auto p-0 text-xs'
        disabled={closed || pending}
        title={blockedReason}
        onClick={() => onRequest('fault')}
      >
        Báo lỗi
      </Button>
      <Button
        variant='ghost'
        size='sm'
        className='h-auto p-0 text-xs'
        disabled={closed || pending || !esim.refundable}
        title={blockedReason ?? (esim.refundable ? undefined : 'Gói này không hỗ trợ hoàn tiền')}
        onClick={() => onRequest('refund')}
      >
        Yêu cầu hoàn tiền
      </Button>
      {pending && (
        <span className='text-muted-foreground text-[11px]'>
          {esim.openReport === 'refund' ? 'Đang chờ hoàn tiền' : 'Đang chờ xử lý lỗi'}
        </span>
      )}
    </div>
  );
}
