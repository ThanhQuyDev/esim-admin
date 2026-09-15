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

/**
 * The editor's image block as it writes it: a `<div class="image">` wrapped in a
 * paragraph (#031). Only a div with no nested div is matched, so columns and
 * other structures are left alone.
 */
const IMAGE_IN_PARAGRAPH =
  /<p(?:\s[^>]*)?>\s*(<div\b[^>]*\bclass="[^"]*\bimage\b[^"]*"[^>]*>(?:(?!<\/?div\b)[\s\S])*<\/div>)\s*<\/p>/gi;

const IMAGE_BLOCK = /^<div\b[^>]*\bclass="[^"]*\bimage\b[^"]*"/i;

/**
 * Take the image block out of its paragraph (#031).
 *
 * `<p><div class="image">…</div></p>` is invalid HTML: a browser parsing it
 * closes the paragraph before the div and turns the stray `</p>` into a second,
 * empty paragraph. So every time an article was opened for editing, each image
 * came back with a blank line above and below it — and those were saved. The
 * image itself still loads: the editor matches the `<img>` and puts it back in a
 * paragraph of its own.
 */
export function unwrapImageParagraphs(html: string): string {
  return html.replace(IMAGE_IN_PARAGRAPH, '$1');
}

export function normalizeEditorHtml(html: string): string {
  if (!html) return html;
  // Nothing but blank paragraphs means an empty document, whatever it looks like.
  const blocks = splitBlocks(unwrapImageParagraphs(html));
  if (blocks.every((block) => isEmptyParagraph(block))) return '';

  const kept: string[] = [];
  let pendingEmpty = false;
  let lastKeptIsImage = false;

  for (const block of blocks) {
    if (!block.trim()) {
      kept.push(block);
      continue;
    }
    if (isEmptyParagraph(block)) {
      // Drop leading empties outright; otherwise remember at most one. An empty
      // paragraph right after an image is the parser's split, never typed.
      if (kept.length > 0 && !lastKeptIsImage) pendingEmpty = true;
      continue;
    }
    const isImage = IMAGE_BLOCK.test(block.trim());
    // …and so is one right before an image.
    if (pendingEmpty && !isImage) kept.push('<p></p>');
    pendingEmpty = false;
    kept.push(block);
    lastKeptIsImage = isImage;
  }

  // A trailing empty (the editor's own parking paragraph) is never kept.
  return kept.join('');
}
