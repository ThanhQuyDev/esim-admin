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
  slugVi: string | null;
  destinationCount: number;
  destinations: Destination[];
  avatarUrl: string | null;
  iconUrl: string | null;
  isPopular: boolean;
  /** Place among the five on the home page on a phone (vande-1411 #021). */
  mobileHomeRank?: number | null;
  isActive: boolean;
  /** eSIMs sold for it, all plans together (doitac-1410 #077). */
  soldCount?: number;
  title: string | null;
  titleVi: string | null;
  description: string | null;
  descriptionVi: string | null;
  /** Note at the top of its website page, HTML (doitac-1410 #078). */
  notice?: string | null;
  noticeVi?: string | null;
  providers: string | null;
  /** "Khu vực cha" (vande #035): listed as another pack on that region's page. */
  parentId?: number | null;
  /** Ticked "Làm khu vực cha" (vande-0411 #073). */
  isParent?: boolean;
  /** The parent's name, when a plan list asks for its region (vande-0411 #042). */
  parentName?: string | null;
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
  slugVi?: string | null;
  avatarUrl?: string | null;
  iconUrl?: string | null;
  isPopular?: boolean;
  mobileHomeRank?: number | null;
  isActive?: boolean;
  title?: string | null;
  titleVi?: string | null;
  description?: string | null;
  descriptionVi?: string | null;
  notice?: string | null;
  noticeVi?: string | null;
  providers?: string | null;
  parentId?: number | null;
  isParent?: boolean;
  destinationIds?: number[];
};

export type UpdateRegionPayload = {
  name?: string;
  slug?: string;
  slugVi?: string | null;
  parentId?: number | null;
  isParent?: boolean;
  avatarUrl?: string | null;
  iconUrl?: string | null;
  isPopular?: boolean;
  mobileHomeRank?: number | null;
  isActive?: boolean;
  title?: string | null;
  titleVi?: string | null;
  description?: string | null;
  descriptionVi?: string | null;
  notice?: string | null;
  noticeVi?: string | null;
  providers?: string | null;
  destinationIds?: number[];
};
