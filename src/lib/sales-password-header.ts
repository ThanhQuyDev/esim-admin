import type { NextRequest } from 'next/server';

/**
 * The sales password typed for a money transaction (vande-1411 #004), passed
 * on by a proxy route to the backend, which checks it. Nothing else reads or
 * keeps it.
 */
export const SALES_PASSWORD_HEADER = 'x-sales-password';

export function salesPasswordHeader(request: NextRequest): Record<string, string> {
  const value = request.headers.get(SALES_PASSWORD_HEADER);
  return value ? { [SALES_PASSWORD_HEADER]: value } : {};
}
