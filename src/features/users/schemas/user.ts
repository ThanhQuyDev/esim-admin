import * as z from 'zod';

// Optional: empty string is allowed, otherwise 9-11 digits with optional +84 / 0 prefix
export const phoneNumberSchema = z
  .string()
  .trim()
  .refine((v) => v === '' || /^(\+?84|0)\d{9,10}$/.test(v.replace(/[\s.-]/g, '')), {
    message: 'Số điện thoại không hợp lệ'
  });

export const tierOverrideSchema = z.enum(['auto', 'traveler', 'silver', 'gold', 'platinum']);

export const authorProfileSchema = z.object({
  name: z.string().min(2, 'Tên tác giả phải có ít nhất 2 ký tự'),
  slug: z.string().min(2, 'Slug tác giả là bắt buộc'),
  avatar: z.string().optional(),
  description: z.string().max(2000).optional()
});
export const createUserSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  phoneNumber: phoneNumberSchema,
  password: z.string().min(6, 'Password must be at least 6 characters'),
  roleId: z.string().min(1, 'Please select a role'),
  statusId: z.string().min(1, 'Please select a status')
});

export type CreateUserFormValues = z.infer<typeof createUserSchema>;

export const updateUserSchema = z
  .object({
    firstName: z.string().min(2, 'First name must be at least 2 characters'),
    lastName: z.string().min(2, 'Last name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email'),
    phoneNumber: phoneNumberSchema,
    roleId: z.string().min(1, 'Please select a role'),
    statusId: z.string().min(1, 'Please select a status'),
    tierOverride: tierOverrideSchema,
    tierOverrideReason: z.string().trim()
  })
  .superRefine((value, context) => {
    if (value.tierOverride !== 'auto' && !value.tierOverrideReason) {
      context.addIssue({
        code: 'custom',
        path: ['tierOverrideReason'],
        message: 'Vui lòng nhập lý do điều chỉnh hạng'
      });
    }
  });

export type UpdateUserFormValues = z.infer<typeof updateUserSchema>;
