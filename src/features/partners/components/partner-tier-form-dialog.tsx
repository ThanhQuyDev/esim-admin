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
  minDepositVnd: '0',
  costMarkupPercent: '0',
  attributionDays: '30',
  sortOrder: '0',
  isActive: true,
  isInternal: false
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
        minDepositVnd: String(tier.minDepositVnd ?? 0),
        costMarkupPercent: String(tier.costMarkupPercent ?? 0),
        attributionDays: String(tier.attributionDays ?? 30),
        sortOrder: String(tier.sortOrder),
        isActive: tier.isActive,
        isInternal: tier.isInternal ?? false
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
      minDepositVnd: Number(form.minDepositVnd) || 0,
      costMarkupPercent: Number(form.costMarkupPercent) || 0,
      attributionDays: Number(form.attributionDays) || 30,
      sortOrder: Number(form.sortOrder) || 0,
      isActive: form.isActive,
      isInternal: form.isInternal
    };
    if (isEdit) {
      onSubmit(shared);
    } else {
      onSubmit({
        ...shared,
        partnerType,
        tierCode: form.tierCode.trim().toUpperCase()
      });
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
            <>
              <div className='space-y-2'>
                <Label htmlFor='costMarkupPercent'>% cộng vào giá gốc</Label>
                <Input
                  id='costMarkupPercent'
                  type='number'
                  step='0.1'
                  value={form.costMarkupPercent}
                  onChange={(e) => setForm((f) => ({ ...f, costMarkupPercent: e.target.value }))}
                />
                <p className='text-muted-foreground text-xs'>
                  Giá đối tác = giá gốc + (giá gốc × %). VD: 10% thì eSIM giá gốc 100.000đ được mua
                  với 110.000đ. Hạng càng cao thì % này càng nhỏ.
                </p>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='minDepositVnd'>Ngưỡng ký quỹ (VND)</Label>
                <Input
                  id='minDepositVnd'
                  type='number'
                  value={form.minDepositVnd}
                  onChange={(e) => setForm((f) => ({ ...f, minDepositVnd: e.target.value }))}
                />
                <p className='text-muted-foreground text-xs'>
                  Đạt HOẶC ngưỡng doanh số HOẶC ngưỡng ký quỹ là lên hạng — không cần cả hai. Để 0
                  nếu hạng này chỉ xét theo doanh số.
                </p>
              </div>

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
            </>
          )}

          {isKol && (
            <div className='space-y-2'>
              <Label htmlFor='attributionDays'>Số ngày ghi nhận hoa hồng</Label>
              <Input
                id='attributionDays'
                type='number'
                min='1'
                value={form.attributionDays}
                onChange={(e) => setForm((f) => ({ ...f, attributionDays: e.target.value }))}
              />
              <p className='text-muted-foreground text-xs'>
                Sau khi khách bấm link, đối tác hạng này còn được ghi nhận đơn trong bấy nhiêu ngày.
                Mỗi lần khách bấm lại link thì thời gian được tính lại từ đầu.
              </p>
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

          <div className='rounded-lg border p-3'>
            <div className='flex items-center justify-between'>
              <Label htmlFor='isInternal'>Hạng nội bộ</Label>
              <Switch
                id='isInternal'
                checked={form.isInternal}
                onCheckedChange={(checked) => setForm((f) => ({ ...f, isInternal: checked }))}
              />
            </div>
            <p className='text-muted-foreground mt-2 text-xs'>
              Hạng thương lượng riêng cho đối tác đặc biệt: không hiện trong bảng xếp hạng công khai
              và không bị hệ thống tự động xét lại. Chỉ admin gán thủ công trong trang chi tiết đối
              tác.
            </p>
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
