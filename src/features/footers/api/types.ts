export type Footer = {
  id: string;
  title: string;
  titleVi: string;
  url: string;
  language: string;
  sortOrder: number;
  /** Column heading, default/English — also the grouping key (#088). */
  categories?: string | null;
  /** Column heading in Vietnamese; falls back to categories. */
  categoriesVi?: string | null;
  iconUrl?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type FooterFilters = {
  page?: number;
  limit?: number;
  search?: string;
  filters?: string;
  sort?: string;
};
export type FooterResponse = { data: Footer[]; hasNextPage: boolean; totalCount: number };

export type CreateFooterPayload = {
  title: string;
  titleVi: string;
  url: string;
  language: string;
  sortOrder?: number;
  /** Column heading, default/English — also the grouping key (#088). */
  categories?: string | null;
  /** Column heading in Vietnamese; falls back to categories. */
  categoriesVi?: string | null;
  iconUrl?: string | null;
};

export type UpdateFooterPayload = Partial<CreateFooterPayload>;
