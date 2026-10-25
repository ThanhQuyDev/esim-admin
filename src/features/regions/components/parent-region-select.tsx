'use client';

import { useQuery } from '@tanstack/react-query';
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

/** "Châu Á 13 Quốc Gia · esim-chau-a-13-quoc-gia" — the slug tells look-alikes apart. */
function regionLabel(region: Region): string {
  return `${region.titleVi || region.name} · ${region.slugVi || region.slug}`;
}

/**
 * "Khu vực cha" (vande #035): the region whose website page lists this one as
 * another pack. One level only, so the choices are the regions that have no
 * parent themselves, and a region that already is a parent cannot pick one.
 */
export function ParentRegionSelect({
  regionId,
  value,
  onChange
}: {
  /** The region being edited; absent while creating one. */
  regionId?: number;
  value: number | null;
  onChange: (parentId: number | null) => void;
}) {
  const { data } = useQuery(regionsQueryOptions({ page: 1, limit: 200 }));
  const regions = data?.data ?? [];
  const children = regionId ? regions.filter((r) => r.parentId === regionId) : [];
  const choices = regions
    .filter((r) => r.id !== regionId && !r.parentId)
    .sort((a, b) => regionLabel(a).localeCompare(regionLabel(b), 'vi'));

  return (
    <div className='space-y-2'>
      <label className='text-sm font-medium' htmlFor='region-parent'>
        Khu vực cha
      </label>
      <Select
        value={value ? String(value) : NONE}
        onValueChange={(v) => onChange(v === NONE ? null : Number(v))}
        disabled={children.length > 0}
      >
        <SelectTrigger id='region-parent' className='w-full' data-testid='region-parent'>
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
      <p className='text-xs text-muted-foreground'>
        {children.length > 0
          ? `Đang là khu vực cha của: ${children.map((c) => c.titleVi || c.name).join(', ')}`
          : 'Chọn khu vực cha thì khu vực này hiện chung 1 trang với khu vực cha trên website.'}
      </p>
    </div>
  );
}

/** "↳ Thuộc: Châu Á" under a region's name in the list (vande #035). */
export function ParentRegionName({ parentId }: { parentId: number }) {
  const { data } = useQuery(regionsQueryOptions({ page: 1, limit: 200 }));
  const parent = data?.data.find((r) => r.id === parentId);
  return (
    <span className='text-xs text-blue-600'>
      ↳ Thuộc: {parent ? parent.titleVi || parent.name : `#${parentId}`}
    </span>
  );
}
