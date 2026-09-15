/**
 * Destination links an admin sends into a chat (#050).
 *
 * The storefront serves country and region pages at the site root:
 * `/esim-nhat-ban` in Vietnamese (the default locale, no prefix) and
 * `/en/esim-nhat-ban` in English — the same paths the sitemap publishes.
 */

export type ChatLinkLang = 'vi' | 'en';

export interface LinkableDestination {
  kind: 'destination' | 'region';
  id: number;
  name: string;
  title: string | null;
  titleVi: string | null;
  slug: string;
  slugVi: string | null;
  imageUrl: string | null;
}

/** Where the customer-facing site lives. */
export const STOREFRONT_ORIGIN = (process.env.NEXT_PUBLIC_SITE_URL || 'https://esim.vn').replace(
  /\/+$/,
  ''
);

export function destinationUrl(
  item: Pick<LinkableDestination, 'slug' | 'slugVi'>,
  lang: ChatLinkLang,
  origin: string = STOREFRONT_ORIGIN
): string | null {
  const raw = lang === 'vi' ? item.slugVi || item.slug : item.slug;
  const slug = raw?.trim().replace(/^\/+/, '');
  if (!slug) return null;
  const base = origin.replace(/\/+$/, '');
  return lang === 'vi' ? `${base}/${slug}` : `${base}/en/${slug}`;
}

/** Name as the customer reads it on that language's page. */
export function destinationLabel(
  item: Pick<LinkableDestination, 'name' | 'title' | 'titleVi'>,
  lang: ChatLinkLang
): string {
  const localized = lang === 'vi' ? item.titleVi || item.title : item.title || item.titleVi;
  return (localized || item.name).trim();
}

/** "eSIM Nhật Bản: https://esim.vn/esim-nhat-ban" — null when there is no page. */
export function destinationMessage(
  item: LinkableDestination,
  lang: ChatLinkLang,
  origin?: string
): string | null {
  const url = destinationUrl(item, lang, origin);
  if (!url) return null;
  return `eSIM ${destinationLabel(item, lang)}: ${url}`;
}

type SearchRecord = {
  id: number;
  name: string;
  slug: string;
  slugVi?: string | null;
  title?: string | null;
  titleVi?: string | null;
  isActive?: boolean;
  flagUrl?: string | null;
  iconUrl?: string | null;
  avatarUrl?: string | null;
};

function toLinkable(kind: LinkableDestination['kind'], record: SearchRecord): LinkableDestination {
  return {
    kind,
    id: record.id,
    name: record.name,
    title: record.title ?? null,
    titleVi: record.titleVi ?? null,
    slug: record.slug,
    slugVi: record.slugVi ?? null,
    imageUrl:
      kind === 'destination'
        ? (record.flagUrl ?? record.avatarUrl ?? null)
        : (record.iconUrl ?? record.avatarUrl ?? null)
  };
}

/**
 * Countries first, then regions; hidden ones and records without a page are
 * dropped, and nothing is listed twice.
 */
export function mergeDestinationResults(
  destinations: SearchRecord[] | null | undefined,
  regions: SearchRecord[] | null | undefined,
  limit = 10
): LinkableDestination[] {
  const seen = new Set<string>();
  const merged: LinkableDestination[] = [];

  const add = (kind: LinkableDestination['kind'], records: SearchRecord[] | null | undefined) => {
    for (const record of records ?? []) {
      if (!record || record.isActive === false || !record.slug?.trim()) continue;
      const key = `${kind}-${record.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(toLinkable(kind, record));
    }
  };

  add('destination', destinations);
  add('region', regions);
  return merged.slice(0, limit);
}
