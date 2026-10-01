import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { authPageSettingsQueryOptions } from '../api/queries';
import { AuthPageSettingsView } from './auth-page-settings-view';

export default function AuthPageSettingsListingPage() {
  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(authPageSettingsQueryOptions());

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <AuthPageSettingsView />
    </HydrationBoundary>
  );
}
