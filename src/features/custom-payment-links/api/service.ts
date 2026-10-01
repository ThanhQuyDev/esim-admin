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

/**
 * An admin's verdict on a pending link (#056).
 *
 * The outcome used to arrive only through OnePay's IPN, so a customer who paid on
 * a device that never came back — or never paid at all — left the link in "Chờ
 * thanh toán" indefinitely.
 */
export async function confirmCustomPaymentLink(
  id: string,
  isPaid: boolean
): Promise<CustomPaymentLink> {
  return apiClient<CustomPaymentLink>(`/custom-payment-links/${encodeURIComponent(id)}/confirm`, {
    method: 'PATCH',
    body: JSON.stringify({ isPaid })
  });
}
