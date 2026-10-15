/**
 * What a marketing link is made of, shared by the list and its popups
 * (doitac-1410 #018).
 */

export const CHANNELS = [
  { value: 'youtube', label: 'YouTube' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'website', label: 'Trang web' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'threads', label: 'Threads' },
  { value: 'other', label: 'Kênh khác' }
];

export function shortLinkOf(code: string): string {
  // /go/<code> is the route the site actually serves — /r/ 404s (#024).
  return `esim.vn/go/${code}`;
}

/**
 * Fold the channel and sub-id into the destination: the links API stores a
 * label and a target path and nothing else, so this is where they survive.
 */
export function buildTargetPath(
  landing: string,
  channel: string,
  subid: string
): string | undefined {
  const trimmed = landing.trim();
  if (!trimmed) {
    // The home page, still carrying the channel so the list can show it.
    return channel ? `/?utm_source=${encodeURIComponent(channel)}` : undefined;
  }
  try {
    const url = new URL(trimmed, 'https://esim.vn');
    if (channel) url.searchParams.set('utm_source', channel);
    if (subid.trim()) url.searchParams.set('subid', subid.trim());
    return `${url.pathname}${url.search}`;
  } catch {
    return trimmed;
  }
}

/** The landing page a link points at, without the utm parameters we add. */
export function landingOf(targetPath: string | null | undefined): string {
  if (!targetPath) return 'Trang chủ';
  const path = targetPath.split('?')[0];
  return !path || path === '/' ? 'Trang chủ' : path;
}

/** The `utm_source` the channel is stored as. */
export function channelValueOf(targetPath: string | null | undefined): string {
  if (!targetPath) return '';
  return new URLSearchParams(targetPath.split('?')[1] ?? '').get('utm_source') ?? '';
}

export function channelOf(targetPath: string | null | undefined): string {
  const source = channelValueOf(targetPath);
  if (!source) return '—';
  return CHANNELS.find((c) => c.value === source)?.label ?? source;
}

export function subidOf(targetPath: string | null | undefined): string {
  if (!targetPath) return '';
  return new URLSearchParams(targetPath.split('?')[1] ?? '').get('subid') ?? '';
}

/**
 * Hoạt động / Đã tắt / Bị đình chỉ / Đã xóa — a deleted link outranks its
 * stored status (#054). "Bị đình chỉ" comes from esim.vn: an admin suspending
 * this link, or the account being locked (doitac-1410 #004, #018).
 */
export type LinkState = 'active' | 'inactive' | 'suspended' | 'deleted';
export function linkState(link: { status: string; deletedAt?: string | null }): LinkState {
  if (link.deletedAt) return 'deleted';
  if (link.status === 'suspended') return 'suspended';
  return link.status === 'active' ? 'active' : 'inactive';
}

export const LINK_STATE: Record<
  LinkState,
  { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }
> = {
  active: { label: 'Hoạt động', variant: 'default' },
  inactive: { label: 'Tạm tắt', variant: 'secondary' },
  suspended: { label: 'Bị đình chỉ', variant: 'destructive' },
  deleted: { label: 'Đã xóa', variant: 'outline' }
};

const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export type LinkPeriod = 'today' | 'yesterday' | '7d' | '30d' | 'month' | 'all';

export const LINK_PERIODS: { value: LinkPeriod; label: string }[] = [
  { value: 'today', label: 'Hôm nay' },
  { value: 'yesterday', label: 'Hôm qua' },
  { value: '7d', label: '7 ngày qua' },
  { value: '30d', label: '30 ngày qua' },
  { value: 'month', label: 'Tháng này' },
  { value: 'all', label: 'Từ khi tạo' }
];

/** Day bounds for a quick period, on the partner's own clock; `all` has none. */
export function periodRange(period: LinkPeriod): { from?: string; to?: string } {
  const today = new Date();
  const start = new Date(today);
  switch (period) {
    case 'today':
      return { from: iso(today), to: iso(today) };
    case 'yesterday':
      start.setDate(today.getDate() - 1);
      return { from: iso(start), to: iso(start) };
    case '7d':
      start.setDate(today.getDate() - 6);
      return { from: iso(start), to: iso(today) };
    case '30d':
      start.setDate(today.getDate() - 29);
      return { from: iso(start), to: iso(today) };
    case 'month':
      start.setDate(1);
      return { from: iso(start), to: iso(today) };
    default:
      return {};
  }
}
