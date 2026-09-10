export type SeoConfig = {
  id: number;
  url: string;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  ogImage: string;
  ogTitle: string;
  ogDescription: string;
  structuredData: string | null;
  destinationId: number | null;
  regionId: number | null;
  planId: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

/**
 * Which kind of page a config is for, decided by whichever entity was picked
 * when it was created. Not stored as a column — derived from the three ids.
 */
export type SeoConfigPageType = 'destination' | 'region' | 'plan' | 'other';

export const SEO_PAGE_TYPE_LABELS: Record<SeoConfigPageType, string> = {
  destination: 'Quốc gia',
  region: 'Khu vực',
  plan: 'Gói cước',
  other: 'Trang khác'
};

export const SEO_PAGE_TYPE_OPTIONS = (Object.keys(SEO_PAGE_TYPE_LABELS) as SeoConfigPageType[]).map(
  (value) => ({ value, label: SEO_PAGE_TYPE_LABELS[value] })
);

/** The same rule the API filter uses, so column and filter never disagree. */
export function seoConfigPageType(
  config: Pick<SeoConfig, 'destinationId' | 'regionId' | 'planId'>
): SeoConfigPageType {
  if (config.destinationId != null) return 'destination';
  if (config.regionId != null) return 'region';
  if (config.planId != null) return 'plan';
  return 'other';
}

export type SeoConfigFilters = {
  page?: number;
  limit?: number;
  filters?: string;
  sort?: string;
};

export type SeoConfigsResponse = {
  data: SeoConfig[];
  hasNextPage: boolean;
  totalCount: number;
};

export type CreateSeoConfigPayload = {
  url: string;
  metaTitle: string;
  metaDescription?: string;
  metaKeywords?: string;
  ogImage?: string;
  ogTitle?: string;
  ogDescription?: string;
  structuredData?: string;
  destinationId?: number | null;
  regionId?: number | null;
  planId?: number | null;
  isActive?: boolean;
};

export type UpdateSeoConfigPayload = Partial<CreateSeoConfigPayload>;
