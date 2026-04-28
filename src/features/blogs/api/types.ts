export type Blog = {
  id: string;
  language: string;
  publishedAt: string | null;
  isPublished: boolean;
  author: string;
  category: string;
  coverImage: string | null;
  excerpt: string | null;
  content: string;
  slug: string;
  title: string;
  miniTagId: string | null;
  planIds: number[];
  timeRead: number | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type BlogFilters = {
  page?: number;
  limit?: number;
  filters?: string;
  sort?: string;
};

export type BlogsResponse = {
  data: Blog[];
  hasNextPage: boolean;
};

export type CreateBlogPayload = {
  language: string;
  publishedAt?: string | null;
  isPublished?: boolean;
  author: string;
  category?: string;
  coverImage?: string | null;
  excerpt?: string | null;
  content: string;
  slug?: string;
  title: string;
  miniTagId?: string;
  planIds?: number[];
  timeRead?: number;
};

export type UpdateBlogPayload = Partial<CreateBlogPayload>;
