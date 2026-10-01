import { redirect } from 'next/navigation';

/**
 * Merged into the "Nhà cung cấp" page as a tab (#005). Kept as a redirect so
 * bookmarks and older links still land on the right screen.
 */
export default function ProviderDepositsPage() {
  redirect('/dashboard/providers?tab=deposits');
}
