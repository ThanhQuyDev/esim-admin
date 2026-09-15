'use client';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { ApiError } from '@/lib/api-client';
import { membershipTiersQueryOptions } from '../api/queries';
import { updateMembershipTierMutation } from '../api/mutations';
import type { MembershipTier, MembershipTierCode } from '../api/types';
import { MembershipTierFormDialog } from './membership-tier-form-dialog';

export const TIER_LABELS: Record<MembershipTierCode, string> = {
  traveler: 'Du khách',
  silver: 'Du khách bạc',
  gold: 'Du khách vàng',
  platinum: 'Du khách bạch kim'
};

/** Backend validation codes → what the admin should read. */
const ERROR_MESSAGES: Record<string, string> = {
  lowestTierMustStartAtZero: 'Hạng thấp nhất (Du khách) phải bắt đầu từ 0đ.',
  minimumSpendNotAscending: 'Ngưỡng chi tiêu phải tăng dần: hạng cao hơn cần ngưỡng lớn hơn.',
  invalidMinimumSpend: 'Ngưỡng chi tiêu phải là số nguyên không âm.',
  invalidCashbackPercent: '% hoàn tiền phải từ 0 đến 100.',
  invalidReferralReward: 'Thưởng giới thiệu phải là số nguyên không âm.'
};

function describeError(error: Error): string {
  if (error instanceof ApiError && error.errors) {
    const code = Object.values(error.errors)[0];
    if (code && ERROR_MESSAGES[code]) return ERROR_MESSAGES[code];
  }
  return 'Cập nhật hạng thất bại.';
}

const vnd = (value: number) => `${value.toLocaleString('vi-VN')}đ`;

export function MembershipTiersView() {
  const [editingTier, setEditingTier] = useState<MembershipTier | null>(null);
  const { data: tiers = [], isLoading } = useQuery(membershipTiersQueryOptions());

  const updateMutation = useMutation({
    ...updateMembershipTierMutation,
    onSuccess: () => {
      toast.success('Đã cập nhật hạng khách hàng.');
      setEditingTier(null);
    },
    onError: (error: Error) => toast.error(describeError(error))
  });

  const editingIndex = editingTier ? tiers.findIndex((t) => t.tier === editingTier.tier) : -1;

  return (
    <div className='space-y-4'>
      <MembershipTierFormDialog
        open={editingTier !== null}
        onOpenChange={(open) => !open && setEditingTier(null)}
        tier={editingTier}
        label={editingTier ? TIER_LABELS[editingTier.tier] : ''}
        lowerTier={editingIndex > 0 ? tiers[editingIndex - 1] : null}
        higherTier={editingIndex >= 0 ? (tiers[editingIndex + 1] ?? null) : null}
        onSubmit={(data) => editingTier && updateMutation.mutate({ tier: editingTier.tier, data })}
        isSubmitting={updateMutation.isPending}
      />

      <p className='text-muted-foreground text-sm'>
        Khách được lên hạng tự động khi tổng chi tiêu đạt ngưỡng. Thay đổi áp dụng cho đơn hàng và
        lượt giới thiệu phát sinh sau khi lưu; hoàn tiền của đơn cũ không bị tính lại. Hạng thủ công
        cho từng khách chỉnh trong trang Người dùng.
      </p>

      {isLoading ? (
        <div className='flex justify-center py-12'>
          <Icons.spinner className='h-6 w-6 animate-spin' />
        </div>
      ) : (
        <div className='space-y-3'>
          {tiers.map((tier) => (
            <div
              key={tier.tier}
              data-testid={`membership-tier-${tier.tier}`}
              className='flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4'
            >
              <div>
                <span className='font-medium'>{TIER_LABELS[tier.tier]}</span>
                <p className='text-muted-foreground text-sm'>
                  Ngưỡng chi tiêu: từ {vnd(tier.minimumSpendVnd)} · Hoàn tiền:{' '}
                  {tier.cashbackPercent}% · Thưởng giới thiệu: {vnd(tier.referralRewardVnd)}
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
