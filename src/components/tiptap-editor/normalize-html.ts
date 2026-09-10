/**
 * Tidy the HTML the editor produces before it is saved (#069).
 *
 * The editor keeps inserting blank paragraphs of its own: it always parks an
 * empty one at the end of the document, pasting from Word or Google Docs brings
 * `<p>&nbsp;</p>` spacers along, and every save writes them back — so the gap
 * between two paragraphs grows a little each time the article is edited.
 *
 * The rule here is deliberately conservative: an author may want ONE blank line
 * between sections, so a single empty paragraph is kept. What gets removed is
 * the pile-up — runs of two or more — plus the empties at the very start and end,
 * which nobody typed on purpose.
 */

/** A paragraph holding nothing but whitespace, `&nbsp;` and/or a single `<br>`. */
const EMPTY_PARAGRAPH = /^<p(?:\s[^>]*)?>(?:\s|&nbsp;|&#160;|<br\s*\/?>)*<\/p>$/i;

/**
 * Split the document into paragraphs and the markup between them.
 *
 * Paragraphs never nest in the editor's output, so a non-greedy match is enough
 * — and anything that is not a paragraph (a heading, an image block, a table) is
 * passed through untouched.
 */
function splitBlocks(html: string): string[] {
  const paragraph = /<p(?:\s[^>]*)?>[\s\S]*?<\/p>/gi;
  const blocks: string[] = [];
  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = paragraph.exec(html)) !== null) {
    if (match.index > cursor) blocks.push(html.slice(cursor, match.index));
    blocks.push(match[0]);
    cursor = match.index + match[0].length;
  }
  if (cursor < html.length) blocks.push(html.slice(cursor));

  return blocks.filter((block) => block.length > 0);
}

function isEmptyParagraph(block: string): boolean {
  return EMPTY_PARAGRAPH.test(block.trim());
}

export function normalizeEditorHtml(html: string): string {
  if (!html) return html;
  // Nothing but blank paragraphs means an empty document, whatever it looks like.
  const blocks = splitBlocks(html);
  if (blocks.every((block) => isEmptyParagraph(block))) return '';

  const kept: string[] = [];
  let pendingEmpty = false;

  for (const block of blocks) {
    if (isEmptyParagraph(block)) {
      // Drop leading empties outright; otherwise remember at most one.
      if (kept.length > 0) pendingEmpty = true;
      continue;
    }
    if (pendingEmpty) {
      kept.push('<p></p>');
      pendingEmpty = false;
    }
    kept.push(block);
  }

  // A trailing empty (the editor's own parking paragraph) is never kept.
  return kept.join('');
}
