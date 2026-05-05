export type FileRelation = string | { id?: string; url?: string; path?: string } | null;

export type TopBar = {
  id: string;
  icon?: FileRelation;
  title: string;
  buttonContent: string;
  language: string;
  url: string;
  createdAt: string;
  updatedAt: string;
};

export type TopBarFilters = { page?: number; limit?: number; filters?: string; sort?: string };
export type TopBarResponse = { data: TopBar[]; hasNextPage: boolean };

export type CreateTopBarPayload = {
  icon?: string;
  title: string;
  buttonContent: string;
  language: string;
  url: string;
};

export type UpdateTopBarPayload = Partial<CreateTopBarPayload>;
