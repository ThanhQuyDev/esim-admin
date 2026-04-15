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
  isPopular: boolean;
  isActive: boolean;
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
};

export type CreateRegionPayload = {
  name: string;
  slug?: string;
  avatarUrl?: string | null;
  isPopular?: boolean;
  isActive?: boolean;
};

export type UpdateRegionPayload = {
  name?: string;
  slug?: string;
  parentId?: number | null;
  avatarUrl?: string | null;
  isPopular?: boolean;
  isActive?: boolean;
};
