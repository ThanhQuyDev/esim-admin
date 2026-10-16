'use client';

/**
 * "Đơn hàng đối tác" (#071, doitac-1410 #058).
 *
 * One tab per partner type, because "đơn hàng" means two different things: for
 * a marketing partner it is somebody else's order credited to them, for a
 * distribution partner it is an order they placed themselves. Both tabs read
 * the same endpoints the partners' own screens read, so a partner disputing a
 * figure and the admin looking it up cannot be shown different numbers.
 */

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
import { Icons } from '@/components/icons';
import { commissionRejectionText } from '@/lib/commission-rejection';
import { formatDateTimeVn, formatVnd } from '@/lib/format';
import { cn } from '@/lib/utils';

import { partnerOptionsQueryOptions, partnerOrdersQueryOptions } from '../api/queries';
import type {
  AdminDistributionOrderRow,
  AdminMarketingOrderRow,
  PartnerOption,
  PartnerOrderItem
} from '../api/types';

type PartnerTab = 'kol' | 'distribution';

const ORDER_STATUS = [
  { value: 'all', label: 'Tất cả trạng thái' },
  { value: 'pending', label: 'Chờ thanh toán' },
  { value: 'paid', label: 'Đã thanh toán' },
  { value: 'completed', label: 'Hoàn thành' },
  { value: 'cancelled', label: 'Đã huỷ' },
  { value: 'refunded', label: 'Đã hoàn tiền' }
];
const ORDER_STATUS_LABEL: Record<string, string> = {
  ...Object.fromEntries(ORDER_STATUS.map((s) => [s.value, s.label])),
  processing: 'Đang xử lý',
  failed: 'Thất bại',
  manual_intervention: 'Đang xử lý thủ công'
};

/** "Nguồn ghi nhận" of a marketing order (doitac-1410 #058). */
const SOURCES = [
  { value: 'all', label: 'Mọi nguồn ghi nhận' },
  { value: 'link', label: 'Link giới thiệu' },
  { value: 'coupon', label: 'Mã giảm giá' },
  { value: 'member', label: 'Khách gắn với đối tác' }
];

/** "Loại đơn" of a distribution order (doitac-1410 #058). */
const ORDER_TYPES = [
  { value: 'all', label: 'Mọi loại đơn' },
  { value: 'BUY_NEW', label: 'Mua eSIM' },
  { value: 'TOPUP', label: 'Nạp topup' }
];

const COMMISSION_STATUS_LABEL: Record<string, string> = {
  pending: 'Chờ xác nhận',
  credited: 'Đã cộng ví',
  reversed: 'Đã hoàn',
  rejected: 'Bị loại'
};

const detailHref = (orderNumber: string, tab: PartnerTab) =>
  `/dashboard/partners/orders/${encodeURIComponent(orderNumber)}${tab === 'distribution' ? '?type=distribution' : ''}`;

export function PartnerOrdersView({ initialTab = 'kol' }: { initialTab?: PartnerTab }) {
  return (
    <Tabs defaultValue={initialTab} className='grid min-w-0 grid-cols-1 gap-4'>
      <TabsList>
        <TabsTrigger value='kol'>Đối tác tiếp thị</TabsTrigger>
        <TabsTrigger value='distribution'>Đối tác phân phối</TabsTrigger>
      </TabsList>
      <TabsContent value='kol' className='min-w-0'>
        <OrdersTab partnerType='kol' />
      </TabsContent>
      <TabsContent value='distribution' className='min-w-0'>
        <OrdersTab partnerType='distribution' />
      </TabsContent>
    </Tabs>
  );
}

function OrdersTab({ partnerType }: { partnerType: PartnerTab }) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [partnerId, setPartnerId] = useState<number | null>(null);
  const [iccid, setIccid] = useState('');
  const [planName, setPlanName] = useState('');
  const [email, setEmail] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [source, setSource] = useState('all');
  const [orderType, setOrderType] = useState('all');
  const distribution = partnerType === 'distribution';

  const filters = useMemo(
    () => ({
      partnerType,
      limit: 200,
      ...(search.trim() && { search: search.trim() }),
      ...(status !== 'all' && { status }),
      ...(partnerId !== null && { partnerId }),
      ...(iccid.trim() && { iccid: iccid.trim() }),
      ...(planName.trim() && { planName: planName.trim() }),
      ...(email.trim() && { email: email.trim() }),
      ...(from && { from }),
      ...(to && { to }),
      ...(!distribution && source !== 'all' && { source }),
      ...(distribution && orderType !== 'all' && { orderType })
    }),
    [
      partnerType,
      search,
      status,
      partnerId,
      iccid,
      planName,
      email,
      from,
      to,
      source,
      orderType,
      distribution
    ]
  );

  const { data: options = [] } = useQuery(partnerOptionsQueryOptions(partnerType));
  // One endpoint, two row shapes: which one comes back is decided by the tab,
  // so the query is typed as either and each table narrows it.
  const { data, isLoading } = useQuery(
    partnerOrdersQueryOptions<AdminMarketingOrderRow | AdminDistributionOrderRow>(filters)
  );
  const rows = data ?? [];

  return (
    <div className='grid min-w-0 grid-cols-1 gap-4'>
      <div
        className='flex flex-wrap items-center gap-2'
        data-testid={`order-filters-${partnerType}`}
      >
        <Input
          placeholder='Mã đơn hàng'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className='w-full sm:w-[200px]'
          aria-label='Mã đơn hàng'
        />
        <PartnerPicker options={options} value={partnerId} onChange={setPartnerId} />
        <Input
          placeholder='ICCID'
          value={iccid}
          onChange={(e) => setIccid(e.target.value)}
          className='w-full sm:w-[190px]'
          aria-label='ICCID'
        />
        <Input
          placeholder='Tên sản phẩm'
          value={planName}
          onChange={(e) => setPlanName(e.target.value)}
          className='w-full sm:w-[180px]'
          aria-label='Tên sản phẩm'
        />
        <Input
          placeholder={distribution ? 'Email nhận eSIM' : 'Email khách hàng'}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className='w-full sm:w-[200px]'
          aria-label='Email'
        />
        <div className='flex w-full items-center gap-1 sm:w-auto'>
          <Input
            type='date'
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className='min-w-0 flex-1 sm:w-[150px]'
            aria-label='Từ ngày'
          />
          <span className='text-muted-foreground text-sm'>→</span>
          <Input
            type='date'
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className='min-w-0 flex-1 sm:w-[150px]'
            aria-label='Đến ngày'
          />
        </div>
        {distribution ? (
          <Select value={orderType} onValueChange={setOrderType}>
            <SelectTrigger className='w-full sm:w-[160px]' aria-label='Loại đơn'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ORDER_TYPES.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Select value={source} onValueChange={setSource}>
            <SelectTrigger className='w-full sm:w-[200px]' aria-label='Nguồn ghi nhận'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SOURCES.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className='w-full sm:w-[180px]' aria-label='Trạng thái'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ORDER_STATUS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant='outline'
          className='sm:ml-auto'
          onClick={() => {
            const query = new URLSearchParams(
              Object.entries(filters).reduce<Record<string, string>>((acc, [k, v]) => {
                if (k !== 'limit') acc[k] = String(v);
                return acc;
              }, {})
            ).toString();
            window.location.href = `/api/partners/orders/export-excel?${query}`;
          }}
        >
          <Icons.download className='mr-2 h-4 w-4' />
          Xuất file
        </Button>
      </div>

      {isLoading ? (
        <div className='flex justify-center py-12'>
          <Icons.spinner className='h-6 w-6 animate-spin' />
        </div>
      ) : rows.length === 0 ? (
        <p className='text-muted-foreground py-12 text-center text-sm'>
          Không có đơn hàng nào khớp bộ lọc.
        </p>
      ) : (
        <div
          className='overflow-x-auto rounded-lg border'
          data-testid={`order-rows-${partnerType}`}
        >
          {distribution ? (
            <DistributionTable rows={rows as AdminDistributionOrderRow[]} />
          ) : (
            <MarketingTable rows={rows as AdminMarketingOrderRow[]} />
          )}
        </div>
      )}
    </div>
  );
}

/** "Lọc theo đối tác", with a box to type the name (doitac-1410 #058). */
function PartnerPicker({
  options,
  value,
  onChange
}: {
  options: PartnerOption[];
  value: number | null;
  onChange: (value: number | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.id === value);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type='button'
          variant='outline'
          role='combobox'
          aria-expanded={open}
          aria-label='Lọc theo đối tác'
          className='w-full justify-between font-normal sm:w-[240px]'
          data-testid='partner-picker'
        >
          <span className='truncate'>
            {selected ? `${selected.name} · #${selected.id}` : 'Tất cả đối tác'}
          </span>
          <Icons.chevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-[300px] p-0' align='start'>
        <Command>
          <CommandInput placeholder='Nhập tên, email hoặc ID đối tác…' />
          <CommandList>
            <CommandEmpty>Không tìm thấy đối tác.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value='__all__ tất cả đối tác'
                onSelect={() => {
                  onChange(null);
                  setOpen(false);
                }}
              >
                <Icons.check
                  className={cn('mr-2 h-4 w-4', value === null ? 'opacity-100' : 'opacity-0')}
                />
                Tất cả đối tác
              </CommandItem>
              {options.map((option) => (
                <CommandItem
                  key={option.id}
                  value={`${option.name} ${option.email ?? ''} #${option.id}`}
                  onSelect={() => {
                    onChange(option.id);
                    setOpen(false);
                  }}
                >
                  <Icons.check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === option.id ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <span className='min-w-0'>
                    <span className='block truncate'>{option.name}</span>
                    <span className='text-muted-foreground block truncate text-xs'>
                      #{option.id}
                      {option.email && ` · ${option.email}`}
                    </span>
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

/**
 * The first product on its own line, the rest behind "+N sản phẩm khác"
 * (doitac-1410 #058) — several names on one line ran into each other.
 */
function ProductsCell({ items, fallback }: { items: PartnerOrderItem[]; fallback?: string }) {
  if (items.length === 0) {
    return <span className='text-muted-foreground'>{fallback ?? '—'}</span>;
  }
  const [first, ...rest] = items;
  return (
    <div className='min-w-[180px] space-y-1'>
      <div className='line-clamp-2'>
        {first.planName ?? '—'} × {first.quantity}
      </div>
      {rest.length > 0 && (
        <Popover>
          <PopoverTrigger asChild>
            <button
              type='button'
              className='text-primary text-xs font-medium hover:underline'
              data-testid='more-products'
            >
              +{rest.length} sản phẩm khác
            </button>
          </PopoverTrigger>
          <PopoverContent align='start' className='w-80 space-y-1'>
            <p className='text-muted-foreground mb-2 text-xs'>{items.length} sản phẩm trong đơn</p>
            {items.map((item, index) => (
              <div key={`${item.planName}-${index}`} className='flex justify-between gap-3 text-sm'>
                <span className='min-w-0'>
                  {item.planName ?? '—'} × {item.quantity}
                </span>
                <span className='shrink-0 tabular-nums'>{formatVnd(item.vndPrice)}</span>
              </div>
            ))}
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}

function PartnerCell({ id, name }: { id: number; name: string | null }) {
  return (
    <>
      <div className='text-sm font-medium'>{name ?? `Đối tác #${id}`}</div>
      <div className='text-muted-foreground text-xs'>#{id}</div>
    </>
  );
}

function DetailButton({ orderNumber, tab }: { orderNumber: string; tab: PartnerTab }) {
  return (
    <Button asChild variant='outline' size='sm'>
      <Link href={detailHref(orderNumber, tab)}>Xem chi tiết</Link>
    </Button>
  );
}

/** The affiliate tab: somebody else's order, credited to a partner. */
function MarketingTable({ rows }: { rows: AdminMarketingOrderRow[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Mã đơn hàng</TableHead>
          <TableHead>Đối tác</TableHead>
          <TableHead>Sản phẩm</TableHead>
          <TableHead className='text-right'>Doanh thu</TableHead>
          <TableHead>Nguồn ghi nhận</TableHead>
          <TableHead>Khách hàng</TableHead>
          <TableHead className='text-right'>eSIM</TableHead>
          <TableHead className='text-right'>Hoa hồng</TableHead>
          <TableHead>Trạng thái</TableHead>
          <TableHead>Ngày đặt</TableHead>
          <TableHead className='text-right'>Thao tác</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.orderNumber}>
            <TableCell className='font-mono text-xs'>
              <Link
                href={detailHref(row.orderNumber, 'kol')}
                className='underline-offset-2 hover:underline'
              >
                {row.orderNumber}
              </Link>
            </TableCell>
            <TableCell>
              <PartnerCell id={row.partnerId} name={row.partnerName} />
            </TableCell>
            <TableCell className='text-sm'>
              <ProductsCell items={row.items} />
            </TableCell>
            <TableCell className='text-right tabular-nums'>{formatVnd(row.vndPrice)}</TableCell>
            <TableCell className='text-sm'>
              {row.linkCode ? (
                <Badge variant='outline'>Link {row.linkCode}</Badge>
              ) : row.couponCode ? (
                <Badge variant='outline'>Mã {row.couponCode}</Badge>
              ) : (
                <span className='text-muted-foreground'>Khách gắn với đối tác</span>
              )}
            </TableCell>
            <TableCell className='text-sm'>
              {row.customerType === 'new' ? 'Khách mới' : 'Khách cũ'}
            </TableCell>
            <TableCell className='text-right tabular-nums'>{row.esimCount}</TableCell>
            <TableCell className='text-right tabular-nums'>
              {row.commissionVnd == null ? (
                <span className='text-muted-foreground'>—</span>
              ) : (
                <>
                  {formatVnd(row.commissionVnd)}
                  {row.commissionPercent != null && (
                    <span className='text-muted-foreground text-xs'>
                      {' '}
                      ({row.commissionPercent}%)
                    </span>
                  )}
                </>
              )}
            </TableCell>
            <TableCell>
              <Badge variant='outline'>{ORDER_STATUS_LABEL[row.status] ?? row.status}</Badge>
              {row.commissionStatus && (
                <div className='text-muted-foreground mt-1 text-xs'>
                  {COMMISSION_STATUS_LABEL[row.commissionStatus] ?? row.commissionStatus}
                </div>
              )}
              {commissionRejectionText(row.rejectionReason) && (
                <div
                  className='text-destructive mt-1 max-w-[220px] text-xs'
                  data-testid='row-rejection'
                >
                  {commissionRejectionText(row.rejectionReason)}
                </div>
              )}
            </TableCell>
            <TableCell className='text-sm whitespace-nowrap'>
              {formatDateTimeVn(row.createdAt)}
            </TableCell>
            <TableCell className='text-right'>
              <DetailButton orderNumber={row.orderNumber} tab='kol' />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

/**
 * The distribution tab: an order the partner placed themselves, with the
 * columns of the test round of 14/10 (doitac-1410 #058).
 */
function DistributionTable({ rows }: { rows: AdminDistributionOrderRow[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Mã đơn hàng</TableHead>
          <TableHead>Đối tác</TableHead>
          <TableHead>Sản phẩm × số lượng</TableHead>
          <TableHead className='text-right'>Tổng tiền</TableHead>
          <TableHead>Loại đơn</TableHead>
          <TableHead>Ngày mua</TableHead>
          <TableHead>Trạng thái</TableHead>
          <TableHead className='text-right'>Thao tác</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.orderNumber}>
            <TableCell className='font-mono text-xs'>
              <Link
                href={detailHref(row.orderNumber, 'distribution')}
                className='underline-offset-2 hover:underline'
              >
                {row.orderNumber}
              </Link>
            </TableCell>
            <TableCell>
              <PartnerCell id={row.partnerId} name={row.partnerName} />
            </TableCell>
            <TableCell className='text-sm'>
              <ProductsCell
                items={row.items}
                fallback={row.topupPackageName ? `Topup ${row.topupPackageName}` : undefined}
              />
            </TableCell>
            <TableCell className='text-right font-medium tabular-nums'>
              {formatVnd(row.paidVnd)}
            </TableCell>
            <TableCell className='text-sm whitespace-nowrap'>
              {row.orderType === 'TOPUP' ? 'Nạp topup' : 'Mua eSIM'}
            </TableCell>
            <TableCell className='text-sm whitespace-nowrap'>
              {formatDateTimeVn(row.createdAt)}
            </TableCell>
            <TableCell>
              <Badge variant='outline'>{ORDER_STATUS_LABEL[row.status] ?? row.status}</Badge>
            </TableCell>
            <TableCell className='text-right'>
              <DetailButton orderNumber={row.orderNumber} tab='distribution' />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
