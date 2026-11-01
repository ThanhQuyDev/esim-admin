'use client';

/**
 * "Hạng đối tác" as a list (doitac-1410 #059, #060): one tab per kind of
 * partner, every tier — public and internal, active or not — with its
 * thresholds, its benefit, whether new partners start on it, and how many
 * partners are on it now.
 */

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Icons } from '@/components/icons';
import {
  PortalListPagination,
  usePortalPagination
} from '@/features/partner-portal/components/portal-list-pagination';
import { formatVnd } from '@/lib/format';

import { createTierMutation, updateTierMutation } from '../api/mutations';
import { tiersQueryOptions } from '../api/queries';
import type { CreateTierPayload, PartnerTier, PartnerType } from '../api/types';
import { PartnerTierFormDialog } from './partner-tier-form-dialog';
import { markupLines } from './tier-markup';

type TierTab = 'kol' | 'distribution' | 'api';

const TABS: { value: TierTab; label: string }[] = [
  { value: 'kol', label: 'Đối tác tiếp thị' },
  { value: 'distribution', label: 'Đối tác phân phối' },
  { value: 'api', label: 'Đối tác API' }
];

/** API partners run as distribution partners, on the same tiers. */
const typeOf = (tab: TierTab): PartnerType => (tab === 'kol' ? 'kol' : 'distribution');

const PAGE_SIZES = [10, 20, 30, 40, 50, 100, 200];

/** The filters above the list (doitac-3010 #040). */
const EMPTY_FILTERS = {
  search: '',
  commission: 'all',
  days: 'all',
  kind: 'all',
  status: 'all'
};

/** The distinct values of a column, for its filter, smallest first. */
const distinct = (values: number[]) => [...new Set(values)].toSorted((a, b) => a - b);

export function PartnerTiersView() {
  const [tab, setTab] = useState<TierTab>('kol');
  const activeType = typeOf(tab);
  const [editingTier, setEditingTier] = useState<PartnerTier | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const setFilter = (patch: Partial<typeof EMPTY_FILTERS>) =>
    setFilters((f) => ({ ...f, ...patch }));

  const { data: tiers = [], refetch, isLoading } = useQuery(tiersQueryOptions());

  const createMutation = useMutation({
    ...createTierMutation,
    onSuccess: () => {
      toast.success('Đã tạo hạng đối tác.');
      setCreateOpen(false);
      void refetch();
    },
    onError: (e: Error) => toast.error(e.message || 'Tạo hạng thất bại')
  });

  const updateMutation = useMutation({
    ...updateTierMutation,
    onSuccess: () => {
      toast.success('Đã cập nhật hạng đối tác.');
      setEditingTier(null);
      void refetch();
    },
    onError: (e: Error) => toast.error(e.message || 'Cập nhật thất bại')
  });

  const ofType = tiers
    .filter((t) => t.partnerType === activeType)
    .toSorted((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
  const isKol = activeType === 'kol';
  const commissionOptions = distinct(ofType.map((t) => Number(t.commissionPercent)));
  const dayOptions = distinct(ofType.map((t) => t.attributionDays ?? 30));

  const term = filters.search.trim().toLowerCase();
  const rows = ofType.filter(
    (t) =>
      (!term ||
        t.tierCode.toLowerCase().includes(term) ||
        t.tierName.toLowerCase().includes(term)) &&
      (!isKol ||
        filters.commission === 'all' ||
        Number(t.commissionPercent) === Number(filters.commission)) &&
      (!isKol || filters.days === 'all' || (t.attributionDays ?? 30) === Number(filters.days)) &&
      (filters.kind === 'all' || (filters.kind === 'internal') === Boolean(t.isInternal)) &&
      (filters.status === 'all' || (filters.status === 'active') === t.isActive)
  );
  const { pageRows, pagination } = usePortalPagination(rows, 20);
  const filtered = JSON.stringify(filters) !== JSON.stringify(EMPTY_FILTERS);

  return (
    <div className='grid min-w-0 grid-cols-1 gap-4'>
      <PartnerTierFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        partnerType={activeType}
        onSubmit={(data) => createMutation.mutate(data as CreateTierPayload)}
        isSubmitting={createMutation.isPending}
      />
      <PartnerTierFormDialog
        open={editingTier !== null}
        onOpenChange={(open) => !open && setEditingTier(null)}
        partnerType={activeType}
        tier={editingTier}
        onSubmit={(data) => editingTier && updateMutation.mutate({ id: editingTier.id, data })}
        isSubmitting={updateMutation.isPending}
      />

      <div className='flex flex-wrap items-center justify-between gap-3'>
        <Tabs
          value={tab}
          onValueChange={(v) => {
            setTab(v as TierTab);
            setFilters(EMPTY_FILTERS);
          }}
        >
          <TabsList>
            {TABS.map((t) => (
              <TabsTrigger key={t.value} value={t.value}>
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <Button size='sm' onClick={() => setCreateOpen(true)}>
          <Icons.add className='mr-2 h-4 w-4' /> Thêm hạng
        </Button>
      </div>
      {tab === 'api' && (
        <p className='text-muted-foreground text-sm' data-testid='api-tier-note'>
          Đối tác API được hệ thống quản lý như đối tác phân phối, nên dùng chung danh sách hạng
          dưới đây.
        </p>
      )}

      {/* Search and filters above every tab's list (doitac-3010 #040). */}
      <div className='flex flex-wrap items-center gap-2' data-testid='tier-filters'>
        <div className='relative w-full sm:w-[260px]'>
          <Icons.search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
          <Input
            placeholder='Tìm theo mã hạng, tên hạng…'
            value={filters.search}
            onChange={(e) => setFilter({ search: e.target.value })}
            className='pl-9'
            aria-label='Tìm hạng'
            data-testid='tier-search'
          />
        </div>
        {isKol && (
          <>
            <Select value={filters.commission} onValueChange={(v) => setFilter({ commission: v })}>
              <SelectTrigger
                className='w-full sm:w-[180px]'
                aria-label='Mức hoa hồng'
                data-testid='tier-filter-commission'
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Mọi mức hoa hồng</SelectItem>
                {commissionOptions.map((value) => (
                  <SelectItem key={value} value={String(value)}>
                    Hoa hồng {value}%
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filters.days} onValueChange={(v) => setFilter({ days: v })}>
              <SelectTrigger
                className='w-full sm:w-[190px]'
                aria-label='Số ngày ghi nhận'
                data-testid='tier-filter-days'
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Mọi số ngày ghi nhận</SelectItem>
                {dayOptions.map((value) => (
                  <SelectItem key={value} value={String(value)}>
                    Ghi nhận {value} ngày
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        )}
        <Select value={filters.kind} onValueChange={(v) => setFilter({ kind: v })}>
          <SelectTrigger
            className='w-full sm:w-[160px]'
            aria-label='Loại hạng'
            data-testid='tier-filter-kind'
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>Mọi loại hạng</SelectItem>
            <SelectItem value='public'>Công khai</SelectItem>
            <SelectItem value='internal'>Nội bộ</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filters.status} onValueChange={(v) => setFilter({ status: v })}>
          <SelectTrigger
            className='w-full sm:w-[180px]'
            aria-label='Trạng thái'
            data-testid='tier-filter-status'
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>Tất cả trạng thái</SelectItem>
            <SelectItem value='active'>Đang hoạt động</SelectItem>
            <SelectItem value='inactive'>Không hoạt động</SelectItem>
          </SelectContent>
        </Select>
        {filtered && (
          <Button
            variant='ghost'
            onClick={() => setFilters(EMPTY_FILTERS)}
            data-testid='tier-filter-clear'
          >
            <Icons.close className='mr-1 h-4 w-4' />
            Xoá bộ lọc
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className='flex justify-center py-12'>
          <Icons.spinner className='h-6 w-6 animate-spin' />
        </div>
      ) : (
        <>
          {/* Header pinned while the list scrolls (doitac-3010 #040). */}
          <div className='max-h-[70vh] overflow-auto rounded-lg border' data-testid='tier-rows'>
            <Table>
              <TableHeader className='bg-muted sticky top-0 z-10 shadow-[0_1px_0_var(--border)] [&_th]:bg-muted'>
                <TableRow>
                  <TableHead>Mã hạng</TableHead>
                  <TableHead>Tên hạng</TableHead>
                  <TableHead className='text-right'>Ngưỡng doanh số</TableHead>
                  {isKol ? (
                    <>
                      <TableHead className='text-right'>Mức hoa hồng</TableHead>
                      <TableHead className='text-right'>Số ngày ghi nhận hoa hồng</TableHead>
                    </>
                  ) : (
                    <>
                      <TableHead>Cộng vào giá gốc</TableHead>
                      <TableHead className='text-right'>Ngưỡng ký quỹ</TableHead>
                      <TableHead className='text-right'>Chiết khấu %</TableHead>
                    </>
                  )}
                  <TableHead>Loại hạng</TableHead>
                  <TableHead className='text-center'>Hạng mặc định</TableHead>
                  <TableHead className='text-right'>Đối tác</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className='text-right'>Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={isKol ? 10 : 11}
                      className='text-muted-foreground h-24 text-center'
                    >
                      {ofType.length === 0 ? 'Chưa có hạng nào.' : 'Không có hạng nào khớp bộ lọc.'}
                    </TableCell>
                  </TableRow>
                )}
                {pageRows.map((tier) => (
                  <TableRow key={tier.id}>
                    <TableCell className='font-mono text-xs'>{tier.tierCode}</TableCell>
                    <TableCell className='font-medium'>{tier.tierName}</TableCell>
                    <TableCell className='text-right tabular-nums'>
                      {formatVnd(Number(tier.minVolumeVnd))}
                    </TableCell>
                    {isKol ? (
                      <>
                        <TableCell className='text-right tabular-nums'>
                          {Number(tier.commissionPercent)}%
                        </TableCell>
                        <TableCell className='text-right tabular-nums'>
                          {tier.attributionDays ?? 30} ngày
                        </TableCell>
                      </>
                    ) : (
                      <>
                        {/* The price bands, then the % outside them (doitac-3010 #040). */}
                        <TableCell className='text-xs tabular-nums' data-testid='tier-markup'>
                          {markupLines(tier).map((line) => (
                            <div key={line}>{line}</div>
                          ))}
                        </TableCell>
                        <TableCell className='text-right tabular-nums'>
                          {Number(tier.minDepositVnd ?? 0) > 0
                            ? formatVnd(Number(tier.minDepositVnd))
                            : '—'}
                        </TableCell>
                        <TableCell className='text-right tabular-nums'>
                          {Number(tier.maxDiscountPercent)}%
                        </TableCell>
                      </>
                    )}
                    <TableCell>
                      <Badge variant={tier.isInternal ? 'secondary' : 'outline'}>
                        {tier.isInternal ? 'Nội bộ' : 'Công khai'}
                      </Badge>
                    </TableCell>
                    <TableCell className='text-center'>
                      <input
                        type='radio'
                        name={`default-tier-${activeType}`}
                        className='accent-primary size-4 align-middle'
                        checked={Boolean(tier.isDefault)}
                        disabled={!tier.isActive || updateMutation.isPending}
                        title={
                          tier.isActive ? undefined : 'Hạng ngừng hoạt động không thể là mặc định'
                        }
                        aria-label={`Đặt ${tier.tierName} làm hạng mặc định`}
                        onChange={() =>
                          updateMutation.mutate({ id: tier.id, data: { isDefault: true } })
                        }
                      />
                    </TableCell>
                    <TableCell className='text-right tabular-nums'>
                      {tier.partnerCount ?? 0}
                    </TableCell>
                    <TableCell>
                      <Badge variant={tier.isActive ? 'default' : 'destructive'}>
                        {tier.isActive ? 'Đang hoạt động' : 'Không hoạt động'}
                      </Badge>
                    </TableCell>
                    <TableCell className='text-right'>
                      <Button size='sm' variant='outline' onClick={() => setEditingTier(tier)}>
                        <Icons.edit className='mr-2 h-4 w-4' /> Sửa
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {rows.length > 0 && (
            <PortalListPagination
              pagination={pagination}
              unit='hạng'
              testId='tier-pagination'
              pageSizes={PAGE_SIZES}
            />
          )}
        </>
      )}
    </div>
  );
}
