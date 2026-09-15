export type MiniTag = {
  id: number;
  image: string;
  title: string;
  description: string;
  contentButton: string;
  linkUrl: string;
  /** English copy for English posts; empty falls back to the Vietnamese (#059). */
  titleEn?: string | null;
  descriptionEn?: string | null;
  contentButtonEn?: string | null;
  linkUrlEn?: string | null;
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
  totalCount: number;
};

export type CreateMiniTagPayload = {
  image: string;
  title: string;
  description: string;
  contentButton: string;
  linkUrl: string;
  titleEn?: string | null;
  descriptionEn?: string | null;
  contentButtonEn?: string | null;
  linkUrlEn?: string | null;
};

export type UpdateMiniTagPayload = Partial<CreateMiniTagPayload>;
