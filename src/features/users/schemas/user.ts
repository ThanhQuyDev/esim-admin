import * as z from 'zod';

export const createUserSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  roleId: z.string().min(1, 'Please select a role'),
  statusId: z.string().min(1, 'Please select a status')
});

export type CreateUserFormValues = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  roleId: z.string().min(1, 'Please select a role'),
  statusId: z.string().min(1, 'Please select a status')
});

export type UpdateUserFormValues = z.infer<typeof updateUserSchema>;
