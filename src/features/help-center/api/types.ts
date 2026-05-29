export type HelpCenterCategory =
  | 'getting-started'
  | 'plans-and-payments'
  | 'troubleshooting'
  | 'faq';
export type HelpCenterParent =
  | 'setting-up'
  | 'using-esim'
  | 'device-compatibility'
  | 'payments'
  | 'plans'
  | 'find-an-answer'
  | 'esim-functions'
  | 'esim-basics'
  | 'about-esimvn';

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
  isPopular: boolean;
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
  /** Localized kebab-case key (e.g. "bat-dau" for vi, "getting-started" for en). */
  category: string;
  /** Localized kebab-case key (e.g. "cai-dat" for vi, "setting-up" for en). */
  parent: string;
  language?: string;
  slug?: string;
  isPublished?: boolean;
  isPopular?: boolean;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
};

export type UpdateHelpCenterPayload = Partial<CreateHelpCenterPayload>;

export type HelpCenterLanguage = 'vi' | 'en';

/**
 * Each category/parent has BOTH a localized label (for display)
 * and a localized kebab-case key (for the API payload).
 * The English `key` is also used as the canonical id inside the form.
 *
 * Example:
 *   getting-started → en: { key: 'getting-started', label: 'Getting Started' }
 *                     vi: { key: 'bat-dau',         label: 'Bắt đầu' }
 */
type LocalizedEntry = {
  en: { key: string; label: string };
  vi: { key: string; label: string };
};

const CATEGORY_DATA: Record<HelpCenterCategory, LocalizedEntry> = {
  'getting-started': {
    en: { key: 'getting-started', label: 'Getting Started' },
    vi: { key: 'bat-dau', label: 'Bắt đầu' }
  },
  'plans-and-payments': {
    en: { key: 'plans-and-payments', label: 'Plans & Payments' },
    vi: { key: 'goi-cuoc-thanh-toan', label: 'Gói cước & Thanh toán' }
  },
  troubleshooting: {
    en: { key: 'troubleshooting', label: 'Troubleshooting' },
    vi: { key: 'khac-phuc-su-co', label: 'Khắc phục sự cố' }
  },
  faq: {
    en: { key: 'faq', label: 'FAQ' },
    vi: { key: 'cau-hoi-thuong-gap', label: 'Câu hỏi thường gặp' }
  }
};

const PARENT_DATA: Record<HelpCenterParent, LocalizedEntry> = {
  'setting-up': {
    en: { key: 'setting-up', label: 'Setting up' },
    vi: { key: 'cai-dat', label: 'Cài đặt' }
  },
  'using-esim': {
    en: { key: 'using-esim', label: 'Using esim.vn eSIM' },
    vi: { key: 'su-dung-esim', label: 'Sử dụng eSIM esim.vn' }
  },
  'device-compatibility': {
    en: { key: 'device-compatibility', label: 'Device compatibility' },
    vi: { key: 'tuong-thich-thiet-bi', label: 'Tương thích thiết bị' }
  },
  payments: {
    en: { key: 'payments', label: 'Payments' },
    vi: { key: 'thanh-toan', label: 'Thanh toán' }
  },
  plans: {
    en: { key: 'plans', label: 'Plans' },
    vi: { key: 'goi-cuoc', label: 'Gói cước' }
  },
  'find-an-answer': {
    en: { key: 'find-an-answer', label: 'Find an answer' },
    vi: { key: 'tim-cau-tra-loi', label: 'Tìm câu trả lời' }
  },
  'esim-functions': {
    en: { key: 'esim-functions', label: 'eSIM functions' },
    vi: { key: 'chuc-nang-esim', label: 'Chức năng eSIM' }
  },
  'esim-basics': {
    en: { key: 'esim-basics', label: 'eSIM basics' },
    vi: { key: 'co-ban-ve-esim', label: 'Cơ bản về eSIM' }
  },
  'about-esimvn': {
    en: { key: 'about-esimvn', label: 'About esim.vn' },
    vi: { key: 've-esim-vn', label: 'Về esim.vn' }
  }
};

const PARENT_CATEGORY_MAP: Record<HelpCenterParent, HelpCenterCategory> = {
  'setting-up': 'getting-started',
  'using-esim': 'getting-started',
  'device-compatibility': 'getting-started',
  payments: 'plans-and-payments',
  plans: 'plans-and-payments',
  'find-an-answer': 'troubleshooting',
  'esim-functions': 'faq',
  'esim-basics': 'faq',
  'about-esimvn': 'faq'
};

const resolveLang = (lang?: string | null): HelpCenterLanguage => (lang === 'vi' ? 'vi' : 'en');

/**
 * Resolve any string (canonical id, vi kebab-case key, or label in any
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
 * display string. Convert `value` -> localized kebab-case key with
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
 * Localized kebab-case key (the value POSTed to the API).
 *   getCategoryApiKey('getting-started', 'vi') → 'bat-dau'
 *   getCategoryApiKey('getting-started', 'en') → 'getting-started'
 *   getParentApiKey('setting-up', 'vi')        → 'cai-dat'
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
