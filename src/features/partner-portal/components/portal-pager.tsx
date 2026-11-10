'use client';

/**
 * Paging for the portal's own lists (doitac-0911 #014): the admin tables'
 * footer — "Tổng cộng N hàng", rows per page, page N / M and the arrows — for
 * a list the page already holds in full. A partner chooses 10-20-30-40-50-100
 * rows at a time, as everywhere in the portal.
 */

import { useEffect, useMemo, useState } from 'react';

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

/** One page of `rows`, and the state the pager below needs. */
export function usePortalPage<T>(rows: T[], initialSize = 10) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialSize);
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));

  // A shorter list (a filter, a refresh) must not leave the page past its end.
  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  const current = Math.min(page, pageCount);
  const pageRows = useMemo(
    () => rows.slice((current - 1) * pageSize, current * pageSize),
    [rows, current, pageSize]
  );

  return {
    pageRows,
    pager: {
      total: rows.length,
      page: current,
      pageCount,
      pageSize,
      setPage,
      setPageSize: (size: number) => {
        setPageSize(size);
        setPage(1);
      }
    }
  };
}

export function PortalPager({
  total,
  page,
  pageCount,
  pageSize,
  setPage,
  setPageSize,
  testId
}: ReturnType<typeof usePortalPage>['pager'] & { testId?: string }) {
  if (total === 0) return null;
  return (
    <div
      className='flex flex-wrap items-center justify-between gap-3 pt-3 text-sm'
      data-testid={testId}
    >
      <span className='text-muted-foreground'>Tổng cộng {total.toLocaleString('vi-VN')} hàng.</span>
      <div className='flex flex-wrap items-center gap-4'>
        <div className='flex items-center gap-2'>
          <span className='whitespace-nowrap'>Hàng mỗi trang</span>
          <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
            <SelectTrigger className='h-8 w-[72px]' aria-label='Hàng mỗi trang'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent side='top'>
              {PORTAL_PAGE_SIZES.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <span className='whitespace-nowrap'>
          Trang {page} / {pageCount}
        </span>
        <div className='flex items-center gap-1'>
          <Button
            variant='outline'
            size='icon'
            className='size-8'
            aria-label='Trang đầu'
            disabled={page <= 1}
            onClick={() => setPage(1)}
          >
            <Icons.chevronsLeft className='size-4' />
          </Button>
          <Button
            variant='outline'
            size='icon'
            className='size-8'
            aria-label='Trang trước'
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            <Icons.chevronLeft className='size-4' />
          </Button>
          <Button
            variant='outline'
            size='icon'
            className='size-8'
            aria-label='Trang sau'
            disabled={page >= pageCount}
            onClick={() => setPage(page + 1)}
          >
            <Icons.chevronRight className='size-4' />
          </Button>
          <Button
            variant='outline'
            size='icon'
            className='size-8'
            aria-label='Trang cuối'
            disabled={page >= pageCount}
            onClick={() => setPage(pageCount)}
          >
            <Icons.chevronsRight className='size-4' />
          </Button>
        </div>
      </div>
    </div>
  );
}
