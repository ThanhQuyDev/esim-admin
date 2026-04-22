import type { Destination } from '@/features/destinations/api/types';

export type Plan = {
  id: number;
  provider: string;
  providerPlanId: string;
  name: string;
  slug: string;
  countryCode: string;
  destinationId: number | null;
  destination: Destination | null;
  regionId: number | null;
  durationDays: number;
  dataGb: string;
  sms: number | null;
  call: number | null;
  costPrice: string;
  price: string;
  retailPrice: string;
  currency: string;
  type: string;
  topUp: boolean;
  discount: number | null;
  isCheapest: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type PlanFilters = {
  page?: number;
  limit?: number;
  filters?: string;
  sort?: string;
};

export type PlansResponse = {
  data: Plan[];
  hasNextPage: boolean;
};

export type CreatePlanPayload = {
  provider?: string;
  providerPlanId?: string;
  name: string;
  slug?: string;
  countryCode?: string;
  destinationId?: number | null;
  regionId?: number | null;
  durationDays?: number;
  dataGb?: string;
  sms?: number | null;
  call?: number | null;
  costPrice?: string;
  price?: string;
  retailPrice?: string;
  currency?: string;
  type?: string;
  topUp?: boolean;
  isActive?: boolean;
};

export type UpdatePlanPayload = Partial<CreatePlanPayload>;

export type PlanColumnMapping = {
  providerPlanId?: string;
  name?: string;
  durationDays?: string;
  dataGb?: string;
  costPrice?: string;
  price?: string;
  retailPrice?: string;
  currency?: string;
  countryCode?: string;
  slug?: string;
  sms?: string;
  call?: string;
  type?: string;
};

export type ImportPlansExcelPayload = {
  file: File;
  provider: string;
  columnMapping: PlanColumnMapping;
  sheet?: string;
};

export type ImportPlansExcelResponse = {
  message: string;
  imported: number;
  errors?: string[];
};

export type BatchDiscountPayload = {
  ids: number[];
  discount: number;
};
