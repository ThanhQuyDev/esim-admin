export type HeroBanner = {
  id: string;
  title: string;
  firstIcon: string;
  firstContent: string;
  secondIcon: string;
  secondContent: string;
  description: string;
  language: string;
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
  active: boolean;
};

export type UpdateHeroBannerPayload = Partial<CreateHeroBannerPayload>;
