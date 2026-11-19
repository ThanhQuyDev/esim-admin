'use client';

import { useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';

/** How long a page keeps looking after "Gọi lại API", and how often. */
export const ESIM_WATCH_MS = 3 * 60_000;
export const ESIM_WATCH_EVERY_MS = 4_000;

/**
 * After "Gọi lại API" succeeds the supplier sends the eSIM a few seconds later
 * (its webhook), and the order page only showed it after an F5 (vande-2011
 * #006). `start()` opens a 3-minute window in which `refetchInterval` asks
 * again every 4 seconds while eSIMs are still missing; once they have all
 * come the page says so and stops.
 */
export function useEsimArrivalWatch(missing: number) {
  const until = useRef(0);
  const before = useRef(missing);

  const start = useCallback(() => {
    until.current = Date.now() + ESIM_WATCH_MS;
  }, []);

  /** For `refetchInterval`: keep asking while watching and eSIMs are missing. */
  const interval = useCallback(
    (stillMissing: number): number | false =>
      until.current > Date.now() && stillMissing > 0 ? ESIM_WATCH_EVERY_MS : false,
    []
  );

  useEffect(() => {
    const watching = until.current > Date.now();
    if (watching && missing < before.current) {
      toast.success(
        missing === 0
          ? 'Nhà cung cấp đã trả eSIM — mã QR đã hiện trên trang.'
          : `Đã nhận thêm ${before.current - missing} eSIM, còn thiếu ${missing}.`
      );
      if (missing === 0) until.current = 0;
    }
    before.current = missing;
  }, [missing]);

  return { start, interval };
}
