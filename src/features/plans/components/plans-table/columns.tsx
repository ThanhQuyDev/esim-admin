'use client';
/* eslint-disable @next/next/no-img-element */
import * as React from 'react';
import { PROVIDER_OPTIONS } from '@/lib/catalog-filters';
import { formatUsd, planUsd } from '@/lib/plan-price';
import { providerLabel } from '@/features/overview/api/constants';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { Plan } from '../../api/types';
import { Column, ColumnDef } from '@tanstack/react-table';
import { Icons } from '@/components/icons';
import { CellAction } from './cell-action';
import { formatPlanData } from '@/lib/format';
import { PLAN_TAG_OPTIONS } from '../../schemas/plan';
import { planDisplayName } from '../../utils/plan-label';

const PLAN_TAG_LABEL_MAP = new Map<string, string>(PLAN_TAG_OPTIONS.map((o) => [o.value, o.label]));

function CopyIdButton({ value }: { value: string }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = React.useCallback(() => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [value]);

  return (
    <button
      type='button'
      onClick={handleCopy}
      title={copied ? 'Đã copy!' : `Copy: ${value}`}
      className='text-muted-foreground hover:text-foreground inline-flex shrink-0 items-center rounded p-0.5 transition-colors'
      aria-label={`Copy ID: ${value}`}
    >
      {copied ? (
        <Icons.check className='size-3.5 text-green-500' />
      ) : (
        <Icons.copy className='size-3.5' />
      )}
    </button>
  );
}

/** "china-20gb-30days-fixed-ga" → "china-20gb-…" — enough to recognise it. */
export function shortCode(code: string, keep = 12): string {
  return code.length > keep ? `${code.slice(0, keep)}…` : code;
}

/** TikTok / ChatGPT as the storefront judges it (#045, test round 4). */
function AppSupportCell({ plan }: { plan: Plan }) {
  const support = plan.appSupport;
  let label = 'Không';
  let variant: 'default' | 'secondary' | 'outline' = 'secondary';
  if (support?.tiktokAllDevices && support.chatGpt) {
    label = 'Có';
    variant = 'default';
  } else if (support?.known && (support.chatGpt || support.tiktokIos || support.tiktokAndroid)) {
    const parts = [
      support.tiktokIos && !support.tiktokAndroid ? 'TikTok iPhone' : null,
      !support.tiktokIos && support.tiktokAndroid ? 'TikTok Android' : null,
      support.chatGpt ? 'ChatGPT' : null
    ].filter(Boolean);
    label = `Chỉ ${parts.join(', ')}`;
    variant = 'outline';
  } else if (!support?.known && !plan.isNonHkIp) {
    label = 'Chưa rõ';
    variant = 'outline';
  }
  // The verdict only: APN has its own column, and the exit IP is in the plan's
  // detail (vande #019).
  return (
    <div className='flex flex-col items-start gap-0.5' data-testid='plan-app-support'>
      <Badge variant={variant}>{label}</Badge>
    </div>
  );
}

export type PlanColumnOptions = {
  /** APN values in use, fetched at runtime (#010). */
  apnOptions?: { value: string; label: string }[];
  /**
   * One entry per destination and per region, `d:<id>` / `r:<id>`. Picking one
   * filters on the exact id, which is the point of #010: typing "Trung quốc"
   * matched China, China+Hong Kong and China+Macau all at once.
   */
  locationOptions?: { value: string; label: string }[];
};

const YES_NO_OPTIONS = [
  { value: 'true', label: 'Có' },
  { value: 'false', label: 'Không' }
];

export function buildColumns(options: PlanColumnOptions = {}): ColumnDef<Plan>[] {
  const { apnOptions = [], locationOptions = [] } = options;
  return [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && 'indeterminate')
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label='Chọn tất cả'
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label='Chọn hàng'
        />
      ),
      enableSorting: false,
      enableHiding: false,
      size: 40
    },
    {
      id: 'country',
      accessorFn: (row) => row.region?.name ?? row.destination?.name ?? row.countryCode,
      header: 'Điểm đến',
      cell: ({ row }) => {
        const dest = row.original.destination;
        const region = row.original.region;

        if (region && region.destinations && region.destinations.length > 0) {
          return (
            <div className='flex items-center gap-2'>
              {region.avatarUrl && (
                <img
                  src={region.avatarUrl}
                  alt={region.name}
                  className='h-5 w-7 rounded object-cover'
                />
              )}
              <span className='text-sm font-medium'>{region.name}</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant='ghost' size='sm' className='h-6 px-1.5 text-xs'>
                    <Icons.eye className='mr-1 size-3' />
                    {region.destinations.length} nước
                  </Button>
                </PopoverTrigger>
                <PopoverContent className='w-64 p-0' align='start'>
                  <div className='border-b px-3 py-2'>
                    <p className='text-sm font-medium'>{region.name}</p>
                    <p className='text-muted-foreground text-xs'>
                      {region.destinations.length} điểm đến
                    </p>
                  </div>
                  <div className='max-h-60 overflow-y-auto p-2'>
                    <div className='grid gap-1'>
                      {region.destinations.map((d) => (
                        <div key={d.id} className='flex items-center gap-2 rounded px-2 py-1'>
                          {d.flagUrl && (
                            <img
                              src={d.flagUrl}
                              alt={d.name}
                              className='h-4 w-5 shrink-0 rounded object-cover'
                            />
                          )}
                          <span className='text-sm'>{d.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          );
        }

        return (
          <div className='flex items-center gap-2'>
            {dest?.flagUrl && (
              <img src={dest.flagUrl} alt={dest.name} className='h-5 w-7 rounded object-cover' />
            )}
            <span className='text-sm'>{dest?.name ?? row.original.countryCode}</span>
          </div>
        );
      },
      enableSorting: false,
      enableColumnFilter: true,
      meta: {
        label: 'Quốc gia / khu vực',
        // A select, not a text box (#010): searching "Trung quốc" matched China,
        // China+Hong Kong and China+Macau together, so there was no way to see one
        // destination on its own.
        variant: 'multiSelect' as const,
        options: locationOptions
      }
    },
    {
      id: 'provider',
      accessorKey: 'provider',
      header: 'Nhà cung cấp',
      cell: ({ row }) => {
        const provider = row.original.provider;
        return (
          <Badge variant='outline' className='ml-1'>
            {providerLabel(provider)}
          </Badge>
        );
      },
      enableSorting: false,
      enableColumnFilter: true,
      meta: {
        label: 'Nhà cung cấp',
        variant: 'multiSelect' as const,
        // The shared supplier list, so the domestic suppliers ("iTel nội
        // địa"…, vande #001) are filterable here too.
        options: PROVIDER_OPTIONS
      }
    },
    {
      id: 'name',
      accessorKey: 'name',
      header: ({ column }: { column: Column<Plan, unknown> }) => (
        <DataTableColumnHeader column={column} title='Tên gói' />
      ),
      cell: ({ row }) => (
        <div className='flex flex-col'>
          {/* Three lines (vande #020): the name under the one naming rule, the
            supplier's own name, and the supplier code. The id line it replaces
            was no longer used. */}
          <span className='font-medium' data-testid='plan-standard-name'>
            {row.original.standardName || planDisplayName(row.original)}
          </span>
          {row.original.standardName && row.original.standardName !== row.original.name && (
            <span className='text-muted-foreground text-xs' data-testid='plan-supplier-name'>
              {planDisplayName(row.original)}
            </span>
          )}
          {/* Supplier package code, to paste into a blog post's plan list
            (#034, test round 4). Long codes are cut to their start; the copy
            button and the tooltip carry the full code. */}
          {row.original.providerPlanId && (
            <div
              className='text-muted-foreground flex items-center gap-1 text-xs'
              data-testid='plan-provider-code'
            >
              <span title={row.original.providerPlanId}>
                Mã NCC: <span className='font-mono'>{shortCode(row.original.providerPlanId)}</span>
              </span>
              <CopyIdButton value={row.original.providerPlanId} />
            </div>
          )}
        </div>
      ),
      meta: {
        label: 'Tên',
        placeholder: 'Tìm kiếm gói...',
        variant: 'text' as const,
        icon: Icons.text
      },
      enableColumnFilter: true
    },
    {
      id: 'duration',
      accessorKey: 'durationDays',
      header: ({ column }: { column: Column<Plan, unknown> }) => (
        <DataTableColumnHeader column={column} title='Thời hạn' />
      ),
      cell: ({ row }) => <span>{row.original.durationDays} ngày</span>,
      enableColumnFilter: true,
      meta: {
        label: 'Thời hạn',
        placeholder: 'Số ngày...',
        variant: 'number' as const,
        unit: 'ngày'
      }
    },
    {
      id: 'data',
      accessorKey: 'dataMb',
      header: 'Dữ liệu',
      cell: ({ row }) => {
        return <span>{formatPlanData(row.original)}</span>;
      },
      enableSorting: false,
      enableColumnFilter: true,
      meta: {
        label: 'Dữ liệu',
        placeholder: 'VD: 1GB, 50GB...',
        variant: 'text' as const
      }
    },
    {
      // Speed after the quota (#046, test round 4) — what decides between two
      // plans with the same data, days and price (384kbps beats 128kbps).
      id: 'throttling',
      accessorKey: 'fupSpeed',
      header: 'Throttling',
      cell: ({ row }) => <span className='whitespace-nowrap'>{row.original.fupSpeed || '—'}</span>,
      enableSorting: false
    },
    {
      id: 'hasCallSms',
      accessorFn: (row) =>
        Number(row.sms ?? 0) > 0 || Number(row.call ?? 0) > 0 ? 'true' : 'false',
      header: 'Gọi / SMS',
      // One column instead of three (doitac-1410 #071): Có/Không, then the
      // call minutes and the SMS under it — few plans carry either.
      cell: ({ row }) => {
        const call = Number(row.original.call ?? 0);
        const sms = Number(row.original.sms ?? 0);
        const hasCallSms = sms > 0 || call > 0;
        return (
          <div className='space-y-0.5 text-xs whitespace-nowrap' data-testid='plan-call-sms'>
            <Badge variant={hasCallSms ? 'default' : 'secondary'}>
              {hasCallSms ? 'Có' : 'Không'}
            </Badge>
            {hasCallSms && (
              <>
                <div>Call: {call > 0 ? `${call} phút` : '—'}</div>
                <div>SMS: {sms > 0 ? sms : '—'}</div>
              </>
            )}
          </div>
        );
      },
      enableSorting: false,
      enableColumnFilter: true,
      meta: {
        label: 'Chức năng gọi / SMS',
        variant: 'multiSelect' as const,
        options: [
          { value: 'true', label: 'Có' },
          { value: 'false', label: 'Không' }
        ]
      }
    },
    {
      id: 'price',
      accessorKey: 'price',
      header: ({ column }: { column: Column<Plan, unknown> }) => (
        <DataTableColumnHeader column={column} title='Giá' />
      ),
      cell: ({ row }) => {
        // Dollars for every plan, đồng-priced ones too (vande #005): a Viettel
        // plan used to read "Giá gốc: $198000.0000".
        const usd = planUsd(row.original);
        return (
          <div className='flex flex-col'>
            <span className='font-medium'>
              {formatUsd(usd.price)} - {Number(row.original.vndPrice).toLocaleString('vi-VN')}đ
            </span>
            <span className='text-muted-foreground text-xs'>
              Giá gốc: {formatUsd(usd.cost, 4)} · Giá bán: {formatUsd(usd.retail)}
            </span>
            {/* Includes the supplier's surcharge (v3 #018); "Giá gốc" is the raw
              figure their API quotes. */}
            {row.original.vndCostPrice ? (
              <span className='text-muted-foreground text-xs'>
                Giá vốn (gồm thuế phí): {Number(row.original.vndCostPrice).toLocaleString('vi-VN')}đ
              </span>
            ) : null}
          </div>
        );
      }
    },
    {
      id: 'discount',
      accessorKey: 'discount',
      header: 'Discount',
      cell: ({ row }) => {
        const discount = row.original.discount;
        return discount != null ? `${discount}%` : '—';
      },
      enableSorting: false
    },
    {
      id: 'tags',
      accessorKey: 'tags',
      header: 'Tags',
      cell: ({ row }) => {
        const tags = row.original.tags;
        if (!tags || tags.length === 0) return <span className='text-muted-foreground'>—</span>;
        return (
          <div className='flex flex-wrap gap-1'>
            {tags.map((tag) => (
              <Badge key={tag} variant='secondary' className='capitalize'>
                {PLAN_TAG_LABEL_MAP.get(tag) ?? tag}
              </Badge>
            ))}
          </div>
        );
      },
      enableSorting: false,
      enableColumnFilter: true,
      meta: {
        label: 'Tags',
        variant: 'multiSelect' as const,
        options: PLAN_TAG_OPTIONS
      }
    },
    {
      // Không / Có / Add-on (vande #019): Billion sells data add-ons apart from
      // top-ups that extend the plan.
      id: 'topUp',
      accessorFn: (row) => (row.isAddOn ? 'addon' : row.topUp ? 'topup' : 'none'),
      header: 'Top-Up',
      cell: ({ row }) => (
        <Badge
          variant={row.original.isAddOn ? 'outline' : row.original.topUp ? 'default' : 'secondary'}
          data-testid='plan-topup'
        >
          {row.original.isAddOn ? 'Add-on' : row.original.topUp ? 'Có' : 'Không'}
        </Badge>
      ),
      enableSorting: false,
      enableColumnFilter: true,
      meta: {
        label: 'Topup',
        variant: 'multiSelect' as const,
        options: [
          { value: 'none', label: 'Không' },
          { value: 'topup', label: 'Có' },
          { value: 'addon', label: 'Add-on' }
        ]
      }
    },
    {
      id: 'apn',
      accessorKey: 'apn',
      header: 'APN',
      cell: ({ row }) => <span className='font-mono text-xs'>{row.original.apn || '—'}</span>,
      enableSorting: false,
      enableColumnFilter: true,
      meta: {
        label: 'APN',
        variant: 'multiSelect' as const,
        options: apnOptions
      }
    },
    {
      // `isNonHkIp` means the exit IP is local rather than routed via Hong Kong,
      // which is what makes TikTok and ChatGPT work (#041) — so this is the
      // "Tiktok & ChatGPT" filter asked for in #010.
      id: 'isNonHkIp',
      accessorFn: (row) => (row.isNonHkIp ? 'true' : 'false'),
      header: 'Tiktok & AI',
      // The verdict the storefront uses — exit IP, else the APN table (#045,
      // test round 4) — so a plan whose APN works reads "Có" here too.
      cell: ({ row }) => <AppSupportCell plan={row.original} />,
      enableSorting: false,
      enableColumnFilter: true,
      meta: {
        label: 'Tiktok & AI',
        variant: 'multiSelect' as const,
        options: YES_NO_OPTIONS
      }
    },
    {
      id: 'isCheapest',
      accessorFn: (row) => (row.isCheapest ? 'true' : 'false'),
      header: 'Rẻ nhất',
      cell: ({ row }) => (
        <Badge variant={row.original.isCheapest ? 'default' : 'secondary'}>
          {row.original.isCheapest ? 'Có' : 'Không'}
        </Badge>
      ),
      enableSorting: false,
      enableColumnFilter: true,
      meta: {
        label: 'Rẻ nhất',
        variant: 'multiSelect' as const,
        options: [
          { value: 'true', label: 'Có' },
          { value: 'false', label: 'Không' }
        ]
      }
    },
    {
      id: 'type',
      accessorKey: 'type',
      header: 'Loại gói',
      cell: ({ row }) => (
        <div className='flex flex-col items-start gap-1' data-testid='plan-type'>
          {/* eSIM nội địa, kept apart from travel eSIMs (doitac-1410 #072). */}
          {row.original.isDomesticEsim && <Badge>Local</Badge>}
          {/* Not refundable (doitac-1410 #080). */}
          {row.original.isRefundable === false && (
            <Badge variant='secondary' data-testid='plan-no-refund'>
              Không hoàn tiền
            </Badge>
          )}
          <Badge variant='outline' className='capitalize'>
            {row.original.type || '—'}
          </Badge>
        </div>
      ),
      enableSorting: false,
      enableColumnFilter: true,
      meta: {
        label: 'Loại gói',
        variant: 'multiSelect' as const,
        options: [
          { value: 'fixed', label: 'Cố định' },
          { value: 'unlimited', label: 'Không giới hạn' },
          { value: 'unlimited-reduce', label: 'Không giới hạn tốc độ thấp' },
          { value: 'daily', label: 'Theo ngày' },
          { value: 'local', label: 'Local (eSIM nội địa)' }
        ]
      }
    },
    {
      id: 'isActive',
      accessorFn: (row) => (row.isActive ? 'true' : 'false'),
      header: 'Hoạt động',
      cell: ({ row }) => (
        <Badge variant={row.original.isActive ? 'default' : 'secondary'}>
          {row.original.isActive ? 'Hoạt động' : 'Không hoạt động'}
        </Badge>
      ),
      enableSorting: false,
      enableColumnFilter: true,
      meta: {
        label: 'Hoạt động',
        variant: 'multiSelect' as const,
        options: [
          { value: 'true', label: 'Hoạt động' },
          { value: 'false', label: 'Không hoạt động' }
        ]
      }
    },
    {
      id: 'actions',
      cell: ({ row }) => <CellAction data={row.original} />
    }
  ];
}

/**
 * Columns without runtime options. Kept so the sort parser can derive column ids
 * without waiting on the APN / destination lists.
 */
export const columns: ColumnDef<Plan>[] = buildColumns();
