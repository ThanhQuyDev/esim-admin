import type { AppMode } from '@/config/app-mode';

/** Editable branding of one sign-in page (#006). */
export type AuthPageSetting = {
  mode: AppMode;
  logoUrl: string | null;
  logoText: string | null;
  coverImageUrl: string | null;
  quote: string | null;
  quoteAuthor: string | null;
  heading: string | null;
  subheading: string | null;
  /** "Đăng ký" button link (#016). */
  signUpUrl?: string | null;
  updatedAt: string | null;
};

export type AuthPageSettingsResponse = { data: AuthPageSetting[] };

export type UpdateAuthPageSettingPayload = {
  logoUrl?: string | null;
  logoText?: string | null;
  coverImageUrl?: string | null;
  quote?: string | null;
  quoteAuthor?: string | null;
  heading?: string | null;
  subheading?: string | null;
  signUpUrl?: string | null;
};
