'use client';
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
import { Switch } from '@/components/ui/switch';
import { useEffect, useState } from 'react';
import type { CreateTierPayload, PartnerTier, PartnerType, UpdateTierPayload } from '../api/types';

interface PartnerTierFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partnerType: PartnerType;
  tier?: PartnerTier | null;
  onSubmit: (data: CreateTierPayload | UpdateTierPayload) => void;
  isSubmitting: boolean;
}

const EMPTY_FORM = {
  tierCode: '',
  tierName: '',
  minVolumeVnd: '0',
  commissionPercent: '0',
  maxDiscountPercent: '0',
  sortOrder: '0',
  isActive: true
};

export function PartnerTierFormDialog({
  open,
  onOpenChange,
  partnerType,
  tier,
  onSubmit,
  isSubmitting
}: PartnerTierFormDialogProps) {
  const isEdit = Boolean(tier);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (!open) return;
    if (tier) {
      setForm({
        tierCode: tier.tierCode,
        tierName: tier.tierName,
        minVolumeVnd: String(tier.minVolumeVnd),
        commissionPercent: String(tier.commissionPercent),
        maxDiscountPercent: String(tier.maxDiscountPercent),
        sortOrder: String(tier.sortOrder),
        isActive: tier.isActive
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [open, tier]);

  const isKol = partnerType === 'kol';
  const isValid = form.tierName.trim() !== '' && (isEdit || form.tierCode.trim() !== '');

  function handleSubmit() {
    if (!isValid) return;
    const shared = {
      tierName: form.tierName.trim(),
      minVolumeVnd: Number(form.minVolumeVnd) || 0,
      commissionPercent: Number(form.commissionPercent) || 0,
      maxDiscountPercent: Number(form.maxDiscountPercent) || 0,
      sortOrder: Number(form.sortOrder) || 0,
      isActive: form.isActive
    };
    if (isEdit) {
      onSubmit(shared);
    } else {
      onSubmit({ ...shared, partnerType, tierCode: form.tierCode.trim().toUpperCase() });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[450px]'>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Sửa hạng đối tác' : 'Thêm hạng đối tác'}</DialogTitle>
          <DialogDescription>
            {isKol
              ? 'Áp dụng cho đối tác KOL — hoa hồng theo % đơn hàng.'
              : 'Áp dụng cho đối tác phân phối — giảm giá tối đa được phép.'}
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          {!isEdit && (
            <div className='space-y-2'>
              <Label htmlFor='tierCode'>Mã hạng *</Label>
              <Input
                id='tierCode'
                placeholder='VD: SILVER'
                value={form.tierCode}
                onChange={(e) => setForm((f) => ({ ...f, tierCode: e.target.value }))}
              />
            </div>
          )}

          <div className='space-y-2'>
            <Label htmlFor='tierName'>Tên hạng *</Label>
            <Input
              id='tierName'
              placeholder='VD: Bạc'
              value={form.tierName}
              onChange={(e) => setForm((f) => ({ ...f, tierName: e.target.value }))}
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='minVolumeVnd'>Ngưỡng doanh số (VND)</Label>
            <Input
              id='minVolumeVnd'
              type='number'
              value={form.minVolumeVnd}
              onChange={(e) => setForm((f) => ({ ...f, minVolumeVnd: e.target.value }))}
            />
          </div>

          {isKol ? (
            <div className='space-y-2'>
              <Label htmlFor='commissionPercent'>Hoa hồng (%)</Label>
              <Input
                id='commissionPercent'
                type='number'
                step='0.1'
                value={form.commissionPercent}
                onChange={(e) => setForm((f) => ({ ...f, commissionPercent: e.target.value }))}
              />
            </div>
          ) : (
            <div className='space-y-2'>
              <Label htmlFor='maxDiscountPercent'>Giảm giá tối đa (%)</Label>
              <Input
                id='maxDiscountPercent'
                type='number'
                step='0.1'
                value={form.maxDiscountPercent}
                onChange={(e) => setForm((f) => ({ ...f, maxDiscountPercent: e.target.value }))}
              />
            </div>
          )}

          <div className='space-y-2'>
            <Label htmlFor='sortOrder'>Thứ tự hiển thị</Label>
            <Input
              id='sortOrder'
              type='number'
              value={form.sortOrder}
              onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
            />
          </div>

          <div className='flex items-center justify-between rounded-lg border p-3'>
            <Label htmlFor='isActive'>Đang hoạt động</Label>
            <Switch
              id='isActive'
              checked={form.isActive}
              onCheckedChange={(checked) => setForm((f) => ({ ...f, isActive: checked }))}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isValid || isSubmitting}
            isLoading={isSubmitting}
          >
            {isEdit ? 'Lưu' : 'Tạo'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
