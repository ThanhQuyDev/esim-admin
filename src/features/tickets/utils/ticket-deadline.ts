import type { Ticket } from '../api/types';

/**
 * "Thời hạn xử lý" (vande #070): support answers within three hours of the
 * ticket being opened or of the customer's latest message.
 *
 * The clock only runs while the ticket is waiting on support — new or in
 * progress, with the customer (or partner) having written last. Once an admin
 * has answered, or the ticket waits on the customer ("Cần bổ sung thông tin"),
 * is resolved or closed, there is nothing for support to be late on.
 */
export const TICKET_RESPONSE_HOURS = 3;

const HOUR_MS = 60 * 60 * 1000;
const WAITING_ON_SUPPORT = new Set(['open', 'in_progress']);

export type TicketDeadline =
  | { state: 'none'; reason: 'answered' | 'waiting_customer' | 'done' }
  | {
      state: 'due' | 'overdue';
      dueAt: Date;
      /** Positive: time left; negative: time late. */
      msLeft: number;
    };

type DeadlineInput = Pick<Ticket, 'status' | 'createdAt' | 'lastReplyAt' | 'lastReplyRole'>;

export function ticketDeadline(ticket: DeadlineInput, now: number = Date.now()): TicketDeadline {
  if (ticket.status === 'need_info') return { state: 'none', reason: 'waiting_customer' };
  if (!WAITING_ON_SUPPORT.has(ticket.status)) return { state: 'none', reason: 'done' };
  if (ticket.lastReplyRole === 'admin') return { state: 'none', reason: 'answered' };

  const from = new Date(ticket.lastReplyAt ?? ticket.createdAt).getTime();
  if (Number.isNaN(from)) return { state: 'none', reason: 'done' };
  const dueAt = new Date(from + TICKET_RESPONSE_HOURS * HOUR_MS);
  const msLeft = dueAt.getTime() - now;
  return { state: msLeft < 0 ? 'overdue' : 'due', dueAt, msLeft };
}

/** "1 ngày 17 giờ", "2 giờ 5 phút", "12 phút" — the two largest units that matter. */
export function formatSpan(ms: number): string {
  const totalMinutes = Math.max(1, Math.floor(Math.abs(ms) / 60_000));
  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return hours > 0 ? `${days} ngày ${hours} giờ` : `${days} ngày`;
  if (hours > 0) return minutes > 0 ? `${hours} giờ ${minutes} phút` : `${hours} giờ`;
  return `${minutes} phút`;
}
