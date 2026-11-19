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

/**
 * One sales password for a run of requests (vande-2011 #002): a bulk order
 * mailed to 5 addresses is 5 orders, and each one asked again — the partner
 * thought the first password was wrong, and cancelling the third left some
 * orders placed and some not. Inside `fn` the password typed for the first
 * request is reused by the next ones; it lives in memory only while `fn` runs
 * and is dropped as soon as it ends (or a request finds it wrong).
 */
let batch: { password: string | null } | null = null;

export async function withOneSalesPassword<T>(fn: () => Promise<T>): Promise<T> {
  const outer = batch;
  batch = { password: null };
  try {
    return await fn();
  } finally {
    batch = outer;
  }
}

/** The password typed earlier in this run, if any. */
export function batchSalesPassword(): string | null {
  return batch?.password ?? null;
}

/** Keep (or, with null, forget) the password for the rest of this run. */
export function rememberBatchSalesPassword(password: string | null): void {
  if (batch) batch.password = password;
}
