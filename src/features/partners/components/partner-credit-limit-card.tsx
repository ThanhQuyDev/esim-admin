'use client';

/**
 * "Không cần ký quỹ" + "Hạn mức giao dịch" (vande #056).
 *
 * A partner the admin trusts buys on credit: their wallet is filled to the
 * limit instead of from deposits, refilled at 0h on the 1st of each month, and
 * what they spent in month n is emailed to them in month n+1 with the
 * "Chi tiết giao dịch" file, to pay. The statement is checked, downloaded
 * or sent again from "Đối soát" (`partner-statement-card.tsx`).
 */

import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { formatVnd } from '@/lib/format';

import { setPartnerCreditLimit } from '../api/service';
import type { Partner } from '../api/types';

const digits = (text: string) => text.replace(/\D/g, '');

export function PartnerCreditLimitCard({
  partner,
  onSaved
}: {
  partner: Partner;
  onSaved: () => void;
}) {
  const savedOn = Boolean(partner.noDepositRequired);
  const savedLimit = savedOn ? Number(partner.creditLimitVnd ?? 0) : 0;

  const [enabled, setEnabled] = useState(savedOn);
  const [limitText, setLimitText] = useState(savedLimit ? String(savedLimit) : '');

  useEffect(() => {
    setEnabled(savedOn);
    setLimitText(savedLimit ? String(savedLimit) : '');
  }, [savedOn, savedLimit]);

  const limit = Number(digits(limitText) || 0);
  const dirty = enabled !== savedOn || (enabled && limit !== savedLimit);

  const save = useMutation({
    mutationFn: () =>
      setPartnerCreditLimit(partner.id, {
        noDepositRequired: enabled,
        ...(enabled ? { creditLimitVnd: limit } : {})
      }),
    onSuccess: () => {
      toast.success(
        enabled
          ? `Đã áp dụng hạn mức giao dịch ${formatVnd(limit)}/tháng.`
          : 'Đã chuyển đối tác về hình thức ký quỹ.'
      );
      onSaved();
    },
    onError: (e: Error) => toast.error(e.message || 'Không lưu được hạn mức.')
  });

  return (
    <div className='mt-4 space-y-3 border-t pt-4' data-testid='credit-limit-card'>
      <div className='flex items-start justify-between gap-4'>
        <div>
          <p className='text-sm font-medium'>Không cần ký quỹ</p>
          <p className='text-muted-foreground text-xs'>
            Đối tác dùng trước theo hạn mức, hằng tháng đối soát trả tiền sau. 0h ngày 1 hằng tháng
            số dư ví tự đặt lại đúng bằng hạn mức; tháng sau hệ thống tự gửi email đối soát số tiền
            đã dùng của tháng trước, kèm file chi tiết giao dịch.
          </p>
        </div>
        <Switch checked={enabled} onCheckedChange={setEnabled} aria-label='Không cần ký quỹ' />
      </div>

      {enabled && (
        <div className='space-y-2'>
          <Label htmlFor='creditLimit'>Hạn mức giao dịch (đ / tháng)</Label>
          <Input
            id='creditLimit'
            inputMode='numeric'
            className='max-w-xs'
            placeholder='100.000.000'
            value={limit ? limit.toLocaleString('vi-VN') : ''}
            onChange={(e) => setLimitText(digits(e.target.value))}
          />
        </div>
      )}

      {dirty && (
        <div className='bg-muted/50 space-y-2 rounded-lg border p-3 text-xs'>
          <p>
            {!enabled
              ? 'Tắt: phần hạn mức chưa dùng trong tháng được thu hồi khỏi ví; số đã dùng vẫn được đối soát.'
              : savedOn
                ? `Đổi hạn mức: số dư ví thay đổi đúng bằng phần chênh lệch (${formatVnd(limit - savedLimit)}), số đã dùng trong tháng giữ nguyên.`
                : `Bật: ví đối tác được cấp ngay ${formatVnd(limit)} để dùng trước. Đối tác còn tiền ký quỹ thì cần hoàn/trừ về 0 trước.`}
          </p>
          <div className='flex gap-2'>
            <Button
              size='sm'
              onClick={() => save.mutate()}
              disabled={save.isPending || (enabled && !(limit > 0))}
            >
              Lưu hạn mức
            </Button>
            <Button
              size='sm'
              variant='ghost'
              onClick={() => {
                setEnabled(savedOn);
                setLimitText(savedLimit ? String(savedLimit) : '');
              }}
            >
              Hoàn tác
            </Button>
          </div>
        </div>
      )}

      {/* The month's statement moved to "Đối soát" below, for every
          distribution partner (vande-1411 #047). */}
    </div>
  );
}
