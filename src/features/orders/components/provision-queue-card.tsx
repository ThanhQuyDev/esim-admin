'use client';

import { useEffect, useState } from 'react';
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
  /**
   * The supplier took the order but has not given every eSIM yet (vande-2011
   * #005): there is nothing to ask again, the row stays until they come.
   */
  waitingSupplier?: boolean;
};

/** What the "Hệ thống tự gọi lại lúc" column says for a row. */
function nextText(row: ProvisionQueueRow): string {
  if (row.nextRetryAt) return at(row.nextRetryAt);
  return row.waitingSupplier
    ? 'Nhà cung cấp đã nhận đơn — đang chờ trả eSIM'
    : 'Đã ngừng tự gọi lại';
}

/**
 * "Đếm ngược tự gọi lại" (vande-2011 #005): the time left until the system
 * asks again, ticking every second.
 */
function Countdown({ to }: { to: string | null }) {
  // Started after the page is up, so the server and the browser draw the
  // same first frame (the clock differs between them).
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    if (!to) return;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [to]);
  if (!to || now == null) return <>—</>;
  const left = Math.max(0, Math.round((new Date(to).getTime() - now) / 1000));
  if (left === 0) return <>đang gọi…</>;
  const m = Math.floor(left / 60);
  const sec = String(left % 60).padStart(2, '0');
  return (
    <span className='tabular-nums' data-testid='provision-countdown'>
      {m}:{sec}
    </span>
  );
}

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
                <th className='py-2 pr-3 font-medium'>Đếm ngược tự gọi lại</th>
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
                    <div className='font-medium'>
                      {row.planName}
                      {(row.missing ?? 1) > 1 && (
                        <span className='text-muted-foreground font-normal'>
                          {' '}
                          · còn thiếu {row.missing} eSIM
                        </span>
                      )}
                    </div>
                    {row.lastError && (
                      <div className='text-destructive text-xs break-words'>{row.lastError}</div>
                    )}
                  </td>
                  <td className='py-2 pr-3 text-right'>{row.attempts}</td>
                  <td className='py-2 pr-3 whitespace-nowrap'>{at(row.lastAttemptAt)}</td>
                  <td className='py-2 pr-3'>{nextText(row)}</td>
                  <td className='py-2 pr-3 whitespace-nowrap'>
                    <Countdown to={row.nextRetryAt} />
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
                {(row.missing ?? 1) > 1 && (
                  <span className='text-muted-foreground font-normal'>
                    {' '}
                    · còn thiếu {row.missing} eSIM
                  </span>
                )}
              </div>
              {row.lastError && (
                <div className='text-destructive text-xs break-words'>{row.lastError}</div>
              )}
              <div className='text-muted-foreground'>
                Đã thử {row.attempts} lần · gần nhất {at(row.lastAttemptAt)}
              </div>
              <div className='text-muted-foreground'>
                {row.nextRetryAt ? (
                  <>
                    Hệ thống tự gọi lại lúc {at(row.nextRetryAt)} (còn{' '}
                    <Countdown to={row.nextRetryAt} />)
                  </>
                ) : row.waitingSupplier ? (
                  'Nhà cung cấp đã nhận đơn — đang chờ trả eSIM'
                ) : (
                  'Hệ thống đã ngừng tự gọi lại'
                )}
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
      title={
        row.canRetry
          ? undefined
          : row.waitingSupplier
            ? 'Nhà cung cấp đã nhận đơn — không gọi lại để tránh mua trùng'
            : 'Không gọi lại được, vui lòng liên hệ Admin'
      }
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
