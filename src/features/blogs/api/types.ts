export type Blog = {
  id: number;
  language: string;
  publishedAt: string | null;
  isPublished: boolean;
  author: string;
  tags: string;
  coverImage: string | null;
  excerpt: string | null;
  content: string;
  slug: string;
  title: string;
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
  tags?: string;
  coverImage?: string | null;
  excerpt?: string | null;
  content: string;
  slug?: string;
  title: string;
};

export type UpdateBlogPayload = Partial<CreateBlogPayload>;
