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
import { Icons } from '@/components/icons';
import { useEffect, useState } from 'react';
import type {
  CostMarkupRange,
  CreateTierPayload,
  PartnerTier,
  PartnerType,
  UpdateTierPayload
} from '../api/types';
import { markupRangesError } from './tier-markup';

/** A band as typed: strings, so a field can be emptied while typing. */
type RangeRow = { fromVnd: string; toVnd: string; percent: string; fixedVnd: string };

const EMPTY_RANGE: RangeRow = { fromVnd: '', toVnd: '', percent: '0', fixedVnd: '0' };

const toRange = (row: RangeRow): CostMarkupRange => ({
  fromVnd: Number(row.fromVnd) || 0,
  toVnd: Number(row.toVnd) || 0,
  percent: Number(row.percent) || 0,
  fixedVnd: Number(row.fixedVnd) || 0
});

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
  isInternal: false,
  isDefault: false,
  costMarkupRanges: [] as RangeRow[]
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
        isInternal: tier.isInternal ?? false,
        isDefault: tier.isDefault ?? false,
        costMarkupRanges: (tier.costMarkupRanges ?? []).map((r) => ({
          fromVnd: String(r.fromVnd),
          toVnd: String(r.toVnd),
          percent: String(r.percent),
          fixedVnd: String(r.fixedVnd)
        }))
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [open, tier]);

  const isKol = partnerType === 'kol';
  const ranges = form.costMarkupRanges.map(toRange);
  // The bands only matter for a distribution tier (doitac-3010 #040).
  const rangesError = isKol ? null : markupRangesError(ranges);
  const isValid = form.tierName.trim() !== '' && form.tierCode.trim() !== '' && !rangesError;
  const setRange = (index: number, patch: Partial<RangeRow>) =>
    setForm((f) => ({
      ...f,
      costMarkupRanges: f.costMarkupRanges.map((r, i) => (i === index ? { ...r, ...patch } : r))
    }));

  function handleSubmit() {
    if (!isValid) return;
    const shared = {
      tierName: form.tierName.trim(),
      minVolumeVnd: Number(form.minVolumeVnd) || 0,
      commissionPercent: Number(form.commissionPercent) || 0,
      maxDiscountPercent: Number(form.maxDiscountPercent) || 0,
      minDepositVnd: Number(form.minDepositVnd) || 0,
      costMarkupPercent: Number(form.costMarkupPercent) || 0,
      ...(!isKol && { costMarkupRanges: ranges.toSorted((a, b) => a.fromVnd - b.fromVnd) }),
      attributionDays: Number(form.attributionDays) || 30,
      sortOrder: Number(form.sortOrder) || 0,
      isActive: form.isActive,
      isInternal: form.isInternal,
      isDefault: form.isActive && form.isDefault
    };
    if (isEdit) {
      // The code can be changed too (doitac-1410 #059); the partners on the
      // tier follow it.
      onSubmit({ ...shared, tierCode: form.tierCode.trim().toUpperCase() });
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
      {/* Wider for a distribution tier's price bands (doitac-3010 #040). */}
      <DialogContent
        className={isKol ? 'sm:max-w-[450px]' : 'max-h-[90vh] overflow-y-auto sm:max-w-[720px]'}
      >
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Sửa hạng đối tác' : 'Thêm hạng đối tác'}</DialogTitle>
          <DialogDescription>
            {isKol
              ? 'Áp dụng cho đối tác Affiliate — hoa hồng theo % đơn hàng.'
              : 'Áp dụng cho đối tác phân phối — giảm giá tối đa được phép.'}
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='tierCode'>Mã hạng *</Label>
            <Input
              id='tierCode'
              placeholder='VD: SILVER'
              value={form.tierCode}
              onChange={(e) => setForm((f) => ({ ...f, tierCode: e.target.value }))}
            />
            {isEdit && (
              <p className='text-muted-foreground text-xs'>
                Đổi mã thì các đối tác đang ở hạng này được chuyển theo mã mới.
              </p>
            )}
          </div>

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
              {/* Like Profit Margin Tier: by cost band (doitac-3010 #040). */}
              <div className='space-y-3 rounded-lg border p-3' data-testid='tier-markup-box'>
                <div>
                  <p className='text-sm font-medium'>Cộng vào giá gốc theo khoảng giá</p>
                  <p className='text-muted-foreground text-xs'>
                    Giá gốc thuộc khoảng nào thì cộng theo khoảng đó. Có nhập "Tăng theo giá tiền"
                    (lớn hơn 0) thì cộng số tiền đó, không cộng %. Giá đại lý luôn được giữ không
                    cao hơn giá bán trên web.
                  </p>
                </div>
                {form.costMarkupRanges.length > 0 && (
                  <div className='text-muted-foreground hidden grid-cols-[1fr_1fr_110px_1fr_36px] gap-2 text-xs font-medium sm:grid'>
                    <span>Giá gốc từ (VND)</span>
                    <span>Đến (VND)</span>
                    <span>Tăng theo %</span>
                    <span>Tăng theo giá tiền (VND)</span>
                    <span />
                  </div>
                )}
                {form.costMarkupRanges.map((row, index) => (
                  <div
                    key={index}
                    className='grid grid-cols-2 gap-2 sm:grid-cols-[1fr_1fr_110px_1fr_36px]'
                    data-testid='tier-markup-range'
                  >
                    <Input
                      type='number'
                      min='0'
                      placeholder='Từ'
                      aria-label='Giá gốc từ'
                      value={row.fromVnd}
                      onChange={(e) => setRange(index, { fromVnd: e.target.value })}
                    />
                    <Input
                      type='number'
                      min='0'
                      placeholder='Đến'
                      aria-label='Giá gốc đến'
                      value={row.toVnd}
                      onChange={(e) => setRange(index, { toVnd: e.target.value })}
                    />
                    <Input
                      type='number'
                      min='0'
                      step='0.1'
                      aria-label='Tăng theo %'
                      value={row.percent}
                      onChange={(e) => setRange(index, { percent: e.target.value })}
                    />
                    <Input
                      type='number'
                      min='0'
                      aria-label='Tăng theo giá tiền'
                      value={row.fixedVnd}
                      onChange={(e) => setRange(index, { fixedVnd: e.target.value })}
                    />
                    <Button
                      type='button'
                      variant='ghost'
                      size='icon'
                      aria-label='Xoá khoảng giá'
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          costMarkupRanges: f.costMarkupRanges.filter((_, i) => i !== index)
                        }))
                      }
                    >
                      <Icons.trash className='h-4 w-4' />
                    </Button>
                  </div>
                ))}
                {rangesError && (
                  <p className='text-destructive text-xs' data-testid='tier-markup-error'>
                    {rangesError}
                  </p>
                )}
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  data-testid='tier-markup-add'
                  onClick={() =>
                    setForm((f) => {
                      // A new band starts right after the last one.
                      const last = f.costMarkupRanges.at(-1);
                      const from = last ? String((Number(last.toVnd) || 0) + 1) : '0';
                      return {
                        ...f,
                        costMarkupRanges: [...f.costMarkupRanges, { ...EMPTY_RANGE, fromVnd: from }]
                      };
                    })
                  }
                >
                  <Icons.add className='mr-1 h-4 w-4' /> Thêm khoảng giá
                </Button>
                <div className='space-y-2 border-t pt-3'>
                  <Label htmlFor='costMarkupPercent'>
                    % cộng cho giá gốc ngoài các khoảng trên
                  </Label>
                  <Input
                    id='costMarkupPercent'
                    type='number'
                    step='0.1'
                    className='sm:w-[200px]'
                    value={form.costMarkupPercent}
                    onChange={(e) => setForm((f) => ({ ...f, costMarkupPercent: e.target.value }))}
                  />
                  <p className='text-muted-foreground text-xs'>
                    VD: 10% thì eSIM giá gốc 100.000đ được mua với 110.000đ. Chưa thêm khoảng giá
                    nào thì mọi gói đều cộng theo % này.
                  </p>
                </div>
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
                <Label htmlFor='maxDiscountPercent'>Chiết khấu (%)</Label>
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

          <div className='rounded-lg border p-3'>
            <div className='flex items-center justify-between'>
              <Label htmlFor='isDefault'>Hạng mặc định</Label>
              <Switch
                id='isDefault'
                checked={form.isActive && form.isDefault}
                disabled={!form.isActive}
                onCheckedChange={(checked) => setForm((f) => ({ ...f, isDefault: checked }))}
              />
            </div>
            <p className='text-muted-foreground mt-2 text-xs'>
              Đối tác mới tạo tài khoản được tự gán hạng này. Mỗi loại đối tác chỉ có 1 hạng mặc
              định; chọn hạng này thì hạng mặc định cũ được bỏ.
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
