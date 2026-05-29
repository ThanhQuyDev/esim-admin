'use client';
import { DataTable } from '@/components/ui/table/data-table';
import { DataTableToolbar } from '@/components/ui/table/data-table-toolbar';
import { useDataTable } from '@/hooks/use-data-table';
import { useSuspenseQuery } from '@tanstack/react-query';
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import { getSortingStateParser } from '@/lib/parsers';
import { helpCenterQueryOptions } from '../../api/queries';
import {
  getCategoryOptions,
  getParentOptions,
  getCategoryApiKey,
  getParentApiKey
} from '../../api/types';
import { buildColumns } from './columns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

export function HelpCenterTable() {
  const [params, setParams] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    perPage: parseAsInteger.withDefault(10),
    name: parseAsString,
    category: parseAsString,
    parent: parseAsString,
    language: parseAsString,
    sort: getSortingStateParser(
      // build a stable list of column ids regardless of language
      buildColumns('en')
        .map((c) => c.id)
        .filter(Boolean) as string[]
    ).withDefault([])
  });

  const lang = params.language ?? 'en';
  const categoryOptions = getCategoryOptions(lang);
  const parentOptions = getParentOptions(lang);
  const filteredParentOptions = params.category
    ? parentOptions.filter((p) => p.category === params.category)
    : parentOptions;

  const isVi = lang === 'vi';
  const t = {
    allCategories: isVi ? 'Tất cả danh mục' : 'All categories',
    allFolders: isVi ? 'Tất cả thư mục' : 'All folders',
    filterCategory: isVi ? 'Lọc theo danh mục' : 'Filter by category',
    filterFolder: isVi ? 'Lọc theo thư mục' : 'Filter by folder',
    filterLanguage: isVi ? 'Ngôn ngữ' : 'Language',
    languageAll: isVi ? 'Tất cả ngôn ngữ' : 'All languages',
    vietnamese: isVi ? 'Tiếng Việt' : 'Vietnamese',
    english: isVi ? 'Tiếng Anh' : 'English'
  };

  // URL params hold canonical ids (stable when the user toggles the filter
  // language). Translate to the localized kebab-case key the backend expects
  // (e.g. category=bat-dau when lang=vi, category=getting-started when lang=en).
  const filters = {
    page: params.page,
    limit: params.perPage,
    ...(params.name && { search: params.name }),
    ...(params.category && { category: getCategoryApiKey(params.category, lang) }),
    ...(params.parent && { parent: getParentApiKey(params.parent, lang) }),
    ...(params.language && { language: params.language })
  };
  const { data } = useSuspenseQuery(helpCenterQueryOptions(filters));
  const pageCount = Math.ceil((data.totalCount ?? 0) / params.perPage);
  const columns = buildColumns(lang);
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
          value={params.language ?? 'all'}
          onValueChange={(val) =>
            setParams({ language: val === 'all' ? null : val, page: 1 }, { shallow: true })
          }
        >
          <SelectTrigger className='h-8 w-[150px]'>
            <SelectValue placeholder={t.filterLanguage} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>{t.languageAll}</SelectItem>
            <SelectItem value='vi'>{t.vietnamese}</SelectItem>
            <SelectItem value='en'>{t.english}</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={params.category ?? 'all'}
          onValueChange={(val) =>
            setParams(
              { category: val === 'all' ? null : val, parent: null, page: 1 },
              { shallow: true }
            )
          }
        >
          <SelectTrigger className='h-8 w-[180px]'>
            <SelectValue placeholder={t.filterCategory} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>{t.allCategories}</SelectItem>
            {categoryOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={params.parent ?? 'all'}
          onValueChange={(val) =>
            setParams({ parent: val === 'all' ? null : val, page: 1 }, { shallow: true })
          }
        >
          <SelectTrigger className='h-8 w-[180px]'>
            <SelectValue placeholder={t.filterFolder} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>{t.allFolders}</SelectItem>
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
