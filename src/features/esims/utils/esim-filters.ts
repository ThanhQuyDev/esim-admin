/**
 * URL params → the `filters` object the eSIMs API takes (#020).
 *
 * One implementation, shared by the server component that prefetches the query
 * and the client component that reads it back: they are compared as
 * `JSON.stringify(filters)` inside the query key, so even the key ORDER has to
 * match or the prefetch is thrown away on every load.
 */
export type EsimFilterParams = {
  name?: string | null;
  planName?: string | null;
  packageType?: string[] | null;
  status?: string[] | null;
  provider?: string[] | null;
  hasCallSms?: string[] | null;
  topUp?: string[] | null;
  createdFrom?: string | null;
  createdTo?: string | null;
  expiresFrom?: string | null;
  expiresTo?: string | null;
};

/** A Có/Không select only means something when exactly one side is picked. */
function boolOf(values: string[] | null | undefined): boolean | undefined {
  return values && values.length === 1 ? values[0] === 'true' : undefined;
}

export function buildEsimApiFilters(params: EsimFilterParams): Record<string, unknown> {
  const filters: Record<string, unknown> = {};

  if (params.name) filters.search = params.name;
  if (params.planName) filters.planName = params.planName;
  if (params.packageType?.length) filters.planType = params.packageType;

  // The backend takes ONE status; picking several is the same as picking none.
  if (params.status?.length === 1) filters.status = params.status[0];
  // Without an explicit status the list hides refunded eSIMs, which is wrong for
  // an admin screen — #019 made refunded a state they have to be able to see.
  filters.includeAll = true;

  if (params.provider?.length) filters.provider = params.provider;

  const hasCallSms = boolOf(params.hasCallSms);
  if (hasCallSms !== undefined) filters.hasCallSms = hasCallSms;

  const topUp = boolOf(params.topUp);
  if (topUp !== undefined) filters.topUp = topUp;

  if (params.createdFrom) filters.createdFrom = params.createdFrom;
  if (params.createdTo) filters.createdTo = params.createdTo;
  if (params.expiresFrom) filters.expiresFrom = params.expiresFrom;
  if (params.expiresTo) filters.expiresTo = params.expiresTo;

  return filters;
}
