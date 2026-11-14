'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Icons } from '@/components/icons';
import { formatVnd } from '@/lib/format';

import type { Partner } from '../api/types';
import {
  getPartnerCommissionStatement,
  getPartnerCreditStatement,
  sendPartnerCommissionStatement,
  sendPartnerCreditStatement
} from '../api/service';

/** `YYYY-MM` of a date, in Vietnam. */
function vnMonth(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit'
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}`;
}

/**
 * Every month from the one the partner was approved (or signed up) in to this
 * one, newest first (vande-1411 #047).
 */
export function statementPeriods(from: string | null | undefined, now = new Date()): string[] {
  const last = vnMonth(now);
  let [y, m] = (from ? vnMonth(new Date(from)) : last).split('-').map(Number);
  const out: string[] = [];
  while (`${y}-${String(m).padStart(2, '0')}` <= last && out.length < 240) {
    out.push(`${y}-${String(m).padStart(2, '0')}`);
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
  return out.reverse();
}

const label = (period: string) => {
  const [y, m] = period.split('-');
  return `Tháng ${m}/${y}`;
};

const percent = (n: number) =>
  `${Number(n || 0).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}%`;

/**
 * "Đối soát" in the partner's page (vande-1411 #047): pick a month since the
 * partner joined; the download, the email and the figures all follow it. A
 * marketing partner gets the commission statement, a distribution partner
 * the sales statement — each the same file and email as the monthly run.
 */
export function PartnerStatementCard({ partner }: { partner: Partner }) {
  const isKol = partner.partnerType === 'kol';
  const periods = useMemo(
    () => statementPeriods(partner.approvedAt ?? partner.createdAt),
    [partner.approvedAt, partner.createdAt]
  );
  // Last month when there is one: the month a statement is about.
  const [period, setPeriod] = useState(periods[1] ?? periods[0]);

  const kol = useQuery({
    queryKey: ['partner-commission-statement', partner.id, period],
    queryFn: () => getPartnerCommissionStatement(partner.id, period),
    enabled: isKol && Boolean(period)
  });
  const sales = useQuery({
    queryKey: ['partner-credit-statement', partner.id, period],
    queryFn: () => getPartnerCreditStatement(partner.id, period),
    enabled: !isKol && Boolean(period)
  });

  const send = useMutation({
    mutationFn: () =>
      isKol
        ? sendPartnerCommissionStatement(partner.id, period)
        : sendPartnerCreditStatement(partner.id, period),
    onSuccess: (r) =>
      r.sent > 0
        ? toast.success(`Đã gửi email đối soát ${label(period)} tới ${partner.contactEmail}.`)
        : toast.error('Chưa gửi được: đối tác chưa có email liên hệ.'),
    onError: (e: Error) => toast.error(e.message || 'Không gửi được email đối soát.')
  });

  const figures: [string, string][] = isKol
    ? kol.data
      ? [
          ['Số đơn hợp lệ', kol.data.validOrders.toLocaleString('vi-VN')],
          ['Số eSIM đã bán', kol.data.esimsSold.toLocaleString('vi-VN')],
          ['Tỷ lệ đơn dùng mã', percent(kol.data.viaCouponPercent)],
          ['Tỷ lệ khách hàng mới', percent(kol.data.newCustomerPercent)],
          ['Tỷ lệ hoàn tiền', percent(kol.data.refundPercent)],
          ['Doanh số', formatVnd(kol.data.revenueVnd)],
          ['Hoa hồng', formatVnd(kol.data.commissionVnd)]
        ]
      : []
    : sales.data
      ? [
          ['Số đơn hợp lệ', sales.data.orderCount.toLocaleString('vi-VN')],
          ['Số eSIM đã bán', sales.data.esimCount.toLocaleString('vi-VN')],
          ['Tỷ lệ hoàn tiền', percent(sales.data.refundPercent ?? 0)],
          [
            'Tổng doanh số bán ra',
            formatVnd(sales.data.revenueVnd ?? sales.data.purchasedVnd - sales.data.refundedVnd)
          ],
          ['Đã thanh toán', formatVnd(sales.data.paidVnd ?? 0)],
          ['Chưa thanh toán', formatVnd(sales.data.amountDueVnd)]
        ]
      : [];
  const loading = isKol ? kol.isFetching : sales.isFetching;
  const exportHref = `/api/partners/${partner.id}/${
    isKol ? 'commission-statement' : 'credit-statement'
  }/export-excel?period=${period}`;

  return (
    <div className='mt-4 space-y-3 border-t pt-4' data-testid='partner-statement'>
      <div>
        <p className='text-sm font-medium'>Đối soát</p>
        <p className='text-muted-foreground text-xs'>
          Chọn kỳ đối soát; nút tải file, gửi email và các số liệu bên dưới đều theo kỳ đã chọn.
        </p>
      </div>
      <div className='flex flex-wrap items-center gap-2'>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className='w-44' data-testid='partner-statement-period'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className='max-h-72'>
            {periods.map((p) => (
              <SelectItem key={p} value={p}>
                {label(p)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size='sm' variant='outline' asChild>
          <a href={exportHref} data-testid='partner-statement-download'>
            <Icons.download className='mr-2 h-4 w-4' />
            Tải file chi tiết
          </a>
        </Button>
        <Button
          size='sm'
          onClick={() => send.mutate()}
          disabled={send.isPending}
          data-testid='partner-statement-send'
        >
          <Icons.mail className='mr-2 h-4 w-4' />
          Gửi email đối soát
        </Button>
        {loading && <Icons.spinner className='text-muted-foreground h-4 w-4 animate-spin' />}
      </div>
      {figures.length > 0 && (
        <dl
          className='grid grid-cols-2 gap-x-4 gap-y-2 rounded-lg border p-3 text-xs sm:grid-cols-3 lg:grid-cols-4'
          data-testid='partner-statement-figures'
        >
          {figures.map(([name, value]) => (
            <div key={name}>
              <dt className='text-muted-foreground'>{name}</dt>
              <dd className='font-medium tabular-nums'>{value}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
