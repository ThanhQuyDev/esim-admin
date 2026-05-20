import { Destination } from '@/features/destinations/api/types';

export type RegionChild = {
  id: number;
  name: string;
  slug: string;
  countryCode?: string;
  flagUrl?: string | null;
};

export type Region = {
  id: number;
  name: string;
  slug: string;
  destinationCount: number;
  destinations: Destination[];
  avatarUrl: string | null;
  iconUrl: string | null;
  isPopular: boolean;
  isActive: boolean;
  title: string | null;
  titleVi: string | null;
  description: string | null;
  descriptionVi: string | null;
  providers: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type RegionFilters = {
  page?: number;
  limit?: number;
  filters?: string;
  sort?: string;
};

export type RegionsResponse = {
  data: Region[];
  hasNextPage: boolean;
  totalCount: number;
};

export type CreateRegionPayload = {
  name: string;
  slug?: string;
  avatarUrl?: string | null;
  iconUrl?: string | null;
  isPopular?: boolean;
  isActive?: boolean;
  title?: string | null;
  titleVi?: string | null;
  description?: string | null;
  descriptionVi?: string | null;
  providers?: string | null;
};

export type UpdateRegionPayload = {
  name?: string;
  slug?: string;
  parentId?: number | null;
  avatarUrl?: string | null;
  iconUrl?: string | null;
  isPopular?: boolean;
  isActive?: boolean;
  title?: string | null;
  titleVi?: string | null;
  description?: string | null;
  descriptionVi?: string | null;
  providers?: string | null;
};
