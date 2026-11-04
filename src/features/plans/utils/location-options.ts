/**
 * Country / region pickers (#018, #031): the Vietnamese name first, and
 * searchable in either language, with or without diacritics.
 */
export type NamedLocation = { name: string; title?: string | null; titleVi?: string | null };

/**
 * The name column of the destination / region page, as typed there. It is kept
 * in both languages by hand now, so adding the Vietnamese title again read "Châu
 * Á (Châu Á (Asia))" (vande-0411 #043). The titles stay searchable.
 */
export function locationLabel(location: NamedLocation): string {
  return location.name;
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
