/**
 * Slides in the storefront's mega-menu "Explore" carousels (#073).
 *
 * One row per card per language. Before this existed the cards were hard-coded in
 * the storefront navbar, still pointing at the reference design's CDN images.
 */
export type MenuSlide = {
  id: string;
  menuKey: string;
  title: string;
  description: string;
  href: string;
  image: string;
  imageAlt?: string | null;
  language: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type MenuSlideFilters = {
  page?: number;
  limit?: number;
  filters?: string;
  sort?: string;
  menuKey?: string;
};

export type MenuSlideResponse = {
  data: MenuSlide[];
  hasNextPage: boolean;
  totalCount: number;
};

export type CreateMenuSlidePayload = {
  menuKey: string;
  title: string;
  description: string;
  href: string;
  image: string;
  imageAlt?: string | null;
  language: string;
  sortOrder?: number;
  isActive?: boolean;
};

export type UpdateMenuSlidePayload = Partial<CreateMenuSlidePayload>;
