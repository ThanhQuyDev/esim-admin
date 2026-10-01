import { redirect } from 'next/navigation';

/**
 * Merged into the "Nhà cung cấp" page as a tab (#005). Kept as a redirect so
 * bookmarks and older links still land on the right screen.
 */
export default function ProviderSurchargesPage() {
  redirect('/dashboard/providers?tab=surcharges');
}
