import { apiClient } from '@/lib/api-client';
import type {
  Blog,
  BlogFilters,
  BlogsResponse,
  CreateBlogPayload,
  UpdateBlogPayload
} from './types';

export async function getBlogs(filters: BlogFilters): Promise<BlogsResponse> {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.filters) params.set('filters', filters.filters);
  if (filters.sort) params.set('sort', filters.sort);
  const query = params.toString();
  return apiClient<BlogsResponse>(`/blogs${query ? `?${query}` : ''}`);
}

export async function getBlog(id: string): Promise<Blog> {
  return apiClient<Blog>(`/blogs/${id}`);
}

export async function createBlog(data: CreateBlogPayload): Promise<Blog> {
  return apiClient<Blog>('/blogs', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateBlog(id: string, data: UpdateBlogPayload): Promise<Blog> {
  return apiClient<Blog>(`/blogs/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export async function deleteBlog(id: string): Promise<void> {
  await apiClient(`/blogs/${id}`, { method: 'DELETE' });
}

export async function uploadToCloudinary(file: File): Promise<string> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  if (!cloudName || !uploadPreset) throw new Error('Cloudinary configuration is missing');
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: formData
  });
  if (!res.ok) throw new Error('Failed to upload image to Cloudinary');
  const data = await res.json();
  return data.secure_url as string;
}
