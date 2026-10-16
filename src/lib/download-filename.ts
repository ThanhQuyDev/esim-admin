/**
 * Download names: `Ten-chuc-nang_dd-MM-yyyy_HH-mm-ss.ext` in Vietnam time
 * (doitac-1410 #075) — the same shape the API gives its own files.
 */
const VIETNAM_OFFSET_MS = 7 * 60 * 60 * 1000;

export function downloadStamp(at: Date = new Date()): string {
  const local = new Date(at.getTime() + VIETNAM_OFFSET_MS);
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${pad(local.getUTCDate())}-${pad(local.getUTCMonth() + 1)}-${local.getUTCFullYear()}` +
    `_${pad(local.getUTCHours())}-${pad(local.getUTCMinutes())}-${pad(local.getUTCSeconds())}`
  );
}

export function downloadFilename(base: string, ext = 'xlsx', at: Date = new Date()): string {
  return `${base}_${downloadStamp(at)}.${ext}`;
}
