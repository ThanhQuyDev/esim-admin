/**
 * The APN lookup table that decides which eSIMs work with TikTok / ChatGPT in
 * China (#065). Maintained as a spreadsheet and uploaded, and since #044 (test
 * round 4) also editable row by row and topped up from the suppliers' plans.
 *
 * Every app is stored per device. The sheet gives ChatGPT, Gemini and Claude one
 * column each, which the import writes to both devices.
 */
export type ApnSupport = {
  id: string;
  apn: string;
  apnLabel: string;
  tiktokIos: boolean;
  tiktokAndroid: boolean;
  chatGptIos: boolean;
  chatGptAndroid: boolean;
  geminiIos: boolean;
  geminiAndroid: boolean;
  claudeIos: boolean;
  claudeAndroid: boolean;
  note?: string | null;
  /**
   * Added automatically from a supplier's plans and not filled in yet: its app
   * columns mean "chưa có thông tin", not "không hỗ trợ" (#044).
   */
  needsReview?: boolean;
  createdAt: string;
  updatedAt: string;
};

/** The yes/no fields an admin can set on a row. */
export const APN_APP_FIELDS = [
  'tiktokIos',
  'tiktokAndroid',
  'chatGptIos',
  'chatGptAndroid',
  'geminiIos',
  'geminiAndroid',
  'claudeIos',
  'claudeAndroid'
] as const;
export type ApnAppField = (typeof APN_APP_FIELDS)[number];

export type SaveApnSupportPayload = {
  apnLabel: string;
  note?: string | null;
} & Partial<Record<ApnAppField, boolean>>;

export type ApnSupportFilters = {
  page?: number;
  limit?: number;
  /** APNs picked in the select box, comma-separated. */
  apns?: string;
  /** Platforms that must be supported, comma-separated (tiktokIos, chatGpt…). */
  supports?: string;
  needsReview?: boolean;
};

export type ApnSupportResponse = {
  data: ApnSupport[];
  hasNextPage: boolean;
  totalCount: number;
};

export type ImportApnResponse = {
  total: number;
  /** APNs used by plans but missing from the sheet, re-added for review. */
  addedFromPlans?: number;
  duplicates: string[];
  errors: Array<{ row: number; error: string }>;
};
