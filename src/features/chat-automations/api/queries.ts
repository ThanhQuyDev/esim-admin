import { queryOptions } from '@tanstack/react-query';
import { getChatAutomations } from './service';

export const chatAutomationKeys = {
  all: ['chat-automations'] as const,
  list: () => [...chatAutomationKeys.all, 'list'] as const
};

export const chatAutomationsQueryOptions = () =>
  queryOptions({
    queryKey: chatAutomationKeys.list(),
    queryFn: () => getChatAutomations()
  });
