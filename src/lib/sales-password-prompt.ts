/**
 * Asking for the "mật khẩu bán hàng" (vande-1411 #004) from anywhere.
 *
 * The backend answers a money transaction without (or with a wrong) sales
 * password with 403 and `errors.salesPassword`. `apiClient` then asks here,
 * the dialog mounted in the dashboard layout shows, and the request is sent
 * again with what was typed. The value lives only in that retry: it is never
 * stored.
 */
export type SalesPasswordReason = 'required' | 'invalid' | 'not_set' | 'locked';

type Prompt = (reason: SalesPasswordReason, message: string) => Promise<string | null>;

let current: Prompt | null = null;

export function registerSalesPasswordPrompt(prompt: Prompt): () => void {
  current = prompt;
  return () => {
    if (current === prompt) current = null;
  };
}

/** The typed password, or null when the person cancelled or cannot go on. */
export function askSalesPassword(
  reason: SalesPasswordReason,
  message: string
): Promise<string | null> {
  return current ? current(reason, message) : Promise.resolve(null);
}

export function isSalesPasswordReason(value: unknown): value is SalesPasswordReason {
  return value === 'required' || value === 'invalid' || value === 'not_set' || value === 'locked';
}
