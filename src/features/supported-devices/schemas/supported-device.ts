import * as z from 'zod';

const DEVICE_TYPES = ['Smart Phones', 'Smart Watches', 'Tablets', 'Laptops'] as const;

export const createSupportedDeviceSchema = z.object({
  device: z.string().min(2, 'Tên thiết bị phải có ít nhất 2 ký tự'),
  manufacturer: z.string().min(2, 'Tên nhà sản xuất phải có ít nhất 2 ký tự'),
  type: z.enum(DEVICE_TYPES, { message: 'Loại thiết bị không hợp lệ' })
});

export const updateSupportedDeviceSchema = z.object({
  device: z.string().min(2, 'Tên thiết bị phải có ít nhất 2 ký tự').optional(),
  manufacturer: z.string().min(2, 'Tên nhà sản xuất phải có ít nhất 2 ký tự').optional(),
  type: z.enum(DEVICE_TYPES, { message: 'Loại thiết bị không hợp lệ' }).optional()
});

export type CreateSupportedDeviceFormValues = z.infer<typeof createSupportedDeviceSchema>;
export type UpdateSupportedDeviceFormValues = z.infer<typeof updateSupportedDeviceSchema>;
