import { mutationOptions } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { createBlog, updateBlog, deleteBlog } from './service';
import { blogKeys } from './queries';
import type { CreateBlogPayload, UpdateBlogPayload } from './types';

const invalidateBlogs = () => {
  getQueryClient().invalidateQueries({ queryKey: blogKeys.all });
};

export const createBlogMutation = mutationOptions({
  mutationFn: (data: CreateBlogPayload) => createBlog(data),
  onSettled: invalidateBlogs
});

export const updateBlogMutation = mutationOptions({
  mutationFn: ({ id, values }: { id: number; values: UpdateBlogPayload }) => updateBlog(id, values),
  onSettled: invalidateBlogs
});

export const deleteBlogMutation = mutationOptions({
  mutationFn: (id: number) => deleteBlog(id),
  onSettled: invalidateBlogs
});
