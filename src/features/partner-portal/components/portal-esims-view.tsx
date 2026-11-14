'use client';

/**
 * A distribution partner's eSIM stock — "Quản lý eSIM" (#046).
 *
 * The one screen a marketing partner has no equivalent of: they never hold
 * stock, they never touch an eSIM. A distribution partner does, so they need to
 * see which of the eSIMs they paid for the customer has switched on, which are
 * still sitting unused, and which have run out — an unactivated eSIM is money
 * spent that has not come back yet.
 *
 * Laid out in parts like the admin's pages (doitac-3010 #028): one line of
 * this month against last, the filters with the export and "Hiển thị", then
 * the list on its own — paged, its header pinned.
 */

import { purchaseKindLabel } from '@/lib/plan-purchase-kind';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';

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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
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
import { Icons } from '@/components/icons';
import { DateRangeFilter } from '@/components/date-range-filter';
import { formatVnd } from '@/lib/format';
import { cn } from '@/lib/utils';

import { myEsimSummaryQueryOptions, myEsimsQueryOptions } from '../api/queries';
import { myEsimsExportUrl } from '../api/service';
import type { EsimMonthFigures, MyEsim } from '../api/types';
import { PLAN_TYPE_LABEL, yesNo } from './portal-catalogue-dialogs';
import { ColumnVisibilityMenu, useHiddenColumns } from './portal-column-visibility';
import {
  EsimRequestDialog,
  type EsimRequestTarget,
  type FaultKind,
  esimStatusLabel
} from './portal-esim-request-dialog';
import { PortalListPagination, usePortalPagination } from './portal-list-pagination';
import { Compared } from './portal-month-compare';
import { DataUsageMeter, isUnlimitedPlanType } from '@/components/data-usage-meter';

const statusFilters = [
  { value: 'all', label: 'Tất cả trạng thái' },
  // Worked out like the admin's (doitac-3010 #006): an eSIM on an order not
  // switched on yet is "sold".
  { value: 'sold', label: 'Chưa kích hoạt' },
  { value: 'active', label: 'Đang dùng' },
  { value: 'expired', label: 'Đã hết hạn' },
  { value: 'deactivated', label: 'Đã ngừng' },
  { value: 'refunded', label: 'Đã hoàn tiền' }
];

/** "Loại gói eSIM" (doitac-1410 #037). */
const PLAN_TYPE_FILTERS = [
  { value: 'all', label: 'Loại gói: tất cả' },
  { value: 'fixed', label: 'Cố định' },
  { value: 'daily', label: 'Theo ngày' },
  { value: 'unlimited', label: 'Không giới hạn' },
  { value: 'unlimited-reduce', label: 'Không giới hạn giảm tốc' }
];

const VN_TIME = new Intl.DateTimeFormat('vi-VN', {
  timeZone: 'Asia/Ho_Chi_Minh',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false
});
const VN_DATE = new Intl.DateTimeFormat('vi-VN', {
  timeZone: 'Asia/Ho_Chi_Minh',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric'
});

/** Time on top, date beneath (doitac-3010 #028). */
function TwoLineTime({ value }: { value: string | null | undefined }) {
  if (!value) return <span className='text-muted-foreground'>—</span>;
  const date = new Date(value);
  return (
    <span className='block leading-tight whitespace-nowrap tabular-nums'>
      <span className='block'>{VN_TIME.format(date)}</span>
      <span className='text-muted-foreground block'>{VN_DATE.format(date)}</span>
    </span>
  );
}

type EsimColumn = {
  key: string;
  label: string;
  headClassName?: string;
  cellClassName?: string;
  cell: (esim: MyEsim) => React.ReactNode;
};

/**
 * The columns of doitac-3010 #028: no "Điểm đến" (the standard name says it),
 * no "Giá vốn" or "Tiktok & AI" (the detail page has them); "Thời hạn" before
 * the data used, the status after the plan type, and "Thời gian tạo" — when
 * the eSIM was issued — instead of the activation.
 */
const ESIM_COLUMNS: EsimColumn[] = [
  {
    key: 'iccid',
    label: 'ICCID',
    cellClassName: 'text-xs',
    cell: (esim) => (
      <>
        <span className='font-mono'>{esim.iccid ?? '—'}</span>
        {/* Under the ICCID it is about, until the ticket is resolved
            (doitac-3010 #006). */}
        {esim.openReport && (
          <div
            className='mt-1 text-[11px] text-red-600 dark:text-red-400'
            data-testid='esim-open-report'
          >
            {esim.openReport === 'refund' ? 'Đang xem xét hoàn tiền' : 'Đang chờ xử lý lỗi'}
          </div>
        )}
        {/* No need to open the eSIM to know (vande-0411 #024). */}
        {(!!esim.topupCount || !!esim.addonCount) && (
          <div className='mt-1 flex flex-wrap gap-1' data-testid='esim-bought-more'>
            {!!esim.topupCount && (
              <Badge variant='secondary' className='text-[11px]'>
                Đã topup{esim.topupCount > 1 ? ` ×${esim.topupCount}` : ''}
              </Badge>
            )}
            {!!esim.addonCount && (
              <Badge variant='secondary' className='text-[11px]'>
                Đã add-on{esim.addonCount > 1 ? ` ×${esim.addonCount}` : ''}
              </Badge>
            )}
          </div>
        )}
      </>
    )
  },
  {
    key: 'plan',
    label: 'Tên gói',
    cellClassName: 'max-w-[240px]',
    cell: (esim) => (
      <span className='block truncate' title={esim.planName ?? undefined}>
        {esim.planName ?? '—'}
      </span>
    )
  },
  {
    key: 'order',
    label: 'Mã đơn',
    cellClassName: 'font-mono text-xs whitespace-nowrap',
    cell: (esim) => esim.orderNumber ?? '—'
  },
  {
    key: 'type',
    label: 'Loại gói',
    cellClassName: 'text-xs whitespace-nowrap',
    cell: (esim) => PLAN_TYPE_LABEL[esim.planType ?? ''] ?? esim.planType ?? '—'
  },
  {
    key: 'status',
    label: 'Trạng thái',
    cell: (esim) => {
      const badge = esimStatusLabel[esim.status ?? ''] ?? {
        label: esim.status ?? '—',
        variant: 'outline' as const
      };
      return <Badge variant={badge.variant}>{badge.label}</Badge>;
    }
  },
  {
    key: 'duration',
    label: 'Thời hạn',
    cellClassName: 'text-xs whitespace-nowrap tabular-nums',
    cell: (esim) => (esim.durationDays ? `${esim.durationDays} ngày` : '—')
  },
  {
    key: 'data',
    label: 'Dữ liệu đã dùng',
    cellClassName: 'text-xs whitespace-nowrap',
    // With a bar, "100 MB / ∞" for an unlimited plan (vande-1411 #044).
    cell: (esim) => (
      <DataUsageMeter
        usedMb={esim.dataUsed}
        totalMb={esim.dataTotal}
        unlimited={isUnlimitedPlanType(esim.planType, esim.dataTotal)}
        testId='portal-esim-data-meter'
      />
    )
  },
  {
    key: 'callSms',
    label: 'Call/SMS',
    cellClassName: 'text-xs',
    cell: (esim) => yesNo(esim.hasCallSms)
  },
  {
    key: 'topUp',
    // Topup / Addon / Không (doitac-0911 #018).
    label: 'Topup / Addon',
    cellClassName: 'text-xs',
    cell: (esim) => purchaseKindLabel(esim)
  },
  {
    key: 'refundable',
    label: 'Hoàn tiền',
    cellClassName: 'text-xs',
    cell: (esim) => yesNo(esim.refundable)
  },
  {
    key: 'created',
    label: 'Thời gian tạo',
    cellClassName: 'text-xs',
    cell: (esim) => <TwoLineTime value={esim.esimCreatedAt ?? esim.createdAt} />
  },
  {
    key: 'expires',
    label: 'Hết hạn',
    cellClassName: 'text-xs',
    cell: (esim) => <TwoLineTime value={esim.expiresAt} />
  }
];

const HIDDEN_COLUMNS_KEY = 'portal-esims-hidden-columns';

function MonthSummary() {
  const { data, isLoading } = useQuery(myEsimSummaryQueryOptions());
  const empty: EsimMonthFigures = { count: 0, activated: 0, idle: 0, costVnd: 0 };
  const now = data?.thisMonth ?? empty;
  const before = data?.lastMonth ?? empty;
  return (
    <Card className='gap-0 py-3' data-testid='esim-month-summary'>
      <CardContent className='flex flex-wrap items-center gap-x-6 gap-y-1 px-4 text-sm'>
        <span className='font-medium'>Tháng này</span>
        {isLoading ? (
          <span className='text-muted-foreground'>Đang tải…</span>
        ) : (
          <>
            <span>
              eSIM đã lấy: <Compared value={now.count} previous={before.count} />
            </span>
            <span>
              Đã kích hoạt: <Compared value={now.activated} previous={before.activated} />
            </span>
            <span>
              Chưa kích hoạt: <Compared value={now.idle} previous={before.idle} />
            </span>
            <span>
              Giá trị đã chi:{' '}
              <Compared value={now.costVnd} previous={before.costVnd} format={formatVnd} />
            </span>
          </>
        )}
      </CardContent>
    </Card>
  );
}

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
  const [faulty, setFaulty] = useState<EsimRequestTarget | null>(null);
  const { hidden: hiddenColumns, toggle: toggleColumn } = useHiddenColumns(HIDDEN_COLUMNS_KEY);
  const visibleColumns = ESIM_COLUMNS.filter((c) => !hiddenColumns.includes(c.key));

  const filters = useMemo(
    () => ({
      search: search.trim() || undefined,
      status: status === 'all' ? undefined : status,
      ...(planType !== 'all' ? { planType } : {}),
      ...(topUp !== 'all' ? { topUp } : {}),
      ...(from ? { from } : {}),
      ...(to ? { to } : {})
    }),
    [search, status, planType, topUp, from, to]
  );
  // The whole stock, paged here (doitac-3010 #028).
  const { data: esims = [], isLoading } = useQuery(
    myEsimsQueryOptions({ ...filters, limit: 5000 })
  );
  const { pageRows, pagination } = usePortalPagination(esims);

  return (
    <div className='grid min-w-0 grid-cols-1 gap-4'>
      <MonthSummary />

      {/* The filters on their own, with the export and "Hiển thị" (doitac-3010 #028). */}
      <Card className='min-w-0 gap-0 py-4' data-testid='esim-filter-card'>
        <CardContent className='flex flex-wrap items-center gap-2 px-4'>
          {/* One wrapping row, each control as wide as what it shows, with
              "Xoá bộ lọc" beside them (doitac-3010 #027). */}
          <div className='flex flex-1 flex-wrap items-center gap-2' data-testid='esim-filters'>
            <Input
              placeholder='Tìm ICCID, mã đơn hoặc tên gói'
              className='w-full sm:w-52'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              data-testid='esim-search'
            />
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className='w-auto gap-2' aria-label='Trạng thái'>
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
                className='w-auto gap-2'
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
              <SelectTrigger
                className='w-auto gap-2'
                aria-label='Hỗ trợ topup'
                data-testid='esim-topup'
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Hỗ trợ topup: tất cả</SelectItem>
                <SelectItem value='true'>Hỗ trợ topup: Có</SelectItem>
                <SelectItem value='false'>Hỗ trợ topup: Không</SelectItem>
              </SelectContent>
            </Select>
            {/* The shared time filter (doitac-3010 #031). */}
            <DateRangeFilter
              label='Thời gian tạo'
              from={from || undefined}
              to={to || undefined}
              onChange={(range) => {
                setFrom(range.from ?? '');
                setTo(range.to ?? '');
              }}
              testId='esim-created'
            />
            {filtered && (
              <Button
                variant='outline'
                size='sm'
                className='h-9'
                data-testid='esim-clear-filters'
                onClick={() => {
                  setSearch('');
                  setStatus('all');
                  setPlanType('all');
                  setTopUp('all');
                  setFrom('');
                  setTo('');
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
                data-testid='esims-export'
                href={myEsimsExportUrl({
                  search: search.trim() || undefined,
                  status,
                  planType,
                  topUp,
                  from: from || undefined,
                  to: to || undefined
                })}
              >
                <Icons.download className='size-4' />
                Xuất file Excel
              </a>
            </Button>
            <ColumnVisibilityMenu
              columns={ESIM_COLUMNS}
              hidden={hiddenColumns}
              onToggle={toggleColumn}
              testId='esim-columns'
            />
          </div>
        </CardContent>
      </Card>

      <Card className='min-w-0' data-testid='esim-list-card'>
        <CardHeader>
          <CardTitle>Danh sách eSIM</CardTitle>
          <CardDescription>
            eSIM từ các đơn bạn đã mua. Số liệu dung lượng do nhà mạng cập nhật nên có thể chậm hơn
            thực tế vài phút.
          </CardDescription>
          <CardAction />
        </CardHeader>
        <CardContent className='space-y-4'>
          {isLoading ? (
            <div className='flex justify-center py-12'>
              <Icons.spinner className='size-6 animate-spin' />
            </div>
          ) : esims.length === 0 ? (
            <p className='text-muted-foreground py-12 text-center text-sm'>
              Chưa có eSIM nào khớp với tìm kiếm này.
            </p>
          ) : (
            // Header pinned while the list scrolls (doitac-3010 #028).
            <div
              className='max-h-[70vh] overflow-auto rounded-md border'
              data-testid='esim-table-scroll'
            >
              <Table>
                <TableHeader className='bg-muted sticky top-0 z-10 shadow-[0_1px_0_var(--border)]'>
                  <TableRow>
                    {visibleColumns.map((column) => (
                      <TableHead
                        key={column.key}
                        className={cn('bg-muted whitespace-nowrap', column.headClassName)}
                      >
                        {column.label}
                      </TableHead>
                    ))}
                    <TableHead className='bg-muted text-right'>Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageRows.map((esim) => (
                    <TableRow
                      key={`${esim.iccid}-${esim.orderNumber}`}
                      data-testid={`esim-row-${esim.iccid}`}
                    >
                      {visibleColumns.map((column) => (
                        <TableCell key={column.key} className={column.cellClassName}>
                          {column.cell(esim)}
                        </TableCell>
                      ))}
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
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {esims.length > 0 && (
            <PortalListPagination pagination={pagination} unit='eSIM' testId='esim-pagination' />
          )}
        </CardContent>
      </Card>

      <EsimRequestDialog target={faulty} onClose={() => setFaulty(null)} />
    </div>
  );
}

/**
 * "Xem chi tiết" on a dark button, "Báo lỗi" and "Yêu cầu hoàn tiền" behind
 * the ⋮ beside it (doitac-1410 #038, doitac-3010 #028). A refunded eSIM, or
 * one with a request still open, takes no new request; a plan the supplier
 * never refunds cannot ask for one.
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
    <div className='flex items-center justify-end gap-1 whitespace-nowrap'>
      <Button size='sm' asChild>
        <Link href={`/dashboard/portal/esims/${encodeURIComponent(esim.iccid ?? '')}`}>
          Xem chi tiết
        </Link>
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant='ghost'
            size='icon'
            className='size-8'
            aria-label='Thêm thao tác'
            data-testid={`esim-more-${esim.iccid}`}
          >
            <Icons.ellipsis className='size-4' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuItem
            disabled={closed || pending}
            title={blockedReason}
            onSelect={() => onRequest('fault')}
          >
            Báo lỗi
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={closed || pending || !esim.refundable}
            title={
              blockedReason ?? (esim.refundable ? undefined : 'Gói này không hỗ trợ hoàn tiền')
            }
            onSelect={() => onRequest('refund')}
          >
            Yêu cầu hoàn tiền
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
