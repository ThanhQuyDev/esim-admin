/**
 * Site-wide third-party snippets (#075).
 *
 * Before this, a script could only be attached to one page at a time through its
 * SEO record — unusable for analytics, which has to be on every page.
 */
export type SiteScriptPlacement = 'head' | 'bodyEnd';

export type SiteScript = {
  id: string;
  name: string;
  content: string;
  placement: SiteScriptPlacement | string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type SiteScriptFilters = {
  page?: number;
  limit?: number;
  filters?: string;
  sort?: string;
};

export type SiteScriptResponse = {
  data: SiteScript[];
  hasNextPage: boolean;
  totalCount: number;
};

export type CreateSiteScriptPayload = {
  name: string;
  content: string;
  placement?: string;
  isActive?: boolean;
  sortOrder?: number;
};

export type UpdateSiteScriptPayload = Partial<CreateSiteScriptPayload>;
