import { queryOptions } from '@tanstack/react-query';
import { getAuthPageSettings } from './service';

export const authPageKeys = {
  all: ['auth-page-settings'] as const,
  list: () => [...authPageKeys.all, 'list'] as const
};

export const authPageSettingsQueryOptions = () =>
  queryOptions({
    queryKey: authPageKeys.list(),
    queryFn: () => getAuthPageSettings()
  });
