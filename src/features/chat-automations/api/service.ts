import { apiClient } from '@/lib/api-client';
import type {
  ChatAutomation,
  ChatAutomationType,
  CreateChatAutomationDto,
  UpdateChatAutomationDto
} from './types';

export async function getChatAutomations(): Promise<ChatAutomation[]> {
  return apiClient<ChatAutomation[]>('/admin/chat-automations');
}

export async function createChatAutomation(data: CreateChatAutomationDto): Promise<ChatAutomation> {
  return apiClient<ChatAutomation>('/admin/chat-automations', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function updateChatAutomation(
  type: ChatAutomationType,
  data: UpdateChatAutomationDto
): Promise<ChatAutomation> {
  return apiClient<ChatAutomation>(`/admin/chat-automations/${type}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}
