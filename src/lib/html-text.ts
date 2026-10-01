/**
 * Plain-text preview of rich-text content, for a table cell (#050).
 *
 * FAQ answers are stored as HTML, and the list column rendered them as text, so
 * every row read `<p>Nội dung...</p>`. Stripping the markup is only half of it:
 * the entities it leaves behind (`&amp;`, `&nbsp;`) would otherwise show raw too,
 * and the tag boundaries have to become spaces or `<p>a</p><p>b</p>` collapses
 * into "ab".
 *
 * Deliberately NOT for rendering markup — this returns text, which callers place
 * in a normal text node. Nothing here makes untrusted HTML safe to inject.
 */

/** The handful of named entities that actually turn up in CMS copy. */
const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  ndash: '–',
  mdash: '—',
  hellip: '…'
};

function decodeEntities(value: string): string {
  return value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, body: string) => {
    if (body.startsWith('#')) {
      const isHex = body[1] === 'x' || body[1] === 'X';
      const code = Number.parseInt(isHex ? body.slice(2) : body.slice(1), isHex ? 16 : 10);
      // An out-of-range or unparseable reference is left as typed rather than
      // turned into a replacement character.
      return Number.isInteger(code) && code > 0 && code <= 0x10ffff
        ? String.fromCodePoint(code)
        : match;
    }
    return NAMED_ENTITIES[body.toLowerCase()] ?? match;
  });
}

export function htmlToText(input: string | null | undefined): string {
  if (!input) return '';

  return decodeEntities(
    input
      // Script and style bodies are not prose; drop them whole.
      .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
      // A tag becomes a space, so block boundaries stay word boundaries.
      .replace(/<[^>]*>/g, ' ')
  )
    .replace(/\s+/g, ' ')
    .trim();
}
