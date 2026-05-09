// ============================================================
// Wallet Admin Types — Type contract for admin wallet management
// ============================================================

export type WalletStatus = 'active' | 'locked';

export type WalletUser = {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
};

export type WalletListItem = {
  id: number;
  userId: number;
  user: WalletUser;
  balanceVnd: number;
  status: WalletStatus;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type WalletListResponse = WalletListItem[];

export type WalletMeResponse = {
  balanceVnd: number;
  availableBalanceVnd: number;
  status: WalletStatus;
  expiresAt: string | null;
  daysLeft: number | null;
};

export type WalletTransactionType = 'manual_credit' | 'manual_debit' | 'manual_cancel';

export type WalletTransactionResponse = {
  id: number;
  walletId: number;
  userId: number;
  type: WalletTransactionType;
  amountVnd: number;
  balanceAfterVnd: number;
  reason: string | null;
  createdByAdminId: number;
  createdAt: string;
};

export type ManualWalletAdjustRequest = {
  amountVnd: number;
  reason?: string;
};

export type CancelWalletRequest = {
  reason?: string;
};

export type UpdateWalletStatusRequest = {
  status: WalletStatus;
};

export type WalletFilters = {
  page?: number;
  limit?: number;
  email?: string;
  filters?: string;
  sort?: string;
};

export type WalletsResponse = {
  data: WalletListItem[];
  hasNextPage: boolean;
};
