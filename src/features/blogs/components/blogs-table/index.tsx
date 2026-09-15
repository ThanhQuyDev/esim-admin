'use client';
import { useTransition } from 'react';
import { DataTable } from '@/components/ui/table/data-table';
import { DataTableToolbar } from '@/components/ui/table/data-table-toolbar';
import { useDataTable } from '@/hooks/use-data-table';
import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import { getSortingStateParser } from '@/lib/parsers';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { blogCategoryTreeQueryOptions, blogsQueryOptions } from '../../api/queries';
import { blogCategoryFilters, categoryOptions, parentOptions } from '../../utils/category-filter';
import { columns } from './columns';

const columnIds = columns.map((c) => c.id).filter(Boolean) as string[];

const ALL = '__all__';

export function BlogsTable() {
  const [, startTransition] = useTransition();
  const [params, setParams] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    perPage: parseAsInteger.withDefault(10),
    name: parseAsString,
    category: parseAsString,
    parent: parseAsString,
    sort: getSortingStateParser(columnIds).withDefault([])
  });
  const apiSort = params.sort.map((s) => ({ orderBy: s.id, order: s.desc ? 'DESC' : 'ASC' }));
  // Category / sub-category filter (#054).
  const categoryFilters = blogCategoryFilters(params.category, params.parent);
  const filters = {
    page: params.page,
    limit: params.perPage,
    ...(params.name && { search: params.name }),
    ...(categoryFilters && { filters: categoryFilters }),
    ...(apiSort.length > 0 && { sort: JSON.stringify(apiSort) })
  };
  const { data } = useSuspenseQuery(blogsQueryOptions(filters));
  const { data: categoryTree } = useQuery(blogCategoryTreeQueryOptions());
  const categories = categoryOptions(categoryTree);
  const parents = parentOptions(categoryTree, params.category);

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
    <DataTable table={table} totalRowCount={data.totalCount}>
      <DataTableToolbar table={table}>
        <Select
          value={params.category ?? ALL}
          onValueChange={(value) =>
            startTransition(() => {
              // A sub-category belongs to one category: changing the category drops it.
              setParams({ category: value === ALL ? null : value, parent: null, page: 1 });
            })
          }
        >
          <SelectTrigger className='h-8 w-44' aria-label='Lọc theo danh mục'>
            <SelectValue placeholder='Danh mục' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Tất cả danh mục</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={params.parent ?? ALL}
          onValueChange={(value) =>
            startTransition(() => {
              setParams({ parent: value === ALL ? null : value, page: 1 });
            })
          }
          disabled={parents.length === 0}
        >
          <SelectTrigger className='h-8 w-44' aria-label='Lọc theo danh mục con'>
            <SelectValue placeholder='Danh mục con' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Tất cả danh mục con</SelectItem>
            {parents.map((parent) => (
              <SelectItem key={parent} value={parent}>
                {parent}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </DataTableToolbar>
    </DataTable>
  );
}

export function BlogsTableSkeleton() {
  return (
    <div className='flex flex-1 animate-pulse flex-col gap-4'>
      <div className='bg-muted h-10 w-full rounded' />
      <div className='bg-muted h-96 w-full rounded-lg' />
      <div className='bg-muted h-10 w-full rounded' />
    </div>
  );
}
