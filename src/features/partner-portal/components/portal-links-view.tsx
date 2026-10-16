'use client';
import { downloadFilename } from '@/lib/download-filename';

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
import { formatDateTimeVn, formatDateVn, formatVnd } from '@/lib/format';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { createLinkMutation, updateLinkMutation } from '../api/mutations';
import { exportMyLinks, restoreMyLink } from '../api/service';
import {
  myFilteredLinksQueryOptions,
  myProfileQueryOptions,
  partnerPortalKeys
} from '../api/queries';
import type { MyLink } from '../api/types';
import {
  AppealLinkDialog,
  DeleteLinkDialog,
  EditLinkDialog,
  LinkDetailDialog,
  PauseLinkDialog,
  RestoreRequestDialog
} from './portal-link-dialogs';
import { ChannelPerformanceCard, DeletedLinksTable } from './portal-links-extra';
import {
  CHANNELS,
  LINK_PERIODS,
  LINK_STATE,
  type LinkPeriod,
  buildTargetPath,
  channelOf,
  landingOf,
  linkState,
  periodRange,
  shortLinkOf
} from './portal-link-utils';

const EMPTY_FORM = { landing: '', label: '', channel: 'youtube', subid: '', code: '' };

/** Bounds the API enforces for a code the partner names themselves (#014). */
const CODE_MIN = 8;
const CODE_MAX = 50;
const CODE_PATTERN = /^[A-Za-z0-9]+$/;

/** The list's order (doitac-1410 #018). */
const SORTS = [
  { value: 'updated', label: 'Cập nhật gần nhất' },
  { value: 'created', label: 'Mới tạo' },
  { value: 'orders', label: 'Nhiều đơn nhất' },
  { value: 'commission', label: 'Hoa hồng cao nhất' },
  { value: 'lastClick', label: 'Lần nhấp gần nhất' }
];

const STATUSES = [
  { value: 'all', label: 'Tất cả trạng thái' },
  { value: 'active', label: 'Hoạt động' },
  { value: 'inactive', label: 'Tạm tắt' },
  { value: 'suspended', label: 'Bị đình chỉ' }
];

type Popup = {
  kind: 'detail' | 'edit' | 'pause' | 'delete' | 'appeal' | 'restoreRequest';
  link: MyLink;
} | null;

export function PortalLinksView() {
  const queryClient = useQueryClient();
  // Filters, quick period and order go to the server (doitac-1410 #018); the
  // text search stays in the browser.
  const [status, setStatus] = useState('all');
  const [channelFilter, setChannelFilter] = useState('all');
  const [period, setPeriod] = useState<LinkPeriod>('all');
  const [createdFrom, setCreatedFrom] = useState('');
  const [createdTo, setCreatedTo] = useState('');
  const [sort, setSort] = useState('created');
  const query = useMemo(
    () => ({
      // Deleted links have their own tab (doitac-1410 #019).
      status: status !== 'all' ? status : 'live',
      ...(channelFilter !== 'all' ? { channel: channelFilter } : {}),
      ...periodRange(period),
      ...(createdFrom ? { createdFrom } : {}),
      ...(createdTo ? { createdTo } : {}),
      sort
    }),
    [status, channelFilter, period, createdFrom, createdTo, sort]
  );
  const { data: links, isLoading } = useQuery(myFilteredLinksQueryOptions(query));
  const [popup, setPopup] = useState<Popup>(null);
  const [tab, setTab] = useState<'live' | 'deleted'>('live');
  const { data: deletedLinks = [], isLoading: deletedLoading } = useQuery(
    myFilteredLinksQueryOptions({ status: 'deleted', sort: 'updated' })
  );

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
  const [filters, setFilters] = useState({ label: '' });
  const rows = useMemo(() => {
    const text = filters.label.trim().toLowerCase();
    if (!text) return allRows;
    return allRows.filter((r) =>
      [r.label ?? '', (r.targetPath ?? '').split('?')[0], r.code ?? ''].some((v) =>
        v.toLowerCase().includes(text)
      )
    );
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

  // One button that turns a link off and back on (#016): a partner pausing a
  // campaign for a week should not have to create a new link to resume it.
  const toggleLink = useMutation({
    ...updateLinkMutation,
    onSuccess: (updated: MyLink) => {
      queryClient.invalidateQueries({ queryKey: partnerPortalKeys.links() });
      toast.success(updated.status === 'active' ? 'Đã mở lại liên kết.' : 'Đã tắt liên kết.');
    },
    onError: (e: Error) => toast.error(e.message || 'Không đổi được trạng thái liên kết.')
  });

  const [exporting, setExporting] = useState(false);
  const restore = useMutation({
    mutationFn: (id: number) => restoreMyLink(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: partnerPortalKeys.links() });
      toast.success('Đã khôi phục liên kết.');
    },
    onError: (e: Error) => toast.error(e.message || 'Không khôi phục được liên kết.')
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
    a.download = downloadFilename('Ma-QR-lien-ket', 'png');
    a.click();
  };

  // Numbers, not the text a decimal column arrives as: summed as text the
  // commission read a million times too large (doitac-1410 #018).
  const totals = rows.reduce(
    (acc, r) => ({
      clicks: acc.clicks + Number(r.periodClicks ?? r.clickCount ?? 0),
      conversions: acc.conversions + Number(r.periodOrders ?? r.conversionCount ?? 0),
      commission: acc.commission + Number(r.periodCommissionVnd ?? r.totalCommissionVnd ?? 0)
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
                  <span className='text-muted-foreground shrink-0 text-sm'>esim.vn/go/</span>
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
                placeholder='https://esim.vn/go/...'
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

      {popup?.kind === 'detail' && (
        <LinkDetailDialog
          link={popup.link}
          onClose={() => setPopup(null)}
          onEdit={() => setPopup({ kind: 'edit', link: popup.link })}
          onPause={() => setPopup({ kind: 'pause', link: popup.link })}
          onResume={() => {
            toggleLink.mutate({ id: popup.link.id, data: { isActive: true } });
            setPopup(null);
          }}
          onDelete={() => setPopup({ kind: 'delete', link: popup.link })}
        />
      )}
      {popup?.kind === 'edit' && (
        <EditLinkDialog link={popup.link} onClose={() => setPopup(null)} />
      )}
      {popup?.kind === 'pause' && (
        <PauseLinkDialog link={popup.link} onClose={() => setPopup(null)} />
      )}
      {popup?.kind === 'delete' && (
        <DeleteLinkDialog
          link={popup.link}
          onClose={() => setPopup(null)}
          onPauseInstead={() => setPopup({ kind: 'pause', link: popup.link })}
        />
      )}
      {popup?.kind === 'appeal' && (
        <AppealLinkDialog link={popup.link} onClose={() => setPopup(null)} />
      )}
      {popup?.kind === 'restoreRequest' && (
        <RestoreRequestDialog link={popup.link} onClose={() => setPopup(null)} />
      )}

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
          <CardDescription data-testid='links-totals'>
            {totals.clicks.toLocaleString('vi-VN')} lượt nhấp ·{' '}
            {totals.conversions.toLocaleString('vi-VN')} đơn · {formatVnd(totals.commission)} hoa
            hồng · {LINK_PERIODS.find((p) => p.value === period)?.label.toLowerCase()}
          </CardDescription>
          <CardAction className='flex items-center gap-2'>
            <Badge variant='secondary'>
              {rows.filter((r) => linkState(r) === 'active').length} đang chạy
            </Badge>
            <Button
              size='sm'
              variant='outline'
              disabled={exporting || allRows.length === 0}
              onClick={async () => {
                setExporting(true);
                try {
                  await exportMyLinks();
                } catch (e) {
                  toast.error((e as Error).message);
                } finally {
                  setExporting(false);
                }
              }}
            >
              {exporting ? <Icons.spinner className='animate-spin' /> : <Icons.download />}
              Xuất Excel
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className='space-y-4'>
          {/* Links in use, and the deleted ones apart (doitac-1410 #019). */}
          <Tabs value={tab} onValueChange={(v) => setTab(v as 'live' | 'deleted')}>
            <TabsList>
              <TabsTrigger value='live'>Đang dùng</TabsTrigger>
              <TabsTrigger value='deleted' data-testid='tab-deleted'>
                Đã xóa ({deletedLinks.length})
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {tab === 'deleted' ? (
            <DeletedLinksTable
              links={deletedLinks}
              isLoading={deletedLoading}
              onDetail={(l) => setPopup({ kind: 'detail', link: l })}
              onRestore={(l) => restore.mutate(l.id)}
              onRequestRestore={(l) => setPopup({ kind: 'restoreRequest', link: l })}
              restoring={restore.isPending}
            />
          ) : (
            <>
              {/* Thống kê nhanh: the window the clicks, orders and commission cover. */}
              <Tabs value={period} onValueChange={(v) => setPeriod(v as LinkPeriod)}>
                <TabsList className='h-auto flex-wrap'>
                  {LINK_PERIODS.map((p) => (
                    <TabsTrigger key={p.value} value={p.value}>
                      {p.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>

              <div
                className='grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4'
                data-testid='links-filters'
              >
                <div className='space-y-1.5'>
                  <Label htmlFor='filterLabel'>Tên liên kết, trang đích</Label>
                  <Input
                    id='filterLabel'
                    placeholder='Ví dụ: Video Nhật Bản'
                    value={filters.label}
                    onChange={(e) => setFilters({ ...filters, label: e.target.value })}
                  />
                </div>
                <div className='space-y-1.5'>
                  <Label htmlFor='filterStatus'>Trạng thái</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger id='filterStatus' className='w-full'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className='space-y-1.5'>
                  <Label htmlFor='filterChannel'>Kênh tiếp thị</Label>
                  <Select value={channelFilter} onValueChange={setChannelFilter}>
                    <SelectTrigger id='filterChannel' className='w-full'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>Tất cả kênh</SelectItem>
                      {CHANNELS.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className='space-y-1.5'>
                  <Label htmlFor='filterSort'>Sắp xếp</Label>
                  <Select value={sort} onValueChange={setSort}>
                    <SelectTrigger id='filterSort' className='w-full'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SORTS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className='space-y-1.5 sm:col-span-2'>
                  <Label>Thời gian tạo</Label>
                  <div className='flex items-center gap-2'>
                    <Input
                      type='date'
                      className='min-w-0 flex-1'
                      aria-label='Tạo từ ngày'
                      value={createdFrom}
                      onChange={(e) => setCreatedFrom(e.target.value)}
                    />
                    <span className='text-muted-foreground text-sm'>–</span>
                    <Input
                      type='date'
                      className='min-w-0 flex-1'
                      aria-label='Tạo đến ngày'
                      value={createdTo}
                      onChange={(e) => setCreatedTo(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className='overflow-x-auto rounded-lg border'>
                <Table>
                  <TableHeader className='bg-muted'>
                    <TableRow>
                      <TableHead>Tên liên kết</TableHead>
                      <TableHead>Trang đích</TableHead>
                      <TableHead>Link tiếp thị</TableHead>
                      <TableHead>Kênh quảng bá</TableHead>
                      <TableHead>Thời gian</TableHead>
                      <TableHead className='text-right'>Nhấp</TableHead>
                      <TableHead className='text-right'>Đơn</TableHead>
                      <TableHead className='text-right'>Hoa hồng</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead className='text-right'>Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading && (
                      <TableRow>
                        <TableCell colSpan={10} className='text-muted-foreground h-24 text-center'>
                          Đang tải liên kết…
                        </TableCell>
                      </TableRow>
                    )}
                    {!isLoading && rows.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={10} className='h-24 text-center'>
                          <p className='text-muted-foreground text-sm'>
                            Không có liên kết nào khớp bộ lọc.
                          </p>
                        </TableCell>
                      </TableRow>
                    )}
                    {rows.map((r) => {
                      const state = linkState(r);
                      const restorable =
                        state === 'deleted' &&
                        r.restorableUntil &&
                        new Date(r.restorableUntil).getTime() > Date.now();
                      return (
                        <TableRow
                          key={r.id}
                          className={state === 'active' ? undefined : 'opacity-70'}
                          data-testid={`link-row-${r.id}`}
                        >
                          <TableCell className='font-medium'>{r.label}</TableCell>
                          <TableCell className='text-muted-foreground max-w-[200px] truncate text-xs'>
                            {landingOf(r.targetPath)}
                          </TableCell>
                          <TableCell className='font-mono text-xs whitespace-nowrap'>
                            {shortLinkOf(r.code)}
                          </TableCell>
                          <TableCell className='text-xs'>{channelOf(r.targetPath)}</TableCell>
                          <TableCell className='text-xs whitespace-nowrap'>
                            <span className='block'>{formatDateTimeVn(r.createdAt)}</span>
                            <span className='text-muted-foreground block'>
                              {r.lastChangedAt ? formatDateTimeVn(r.lastChangedAt) : '—'}
                            </span>
                          </TableCell>
                          <TableCell className='text-right tabular-nums'>
                            {Number(r.periodClicks ?? r.clickCount ?? 0).toLocaleString('vi-VN')}
                          </TableCell>
                          <TableCell className='text-right tabular-nums'>
                            {Number(r.periodOrders ?? r.conversionCount ?? 0).toLocaleString(
                              'vi-VN'
                            )}
                          </TableCell>
                          <TableCell className='text-right font-medium tabular-nums'>
                            {formatVnd(Number(r.periodCommissionVnd ?? r.totalCommissionVnd ?? 0))}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={LINK_STATE[state].variant}
                              data-testid={`link-status-${r.id}`}
                            >
                              {LINK_STATE[state].label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className='flex justify-end gap-1'>
                              {/* No copying a link that earns nothing (doitac-1410 #018). */}
                              {state !== 'suspended' && state !== 'deleted' && (
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
                              )}
                              <Button
                                size='sm'
                                variant='ghost'
                                onClick={() => setPopup({ kind: 'detail', link: r })}
                              >
                                Xem chi tiết
                              </Button>
                              {(state === 'active' || state === 'inactive') && (
                                <>
                                  <Button
                                    size='sm'
                                    variant='ghost'
                                    onClick={() => setPopup({ kind: 'edit', link: r })}
                                  >
                                    Sửa
                                  </Button>
                                  {state === 'active' ? (
                                    <Button
                                      size='sm'
                                      variant='ghost'
                                      onClick={() => setPopup({ kind: 'pause', link: r })}
                                    >
                                      Tạm tắt
                                    </Button>
                                  ) : (
                                    <Button
                                      size='sm'
                                      variant='ghost'
                                      disabled={toggleLink.isPending}
                                      onClick={() =>
                                        toggleLink.mutate({ id: r.id, data: { isActive: true } })
                                      }
                                    >
                                      Bật lại
                                    </Button>
                                  )}
                                  <Button
                                    size='sm'
                                    variant='ghost'
                                    className='text-destructive hover:text-destructive'
                                    onClick={() => setPopup({ kind: 'delete', link: r })}
                                  >
                                    <Icons.trash />
                                    Xóa
                                  </Button>
                                </>
                              )}
                              {state === 'suspended' &&
                                r.suspendedByAdmin &&
                                (r.appealedAt ? (
                                  <Button size='sm' variant='ghost' disabled>
                                    Đang kháng nghị
                                  </Button>
                                ) : (
                                  <Button
                                    size='sm'
                                    variant='outline'
                                    onClick={() => setPopup({ kind: 'appeal', link: r })}
                                  >
                                    Gửi kháng nghị
                                  </Button>
                                ))}
                              {restorable && (
                                <Button
                                  size='sm'
                                  variant='outline'
                                  disabled={restore.isPending}
                                  title={`Có thể khôi phục đến ${formatDateVn(r.restorableUntil)}`}
                                  onClick={() => restore.mutate(r.id)}
                                >
                                  Khôi phục
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Hiệu suất theo kênh — figure 4 (doitac-1410 #019). */}
      <ChannelPerformanceCard />
    </div>
  );
}
