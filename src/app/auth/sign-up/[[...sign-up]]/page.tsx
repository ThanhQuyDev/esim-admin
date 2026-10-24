import { redirect } from 'next/navigation';

/**
 * No self-made accounts on the admin console or the partner portal (vande
 * #009): this page created bare users anyone could reach by typing the URL,
 * and they piled up as "Inactive" in the user table. Partners apply through
 * the storefront form; the old address now lands on sign-in.
 */
export default function Page() {
  redirect('/auth/sign-in');
}
