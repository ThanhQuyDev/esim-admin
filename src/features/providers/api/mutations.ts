import { mutationOptions } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { createProvider, deleteProvider, setProviderSalesStatus, updateProvider } from './service';
import { providerKeys } from './queries';
import type {
  CreateProviderPayload,
  SetProviderSalesStatusPayload,
  UpdateProviderPayload
} from './types';

const refreshProviders = () => getQueryClient().invalidateQueries({ queryKey: providerKeys.all });

export const createProviderMutation = mutationOptions({
  mutationFn: (values: CreateProviderPayload) => createProvider(values),
  onSettled: refreshProviders
});

export const updateProviderMutation = mutationOptions({
  mutationFn: ({ provider, values }: { provider: string; values: UpdateProviderPayload }) =>
    updateProvider(provider, values),
  onSettled: refreshProviders
});

export const deleteProviderMutation = mutationOptions({
  mutationFn: (provider: string) => deleteProvider(provider),
  onSettled: refreshProviders
});

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
