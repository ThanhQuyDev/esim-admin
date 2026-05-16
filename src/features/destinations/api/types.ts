export type Destination = {
  id: number;
  name: string;
  slug: string;
  countryCode: string;
  parentId: number | null;
  flagUrl: string | null;
  avatarUrl: string | null;
  keySearch: string | null;
  isPopular: boolean;
  isActive: boolean;
  description: string | null;
  descriptionVi: string | null;
  providers: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type DestinationFilters = {
  page?: number;
  limit?: number;
  filters?: string;
  sort?: string;
};

export type DestinationsResponse = {
  data: Destination[];
  hasNextPage: boolean;
  totalCount: number;
};

export type CreateDestinationPayload = {
  name: string;
  countryCode: string;
  slug?: string;
  parentId?: number | null;
  flagUrl?: string | null;
  avatarUrl?: string | null;
  keySearch?: string | null;
  isPopular?: boolean;
  isActive?: boolean;
  description?: string | null;
  descriptionVi?: string | null;
  providers?: string | null;
};

export type UpdateDestinationPayload = {
  name?: string;
  countryCode?: string;
  slug?: string;
  parentId?: number | null;
  flagUrl?: string | null;
  avatarUrl?: string | null;
  keySearch?: string | null;
  isPopular?: boolean;
  isActive?: boolean;
  description?: string | null;
  descriptionVi?: string | null;
  providers?: string | null;
};
