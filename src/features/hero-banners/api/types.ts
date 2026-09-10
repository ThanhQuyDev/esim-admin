export type HeroBanner = {
  id: string;
  title: string;
  firstIcon: string;
  firstContent: string;
  secondIcon: string;
  secondContent: string;
  description: string;
  language: string;
  /** Hero picture; empty keeps the built-in one (#089). */
  image?: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type HeroBannerFilters = {
  page?: number;
  limit?: number;
  search?: string;
  filters?: string;
  sort?: string;
};
export type HeroBannerResponse = { data: HeroBanner[]; hasNextPage: boolean; totalCount: number };

export type CreateHeroBannerPayload = {
  title: string;
  firstIcon: string;
  firstContent: string;
  secondIcon: string;
  secondContent: string;
  description: string;
  language: string;
  /** Hero picture; empty keeps the built-in one (#089). */
  image?: string | null;
  active: boolean;
};

export type UpdateHeroBannerPayload = Partial<CreateHeroBannerPayload>;
