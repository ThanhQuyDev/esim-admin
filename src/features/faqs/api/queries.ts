import { queryOptions } from '@tanstack/react-query';
import { getFaqs } from './service';
import type { Faq, FaqFilters } from './types';

export type { Faq };

export const faqKeys = {
  all: ['faqs'] as const,
  list: (filters: FaqFilters) => [...faqKeys.all, 'list', filters] as const,
  detail: (id: number) => [...faqKeys.all, 'detail', id] as const
};

export const faqsQueryOptions = (filters: FaqFilters) =>
  queryOptions({ queryKey: faqKeys.list(filters), queryFn: () => getFaqs(filters) });
