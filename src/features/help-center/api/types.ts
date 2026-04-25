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

export type HelpCenterArticle = {
  id: string;
  title: string;
  content: string;
  order: number;
  category: HelpCenterCategory;
  parent: HelpCenterParent;
  createdAt: string;
  updatedAt: string;
};

export type HelpCenterFilters = {
  page?: number;
  limit?: number;
  category?: HelpCenterCategory;
  parent?: HelpCenterParent;
};

export type HelpCenterResponse = { data: HelpCenterArticle[]; hasNextPage: boolean };

export type CreateHelpCenterPayload = {
  title: string;
  content: string;
  order?: number;
  category: HelpCenterCategory;
  parent: HelpCenterParent;
};

export type UpdateHelpCenterPayload = Partial<CreateHelpCenterPayload>;

export const CATEGORY_OPTIONS: { value: HelpCenterCategory; label: string }[] = [
  { value: 'getting_started', label: 'Getting Started' },
  { value: 'plans_and_payments', label: 'Plans & Payments' },
  { value: 'troubleshooting', label: 'Troubleshooting' },
  { value: 'faq', label: 'FAQ' }
];

export const PARENT_OPTIONS: {
  value: HelpCenterParent;
  label: string;
  category: HelpCenterCategory;
}[] = [
  { value: 'setting_up', label: 'Setting up', category: 'getting_started' },
  { value: 'using_esim', label: 'Using esim.vn eSIM', category: 'getting_started' },
  { value: 'device_compatibility', label: 'Device compatibility', category: 'getting_started' },
  { value: 'payments', label: 'Payments', category: 'plans_and_payments' },
  { value: 'plans', label: 'Plans', category: 'plans_and_payments' },
  { value: 'find_an_answer', label: 'Find an answer', category: 'troubleshooting' },
  { value: 'esim_functions', label: 'eSIM functions', category: 'faq' },
  { value: 'esim_basics', label: 'eSIM basics', category: 'faq' },
  { value: 'about_esimvn', label: 'About esim.vn', category: 'faq' }
];
