'use client';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import type { Region } from '../../api/types';
import { Column, ColumnDef } from '@tanstack/react-table';
import { Icons } from '@/components/icons';
import { CellAction } from './cell-action';
import {
  ACTIVE_OPTIONS,
  PROVIDER_OPTIONS,
  REGION_TYPE_OPTIONS,
  YES_NO_OPTIONS
} from '@/lib/catalog-filters';

/** Parents come from the API, so their column is built with its filter options. */
export const buildColumns = (parents: Region[]): ColumnDef<Region>[] => [
  {
    id: 'index',
    header: 'STT',
    cell: ({ row }) => <span className='text-muted-foreground'>{row.index + 1}</span>,
    enableSorting: false
  },
  {
    id: 'avatar',
    accessorKey: 'avatarUrl',
    header: 'Icon khu vực',
    cell: ({ row }) => {
      const avatarUrl = row.original.iconUrl;
      return avatarUrl ? (
        <img
          src={avatarUrl}
          alt={row.original.name}
          className='h-8 w-8 rounded-full object-cover'
        />
      ) : (
        <span className='text-muted-foreground text-xs'>—</span>
      );
    },
    enableSorting: false
  },
  {
    id: 'name',
    accessorKey: 'name',
    header: ({ column }: { column: Column<Region, unknown> }) => (
      <DataTableColumnHeader column={column} title='Tên' />
    ),
    cell: ({ row }) => (
      <div className='flex flex-col'>
        <span className='font-medium'>{row.original.name}</span>
        <span className='text-muted-foreground text-xs'>{row.original.slug}</span>
      </div>
    ),
    meta: {
      label: 'Tên',
      placeholder: 'Tìm kiếm khu vực...',
      variant: 'text' as const,
      icon: Icons.text
    },
    enableColumnFilter: true
  },
  {
    // Travel or Local (vande-1411 #025).
    id: 'esimType',
    accessorKey: 'esimType',
    header: 'eSIM Type',
    cell: ({ row }) =>
      row.original.esimType === 'local' ? (
        <Badge data-testid='esim-type'>Local</Badge>
      ) : (
        <Badge variant='outline' data-testid='esim-type'>
          Travel
        </Badge>
      )
  },
  {
    // After the name, to tell parents from packs (vande-0411 #073).
    id: 'regionType',
    accessorFn: (row) => (row.isParent ? 'parent' : row.parentId ? 'child' : 'standalone'),
    header: 'Kiểu khu vực',
    cell: ({ row }) =>
      row.original.isParent ? (
        <Badge data-testid='region-type'>Cha</Badge>
      ) : row.original.parentId ? (
        <Badge variant='outline' data-testid='region-type'>
          Con
        </Badge>
      ) : (
        <span className='text-muted-foreground text-xs' data-testid='region-type'>
          Thường
        </span>
      ),
    enableSorting: false,
    enableColumnFilter: true,
    meta: {
      label: 'Kiểu khu vực',
      variant: 'multiSelect' as const,
      options: REGION_TYPE_OPTIONS
    }
  },
  {
    id: 'parentId',
    accessorKey: 'parentId',
    header: 'Khu vực cha',
    cell: ({ row }) => {
      const { parentId } = row.original;
      if (!parentId) return <span className='text-muted-foreground text-xs'>—</span>;
      const parent = parents.find((p) => p.id === parentId);
      return (
        <span className='text-sm'>{parent ? parent.titleVi || parent.name : `#${parentId}`}</span>
      );
    },
    enableSorting: false,
    enableColumnFilter: true,
    meta: {
      label: 'Khu vực cha',
      variant: 'multiSelect' as const,
      options: parents.map((p) => ({
        value: String(p.id),
        label: p.titleVi || p.name
      }))
    }
  },
  {
    id: 'children',
    accessorFn: (row) => row.destinationCount ?? 0,
    header: 'Quốc gia',
    cell: ({ row }) => (
      <Badge variant='outline'>{row.original.destinationCount ?? 0} quốc gia</Badge>
    ),
    enableSorting: false
  },
  {
    // Which ones sell (doitac-1410 #077).
    id: 'soldCount',
    accessorKey: 'soldCount',
    header: ({ column }: { column: Column<Region, unknown> }) => (
      <DataTableColumnHeader column={column} title='Lượt bán' />
    ),
    cell: ({ row }) => (
      <span className='tabular-nums' data-testid='sold-count'>
        {Number(row.original.soldCount ?? 0).toLocaleString('vi-VN')}
      </span>
    )
  },
  {
    id: 'isPopular',
    accessorKey: 'isPopular',
    header: 'Nổi bật',
    cell: ({ row }) => (
      <Badge variant={row.original.isPopular ? 'default' : 'secondary'}>
        {row.original.isPopular ? 'Có' : 'Không'}
      </Badge>
    ),
    enableSorting: false,
    enableColumnFilter: true,
    meta: {
      label: 'Nổi bật',
      variant: 'multiSelect' as const,
      options: YES_NO_OPTIONS
    }
  },
  {
    id: 'isActive',
    accessorKey: 'isActive',
    header: 'Hoạt động',
    cell: ({ row }) => (
      <Badge variant={row.original.isActive ? 'default' : 'secondary'}>
        {row.original.isActive ? 'Hoạt động' : 'Không hoạt động'}
      </Badge>
    ),
    enableSorting: false,
    enableColumnFilter: true,
    meta: {
      label: 'Hoạt động',
      variant: 'multiSelect' as const,
      options: ACTIVE_OPTIONS
    }
  },
  {
    id: 'description',
    accessorKey: 'description',
    header: 'Mô tả (EN)',
    cell: ({ row }) => (
      <span className='line-clamp-2 max-w-[200px] text-sm'>{row.original.description || '—'}</span>
    ),
    enableSorting: false
  },
  {
    id: 'descriptionVi',
    accessorKey: 'descriptionVi',
    header: 'Mô tả (VI)',
    cell: ({ row }) => (
      <span className='line-clamp-2 max-w-[200px] text-sm'>
        {row.original.descriptionVi || '—'}
      </span>
    ),
    enableSorting: false
  },
  {
    id: 'providers',
    accessorKey: 'providers',
    header: 'Providers',
    cell: ({ row }) => <span className='text-sm'>{row.original.providers || '—'}</span>,
    enableSorting: false,
    enableColumnFilter: true,
    meta: {
      label: 'Providers',
      variant: 'multiSelect' as const,
      options: PROVIDER_OPTIONS
    }
  },
  {
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} />
  }
];
