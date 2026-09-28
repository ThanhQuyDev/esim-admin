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

import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Icons } from '@/components/icons';
import { formatVnd } from '@/lib/format';

import { updatePartnerByAdminMutation } from '../api/mutations';
import type { Partner } from '../api/types';

type Line = { label: string; value: string };

/** An empty box means "use the programme default", not zero. */
function parsed(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : null;
}

const EMPTY_LINE: Line = { label: '', value: '' };

export function PartnerContractCard({
  partner,
  onSaved
}: {
  partner: Partner;
  onSaved?: () => void;
}) {
  const [lines, setLines] = useState<Line[]>([]);
  const [minVnd, setMinVnd] = useState('');
  const [maxVnd, setMaxVnd] = useState('');

  // Seeded from the partner and re-seeded whenever it reloads, so a save
  // elsewhere on the page does not leave this card showing stale text.
  useEffect(() => {
    setLines(partner.contractInfo?.length ? partner.contractInfo : [EMPTY_LINE]);
    setMinVnd(partner.depositMinVnd != null ? String(partner.depositMinVnd) : '');
    setMaxVnd(partner.depositMaxVnd != null ? String(partner.depositMaxVnd) : '');
  }, [partner.contractInfo, partner.depositMinVnd, partner.depositMaxVnd]);

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

  const save = () => {
    saveMutation.mutate({
      id: partner.id,
      data: {
        contractInfo: lines.filter((line) => line.label.trim()),
        ...(showDepositLimits
          ? { depositMinVnd: parsed(minVnd), depositMaxVnd: parsed(maxVnd) }
          : {})
      }
    });
  };

  const setLine = (index: number, patch: Partial<Line>) =>
    setLines((current) => current.map((line, i) => (i === index ? { ...line, ...patch } : line)));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Thông tin hợp đồng</CardTitle>
        <CardDescription>
          Những dòng này được in trong file đối soát gửi hàng tháng cho đối tác. Bấm dấu cộng để
          thêm dòng nếu hợp đồng có nhiều thông tin.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='space-y-2'>
          {lines.map((line, index) => (
            <div key={index} className='flex flex-wrap items-center gap-2'>
              <Input
                className='max-w-[220px]'
                placeholder='Tên thông tin (VD: Số hợp đồng)'
                value={line.label}
                onChange={(e) => setLine(index, { label: e.target.value })}
              />
              <Input
                className='min-w-[220px] flex-1'
                placeholder='Nội dung (VD: HD-2026/014)'
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
                  placeholder='Mặc định 100.000'
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
                  placeholder='Mặc định 10.000.000'
                  value={maxVnd}
                  onChange={(e) => setMaxVnd(e.target.value)}
                />
              </div>
            </div>
            {(minVnd || maxVnd) && (
              <p className='text-muted-foreground text-xs'>
                Đối tác này sẽ nạp được từ {minVnd ? formatVnd(Number(minVnd)) : '100.000đ'} đến{' '}
                {maxVnd ? formatVnd(Number(maxVnd)) : '10.000.000đ'} mỗi lần.
              </p>
            )}
          </div>
        )}

        <Button isLoading={saveMutation.isPending} onClick={save}>
          Lưu lại
        </Button>
      </CardContent>
    </Card>
  );
}
