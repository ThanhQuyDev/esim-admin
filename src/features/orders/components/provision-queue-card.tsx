'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Icons } from '@/components/icons';
import { formatDateTimeVn } from '@/lib/format';

export type ProvisionQueueRow = {
  /** The order line. */
  id: number;
  planName: string;
  /** eSIMs of the line still missing; a bulk line is usually one. */
  missing?: number;
  attempts: number;
  lastAttemptAt: string | null;
  /** When the system asks again by itself, or null when it has stopped. */
  nextRetryAt: string | null;
  /** The supplier's last answer; left out on the partner portal. */
  lastError?: string | null;
  /** "Gọi lại API" may be pressed for this row. */
  canRetry: boolean;
};

const at = (value: string | null) => (value ? formatDateTimeVn(value) : '—');

/**
 * "Hàng đợi eSIM lỗi" of an order (vande-1411 #002): the eSIMs the supplier
 * has not given yet, how often they were asked, and when the system asks
 * again — what a bulk "file" order otherwise hides, since its products are not
 * listed. Each row has its own "Gọi lại API".
 */
export function ProvisionQueueCard({
  rows,
  onRetry,
  retryingId,
  busy
}: {
  rows: ProvisionQueueRow[];
  onRetry: (id: number) => void;
  /** The row being asked right now. */
  retryingId?: number | null;
  /** Some retry of this order is running: hold the other buttons. */
  busy?: boolean;
}) {
  if (rows.length === 0) return null;
  const missing = rows.reduce((sum, row) => sum + Math.max(1, row.missing ?? 1), 0);
  return (
    <Card className='min-w-0' data-testid='provision-queue'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Icons.warning className='text-destructive h-4 w-4' />
          Hàng đợi eSIM lỗi ({missing})
        </CardTitle>
        <CardDescription>
          Nhà cung cấp chưa trả các eSIM này. Hệ thống tự gọi lại từng eSIM sau 1–5 phút, các eSIM
          cách nhau 10–20 giây; bấm &quot;Gọi lại API&quot; để gọi ngay. Đừng tải file danh sách khi
          hàng đợi còn eSIM.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* A table on a wide screen, one block per eSIM on a phone. */}
        <div className='hidden overflow-x-auto md:block'>
          <table className='w-full text-sm'>
            <thead>
              <tr className='text-muted-foreground border-b text-left'>
                <th className='py-2 pr-3 font-medium'>#</th>
                <th className='py-2 pr-3 font-medium'>Sản phẩm</th>
                <th className='py-2 pr-3 text-right font-medium'>Số lần đã thử</th>
                <th className='py-2 pr-3 font-medium'>Lần thử gần nhất</th>
                <th className='py-2 pr-3 font-medium'>Hệ thống tự gọi lại lúc</th>
                <th className='py-2 font-medium' />
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr
                  key={row.id}
                  className='border-b align-top last:border-0'
                  data-testid={`provision-queue-row-${row.id}`}
                >
                  <td className='py-2 pr-3'>{index + 1}</td>
                  <td className='py-2 pr-3'>
                    <div className='font-medium'>{row.planName}</div>
                    {row.lastError && (
                      <div className='text-destructive text-xs break-words'>{row.lastError}</div>
                    )}
                  </td>
                  <td className='py-2 pr-3 text-right'>{row.attempts}</td>
                  <td className='py-2 pr-3 whitespace-nowrap'>{at(row.lastAttemptAt)}</td>
                  <td className='py-2 pr-3 whitespace-nowrap'>
                    {row.nextRetryAt ? at(row.nextRetryAt) : 'Đã ngừng tự gọi lại'}
                  </td>
                  <td className='py-2 text-right'>
                    <RetryButton row={row} onRetry={onRetry} retryingId={retryingId} busy={busy} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className='space-y-3 md:hidden'>
          {rows.map((row, index) => (
            <div
              key={row.id}
              className='space-y-1 rounded-md border p-3 text-sm'
              data-testid={`provision-queue-item-${row.id}`}
            >
              <div className='font-medium'>
                {index + 1}. {row.planName}
              </div>
              {row.lastError && (
                <div className='text-destructive text-xs break-words'>{row.lastError}</div>
              )}
              <div className='text-muted-foreground'>
                Đã thử {row.attempts} lần · gần nhất {at(row.lastAttemptAt)}
              </div>
              <div className='text-muted-foreground'>
                {row.nextRetryAt
                  ? `Hệ thống tự gọi lại lúc ${at(row.nextRetryAt)}`
                  : 'Hệ thống đã ngừng tự gọi lại'}
              </div>
              <RetryButton row={row} onRetry={onRetry} retryingId={retryingId} busy={busy} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function RetryButton({
  row,
  onRetry,
  retryingId,
  busy
}: {
  row: ProvisionQueueRow;
  onRetry: (id: number) => void;
  retryingId?: number | null;
  busy?: boolean;
}) {
  const spinning = retryingId === row.id;
  return (
    <Button
      type='button'
      size='sm'
      variant='outline'
      disabled={!row.canRetry || busy}
      title={row.canRetry ? undefined : 'Không gọi lại được, vui lòng liên hệ Admin'}
      onClick={() => onRetry(row.id)}
      data-testid={`provision-queue-retry-${row.id}`}
    >
      {spinning ? (
        <Icons.spinner className='mr-2 h-4 w-4 animate-spin' />
      ) : (
        <Icons.send className='mr-2 h-4 w-4' />
      )}
      Gọi lại API
    </Button>
  );
}
