import * as z from 'zod';

const DEVICE_TYPES = ['Smart Phones', 'Smart Watches', 'Tablets', 'Laptops'] as const;

/**
 * A position typed in a number box: a whole number ≥ 0, or blank.
 *
 * The number box hands the form a NUMBER, but these used to be `z.string()`,
 * so typing any position failed validation and nothing could be saved (#047).
 */
const positionField = z
  .union([z.number().int('Thứ tự phải là số nguyên').min(0, 'Thứ tự không được âm'), z.literal('')])
  .optional();

export const createSupportedDeviceSchema = z.object({
  device: z.string().min(2, 'Tên thiết bị phải có ít nhất 2 ký tự'),
  manufacturer: z.string().min(2, 'Tên nhà sản xuất phải có ít nhất 2 ký tự'),
  type: z.enum(DEVICE_TYPES, { message: 'Loại thiết bị không hợp lệ' }).or(z.literal('')),
  /** Position of the BRAND; blank keeps the brand's current one (#047). */
  manufacturerOrder: positionField,
  /** Position of the MODEL inside its brand; blank / 0 = after numbered ones. */
  sortOrder: positionField
});

export const updateSupportedDeviceSchema = z.object({
  device: z.string().min(2, 'Tên thiết bị phải có ít nhất 2 ký tự').optional(),
  manufacturer: z.string().min(2, 'Tên nhà sản xuất phải có ít nhất 2 ký tự').optional(),
  type: z
    .enum(DEVICE_TYPES, { message: 'Loại thiết bị không hợp lệ' })
    .or(z.literal(''))
    .optional(),
  manufacturerOrder: positionField,
  sortOrder: positionField
});

export type CreateSupportedDeviceFormValues = z.infer<typeof createSupportedDeviceSchema>;
export type UpdateSupportedDeviceFormValues = z.infer<typeof updateSupportedDeviceSchema>;

/** The typed position, or undefined when the box was left blank. */
export function toPosition(value: number | '' | undefined): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}
