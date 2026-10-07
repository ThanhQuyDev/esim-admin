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

/** One option in the list filter's author select box (#046). */
export type BlogAuthorOption = { slug: string; name: string };

export type BlogAuthor = {
  id: number;
  userId: number;
  name: string;
  slug: string;
  avatar?: string | null;
  description?: string | null;
};

/** An author the admin can credit a post to (#011). */
export type BlogAuthorProfile = BlogAuthor;

export type Blog = {
  id: string;
  language: string;
  publishedAt: string | null;
  isPublished: boolean;
  author: string;
  authorAvatar?: string | null;
  authorSlug?: string | null;
  authorBio?: string | null;
  authorProfile?: BlogAuthor | null;
  authorProfileId?: number | null;
  category: string;
  parent?: string | null;
  coverImage: string | null;
  excerpt: string | null;
  content: string;
  slug: string;
  title: string;
  miniTagId?: string | null;
  miniTag?: BlogMiniTag | null;
  planIds?: number[];
  /**
   * Related plans by a provider-sourced reference — a plan slug or the supplier's
   * package code (#047). Durable across a catalogue re-import, unlike `planIds`.
   */
  planCodes?: string[];
  plans?: BlogPlan[];
  timeRead: number | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords?: string | null;
  faqEnabled?: boolean;
  faqIds?: string[];
  faqs?: Faq[];
  isPopular?: boolean;
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
  author?: string;
  /** Only an admin's choice is honoured; an author is always credited themselves (#011). */
  authorProfileId?: number;
  publishedAt?: string | null;
  isPublished?: boolean;
  category?: string;
  parent?: string;
  coverImage?: string | null;
  excerpt?: string | null;
  content: string;
  slug?: string;
  title: string;
  miniTagId?: string;
  /** @deprecated Use `planCodes` — plan ids do not survive a re-import (#047). */
  planIds?: number[];
  /** Plan slugs / supplier package codes (#047). */
  planCodes?: string[];
  timeRead?: number;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  faqEnabled?: boolean;
  faqIds?: string[];
  isPopular?: boolean;
};

export type UpdateBlogPayload = Partial<CreateBlogPayload>;
