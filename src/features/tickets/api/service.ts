import { apiClient } from '@/lib/api-client';
import type { Ticket, TicketFilters, TicketListResponse, UpdateTicketStatusPayload } from './types';

const BASE = '/tickets';

export async function getTickets(filters: TicketFilters): Promise<TicketListResponse> {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.status) params.set('status', filters.status);
  if (filters.search) params.set('search', filters.search);
  const query = params.toString();
  return apiClient<TicketListResponse>(`${BASE}${query ? `?${query}` : ''}`);
}

export async function getTicketById(id: number): Promise<Ticket> {
  return apiClient<Ticket>(`${BASE}/${id}`);
}

export async function updateTicketStatus(
  id: number,
  data: UpdateTicketStatusPayload
): Promise<Ticket> {
  return apiClient<Ticket>(`${BASE}/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  });
}

export async function deleteTicket(id: number): Promise<void> {
  await apiClient(`${BASE}/${id}`, { method: 'DELETE' });
}

/**
 * Lightweight count of tickets with status="open".
 * Uses the list endpoint with limit=1 and reads totalCount/hasNextPage as fallback.
 */
export async function getOpenTicketCount(): Promise<number> {
  const res = await getTickets({ status: 'open', limit: 1, page: 1 });
  if (typeof res.totalCount === 'number') return res.totalCount;
  // Fallback: only know if there is at least one
  return res.data.length > 0 || res.hasNextPage ? res.data.length : 0;
}
