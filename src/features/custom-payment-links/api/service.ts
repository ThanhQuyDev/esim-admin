import { apiClient } from '@/lib/api-client';
import type { CreateCustomPaymentLinkPayload, CustomPaymentLink } from './types';

export async function createCustomPaymentLink(
  data: CreateCustomPaymentLinkPayload
): Promise<CustomPaymentLink> {
  return apiClient<CustomPaymentLink>('/admin/payments/custom-link', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}
