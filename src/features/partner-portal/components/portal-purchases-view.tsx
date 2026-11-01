'use client';

/**
 * A distribution partner's own orders — "Đơn hàng" (#046).
 *
 * The portal's other order screen answers the marketing question: orders
 * somebody else placed that were credited to this partner. A distribution
 * partner has no such orders. Theirs are the ones they placed themselves, which
 * is what this lists — by order number and by when they bought.
 *
 * Laid out in parts like the admin's pages (doitac-3010 #029): one line of
 * this month against last, the filters — one search box — with the export and
 * "Hiển thị", then the list on its own, paged, its header pinned.
 */

import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
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
import { formatDateTimeVn, formatVnd } from '@/lib/format';
import { cn } from '@/lib/utils';

import { myPurchaseSummaryQueryOptions, myPurchasesQueryOptions } from '../api/queries';
import { myPurchasesExportUrl, resendPurchaseEmail } from '../api/service';
import type { MyPurchase, PurchaseMonthFigures } from '../api/types';
import { ColumnVisibilityMenu, useHiddenColumns } from './portal-column-visibility';
import {
  EsimRequestDialog,
  type EsimRequestTarget,
  type FaultKind
} from './portal-esim-request-dialog';
import { PortalListPagination, usePortalPagination } from './portal-list-pagination';
import { Compared } from './portal-month-compare';

const statusLabel: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }
> = {
  pending: { label: 'Chờ thanh toán', variant: 'outline' },
  paid: { label: 'Đã thanh toán', variant: 'default' },
  processing: { label: 'Đang xử lý', variant: 'secondary' },
  completed: { label: 'Hoàn tất', variant: 'default' },
  cancelled: { label: 'Đã huỷ', variant: 'destructive' },
  failed: { label: 'Thất bại', variant: 'destructive' },
  refunded: { label: 'Đã hoàn tiền', variant: 'destructive' }
};

const statusFilters = [
  { value: 'all', label: 'Tất cả trạng thái' },
  { value: 'paid', label: 'Đã thanh toán' },
  { value: 'completed', label: 'Hoàn tất' },
  { value: 'pending', label: 'Chờ thanh toán' },
  { value: 'cancelled', label: 'Đã huỷ' },
  { value: 'failed', label: 'Thất bại' },
  { value: 'refunded', label: 'Đã hoàn tiền' }
];

/** "Loại đơn" (doitac-1410 #041). */
const ORDER_TYPE_FILTERS = [
  { value: 'all', label: 'Loại đơn: tất cả' },
  { value: 'BUY_NEW', label: 'Đơn eSIM thường' },
  { value: 'TOPUP', label: 'Đơn nạp topup' }
];

const EMPTY_FILTERS = {
  search: '',
  orderType: 'all',
  status: 'all',
  from: '',
  to: ''
};

type PurchaseColumn = {
  key: string;
  label: string;
  headClassName?: string;
  cellClassName?: string;
  cell: (purchase: MyPurchase) => React.ReactNode;
};

/** The columns, "Trạng thái" right after "Khách hàng" (doitac-3010 #029). */
const PURCHASE_COLUMNS: PurchaseColumn[] = [
  {
    key: 'order',
    label: 'Mã đơn hàng',
    cellClassName: 'font-mono text-xs',
    cell: (purchase) => (
      <>
        <Link
          href={`/dashboard/portal/orders/${encodeURIComponent(purchase.orderNumber)}`}
          className='hover:underline'
        >
          {purchase.orderNumber}
        </Link>
        {/* Under the order it is about, as on Quản lý eSIM (doitac-3010 #029). */}
        {purchase.openReport && (
          <div
            className='mt-1 font-sans text-[11px] text-red-600 dark:text-red-400'
            data-testid='purchase-open-report'
          >
            {purchase.openReport === 'refund' ? 'Đang xem xét hoàn tiền' : 'Đang chờ xử lý lỗi'}
          </div>
        )}
      </>
    )
  },
  {
    key: 'customer',
    label: 'Khách hàng',
    cellClassName: 'max-w-[200px] truncate text-xs',
    cell: (purchase) => purchase.deliveryEmail || <span className='text-muted-foreground'>—</span>
  },
  {
    key: 'status',
    label: 'Trạng thái',
    cell: (purchase) => {
      const badge = statusLabel[purchase.status] ?? {
        label: purchase.status,
        variant: 'outline' as const
      };
      return <Badge variant={badge.variant}>{badge.label}</Badge>;
    }
  },
  {
    key: 'product',
    label: 'Sản phẩm',
    cellClassName: 'max-w-[260px] text-xs',
    cell: (purchase) => <ProductSummary purchase={purchase} />
  },
  {
    key: 'total',
    label: 'Tổng tiền',
    headClassName: 'text-right',
    cellClassName: 'text-right tabular-nums whitespace-nowrap',
    cell: (purchase) => (
      <>
        {formatVnd(purchase.paidVnd)}
        {purchase.refundedVnd > 0 && (
          <div className='text-destructive text-xs'>−{formatVnd(purchase.refundedVnd)} hoàn</div>
        )}
      </>
    )
  },
  {
    key: 'type',
    label: 'Loại đơn',
    cell: (purchase) => (
      <Badge variant='outline'>{purchase.orderType === 'TOPUP' ? 'Topup' : 'Mua eSIM'}</Badge>
    )
  },
  {
    key: 'date',
    label: 'Ngày mua',
    cellClassName: 'text-xs whitespace-nowrap',
    cell: (purchase) => formatDateTimeVn(purchase.createdAt)
  }
];

const HIDDEN_COLUMNS_KEY = 'portal-purchases-hidden-columns';

function MonthSummary() {
  const { data, isLoading } = useQuery(myPurchaseSummaryQueryOptions());
  const empty: PurchaseMonthFigures = { orders: 0, paidVnd: 0, esims: 0, refundedVnd: 0 };
  const now = data?.thisMonth ?? empty;
  const before = data?.lastMonth ?? empty;
  return (
    <Card className='gap-0 py-3' data-testid='purchase-month-summary'>
      <CardContent className='flex flex-wrap items-center gap-x-6 gap-y-1 px-4 text-sm'>
        <span className='font-medium'>Tháng này</span>
        {isLoading ? (
          <span className='text-muted-foreground'>Đang tải…</span>
        ) : (
          <>
            <span>
              Số đơn: <Compared value={now.orders} previous={before.orders} />
            </span>
            <span>
              Tổng đã chi:{' '}
              <Compared value={now.paidVnd} previous={before.paidVnd} format={formatVnd} />
            </span>
            <span>
              Số eSIM đã lấy: <Compared value={now.esims} previous={before.esims} />
            </span>
            <span>
              Đã hoàn tiền:{' '}
              <Compared value={now.refundedVnd} previous={before.refundedVnd} format={formatVnd} />
            </span>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function PortalPurchasesView() {
  // A topup on an eSIM's page links here with its order code (doitac-1410 #039).
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState(() => ({
    ...EMPTY_FILTERS,
    search: searchParams.get('search') ?? ''
  }));
  const set = (key: keyof typeof EMPTY_FILTERS) => (value: string) =>
    setFilters((current) => ({ ...current, [key]: value }));
  const filtered = Object.entries(filters).some(
    ([key, value]) => value !== EMPTY_FILTERS[key as keyof typeof EMPTY_FILTERS]
  );
  const [request, setRequest] = useState<EsimRequestTarget | null>(null);
  const [picking, setPicking] = useState<{ purchase: MyPurchase; kind: FaultKind } | null>(null);
  const { hidden: hiddenColumns, toggle: toggleColumn } = useHiddenColumns(HIDDEN_COLUMNS_KEY);
  const visibleColumns = PURCHASE_COLUMNS.filter((c) => !hiddenColumns.includes(c.key));

  // One box for order number, email, ICCID or plan (doitac-3010 #029).
  const listFilters = {
    search: filters.search.trim() || undefined,
    orderType: filters.orderType,
    status: filters.status,
    from: filters.from || undefined,
    to: filters.to || undefined
  };
  // The whole history, paged here (doitac-3010 #029).
  const { data: purchases = [], isLoading } = useQuery(
    myPurchasesQueryOptions({ ...listFilters, limit: 5000 })
  );
  const { pageRows, pagination } = usePortalPagination(purchases);

  // One eSIM: straight to the request; several: pick which first.
  const startRequest = (purchase: MyPurchase, kind: FaultKind) => {
    const esims = (purchase.esims ?? []).filter((e) => kind === 'fault' || e.refundable);
    if (esims.length === 1) {
      setRequest({ iccid: esims[0]!.iccid, orderNumber: purchase.orderNumber, kind });
    } else {
      setPicking({ purchase, kind });
    }
  };

  return (
    <div className='grid min-w-0 grid-cols-1 gap-4'>
      <MonthSummary />

      <Card className='min-w-0 gap-0 py-4' data-testid='purchase-filter-card'>
        <CardContent className='flex flex-wrap items-center gap-2 px-4'>
          <div className='flex flex-1 flex-wrap items-center gap-2' data-testid='purchase-filters'>
            <Input
              placeholder='Mã đơn, email, ICCID hoặc tên gói'
              aria-label='Tìm đơn hàng'
              className='w-full sm:w-64'
              value={filters.search}
              onChange={(e) => set('search')(e.target.value)}
              data-testid='purchase-search'
            />
            <Select value={filters.orderType} onValueChange={set('orderType')}>
              <SelectTrigger
                className='w-auto gap-2'
                aria-label='Loại đơn'
                data-testid='purchase-type'
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ORDER_TYPE_FILTERS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filters.status} onValueChange={set('status')}>
              <SelectTrigger
                className='w-auto gap-2'
                aria-label='Trạng thái đơn'
                data-testid='purchase-status'
              >
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
            <div className='flex items-center gap-2'>
              <span className='text-muted-foreground shrink-0 text-xs'>Từ</span>
              <Input
                type='date'
                value={filters.from}
                max={filters.to || undefined}
                onChange={(e) => set('from')(e.target.value)}
                aria-label='Thời gian từ'
                className='w-[140px]'
                data-testid='purchase-from'
              />
              <span className='text-muted-foreground shrink-0 text-xs'>đến</span>
              <Input
                type='date'
                value={filters.to}
                min={filters.from || undefined}
                onChange={(e) => set('to')(e.target.value)}
                aria-label='Thời gian đến'
                className='w-[140px]'
                data-testid='purchase-to'
              />
            </div>
            {filtered && (
              <Button
                variant='outline'
                size='sm'
                className='h-9'
                data-testid='purchase-clear-filters'
                onClick={() => setFilters(EMPTY_FILTERS)}
              >
                <Icons.close className='size-4' />
                Xoá bộ lọc
              </Button>
            )}
          </div>
          <div className='flex items-center gap-2'>
            <Button asChild size='sm' variant='outline' className='h-8'>
              <a data-testid='purchases-export' href={myPurchasesExportUrl(listFilters)}>
                <Icons.download className='size-4' />
                Xuất file Excel
              </a>
            </Button>
            <ColumnVisibilityMenu
              columns={PURCHASE_COLUMNS}
              hidden={hiddenColumns}
              onToggle={toggleColumn}
              testId='purchase-columns'
            />
          </div>
        </CardContent>
      </Card>

      <Card className='min-w-0' data-testid='purchase-list-card'>
        <CardHeader>
          <CardTitle>Đơn hàng của bạn</CardTitle>
          <CardDescription>
            Số tiền là số đã thanh toán cho esim.vn, đã trừ phần hoàn tiền nếu có.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          {isLoading ? (
            <div className='flex justify-center py-12'>
              <Icons.spinner className='size-6 animate-spin' />
            </div>
          ) : purchases.length === 0 ? (
            <p className='text-muted-foreground py-12 text-center text-sm'>
              Chưa có đơn nào khớp với tìm kiếm này.
            </p>
          ) : (
            // Header pinned while the list scrolls (doitac-3010 #029).
            <div
              className='max-h-[70vh] overflow-auto rounded-md border'
              data-testid='purchase-table-scroll'
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
                  {pageRows.map((purchase) => (
                    <TableRow
                      key={purchase.orderNumber}
                      data-testid={`purchase-row-${purchase.orderNumber}`}
                    >
                      {visibleColumns.map((column) => (
                        <TableCell key={column.key} className={column.cellClassName}>
                          {column.cell(purchase)}
                        </TableCell>
                      ))}
                      <TableCell className='text-right'>
                        <PurchaseActions purchase={purchase} onRequest={startRequest} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {purchases.length > 0 && (
            <PortalListPagination
              pagination={pagination}
              unit='đơn hàng'
              testId='purchase-pagination'
            />
          )}
        </CardContent>
      </Card>

      <PickEsimDialog
        picking={picking}
        onPick={(iccid) => {
          if (picking) {
            setRequest({ iccid, orderNumber: picking.purchase.orderNumber, kind: picking.kind });
          }
          setPicking(null);
        }}
        onClose={() => setPicking(null)}
      />
      <EsimRequestDialog target={request} onClose={() => setRequest(null)} />
    </div>
  );
}

/**
 * "Tên sản phẩm × số lượng", then "+ N sản phẩm khác" (doitac-1410 #042) —
 * the prices of each line are on the order's own page.
 */
function ProductSummary({ purchase }: { purchase: MyPurchase }) {
  if (purchase.orderType === 'TOPUP') {
    return <span>{purchase.topupPackageName || 'Gói topup'}</span>;
  }
  const [first, ...rest] = purchase.items;
  if (!first) return <span className='text-muted-foreground'>—</span>;
  return (
    <div className='space-y-0.5'>
      <div className='truncate' title={first.planName ?? undefined}>
        {first.planName ?? '—'} × {first.quantity}
      </div>
      {rest.length > 0 && (
        <div className='text-muted-foreground'>+ {rest.length} sản phẩm khác</div>
      )}
    </div>
  );
}

/** Which of the order's eSIMs the fault or refund is about (doitac-3010 #029). */
function PickEsimDialog({
  picking,
  onPick,
  onClose
}: {
  picking: { purchase: MyPurchase; kind: FaultKind } | null;
  onPick: (iccid: string) => void;
  onClose: () => void;
}) {
  const esims = (picking?.purchase.esims ?? []).filter(
    (e) => picking?.kind === 'fault' || e.refundable
  );
  return (
    <Dialog open={Boolean(picking)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='sm:max-w-md' data-testid='purchase-pick-esim'>
        <DialogHeader>
          <DialogTitle>
            {picking?.kind === 'refund' ? 'Yêu cầu hoàn tiền' : 'Báo lỗi'} — chọn eSIM
          </DialogTitle>
          <DialogDescription>Đơn {picking?.purchase.orderNumber}</DialogDescription>
        </DialogHeader>
        {esims.length === 0 ? (
          <p className='text-muted-foreground text-sm'>
            {picking?.kind === 'refund'
              ? 'Đơn này không có eSIM nào hỗ trợ hoàn tiền.'
              : 'Đơn này chưa có eSIM nào.'}
          </p>
        ) : (
          <ul className='divide-y rounded-md border'>
            {esims.map((esim) => (
              <li key={esim.iccid} className='flex items-center justify-between gap-2 p-2'>
                <span className='font-mono text-xs'>{esim.iccid}</span>
                {esim.openReport ? (
                  <span className='text-xs text-red-600 dark:text-red-400'>
                    {esim.openReport === 'refund' ? 'Đang xem xét hoàn tiền' : 'Đang chờ xử lý lỗi'}
                  </span>
                ) : (
                  <Button size='sm' variant='outline' onClick={() => onPick(esim.iccid)}>
                    Chọn
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}

/**
 * "Xem chi tiết" on a dark button; "Gửi lại email eSIM", "Báo lỗi" and "Yêu
 * cầu hoàn tiền" behind the ⋮ beside it (doitac-1410 #042, doitac-3010 #029).
 */
function PurchaseActions({
  purchase,
  onRequest
}: {
  purchase: MyPurchase;
  onRequest: (purchase: MyPurchase, kind: FaultKind) => void;
}) {
  const resend = useMutation({
    mutationFn: () => resendPurchaseEmail(purchase.orderNumber),
    onSuccess: (result) =>
      toast.success(
        `Đã gửi lại ${result.sent} email eSIM${purchase.deliveryEmail ? ` tới ${purchase.deliveryEmail}` : ''}.`
      ),
    onError: (err: Error) => toast.error(err.message)
  });
  const canResend = purchase.orderType !== 'TOPUP' && purchase.esimCount > 0;
  const esims = purchase.esims ?? [];
  // Every eSIM already has a request open, or the order was refunded.
  const free = esims.filter((e) => !e.openReport);
  const closed = purchase.status === 'refunded';
  const canFault = !closed && free.length > 0;
  const canRefund = !closed && free.some((e) => e.refundable);
  return (
    <div className='flex items-center justify-end gap-1 whitespace-nowrap'>
      <Button size='sm' asChild>
        <Link href={`/dashboard/portal/orders/${encodeURIComponent(purchase.orderNumber)}`}>
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
            data-testid={`purchase-more-${purchase.orderNumber}`}
          >
            <Icons.ellipsis className='size-4' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuItem
            disabled={!canResend || resend.isPending}
            title={canResend ? undefined : 'Đơn chưa có eSIM để gửi'}
            onSelect={() => resend.mutate()}
          >
            {resend.isPending ? 'Đang gửi…' : 'Gửi lại email eSIM'}
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={!canFault}
            title={canFault ? undefined : 'Không còn eSIM nào để báo lỗi'}
            onSelect={() => onRequest(purchase, 'fault')}
          >
            Báo lỗi
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={!canRefund}
            title={canRefund ? undefined : 'Đơn không còn eSIM nào hoàn tiền được'}
            onSelect={() => onRequest(purchase, 'refund')}
          >
            Yêu cầu hoàn tiền
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
