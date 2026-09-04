export type PartnerType = 'distribution' | 'kol';
export type PartnerLegalType = 'individual' | 'company';
export type PartnerStatus = 'pending' | 'active' | 'hold' | 'disabled' | 'rejected';

export type PartnerUser = {
  id: number;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
};

export type Partner = {
  id: number;
  userId: number;
  user?: PartnerUser;
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
  assignedManagerId: number | null;
  approvedAt: string | null;
  approvedByAdminId: number | null;
  rejectionReason: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PartnerListResponse = {
  data: Partner[];
  totalCount: number;
  hasNextPage: boolean;
};

export type PartnerFilters = {
  page?: number;
  limit?: number;
  partnerType?: PartnerType;
  status?: PartnerStatus;
  search?: string;
};

export type PartnerWalletTransaction = {
  id: number;
  walletId: number;
  partnerId: number;
  type: string;
  amountVnd: number;
  balanceAfterVnd: number;
  orderId: number | null;
  reason: string | null;
  createdAt: string;
};

export type PartnerDepositRequest = {
  id: number;
  partnerId: number;
  amountVnd: number;
  bankTransferCode: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  confirmedByAdminId: number | null;
  confirmedAt: string | null;
  createdAt: string;
};

export type OrderPartnerCommission = {
  id: number;
  orderId: number;
  partnerId: number;
  linkId: number | null;
  commissionVnd: number;
  tierSnapshot: string | null;
  status: 'pending' | 'credited' | 'reversed';
  createdAt: string;
};

export type PartnerPayout = {
  id: number;
  partnerId: number;
  amountVnd: number;
  bankAccountInfo: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  adminNote: string | null;
  processedAt: string | null;
  createdAt: string;
};

export type PartnerTier = {
  id: number;
  partnerType: PartnerType;
  tierCode: string;
  tierName: string;
  minVolumeVnd: number;
  commissionPercent: number;
  maxDiscountPercent: number;
  sortOrder: number;
  isActive: boolean;
};

export type RejectPartnerPayload = { reason: string };
export type UpdatePartnerStatusPayload = { status: PartnerStatus };
export type AssignTierPayload = { tierCode: string };
export type AdjustWalletPayload = { amountVnd: number; reason?: string };
export type ProcessPayoutPayload = { adminNote?: string };
export type CreateTierPayload = {
  partnerType: PartnerType;
  tierCode: string;
  tierName: string;
  minVolumeVnd?: number;
  commissionPercent?: number;
  maxDiscountPercent?: number;
  sortOrder?: number;
  isActive?: boolean;
};
export type UpdateTierPayload = Partial<Omit<CreateTierPayload, 'partnerType' | 'tierCode'>>;
