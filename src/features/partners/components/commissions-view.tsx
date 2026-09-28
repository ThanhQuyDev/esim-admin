'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { commissionSummaryQueryOptions, commissionsQueryOptions } from '../api/queries';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Icons } from '@/components/icons';
import { formatDateTimeVn, formatVnd } from '@/lib/format';

const STATUS_LABEL: Record<string, string> = {
  pending: 'Chờ đơn thanh toán',
  credited: 'Đã cộng vào ví',
  reversed: 'Đã hoàn',
  rejected: 'Bị loại hoa hồng'
};
const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive'> = {
  pending: 'secondary',
  credited: 'default',
  reversed: 'destructive',
  rejected: 'destructive'
};

/**
 * Why a commission was refused outright (#041) — a self-referral: the buyer's
 * details were the partner's own. Spelled out here because this list is where
 * a complaint about a missing commission gets answered.
 */
const REJECTION_REASON: Record<string, string> = {
  self_account: 'Đơn do chính tài khoản của đối tác đặt',
  self_email: 'Email khách trùng email đăng ký của đối tác',
  self_phone: 'Số điện thoại khách trùng số đăng ký của đối tác',
  self_tax_code: 'Mã số thuế trên hoá đơn trùng mã số thuế của đối tác',
  self_bank_account: 'Trùng tài khoản ngân hàng nhận hoa hồng của đối tác'
};

/**
 * One stage of the commission money, with the partners behind it (#063).
 *
 * The count is what makes the total actionable: 40 triệu owed to two partners
 * is a different afternoon from 40 triệu owed to two hundred.
 */
function StageTile({
  label,
  amountVnd,
  partners,
  hint,
  tone
}: {
  label: string;
  amountVnd: number;
  partners?: number;
  hint: string;
  tone?: 'default' | 'warning' | 'danger';
}) {
  return (
    <div className='rounded-lg border p-4'>
      <p className='text-muted-foreground text-xs'>{label}</p>
      <p
        className={
          tone === 'danger'
            ? 'text-destructive mt-1 text-xl font-semibold tabular-nums'
            : 'mt-1 text-xl font-semibold tabular-nums'
        }
      >
        {formatVnd(amountVnd)}
      </p>
      {partners !== undefined && (
        <p className='text-muted-foreground mt-1 text-xs'>{partners} đối tác</p>
      )}
      <p className='text-muted-foreground mt-1 text-xs'>{hint}</p>
    </div>
  );
}

/** The last twelve reconciliation periods, newest first (#064). */
function recentPeriods(): { value: string; label: string }[] {
  const now = new Date();
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return {
      value: `${d.getFullYear()}-${month}`,
      label: `Tháng ${month}/${d.getFullYear()}`
    };
  });
}

const STATUS_FILTERS = [
  { value: 'all', label: 'Tất cả trạng thái' },
  { value: 'pending', label: 'Chờ xác nhận' },
  { value: 'reviewing', label: 'Đang kiểm tra' },
  { value: 'credited', label: 'Đã duyệt' }
];

export function CommissionsView() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [period, setPeriod] = useState('all');

  const { data, isLoading } = useQuery(
    commissionsQueryOptions({
      limit: 50,
      ...(search.trim() && { search: search.trim() }),
      ...(status !== 'all' && { status }),
      ...(period !== 'all' && { period })
    })
  );
  const { data: summary } = useQuery(commissionSummaryQueryOptions());
  const commissions = data?.data ?? [];

  return (
    <div className='space-y-4'>
      {summary && (
        <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5'>
          <StageTile
            label='Chờ xác nhận'
            amountVnd={summary.pendingConfirmation.totalVnd}
            partners={summary.pendingConfirmation.partners}
            hint='Đơn còn trong 24 giờ đầu sau khi đặt'
          />
          <StageTile
            label='Đã duyệt · chờ chi'
            amountVnd={summary.approvedAwaitingPayout.totalVnd}
            partners={summary.approvedAwaitingPayout.partners}
            hint='Đã vào ví đối tác, chưa rút'
          />
          <StageTile
            label='Đang yêu cầu thanh toán'
            amountVnd={summary.payoutRequested.totalVnd}
            partners={summary.payoutRequested.partners}
            hint='Đối tác đã bấm yêu cầu rút tiền'
          />
          <StageTile
            label='Đã chi trả tháng này'
            amountVnd={summary.paidThisMonth.totalVnd}
            partners={summary.paidThisMonth.partners}
            hint='Tính từ đầu tháng'
          />
          <StageTile
            label='Điều chỉnh / hoàn tiền'
            amountVnd={summary.reversed.totalVnd}
            partners={summary.reversed.partners}
            hint='Khách hoàn tiền, huỷ đơn hoặc vi phạm'
            tone='danger'
          />
        </div>
      )}

      <div className='flex flex-wrap items-center gap-2'>
        <Input
          placeholder='Tìm tên, email, SĐT hoặc ID đối tác'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className='max-w-[280px]'
        />
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className='w-[180px]'>
            <SelectValue placeholder='Kỳ đối soát' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>Mọi kỳ đối soát</SelectItem>
            {recentPeriods().map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className='w-[190px]'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTERS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className='flex justify-center py-12'>
          <Icons.spinner className='h-6 w-6 animate-spin' />
        </div>
      ) : commissions.length === 0 ? (
        <p className='text-muted-foreground py-12 text-center text-sm'>Chưa có hoa hồng nào.</p>
      ) : (
        <div className='space-y-3'>
          {commissions.map((c) => (
            <div
              key={c.id}
              className='flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4'
            >
              <div>
                <div className='flex items-center gap-2'>
                  <span className='font-medium'>Đối tác #{c.partnerId}</span>
                  <Badge variant='outline'>Đơn #{c.orderId}</Badge>
                  {c.tierSnapshot && <Badge variant='outline'>{c.tierSnapshot}</Badge>}
                </div>
                <p className='text-muted-foreground text-xs'>{formatDateTimeVn(c.createdAt)}</p>
                {c.rejectionReason && (
                  <p className='text-destructive text-xs'>
                    Tự giới thiệu — {REJECTION_REASON[c.rejectionReason] ?? c.rejectionReason}
                  </p>
                )}
              </div>
              <div className='flex items-center gap-3'>
                <span className='text-lg font-semibold'>{formatVnd(c.commissionVnd)}</span>
                <Badge variant={STATUS_VARIANT[c.status]}>{STATUS_LABEL[c.status]}</Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
