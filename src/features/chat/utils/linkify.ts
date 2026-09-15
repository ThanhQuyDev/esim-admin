/**
 * Split chat text into plain runs and links (#050).
 *
 * A destination link sent into the chat has to be clickable, not text to
 * copy. Punctuation that ends a sentence ("…xem ở https://esim.vn/x.") is kept
 * out of the link.
 */

export type TextPart = { type: 'text'; value: string } | { type: 'link'; value: string };

const URL_PATTERN = /https?:\/\/[^\s<>"']+/gi;
const TRAILING_PUNCTUATION = /[.,!?;:)\]]+$/;

export function splitLinks(text: string): TextPart[] {
  const parts: TextPart[] = [];
  let last = 0;

  for (const match of text.matchAll(URL_PATTERN)) {
    const start = match.index ?? 0;
    let url = match[0];
    const trailing = url.match(TRAILING_PUNCTUATION)?.[0] ?? '';
    if (trailing) url = url.slice(0, -trailing.length);

    if (start > last) parts.push({ type: 'text', value: text.slice(last, start) });
    if (url.length > 'https://'.length) parts.push({ type: 'link', value: url });
    else parts.push({ type: 'text', value: url });
    last = start + url.length;
  }

  if (last < text.length) parts.push({ type: 'text', value: text.slice(last) });
  return parts;
}
