'use client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { BlogCategoryNamesPayload } from '../api/types';
import { categorySlug } from './blog-category-fields';

/** Add or rename a blog category: its Vietnamese and English names (vande #076). */
export function BlogCategoryNameDialog({
  open,
  onOpenChange,
  title,
  description,
  initial,
  onSubmit,
  isSubmitting
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  initial: BlogCategoryNamesPayload | null;
  onSubmit: (values: BlogCategoryNamesPayload) => void;
  isSubmitting: boolean;
}) {
  const [nameVi, setNameVi] = useState('');
  const [nameEn, setNameEn] = useState('');

  useEffect(() => {
    if (!open) return;
    setNameVi(initial?.nameVi ?? '');
    setNameEn(initial?.nameEn ?? '');
  }, [open, initial]);

  const valid = !!categorySlug(nameVi.trim()) && !!categorySlug(nameEn.trim());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form
          className='space-y-4'
          onSubmit={(e) => {
            e.preventDefault();
            if (valid) onSubmit({ nameVi: nameVi.trim(), nameEn: nameEn.trim() });
          }}
        >
          <div className='space-y-2'>
            <Label htmlFor='blog-category-vi'>Tên tiếng Việt</Label>
            <Input
              id='blog-category-vi'
              value={nameVi}
              maxLength={120}
              onChange={(e) => setNameVi(e.target.value)}
              placeholder='VD: Du lịch'
            />
            {nameVi.trim() && (
              <p className='text-muted-foreground text-xs'>Slug: {categorySlug(nameVi.trim())}</p>
            )}
          </div>
          <div className='space-y-2'>
            <Label htmlFor='blog-category-en'>Tên tiếng Anh</Label>
            <Input
              id='blog-category-en'
              value={nameEn}
              maxLength={120}
              onChange={(e) => setNameEn(e.target.value)}
              placeholder='VD: Travel'
            />
            {nameEn.trim() && (
              <p className='text-muted-foreground text-xs'>Slug: {categorySlug(nameEn.trim())}</p>
            )}
          </div>
          <DialogFooter>
            <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
              Huỷ
            </Button>
            <Button type='submit' disabled={!valid || isSubmitting} isLoading={isSubmitting}>
              Lưu
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
