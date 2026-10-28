'use client';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { Icons } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ApiError } from '@/lib/api-client';
import {
  createBlogCategoryMutation,
  deleteBlogCategoryMutation,
  renameBlogCategoryMutation
} from '../api/mutations';
import { blogCategoryCatalogueQueryOptions } from '../api/queries';
import type { BlogCatalogueCategory } from '../api/types';
import { BlogCategoryNameDialog } from './blog-category-name-dialog';

type Node = Omit<BlogCatalogueCategory, 'children'>;
type Editing =
  | { mode: 'create'; parent: BlogCatalogueCategory | null }
  | { mode: 'rename'; node: Node; isChild: boolean };

/** The backend explains a refusal in Vietnamese ("Còn 3 bài viết…"). */
function describeError(error: Error, fallback: string): string {
  if (error instanceof ApiError && [400, 404, 409, 422].includes(error.status)) {
    return error.message || fallback;
  }
  return fallback;
}

/** A category's two names and slugs. */
function CategoryNames({ node }: { node: Node }) {
  return (
    <div className='min-w-0'>
      <div className='font-medium break-words'>
        {node.nameVi}
        <span className='text-muted-foreground font-normal'> / {node.nameEn}</span>
      </div>
      <div className='text-muted-foreground text-xs break-all'>
        {node.slugVi} · {node.slugEn}
      </div>
    </div>
  );
}

/**
 * Blog categories (vande #076): the parents and sub-categories authors pick
 * from in the post form, kept up here — add, rename (the posts follow), delete
 * when no post uses it.
 */
export function BlogCategoriesView() {
  const [editing, setEditing] = useState<Editing | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState<number | null>(null);
  const { data: tree = [], isLoading } = useQuery(blogCategoryCatalogueQueryOptions());

  const createMutation = useMutation({
    ...createBlogCategoryMutation,
    onSuccess: () => {
      toast.success('Đã thêm danh mục.');
      setEditing(null);
    },
    onError: (error: Error) => toast.error(describeError(error, 'Thêm danh mục thất bại.'))
  });
  const renameMutation = useMutation({
    ...renameBlogCategoryMutation,
    onSuccess: (res) => {
      toast.success(
        res.postsUpdated
          ? `Đã đổi tên danh mục và cập nhật ${res.postsUpdated} bài viết.`
          : 'Đã đổi tên danh mục.'
      );
      setEditing(null);
    },
    onError: (error: Error) => toast.error(describeError(error, 'Đổi tên thất bại.'))
  });
  const deleteMutation = useMutation({
    ...deleteBlogCategoryMutation,
    onSuccess: () => {
      toast.success('Đã xoá danh mục.');
      setConfirmingDelete(null);
    },
    onError: (error: Error) => {
      toast.error(describeError(error, 'Xoá danh mục thất bại.'));
      setConfirmingDelete(null);
    }
  });

  const actions = (node: Node, isChild: boolean, childCount = 0) => {
    const used = node.postCount ?? 0;
    if (confirmingDelete === node.id) {
      return (
        <div className='flex flex-wrap items-center gap-2'>
          <span className='text-destructive text-sm'>
            {childCount ? `Xoá cả ${childCount} danh mục con?` : 'Xoá danh mục này?'}
          </span>
          <Button
            size='sm'
            variant='destructive'
            isLoading={deleteMutation.isPending}
            onClick={() => deleteMutation.mutate(node.id)}
          >
            Xoá
          </Button>
          <Button size='sm' variant='outline' onClick={() => setConfirmingDelete(null)}>
            Huỷ
          </Button>
        </div>
      );
    }
    return (
      <div className='flex shrink-0 gap-2'>
        <Button
          size='sm'
          variant='outline'
          aria-label={`Đổi tên ${node.nameVi}`}
          onClick={() => setEditing({ mode: 'rename', node, isChild })}
        >
          <Icons.edit className='h-4 w-4 sm:mr-2' />
          <span className='hidden sm:inline'>Đổi tên</span>
        </Button>
        <Button
          size='sm'
          variant='outline'
          className='text-destructive'
          aria-label={`Xoá ${node.nameVi}`}
          disabled={used > 0}
          title={used > 0 ? `Còn ${used} bài viết thuộc danh mục này` : undefined}
          onClick={() => setConfirmingDelete(node.id)}
        >
          <Icons.trash className='h-4 w-4 sm:mr-2' />
          <span className='hidden sm:inline'>Xoá</span>
        </Button>
      </div>
    );
  };

  const dialog =
    editing?.mode === 'create'
      ? {
          title: editing.parent
            ? `Thêm danh mục con cho "${editing.parent.nameVi}"`
            : 'Thêm danh mục',
          description: 'Nhập tên tiếng Việt và tiếng Anh; slug (đường dẫn) tạo tự động từ tên.',
          initial: null
        }
      : editing?.mode === 'rename'
        ? {
            title: `Đổi tên "${editing.node.nameVi}"`,
            description:
              'Các bài viết thuộc danh mục này tự đổi theo tên mới (theo ngôn ngữ của bài); đường dẫn trang danh mục trên web đổi theo tên mới.',
            initial: { nameVi: editing.node.nameVi, nameEn: editing.node.nameEn }
          }
        : null;

  return (
    <div className='space-y-4'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <p className='text-muted-foreground text-sm'>
          {tree.length} danh mục · {tree.reduce((n, p) => n + p.children.length, 0)} danh mục con
        </p>
        <Button onClick={() => setEditing({ mode: 'create', parent: null })}>
          <Icons.add className='mr-2 h-4 w-4' /> Thêm danh mục
        </Button>
      </div>

      {isLoading ? (
        <div className='flex justify-center py-10'>
          <Icons.spinner className='h-6 w-6 animate-spin' />
        </div>
      ) : (
        tree.map((parent) => (
          <div key={parent.id} className='rounded-lg border' data-testid='blog-category'>
            <div className='bg-muted/40 flex flex-wrap items-start justify-between gap-3 border-b p-3'>
              <div className='flex min-w-0 items-start gap-2'>
                <CategoryNames node={parent} />
                <Badge variant='secondary' className='shrink-0'>
                  {parent.postCount ?? 0} bài
                </Badge>
              </div>
              {actions(parent, false, parent.children.length)}
            </div>
            <ul className='divide-y'>
              {parent.children.map((child) => (
                <li
                  key={child.id}
                  className='flex flex-wrap items-start justify-between gap-3 py-2 pr-3 pl-6'
                >
                  <div className='flex min-w-0 items-start gap-2'>
                    <CategoryNames node={child} />
                    <Badge variant='outline' className='shrink-0'>
                      {child.postCount ?? 0} bài
                    </Badge>
                  </div>
                  {actions(child, true)}
                </li>
              ))}
              <li className='py-2 pl-6'>
                <Button
                  size='sm'
                  variant='ghost'
                  onClick={() => setEditing({ mode: 'create', parent })}
                >
                  <Icons.add className='mr-2 h-4 w-4' /> Thêm danh mục con
                </Button>
              </li>
            </ul>
          </div>
        ))
      )}

      <p className='text-muted-foreground text-xs'>
        Không xoá được danh mục còn bài viết — chuyển các bài đó sang danh mục khác trước. Xoá danh
        mục cha sẽ xoá luôn các danh mục con của nó.
      </p>

      <BlogCategoryNameDialog
        open={!!editing}
        onOpenChange={(open) => !open && setEditing(null)}
        title={dialog?.title ?? ''}
        description={dialog?.description ?? ''}
        initial={dialog?.initial ?? null}
        isSubmitting={createMutation.isPending || renameMutation.isPending}
        onSubmit={(values) => {
          if (editing?.mode === 'create') {
            createMutation.mutate({ ...values, parentId: editing.parent?.id ?? null });
          } else if (editing?.mode === 'rename') {
            renameMutation.mutate({ id: editing.node.id, values });
          }
        }}
      />
    </div>
  );
}
