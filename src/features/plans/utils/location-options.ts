/**
 * Country / region pickers (#018, #031): the Vietnamese name first, and
 * searchable in either language, with or without diacritics.
 */
export type NamedLocation = { name: string; title?: string | null; titleVi?: string | null };

/** "Trung Quốc (China)" — the Vietnamese name, with the stored name beside it. */
export function locationLabel(location: NamedLocation): string {
  const vi = location.titleVi?.trim();
  return vi && vi !== location.name ? `${vi} (${location.name})` : location.name;
}

/** Vietnamese without its marks too, so "trung quoc" finds "Trung Quốc". */
export function locationKeywords(location: NamedLocation): string[] {
  const words = [location.titleVi, location.title, location.name].filter(
    (word): word is string => !!word && !!word.trim()
  );
  const plain = words.map((word) =>
    word
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
  );
  return [...new Set([...words, ...plain])];
}
