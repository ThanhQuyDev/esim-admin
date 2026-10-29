'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { getSeoConfigByUrl } from '../api/service';
import type { SeoConfig } from '../api/types';

/** Same page whatever the trailing slash or case: `/Home/` is `/home`. */
function normalizeUrl(url: string): string {
  const trimmed = url.trim().toLowerCase();
  return trimmed.length > 1 ? trimmed.replace(/\/+$/, '') : trimmed;
}

/**
 * The config already on this URL, if another one has it (vande #084). Looked
 * up as the admin types or picks a destination/region, a moment after the
 * last change.
 */
export function useSeoUrlTaken(url: string, ownId?: number | null): SeoConfig | null {
  const [debounced, setDebounced] = useState(url);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(url), 400);
    return () => clearTimeout(timer);
  }, [url]);

  const wanted = normalizeUrl(debounced);
  const { data } = useQuery({
    queryKey: ['seo-configs', 'by-url', wanted],
    queryFn: () => getSeoConfigByUrl(wanted),
    enabled: wanted.startsWith('/'),
    staleTime: 10_000
  });

  // `by-url` falls back to a parent page; only the exact URL is a clash.
  if (!data || normalizeUrl(data.url) !== wanted) return null;
  if (ownId != null && data.id === ownId) return null;
  return data;
}

/** The warning shown instead of letting a second config onto the same URL. */
export function SeoUrlTakenNotice({
  taken,
  onEdit
}: {
  taken: SeoConfig;
  /** Open the existing config instead; no button when left out. */
  onEdit?: (config: SeoConfig) => void;
}) {
  return (
    <div
      className='border-destructive/40 bg-destructive/5 text-destructive space-y-2 rounded-md border p-3 text-sm'
      data-testid='seo-url-taken'
    >
      <p className='flex items-start gap-2'>
        <Icons.alertCircle className='mt-0.5 h-4 w-4 shrink-0' />
        <span>
          URL <strong>{taken.url}</strong> đã tồn tại trên hệ thống nên không cho phép tạo mới, vui
          lòng sử dụng chức năng cập nhật để tiếp tục sử dụng.
        </span>
      </p>
      {onEdit && (
        <Button
          type='button'
          size='sm'
          variant='outline'
          onClick={() => onEdit(taken)}
          data-testid='seo-url-taken-edit'
        >
          <Icons.edit className='mr-2 h-4 w-4' /> Cập nhật cấu hình của URL này
        </Button>
      )}
    </div>
  );
}
