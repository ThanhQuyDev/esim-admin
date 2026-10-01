import { mutationOptions } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { createMenuSlide, updateMenuSlide, deleteMenuSlide } from './service';
import { menuSlideKeys } from './queries';
import type { CreateMenuSlidePayload, UpdateMenuSlidePayload } from './types';

const invalidate = () => {
  getQueryClient().invalidateQueries({ queryKey: menuSlideKeys.all });
};

export const createMenuSlideMutation = mutationOptions({
  mutationFn: (data: CreateMenuSlidePayload) => createMenuSlide(data),
  onSettled: invalidate
});

export const updateMenuSlideMutation = mutationOptions({
  mutationFn: ({ id, values }: { id: string; values: UpdateMenuSlidePayload }) =>
    updateMenuSlide(id, values),
  onSettled: invalidate
});

export const deleteMenuSlideMutation = mutationOptions({
  mutationFn: (id: string) => deleteMenuSlide(id),
  onSettled: invalidate
});
