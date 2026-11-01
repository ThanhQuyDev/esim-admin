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
import { DateRangeFilter } from '@/components/date-range-filter';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  ColumnVisibilityMenu,
  useHiddenColumns
} from '@/features/partner-portal/components/portal-column-visibility';
import {
  PortalListPagination,
  type PortalPagination
} from '@/features/partner-portal/components/portal-list-pagination';
import type { AdminLinkFilters, AdminLinkState } from '../api/types';

/** The six states the admin works with (doitac-1410 #052). */
export const LINK_STATE_LABEL: Record<
  AdminLinkState,
  {
    label: string;
    variant: 'default' | 'secondary' | 'outline' | 'destructive';
  }
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

/** The list's columns, each one hideable from "Hiển thị" (doitac-3010 #036). */
const LINK_COLUMNS = [
  { key: 'partner', label: 'Đối tác' },
  { key: 'link', label: 'Liên kết' },
  { key: 'channel', label: 'Kênh quảng bá' },
  { key: 'created', label: 'Tạo lúc' },
  { key: 'updated', label: 'Cập nhật' },
  { key: 'edits', label: 'Số lần sửa' },
  { key: 'clicks', label: 'Lượt nhấp' },
  { key: 'orders', label: 'Số đơn' },
  { key: 'commission', label: 'Hoa hồng' },
  { key: 'status', label: 'Trạng thái' }
];

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
  // Paged like the admin's tables (doitac-3010 #036).
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const { hidden: hiddenColumns, toggle: toggleColumn } = useHiddenColumns(
    'admin-links-hidden-columns'
  );
  const show = (key: string) => !hiddenColumns.includes(key);
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
      limit: pageSize
    })
  );
  const links = list?.data ?? [];
  const pages = Math.max(1, Math.ceil((list?.total ?? 0) / pageSize));
  const pagination: PortalPagination = {
    total: list?.total ?? 0,
    pageIndex: Math.min(page, pages) - 1,
    pageCount: pages,
    pageSize,
    setPageIndex: (next) =>
      setPage((current) => (typeof next === 'function' ? next(current - 1) : next) + 1),
    setPageSize: (size: number) => {
      setPageSize(size);
      setPage(1);
    }
  };

  // Ticked rows for "Thay đổi trạng thái" (doitac-1410 #053).
  const [selected, setSelected] = useState<number[]>([]);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  // One row's own action, and the detail popup (doitac-1410 #054).
  const [rowAction, setRowAction] = useState<{
    link: AdminLinkRow;
    action: BulkLinkAction;
  } | null>(null);
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

      {/* The filters on their own, with the export and "Hiển thị", as on the
          admin's other pages (doitac-3010 #036). */}
      <Card className='min-w-0 gap-0 py-4' data-testid='admin-links-filter-card'>
        <CardContent className='flex flex-wrap items-start gap-2 px-4'>
          <div className='flex flex-1 flex-wrap items-center gap-2'>
            <Input
              placeholder='Tên / email / SĐT / mã ID đối tác'
              className='w-full sm:w-56'
              aria-label='Đối tác'
              value={filters.partner}
              onChange={(e) => set('partner', e.target.value)}
              data-testid='link-filter-partner'
            />
            <Input
              placeholder='Tên liên kết / trang đích / link tiếp thị'
              className='w-full sm:w-60'
              aria-label='Liên kết'
              value={filters.link}
              onChange={(e) => set('link', e.target.value)}
              data-testid='link-filter-link'
            />
            <Select value={filters.channel} onValueChange={(v) => set('channel', v)}>
              <SelectTrigger
                className='w-auto gap-2'
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
                className='w-auto gap-2'
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
            {/* The shared time filter (doitac-3010 #031). */}
            <DateRangeFilter
              label='Tạo'
              from={filters.createdFrom || undefined}
              to={filters.createdTo || undefined}
              onChange={(range) => {
                set('createdFrom', range.from ?? '');
                set('createdTo', range.to ?? '');
              }}
              testId='link-filter-created'
            />
            <DateRangeFilter
              label='Cập nhật'
              from={filters.updatedFrom || undefined}
              to={filters.updatedTo || undefined}
              onChange={(range) => {
                set('updatedFrom', range.from ?? '');
                set('updatedTo', range.to ?? '');
              }}
              testId='link-filter-updated'
            />
            <Select
              value={filters.actor}
              onValueChange={(v) => set('actor', v as 'admin' | 'partner' | 'all')}
            >
              <SelectTrigger
                className='w-auto gap-2'
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
                variant='outline'
                size='sm'
                className='h-9'
                data-testid='links-clear-filters'
                onClick={() => {
                  setFilters(EMPTY_FILTERS);
                  setPage(1);
                }}
              >
                <Icons.close className='size-4' />
                Xoá bộ lọc
              </Button>
            )}
          </div>
          <div className='flex items-center gap-2'>
            <Button asChild size='sm' variant='outline' className='h-8'>
              <a
                data-testid='links-export'
                href={adminLinksExportUrl({
                  ...filters,
                  partner: filters.partner.trim(),
                  link: filters.link.trim()
                })}
              >
                <Icons.download className='size-4' />
                Xuất file Excel
              </a>
            </Button>
            <ColumnVisibilityMenu
              columns={LINK_COLUMNS}
              hidden={hiddenColumns}
              onToggle={toggleColumn}
              testId='links-columns'
            />
          </div>
        </CardContent>
      </Card>

      <Card className='min-w-0' data-testid='admin-links-list-card'>
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
              Thay đổi trạng thái
              {selected.length ? ` (${selected.length})` : ''}
            </Button>
            <Button size='sm' onClick={() => setCreateOpen(true)} data-testid='links-create'>
              <Icons.add className='size-4' />
              Tạo link giúp đối tác
            </Button>
          </div>
        </CardHeader>
        <CardContent className='space-y-4'>
          {/* Header pinned while the list scrolls (doitac-3010 #036). */}
          <div
            className='max-h-[70vh] overflow-auto rounded-lg border'
            data-testid='admin-links-table-scroll'
          >
            <Table>
              <TableHeader className='bg-muted sticky top-0 z-10 shadow-[0_1px_0_var(--border)] [&_th]:bg-muted'>
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
                  {show('partner') && <TableHead>Đối tác</TableHead>}
                  {show('link') && <TableHead>Liên kết</TableHead>}
                  {show('channel') && <TableHead>Kênh quảng bá</TableHead>}
                  {show('created') && <TableHead>Tạo lúc</TableHead>}
                  {show('updated') && <TableHead>Cập nhật</TableHead>}
                  {show('edits') && <TableHead className='text-right'>Số lần sửa</TableHead>}
                  {show('clicks') && <TableHead className='text-right'>Lượt nhấp</TableHead>}
                  {show('orders') && <TableHead className='text-right'>Số đơn</TableHead>}
                  {show('commission') && <TableHead className='text-right'>Hoa hồng</TableHead>}
                  {show('status') && <TableHead>Trạng thái</TableHead>}
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
                      {show('partner') && (
                        <TableCell className='text-xs'>
                          <Link
                            href={`/dashboard/partners/${link.partner.id}`}
                            className='font-medium hover:underline'
                          >
                            {link.partner.name ?? '—'}
                          </Link>
                          <div className='text-muted-foreground font-mono'>#{link.partner.id}</div>
                        </TableCell>
                      )}
                      {show('link') && (
                        <TableCell className='max-w-[240px] text-xs'>
                          <div className='truncate font-medium'>{link.label || '—'}</div>
                          <div className='text-muted-foreground truncate font-mono'>
                            {shortLinkOf(link.code)}
                          </div>
                        </TableCell>
                      )}
                      {show('channel') && (
                        <TableCell className='text-xs'>
                          {channelOf(link.targetPath) || '—'}
                        </TableCell>
                      )}
                      {show('created') && (
                        <TableCell className='text-xs whitespace-nowrap'>
                          {formatDateTimeVn(link.createdAt)}
                          <div className='text-muted-foreground'>
                            bởi {ACTOR_LABEL[link.createdBy] ?? link.createdBy}
                          </div>
                        </TableCell>
                      )}
                      {show('updated') && (
                        <TableCell className='text-xs whitespace-nowrap'>
                          {formatDateTimeVn(link.updatedAt)}
                          <div className='text-muted-foreground'>
                            bởi {ACTOR_LABEL[link.updatedBy] ?? link.updatedBy}
                          </div>
                        </TableCell>
                      )}
                      {show('edits') && (
                        <TableCell className='text-right tabular-nums'>{link.editCount}</TableCell>
                      )}
                      {show('clicks') && (
                        <TableCell className='text-right tabular-nums'>
                          {link.clicks.toLocaleString('vi-VN')}
                          {/* doitac-3010 #018 */}
                          {link.validClicks !== undefined && (
                            <div className='text-muted-foreground text-xs whitespace-nowrap'>
                              {link.validClicks.toLocaleString('vi-VN')} hợp lệ
                              {link.landingDropRate
                                ? ` · rớt ${link.landingDropRate.toLocaleString('vi-VN')}%`
                                : ''}
                            </div>
                          )}
                        </TableCell>
                      )}
                      {show('orders') && (
                        <TableCell className='text-right tabular-nums'>
                          {link.orders.toLocaleString('vi-VN')}
                        </TableCell>
                      )}
                      {show('commission') && (
                        <TableCell className='text-right tabular-nums'>
                          {formatVnd(link.commissionVnd)}
                        </TableCell>
                      )}
                      {show('status') && (
                        <TableCell>
                          <Badge variant={state.variant}>{state.label}</Badge>
                        </TableCell>
                      )}
                      <TableCell className='text-right'>
                        {/* Only the ⋮, every action behind it (doitac-3010 #036). */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant='ghost'
                              size='icon'
                              className='size-8'
                              aria-label='Thao tác'
                              data-testid={`link-actions-${link.id}`}
                            >
                              <Icons.ellipsis className='size-4' />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align='end'>
                            <DropdownMenuItem onSelect={() => setDetail(link)}>
                              Xem chi tiết
                            </DropdownMenuItem>
                            {rowActions(link.state).map((action) => (
                              <DropdownMenuItem
                                key={action}
                                className={action === 'suspend' ? 'text-destructive' : undefined}
                                onSelect={() => setRowAction({ link, action })}
                              >
                                {BULK_ACTION_LABEL[action]}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <PortalListPagination
            pagination={pagination}
            unit='liên kết'
            testId='admin-links-pagination'
            pageSizes={[10, 20, 30, 40, 50, 100, 200]}
          />
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
