/**
 * The APN lookup table that decides which eSIMs work with TikTok / ChatGPT in
 * China (#065). Maintained as a spreadsheet and uploaded; an upload replaces the
 * whole table.
 */
export type ApnSupport = {
  id: string;
  apn: string;
  apnLabel: string;
  tiktokIos: boolean;
  tiktokAndroid: boolean;
  chatGpt: boolean;
  note?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ApnSupportFilters = {
  page?: number;
  limit?: number;
  filters?: string;
  sort?: string;
};

export type ApnSupportResponse = {
  data: ApnSupport[];
  hasNextPage: boolean;
  totalCount: number;
};

export type ImportApnResponse = {
  total: number;
  duplicates: string[];
  errors: Array<{ row: number; error: string }>;
};
