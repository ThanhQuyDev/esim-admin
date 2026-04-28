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
  mutationFn: ({ id, values }: { id: string; values: UpdateBlogPayload }) => updateBlog(id, values),
  onSettled: invalidateBlogs
});

export const deleteBlogMutation = mutationOptions({
  mutationFn: (id: string) => deleteBlog(id),
  onSettled: invalidateBlogs
});
