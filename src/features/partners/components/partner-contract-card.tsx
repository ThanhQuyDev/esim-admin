'use client';

/**
 * Contract details and per-partner deposit limits (#061).
 *
 * The contract lines are a list rather than fixed fields because no two
 * partners carry the same set — a contract number here, a payment term there —
 * and the brief asks for a "+" to add another. What is written here is what the
 * monthly reconciliation file quotes back, so the labels are the admin's own
 * words, not ours.
 *
 * The deposit limits sit in the same card because they are the same "Lưu lại":
 * an admin editing a contract line and a ceiling in one sitting should not have
 * to work out which of two buttons writes which.
 */

import { useEffect, useImperativeHandle, useState, type Ref } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Icons } from '@/components/icons';
import { formatVnd } from '@/lib/format';

import { updatePartnerByAdminMutation } from '../api/mutations';
import { programSettingsQueryOptions } from '../api/queries';
import type { Partner } from '../api/types';
import { PartnerSepayAccountField } from './partner-sepay-account-field';

type Line = { label: string; value: string };

/** An empty box means "use the programme default", not zero. */
function parsed(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : null;
}

const EMPTY_LINE: Line = { label: '', value: '' };

/** "Nạp tiền tự động" / "Nạp tiền thủ công" (vande #068). */
const DEPOSIT_MODES: { value: 'auto' | 'manual'; label: string; hint: string }[] = [
  {
    value: 'auto',
    label: 'Nạp tiền tự động',
    hint: 'Đối tác chuyển khoản QR (SePay) hoặc trả bằng thẻ (OnePay) — số dư ký quỹ được cộng ngay, không cần duyệt. Thường dùng cho đối tác cá nhân.'
  },
  {
    value: 'manual',
    label: 'Nạp tiền thủ công',
    hint: 'Đối tác chuyển khoản từ tài khoản công ty rồi gửi thông tin chuyển khoản kèm bằng chứng; admin duyệt trong trang Tài chính mới cộng tiền. Thường dùng cho đối tác công ty.'
  }
];

/**
 * What the page's top "Lưu lại" drives (doitac-1410 #004): the brief keeps the
 * one save button at the head of the page, so this card has none of its own.
 */
export type PartnerContractCardHandle = { save: () => Promise<void> };

export function PartnerContractCard({
  partner,
  onSaved,
  onDirtyChange,
  ref
}: {
  partner: Partner;
  onSaved?: () => void;
  onDirtyChange?: (dirty: boolean) => void;
  ref?: Ref<PartnerContractCardHandle>;
}) {
  const [lines, setLines] = useState<Line[]>([]);
  const [minVnd, setMinVnd] = useState('');
  const [maxVnd, setMaxVnd] = useState('');
  const [depositMode, setDepositMode] = useState<'auto' | 'manual'>('auto');

  // Seeded from the partner and re-seeded whenever it reloads, so a save
  // elsewhere on the page does not leave this card showing stale text.
  useEffect(() => {
    setLines(partner.contractInfo?.length ? partner.contractInfo : [EMPTY_LINE]);
    setMinVnd(partner.depositMinVnd != null ? String(partner.depositMinVnd) : '');
    setMaxVnd(partner.depositMaxVnd != null ? String(partner.depositMaxVnd) : '');
    setDepositMode(partner.depositMode ?? 'auto');
  }, [partner.contractInfo, partner.depositMinVnd, partner.depositMaxVnd, partner.depositMode]);

  const saveMutation = useMutation({
    ...updatePartnerByAdminMutation,
    onSuccess: () => {
      toast.success('Đã lưu thông tin hợp đồng.');
      onSaved?.();
    },
    onError: (e: Error) => toast.error(e.message || 'Lưu thất bại')
  });

  // Only a distribution or API partner tops up a deposit; a marketing partner
  // has no balance to put money into (#013).
  const showDepositLimits = partner.partnerType !== 'kol';
  // An empty box falls back to "Cấu hình chung" — say its figures, not ones
  // fixed in here (doitac-3010 #041).
  const { data: program } = useQuery(programSettingsQueryOptions());
  const kol = partner.partnerType === 'kol';
  const programMin = program
    ? Number(kol ? program.depositMinKolVnd : program.depositMinDistributionVnd)
    : null;
  const programMax = program
    ? Number(kol ? program.depositMaxKolVnd : program.depositMaxDistributionVnd)
    : null;
  const vndText = (n: number | null) => (n == null ? '…' : formatVnd(n));

  const payload = {
    contractInfo: lines.filter((line) => line.label.trim()),
    ...(showDepositLimits
      ? { depositMinVnd: parsed(minVnd), depositMaxVnd: parsed(maxVnd), depositMode }
      : {})
  };
  const saved = {
    contractInfo: (partner.contractInfo ?? []).filter((line) => line.label.trim()),
    ...(showDepositLimits
      ? {
          depositMinVnd: partner.depositMinVnd ?? null,
          depositMaxVnd: partner.depositMaxVnd ?? null,
          depositMode: partner.depositMode ?? 'auto'
        }
      : {})
  };
  const dirty = JSON.stringify(payload) !== JSON.stringify(saved);

  useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);

  useImperativeHandle(ref, () => ({
    save: async () => {
      if (!dirty) return;
      await saveMutation.mutateAsync({ id: partner.id, data: payload });
    }
  }));

  const setLine = (index: number, patch: Partial<Line>) =>
    setLines((current) => current.map((line, i) => (i === index ? { ...line, ...patch } : line)));

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {showDepositLimits
            ? '5. Thông tin hợp đồng và hạn mức nạp ký quỹ riêng'
            : '5. Thông tin hợp đồng'}
        </CardTitle>
        <CardDescription>
          Những dòng này được in trong file đối soát gửi hàng tháng cho đối tác. Bấm dấu cộng để
          thêm dòng nếu hợp đồng có nhiều thông tin.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='space-y-2'>
          {lines.map((line, index) => (
            // The contract's title is the long part and its number the short
            // one: "Tên thông tin" takes 3/4 of the row, "Nội dung" 1/4
            // (doitac-0911 #024). On a phone they stack.
            <div
              key={index}
              className='grid grid-cols-[1fr_auto] items-center gap-2 sm:grid-cols-[3fr_1fr_auto]'
              data-testid={`contract-line-${index}`}
            >
              <Input
                className='col-span-2 min-w-0 sm:col-span-1'
                placeholder='Tên thông tin (VD: Hợp đồng đại lý số)'
                title={line.label || undefined}
                value={line.label}
                onChange={(e) => setLine(index, { label: e.target.value })}
              />
              <Input
                className='min-w-0'
                placeholder='Nội dung (VD: HD-2026/014)'
                title={line.value || undefined}
                value={line.value}
                onChange={(e) => setLine(index, { value: e.target.value })}
              />
              <Button
                size='icon'
                variant='ghost'
                aria-label='Xoá dòng'
                onClick={() => setLines((c) => c.filter((_, i) => i !== index))}
              >
                <Icons.trash className='size-4' />
              </Button>
            </div>
          ))}
          <Button
            size='sm'
            variant='outline'
            onClick={() => setLines((c) => [...c, { ...EMPTY_LINE }])}
          >
            <Icons.add className='mr-2 size-4' /> Thêm dòng
          </Button>
        </div>

        {showDepositLimits && (
          <div className='space-y-2 border-t pt-4' data-testid='deposit-mode'>
            <p className='text-sm font-medium'>Cách nạp ký quỹ</p>
            <div
              className='grid gap-2 sm:grid-cols-2'
              role='radiogroup'
              aria-label='Cách nạp ký quỹ'
            >
              {DEPOSIT_MODES.map((mode) => (
                <button
                  key={mode.value}
                  type='button'
                  role='radio'
                  aria-checked={depositMode === mode.value}
                  data-testid={`deposit-mode-${mode.value}`}
                  onClick={() => setDepositMode(mode.value)}
                  className={`flex gap-3 rounded-lg border p-3 text-left transition ${
                    depositMode === mode.value ? 'border-primary bg-primary/5' : 'hover:bg-muted'
                  }`}
                >
                  <span
                    className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border ${
                      depositMode === mode.value ? 'border-primary' : 'border-muted-foreground/40'
                    }`}
                  >
                    {depositMode === mode.value && (
                      <span className='bg-primary size-2 rounded-full' />
                    )}
                  </span>
                  <span>
                    <span className='block text-sm font-medium'>{mode.label}</span>
                    <span className='text-muted-foreground block text-xs'>{mode.hint}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* SePay personal or company for this partner's automatic deposits
            (vande-1411 #046); saved on change. */}
        {showDepositLimits && (
          <div className='border-t pt-4'>
            <PartnerSepayAccountField
              partnerId={partner.id}
              value={partner.sepayAccount}
              kind='distribution'
            />
          </div>
        )}

        {showDepositLimits && (
          <div className='space-y-2 border-t pt-4'>
            <p className='text-sm font-medium'>Hạn mức nạp ký quỹ riêng</p>
            <p className='text-muted-foreground text-xs'>
              Để trống nghĩa là dùng mức chung của chương trình. Đặt riêng cho đối tác có doanh số
              lớn, thay vì bắt họ nạp nhiều lần.
            </p>
            <div className='flex flex-wrap gap-3'>
              <div className='space-y-1'>
                <Label htmlFor='depositMin' className='text-xs'>
                  Tối thiểu mỗi lần (VND)
                </Label>
                <Input
                  id='depositMin'
                  type='number'
                  min={0}
                  className='w-[200px]'
                  placeholder={`Mức chung ${vndText(programMin)}`}
                  value={minVnd}
                  onChange={(e) => setMinVnd(e.target.value)}
                />
              </div>
              <div className='space-y-1'>
                <Label htmlFor='depositMax' className='text-xs'>
                  Tối đa mỗi lần (VND)
                </Label>
                <Input
                  id='depositMax'
                  type='number'
                  min={0}
                  className='w-[200px]'
                  placeholder={`Mức chung ${vndText(programMax)}`}
                  value={maxVnd}
                  onChange={(e) => setMaxVnd(e.target.value)}
                />
              </div>
            </div>
            <p className='text-muted-foreground text-xs' data-testid='deposit-limits-effective'>
              Đối tác này sẽ nạp được từ {minVnd ? formatVnd(Number(minVnd)) : vndText(programMin)}{' '}
              đến {maxVnd ? formatVnd(Number(maxVnd)) : vndText(programMax)} mỗi lần
              {!minVnd && !maxVnd ? ' (theo Cấu hình chung)' : ''}.
            </p>
          </div>
        )}

        {dirty && (
          <p className='text-muted-foreground text-xs'>
            Có thay đổi chưa lưu — bấm &quot;Lưu lại&quot; ở đầu trang.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
