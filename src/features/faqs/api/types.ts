export type Faq = {
  id: number;
  language: string;
  isActive: boolean;
  sortOrder: number;
  answer: string;
  question: string;
  url: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type FaqFilters = { page?: number; limit?: number; filters?: string; sort?: string };
export type FaqsResponse = { data: Faq[]; hasNextPage: boolean; totalCount: number };
export type CreateFaqPayload = {
  language: string;
  isActive?: boolean;
  sortOrder?: number;
  answer: string;
  question: string;
  url?: string;
};
export type UpdateFaqPayload = Partial<CreateFaqPayload>;

export type FaqByContextFilters = {
  url?: string;
  blogId?: string;
  language?: string;
  limit?: number;
};
