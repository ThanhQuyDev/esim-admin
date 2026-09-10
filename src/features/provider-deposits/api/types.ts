export type ProviderDepositEntryType = 'deposit' | 'adjustment' | 'reconciliation';

export const ENTRY_TYPE_OPTIONS: {
  value: ProviderDepositEntryType;
  label: string;
  hint: string;
}[] = [
  {
    value: 'deposit',
    label: 'Nạp ký quỹ',
    hint: 'Tiền chuyển vào tài khoản ký quỹ của nhà cung cấp.'
  },
  {
    value: 'adjustment',
    label: 'Điều chỉnh',
    hint: 'Phí, hoàn tiền từ nhà cung cấp, hoặc sửa số nhập sai. Nhập số âm để trừ.'
  },
  {
    value: 'reconciliation',
    label: 'Đối soát',
    hint: 'Chỉ ghi nhận số dư nhà cung cấp báo, không cộng trừ tiền ký quỹ.'
  }
];

export type ProviderDepositEntry = {
  id: number;
  provider: string;
  type: ProviderDepositEntryType;
  amountVnd: number | string;
  reportedBalanceVnd: number | string | null;
  note: string | null;
  occurredAt: string;
  createdAt: string;
  updatedAt: string;
};

export type ProviderDepositSummary = {
  provider: string;
  totalDepositedVnd: number;
  totalSpentVnd: number;
  expectedBalanceVnd: number;
  reportedBalanceVnd: number | null;
  reportedAt: string | null;
  /** reported − expected. Non-zero means the books drifted. */
  differenceVnd: number | null;
  entryCount: number;
};

export type ProviderDepositSummaryResponse = {
  data: ProviderDepositSummary[];
};

export type ProviderDepositEntriesResponse = {
  data: ProviderDepositEntry[];
  totalCount: number;
};

export type ProviderDepositEntryFilters = {
  provider?: string;
  page?: number;
  limit?: number;
};

export type CreateProviderDepositEntryPayload = {
  provider: string;
  type?: ProviderDepositEntryType;
  amountVnd?: number;
  reportedBalanceVnd?: number | null;
  note?: string | null;
  occurredAt?: string;
};

export type UpdateProviderDepositEntryPayload = Partial<
  Omit<CreateProviderDepositEntryPayload, 'provider'>
>;
