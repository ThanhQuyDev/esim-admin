'use client';

/**
 * "Không cần ký quỹ" + "Hạn mức giao dịch" (vande #056).
 *
 * A partner the admin trusts buys on credit: their wallet is filled to the
 * limit instead of from deposits, refilled at 0h on the 1st of each month, and
 * what they spent in month n is emailed to them in month n+1 with the
 * "Chi tiết giao dịch" file, to pay. The statement can also be checked,
 * downloaded or sent again from here.
 */

import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { formatVnd } from '@/lib/format';

import {
  getPartnerCreditStatement,
  sendPartnerCreditStatement,
  setPartnerCreditLimit
} from '../api/service';
import type { Partner } from '../api/types';

/** `YYYY-MM` of last month on this device — the statement usually asked for. */
function lastMonth(): string {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

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
  const [period, setPeriod] = useState(lastMonth);

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

  const statement = useQuery({
    queryKey: ['partner-credit-statement', partner.id, period],
    queryFn: () => getPartnerCreditStatement(partner.id, period),
    enabled: savedOn && /^\d{4}-\d{2}$/.test(period)
  });

  const send = useMutation({
    mutationFn: () => sendPartnerCreditStatement(partner.id, period),
    onSuccess: (r) =>
      r.sent > 0
        ? toast.success(`Đã gửi email đối soát tới ${partner.contactEmail}.`)
        : toast.error('Chưa gửi được: đối tác chưa có email liên hệ.'),
    onError: (e: Error) => toast.error(e.message || 'Không gửi được email đối soát.')
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

      {savedOn && (
        <div className='space-y-2 rounded-lg border p-3'>
          <div className='flex flex-wrap items-end justify-between gap-2'>
            <div className='space-y-1'>
              <Label htmlFor='creditPeriod' className='text-xs'>
                Đối soát tháng
              </Label>
              <Input
                id='creditPeriod'
                type='month'
                className='w-44'
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
              />
            </div>
            <div className='flex flex-wrap gap-2'>
              <Button size='sm' variant='outline' asChild>
                <a
                  href={`/api/partners/${partner.id}/credit-statement/export-excel?period=${period}`}
                >
                  Tải file chi tiết
                </a>
              </Button>
              <Button size='sm' onClick={() => send.mutate()} disabled={send.isPending}>
                Gửi email đối soát
              </Button>
            </div>
          </div>
          {statement.data && (
            <dl className='grid grid-cols-2 gap-x-4 gap-y-1 text-xs sm:grid-cols-4'>
              {(
                [
                  ['Số đơn', statement.data.orderCount.toLocaleString('vi-VN')],
                  ['Tiền hàng đã mua', formatVnd(statement.data.purchasedVnd)],
                  ['Đã hoàn lại', formatVnd(statement.data.refundedVnd)],
                  ['Cần thanh toán', formatVnd(statement.data.amountDueVnd)]
                ] as [string, string][]
              ).map(([label, value]) => (
                <div key={label}>
                  <dt className='text-muted-foreground'>{label}</dt>
                  <dd className='font-medium tabular-nums' data-testid={`credit-${label}`}>
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      )}
    </div>
  );
}
