export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export const TICKET_STATUSES: TicketStatus[] = ['open', 'in_progress', 'resolved', 'closed'];

export type Ticket = {
  id: number;
  customerEmail: string;
  subject: string;
  description: string;
  orderId: string | null;
  deviceModel: string | null;
  iccid: string | null;
  planDestination: string | null;
  attachments: string[] | null;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
};

export type TicketFilters = {
  page?: number;
  limit?: number;
  status?: TicketStatus;
  search?: string;
};

export type TicketListResponse = {
  data: Ticket[];
  hasNextPage: boolean;
  totalCount?: number;
};

export type UpdateTicketStatusPayload = {
  status: TicketStatus;
};
