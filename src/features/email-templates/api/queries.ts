import { queryOptions } from '@tanstack/react-query';
import { getEsimPurchaseTemplate } from './service';

export const emailTemplateKeys = {
  all: ['email-templates'] as const,
  esimPurchase: () => [...emailTemplateKeys.all, 'esim-purchase'] as const
};

export const esimPurchaseTemplateQueryOptions = () =>
  queryOptions({
    queryKey: emailTemplateKeys.esimPurchase(),
    queryFn: () => getEsimPurchaseTemplate()
  });
