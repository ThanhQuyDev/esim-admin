/**
 * Where a blog post lives on the storefront, for the "Xem trước" button (#056).
 *
 * Mirrors the storefront's `blogDetailHref`: Vietnamese (the default locale)
 * has no prefix, other languages do. Slugs are stored with a leading slash
 * (`/esim-trung-quoc-la-gi`), which must not become `/blog//…`.
 */

export const STOREFRONT_ORIGIN = (process.env.NEXT_PUBLIC_SITE_URL || 'https://esim.vn').replace(
  /\/+$/,
  ''
);

export function blogPreviewUrl(
  blog: { slug?: string | null; language?: string | null },
  origin: string = STOREFRONT_ORIGIN
): string | null {
  const slug = (blog.slug ?? '').trim().replace(/^\/+|\/+$/g, '');
  if (!slug) return null;

  const base = origin.replace(/\/+$/, '');
  const language = (blog.language ?? 'vi').trim().toLowerCase() || 'vi';
  const path = encodeURIComponent(slug);
  return language === 'vi' ? `${base}/blog/${path}` : `${base}/${language}/blog/${path}`;
}
