'use client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { MembershipTier, UpdateMembershipTierPayload } from '../api/types';

interface MembershipTierFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tier: MembershipTier | null;
  label: string;
  lowerTier: MembershipTier | null;
  higherTier: MembershipTier | null;
  onSubmit: (data: UpdateMembershipTierPayload) => void;
  isSubmitting: boolean;
}

const EMPTY_FORM = { minimumSpendVnd: '0', cashbackPercent: '0', referralRewardVnd: '0' };

export function MembershipTierFormDialog({
  open,
  onOpenChange,
  tier,
  label,
  lowerTier,
  higherTier,
  onSubmit,
  isSubmitting
}: MembershipTierFormDialogProps) {
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (!open || !tier) return;
    setForm({
      minimumSpendVnd: String(tier.minimumSpendVnd),
      cashbackPercent: String(tier.cashbackPercent),
      referralRewardVnd: String(tier.referralRewardVnd)
    });
  }, [open, tier]);

  const isLowest = lowerTier === null;
  const minimumSpend = Number(form.minimumSpendVnd);
  const cashback = Number(form.cashbackPercent);
  const referral = Number(form.referralRewardVnd);

  let problem = '';
  if (!Number.isInteger(minimumSpend) || minimumSpend < 0) {
    problem = 'Ngưỡng chi tiêu phải là số nguyên không âm.';
  } else if (lowerTier && minimumSpend <= lowerTier.minimumSpendVnd) {
    problem = `Ngưỡng phải lớn hơn ${lowerTier.minimumSpendVnd.toLocaleString('vi-VN')}đ của hạng thấp hơn.`;
  } else if (higherTier && minimumSpend >= higherTier.minimumSpendVnd) {
    problem = `Ngưỡng phải nhỏ hơn ${higherTier.minimumSpendVnd.toLocaleString('vi-VN')}đ của hạng cao hơn.`;
  } else if (!Number.isFinite(cashback) || cashback < 0 || cashback > 100) {
    problem = '% hoàn tiền phải từ 0 đến 100.';
  } else if (!Number.isInteger(referral) || referral < 0) {
    problem = 'Thưởng giới thiệu phải là số nguyên không âm.';
  }

  function handleSubmit() {
    if (problem) return;
    onSubmit({
      ...(isLowest ? {} : { minimumSpendVnd: minimumSpend }),
      cashbackPercent: Math.round(cashback * 100) / 100,
      referralRewardVnd: referral
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[450px]'>
        <DialogHeader>
          <DialogTitle>Sửa hạng {label}</DialogTitle>
          <DialogDescription>
            Áp dụng cho đơn hàng và lượt giới thiệu phát sinh sau khi lưu.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='minimumSpendVnd'>Ngưỡng tổng chi tiêu (VND)</Label>
            <Input
              id='minimumSpendVnd'
              type='number'
              min={0}
              disabled={isLowest}
              value={form.minimumSpendVnd}
              onChange={(e) => setForm((f) => ({ ...f, minimumSpendVnd: e.target.value }))}
            />
            {isLowest && (
              <p className='text-muted-foreground text-xs'>
                Hạng thấp nhất luôn bắt đầu từ 0đ để mọi khách mới đều có hạng.
              </p>
            )}
          </div>

          <div className='space-y-2'>
            <Label htmlFor='cashbackPercent'>Hoàn tiền (%)</Label>
            <Input
              id='cashbackPercent'
              type='number'
              step='0.1'
              min={0}
              max={100}
              value={form.cashbackPercent}
              onChange={(e) => setForm((f) => ({ ...f, cashbackPercent: e.target.value }))}
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='referralRewardVnd'>Thưởng mỗi lượt giới thiệu (VND)</Label>
            <Input
              id='referralRewardVnd'
              type='number'
              min={0}
              value={form.referralRewardVnd}
              onChange={(e) => setForm((f) => ({ ...f, referralRewardVnd: e.target.value }))}
            />
          </div>

          {problem && <p className='text-destructive text-sm'>{problem}</p>}
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={Boolean(problem) || isSubmitting}
            isLoading={isSubmitting}
          >
            Lưu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
