'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';

const ALLOWED_TAGS = new Set([
  'a',
  'b',
  'blockquote',
  'br',
  'code',
  'div',
  'em',
  'figure',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'hr',
  'i',
  'img',
  'li',
  'ol',
  'p',
  'pre',
  'span',
  'strong',
  'sub',
  'sup',
  'table',
  'tbody',
  'td',
  'th',
  'thead',
  'tr',
  'u',
  'ul'
]);

const ALLOWED_ATTRS_BY_TAG: Record<string, Set<string>> = {
  a: new Set(['href', 'title', 'target', 'rel']),
  img: new Set(['src', 'alt', 'title', 'width', 'height']),
  '*': new Set([])
};

const SAFE_URL = /^(https?:|mailto:|tel:|\/|#)/i;

function sanitizeNode(node: Element) {
  const tag = node.tagName.toLowerCase();

  if (!ALLOWED_TAGS.has(tag)) {
    // Replace with its text content to preserve readable text but strip tag.
    const text = node.ownerDocument.createTextNode(node.textContent ?? '');
    node.replaceWith(text);
    return;
  }

  const allowed = ALLOWED_ATTRS_BY_TAG[tag] ?? ALLOWED_ATTRS_BY_TAG['*'];
  for (const attr of Array.from(node.attributes)) {
    const name = attr.name.toLowerCase();
    if (!allowed.has(name) || name.startsWith('on')) {
      node.removeAttribute(attr.name);
      continue;
    }
    if ((name === 'href' || name === 'src') && !SAFE_URL.test(attr.value)) {
      node.removeAttribute(attr.name);
    }
  }

  if (tag === 'a') {
    node.setAttribute('rel', 'noopener noreferrer nofollow');
    if (!node.getAttribute('target')) node.setAttribute('target', '_blank');
  }

  for (const child of Array.from(node.children)) {
    sanitizeNode(child);
  }
}

function sanitizeHtml(input: string): string {
  if (typeof window === 'undefined') {
    // SSR fallback: strip all tags so nothing dangerous renders before hydration.
    return input.replace(/<[^>]*>/g, '');
  }
  const doc = new DOMParser().parseFromString(`<div>${input}</div>`, 'text/html');
  const root = doc.body.firstElementChild;
  if (!root) return '';
  for (const child of Array.from(root.children)) {
    sanitizeNode(child);
  }
  return root.innerHTML;
}

interface SafeHtmlProps {
  html: string;
  className?: string;
}

export function SafeHtml({ html, className }: SafeHtmlProps) {
  const safe = useMemo(() => sanitizeHtml(html ?? ''), [html]);
  return (
    <div
      className={cn(
        'prose prose-sm dark:prose-invert max-w-none break-words',
        '[&_a]:text-primary [&_a]:underline',
        className
      )}
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  );
}
