'use client';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { ApiError } from '@/lib/api-client';
import { membershipTiersQueryOptions } from '../api/queries';
import {
  createMembershipTierMutation,
  deleteMembershipTierMutation,
  updateMembershipTierMutation
} from '../api/mutations';
import type { MembershipTier } from '../api/types';
import { MembershipTierFormDialog } from './membership-tier-form-dialog';

/** Backend validation codes → what the admin should read. */
const ERROR_MESSAGES: Record<string, string> = {
  lowestTierMustStartAtZero: 'Hạng thấp nhất phải bắt đầu từ 0đ.',
  minimumSpendNotAscending:
    'Mỗi hạng cần một ngưỡng chi tiêu riêng: đã có hạng khác dùng ngưỡng này.',
  invalidMinimumSpend: 'Ngưỡng chi tiêu phải là số nguyên không âm.',
  invalidCashbackPercent: '% hoàn tiền phải từ 0 đến 100.',
  invalidReferralReward: 'Thưởng giới thiệu phải là số nguyên không âm.',
  nameRequired: 'Vui lòng nhập tên hạng.',
  tierAlreadyExists: 'Đã có hạng trùng tên này. Hãy đặt tên khác.'
};

function describeError(error: Error, fallback: string): string {
  if (error instanceof ApiError) {
    const code = error.errors ? Object.values(error.errors)[0] : undefined;
    if (code && ERROR_MESSAGES[code]) return ERROR_MESSAGES[code];
    // The backend explains a refused delete in Vietnamese ("Còn 3 khách hàng…").
    if (error.status === 400 || error.status === 404) return error.message;
  }
  return fallback;
}

const vnd = (value: number) => `${value.toLocaleString('vi-VN')}đ`;

type Editing = { mode: 'create' } | { mode: 'edit'; tier: MembershipTier };

export function MembershipTiersView() {
  const [editing, setEditing] = useState<Editing | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null);
  const { data: tiers = [], isLoading } = useQuery(membershipTiersQueryOptions());

  const updateMutation = useMutation({
    ...updateMembershipTierMutation,
    onSuccess: () => {
      toast.success('Đã cập nhật hạng khách hàng.');
      setEditing(null);
    },
    onError: (error: Error) => toast.error(describeError(error, 'Cập nhật hạng thất bại.'))
  });

  const createMutation = useMutation({
    ...createMembershipTierMutation,
    onSuccess: () => {
      toast.success('Đã thêm hạng khách hàng.');
      setEditing(null);
    },
    onError: (error: Error) => toast.error(describeError(error, 'Thêm hạng thất bại.'))
  });

  const deleteMutation = useMutation({
    ...deleteMembershipTierMutation,
    // Not onSettled: that is where the shared options refresh the ladder.
    onSuccess: () => {
      toast.success('Đã xoá hạng khách hàng.');
      setConfirmingDelete(null);
    },
    onError: (error: Error) => {
      toast.error(describeError(error, 'Xoá hạng thất bại.'));
      setConfirmingDelete(null);
    }
  });

  const editingTier = editing?.mode === 'edit' ? editing.tier : null;
  const editingIndex = editingTier ? tiers.findIndex((t) => t.tier === editingTier.tier) : -1;

  return (
    <div className='space-y-4'>
      <MembershipTierFormDialog
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
        tier={editingTier}
        allTiers={tiers}
        lowerTier={editingIndex > 0 ? tiers[editingIndex - 1] : null}
        higherTier={editingIndex >= 0 ? (tiers[editingIndex + 1] ?? null) : null}
        onSubmit={(data) => {
          if (editingTier) updateMutation.mutate({ tier: editingTier.tier, data });
          else createMutation.mutate(data as Parameters<typeof createMutation.mutate>[0]);
        }}
        isSubmitting={updateMutation.isPending || createMutation.isPending}
      />

      <div className='flex flex-wrap items-start justify-between gap-3'>
        <p className='text-muted-foreground max-w-3xl text-sm'>
          Khách được lên hạng tự động khi tổng chi tiêu đạt ngưỡng. Thay đổi áp dụng cho đơn hàng và
          lượt giới thiệu phát sinh sau khi lưu; hoàn tiền của đơn cũ không bị tính lại. Hạng thủ
          công cho từng khách chỉnh trong trang Người dùng.
        </p>
        <Button
          size='sm'
          data-testid='membership-tier-add'
          onClick={() => setEditing({ mode: 'create' })}
        >
          <Icons.add className='mr-2 h-4 w-4' /> Thêm hạng
        </Button>
      </div>

      {isLoading ? (
        <div className='flex justify-center py-12'>
          <Icons.spinner className='h-6 w-6 animate-spin' />
        </div>
      ) : (
        <div className='space-y-3'>
          {tiers.map((tier, index) => (
            <div
              key={tier.tier}
              data-testid={`membership-tier-${tier.tier}`}
              className='flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4'
            >
              <div className='min-w-0'>
                <span className='font-medium'>{tier.name}</span>
                {tier.nameEn && (
                  <span className='text-muted-foreground ml-2 text-sm'>({tier.nameEn})</span>
                )}
                <p className='text-muted-foreground text-sm'>
                  Ngưỡng chi tiêu: từ {vnd(tier.minimumSpendVnd)} · Hoàn tiền:{' '}
                  {tier.cashbackPercent}% · Thưởng giới thiệu: {vnd(tier.referralRewardVnd)}
                </p>
              </div>
              <div className='flex flex-wrap items-center gap-2'>
                {confirmingDelete === tier.tier ? (
                  <>
                    <span className='text-destructive text-sm'>Xoá hạng {tier.name}?</span>
                    <Button
                      size='sm'
                      variant='destructive'
                      data-testid={`membership-tier-confirm-delete-${tier.tier}`}
                      isLoading={deleteMutation.isPending}
                      onClick={() => deleteMutation.mutate(tier.tier)}
                    >
                      Xoá
                    </Button>
                    <Button size='sm' variant='outline' onClick={() => setConfirmingDelete(null)}>
                      Không
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={() => setEditing({ mode: 'edit', tier })}
                    >
                      <Icons.edit className='mr-2 h-4 w-4' /> Sửa
                    </Button>
                    {/* Everybody starts on the first tier, so it cannot go. */}
                    {index > 0 && (
                      <Button
                        size='sm'
                        variant='outline'
                        data-testid={`membership-tier-delete-${tier.tier}`}
                        className='text-destructive'
                        onClick={() => setConfirmingDelete(tier.tier)}
                      >
                        <Icons.trash className='mr-2 h-4 w-4' /> Xoá
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
          <p className='text-muted-foreground text-xs'>
            Xoá một hạng: khách đang ở hạng đó tự về hạng thấp hơn theo chi tiêu; đơn cũ vẫn giữ tên
            hạng lúc đặt. Không xoá được hạng còn khách được gán tay — đổi hạng của họ trước.
          </p>
        </div>
      )}
    </div>
  );
}
