'use client';
/* eslint-disable @next/next/no-img-element */
import * as React from 'react';
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
  const source = plan.isNonHkIp ? 'IP' : plan.apn ? `APN ${plan.apn}` : null;
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
  return (
    <div className='flex flex-col items-start gap-0.5' data-testid='plan-app-support'>
      <Badge variant={variant}>{label}</Badge>
      {(plan.ipExport || source) && (
        <span
          className='text-muted-foreground max-w-[160px] truncate text-xs'
          title={plan.apn ?? ''}
        >
          {plan.ipExport ? `IP: ${plan.ipExport}` : source}
        </span>
      )}
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
          <Badge variant='outline' className='capitalize'>
            {provider || '—'}
          </Badge>
        );
      },
      enableSorting: false,
      enableColumnFilter: true,
      meta: {
        label: 'Nhà cung cấp',
        variant: 'multiSelect' as const,
        options: [
          { value: 'esimaccess', label: 'EsimAccess' },
          { value: 'airalo', label: 'Airalo' },
          { value: 'gadgetkorea', label: 'Gadget Korea' },
          { value: 'microesim', label: 'MicroEsim' },
          { value: 'billion', label: 'Billion Connect' },
          { value: 'viettel', label: 'Viettel' }
        ]
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
          {/* Call/SMS allowance shown in the name so an admin can tell the plan
            types apart at a glance (#008). */}
          <span className='font-medium'>{planDisplayName(row.original)}</span>
          <div className='text-muted-foreground flex items-center gap-1 text-xs'>
            <span className='font-mono'>#{row.original.id}</span>
            <CopyIdButton value={String(row.original.id)} />
          </div>
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
      cell: ({ row }) => {
        const hasCallSms = Number(row.original.sms ?? 0) > 0 || Number(row.original.call ?? 0) > 0;
        return (
          <Badge variant={hasCallSms ? 'default' : 'secondary'}>
            {hasCallSms ? 'Có' : 'Không'}
          </Badge>
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
      id: 'sms',
      accessorKey: 'sms',
      header: 'SMS',
      cell: ({ row }) => <span>{row.original.sms != null ? row.original.sms : '—'}</span>,
      enableSorting: false
    },
    {
      id: 'call',
      accessorKey: 'call',
      header: 'Gọi điện',
      cell: ({ row }) => (
        <span>{row.original.call != null ? `${row.original.call} phút` : '—'}</span>
      ),
      enableSorting: false
    },
    {
      id: 'price',
      accessorKey: 'price',
      header: ({ column }: { column: Column<Plan, unknown> }) => (
        <DataTableColumnHeader column={column} title='Giá' />
      ),
      cell: ({ row }) => (
        <div className='flex flex-col'>
          <span className='font-medium'>
            ${row.original.price} {row.original.currency} -{' '}
            {Number(row.original.vndPrice).toLocaleString('vi-VN')}đ
          </span>
          <span className='text-muted-foreground text-xs'>
            Giá gốc: ${row.original.costPrice} · Giá bán: ${row.original.retailPrice}
          </span>
          {/* Includes the supplier's surcharge (v3 #018); "Giá gốc" is the raw
              figure their API quotes. */}
          {row.original.vndCostPrice ? (
            <span className='text-muted-foreground text-xs'>
              Giá vốn (gồm thuế phí): {Number(row.original.vndCostPrice).toLocaleString('vi-VN')}đ
            </span>
          ) : null}
        </div>
      )
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
      id: 'topUp',
      accessorFn: (row) => (row.topUp ? 'true' : 'false'),
      header: 'Top-Up',
      cell: ({ row }) => (
        <Badge variant={row.original.topUp ? 'default' : 'secondary'}>
          {row.original.topUp ? 'Có' : 'Không'}
        </Badge>
      ),
      enableSorting: false,
      enableColumnFilter: true,
      meta: {
        label: 'Topup',
        variant: 'multiSelect' as const,
        options: YES_NO_OPTIONS
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
        <Badge variant='outline' className='capitalize'>
          {row.original.type || '—'}
        </Badge>
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
          { value: 'daily', label: 'Theo ngày' }
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
