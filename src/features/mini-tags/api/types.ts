export type MiniTag = {
  id: number;
  image: string;
  title: string;
  description: string;
  contentButton: string;
  linkUrl: string;
  createdAt: string;
  updatedAt: string;
};

export type MiniTagFilters = {
  page?: number;
  limit?: number;
  filters?: string;
  sort?: string;
};

export type MiniTagsResponse = {
  data: MiniTag[];
  hasNextPage: boolean;
};

export type CreateMiniTagPayload = {
  image: string;
  title: string;
  description: string;
  contentButton: string;
  linkUrl: string;
};

export type UpdateMiniTagPayload = Partial<CreateMiniTagPayload>;
