/**
 * Extract the <style> block of the v29 partner-portal mockup and rewrite every
 * selector so it only applies inside `.pp-app`.
 *
 * The mockup styles bare `body`, `html`, `*`, `input`… which would otherwise
 * leak into the admin console that shares this Next.js app.
 */
const fs = require('fs');

const SRC = process.argv[2];
const OUT = process.argv[3];
const SCOPE = process.argv[4] || ".pp-app";

const html = fs.readFileSync(SRC, 'utf8');
const start = html.indexOf('<style>');
const end = html.indexOf('</style>', start);
if (start < 0 || end < 0) throw new Error('no <style> block');
// Comments are dropped before parsing: a `/* … */` sitting in front of a rule
// would otherwise be read as part of that rule's selector list, and a comma
// inside the comment text would split it.
const css = html.slice(start + '<style>'.length, end).replace(/\/\*[\s\S]*?\*\//g, '');

/** Split a selector list on top-level commas. */
function splitSelectors(sel) {
  const out = [];
  let depth = 0;
  let buf = '';
  for (const ch of sel) {
    if (ch === '(' || ch === '[') depth++;
    else if (ch === ')' || ch === ']') depth--;
    if (ch === ',' && depth === 0) {
      out.push(buf);
      buf = '';
    } else buf += ch;
  }
  if (buf.trim()) out.push(buf);
  return out;
}

/** Root-level selectors become the scope element itself; the rest nest under it. */
function scopeOne(sel) {
  const s = sel.trim();
  if (!s) return s;
  if (s === ':root' || s === 'html' || s === 'body') return SCOPE;
  if (s === '*') return `${SCOPE} *`;
  if (s.startsWith(':')) return `${SCOPE} ${s}`;
  return `${SCOPE} ${s}`;
}

function scopeSelectorList(sel) {
  const scoped = splitSelectors(sel).map(scopeOne);
  // `:root` and `body` both collapse to the scope element; keep one copy.
  return [...new Set(scoped)].join(',');
}

/**
 * Walk the stylesheet rule by rule. `insideKeyframes` marks blocks whose
 * "selectors" are really keyframe offsets (`from`, `50%`) and must stay put.
 */
function transform(input, insideKeyframes) {
  let out = '';
  let i = 0;
  let prelude = '';

  while (i < input.length) {
    const ch = input[i];

    if (ch === '{') {
      const head = prelude.trim();
      prelude = '';
      // Find the matching close brace.
      let depth = 1;
      let j = i + 1;
      while (j < input.length && depth > 0) {
        if (input[j] === '{') depth++;
        else if (input[j] === '}') depth--;
        j++;
      }
      const body = input.slice(i + 1, j - 1);

      if (head.startsWith('@')) {
        const name = head.slice(1).split(/[\s(]/)[0].toLowerCase();
        if (name.endsWith('keyframes')) {
          out += `${head}{${transform(body, true)}}\n`;
        } else if (name === 'media' || name === 'supports' || name === 'layer' || name === 'container') {
          out += `${head}{${transform(body, false)}}\n`;
        } else {
          out += `${head}{${body}}\n`;
        }
      } else if (insideKeyframes) {
        out += `${head}{${body}}\n`;
      } else {
        out += `${scopeSelectorList(head)}{${body}}\n`;
      }

      i = j;
      continue;
    }

    if (ch === ';' && prelude.trim().startsWith('@')) {
      // A statement at-rule such as @import / @charset.
      out += `${prelude.trim()};\n`;
      prelude = '';
      i++;
      continue;
    }

    prelude += ch;
    i++;
  }

  const tail = prelude.trim();
  if (tail) out += tail;
  return out;
}

const header = `/*
 * Partner portal (cổng đối tác) visual system.
 *
 * Ported verbatim from cong-doi-tac-phan-phoi-hoan-chinh-v29.html — the design
 * the portal must match pixel for pixel. Every selector is scoped to \`.pp-app\`
 * so the admin console, which shares this app, keeps its own shadcn theme.
 *
 * Generated from the mockup; edit the mockup and re-run rather than drifting.
 */\n\n`;

fs.writeFileSync(OUT, header + transform(css, false), 'utf8');
console.log('wrote', OUT, fs.statSync(OUT).size, 'bytes');
