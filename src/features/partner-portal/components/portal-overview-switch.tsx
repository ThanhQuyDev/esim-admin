'use client';

/**
 * Which dashboard a partner sees (#043).
 *
 * The two kinds of partner are in different businesses — one earns commission on
 * orders somebody else placed, the other buys eSIMs and resells them — so they
 * get different figures at the same address. Deciding here rather than in the
 * page keeps `/dashboard/portal/overview` the one place either of them lands,
 * including from a bookmark or the sidebar.
 */

import { useQuery } from '@tanstack/react-query';

import { myProfileQueryOptions } from '../api/queries';
import { MustChangePasswordGate } from './must-change-password-gate';
import { PortalDistributionOverviewView } from './portal-distribution-overview-view';
import { PortalOverviewView } from './portal-overview-view';

export function PortalOverviewSwitch() {
  const { data: me, isLoading } = useQuery(myProfileQueryOptions());

  // Say nothing until the profile is known: flashing the wrong dashboard would
  // be wrong half the time, and both of these are full of numbers.
  if (isLoading || !me) return null;

  return (
    <>
      {/* Sends a partner on a temporary password to the profile page (#059). */}
      <MustChangePasswordGate />
      {me.partnerType === 'distribution' ? (
        <PortalDistributionOverviewView />
      ) : (
        <PortalOverviewView />
      )}
    </>
  );
}
