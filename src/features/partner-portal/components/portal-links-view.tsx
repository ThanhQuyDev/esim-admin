'use client';

/**
 * Marketing links: the builder, the QR for the selected link, and the list of
 * links with their performance.
 */

import { useMemo, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
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
import { Icons } from '@/components/icons';
import { formatVnd } from '@/lib/format';

import { createLinkMutation, updateLinkMutation } from '../api/mutations';
import { myLinksQueryOptions, myProfileQueryOptions, partnerPortalKeys } from '../api/queries';
import type { MyLink } from '../api/types';

const CHANNELS = [
  { value: 'youtube', label: 'YouTube' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'website', label: 'Trang web' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'threads', label: 'Threads' },
  { value: 'other', label: 'Kênh khác' }
];

const EMPTY_FORM = { landing: '', label: '', channel: 'youtube', subid: '', code: '' };

/** Bounds the API enforces for a code the partner names themselves (#014). */
const CODE_MIN = 8;
const CODE_MAX = 50;
const CODE_PATTERN = /^[A-Za-z0-9]+$/;

function shortLinkOf(code: string): string {
  return `esim.vn/r/${code}`;
}

/**
 * Fold the channel and sub-id into the destination: the links API stores a
 * label and a target path and nothing else, so this is where they survive.
 */
function buildTargetPath(landing: string, channel: string, subid: string): string | undefined {
  const trimmed = landing.trim();
  if (!trimmed) return undefined;
  try {
    const url = new URL(trimmed, 'https://esim.vn');
    if (channel) url.searchParams.set('utm_source', channel);
    if (subid.trim()) url.searchParams.set('subid', subid.trim());
    return `${url.pathname}${url.search}`;
  } catch {
    return trimmed;
  }
}

/** Read the channel back out of a stored target path. */
function channelOf(targetPath: string | null): string {
  if (!targetPath) return '—';
  const source = new URLSearchParams(targetPath.split('?')[1] ?? '').get('utm_source');
  return CHANNELS.find((c) => c.value === source)?.label ?? source ?? '—';
}

export function PortalLinksView() {
  const queryClient = useQueryClient();
  const { data: links, isLoading } = useQuery(myLinksQueryOptions());

  const [form, setForm] = useState(EMPTY_FORM);
  const [labelError, setLabelError] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);
  // Only partners an admin ticked may name their own code (#014).
  const { data: me } = useQuery(myProfileQueryOptions());
  const mayNameCode = Boolean(me?.canCustomLinkCode);
  const [qrLink, setQrLink] = useState('');

  const allRows = useMemo(() => links ?? [], [links]);

  // Filter by campaign name and landing page (#015). A partner running a
  // dozen campaigns at once was left scrolling to find the one link they
  // needed to copy.
  const [filters, setFilters] = useState({ label: '', landing: '' });
  const rows = useMemo(() => {
    const label = filters.label.trim().toLowerCase();
    const landing = filters.landing.trim().toLowerCase();
    if (!label && !landing) return allRows;

    return allRows.filter((r) => {
      const matchesLabel = !label || (r.label ?? '').toLowerCase().includes(label);
      // The landing page is the path before the utm parameters the portal adds.
      const path = (r.targetPath ?? '').split('?')[0].toLowerCase();
      const matchesLanding =
        !landing || path.includes(landing) || (r.code ?? '').toLowerCase().includes(landing);
      return matchesLabel && matchesLanding;
    });
  }, [allRows, filters]);
  const qrValue = qrLink || (allRows[0] ? `https://${shortLinkOf(allRows[0].code)}` : '');

  const createLink = useMutation({
    ...createLinkMutation,
    onSuccess: (created: MyLink) => {
      queryClient.invalidateQueries({ queryKey: partnerPortalKeys.links() });
      setQrLink(`https://${shortLinkOf(created.code)}`);
      setForm(EMPTY_FORM);
      toast.success('Đã tạo liên kết tiếp thị.');
    },
    onError: (e: Error) => toast.error(e.message || 'Không tạo được liên kết.')
  });

  const deactivate = useMutation({
    ...updateLinkMutation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: partnerPortalKeys.links() });
      toast.success('Đã tắt liên kết.');
    },
    onError: (e: Error) => toast.error(e.message || 'Không tắt được liên kết.')
  });

  const submit = () => {
    if (!form.label.trim()) {
      setLabelError('Nhập tên để nhận ra liên kết này về sau.');
      return;
    }

    const code = form.code.trim();
    if (mayNameCode && code) {
      if (code.length < CODE_MIN || code.length > CODE_MAX) {
        setCodeError(`Tên link cần ${CODE_MIN}–${CODE_MAX} ký tự.`);
        return;
      }
      if (!CODE_PATTERN.test(code)) {
        setCodeError('Tên link chỉ gồm chữ và số, không dấu và không khoảng trắng.');
        return;
      }
    }
    setCodeError(null);

    createLink.mutate({
      label: form.label.trim(),
      targetPath: buildTargetPath(form.landing, form.channel, form.subid),
      ...(mayNameCode && code ? { code } : {})
    });
  };

  const copy = async (text: string, message: string) => {
    await navigator.clipboard?.writeText(text);
    toast.success(message);
  };

  const downloadQr = () => {
    const canvas = document.querySelector<HTMLCanvasElement>('#portalQrCanvas');
    if (!canvas) return;
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = 'partner-qr.png';
    a.click();
  };

  const totals = rows.reduce(
    (acc, r) => ({
      clicks: acc.clicks + r.clickCount,
      conversions: acc.conversions + r.conversionCount,
      commission: acc.commission + r.totalCommissionVnd
    }),
    { clicks: 0, conversions: 0, commission: 0 }
  );

  return (
    <div className='flex flex-1 flex-col space-y-4'>
      <div className='grid gap-4 lg:grid-cols-3'>
        <Card className='lg:col-span-2'>
          <CardHeader>
            <CardTitle>Tạo liên kết tiếp thị</CardTitle>
            <CardDescription>
              Dán đường dẫn sản phẩm trên esim.vn để sinh liên kết có mã theo dõi riêng.
            </CardDescription>
          </CardHeader>
          <CardContent className='grid gap-4 md:grid-cols-2'>
            <div className='space-y-2 md:col-span-2'>
              <Label htmlFor='landing'>Đường dẫn sản phẩm</Label>
              <Input
                id='landing'
                type='url'
                placeholder='https://esim.vn/esim/nhat-ban'
                value={form.landing}
                onChange={(e) => setForm({ ...form, landing: e.target.value })}
              />
              <p className='text-muted-foreground text-xs'>
                Để trống nếu muốn liên kết trỏ về trang chủ esim.vn.
              </p>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='linkLabel'>
                Tên liên kết <span className='text-destructive'>*</span>
              </Label>
              <Input
                id='linkLabel'
                placeholder='Ví dụ: Video Nhật Bản tháng 8'
                value={form.label}
                aria-invalid={Boolean(labelError)}
                aria-describedby='linkLabel-error'
                onChange={(e) => {
                  setForm({ ...form, label: e.target.value });
                  if (labelError) setLabelError(null);
                }}
                onBlur={() =>
                  setLabelError(form.label.trim() ? null : 'Nhập tên để nhận ra liên kết này.')
                }
              />
              {labelError && (
                <p id='linkLabel-error' className='text-destructive text-xs'>
                  {labelError}
                </p>
              )}
            </div>

            {mayNameCode && (
              <div className='space-y-2'>
                <Label htmlFor='linkCode'>Tên link tùy chọn</Label>
                <div className='flex items-center gap-2'>
                  <span className='text-muted-foreground shrink-0 text-sm'>esim.vn/r/</span>
                  <Input
                    id='linkCode'
                    placeholder='TENCHIENDICH'
                    value={form.code}
                    aria-invalid={Boolean(codeError)}
                    aria-describedby='linkCode-help linkCode-error'
                    onChange={(e) => {
                      setForm({ ...form, code: e.target.value });
                      if (codeError) setCodeError(null);
                    }}
                  />
                </div>
                {codeError ? (
                  <p id='linkCode-error' className='text-destructive text-xs'>
                    {codeError}
                  </p>
                ) : (
                  <p id='linkCode-help' className='text-muted-foreground text-xs'>
                    {CODE_MIN}–{CODE_MAX} ký tự, chỉ chữ và số, duy nhất trên hệ thống. Bỏ trống thì
                    hệ thống tự tạo mã.
                  </p>
                )}
              </div>
            )}

            <div className='space-y-2'>
              <Label htmlFor='channel'>Kênh quảng bá</Label>
              <Select
                value={form.channel}
                onValueChange={(value) => setForm({ ...form, channel: value })}
              >
                <SelectTrigger id='channel' className='w-full'>
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

            <div className='space-y-2 md:col-span-2'>
              <Label htmlFor='subid'>Mã phân biệt nguồn</Label>
              <Input
                id='subid'
                maxLength={60}
                placeholder='Ví dụ: youtube_nhatban_01'
                value={form.subid}
                onChange={(e) => setForm({ ...form, subid: e.target.value })}
              />
              <p className='text-muted-foreground text-xs'>
                Không bắt buộc. Dùng khi bạn muốn tách hiệu suất của nhiều nội dung trên cùng một
                kênh.
              </p>
            </div>
          </CardContent>
          <CardFooter className='gap-2'>
            <Button onClick={submit} isLoading={createLink.isPending}>
              <Icons.add />
              Tạo liên kết
            </Button>
            <Button variant='outline' onClick={() => setForm(EMPTY_FORM)}>
              Đặt lại
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Icons.qrCode className='size-4' />
              Mã QR
            </CardTitle>
            <CardDescription>
              Đơn phát sinh sau khi khách quét QR vẫn ghi nhận đúng liên kết gốc.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='bg-muted/40 flex items-center justify-center rounded-lg border p-6'>
              {qrValue ? (
                <QRCodeCanvas id='portalQrCanvas' value={qrValue} size={160} level='M' />
              ) : (
                <p className='text-muted-foreground py-8 text-center text-xs'>
                  Tạo một liên kết để sinh mã QR.
                </p>
              )}
            </div>
            <div className='space-y-2'>
              <Label htmlFor='qrLink'>Liên kết trong mã</Label>
              <Input
                id='qrLink'
                value={qrValue}
                placeholder='https://esim.vn/r/...'
                onChange={(e) => setQrLink(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter className='gap-2'>
            <Button
              size='sm'
              variant='outline'
              disabled={!qrValue}
              onClick={() => copy(qrValue, 'Đã sao chép liên kết.')}
            >
              <Icons.copy />
              Sao chép
            </Button>
            <Button size='sm' disabled={!qrValue} onClick={downloadQr}>
              <Icons.download />
              Tải PNG
            </Button>
          </CardFooter>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className='flex flex-wrap items-center gap-2'>
            Danh sách liên kết
            <Badge variant='outline'>
              {rows.length === allRows.length
                ? `${allRows.length} liên kết`
                : `${rows.length}/${allRows.length} liên kết`}
            </Badge>
          </CardTitle>
          <CardDescription>
            {totals.clicks.toLocaleString('vi-VN')} lượt nhấp ·{' '}
            {totals.conversions.toLocaleString('vi-VN')} đơn · {formatVnd(totals.commission)} hoa
            hồng
          </CardDescription>
          <CardAction>
            <Badge variant='secondary'>
              {rows.filter((r) => r.status === 'active').length} đang chạy
            </Badge>
          </CardAction>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid gap-3 sm:grid-cols-2 lg:max-w-2xl'>
            <div className='space-y-1.5'>
              <Label htmlFor='filterLabel'>Tên chiến dịch</Label>
              <Input
                id='filterLabel'
                placeholder='Ví dụ: Video Nhật Bản'
                value={filters.label}
                onChange={(e) => setFilters({ ...filters, label: e.target.value })}
              />
            </div>
            <div className='space-y-1.5'>
              <Label htmlFor='filterLanding'>Trang đích hoặc tên link</Label>
              <Input
                id='filterLanding'
                placeholder='/esim-nhat-ban'
                value={filters.landing}
                onChange={(e) => setFilters({ ...filters, landing: e.target.value })}
              />
            </div>
          </div>

          <div className='rounded-lg border'>
            <Table>
              <TableHeader className='bg-muted'>
                <TableRow>
                  <TableHead>Tên liên kết</TableHead>
                  <TableHead>Link rút gọn</TableHead>
                  <TableHead>Kênh</TableHead>
                  <TableHead className='text-right'>Nhấp</TableHead>
                  <TableHead className='text-right'>Đơn</TableHead>
                  <TableHead className='text-right'>Hoa hồng</TableHead>
                  <TableHead className='text-right'>Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={7} className='text-muted-foreground h-24 text-center'>
                      Đang tải liên kết…
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className='h-24 text-center'>
                      {allRows.length === 0 ? (
                        <>
                          <p className='text-muted-foreground text-sm'>Chưa có liên kết nào.</p>
                          <p className='text-muted-foreground mt-1 text-xs'>
                            Tạo liên kết đầu tiên ở khung phía trên để bắt đầu theo dõi hiệu suất.
                          </p>
                        </>
                      ) : (
                        <>
                          <p className='text-muted-foreground text-sm'>
                            Không có liên kết nào khớp bộ lọc.
                          </p>
                          <Button
                            size='sm'
                            variant='outline'
                            className='mt-2'
                            onClick={() => setFilters({ label: '', landing: '' })}
                          >
                            Xóa bộ lọc
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                )}
                {rows.map((r) => (
                  <TableRow key={r.id} className={r.status === 'active' ? undefined : 'opacity-60'}>
                    <TableCell>
                      <div className='flex items-center gap-2'>
                        <span className='font-medium'>{r.label}</span>
                        {r.status !== 'active' && <Badge variant='secondary'>Đã tắt</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className='font-mono text-xs'>{shortLinkOf(r.code)}</TableCell>
                    <TableCell>{channelOf(r.targetPath)}</TableCell>
                    <TableCell className='text-right tabular-nums'>
                      {r.clickCount.toLocaleString('vi-VN')}
                    </TableCell>
                    <TableCell className='text-right tabular-nums'>
                      {r.conversionCount.toLocaleString('vi-VN')}
                    </TableCell>
                    <TableCell className='text-right font-medium tabular-nums'>
                      {formatVnd(r.totalCommissionVnd)}
                    </TableCell>
                    <TableCell>
                      <div className='flex justify-end gap-1'>
                        <Button
                          size='sm'
                          variant='ghost'
                          onClick={() =>
                            copy(`https://${shortLinkOf(r.code)}`, 'Đã sao chép liên kết.')
                          }
                        >
                          <Icons.copy />
                          Sao chép
                        </Button>
                        {r.status === 'active' && (
                          <Button
                            size='sm'
                            variant='ghost'
                            className='text-destructive hover:text-destructive'
                            onClick={() =>
                              deactivate.mutate({ id: r.id, data: { isActive: false } })
                            }
                          >
                            Tắt
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
