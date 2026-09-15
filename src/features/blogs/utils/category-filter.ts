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

/** The `filters` query value for the API, or undefined when nothing is filtered. */
export function blogCategoryFilters(
  category: string | null | undefined,
  parent: string | null | undefined
): string | undefined {
  const filters: Record<string, string> = {};
  if (category) filters.category = category;
  if (parent) filters.parent = parent;
  return Object.keys(filters).length > 0 ? JSON.stringify(filters) : undefined;
}
