import { queryOptions } from '@tanstack/react-query';
import { getMe } from './service';

export const authKeys = {
  all: ['auth'] as const,
  me: () => [...authKeys.all, 'me'] as const
};

export const authMeQueryOptions = queryOptions({
  queryKey: authKeys.me(),
  queryFn: getMe,
  staleTime: 5 * 60 * 1000,
  retry: false
});
