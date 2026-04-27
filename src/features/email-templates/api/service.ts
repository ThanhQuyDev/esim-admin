import { apiClient } from '@/lib/api-client';
import type {
  EmailTemplate,
  UpdateEmailTemplatePayload,
  PreviewEmailTemplatePayload,
  PreviewEmailTemplateResponse
} from './types';

export async function getEsimPurchaseTemplate(): Promise<EmailTemplate> {
  return apiClient<EmailTemplate>('/email-templates/esim-purchase');
}

export async function updateEsimPurchaseTemplate(
  data: UpdateEmailTemplatePayload
): Promise<EmailTemplate> {
  return apiClient<EmailTemplate>('/email-templates/esim-purchase', {
    method: 'PATCH',
    body: JSON.stringify(data)
  });
}

export async function previewEsimPurchaseTemplate(
  data: PreviewEmailTemplatePayload
): Promise<PreviewEmailTemplateResponse> {
  return apiClient<PreviewEmailTemplateResponse>('/email-templates/esim-purchase/preview', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}
