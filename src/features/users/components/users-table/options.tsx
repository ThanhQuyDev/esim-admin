export const ROLE_OPTIONS = [
  { value: '1', label: 'Admin' },
  { value: '2', label: 'User' },
  { value: '3', label: 'Tác giả' }
];

/**
 * The tier filter's choices come from the ladder the admin set (vande #066);
 * the table fills them in when it has loaded.
 */
export function withTierFilterOptions<T extends { id?: string; meta?: unknown }>(
  columns: T[],
  options: { value: string; label: string }[]
): T[] {
  return columns.map((column) =>
    column.id === 'membershipTier'
      ? { ...column, meta: { ...(column.meta as object), options } }
      : column
  );
}

/** `status.id` as the backend seeds it: 1 = Active, 2 = Inactive (#037). */
export const USER_STATUS_OPTIONS = [
  { value: '1', label: 'Hoạt động' },
  { value: '2', label: 'Ngừng hoạt động' }
];
