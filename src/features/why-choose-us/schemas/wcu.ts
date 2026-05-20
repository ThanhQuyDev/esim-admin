import * as z from 'zod';

const LANG_OPTIONS = ['vi', 'en'] as const;

export const WCU_TYPE_OPTIONS = [
  { value: 'trang_chu', label: 'Trang chủ' },
  { value: 'quoc_gia', label: 'Quốc gia' },
  { value: 'khu_vuc', label: 'Khu vực' }
] as const;

export const WCU_TYPE_VALUES = ['trang_chu', 'quoc_gia', 'khu_vuc'] as const;
export type WcuType = (typeof WCU_TYPE_VALUES)[number];

export const wcuSchema = z.object({
  title: z.string().min(2, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  language: z.enum(LANG_OPTIONS),
  icon: z.string().optional(),
  sortOrder: z.string().optional(),
  isActive: z.boolean().optional(),
  /** Form holds array internally; serialized to comma-separated string in payload. */
  type: z.array(z.enum(WCU_TYPE_VALUES)).optional()
});

export type WcuFormValues = z.infer<typeof wcuSchema>;

/** Convert "trang_chu,quoc_gia" -> ["trang_chu","quoc_gia"]; safe against empty/undefined. */
export function parseWcuTypeString(value: string | undefined | null): WcuType[] {
  if (!value) return [];
  return value
    .split(',')
    .map((s) => s.trim())
    .filter((s): s is WcuType => (WCU_TYPE_VALUES as readonly string[]).includes(s));
}

/** Convert array -> "trang_chu,quoc_gia"; returns undefined when empty. */
export function serializeWcuType(values: readonly string[] | undefined): string | undefined {
  if (!values || values.length === 0) return undefined;
  return values.join(',');
}
