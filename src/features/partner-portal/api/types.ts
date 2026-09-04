export type PartnerType = 'distribution' | 'kol';
export type PartnerLegalType = 'individual' | 'company';
export type PartnerStatus = 'pending' | 'active' | 'hold' | 'disabled' | 'rejected';

export type MyPartner = {
  id: number;
  userId: number;
  partnerType: PartnerType;
  legalType: PartnerLegalType;
  companyName: string | null;
  taxCode: string | null;
  businessAddress: string | null;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  channelInfo: Record<string, unknown> | null;
  status: PartnerStatus;
  tierCode: string | null;
  rejectionReason: string | null;
  notes: string | null;
  createdAt: string;
};

export type UpdateMyProfilePayload = {
  contactName?: string;
  contactPhone?: string;
  companyName?: string;
  taxCode?: string;
  businessAddress?: string;
  channelInfo?: Record<string, unknown>;
};

export type MyWalletSummary = {
  balanceVnd: number;
  availableBalanceVnd: number;
  pendingPayoutVnd: number;
  status: 'active' | 'locked';
};

export type MyWalletTransaction = {
  id: number;
  type: string;
  amountVnd: number;
  balanceAfterVnd: number;
  orderId: number | null;
  reason: string | null;
  createdAt: string;
};

export type MyDepositRequest = {
  id: number;
  amountVnd: number;
  bankTransferCode: string;
  qrUrl?: string;
  accountNumber?: string;
  accountName?: string;
  bankCode?: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: string;
};

export type CreateDepositRequestPayload = { amountVnd: number };

export type MyLink = {
  id: number;
  code: string;
  label: string;
  targetPath: string | null;
  status: 'active' | 'inactive';
  clickCount: number;
  conversionCount: number;
  totalCommissionVnd: number;
  createdAt: string;
};

export type CreateLinkPayload = { label: string; targetPath?: string };
export type UpdateLinkPayload = { label?: string; targetPath?: string; isActive?: boolean };

export type MyCommission = {
  id: number;
  orderId: number;
  linkId: number | null;
  commissionVnd: number;
  tierSnapshot: string | null;
  status: 'pending' | 'credited' | 'reversed';
  createdAt: string;
};

export type MyPayout = {
  id: number;
  amountVnd: number;
  bankAccountInfo: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  createdAt: string;
};

export type CreatePayoutPayload = { amountVnd: number; bankAccountInfo?: string };

export type PartnerApplyPayload = {
  partnerType: PartnerType;
  legalType: PartnerLegalType;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  password: string;
  companyName?: string;
  taxCode?: string;
  businessAddress?: string;
  channelInfo?: Record<string, unknown>;
  notes?: string;
};
