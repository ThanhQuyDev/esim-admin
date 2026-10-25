'use client';

/**
 * "Danh mục" and "Danh mục con" as select boxes (vande #076). Outside writers
 * do not know the site's sections, so they pick from the categories made in
 * advance instead of typing; the sub-category box only lists the children of
 * the category chosen. The post keeps the name in its own language — the
 * storefront builds the category's address from it.
 */

import { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

import { blogCategoryCatalogueQueryOptions } from '../api/queries';
import type { BlogCatalogueCategory } from '../api/types';

/** The storefront's category slug: what makes two spellings the same category. */
export function categorySlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

type Node = Omit<BlogCatalogueCategory, 'children'>;
const nameIn = (node: Node, lang: string) => (lang === 'vi' ? node.nameVi : node.nameEn);
/** The node a stored name stands for, in either language or spelling. */
const findNode = <T extends Node>(nodes: T[], name: string): T | undefined => {
  const slug = categorySlug(name);
  return nodes.find((n) => categorySlug(n.nameVi) === slug || categorySlug(n.nameEn) === slug);
};

/** An option for a name the post already had that is not in the list. */
const LEGACY = (name: string) => ({ value: name, label: `${name} (danh mục cũ)` });

export function BlogCategoryFields({
  language,
  category,
  parent,
  onCategoryChange,
  onParentChange
}: {
  language: string;
  category: string;
  parent: string;
  onCategoryChange: (value: string) => void;
  onParentChange: (value: string) => void;
}) {
  const { data: catalogue = [], isLoading } = useQuery(blogCategoryCatalogueQueryOptions());

  const selected = category ? findNode(catalogue, category) : undefined;
  const children = useMemo(() => selected?.children ?? [], [selected]);
  const selectedChild = parent ? findNode(children, parent) : undefined;

  // A stored name spelt differently ("Kết Nối Di Động"), or in the other
  // language after the post's language changed, becomes the catalogue's own
  // name in the post's language — the address stays the same.
  useEffect(() => {
    if (selected && category !== nameIn(selected, language)) {
      onCategoryChange(nameIn(selected, language));
    }
  }, [selected, category, language, onCategoryChange]);
  useEffect(() => {
    if (selectedChild && parent !== nameIn(selectedChild, language)) {
      onParentChange(nameIn(selectedChild, language));
    }
  }, [selectedChild, parent, language, onParentChange]);

  const categoryOptions = [
    ...catalogue.map((c) => ({ value: nameIn(c, language), label: nameIn(c, language) })),
    ...(category && !selected ? [LEGACY(category)] : [])
  ];
  const parentOptions = [
    ...children.map((c) => ({ value: nameIn(c, language), label: nameIn(c, language) })),
    ...(parent && !selectedChild ? [LEGACY(parent)] : [])
  ];

  return (
    <>
      <div className='space-y-2' data-testid='blog-category'>
        <Label htmlFor='blog-category'>Danh mục</Label>
        <Select
          value={category || undefined}
          onValueChange={(value) => {
            onCategoryChange(value);
            // A sub-category belongs to one category: drop it when it does not
            // belong to the new one.
            const next = findNode(catalogue, value);
            if (!next || !parent || !findNode(next.children, parent)) onParentChange('');
          }}
        >
          <SelectTrigger id='blog-category' className='w-full'>
            <SelectValue placeholder={isLoading ? 'Đang tải…' : 'Chọn danh mục'} />
          </SelectTrigger>
          <SelectContent>
            {categoryOptions.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className='space-y-2' data-testid='blog-parent'>
        <Label htmlFor='blog-parent'>Danh mục con</Label>
        <Select
          value={parent || undefined}
          onValueChange={onParentChange}
          disabled={!category || parentOptions.length === 0}
        >
          <SelectTrigger id='blog-parent' className='w-full'>
            <SelectValue
              placeholder={
                !category
                  ? 'Chọn danh mục trước'
                  : parentOptions.length
                    ? 'Chọn danh mục con'
                    : 'Danh mục này chưa có danh mục con'
              }
            />
          </SelectTrigger>
          <SelectContent>
            {parentOptions.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </>
  );
}
