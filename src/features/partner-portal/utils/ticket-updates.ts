import type { MyTicket } from '../api/types';

/** Support's moves the partner should see: a reply, or a decision on it. */
const DECIDED = new Set(['resolved', 'closed', 'need_info']);

/**
 * Whether support wrote or decided something since the partner last opened
 * the ticket (doitac-3010 #012) — shown as "Phản hồi mới" by its subject so
 * the partner knows to open it.
 */
export function hasNewUpdate(ticket: MyTicket): boolean {
  const seen = ticket.customerSeenAt ? Date.parse(ticket.customerSeenAt) : 0;
  const byAdmin = ticket.lastReplyRole === 'admin';
  if (!seen) return byAdmin;
  const replied = byAdmin && ticket.lastReplyAt ? Date.parse(ticket.lastReplyAt) > seen : false;
  const decided = DECIDED.has(ticket.status) && Date.parse(ticket.updatedAt) > seen + 1000;
  return replied || decided;
}
