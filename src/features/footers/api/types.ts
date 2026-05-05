export type Footer = {
  id: string;
  title: string;
  titleVi: string;
  url: string;
  categories?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type FooterFilters = { page?: number; limit?: number; filters?: string; sort?: string };
export type FooterResponse = { data: Footer[]; hasNextPage: boolean };

export type CreateFooterPayload = {
  title: string;
  titleVi: string;
  url: string;
  categories?: string | null;
};

export type UpdateFooterPayload = Partial<CreateFooterPayload>;
