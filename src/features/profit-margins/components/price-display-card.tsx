'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getPriceDisplay, setPriceDisplay } from '../api/price-display';

/**
 * The struck-out price on plans that have no discount of their own
 * (vande-2011 #012): the storefront shows a struck-out price set so the badge
 * reads this percent. 0 turns it off. A plan with its own discount (Batch
 * Discount) or a supplier list price above ours keeps its real figures.
 */
export function PriceDisplayCard() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['price-display'],
    queryFn: getPriceDisplay
  });
  const [value, setValue] = useState('');
  useEffect(() => {
    if (data) setValue(String(data.autoStrikePercent));
  }, [data]);

  const save = useMutation({
    mutationFn: (percent: number) => setPriceDisplay(percent),
    onSuccess: (saved) => {
      queryClient.setQueryData(['price-display'], saved);
      toast.success(
        saved.autoStrikePercent > 0
          ? `Đã lưu: gói không giảm giá hiện "-${saved.autoStrikePercent}%" (web cập nhật trong 1 phút).`
          : 'Đã tắt giá gạch ngang tự động (web cập nhật trong 1 phút).'
      );
    },
    onError: () => toast.error('Lưu thất bại')
  });

  const percent = Number(value);
  const valid = value.trim() !== '' && Number.isInteger(percent) && percent >= 0 && percent <= 90;

  return (
    <div className='bg-card mb-4 rounded-lg border p-4' data-testid='price-display-card'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-end'>
        <div className='flex-1'>
          <Label htmlFor='auto-strike' className='text-sm font-medium'>
            Giá gạch ngang cho gói không có giảm giá
          </Label>
          <p className='text-muted-foreground mt-1 text-xs'>
            Web hiện giá gạch sao cho nhãn giảm bằng số % này (ví dụ 50 → giá gạch = 2 × giá bán).
            Nhập 0 để tắt. Gói có Batch Discount hoặc giá niêm yết cao hơn giữ số liệu thật.
          </p>
        </div>
        <div className='flex items-center gap-2'>
          <Input
            id='auto-strike'
            type='number'
            min={0}
            max={90}
            className='w-24'
            value={value}
            disabled={isLoading}
            onChange={(e) => setValue(e.target.value)}
          />
          <span className='text-sm'>%</span>
          <Button
            size='sm'
            disabled={!valid || save.isPending || percent === data?.autoStrikePercent}
            onClick={() => save.mutate(percent)}
          >
            Lưu
          </Button>
        </div>
      </div>
    </div>
  );
}
