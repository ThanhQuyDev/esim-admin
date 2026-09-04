'use client';
import { useMutation, useQuery } from '@tanstack/react-query';
import { tiersQueryOptions } from '../api/queries';
import { createTierMutation, updateTierMutation } from '../api/mutations';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { toast } from 'sonner';
import { useState } from 'react';
import { PartnerTierFormDialog } from './partner-tier-form-dialog';
import type { PartnerTier, PartnerType } from '../api/types';

const TABS: { value: PartnerType; label: string }[] = [
  { value: 'kol', label: 'KOL (hoa hồng)' },
  { value: 'distribution', label: 'Đối tác phân phối (giảm giá tối đa)' }
];

export function PartnerTiersView() {
  const [activeType, setActiveType] = useState<PartnerType>('kol');
  const [editingTier, setEditingTier] = useState<PartnerTier | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const { data: tiers = [], refetch, isLoading } = useQuery(tiersQueryOptions());

  const createMutation = useMutation({
    ...createTierMutation,
    onSuccess: () => {
      toast.success('Đã tạo hạng đối tác.');
      setCreateOpen(false);
      refetch();
    },
    onError: (e: Error) => toast.error(e.message || 'Tạo hạng thất bại')
  });

  const updateMutation = useMutation({
    ...updateTierMutation,
    onSuccess: () => {
      toast.success('Đã cập nhật hạng đối tác.');
      setEditingTier(null);
      refetch();
    },
    onError: (e: Error) => toast.error(e.message || 'Cập nhật thất bại')
  });

  const filteredTiers = tiers
    .filter((t) => t.partnerType === activeType)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className='space-y-4'>
      <PartnerTierFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        partnerType={activeType}
        onSubmit={(data) => createMutation.mutate(data as import('../api/types').CreateTierPayload)}
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
        <div className='flex gap-1 rounded-lg border p-1'>
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveType(tab.value)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                activeType === tab.value ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <Button size='sm' onClick={() => setCreateOpen(true)}>
          <Icons.add className='mr-2 h-4 w-4' /> Thêm hạng
        </Button>
      </div>

      {isLoading ? (
        <div className='flex justify-center py-12'>
          <Icons.spinner className='h-6 w-6 animate-spin' />
        </div>
      ) : filteredTiers.length === 0 ? (
        <p className='text-muted-foreground py-12 text-center text-sm'>Chưa có hạng nào.</p>
      ) : (
        <div className='space-y-3'>
          {filteredTiers.map((tier) => (
            <div
              key={tier.id}
              className='flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4'
            >
              <div>
                <div className='flex items-center gap-2'>
                  <span className='font-medium'>{tier.tierName}</span>
                  <Badge variant='outline'>{tier.tierCode}</Badge>
                  {!tier.isActive && <Badge variant='destructive'>Ngừng hoạt động</Badge>}
                </div>
                <p className='text-muted-foreground text-sm'>
                  Ngưỡng doanh số: {tier.minVolumeVnd.toLocaleString('vi-VN')} VND
                  {activeType === 'kol'
                    ? ` · Hoa hồng: ${tier.commissionPercent}%`
                    : ` · Giảm giá tối đa: ${tier.maxDiscountPercent}%`}
                </p>
              </div>
              <Button size='sm' variant='outline' onClick={() => setEditingTier(tier)}>
                <Icons.edit className='mr-2 h-4 w-4' /> Sửa
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
