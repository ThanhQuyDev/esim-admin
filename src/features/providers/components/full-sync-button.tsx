'use client';

/**
 * "Cập nhật lại toàn bộ sản phẩm" (doitac-1410 #074): pull every supplier's
 * catalogue now instead of waiting for the 6-hourly run.
 *
 * Switching a supplier on or off already re-ranks the plans straight away —
 * the cheapest flags are recomputed over what is still on sale, so plans a
 * cheaper supplier was hiding come back at once. This button is for fresh
 * prices and new plans from the suppliers themselves.
 */

import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { formatDateTimeVn } from '@/lib/format';

import {
  getFullSyncHistory,
  getFullSyncStatus,
  startFullSync,
  type FullSyncRun
} from '../api/service';

/** "25 phút 30 giây" — how long a run took. */
export function formatSyncDuration(seconds: number | null): string {
  if (seconds === null) return 'Đang chạy…';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h ? `${h} giờ` : '', m ? `${m} phút` : '', `${s} giây`].filter(Boolean).join(' ');
}

/** "15:23 29/10/2026" */
const at = (date: string | null) =>
  date
    ? formatDateTimeVn(date, {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    : '—';

/**
 * The latest runs of the full sync (vande #078), so the admin can check how
 * long each took and who started it.
 */
function FullSyncHistory({ runs }: { runs: FullSyncRun[] }) {
  return (
    <div className='w-full overflow-x-auto' data-testid='full-sync-history'>
      <p className='mb-2 text-sm font-medium'>Lịch sử cập nhật (5 lần gần nhất)</p>
      {runs.length === 0 ? (
        <p className='text-muted-foreground text-xs'>Chưa có lượt cập nhật nào được ghi lại.</p>
      ) : (
        <table className='w-full min-w-[640px] text-xs'>
          <thead>
            <tr className='text-muted-foreground border-b text-left'>
              <th className='py-1.5 pr-3 font-medium'>Bắt đầu cập nhật</th>
              <th className='py-1.5 pr-3 font-medium'>Hoàn thành cập nhật</th>
              <th className='py-1.5 pr-3 font-medium'>Tổng thời gian</th>
              <th className='py-1.5 pr-3 font-medium'>Thực hiện bởi</th>
              <th className='py-1.5 font-medium'>Lỗi</th>
            </tr>
          </thead>
          <tbody>
            {runs.map((run) => (
              <tr key={run.id} className='border-b last:border-0'>
                <td className='py-1.5 pr-3 whitespace-nowrap'>{at(run.startedAt)}</td>
                <td className='py-1.5 pr-3 whitespace-nowrap'>{at(run.finishedAt)}</td>
                <td className='py-1.5 pr-3 whitespace-nowrap'>
                  {formatSyncDuration(run.durationSeconds)}
                </td>
                <td className='py-1.5 pr-3'>{run.startedBy}</td>
                <td className='text-muted-foreground py-1.5'>
                  {run.errors.length ? run.errors.join('; ') : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export function FullSyncButton() {
  const queryClient = useQueryClient();
  const { data: status } = useQuery({
    queryKey: ['providers', 'full-sync'],
    queryFn: getFullSyncStatus,
    // While a run is going, check back every few seconds.
    refetchInterval: (query) => (query.state.data?.running ? 5000 : false)
  });
  const { data: history = [] } = useQuery({
    // A run that just finished changes `finishedAt`, which reloads the list.
    queryKey: ['providers', 'full-sync', 'history', status?.finishedAt ?? null],
    queryFn: getFullSyncHistory,
    refetchInterval: status?.running ? 5000 : false
  });
  const start = useMutation({
    mutationFn: startFullSync,
    onSuccess: (result) => {
      toast[result.started ? 'success' : 'info'](
        result.started
          ? 'Đã bắt đầu cập nhật toàn bộ sản phẩm. Việc này mất vài phút.'
          : 'Đang có một lượt cập nhật chạy, vui lòng chờ lượt đó xong.'
      );
      queryClient.setQueryData(['providers', 'full-sync'], result.status);
      queryClient.invalidateQueries({ queryKey: ['providers', 'full-sync', 'history'] });
    },
    onError: (e: Error) => toast.error(e.message || 'Không bắt đầu được')
  });
  const running = Boolean(status?.running) || start.isPending;

  return (
    <div
      className='flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4'
      data-testid='full-sync'
    >
      <div className='min-w-0 space-y-1 text-sm'>
        <p className='font-medium'>Cập nhật lại toàn bộ sản phẩm</p>
        <p className='text-muted-foreground text-xs'>
          Gọi API tất cả nhà cung cấp ngay để lấy giá và gói mới, không chờ chu kỳ 6 giờ/lần.
          Bật/tắt nhà cung cấp thì hệ thống đã tự cập nhật ngay các gói hiển thị, không cần bấm nút
          này.
        </p>
        <p className='text-muted-foreground text-xs' data-testid='full-sync-status'>
          {status?.running
            ? `Đang cập nhật… (bắt đầu ${status.startedAt ? formatDateTimeVn(status.startedAt) : ''})`
            : status?.finishedAt
              ? `Lần gần nhất xong lúc ${formatDateTimeVn(status.finishedAt)}${
                  status.errors.length ? ` · lỗi: ${status.errors.join('; ')}` : ''
                }`
              : 'Chưa có lượt cập nhật nào từ khi máy chủ khởi động.'}
        </p>
      </div>
      <Button onClick={() => start.mutate()} disabled={running}>
        {running ? (
          <Icons.spinner className='mr-2 h-4 w-4 animate-spin' />
        ) : (
          <Icons.refresh className='mr-2 h-4 w-4' />
        )}
        {running ? 'Đang cập nhật…' : 'Cập nhật lại toàn bộ sản phẩm'}
      </Button>
      <FullSyncHistory runs={history} />
    </div>
  );
}
