export type ProfitMarginTier = {
  id: number;
  minVnd: number;
  maxVnd: number;
  percentage: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ProfitMarginTierFilters = {
  page?: number;
  limit?: number;
  filters?: string;
  sort?: string;
};

export type ProfitMarginTierResponse = {
  data: ProfitMarginTier[];
  hasNextPage: boolean;
  totalCount: number;
};

export type CreateProfitMarginTierPayload = {
  minVnd: number;
  maxVnd: number;
  percentage: number;
  isActive: boolean;
};

export type UpdateProfitMarginTierPayload = Partial<CreateProfitMarginTierPayload>;
