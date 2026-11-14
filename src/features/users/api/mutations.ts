import { mutationOptions } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { createUser, updateUser, deleteUser, lockUser, unlockUser } from './service';
import { userKeys } from './queries';
import type { CreateUserPayload, UpdateUserPayload } from './types';

const invalidateUsers = () => {
  getQueryClient().invalidateQueries({ queryKey: userKeys.all });
};

export const createUserMutation = mutationOptions({
  mutationFn: (data: CreateUserPayload) => createUser(data),
  onSettled: invalidateUsers
});

export const updateUserMutation = mutationOptions({
  mutationFn: ({ id, values }: { id: number; values: UpdateUserPayload }) => updateUser(id, values),
  onSettled: invalidateUsers
});

export const deleteUserMutation = mutationOptions({
  mutationFn: (id: number) => deleteUser(id),
  onSettled: invalidateUsers
});

export const lockUserMutation = mutationOptions({
  mutationFn: ({ id, reason }: { id: number; reason: string }) => lockUser(id, reason),
  onSettled: invalidateUsers
});

export const unlockUserMutation = mutationOptions({
  mutationFn: (id: number) => unlockUser(id),
  onSettled: invalidateUsers
});
