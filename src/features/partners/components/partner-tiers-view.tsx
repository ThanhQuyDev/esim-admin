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
import { formatVnd } from '@/lib/format';

import { createTierMutation, updateTierMutation } from '../api/mutations';
import { tiersQueryOptions } from '../api/queries';
import type { CreateTierPayload, PartnerTier, PartnerType } from '../api/types';
import { PartnerTierFormDialog } from './partner-tier-form-dialog';

type TierTab = 'kol' | 'distribution' | 'api';

const TABS: { value: TierTab; label: string }[] = [
  { value: 'kol', label: 'Đối tác tiếp thị' },
  { value: 'distribution', label: 'Đối tác phân phối' },
  { value: 'api', label: 'Đối tác API' }
];

/** API partners run as distribution partners, on the same tiers. */
const typeOf = (tab: TierTab): PartnerType => (tab === 'kol' ? 'kol' : 'distribution');

export function PartnerTiersView() {
  const [tab, setTab] = useState<TierTab>('kol');
  const activeType = typeOf(tab);
  const [editingTier, setEditingTier] = useState<PartnerTier | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

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

  const rows = tiers
    .filter((t) => t.partnerType === activeType)
    .toSorted((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
  const isKol = activeType === 'kol';

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
        <Tabs value={tab} onValueChange={(v) => setTab(v as TierTab)}>
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

      {isLoading ? (
        <div className='flex justify-center py-12'>
          <Icons.spinner className='h-6 w-6 animate-spin' />
        </div>
      ) : (
        <div className='overflow-x-auto rounded-lg border' data-testid='tier-rows'>
          <Table>
            <TableHeader className='bg-muted'>
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
                    <TableHead className='text-right'>Mức % cộng giá gốc</TableHead>
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
                    Chưa có hạng nào.
                  </TableCell>
                </TableRow>
              )}
              {rows.map((tier) => (
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
                      <TableCell className='text-right tabular-nums'>
                        +{Number(tier.costMarkupPercent ?? 0)}%
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
      )}
    </div>
  );
}
