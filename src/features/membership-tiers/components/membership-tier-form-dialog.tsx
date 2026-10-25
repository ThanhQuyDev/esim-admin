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
import type {
  CreateMembershipTierPayload,
  MembershipTier,
  UpdateMembershipTierPayload
} from '../api/types';

interface MembershipTierFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The tier being edited, or null to add a new one (vande #066). */
  tier: MembershipTier | null;
  /** The whole ladder, so a new tier's threshold can be checked against it. */
  allTiers: MembershipTier[];
  lowerTier: MembershipTier | null;
  higherTier: MembershipTier | null;
  onSubmit: (data: UpdateMembershipTierPayload | CreateMembershipTierPayload) => void;
  isSubmitting: boolean;
}

const EMPTY_FORM = {
  name: '',
  nameEn: '',
  minimumSpendVnd: '',
  cashbackPercent: '0',
  referralRewardVnd: '0'
};

export function MembershipTierFormDialog({
  open,
  onOpenChange,
  tier,
  allTiers,
  lowerTier,
  higherTier,
  onSubmit,
  isSubmitting
}: MembershipTierFormDialogProps) {
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (!open) return;
    if (!tier) {
      setForm(EMPTY_FORM);
      return;
    }
    setForm({
      name: tier.name,
      nameEn: tier.nameEn ?? '',
      minimumSpendVnd: String(tier.minimumSpendVnd),
      cashbackPercent: String(tier.cashbackPercent),
      referralRewardVnd: String(tier.referralRewardVnd)
    });
  }, [open, tier]);

  const isCreate = tier === null;
  const isLowest = !isCreate && lowerTier === null;
  const minimumSpend = Number(form.minimumSpendVnd);
  const cashback = Number(form.cashbackPercent);
  const referral = Number(form.referralRewardVnd);
  const sameThreshold = isCreate
    ? allTiers.find((t) => t.minimumSpendVnd === minimumSpend)
    : undefined;

  let problem = '';
  if (!form.name.trim()) {
    problem = 'Vui lòng nhập tên hạng.';
  } else if (form.minimumSpendVnd.trim() === '') {
    problem = 'Vui lòng nhập ngưỡng chi tiêu.';
  } else if (!Number.isInteger(minimumSpend) || minimumSpend < 0) {
    problem = 'Ngưỡng chi tiêu phải là số nguyên không âm.';
  } else if (isCreate && minimumSpend === 0) {
    problem = 'Chỉ hạng thấp nhất bắt đầu từ 0đ; hạng mới cần ngưỡng lớn hơn 0.';
  } else if (sameThreshold) {
    problem = `Hạng ${sameThreshold.name} đã dùng ngưỡng này. Mỗi hạng cần một ngưỡng riêng.`;
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
      name: form.name.trim(),
      nameEn: form.nameEn.trim() || null,
      ...(isLowest ? {} : { minimumSpendVnd: minimumSpend }),
      cashbackPercent: Math.round(cashback * 100) / 100,
      referralRewardVnd: referral
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[450px]'>
        <DialogHeader>
          <DialogTitle>{isCreate ? 'Thêm hạng khách hàng' : `Sửa hạng ${tier.name}`}</DialogTitle>
          <DialogDescription>
            {isCreate
              ? 'Hạng mới tự xếp vào bậc thang theo ngưỡng chi tiêu.'
              : 'Áp dụng cho đơn hàng và lượt giới thiệu phát sinh sau khi lưu.'}
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          <div className='grid gap-4 sm:grid-cols-2'>
            <div className='space-y-2'>
              <Label htmlFor='tierName'>Tên hạng</Label>
              <Input
                id='tierName'
                maxLength={60}
                placeholder='VD: Kim cương'
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='tierNameEn'>Tên tiếng Anh</Label>
              <Input
                id='tierNameEn'
                maxLength={60}
                placeholder='VD: Diamond'
                value={form.nameEn}
                onChange={(e) => setForm((f) => ({ ...f, nameEn: e.target.value }))}
              />
            </div>
          </div>

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
            {isCreate ? 'Thêm hạng' : 'Lưu'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
