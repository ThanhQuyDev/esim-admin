import { redirect } from 'next/navigation';
import { PARTNER_SIGN_UP_URL } from '@/features/auth/api/auth-page-settings';

/**
 * Partners apply on the storefront form, which asks for the partnership type
 * (tiếp thị / phân phối / tích hợp API) — the customer does not want the
 * partner portal's address made public (#053, test round 4). This old address
 * forwards there, including from saved "Đăng ký" links.
 */
export default function RegisterPartnerPage() {
  redirect(PARTNER_SIGN_UP_URL);
}
