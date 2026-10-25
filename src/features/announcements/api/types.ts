/**
 * Customer announcements by email (vande #072).
 *
 * `audience`: new — signed up, never ordered; purchased — at least one order
 * that went through; failed — a failed order and none that went through.
 */
export type AnnouncementAudience = 'new' | 'purchased' | 'failed';

export type AnnouncementPeriod =
  | 'last_7_days'
  | 'last_14_days'
  | 'last_30_days'
  | 'last_week'
  | 'last_month'
  | 'last_60_days'
  | 'last_90_days'
  | 'last_6_months'
  | 'last_12_months'
  | 'all_time';

export type CustomerAnnouncementStatus = 'scheduled' | 'sending' | 'sent' | 'cancelled';

export type CustomerAnnouncement = {
  id: number;
  subject: string;
  body: string;
  audience: AnnouncementAudience;
  period: AnnouncementPeriod;
  intervalSec: number;
  scheduledAt: string;
  status: CustomerAnnouncementStatus;
  /** Known once sending starts: the customers read at that moment. */
  recipientCount: number | null;
  sentCount: number;
  failedCount: number;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
};

export type CreateCustomerAnnouncementPayload = {
  subject: string;
  body: string;
  audience: AnnouncementAudience;
  period: AnnouncementPeriod;
  intervalSec: number;
  /** ISO; omitted to send now. */
  scheduledAt?: string;
};
