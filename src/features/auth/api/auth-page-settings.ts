import { APP_MODE, type AppMode } from '@/config/app-mode';
import type { AuthPageSetting } from '@/features/auth-pages/api/types';

/**
 * Sign-in page copy (#006).
 *
 * The CMS row wins, and these are what a deployment shows when the row is empty
 * or the settings call fails. They exist so the sign-in page can never be broken
 * — or thrown back to the starter kit's "Random Dude" placeholder — by a CMS
 * request that did not answer.
 */
export type AuthPageContent = {
  logoUrl: string | null;
  logoText: string;
  coverImageUrl: string | null;
  quote: string;
  quoteAuthor: string;
  heading: string;
  subheading: string;
};

const DEFAULTS: Record<AppMode, AuthPageContent> = {
  admin: {
    logoUrl: null,
    logoText: 'esim.vn',
    coverImageUrl: null,
    quote: 'Quản lý gói cước, đơn hàng và eSIM của toàn hệ thống tại một nơi.',
    quoteAuthor: 'esim.vn',
    heading: 'Đăng nhập quản trị',
    subheading: 'Nhập email và mật khẩu quản trị để vào hệ thống.'
  },
  partner: {
    logoUrl: null,
    logoText: 'esim.vn — Cổng đối tác',
    coverImageUrl: null,
    quote: 'Bán eSIM cho khách của bạn, theo dõi hoa hồng và đối soát minh bạch theo từng đơn.',
    quoteAuthor: 'esim.vn',
    heading: 'Đăng nhập đối tác',
    subheading: 'Nhập email và mật khẩu bạn đã đăng ký để vào cổng đối tác.'
  }
};

export function defaultAuthPageContent(mode: AppMode = APP_MODE): AuthPageContent {
  return DEFAULTS[mode];
}

/** Field by field, so one blank column falls back on its own. */
export function mergeAuthPageContent(
  setting: Partial<AuthPageSetting> | null | undefined,
  mode: AppMode = APP_MODE
): AuthPageContent {
  const base = DEFAULTS[mode];
  if (!setting) return base;
  return {
    logoUrl: setting.logoUrl?.trim() || base.logoUrl,
    logoText: setting.logoText?.trim() || base.logoText,
    coverImageUrl: setting.coverImageUrl?.trim() || base.coverImageUrl,
    quote: setting.quote?.trim() || base.quote,
    quoteAuthor: setting.quoteAuthor?.trim() || base.quoteAuthor,
    heading: setting.heading?.trim() || base.heading,
    subheading: setting.subheading?.trim() || base.subheading
  };
}

/**
 * Reads the branding for THIS deployment. Never throws: the caller renders the
 * defaults, because failing to load copy must not stop anyone signing in.
 */
export async function fetchAuthPageContent(mode: AppMode = APP_MODE): Promise<AuthPageContent> {
  try {
    const res = await fetch(`/api/auth-page-settings/${mode}`);
    if (!res.ok) return DEFAULTS[mode];
    const json: { data?: Partial<AuthPageSetting> } = await res.json();
    return mergeAuthPageContent(json?.data, mode);
  } catch {
    return DEFAULTS[mode];
  }
}
