export type CustomPaymentLinkStatus = 'PENDING' | 'PAID' | 'FAILED';

export type CustomPaymentLinkCreatedBy = {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
};

export type CustomPaymentLink = {
  id: string;
  virtualOrderId: string;
  customerEmail: string;
  amount: number;
  currency: 'VND';
  description: string;
  paymentUrl: string;
  status: CustomPaymentLinkStatus;
  paymentId: string | null;
  createdById: number;
  createdBy?: CustomPaymentLinkCreatedBy;
  /** When an admin confirmed the outcome by hand (#056). */
  confirmedAt?: string | null;
  confirmedByAdminId?: number | null;
  /**
   * When the sweep gave up on it after OnePay's 30-minute window (#056). Set
   * only for an auto-expiry, so the list can say WHY a link failed.
   */
  expiredAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateCustomPaymentLinkPayload = {
  customer_email: string;
  amount: number;
  currency?: 'VND';
  description: string;
};

/** Query for the saved history of payment orders (#084). */
export type CustomPaymentLinkFilters = {
  page?: number;
  limit?: number;
  status?: CustomPaymentLinkStatus;
  /** Matches customer email, description or order number. */
  search?: string;
};

export type CustomPaymentLinksResponse = {
  data: CustomPaymentLink[];
  hasNextPage: boolean;
  /** Total rows behind the current filter, when the API reports one. */
  totalCount?: number;
};
