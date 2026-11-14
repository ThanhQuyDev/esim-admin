/**
 * Format an ISO 8601 date string to a relative time string.
 * e.g. "2 minutes ago", "1 hour ago", "Yesterday"
 */
export function formatDistanceToNow(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay === 1) return 'Yesterday';
  if (diffDay < 7) return `${diffDay}d ago`;

  return date.toLocaleDateString('en-US', {
    timeZone: 'Asia/Ho_Chi_Minh',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * A message's time WITH its date, "14:05 10/10/2026" — the hour alone made it
 * impossible to tell an old message from today's (#005, test round 4).
 */
export function formatMessageTime(isoDate: string): string {
  const date = new Date(isoDate);
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${pad(date.getHours())}:${pad(date.getMinutes())} ` +
    `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`
  );
}

/**
 * Day headers of a chat, as Zalo does (vande-1411 #036): 'Hôm nay', 'Hôm qua',
 * or for an older day the time and date of its first message, centred above
 * it; each message then shows its time alone.
 */
const pad2 = (n: number) => String(n).padStart(2, '0');

function dayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

export function chatDayLabel(iso: string, now: Date = new Date()): string {
  const date = new Date(iso);
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (dayKey(date) === dayKey(now)) return 'Hôm nay';
  if (dayKey(date) === dayKey(yesterday)) return 'Hôm qua';
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())} ${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}/${date.getFullYear()}`;
}

/** Whether a message starts a new day, so a header goes above it. */
export function startsNewDay(iso: string, previousIso?: string | null): boolean {
  if (!previousIso) return true;
  return dayKey(new Date(iso)) !== dayKey(new Date(previousIso));
}

/** '14:05': the time alone, under a day header. */
export function chatTime(iso: string): string {
  const date = new Date(iso);
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}
