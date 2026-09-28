'use client';

/**
 * The two grains of "Hoa hồng & Đối soát".
 *
 * "Đối soát theo kỳ" (#065) is a row per partner per month — the grain an
 * admin signs off at. "Hoa hồng theo đơn" is a row per order, which is where a
 * partner's question about one missing commission gets answered. Same page,
 * because they are the same money looked at from two distances.
 */

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { CommissionsView } from './commissions-view';
import { ReconciliationsView } from './reconciliations-view';

export function CommissionsSwitch() {
  return (
    <Tabs defaultValue='reconciliation' className='space-y-4'>
      <TabsList>
        <TabsTrigger value='reconciliation'>Đối soát theo kỳ</TabsTrigger>
        <TabsTrigger value='commissions'>Hoa hồng theo đơn</TabsTrigger>
      </TabsList>
      <TabsContent value='reconciliation'>
        <ReconciliationsView />
      </TabsContent>
      <TabsContent value='commissions'>
        <CommissionsView />
      </TabsContent>
    </Tabs>
  );
}
