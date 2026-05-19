export const customPaymentLinkKeys = {
  all: ['custom-payment-links'] as const,
  list: () => [...customPaymentLinkKeys.all, 'list'] as const,
  detail: (id: string) => [...customPaymentLinkKeys.all, 'detail', id] as const
};
