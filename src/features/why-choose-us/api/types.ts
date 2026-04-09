export type WhyChooseUs = {
  id: number;
  language: string;
  isActive: boolean;
  sortOrder: number;
  icon: string;
  description: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type WhyChooseUsFilters = { page?: number; limit?: number; filters?: string; sort?: string };
export type WhyChooseUsResponse = { data: WhyChooseUs[]; hasNextPage: boolean };
export type CreateWhyChooseUsPayload = {
  language: string;
  isActive?: boolean;
  sortOrder?: number;
  icon?: string;
  description: string;
  title: string;
};
export type UpdateWhyChooseUsPayload = Partial<CreateWhyChooseUsPayload>;
