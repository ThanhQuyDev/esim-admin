'use client';

/**
 * The name a partner is called by (doitac-0911 #012): a company by its own
 * name everywhere in the portal, a person by theirs — the same rule as the
 * emails and the admin's lists.
 */

import { useQuery } from '@tanstack/react-query';

import { IS_PARTNER_PORTAL } from '@/config/app-mode';

import { myProfileQueryOptions } from '../api/queries';

export function partnerDisplayName(
  partner:
    | {
        legalType?: string | null;
        companyName?: string | null;
        contactName?: string | null;
      }
    | null
    | undefined
): string | null {
  if (!partner) return null;
  const company = partner.companyName?.trim();
  if (partner.legalType === 'company' && company) return company;
  return partner.contactName?.trim() || company || null;
}

/**
 * The signed-in account as the account menus show it: in the partner portal
 * its name is the partner's, so a company reads as the company.
 */
export function usePortalAccount<T extends { firstName?: string | null; lastName?: string | null }>(
  user: T | undefined | null
): T | undefined | null {
  const { data: partner } = useQuery({
    ...myProfileQueryOptions(),
    enabled: IS_PARTNER_PORTAL
  });
  const name = IS_PARTNER_PORTAL ? partnerDisplayName(partner) : null;
  if (!user || !name) return user;
  return { ...user, firstName: name, lastName: '' };
}
