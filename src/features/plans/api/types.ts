import type { Destination } from '@/features/destinations/api/types';
import type { Region } from '@/features/regions/api/types';
import type { DailyResetPolicy } from '../schemas/plan';

export type Plan = {
  id: number;
  provider: string;
  providerPlanId: string;
  name: string;
  slug: string;
  countryCode: string;
  destinationId: number | null;
  destination: Destination | null;
  regionId: number | null;
  region: Region | null;
  durationDays: number;
  dataMb: number;
  sms: number | null;
  call: number | null;
  costPrice: string;
  /** Cost incl. the supplier surcharge, in đồng (v3 #018). */
  vndCostPrice?: number | string | null;
  vndPrice: string;
  price: string;
  retailPrice: string;
  currency: string;
  type: string;
  /** Speed after the high-speed quota, or the cap of a speed-only plan ("10Mbps"). */
  fupSpeed?: string | null;
  topUp: boolean;
  apn: string | null;
  /**
   * Exit IP is local rather than routed via Hong Kong, i.e. TikTok and ChatGPT
   * work on this plan (#041). Filtered as "Tiktok & ChatGPT" in the CMS (#010).
   */
  isNonHkIp: boolean;
  /** Exit IP location from the supplier — "SG", "FR/NL/UK", "HK" (#043). */
  ipExport?: string | null;
  /**
   * TikTok / ChatGPT support as the storefront judges it — the exit IP, else the
   * APN table (#045, test round 4). `known` false = the APN is not in the table.
   */
  appSupport?: {
    tiktokIos: boolean;
    tiktokAndroid: boolean;
    tiktokAllDevices: boolean;
    chatGpt: boolean;
    known: boolean;
  };
  /**
   * "Giờ làm mới mỗi ngày" (#063) — when the daily allowance starts over. Null
   * where the supplier has not stated it, which the storefront omits rather than
   * guessing at (#071).
   */
  dailyResetPolicy: DailyResetPolicy | null;
  /** Hours east of UTC; only meaningful for a calendar-day reset. */
  dailyResetUtcOffset: number | null;
  discount: number | null;
  isCheapest: boolean;
  isActive: boolean;
  tags: string[] | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type PlanFilters = {
  page?: number;
  limit?: number;
  filters?: string;
  sort?: string;
};

export type PlansResponse = {
  data: Plan[];
  hasNextPage: boolean;
  totalCount: number;
};

export type CreatePlanPayload = {
  provider?: string;
  providerPlanId?: string;
  name: string;
  slug?: string;
  countryCode?: string;
  destinationId?: number | null;
  regionId?: number | null;
  durationDays?: number;
  dataMb?: number;
  sms?: number | null;
  call?: number | null;
  costPrice?: string;
  price?: string;
  retailPrice?: string;
  currency?: string;
  type?: string;
  topUp?: boolean;
  isActive?: boolean;
  tags?: string[] | null;
  apn?: string | null;
  isNonHkIp?: boolean;
  ipExport?: string | null;
  dailyResetPolicy?: DailyResetPolicy | null;
  dailyResetUtcOffset?: number | null;
};

export type UpdatePlanPayload = Partial<CreatePlanPayload>;

export type PlanColumnMapping = {
  providerPlanId?: string;
  name?: string;
  durationDays?: string;
  dataMb?: string;
  costPrice?: string;
  price?: string;
  retailPrice?: string;
  currency?: string;
  countryCode?: string;
  slug?: string;
  sms?: string;
  call?: string;
  type?: string;
};

export type ImportPlansExcelPayload = {
  file: File;
  provider: string;
  columnMapping: PlanColumnMapping;
  sheet?: string;
};

export type ImportGadgetKoreaExcelPayload = {
  file: File;
};

export type ImportPlansExcelResponse = {
  message: string;
  imported: number;
  errors?: string[];
};

export type ImportGadgetKoreaResponse = {
  total: number;
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
  destinationNotFound: string[];
};

export type BatchDiscountPayload = {
  ids: number[];
  discount: number;
};
