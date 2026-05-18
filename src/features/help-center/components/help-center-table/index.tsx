'use client';
import { DataTable } from '@/components/ui/table/data-table';
import { DataTableToolbar } from '@/components/ui/table/data-table-toolbar';
import { useDataTable } from '@/hooks/use-data-table';
import { useSuspenseQuery } from '@tanstack/react-query';
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import { getSortingStateParser } from '@/lib/parsers';
import { helpCenterQueryOptions } from '../../api/queries';
import {
  CATEGORY_OPTIONS,
  PARENT_OPTIONS,
  type HelpCenterCategory,
  type HelpCenterParent
} from '../../api/types';
import { columns } from './columns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

const columnIds = columns.map((c) => c.id).filter(Boolean) as string[];

export function HelpCenterTable() {
  const [params, setParams] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    perPage: parseAsInteger.withDefault(10),
    name: parseAsString,
    category: parseAsString,
    parent: parseAsString,
    sort: getSortingStateParser(columnIds).withDefault([])
  });

  const filteredParentOptions = params.category
    ? PARENT_OPTIONS.filter((p) => p.category === params.category)
    : PARENT_OPTIONS;

  const filters = {
    page: params.page,
    limit: params.perPage,
    ...(params.name && { search: params.name }),
    ...(params.category && { category: params.category as HelpCenterCategory }),
    ...(params.parent && { parent: params.parent as HelpCenterParent })
  };
  const { data } = useSuspenseQuery(helpCenterQueryOptions(filters));
  const pageCount = Math.ceil((data.totalCount ?? 0) / params.perPage);
  const { table } = useDataTable({
    data: data.data,
    columns,
    pageCount,
    shallow: true,
    debounceMs: 500,
    initialState: { columnPinning: { right: ['actions'] } }
  });
  return (
    <DataTable table={table}>
      <DataTableToolbar table={table}>
        <Select
          value={params.category ?? ''}
          onValueChange={(val) =>
            setParams({ category: val || null, parent: null, page: 1 }, { shallow: true })
          }
        >
          <SelectTrigger className='h-8 w-[180px]'>
            <SelectValue placeholder='Lọc theo danh mục' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value=''>Tất cả danh mục</SelectItem>
            {CATEGORY_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={params.parent ?? ''}
          onValueChange={(val) => setParams({ parent: val || null, page: 1 }, { shallow: true })}
        >
          <SelectTrigger className='h-8 w-[180px]'>
            <SelectValue placeholder='Lọc theo thư mục' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value=''>Tất cả thư mục</SelectItem>
            {filteredParentOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </DataTableToolbar>
    </DataTable>
  );
}

export function HelpCenterTableSkeleton() {
  return (
    <div className='flex flex-1 animate-pulse flex-col gap-4'>
      <div className='bg-muted h-10 w-full rounded' />
      <div className='bg-muted h-96 w-full rounded-lg' />
      <div className='bg-muted h-10 w-full rounded' />
    </div>
  );
}
