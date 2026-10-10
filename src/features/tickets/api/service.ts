import { apiClient } from '@/lib/api-client';
import type {
  Ticket,
  TicketFilters,
  TicketListResponse,
  TicketMessage,
  UpdateTicketStatusPayload
} from './types';

const BASE = '/tickets';

export async function getTickets(filters: TicketFilters): Promise<TicketListResponse> {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.status) params.set('status', filters.status);
  if (filters.search) params.set('search', filters.search);
  if (filters.awaitingSupport) params.set('awaitingSupport', 'true');
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

/** The conversation on a ticket (#059). */
export async function getTicketMessages(id: number): Promise<TicketMessage[]> {
  return apiClient<TicketMessage[]>(`${BASE}/${id}/messages`);
}

/**
 * Post an admin reply (#059). The backend also emails it to the customer, with
 * the ticket number in the subject.
 */
export async function replyToTicket(id: number, body: string): Promise<TicketMessage> {
  return apiClient<TicketMessage>(`${BASE}/${id}/messages`, {
    method: 'POST',
    body: JSON.stringify({ body })
  });
}

/**
 * How many tickets are waiting on support, for the sidebar badge: new ones, and
 * any (short of closed) whose last message is the customer's — a reply on a
 * resolved ticket counts again, like a new request (#041, test round 4).
 */
export async function getOpenTicketCount(): Promise<number> {
  const res = await getTickets({ awaitingSupport: true, limit: 1, page: 1 });
  if (typeof res.totalCount === 'number') return res.totalCount;
  // Fallback: only know if there is at least one
  return res.data.length > 0 || res.hasNextPage ? res.data.length : 0;
}
