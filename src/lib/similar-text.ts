/**
 * "Is there already a question like this one?" (vande #084) — a word-overlap
 * score, accents and case ignored, small connecting words left out. The FAQ
 * and "Tại sao chọn chúng tôi" lists are a few hundred rows at most, so this
 * runs in the browser over the whole list.
 */

const STOPWORDS = new Set([
  // Vietnamese
  'la',
  'cua',
  'va',
  'co',
  'khong',
  'the',
  'nao',
  'gi',
  'cho',
  'toi',
  'ban',
  'duoc',
  'bi',
  'voi',
  'mot',
  'nhung',
  'cac',
  'khi',
  'thi',
  'o',
  'tai',
  've',
  'den',
  'tu',
  'nay',
  'do',
  'de',
  'hay',
  'neu',
  'vi',
  'nen',
  'can',
  'phai',
  'lam',
  'sao',
  'bao',
  'nhieu',
  'minh',
  'esim',
  'sim',
  // Words nearly every question here has, which would match them all.
  'du',
  'lich',
  'di',
  'dang',
  'ma',
  'nuoc',
  'ngoai',
  'travel',
  // English
  'the',
  'a',
  'an',
  'is',
  'are',
  'do',
  'does',
  'can',
  'i',
  'my',
  'to',
  'of',
  'in',
  'on',
  'for',
  'and',
  'or',
  'it',
  'how',
  'what',
  'with',
  'you',
  'your',
  'be',
  'will',
  'if',
  'at',
  'from'
]);

export function normalizeText(text: string): string {
  return text
    .replace(/<[^>]*>/g, ' ')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function keywords(text: string): Set<string> {
  return new Set(
    normalizeText(text)
      .split(' ')
      .filter((w) => w.length > 1 && !STOPWORDS.has(w))
  );
}

/**
 * 0 to 1: the share of the shorter text's keywords the other one has too, so
 * a short new question matches a longer existing one that says the same. One
 * word in common is not enough: "hết data" is a topic, "data" is everywhere.
 */
export function similarity(a: string, b: string): number {
  const ka = keywords(a);
  const kb = keywords(b);
  if (ka.size === 0 || kb.size === 0) return 0;
  let shared = 0;
  for (const word of ka) if (kb.has(word)) shared++;
  if (shared < Math.min(2, ka.size, kb.size)) return 0;
  return shared / Math.min(ka.size, kb.size);
}

/** The closest items to `text`, best first. */
export function findSimilar<T>(
  text: string,
  items: T[],
  textOf: (item: T) => string,
  { min = 0.5, limit = 5 }: { min?: number; limit?: number } = {}
): { item: T; score: number }[] {
  if (keywords(text).size === 0) return [];
  return items
    .map((item) => ({ item, score: similarity(text, textOf(item)) }))
    .filter((r) => r.score >= min)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
