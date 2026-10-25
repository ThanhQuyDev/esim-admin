import { apiClient } from '@/lib/api-client';
import type {
  AnnouncementAudience,
  AnnouncementPeriod,
  CreateCustomerAnnouncementPayload,
  CustomerAnnouncement
} from './types';

export async function getCustomerAnnouncements(): Promise<CustomerAnnouncement[]> {
  return apiClient<CustomerAnnouncement[]>('/customer-announcements');
}

export async function getAnnouncementAudienceCount(
  audience: AnnouncementAudience,
  period: AnnouncementPeriod
): Promise<{ recipients: number }> {
  const query = new URLSearchParams({ audience, period }).toString();
  return apiClient<{ recipients: number }>(`/customer-announcements/audience-count?${query}`);
}

export async function previewCustomerAnnouncement(data: {
  subject: string;
  body: string;
}): Promise<{ html: string }> {
  return apiClient<{ html: string }>('/customer-announcements/preview', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function createCustomerAnnouncement(
  data: CreateCustomerAnnouncementPayload
): Promise<CustomerAnnouncement> {
  return apiClient<CustomerAnnouncement>('/customer-announcements', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function cancelCustomerAnnouncement(id: number): Promise<CustomerAnnouncement> {
  return apiClient<CustomerAnnouncement>(`/customer-announcements/${id}/cancel`, {
    method: 'POST'
  });
}
