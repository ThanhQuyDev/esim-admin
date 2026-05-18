import type { Faq } from '@/features/faqs/api/types';

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
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string | null;
  faqEnabled: boolean;
  faqIds: number[];
  faqs: Faq[];
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
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
  faqIds?: number[];
};

export type UpdateBlogPayload = Partial<CreateBlogPayload>;
