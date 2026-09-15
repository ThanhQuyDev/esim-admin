import { mutationOptions } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { saveProviderSurcharge } from './service';
import { providerSurchargeKeys } from './queries';
import type { SaveProviderSurchargePayload } from './types';

export const saveProviderSurchargeMutation = mutationOptions({
  mutationFn: ({ provider, values }: { provider: string; values: SaveProviderSurchargePayload }) =>
    saveProviderSurcharge(provider, values),
  onSettled: () => {
    getQueryClient().invalidateQueries({ queryKey: providerSurchargeKeys.all });
    // The cheapest-plan flags were recalculated on the server.
    getQueryClient().invalidateQueries({ queryKey: ['plans'] });
  }
});
