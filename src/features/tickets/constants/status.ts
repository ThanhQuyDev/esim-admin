import type { TicketStatus } from '../api/types';

export const TICKET_STATUS_OPTIONS: {
  value: TicketStatus;
  label: string;
  className: string;
}[] = [
  {
    value: 'open',
    label: 'Mới',
    className:
      'border-blue-200 bg-blue-100 text-blue-800 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300'
  },
  {
    value: 'in_progress',
    label: 'Đang xử lý',
    className:
      'border-orange-200 bg-orange-100 text-orange-800 dark:border-orange-900 dark:bg-orange-950 dark:text-orange-300'
  },
  {
    // Set by hand while waiting on the customer; their answer moves it back to
    // "Đang xử lý" (#041, test round 4).
    value: 'need_info',
    label: 'Cần bổ sung thông tin',
    className:
      'border-purple-200 bg-purple-100 text-purple-800 dark:border-purple-900 dark:bg-purple-950 dark:text-purple-300'
  },
  {
    value: 'resolved',
    label: 'Đã giải quyết',
    className:
      'border-emerald-200 bg-emerald-100 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300'
  },
  {
    value: 'closed',
    label: 'Đã đóng',
    className:
      'border-gray-200 bg-gray-100 text-gray-800 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300'
  }
];

/**
 * How long a resolved ticket waits before closing itself (#061). Mirrors
 * `TICKET_AUTO_CLOSE_HOURS` in the backend, which is where the rule is enforced.
 */
export const TICKET_AUTO_CLOSE_HOURS = 48;

export function getTicketStatusOption(status: TicketStatus) {
  return TICKET_STATUS_OPTIONS.find((opt) => opt.value === status) ?? TICKET_STATUS_OPTIONS[0];
}
