export type SeoConfig = {
  id: number;
  url: string;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  ogImage: string;
  ogTitle: string;
  ogDescription: string;
  destinationId: number | null;
  regionId: number | null;
  planId: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type SeoConfigFilters = {
  page?: number;
  limit?: number;
  filters?: string;
  sort?: string;
};

export type SeoConfigsResponse = {
  data: SeoConfig[];
  hasNextPage: boolean;
};

export type CreateSeoConfigPayload = {
  url: string;
  metaTitle: string;
  metaDescription?: string;
  metaKeywords?: string;
  ogImage?: string;
  ogTitle?: string;
  ogDescription?: string;
  destinationId?: number | null;
  regionId?: number | null;
  planId?: number | null;
  isActive?: boolean;
};

export type UpdateSeoConfigPayload = Partial<CreateSeoConfigPayload>;
