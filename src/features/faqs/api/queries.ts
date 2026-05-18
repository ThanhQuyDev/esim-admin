import { queryOptions } from '@tanstack/react-query';
import { getFaqs, getFaqsByContext } from './service';
import type { Faq, FaqFilters, FaqByContextFilters } from './types';

export type { Faq };

export const faqKeys = {
  all: ['faqs'] as const,
  list: (filters: FaqFilters) => [...faqKeys.all, 'list', filters] as const,
  detail: (id: number) => [...faqKeys.all, 'detail', id] as const,
  byContext: (filters: FaqByContextFilters) => [...faqKeys.all, 'by-context', filters] as const
};

export const faqsQueryOptions = (filters: FaqFilters) =>
  queryOptions({ queryKey: faqKeys.list(filters), queryFn: () => getFaqs(filters) });

export const faqsByContextQueryOptions = (filters: FaqByContextFilters) =>
  queryOptions({ queryKey: faqKeys.byContext(filters), queryFn: () => getFaqsByContext(filters) });
