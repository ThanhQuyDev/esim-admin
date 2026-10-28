import { mutationOptions } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import {
  createBlog,
  updateBlog,
  deleteBlog,
  createBlogCategory,
  renameBlogCategory,
  deleteBlogCategory
} from './service';
import { blogKeys } from './queries';
import type { BlogCategoryNamesPayload, CreateBlogPayload, UpdateBlogPayload } from './types';

const invalidateBlogs = () => {
  getQueryClient().invalidateQueries({ queryKey: blogKeys.all });
};

export const createBlogMutation = mutationOptions({
  mutationFn: (data: CreateBlogPayload) => createBlog(data),
  onSettled: invalidateBlogs
});

export const updateBlogMutation = mutationOptions({
  mutationFn: ({ id, values }: { id: string; values: UpdateBlogPayload }) => updateBlog(id, values),
  onSettled: invalidateBlogs
});

export const deleteBlogMutation = mutationOptions({
  mutationFn: (id: string) => deleteBlog(id),
  onSettled: invalidateBlogs
});

// Blog categories (vande #076). Everything under blogKeys is refreshed: a
// rename also renames the category on its posts.
export const createBlogCategoryMutation = mutationOptions({
  mutationFn: (data: BlogCategoryNamesPayload & { parentId?: number | null }) =>
    createBlogCategory(data),
  onSettled: invalidateBlogs
});

export const renameBlogCategoryMutation = mutationOptions({
  mutationFn: ({ id, values }: { id: number; values: BlogCategoryNamesPayload }) =>
    renameBlogCategory(id, values),
  onSettled: invalidateBlogs
});

export const deleteBlogCategoryMutation = mutationOptions({
  mutationFn: (id: number) => deleteBlogCategory(id),
  onSettled: invalidateBlogs
});
