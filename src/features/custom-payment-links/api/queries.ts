import { queryOptions } from '@tanstack/react-query';
import { getCustomPaymentLinks } from './service';
import type { CustomPaymentLinkFilters } from './types';

export const customPaymentLinkKeys = {
  all: ['custom-payment-links'] as const,
  list: (filters: CustomPaymentLinkFilters) =>
    [...customPaymentLinkKeys.all, 'list', filters] as const,
  detail: (id: string) => [...customPaymentLinkKeys.all, 'detail', id] as const
};

/**
 * The saved history of payment orders (#084). The page used to list only what
 * the current browser tab had created, so a refresh lost the lot and the
 * payment status was whatever it had been at creation time.
 */
export const customPaymentLinksQueryOptions = (filters: CustomPaymentLinkFilters) =>
  queryOptions({
    queryKey: customPaymentLinkKeys.list(filters),
    queryFn: () => getCustomPaymentLinks(filters),
    // The status changes on the payment provider's side, not ours.
    refetchOnWindowFocus: true
  });
