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
  // blogs: sub-category filter (#054), author / xuất bản / nổi bật (#046).
  // Single-value selects, so plain strings rather than arrays. `popular` rather
  // than `isPopular`, which is already the array-valued catalogue filter used by
  // the destination and region lists.
  parent: parseAsString,
  author: parseAsString,
  isPublished: parseAsString,
  popular: parseAsString,
  role: parseAsString,
  isCheapest: parseAsArrayOf(parseAsString, ','),
  isActive: parseAsArrayOf(parseAsString, ','),
  // destinations / regions: Nổi bật and the free-text supplier column (#034, #036).
  // `providers` is plural to match those columns; `provider` above is the plans
  // one, which filters an exact single-value column.
  isPopular: parseAsArrayOf(parseAsString, ','),
  providers: parseAsArrayOf(parseAsString, ','),
  type: parseAsArrayOf(parseAsString, ','),
  tags: parseAsArrayOf(parseAsString, ','),
  duration: parseAsString,
  data: parseAsString,
  // `d:<id>` / `r:<id>` picked from a select box, not free text (#010).
  country: parseAsArrayOf(parseAsString, ','),
  hasCallSms: parseAsArrayOf(parseAsString, ','),
  apn: parseAsArrayOf(parseAsString, ','),
  isNonHkIp: parseAsArrayOf(parseAsString, ','),
  topUp: parseAsArrayOf(parseAsString, ','),
  sort: parseAsString,
  // tickets module
  search: parseAsString,
  status: parseAsString,
  // orders: VAT invoice filter (#051)
  invoice: parseAsString,
  // orders: buyer / order lookups and the #017 filters
  orderNumber: parseAsString,
  userEmail: parseAsString,
  iccid: parseAsString,
  /** esim | affiliate | topup (#017) */
  kind: parseAsString,
  createdFrom: parseAsString,
  createdTo: parseAsString,
  // esims list (#020). `esimStatus` rather than `status`, which is already a
  // single-value param used by orders and tickets.
  packageType: parseAsArrayOf(parseAsString, ','),
  esimStatus: parseAsArrayOf(parseAsString, ','),
  expiresFrom: parseAsString,
  expiresTo: parseAsString,
  // users list (#037). `userStatus` rather than `status`, which is already a
  // single-value param used by orders and tickets.
  customerCode: parseAsString,
  membershipTier: parseAsArrayOf(parseAsString, ','),
  userStatus: parseAsArrayOf(parseAsString, ','),
  // eXu wallet list reuses customerCode / membershipTier above, plus (#057):
  customerName: parseAsString,
  // help center: content-language filter (#053)
  language: parseAsString,
  // supported devices: Nhà sản xuất filter (#052)
  manufacturer: parseAsArrayOf(parseAsString, ','),
  // seo configs: page type plus the meta-copy filters (#048)
  pageType: parseAsArrayOf(parseAsString, ','),
  metaTitle: parseAsString,
  metaDescription: parseAsString,
  // main-menu slides: which mega-menu panel the slide belongs to (#073)
  menuKey: parseAsArrayOf(parseAsString, ','),
  // tabs (e.g. users page: 'user' | 'admin')
  tab: parseAsString
  // advanced filter
  // filters: getFiltersStateParser().withDefault([]),
  // joinOperator: parseAsStringEnum(['and', 'or']).withDefault('and')
};

export const searchParamsCache = createSearchParamsCache(searchParams);
export const serialize = createSerializer(searchParams);
