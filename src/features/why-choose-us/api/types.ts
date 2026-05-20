export type WhyChooseUsType = 'trang_chu' | 'quoc_gia' | 'khu_vuc';

export type WhyChooseUs = {
  id: number;
  language: string;
  isActive: boolean;
  sortOrder: number;
  icon: string;
  description: string;
  title: string;
  /** Comma-separated list of types, e.g. "trang_chu,quoc_gia" */
  type?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type WhyChooseUsFilters = {
  page?: number;
  limit?: number;
  search?: string;
  filters?: string;
  sort?: string;
};
export type WhyChooseUsResponse = { data: WhyChooseUs[]; hasNextPage: boolean; totalCount: number };
export type CreateWhyChooseUsPayload = {
  language: string;
  isActive?: boolean;
  sortOrder?: number;
  icon?: string;
  description: string;
  title: string;
  /** Comma-separated list of types, e.g. "trang_chu,quoc_gia". Empty/undefined when no type selected. */
  type?: string;
};
export type UpdateWhyChooseUsPayload = Partial<CreateWhyChooseUsPayload>;
