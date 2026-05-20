export type HelpCenterCategory =
  | 'getting_started'
  | 'plans_and_payments'
  | 'troubleshooting'
  | 'faq';
export type HelpCenterParent =
  | 'setting_up'
  | 'using_esim'
  | 'device_compatibility'
  | 'payments'
  | 'plans'
  | 'find_an_answer'
  | 'esim_functions'
  | 'esim_basics'
  | 'about_esimvn';

// category/parent: the API stores these as localized strings (Vietnamese
// labels for vi articles, English labels for en articles). The frontend
// pipeline is: form holds canonical enum keys for stability, then translates
// them to localized labels at the API boundary.
export type HelpCenterArticle = {
  id: string;
  title: string;
  content: string;
  order: number;
  category: string;
  parent: string;
  language: string | null;
  slug: string | null;
  isPublished: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string | null;
  createdAt: string;
  updatedAt: string;
};

export type HelpCenterFilters = {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  parent?: string;
  language?: string;
};

export type HelpCenterResponse = {
  data: HelpCenterArticle[];
  hasNextPage: boolean;
  totalCount: number;
};

export type CreateHelpCenterPayload = {
  title: string;
  content: string;
  order?: number;
  /** Localized snake_case key (e.g. "bat_dau" for vi, "getting_started" for en). */
  category: string;
  /** Localized snake_case key (e.g. "cai_dat" for vi, "setting_up" for en). */
  parent: string;
  language?: string;
  slug?: string;
  isPublished?: boolean;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
};

export type UpdateHelpCenterPayload = Partial<CreateHelpCenterPayload>;

export type HelpCenterLanguage = 'vi' | 'en';

/**
 * Each category/parent has BOTH a localized label (for display)
 * and a localized snake_case key (for the API payload).
 * The English `key` is also used as the canonical id inside the form.
 *
 * Example:
 *   getting_started → en: { key: 'getting_started', label: 'Getting Started' }
 *                     vi: { key: 'bat_dau',         label: 'Bắt đầu' }
 */
type LocalizedEntry = {
  en: { key: string; label: string };
  vi: { key: string; label: string };
};

const CATEGORY_DATA: Record<HelpCenterCategory, LocalizedEntry> = {
  getting_started: {
    en: { key: 'getting_started', label: 'Getting Started' },
    vi: { key: 'bat_dau', label: 'Bắt đầu' }
  },
  plans_and_payments: {
    en: { key: 'plans_and_payments', label: 'Plans & Payments' },
    vi: { key: 'goi_cuoc_thanh_toan', label: 'Gói cước & Thanh toán' }
  },
  troubleshooting: {
    en: { key: 'troubleshooting', label: 'Troubleshooting' },
    vi: { key: 'khac_phuc_su_co', label: 'Khắc phục sự cố' }
  },
  faq: {
    en: { key: 'faq', label: 'FAQ' },
    vi: { key: 'cau_hoi_thuong_gap', label: 'Câu hỏi thường gặp' }
  }
};

const PARENT_DATA: Record<HelpCenterParent, LocalizedEntry> = {
  setting_up: {
    en: { key: 'setting_up', label: 'Setting up' },
    vi: { key: 'cai_dat', label: 'Cài đặt' }
  },
  using_esim: {
    en: { key: 'using_esim', label: 'Using esim.vn eSIM' },
    vi: { key: 'su_dung_esim', label: 'Sử dụng eSIM esim.vn' }
  },
  device_compatibility: {
    en: { key: 'device_compatibility', label: 'Device compatibility' },
    vi: { key: 'tuong_thich_thiet_bi', label: 'Tương thích thiết bị' }
  },
  payments: {
    en: { key: 'payments', label: 'Payments' },
    vi: { key: 'thanh_toan', label: 'Thanh toán' }
  },
  plans: {
    en: { key: 'plans', label: 'Plans' },
    vi: { key: 'goi_cuoc', label: 'Gói cước' }
  },
  find_an_answer: {
    en: { key: 'find_an_answer', label: 'Find an answer' },
    vi: { key: 'tim_cau_tra_loi', label: 'Tìm câu trả lời' }
  },
  esim_functions: {
    en: { key: 'esim_functions', label: 'eSIM functions' },
    vi: { key: 'chuc_nang_esim', label: 'Chức năng eSIM' }
  },
  esim_basics: {
    en: { key: 'esim_basics', label: 'eSIM basics' },
    vi: { key: 'co_ban_ve_esim', label: 'Cơ bản về eSIM' }
  },
  about_esimvn: {
    en: { key: 'about_esimvn', label: 'About esim.vn' },
    vi: { key: 've_esim_vn', label: 'Về esim.vn' }
  }
};

const PARENT_CATEGORY_MAP: Record<HelpCenterParent, HelpCenterCategory> = {
  setting_up: 'getting_started',
  using_esim: 'getting_started',
  device_compatibility: 'getting_started',
  payments: 'plans_and_payments',
  plans: 'plans_and_payments',
  find_an_answer: 'troubleshooting',
  esim_functions: 'faq',
  esim_basics: 'faq',
  about_esimvn: 'faq'
};

const resolveLang = (lang?: string | null): HelpCenterLanguage => (lang === 'vi' ? 'vi' : 'en');

/**
 * Resolve any string (canonical id, vi snake_case key, or label in any
 * language) back to the canonical category id.
 */
const findCategoryId = (input: string): HelpCenterCategory | null => {
  for (const id of Object.keys(CATEGORY_DATA) as HelpCenterCategory[]) {
    const entry = CATEGORY_DATA[id];
    if (
      id === input ||
      entry.en.key === input ||
      entry.vi.key === input ||
      entry.en.label === input ||
      entry.vi.label === input
    ) {
      return id;
    }
  }
  return null;
};

const findParentId = (input: string): HelpCenterParent | null => {
  for (const id of Object.keys(PARENT_DATA) as HelpCenterParent[]) {
    const entry = PARENT_DATA[id];
    if (
      id === input ||
      entry.en.key === input ||
      entry.vi.key === input ||
      entry.en.label === input ||
      entry.vi.label === input
    ) {
      return id;
    }
  }
  return null;
};

/**
 * Select options for the form. `value` is the canonical id (stable when
 * the user toggles the language inside the form); `label` is the localized
 * display string. Convert `value` -> localized snake_case key with
 * `getCategoryApiKey` / `getParentApiKey` before posting to the API.
 */
export const getCategoryOptions = (
  lang?: string | null
): { value: HelpCenterCategory; label: string }[] => {
  const l = resolveLang(lang);
  return (Object.keys(CATEGORY_DATA) as HelpCenterCategory[]).map((id) => ({
    value: id,
    label: CATEGORY_DATA[id][l].label
  }));
};

export const getParentOptions = (
  lang?: string | null
): { value: HelpCenterParent; label: string; category: HelpCenterCategory }[] => {
  const l = resolveLang(lang);
  return (Object.keys(PARENT_DATA) as HelpCenterParent[]).map((id) => ({
    value: id,
    label: PARENT_DATA[id][l].label,
    category: PARENT_CATEGORY_MAP[id]
  }));
};

/** Localized display label. Accepts canonical id OR any localized key/label. */
export const getCategoryLabel = (input: string, toLang?: string | null): string => {
  if (!input) return input;
  const id = findCategoryId(input);
  if (!id) return input;
  return CATEGORY_DATA[id][resolveLang(toLang)].label;
};

export const getParentLabel = (input: string, toLang?: string | null): string => {
  if (!input) return input;
  const id = findParentId(input);
  if (!id) return input;
  return PARENT_DATA[id][resolveLang(toLang)].label;
};

/**
 * Localized snake_case key (the value POSTed to the API).
 *   getCategoryApiKey('getting_started', 'vi') → 'bat_dau'
 *   getCategoryApiKey('getting_started', 'en') → 'getting_started'
 *   getParentApiKey('setting_up', 'vi')        → 'cai_dat'
 */
export const getCategoryApiKey = (input: string, toLang?: string | null): string => {
  if (!input) return input;
  const id = findCategoryId(input);
  if (!id) return input;
  return CATEGORY_DATA[id][resolveLang(toLang)].key;
};

export const getParentApiKey = (input: string, toLang?: string | null): string => {
  if (!input) return input;
  const id = findParentId(input);
  if (!id) return input;
  return PARENT_DATA[id][resolveLang(toLang)].key;
};

/** Resolve any incoming string back to the canonical id (used to seed form defaults). */
export const getCategoryKeyFromLabel = (input?: string | null): HelpCenterCategory | null =>
  input ? findCategoryId(input) : null;

export const getParentKeyFromLabel = (input?: string | null): HelpCenterParent | null =>
  input ? findParentId(input) : null;

// Backwards-compatible defaults (English) for any code still using these names
export const CATEGORY_OPTIONS = getCategoryOptions('en');
export const PARENT_OPTIONS = getParentOptions('en');

export const LANG_OPTIONS = [
  { value: 'vi', label: 'Tiếng Việt' },
  { value: 'en', label: 'English' }
];
