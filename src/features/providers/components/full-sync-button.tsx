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

import { getFullSyncStatus, startFullSync } from '../api/service';

export function FullSyncButton() {
  const queryClient = useQueryClient();
  const { data: status } = useQuery({
    queryKey: ['providers', 'full-sync'],
    queryFn: getFullSyncStatus,
    // While a run is going, check back every few seconds.
    refetchInterval: (query) => (query.state.data?.running ? 5000 : false)
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
    </div>
  );
}
