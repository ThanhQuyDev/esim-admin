import type { Faq } from '@/features/faqs/api/types';

export type BlogMiniTag = {
  id: string;
  title: string;
  image?: string | null;
  description?: string | null;
  contentButton?: string | null;
  linkUrl?: string | null;
};

export type BlogPlan = { id: number; [key: string]: unknown };

export type Blog = {
  id: string;
  language: string;
  publishedAt: string | null;
  isPublished: boolean;
  author: string;
  authorAvatar?: string | null;
  category: string;
  coverImage: string | null;
  excerpt: string | null;
  content: string;
  slug: string;
  title: string;
  miniTagId?: string | null;
  miniTag?: BlogMiniTag | null;
  planIds?: number[];
  plans?: BlogPlan[];
  timeRead: number | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords?: string | null;
  faqEnabled?: boolean;
  faqIds?: string[];
  faqs?: Faq[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
};

export type BlogFilters = {
  page?: number;
  limit?: number;
  search?: string;
  filters?: string;
  sort?: string;
};

export type BlogsResponse = {
  data: Blog[];
  hasNextPage: boolean;
  totalCount: number;
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
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  faqEnabled?: boolean;
  faqIds?: string[];
};

export type UpdateBlogPayload = Partial<CreateBlogPayload>;
