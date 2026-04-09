export type Faq = {
  id: number;
  language: string;
  isActive: boolean;
  sortOrder: number;
  answer: string;
  question: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type FaqFilters = { page?: number; limit?: number; filters?: string; sort?: string };
export type FaqsResponse = { data: Faq[]; hasNextPage: boolean };
export type CreateFaqPayload = {
  language: string;
  isActive?: boolean;
  sortOrder?: number;
  answer: string;
  question: string;
};
export type UpdateFaqPayload = Partial<CreateFaqPayload>;
