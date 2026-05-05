export function getFilePreviewUrl(file?: string | { url?: string; path?: string } | null) {
  if (!file) return '';
  if (typeof file === 'string') return file;
  return file.url || file.path || '';
}
