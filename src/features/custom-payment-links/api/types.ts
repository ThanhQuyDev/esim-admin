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
  createdAt: string;
  updatedAt: string;
};

export type CreateCustomPaymentLinkPayload = {
  customer_email: string;
  amount: number;
  currency?: 'VND';
  description: string;
};
