import { redirect } from 'next/navigation';

/**
 * "Yêu cầu nạp ký quỹ" now lives on "Tài chính", beside the withdrawals
 * (vande #067). Old links and bookmarks land there, on the deposits.
 */
export default function DepositRequestsPage() {
  redirect('/dashboard/partners/payouts?type=deposit');
}
