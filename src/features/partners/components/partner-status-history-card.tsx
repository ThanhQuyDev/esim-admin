'use client';

import { useQuery } from '@tanstack/react-query';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDateTimeVn } from '@/lib/format';

import { partnerKeys } from '../api/queries';
import { getPartnerStatusHistory } from '../api/service';

const STATUS: Record<string, string> = {
  pending: 'Chờ duyệt',
  active: 'Đang hoạt động',
  hold: 'Tạm khóa tài khoản',
  disabled: 'Khóa tài khoản',
  rejected: 'Bị từ chối'
};
const label = (status: string | null) => (status ? (STATUS[status] ?? status) : '—');

/**
 * "Lịch sử thao tác" (doitac-3010 #009): every lock, unlock and approval of
 * the partner, with the reason the admin typed and who typed it — the
 * reasons were saved but could be read nowhere.
 */
export function PartnerStatusHistoryCard({ partnerId }: { partnerId: number }) {
  const { data = [], isLoading } = useQuery({
    queryKey: [...partnerKeys.detail(partnerId), 'status-history'],
    queryFn: () => getPartnerStatusHistory(partnerId)
  });
  return (
    <Card data-testid='partner-status-history'>
      <CardHeader>
        <CardTitle>Lịch sử thao tác trạng thái</CardTitle>
        <CardDescription>
          Các lần duyệt, tạm khóa, khóa và mở khóa tài khoản cùng lý do admin đã nhập.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className='text-muted-foreground text-sm'>Đang tải…</p>
        ) : data.length === 0 ? (
          <p className='text-muted-foreground text-sm'>Chưa có thao tác nào.</p>
        ) : (
          <ol className='divide-y'>
            {data.map((entry) => (
              <li key={entry.id} className='flex flex-col gap-1 py-3 text-sm'>
                <div className='flex flex-wrap items-center justify-between gap-2'>
                  <span className='font-medium'>
                    {label(entry.fromStatus)} → {label(entry.toStatus)}
                  </span>
                  <span className='text-muted-foreground text-xs'>
                    {formatDateTimeVn(entry.createdAt)}
                    {entry.changedByName ? ` · ${entry.changedByName}` : ''}
                  </span>
                </div>
                <p className='text-muted-foreground break-words'>
                  Lý do: <span className='text-foreground'>{entry.reason || '—'}</span>
                </p>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
