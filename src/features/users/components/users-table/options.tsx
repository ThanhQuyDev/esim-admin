import type { User } from '../../api/types';

export const ROLE_OPTIONS = [
  { value: '1', label: 'Admin' },
  { value: '2', label: 'User' },
  { value: '3', label: 'Tác giả' }
];

export const TIER_LABELS: Record<User['membershipTier'], string> = {
  traveler: 'Du khách',
  silver: 'Du khách bạc',
  gold: 'Du khách vàng',
  platinum: 'Du khách bạch kim'
};

export const TIER_STYLES: Record<User['membershipTier'], string> = {
  traveler: 'border-sky-200 bg-sky-50 text-sky-700',
  silver: 'border-slate-300 bg-slate-100 text-slate-700',
  gold: 'border-amber-300 bg-amber-50 text-amber-700',
  platinum: 'border-violet-300 bg-violet-50 text-violet-700'
};

/** Lowest tier first, the order the ladder is read in (#037). */
export const TIER_ORDER: User['membershipTier'][] = ['traveler', 'silver', 'gold', 'platinum'];

export const TIER_OPTIONS = TIER_ORDER.map((tier) => ({
  value: tier,
  label: TIER_LABELS[tier]
}));

/** `status.id` as the backend seeds it: 1 = Active, 2 = Inactive (#037). */
export const USER_STATUS_OPTIONS = [
  { value: '1', label: 'Hoạt động' },
  { value: '2', label: 'Ngừng hoạt động' }
];
