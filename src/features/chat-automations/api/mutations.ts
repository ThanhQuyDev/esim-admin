import { mutationOptions } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { createChatAutomation, updateChatAutomation } from './service';
import { chatAutomationKeys } from './queries';
import type { ChatAutomationType, CreateChatAutomationDto, UpdateChatAutomationDto } from './types';

const invalidateChatAutomations = () => {
  getQueryClient().invalidateQueries({ queryKey: chatAutomationKeys.all });
};

export const createChatAutomationMutation = mutationOptions({
  mutationFn: (data: CreateChatAutomationDto) => createChatAutomation(data),
  onSettled: invalidateChatAutomations
});

export const updateChatAutomationMutation = mutationOptions({
  mutationFn: ({ type, data }: { type: ChatAutomationType; data: UpdateChatAutomationDto }) =>
    updateChatAutomation(type, data),
  onSettled: invalidateChatAutomations
});
