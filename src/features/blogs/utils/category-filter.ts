/**
 * Category / sub-category filter for the blog list (#054).
 *
 * The API returns the sub-categories grouped by category
 * (`{ "Kết Nối Di Động": ["eSIM", "Internet"] }`), for every language at once
 * since the CMS list shows both.
 */

export type BlogCategoryTree = Record<string, string[]>;

function uniqueSorted(values: Iterable<string>): string[] {
  return Array.from(new Set(Array.from(values).filter((v) => v && v.trim()))).sort((a, b) =>
    a.localeCompare(b, 'vi')
  );
}

export function categoryOptions(tree: BlogCategoryTree | null | undefined): string[] {
  return uniqueSorted(Object.keys(tree ?? {}));
}

/** Sub-categories of the chosen category, or of every category when none is chosen. */
export function parentOptions(
  tree: BlogCategoryTree | null | undefined,
  category: string | null | undefined
): string[] {
  const source = tree ?? {};
  if (category) return uniqueSorted(source[category] ?? []);
  return uniqueSorted(Object.values(source).flat());
}

export type BlogListFilterParams = {
  category?: string | null;
  parent?: string | null;
  /** Author slug from the select box (#046). */
  author?: string | null;
  /** `'true'` / `'false'` from the select box; anything else means "all" (#046). */
  isPublished?: string | null;
  /**
   * The nổi bật select. Named `popular` because the URL param is: `isPopular` is
   * already the array-valued catalogue filter on the destination/region lists.
   */
  popular?: string | null;
};

/** A Có/Không select only means something when one side is actually picked. */
function boolOf(value: string | null | undefined): boolean | undefined {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
}

/**
 * The `filters` query value for the API, or undefined when nothing is filtered.
 *
 * One implementation on purpose: the server component prefetches the query and
 * the client component reads it back, so if the two built this string
 * differently the query keys would not match and the prefetch would be thrown
 * away on every load (#054, #046).
 */
export function blogListFilters(params: BlogListFilterParams): string | undefined {
  const filters: Record<string, string | boolean> = {};
  if (params.category) filters.category = params.category;
  if (params.parent) filters.parent = params.parent;
  if (params.author) filters.authorSlug = params.author;

  const isPublished = boolOf(params.isPublished);
  if (isPublished !== undefined) filters.isPublished = isPublished;

  const isPopular = boolOf(params.popular);
  if (isPopular !== undefined) filters.isPopular = isPopular;

  return Object.keys(filters).length > 0 ? JSON.stringify(filters) : undefined;
}
