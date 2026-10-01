import { apiClient } from '@/lib/api-client';
import type {
  AuthPageSetting,
  AuthPageSettingsResponse,
  UpdateAuthPageSettingPayload
} from './types';

const BASE = '/auth-page-settings';

export async function getAuthPageSettings(): Promise<AuthPageSettingsResponse> {
  return apiClient<AuthPageSettingsResponse>(BASE);
}

export async function updateAuthPageSetting(
  mode: string,
  data: UpdateAuthPageSettingPayload
): Promise<{ data: AuthPageSetting }> {
  return apiClient<{ data: AuthPageSetting }>(`${BASE}/${encodeURIComponent(mode)}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}
