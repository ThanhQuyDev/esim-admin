'use client';

import { useQuery } from '@tanstack/react-query';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { regionsQueryOptions } from '../api/queries';
import type { Region } from '../api/types';

const NONE = 'none';

/** Every "khu vực cha" (vande-0411 #073), for the form and the list filter. */
export const parentRegionsQuery = regionsQueryOptions({
  page: 1,
  limit: 200,
  filters: JSON.stringify({ isParent: true })
});

/** "Châu Á · esim-chau-a" — the slug tells look-alikes apart. */
function regionLabel(region: Region): string {
  return `${region.titleVi || region.name} · ${region.slugVi || region.slug}`;
}

/**
 * Tick "Làm khu vực cha", or pick the parent this region is listed under. The
 * two exclude each other, and only parents can be picked (vande-0411 #073).
 */
export function ParentRegionSelect({
  regionId,
  isParent,
  onIsParentChange,
  value,
  onChange
}: {
  /** The region being edited; absent while creating one. */
  regionId?: number;
  isParent: boolean;
  onIsParentChange: (isParent: boolean) => void;
  value: number | null;
  onChange: (parentId: number | null) => void;
}) {
  const { data: parents } = useQuery(parentRegionsQuery);
  const { data: childrenData } = useQuery({
    ...regionsQueryOptions({
      page: 1,
      limit: 200,
      filters: JSON.stringify({ parentIds: [regionId] })
    }),
    enabled: !!regionId && isParent
  });
  const children = regionId && isParent ? (childrenData?.data ?? []) : [];
  const choices = (parents?.data ?? [])
    .filter((r) => r.id !== regionId)
    .sort((a, b) => regionLabel(a).localeCompare(regionLabel(b), 'vi'));

  return (
    <div className='space-y-2'>
      <label className='flex items-center gap-2 text-sm font-medium'>
        <Checkbox
          checked={isParent}
          disabled={children.length > 0}
          data-testid='region-is-parent'
          onCheckedChange={(checked) => {
            onIsParentChange(checked === true);
            if (checked === true) onChange(null);
          }}
        />
        Làm khu vực cha
      </label>
      {isParent ? (
        <p className='text-muted-foreground text-xs'>
          {children.length > 0
            ? `Đang là khu vực cha của ${children.length} khu vực gồm: ${children.map((c) => c.titleVi || c.name).join(', ')}. Muốn bỏ tích thì chuyển các khu vực con này ra trước.`
            : 'Khu vực này có thể được chọn làm khu vực cha cho các khu vực khác.'}
        </p>
      ) : (
        <>
          <Select
            value={value ? String(value) : NONE}
            onValueChange={(v) => onChange(v === NONE ? null : Number(v))}
          >
            <SelectTrigger
              id='region-parent'
              aria-label='Khu vực cha'
              className='w-full'
              data-testid='region-parent'
            >
              <SelectValue placeholder='Không có' />
            </SelectTrigger>
            <SelectContent className='max-h-80'>
              <SelectItem value={NONE}>Không có (trang riêng)</SelectItem>
              {choices.map((r) => (
                <SelectItem key={r.id} value={String(r.id)}>
                  {regionLabel(r)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className='text-muted-foreground text-xs'>
            Chọn khu vực cha thì khu vực này hiện chung 1 trang với khu vực cha trên website.
          </p>
        </>
      )}
    </div>
  );
}
