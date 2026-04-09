import { mutationOptions } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { createUser, updateUser, deleteUser } from './service';
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
