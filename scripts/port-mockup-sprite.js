const fs = require('fs');

const SRC = process.argv[2];
const OUT = process.argv[3];

const html = fs.readFileSync(SRC, 'utf8');
const start = html.indexOf('<svg height="0" style="position:absolute" width="0"><defs>');
const end = html.indexOf('</defs></svg>', start);
if (start < 0 || end < 0) throw new Error('sprite not found');

const inner = html
  .slice(start + '<svg height="0" style="position:absolute" width="0"><defs>'.length, end)
  .replace(/viewbox=/g, 'viewBox=')
  .trim();

const ids = [...inner.matchAll(/<symbol id="([^"]+)"/g)].map((m) => m[1]);

const out = `/**
 * The v29 icon sprite, lifted verbatim from cong-doi-tac-phan-phoi-hoan-chinh-v29.html.
 *
 * Rendered once per portal page so every icon in the views resolves through
 * <use href="#i-…" />. Injected as raw markup rather than transcribed to JSX so
 * the paths stay identical to the design file.
 */
export const PORTAL_ICON_IDS = [
${ids.map((i) => `  '${i}'`).join(',\n')}
] as const;

export type PortalIconId = (typeof PORTAL_ICON_IDS)[number];

const SPRITE = ${JSON.stringify(inner)};

export function PortalIconSprite() {
  return (
    <svg
      width={0}
      height={0}
      aria-hidden
      focusable='false'
      style={{ position: 'absolute' }}
      dangerouslySetInnerHTML={{ __html: '<defs>' + SPRITE + '</defs>' }}
    />
  );
}

/** One sprite icon, sized by the stylesheet rule for \`.icon\`. */
export function PortalIcon({ id, className }: { id: PortalIconId; className?: string }) {
  return (
    <svg className={className ?? 'icon'} aria-hidden focusable='false'>
      <use href={'#' + id} />
    </svg>
  );
}
`;

fs.writeFileSync(OUT, out, 'utf8');
console.log('icons:', ids.length);
console.log(ids.join(' '));
