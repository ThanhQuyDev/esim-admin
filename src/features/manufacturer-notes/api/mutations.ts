import { mutationOptions } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { createManufacturerNote, updateManufacturerNote, deleteManufacturerNote } from './service';
import { manufacturerNoteKeys } from './queries';
import type { CreateManufacturerNotePayload, UpdateManufacturerNotePayload } from './types';

const invalidate = () => {
  getQueryClient().invalidateQueries({ queryKey: manufacturerNoteKeys.all });
};

export const createManufacturerNoteMutation = mutationOptions({
  mutationFn: (data: CreateManufacturerNotePayload) => createManufacturerNote(data),
  onSettled: invalidate
});

export const updateManufacturerNoteMutation = mutationOptions({
  mutationFn: ({ id, values }: { id: string; values: UpdateManufacturerNotePayload }) =>
    updateManufacturerNote(id, values),
  onSettled: invalidate
});

export const deleteManufacturerNoteMutation = mutationOptions({
  mutationFn: (id: string) => deleteManufacturerNote(id),
  onSettled: invalidate
});
