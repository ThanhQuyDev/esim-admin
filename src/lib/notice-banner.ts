/**
 * Announcements at the top of the page (doitac-1410 #062).
 *
 * A partner closes one with "x" or by opening it, and it stays closed for the
 * rest of that sign-in; the next sign-in shows it again, until an admin
 * unticks "nổi bật". So what was closed is kept in the browser and wiped on
 * every sign-in and sign-out.
 */

const DISMISSED_KEY = 'esim-notice-dismissed';

export function readDismissedNotices(): number[] {
  try {
    const raw = window.localStorage.getItem(DISMISSED_KEY);
    const ids = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(ids) ? ids.map(Number).filter(Number.isFinite) : [];
  } catch {
    return [];
  }
}

export function dismissNotice(id: number): number[] {
  const next = [...new Set([...readDismissedNotices(), id])];
  try {
    window.localStorage.setItem(DISMISSED_KEY, JSON.stringify(next));
  } catch {
    // Private mode: closed for this page only.
  }
  return next;
}

/** A new sign-in shows every featured announcement again. */
export function resetDismissedNotices(): void {
  try {
    window.localStorage.removeItem(DISMISSED_KEY);
  } catch {
    // Nothing kept, nothing to clear.
  }
}

/** Whether a body is rich text from the editor or plain text from before it. */
export function isHtmlBody(body: string | null | undefined): boolean {
  return /<\/?[a-z][^>]*>/i.test(body ?? '');
}

/** One line of text out of a body, for previews in the bell and the banner. */
export function noticePreview(body: string | null | undefined): string {
  if (!isHtmlBody(body)) return body ?? '';
  return (body ?? '')
    .replace(/<(br|\/p|\/div|\/li|\/h[1-6])\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

export type NoticePriority = 'normal' | 'important' | 'urgent';

export const NOTICE_PRIORITIES: { value: NoticePriority; label: string }[] = [
  { value: 'normal', label: 'Bình thường' },
  { value: 'important', label: 'Quan trọng' },
  { value: 'urgent', label: 'Khẩn cấp' }
];
