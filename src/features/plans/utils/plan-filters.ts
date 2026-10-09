/**
 * URL params → the `filters` object the plans API takes.
 *
 * One implementation on purpose: the server component prefetches the query and
 * the client component reads it back, so if the two built the filter object
 * differently the query keys would not match and the prefetch would be thrown
 * away on every load. They had already drifted once (#010).
 */
export type PlanFilterParams = {
  name?: string | null;
  provider?: string[] | null;
  isCheapest?: string[] | null;
  isActive?: string[] | null;
  type?: string[] | null;
  tags?: string[] | null;
  duration?: string | null;
  data?: string | null;
  /** `d:<id>` / `r:<id>` from the destination / region select box. */
  country?: string[] | null;
  hasCallSms?: string[] | null;
  apn?: string[] | null;
  isNonHkIp?: string[] | null;
  topUp?: string[] | null;
};

/** A Có/Không select only means something when exactly one side is picked. */
function boolOf(values: string[] | null | undefined): boolean | undefined {
  return values && values.length === 1 ? values[0] === 'true' : undefined;
}

export function buildPlanApiFilters(params: PlanFilterParams): Record<string, unknown> {
  const filters: Record<string, unknown> = {};

  if (params.name) filters.search = params.name;
  if (params.provider?.length) filters.provider = params.provider;

  const isCheapest = boolOf(params.isCheapest);
  if (isCheapest !== undefined) filters.isCheapest = isCheapest;

  const isActive = boolOf(params.isActive);
  if (isActive !== undefined) filters.isActive = isActive;

  if (params.type?.length) {
    filters.type = params.type.length === 1 ? params.type[0] : params.type;
  }
  if (params.tags?.length) filters.tags = params.tags;

  if (params.duration) {
    const duration = Number(params.duration);
    if (!Number.isNaN(duration)) filters.duration = duration;
  }
  if (params.data) filters.data = params.data;

  // Exact destination or region id. A substring match could not tell "Trung
  // Quốc" from "Trung Quốc + Hong Kong"; more than one pick cannot be expressed
  // as a single id, so only a single selection is sent (#010).
  if (params.country?.length === 1) {
    const [kind, rawId] = params.country[0].split(':');
    const id = Number(rawId);
    if (Number.isInteger(id) && id > 0) {
      if (kind === 'r') filters.regionId = id;
      else if (kind === 'd') filters.destinationId = id;
    }
  }

  const hasCallSms = boolOf(params.hasCallSms);
  if (hasCallSms !== undefined) filters.hasCallSms = hasCallSms;

  // Every APN picked, not only a single one: two or more used to drop the
  // filter altogether (#018, test round 4).
  if (params.apn?.length) filters.apn = params.apn.length === 1 ? params.apn[0] : params.apn;

  const isNonHkIp = boolOf(params.isNonHkIp);
  if (isNonHkIp !== undefined) filters.isNonHkIp = isNonHkIp;

  const topUp = boolOf(params.topUp);
  if (topUp !== undefined) filters.topUp = topUp;

  return filters;
}
