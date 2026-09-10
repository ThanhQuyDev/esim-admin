'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Icons } from '@/components/icons';
import { uploadToCloudinary } from '@/features/destinations/api/service';

/**
 * Author profile fields on the user form (#059).
 *
 * The backend has held an author profile (name, slug, avatar, summary) all along
 * and refuses the "Tác giả" role without one — but the form never exposed the
 * fields, and role 3 was not even selectable, so no author could be created at
 * all. The storefront already renders this profile under every article and links
 * it to the author's post list; it just had nothing to render.
 */

/** Slug the way the backend normalizes it, so what you see is what is saved. */
export function authorSlugFromName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export type AuthorFormValues = {
  authorName: string;
  authorSlug: string;
  authorAvatar: string;
  authorDescription: string;
};

export function authorProfilePayload(value: AuthorFormValues) {
  return {
    name: value.authorName.trim(),
    slug: value.authorSlug.trim() || authorSlugFromName(value.authorName),
    avatar: value.authorAvatar.trim() || null,
    description: value.authorDescription.trim() || null
  };
}

interface AuthorAvatarFieldProps {
  value: string;
  onChange: (url: string) => void;
}

/** Upload straight to Cloudinary and keep the URL, as the other forms do. */
export function AuthorAvatarField({ value, onChange }: AuthorAvatarFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File | null) => {
    if (!file) return;
    setUploading(true);
    try {
      onChange(await uploadToCloudinary(file));
    } catch {
      toast.error('Tải ảnh đại diện thất bại');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className='space-y-2'>
      <Label>Ảnh đại diện tác giả</Label>
      <div className='flex items-center gap-3'>
        <div className='bg-muted relative h-16 w-16 shrink-0 overflow-hidden rounded-full'>
          {value ? (
            <Image src={value} alt='Ảnh đại diện tác giả' fill className='object-cover' />
          ) : (
            <span className='text-muted-foreground flex h-full w-full items-center justify-center'>
              <Icons.user className='h-6 w-6' />
            </span>
          )}
        </div>
        <div className='flex flex-wrap items-center gap-2'>
          <input
            ref={inputRef}
            type='file'
            accept='image/*'
            className='hidden'
            onChange={(event) => void handleFile(event.target.files?.[0] ?? null)}
          />
          <Button
            type='button'
            variant='outline'
            size='sm'
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? 'Đang tải...' : value ? 'Đổi ảnh' : 'Tải ảnh lên'}
          </Button>
          {value && (
            <Button type='button' variant='ghost' size='sm' onClick={() => onChange('')}>
              Xoá ảnh
            </Button>
          )}
        </div>
      </div>
      <p className='text-muted-foreground text-xs'>
        Ảnh này hiện ở phần tác giả cuối mỗi bài viết. Nên dùng ảnh vuông.
      </p>
    </div>
  );
}
