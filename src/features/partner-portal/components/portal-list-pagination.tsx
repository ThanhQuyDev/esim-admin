'use client';

/**
 * Paging for the partner's history lists (doitac-3010 #024): "Lịch sử giao
 * dịch", "Lịch sử nạp tiền", "Lịch sử rút tiền". It looks like the admin's
 * table pagination, but a partner picks only 10–100 rows at a time.
 */

import { useEffect, useMemo, useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@radix-ui/react-icons';

import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

export const PORTAL_PAGE_SIZES = [10, 20, 30, 40, 50, 100];

export function usePortalPagination<T>(rows: T[], initialPageSize = 10) {
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [pageIndex, setPageIndex] = useState(0);
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));

  // A new filter or a shorter list must not leave the view on a page that no
  // longer exists.
  useEffect(() => {
    if (pageIndex > pageCount - 1) setPageIndex(pageCount - 1);
  }, [pageIndex, pageCount]);

  const pageRows = useMemo(
    () => rows.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize),
    [rows, pageIndex, pageSize]
  );

  return {
    pageRows,
    pagination: {
      total: rows.length,
      pageIndex: Math.min(pageIndex, pageCount - 1),
      pageCount,
      pageSize,
      setPageIndex,
      setPageSize: (size: number) => {
        setPageSize(size);
        setPageIndex(0);
      }
    }
  };
}

export type PortalPagination = ReturnType<typeof usePortalPagination>['pagination'];

export function PortalListPagination({
  pagination,
  unit = 'dòng',
  testId,
  pageSizes = PORTAL_PAGE_SIZES
}: {
  pagination: PortalPagination;
  unit?: string;
  testId?: string;
  /** The admin's tables also offer 200 (doitac-3010 #033). */
  pageSizes?: number[];
}) {
  const { total, pageIndex, pageCount, pageSize, setPageIndex, setPageSize } = pagination;
  const canPrev = pageIndex > 0;
  const canNext = pageIndex < pageCount - 1;

  return (
    <div
      className='flex w-full flex-col-reverse items-center justify-between gap-4 p-1 sm:flex-row sm:gap-8'
      data-testid={testId}
    >
      <div className='text-muted-foreground flex-1 text-sm whitespace-nowrap'>
        Tổng cộng {total.toLocaleString('vi-VN')} {unit}.
      </div>
      <div className='flex flex-col-reverse items-center gap-4 sm:flex-row sm:gap-6 lg:gap-8'>
        <div className='flex items-center space-x-2'>
          <p className='text-sm font-medium whitespace-nowrap'>Hàng mỗi trang</p>
          <Select value={`${pageSize}`} onValueChange={(value) => setPageSize(Number(value))}>
            <SelectTrigger
              className='h-8 w-[4.5rem] [&[data-size]]:h-8'
              aria-label='Hàng mỗi trang'
            >
              <SelectValue placeholder={pageSize} />
            </SelectTrigger>
            <SelectContent side='top'>
              {pageSizes.map((size) => (
                <SelectItem key={size} value={`${size}`}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className='flex items-center justify-center text-sm font-medium'>
          Trang {pageIndex + 1} / {pageCount}
        </div>
        <div className='flex items-center space-x-2'>
          <Button
            aria-label='Đến trang đầu'
            variant='outline'
            size='icon'
            className='hidden size-8 lg:flex'
            onClick={() => setPageIndex(0)}
            disabled={!canPrev}
          >
            <Icons.chevronsLeft />
          </Button>
          <Button
            aria-label='Trang trước'
            variant='outline'
            size='icon'
            className='size-8'
            onClick={() => setPageIndex(pageIndex - 1)}
            disabled={!canPrev}
          >
            <ChevronLeftIcon />
          </Button>
          <Button
            aria-label='Trang tiếp theo'
            variant='outline'
            size='icon'
            className='size-8'
            onClick={() => setPageIndex(pageIndex + 1)}
            disabled={!canNext}
          >
            <ChevronRightIcon />
          </Button>
          <Button
            aria-label='Đến trang cuối'
            variant='outline'
            size='icon'
            className='hidden size-8 lg:flex'
            onClick={() => setPageIndex(pageCount - 1)}
            disabled={!canNext}
          >
            <Icons.chevronsRight />
          </Button>
        </div>
      </div>
    </div>
  );
}
