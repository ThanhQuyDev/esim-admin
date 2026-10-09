export type Esim = {
  id: number;
  orderItemId: number;
  userId: number;
  planId: number;
  iccid: string;
  smdpAddress: string;
  activationCode: string;
  lpa: string;
  matchId: string;
  qrcode: string;
  directAppleInstallationUrl: string;
  apnValue: string;
  isRoaming: boolean;
  status: string;
  /**
   * What the list shows and filters by — sold / active / expired… worked out by
   * the API from activation and expiry (#024, test round 4).
   */
  lifecycleStatus?: string;
  dataUsed: string;
  dataTotal: string;
  expiresAt: string | null;
  activatedAt: string | null;
  esimTranNo: string;
  provider: string;
  phoneNumber: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  plan: EsimPlan | null;
  /**
   * Paid topups against this eSIM's ICCID, derived server-side from the orders
   * (#025). 0 means it has never been topped up.
   */
  topupCount?: number;
  lastTopupAt?: string | null;
};

export type EsimUser = {
  id: number;
  email: string;
  provider: string;
  socialId: string;
  firstName: string;
  lastName: string;
  photo: { id: string; path: string } | null;
  role: { id: number; name: string };
  status: { id: number; name: string };
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type EsimDestination = {
  id: number;
  name: string;
  slug: string;
  countryCode: string;
  flagUrl: string | null;
  avatarUrl: string | null;
};

export type EsimPlan = {
  id: number;
  provider: string;
  providerPlanId: string;
  name: string;
  slug: string;
  countryCode: string;
  destination: EsimDestination | null;
  durationDays: number;
  dataMb: number;
  /** Call minutes / SMS included; both null on a data-only plan (#008). */
  call: number | null;
  sms: number | null;
  /** Domestic eSIM: never expires ("Vô thời hạn", #024). */
  isDomesticEsim?: boolean;
  isLocalInventory?: boolean;
  costPrice: number;
  price: number;
  retailPrice: number;
  currency: string;
  type: string;
  topUp: boolean;
  speed: string;
  operatorName: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

/** One topup applied to an eSIM, from the snapshot its order stored (#026). */
export type EsimTopup = {
  orderId: number;
  orderNumber: string;
  packageId: string | null;
  packageName: string | null;
  dataText: string | null;
  durationDays: number | null;
  isUnlimited: boolean;
  vndPrice: number;
  vndCostPrice: number;
  provider: string | null;
  createdAt: string;
};

export type EsimDetail = Esim & {
  user: EsimUser | null;
  plan: EsimPlan | null;
  /** Newest first. Only the detail endpoint returns this (#026). */
  topups?: EsimTopup[];
};

export type EsimFilters = {
  page?: number;
  limit?: number;
  filters?: string;
  sort?: string;
};

export type EsimsResponse = {
  data: Esim[];
  hasNextPage: boolean;
  totalCount: number;
};

export type EsimType = 'daily' | 'unlimited' | 'unlimited-reduce' | 'fixed';

export type CreateEsimPayload = {
  iccid: string;
  smdpAddress?: string;
  activationCode?: string;
  lpa?: string;
  matchId?: string;
  qrcode?: string;
  directAppleInstallationUrl?: string;
  apnValue?: string;
  isRoaming?: boolean;
  status?: string;
  provider?: string;
  phoneNumber?: string;
  planId?: number;
  userId?: number;
  dataTotal?: string;
  expiresAt?: string | null;
};

export type UpdateEsimPayload = Partial<CreateEsimPayload>;

/**
 * Hai loại eSIM của nhà mạng trong nước, nhập bằng hai nút riêng (#esim-noi-dia):
 *
 * - `domestic` — eSIM nội địa, SIM data dùng trong nước, có tab riêng ở trang
 *   chủ cạnh Quốc gia / Khu vực.
 * - `travel`   — eSIM du lịch do nhà mạng Việt Nam bán (Viettel), nằm trong
 *   Quốc gia → Việt Nam cùng các gói du lịch khác.
 */
export type EsimKind = 'domestic' | 'travel';

export type ImportEsimsExcelPayload = {
  file: File;
  /** Local carrier for every row, e.g. "Viettel". Overrides the file's Carrier column. */
  provider: string;
  esimKind: EsimKind;
};

export type ImportEsimsExcelError =
  | string
  | {
      row?: number;
      iccid?: string;
      error?: string;
      message?: string;
    };

export type ImportEsimsExcelResponse = {
  total: number;
  created: number;
  skipped: number;
  planCreated: number;
  /** Existing plans whose prices were refreshed from the uploaded file. */
  planUpdated: number;
  errors: ImportEsimsExcelError[];
  message?: string;
};
