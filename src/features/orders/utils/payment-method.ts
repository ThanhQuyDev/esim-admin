/**
 * One name per way of paying, in the list and on the order page alike
 * (vande-0411 #048). Top-ups store theirs in capitals ("ONEPAY", "ADMIN_MANUAL"),
 * purchases in lower case.
 */
const LABELS: Record<string, string> = {
  credit_card: 'Thẻ tín dụng',
  paypal: 'PayPal',
  bank_transfer: 'Chuyển khoản',
  momo: 'MoMo',
  vnpay: 'VNPay'
};

export function paymentMethodName(method: string | null | undefined): string {
  if (!method) return '—';
  const key = method.toLowerCase();
  return LABELS[key] ?? key;
}
