import { apiClient } from '@/lib/api-client';
import type {
  CreateCustomPaymentLinkPayload,
  CustomPaymentLink,
  CustomPaymentLinkFilters,
  CustomPaymentLinksResponse
} from './types';

export async function createCustomPaymentLink(
  data: CreateCustomPaymentLinkPayload
): Promise<CustomPaymentLink> {
  return apiClient<CustomPaymentLink>('/admin/payments/custom-link', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

/**
 * The saved history of payment orders (#084).
 *
 * The list endpoint has always existed; the CMS simply never called it and
 * kept its own in-memory copy of whatever this tab had created.
 */
export async function getCustomPaymentLinks(
  filters: CustomPaymentLinkFilters
): Promise<CustomPaymentLinksResponse> {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.status) params.set('status', filters.status);
  if (filters.search?.trim()) params.set('search', filters.search.trim());

  const query = params.toString();
  return apiClient<CustomPaymentLinksResponse>(`/custom-payment-links${query ? `?${query}` : ''}`);
}
