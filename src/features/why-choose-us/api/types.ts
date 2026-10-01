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
  /**
   * Page types, comma-separated (#054). Was missing from this type AND from the
   * query string, so the Trang filter was built by the table and then silently
   * dropped — an extra property on a variable is not an excess-property error, so
   * nothing complained.
   */
  type?: string;
  /** Trạng thái hoạt động; omitted shows both (#054). */
  isActive?: boolean;
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
