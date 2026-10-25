import { queryOptions } from '@tanstack/react-query';
import { getAnnouncementAudienceCount, getCustomerAnnouncements } from './service';
import type { AnnouncementAudience, AnnouncementPeriod } from './types';

export const announcementKeys = {
  all: ['customer-announcements'] as const,
  list: () => [...announcementKeys.all, 'list'] as const,
  audience: (audience: AnnouncementAudience, period: AnnouncementPeriod) =>
    [...announcementKeys.all, 'audience', audience, period] as const
};

export const customerAnnouncementsQueryOptions = () =>
  queryOptions({
    queryKey: announcementKeys.list(),
    queryFn: () => getCustomerAnnouncements(),
    // A list with emails going out: keep the counts moving.
    refetchInterval: 10_000
  });

export const audienceCountQueryOptions = (
  audience: AnnouncementAudience,
  period: AnnouncementPeriod
) =>
  queryOptions({
    queryKey: announcementKeys.audience(audience, period),
    queryFn: () => getAnnouncementAudienceCount(audience, period)
  });
