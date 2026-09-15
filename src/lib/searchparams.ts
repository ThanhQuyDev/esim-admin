import {
  createSearchParamsCache,
  createSerializer,
  parseAsArrayOf,
  parseAsInteger,
  parseAsString
} from 'nuqs/server';

export const searchParams = {
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(10),
  name: parseAsString,
  planName: parseAsString,
  provider: parseAsArrayOf(parseAsString, ','),
  gender: parseAsString,
  category: parseAsString,
  role: parseAsString,
  isCheapest: parseAsArrayOf(parseAsString, ','),
  isActive: parseAsArrayOf(parseAsString, ','),
  type: parseAsArrayOf(parseAsString, ','),
  tags: parseAsArrayOf(parseAsString, ','),
  duration: parseAsString,
  data: parseAsString,
  country: parseAsString,
  hasCallSms: parseAsArrayOf(parseAsString, ','),
  sort: parseAsString,
  // tickets module
  search: parseAsString,
  status: parseAsString,
  // orders: VAT invoice filter (#051)
  invoice: parseAsString,
  // tabs (e.g. users page: 'user' | 'admin')
  tab: parseAsString
  // advanced filter
  // filters: getFiltersStateParser().withDefault([]),
  // joinOperator: parseAsStringEnum(['and', 'or']).withDefault('and')
};

export const searchParamsCache = createSearchParamsCache(searchParams);
export const serialize = createSerializer(searchParams);
