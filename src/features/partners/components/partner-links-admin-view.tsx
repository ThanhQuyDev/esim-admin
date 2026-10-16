'use client';

/**
 * "Tiếp thị liên kết" — every partner's marketing links in one place
 * (doitac-1410 #051–#055). This file starts with the four figures on top
 * (#051); the filters, the list and the actions follow.
 */

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
import { formatDateTimeVn, formatVnd } from '@/lib/format';
import {
  CHANNELS,
  channelOf,
  shortLinkOf
} from '@/features/partner-portal/components/portal-link-utils';
import {
  DEFAULT_PORTAL_PERIOD,
  PortalPeriodFilter,
  resolvePeriod,
  type PortalPeriod
} from '@/features/partner-portal/components/portal-period-filter';

import { adminLinkStatsQueryOptions, adminLinksQueryOptions } from '../api/queries';
import { adminLinksExportUrl } from '../api/service';
import {
  AdminLinkDetailDialog,
  BULK_ACTION_LABEL,
  BulkLinkStatusDialog,
  CreateLinkForPartnerDialog,
  type BulkLinkAction
} from './partner-links-admin-dialogs';
import type { AdminLinkRow } from '../api/types';

/** The status buttons a row offers (doitac-1410 #054). */
function rowActions(state: AdminLinkState): BulkLinkAction[] {
  if (state === 'active' || state === 'inactive') return ['suspend'];
  if (state === 'suspended' || state === 'appealing') return ['unsuspend'];
  return ['restore'];
}
import { Checkbox } from '@/components/ui/checkbox';
import { Icons } from '@/components/icons';
import type { AdminLinkFilters, AdminLinkState } from '../api/types';

/** The six states the admin works with (doitac-1410 #052). */
export const LINK_STATE_LABEL: Record<
  AdminLinkState,
  { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }
> = {
  active: { label: 'Hoạt động', variant: 'default' },
  inactive: { label: 'Tạm tắt', variant: 'secondary' },
  suspended: { label: 'Bị đình chỉ', variant: 'destructive' },
  appealing: { label: 'Đang kháng nghị', variant: 'outline' },
  deleted: { label: 'Đã xóa', variant: 'secondary' },
  restore_pending: { label: 'Chờ duyệt khôi phục', variant: 'outline' }
};

const ACTOR_LABEL: Record<string, string> = {
  admin: 'Admin',
  partner: 'Đối tác',
  system: 'Hệ thống'
};

const EMPTY_FILTERS: Required<
  Pick<
    AdminLinkFilters,
    | 'partner'
    | 'link'
    | 'channel'
    | 'status'
    | 'createdFrom'
    | 'createdTo'
    | 'updatedFrom'
    | 'updatedTo'
    | 'actor'
  >
> = {
  partner: '',
  link: '',
  channel: 'all',
  status: 'all',
  createdFrom: '',
  createdTo: '',
  updatedFrom: '',
  updatedTo: '',
  actor: 'all'
};
const PAGE_SIZE = 20;

const TILE = 'from-primary/5 to-card dark:bg-card rounded-lg border bg-gradient-to-t p-4 shadow-xs';

function StatTile({
  label,
  value,
  hint,
  testId
}: {
  label: string;
  value: string;
  hint?: string;
  testId: string;
}) {
  return (
    <div className={TILE} data-slot='stat-tile' data-testid={testId}>
      <p className='text-muted-foreground text-xs'>{label}</p>
      <p className='mt-1 text-2xl font-semibold tabular-nums'>{value}</p>
      {hint && <p className='text-muted-foreground mt-1 text-xs'>{hint}</p>}
    </div>
  );
}

const count = (n: number | undefined) => (n ?? 0).toLocaleString('vi-VN');

export function PartnerLinksAdminView() {
  // "Đổi trang đích trong 7 ngày" by default; the number follows the filter.
  const [period, setPeriod] = useState<PortalPeriod>({
    ...DEFAULT_PORTAL_PERIOD,
    preset: 'last7days'
  });
  const range = useMemo(() => resolvePeriod(period), [period]);
  const { data: stats, isLoading } = useQuery(adminLinkStatsQueryOptions(range));
  const dash = isLoading ? '…' : undefined;

  // The list's filters (doitac-1410 #052).
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const set = <K extends keyof typeof EMPTY_FILTERS>(key: K, value: (typeof EMPTY_FILTERS)[K]) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
  };
  const filtered = Object.entries(filters).some(
    ([k, v]) => v !== EMPTY_FILTERS[k as keyof typeof EMPTY_FILTERS]
  );
  const { data: list, isLoading: listLoading } = useQuery(
    adminLinksQueryOptions({
      ...filters,
      partner: filters.partner.trim(),
      link: filters.link.trim(),
      page,
      limit: PAGE_SIZE
    })
  );
  const links = list?.data ?? [];
  const pages = Math.max(1, Math.ceil((list?.total ?? 0) / PAGE_SIZE));

  // Ticked rows for "Thay đổi trạng thái" (doitac-1410 #053).
  const [selected, setSelected] = useState<number[]>([]);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  // One row's own action, and the detail popup (doitac-1410 #054).
  const [rowAction, setRowAction] = useState<{ link: AdminLinkRow; action: BulkLinkAction } | null>(
    null
  );
  const [detail, setDetail] = useState<AdminLinkRow | null>(null);
  const allTicked = links.length > 0 && links.every((l) => selected.includes(l.id));
  const toggle = (id: number, on: boolean) =>
    setSelected((s) => (on ? [...new Set([...s, id])] : s.filter((x) => x !== id)));

  return (
    <div className='grid min-w-0 grid-cols-1 gap-4'>
      <PortalPeriodFilter value={period} onChange={setPeriod} />

      <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
        <StatTile
          testId='link-stat-total'
          label='Tổng số liên kết'
          value={dash ?? count(stats?.total.links)}
          hint={`${count(stats?.total.active)} đang bật · ${count(stats?.total.orders)} đơn · ${formatVnd(stats?.total.commissionVnd ?? 0)} hoa hồng`}
        />
        <StatTile
          testId='link-stat-retargeted'
          label={`Đổi trang đích trong ${stats?.days ?? 7} ngày`}
          value={dash ?? count(stats?.retargeted)}
          hint='Số liên kết được đổi trang đích trong kỳ đang chọn'
        />
        <StatTile
          testId='link-stat-suspended'
          label='Đang bị đình chỉ'
          value={dash ?? count(stats?.suspended.links)}
          hint={`${count(stats?.suspended.appealing)} đang kháng nghị`}
        />
        <StatTile
          testId='link-stat-restore'
          label='Chờ duyệt khôi phục'
          value={dash ?? count(stats?.restorePending.links)}
          hint={`${count(stats?.restorePending.deleted)} đã xóa · ${count(stats?.restorePending.paused)} đang tạm tắt`}
        />
      </div>

      <Card className='min-w-0'>
        <CardHeader className='flex flex-row flex-wrap items-center justify-between gap-2'>
          <CardTitle>Danh sách liên kết</CardTitle>
          <div className='flex flex-wrap gap-2'>
            <Button
              size='sm'
              variant='outline'
              disabled={selected.length === 0}
              onClick={() => setBulkOpen(true)}
              data-testid='links-bulk-status'
            >
              Thay đổi trạng thái{selected.length ? ` (${selected.length})` : ''}
            </Button>
            <Button asChild size='sm' variant='outline'>
              <a
                data-testid='links-export'
                href={adminLinksExportUrl({
                  ...filters,
                  partner: filters.partner.trim(),
                  link: filters.link.trim()
                })}
              >
                <Icons.download className='size-4' />
                Xuất file
              </a>
            </Button>
            <Button size='sm' onClick={() => setCreateOpen(true)} data-testid='links-create'>
              <Icons.add className='size-4' />
              Tạo link giúp đối tác
            </Button>
          </div>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4'>
            <Input
              placeholder='Tên / email / SĐT / mã ID đối tác'
              aria-label='Đối tác'
              value={filters.partner}
              onChange={(e) => set('partner', e.target.value)}
              data-testid='link-filter-partner'
            />
            <Input
              placeholder='Tên liên kết / trang đích / link tiếp thị'
              aria-label='Liên kết'
              value={filters.link}
              onChange={(e) => set('link', e.target.value)}
              data-testid='link-filter-link'
            />
            <Select value={filters.channel} onValueChange={(v) => set('channel', v)}>
              <SelectTrigger
                className='w-full'
                aria-label='Kênh quảng bá'
                data-testid='link-filter-channel'
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Kênh quảng bá: tất cả</SelectItem>
                {CHANNELS.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.status}
              onValueChange={(v) => set('status', v as AdminLinkFilters['status'] & string)}
            >
              <SelectTrigger
                className='w-full'
                aria-label='Trạng thái liên kết'
                data-testid='link-filter-status'
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Trạng thái: tất cả</SelectItem>
                {(Object.keys(LINK_STATE_LABEL) as AdminLinkState[]).map((state) => (
                  <SelectItem key={state} value={state}>
                    {LINK_STATE_LABEL[state].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className='flex min-w-0 items-center gap-2'>
              <span className='text-muted-foreground shrink-0 text-xs'>Tạo từ</span>
              <Input
                type='date'
                className='min-w-0 flex-1'
                aria-label='Thời gian tạo từ'
                value={filters.createdFrom}
                max={filters.createdTo || undefined}
                onChange={(e) => set('createdFrom', e.target.value)}
                data-testid='link-filter-created-from'
              />
              <span className='text-muted-foreground shrink-0 text-xs'>đến</span>
              <Input
                type='date'
                className='min-w-0 flex-1'
                aria-label='Thời gian tạo đến'
                value={filters.createdTo}
                min={filters.createdFrom || undefined}
                onChange={(e) => set('createdTo', e.target.value)}
                data-testid='link-filter-created-to'
              />
            </div>
            <div className='flex min-w-0 items-center gap-2'>
              <span className='text-muted-foreground shrink-0 text-xs'>Cập nhật từ</span>
              <Input
                type='date'
                className='min-w-0 flex-1'
                aria-label='Thời gian cập nhật từ'
                value={filters.updatedFrom}
                max={filters.updatedTo || undefined}
                onChange={(e) => set('updatedFrom', e.target.value)}
                data-testid='link-filter-updated-from'
              />
              <span className='text-muted-foreground shrink-0 text-xs'>đến</span>
              <Input
                type='date'
                className='min-w-0 flex-1'
                aria-label='Thời gian cập nhật đến'
                value={filters.updatedTo}
                min={filters.updatedFrom || undefined}
                onChange={(e) => set('updatedTo', e.target.value)}
                data-testid='link-filter-updated-to'
              />
            </div>
            <Select
              value={filters.actor}
              onValueChange={(v) => set('actor', v as 'admin' | 'partner' | 'all')}
            >
              <SelectTrigger
                className='w-full'
                aria-label='Người thực hiện'
                data-testid='link-filter-actor'
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Người thực hiện: tất cả</SelectItem>
                <SelectItem value='admin'>Admin</SelectItem>
                <SelectItem value='partner'>Đối tác</SelectItem>
              </SelectContent>
            </Select>
            {filtered && (
              <Button
                variant='ghost'
                size='sm'
                className='justify-self-start'
                onClick={() => {
                  setFilters(EMPTY_FILTERS);
                  setPage(1);
                }}
              >
                Xoá bộ lọc
              </Button>
            )}
          </div>

          <div className='overflow-x-auto rounded-lg border'>
            <Table>
              <TableHeader className='bg-muted'>
                <TableRow>
                  <TableHead className='w-8'>
                    <Checkbox
                      aria-label='Chọn tất cả liên kết trên trang'
                      checked={allTicked}
                      onCheckedChange={(on) =>
                        setSelected((s) =>
                          on
                            ? [...new Set([...s, ...links.map((l) => l.id)])]
                            : s.filter((id) => !links.some((l) => l.id === id))
                        )
                      }
                    />
                  </TableHead>
                  <TableHead>Đối tác</TableHead>
                  <TableHead>Liên kết</TableHead>
                  <TableHead>Kênh quảng bá</TableHead>
                  <TableHead>Tạo lúc</TableHead>
                  <TableHead>Cập nhật</TableHead>
                  <TableHead className='text-right'>Số lần sửa</TableHead>
                  <TableHead className='text-right'>Lượt nhấp</TableHead>
                  <TableHead className='text-right'>Số đơn</TableHead>
                  <TableHead className='text-right'>Hoa hồng</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className='text-right'>Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody data-testid='admin-links-body'>
                {links.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={12} className='text-muted-foreground h-24 text-center'>
                      {listLoading ? 'Đang tải…' : 'Không có liên kết nào khớp bộ lọc.'}
                    </TableCell>
                  </TableRow>
                )}
                {links.map((link) => {
                  const state = LINK_STATE_LABEL[link.state];
                  return (
                    <TableRow
                      key={link.id}
                      data-state={selected.includes(link.id) ? 'selected' : undefined}
                    >
                      <TableCell>
                        <Checkbox
                          aria-label={`Chọn liên kết ${link.code}`}
                          checked={selected.includes(link.id)}
                          onCheckedChange={(on) => toggle(link.id, on === true)}
                        />
                      </TableCell>
                      <TableCell className='text-xs'>
                        <Link
                          href={`/dashboard/partners/${link.partner.id}`}
                          className='font-medium hover:underline'
                        >
                          {link.partner.name ?? '—'}
                        </Link>
                        <div className='text-muted-foreground font-mono'>#{link.partner.id}</div>
                      </TableCell>
                      <TableCell className='max-w-[240px] text-xs'>
                        <div className='truncate font-medium'>{link.label || '—'}</div>
                        <div className='text-muted-foreground truncate font-mono'>
                          {shortLinkOf(link.code)}
                        </div>
                      </TableCell>
                      <TableCell className='text-xs'>{channelOf(link.targetPath) || '—'}</TableCell>
                      <TableCell className='text-xs whitespace-nowrap'>
                        {formatDateTimeVn(link.createdAt)}
                        <div className='text-muted-foreground'>
                          bởi {ACTOR_LABEL[link.createdBy] ?? link.createdBy}
                        </div>
                      </TableCell>
                      <TableCell className='text-xs whitespace-nowrap'>
                        {formatDateTimeVn(link.updatedAt)}
                        <div className='text-muted-foreground'>
                          bởi {ACTOR_LABEL[link.updatedBy] ?? link.updatedBy}
                        </div>
                      </TableCell>
                      <TableCell className='text-right tabular-nums'>{link.editCount}</TableCell>
                      <TableCell className='text-right tabular-nums'>
                        {link.clicks.toLocaleString('vi-VN')}
                      </TableCell>
                      <TableCell className='text-right tabular-nums'>
                        {link.orders.toLocaleString('vi-VN')}
                      </TableCell>
                      <TableCell className='text-right tabular-nums'>
                        {formatVnd(link.commissionVnd)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={state.variant}>{state.label}</Badge>
                      </TableCell>
                      <TableCell className='text-right'>
                        <div className='flex flex-col items-end gap-1 whitespace-nowrap'>
                          <Button
                            variant='link'
                            size='sm'
                            className='h-auto p-0 text-xs'
                            onClick={() => setDetail(link)}
                          >
                            Xem chi tiết
                          </Button>
                          {rowActions(link.state).map((action) => (
                            <Button
                              key={action}
                              variant='ghost'
                              size='sm'
                              className={`h-auto p-0 text-xs ${action === 'suspend' ? 'text-destructive' : ''}`}
                              onClick={() => setRowAction({ link, action })}
                            >
                              {BULK_ACTION_LABEL[action]}
                            </Button>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <div className='flex flex-wrap items-center justify-between gap-2 text-sm'>
            <span className='text-muted-foreground' data-testid='admin-links-total'>
              {(list?.total ?? 0).toLocaleString('vi-VN')} liên kết
            </span>
            <div className='flex items-center gap-2'>
              <Button
                variant='outline'
                size='sm'
                disabled={page <= 1}
                onClick={() => setPage((n) => n - 1)}
              >
                Trước
              </Button>
              <span className='tabular-nums'>
                {page}/{pages}
              </span>
              <Button
                variant='outline'
                size='sm'
                disabled={page >= pages}
                onClick={() => setPage((n) => n + 1)}
              >
                Sau
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <BulkLinkStatusDialog
        linkIds={selected}
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        onDone={() => setSelected([])}
      />
      <CreateLinkForPartnerDialog open={createOpen} onOpenChange={setCreateOpen} />
      <BulkLinkStatusDialog
        linkIds={rowAction ? [rowAction.link.id] : []}
        open={rowAction !== null}
        onOpenChange={(open) => !open && setRowAction(null)}
        onDone={() => setDetail(null)}
        fixedAction={rowAction?.action}
        stateLabel={rowAction ? LINK_STATE_LABEL[rowAction.link.state] : undefined}
        title={
          rowAction
            ? `${BULK_ACTION_LABEL[rowAction.action]} liên kết «${rowAction.link.label ?? rowAction.link.code}»`
            : undefined
        }
      />
      <AdminLinkDetailDialog
        linkId={detail?.id ?? null}
        stateLabel={detail ? LINK_STATE_LABEL[detail.state] : undefined}
        onClose={() => setDetail(null)}
        actions={
          detail
            ? rowActions(detail.state).map((action) => (
                <Button
                  key={action}
                  size='sm'
                  variant={action === 'suspend' ? 'destructive' : 'default'}
                  onClick={() => setRowAction({ link: detail, action })}
                >
                  {BULK_ACTION_LABEL[action]}
                </Button>
              ))
            : undefined
        }
      />
    </div>
  );
}
