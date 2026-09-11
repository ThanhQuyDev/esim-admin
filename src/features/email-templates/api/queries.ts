import { queryOptions } from '@tanstack/react-query';
import { getEmailTemplates, getEsimPurchaseTemplate } from './service';

export const emailTemplateKeys = {
  all: ['email-templates'] as const,
  esimPurchase: () => [...emailTemplateKeys.all, 'esim-purchase'] as const
};

export const esimPurchaseTemplateQueryOptions = () =>
  queryOptions({
    queryKey: emailTemplateKeys.esimPurchase(),
    queryFn: () => getEsimPurchaseTemplate()
  });

export const emailTemplatesQueryOptions = () =>
  queryOptions({
    queryKey: [...emailTemplateKeys.all, 'list'] as const,
    queryFn: () => getEmailTemplates()
  });
