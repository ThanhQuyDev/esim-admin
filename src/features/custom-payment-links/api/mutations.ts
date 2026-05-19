import { mutationOptions } from '@tanstack/react-query';
import { createCustomPaymentLink } from './service';
import type { CreateCustomPaymentLinkPayload } from './types';

export const createCustomPaymentLinkMutation = mutationOptions({
  mutationFn: (data: CreateCustomPaymentLinkPayload) => createCustomPaymentLink(data)
});
