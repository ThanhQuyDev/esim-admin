'use client';

/**
 * Which order list a partner sees (#046).
 *
 * "Đơn hàng" means two different things. For a marketing partner it is the
 * orders somebody else placed that were credited to them; for a distribution
 * partner it is the orders they placed themselves. Same menu item, same route,
 * so the choice is made here rather than asking the partner to know which of
 * two screens applies to them.
 */

import { useQuery } from '@tanstack/react-query';

import { myProfileQueryOptions } from '../api/queries';
import { PortalOrdersView } from './portal-orders-view';
import { PortalPurchasesView } from './portal-purchases-view';

export function PortalOrdersSwitch() {
  const { data: me, isLoading } = useQuery(myProfileQueryOptions());

  // Both screens are tables of money; flashing the wrong one would be worse
  // than a moment of nothing.
  if (isLoading || !me) return null;

  return me.partnerType === 'distribution' ? <PortalPurchasesView /> : <PortalOrdersView />;
}
