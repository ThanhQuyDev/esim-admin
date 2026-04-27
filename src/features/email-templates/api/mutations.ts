import { mutationOptions } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { updateEsimPurchaseTemplate } from './service';
import { emailTemplateKeys } from './queries';
import type { UpdateEmailTemplatePayload } from './types';

const invalidateTemplate = () => {
  getQueryClient().invalidateQueries({
    queryKey: emailTemplateKeys.all
  });
};

export const updateEsimPurchaseTemplateMutation = mutationOptions({
  mutationFn: (data: UpdateEmailTemplatePayload) => updateEsimPurchaseTemplate(data),
  onSettled: invalidateTemplate
});
