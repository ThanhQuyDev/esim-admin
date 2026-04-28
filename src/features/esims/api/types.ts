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

export type EsimDetail = Esim & {
  user: EsimUser | null;
  plan: EsimPlan | null;
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
};

export type EsimType = 'daily' | 'unlimited' | 'unlimited-reduce' | 'fixed';

export type ImportEsimsExcelPayload = {
  file: File;
  provider: string;
  countryCode: string;
  type: EsimType;
};

export type ImportEsimsExcelResponse = {
  message: string;
  imported?: number;
  errors?: string[];
};
