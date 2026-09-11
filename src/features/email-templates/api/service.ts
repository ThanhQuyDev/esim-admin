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

/** Every template the backend holds (#L020), not only the eSIM delivery one. */
export async function getEmailTemplates(): Promise<EmailTemplate[]> {
  return apiClient<EmailTemplate[]>('/email-templates');
}

export async function updateEmailTemplate(
  name: string,
  data: UpdateEmailTemplatePayload
): Promise<EmailTemplate> {
  return apiClient<EmailTemplate>(`/email-templates/${encodeURIComponent(name)}`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  });
}

export async function previewEmailTemplate(
  name: string,
  data: PreviewEmailTemplatePayload
): Promise<PreviewEmailTemplateResponse> {
  return apiClient<PreviewEmailTemplateResponse>(
    `/email-templates/${encodeURIComponent(name)}/preview`,
    { method: 'POST', body: JSON.stringify(data) }
  );
}
