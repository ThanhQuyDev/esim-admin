export type TicketStatus = 'open' | 'in_progress' | 'need_info' | 'resolved' | 'closed';

export const TICKET_STATUSES: TicketStatus[] = [
  'open',
  'in_progress',
  'need_info',
  'resolved',
  'closed'
];

export type Ticket = {
  id: number;
  /**
   * `HT-000123` — the reference in every support email's subject line, and what
   * the customer quotes (#059). Null only for rows predating the column.
   */
  ticketNumber: string | null;
  customerEmail: string;
  subject: string;
  description: string;
  orderId: string | null;
  deviceModel: string | null;
  iccid: string | null;
  planDestination: string | null;
  attachments: string[] | null;
  status: TicketStatus;
  /**
   * When it was marked resolved — the start of the 48-hour auto-close window
   * (#061). Null unless the ticket is (or was) resolved.
   */
  resolvedAt: string | null;
  /**
   * The latest message and who wrote it (#041, test round 4). `customer` means
   * the ticket is waiting on support.
   */
  lastReplyAt?: string | null;
  /** Opened by a partner (#042, test round 4). */
  fromPartner?: boolean;
  lastReplyRole?: 'customer' | 'admin' | null;
  lastReplyName?: string | null;
  createdAt: string;
  updatedAt: string;
};

/** One message in a ticket's thread (#032, #059). */
export type TicketMessage = {
  id: number;
  ticketId: number;
  /** `customer` covers partners too — they write as the ticket's owner. */
  authorRole: 'customer' | 'admin';
  authorName: string | null;
  body: string;
  attachments: string[] | null;
  createdAt: string;
};

export type TicketFilters = {
  page?: number;
  limit?: number;
  status?: TicketStatus;
  search?: string;
  /** Only tickets waiting on support — new, or the customer wrote last (#041). */
  awaitingSupport?: boolean;
};

export type TicketListResponse = {
  data: Ticket[];
  hasNextPage: boolean;
  totalCount?: number;
};

export type UpdateTicketStatusPayload = {
  status: TicketStatus;
};
