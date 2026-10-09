#!/usr/bin/env node
/**
 * Every dashboard page that renders a listing reading `searchParamsCache.get()`
 * must call `searchParamsCache.parse(searchParams)` first. Without it nuqs throws
 * "Empty search params cache" and the page shows only "Application error" —
 * which is how the SEO config page broke (#035/#036, test round 4).
 *
 * Runs before `next build`, so a page like that can no longer ship.
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const appDir = path.join(root, 'src/app/dashboard');

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name === 'page.tsx') out.push(full);
  }
  return out;
}

function resolveImport(spec) {
  if (!spec.startsWith('@/')) return null;
  const base = path.join(root, 'src', spec.slice(2));
  for (const ext of ['.tsx', '.ts', '/index.tsx', '/index.ts']) {
    if (fs.existsSync(base + ext)) return base + ext;
  }
  return null;
}

const offenders = [];
for (const page of walk(appDir)) {
  const source = fs.readFileSync(page, 'utf8');
  if (source.includes('searchParamsCache.parse(')) continue;
  const imports = [...source.matchAll(/from '(@\/features\/[^']+)'/g)].map((m) => m[1]);
  const readers = imports
    .map(resolveImport)
    .filter((file) => file && fs.readFileSync(file, 'utf8').includes('searchParamsCache.get('));
  if (readers.length) {
    offenders.push(`${path.relative(root, page)} → ${readers.map((f) => path.relative(root, f)).join(', ')}`);
  }
}

if (offenders.length) {
  console.error('Pages render a listing that reads searchParamsCache but never parse it:');
  for (const line of offenders) console.error('  ' + line);
  process.exit(1);
}
console.log('search params cache: ok');
