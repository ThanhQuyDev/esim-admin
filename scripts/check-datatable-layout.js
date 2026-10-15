#!/usr/bin/env node
/**
 * A listing that puts something above its table (stat tiles, a notice) must wrap
 * the two in a flex column, never a plain block such as `space-y-4`.
 *
 * From `lg` up the DataTable fills the height its parent leaves it (`flex-1` and
 * an absolutely placed table). Under a block parent that height is zero, so the
 * rows render 0px tall: the pager says "13 hàng" over an empty box. That is how
 * the admin partner list showed nothing for two test rounds (#001 doitac-1410).
 *
 * Runs before `next build`, next to check-search-params-cache.js.
 */
const fs = require('fs');
const path = require('path');

const featuresDir = path.join(__dirname, '..', 'src/features');

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/listing\.tsx$/.test(entry.name)) out.push(full);
  }
  return out;
}

const problems = [];
for (const file of walk(featuresDir)) {
  const src = fs.readFileSync(file, 'utf8');
  const suspense = src.indexOf('<Suspense');
  if (suspense === -1) continue;
  // The nearest element opened before the table's Suspense is its parent.
  const before = src.slice(0, suspense);
  const match = [...before.matchAll(/<div className='([^']*)'>/g)].pop();
  if (!match) continue;
  const classes = match[1].split(/\s+/);
  if (!classes.includes('flex') || !classes.includes('flex-col')) {
    problems.push(`${path.relative(process.cwd(), file)}: '${match[1]}'`);
  }
}

if (problems.length) {
  console.error(
    'A listing wraps its DataTable in a non-flex parent, so the table is 0px tall on desktop.\n' +
      "Use className='flex flex-1 flex-col gap-4' instead:\n  " +
      problems.join('\n  ')
  );
  process.exit(1);
}
