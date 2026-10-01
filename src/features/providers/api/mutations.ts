import { mutationOptions } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { setProviderSalesStatus } from './service';
import { providerKeys } from './queries';
import type { SetProviderSalesStatusPayload } from './types';

export const setProviderSalesStatusMutation = mutationOptions({
  mutationFn: ({ provider, values }: { provider: string; values: SetProviderSalesStatusPayload }) =>
    setProviderSalesStatus(provider, values),
  onSettled: () => {
    const queryClient = getQueryClient();
    queryClient.invalidateQueries({ queryKey: providerKeys.all });
    // Every plan of that supplier changed state, and the surcharge tab shows
    // the active-plan count per supplier.
    queryClient.invalidateQueries({ queryKey: ['plans'] });
    queryClient.invalidateQueries({ queryKey: ['provider-surcharges'] });
  }
});
