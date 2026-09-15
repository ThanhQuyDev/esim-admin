'use client';
import { AlertModal } from '@/components/modal/alert-modal';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { deleteBlogMutation } from '../../api/mutations';
import type { Blog } from '../../api/types';
import { Icons } from '@/components/icons';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { blogPreviewUrl } from '../../utils/preview-url';

interface CellActionProps {
  data: Blog;
}

export function CellAction({ data }: CellActionProps) {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const deleteMutation = useMutation({
    ...deleteBlogMutation,
    onSuccess: () => {
      toast.success('Xóa bài viết thành công');
      setDeleteOpen(false);
    },
    onError: () => {
      toast.error('Xóa bài viết thất bại');
    }
  });

  // "Xem trước" opens the post on the live storefront in a new tab (#056). The
  // storefront only serves published posts, so a draft has nothing to show yet.
  const previewUrl = data.isPublished ? blogPreviewUrl(data) : null;
  const previewHint = data.isPublished
    ? 'Xem bài viết trên website (tab mới)'
    : 'Bài chưa xuất bản nên chưa xem trước được trên website';

  return (
    <>
      <AlertModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => deleteMutation.mutate(data.id)}
        loading={deleteMutation.isPending}
      />
      <div className='flex items-center justify-end gap-1'>
        {previewUrl ? (
          <Button asChild variant='ghost' className='h-8 w-8 p-0' title={previewHint}>
            <a
              href={previewUrl}
              target='_blank'
              rel='noopener noreferrer'
              aria-label={`Xem trước "${data.title}" trên website`}
              data-testid={`blog-preview-${data.id}`}
            >
              <Icons.externalLink className='h-4 w-4' />
            </a>
          </Button>
        ) : (
          <Button
            variant='ghost'
            className='h-8 w-8 p-0'
            disabled
            title={previewHint}
            aria-label={previewHint}
          >
            <Icons.externalLink className='h-4 w-4 opacity-40' />
          </Button>
        )}
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button variant='ghost' className='h-8 w-8 p-0'>
              <span className='sr-only'>Mở menu</span>
              <Icons.ellipsis className='h-4 w-4' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
            {previewUrl ? (
              <DropdownMenuItem asChild>
                <a href={previewUrl} target='_blank' rel='noopener noreferrer'>
                  <Icons.externalLink className='mr-2 h-4 w-4' /> Xem trước
                </a>
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem disabled title={previewHint}>
                <Icons.externalLink className='mr-2 h-4 w-4' /> Xem trước (chưa xuất bản)
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => router.push(`/dashboard/blogs/${data.id}/edit`)}>
              <Icons.edit className='mr-2 h-4 w-4' /> Cập nhật
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setDeleteOpen(true)}>
              <Icons.trash className='mr-2 h-4 w-4' /> Xóa
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );
}
