'use client';

/**
 * Screens that only apply to some kinds of partner (#013).
 *
 * A marketing partner never buys eSIMs to resell — they earn commission on
 * orders placed on esim.vn — so a deposit wallet and a storefront brand are not
 * "empty" for them, they are meaningless. Hiding the menu alone would not do:
 * the route still answered, so a bookmark or a stray link dropped them on a
 * screen asking them to top up a wallet they will never spend from.
 */

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Icons } from '@/components/icons';

import { myProfileQueryOptions } from '../api/queries';
import type { PartnerType } from '../api/types';

interface PortalFeatureGateProps {
  /** Partner types this screen is meant for. */
  allow: PartnerType[];
  /** What the screen is, for the explanation shown to everyone else. */
  title: string;
  description: string;
  children: React.ReactNode;
}

export function PortalFeatureGate({ allow, title, description, children }: PortalFeatureGateProps) {
  const { data: me, isLoading } = useQuery(myProfileQueryOptions());

  // Say nothing until the profile is known: flashing either the screen or the
  // refusal would be wrong half the time.
  if (isLoading || !me) return null;

  if (allow.includes(me.partnerType)) return <>{children}</>;

  return (
    <Card>
      <CardHeader>
        <div className='bg-muted text-muted-foreground flex size-10 items-center justify-center rounded-full'>
          <Icons.info className='size-5' />
        </div>
        <CardTitle className='mt-2'>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className='flex flex-wrap gap-2'>
        <Button asChild size='sm'>
          <Link href='/dashboard/portal/commissions'>Xem hoa hồng của bạn</Link>
        </Button>
        <Button asChild size='sm' variant='outline'>
          <Link href='/dashboard/portal/overview'>Về trang tổng quan</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
