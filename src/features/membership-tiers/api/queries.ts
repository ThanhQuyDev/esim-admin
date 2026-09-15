import { queryOptions } from '@tanstack/react-query';
import { getMembershipTiers } from './service';

export const membershipTierKeys = {
  all: ['membership-tiers'] as const
};

export const membershipTiersQueryOptions = () =>
  queryOptions({
    queryKey: membershipTierKeys.all,
    queryFn: () => getMembershipTiers()
  });
