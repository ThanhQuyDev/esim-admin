'use client';

import type { ReactNode } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { parseAsStringLiteral, useQueryState } from 'nuqs';
import {
  PROVIDER_TAB_DEFAULT,
  PROVIDER_TAB_LABELS,
  PROVIDER_TAB_VALUES,
  type ProviderTab
} from './provider-tab-config';

const tabParser = parseAsStringLiteral(PROVIDER_TAB_VALUES).withDefault(PROVIDER_TAB_DEFAULT);

export function useProvidersTab() {
  return useQueryState('tab', tabParser.withOptions({ shallow: true }));
}

/**
 * Tab shell for the "Nhà cung cấp" page.
 *
 * The three panes are server components that prefetch their own query, so they
 * are passed in as props rather than rendered here; this component only decides
 * which one is on screen.
 */
export function ProvidersTabs({
  surcharges,
  deposits,
  salesStatus
}: {
  surcharges: ReactNode;
  deposits: ReactNode;
  salesStatus: ReactNode;
}) {
  const [tab, setTab] = useProvidersTab();

  return (
    <div className='flex flex-1 flex-col gap-4'>
      <Tabs value={tab} onValueChange={(value) => setTab(value as ProviderTab)}>
        <TabsList>
          {PROVIDER_TAB_VALUES.map((value) => (
            <TabsTrigger key={value} value={value}>
              {PROVIDER_TAB_LABELS[value]}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {tab === 'surcharges' ? surcharges : null}
      {tab === 'deposits' ? deposits : null}
      {tab === 'sales-status' ? salesStatus : null}
    </div>
  );
}

/** The "Thêm ký quỹ" button belongs to the deposits tab only. */
export function ProvidersHeaderAction({ deposits }: { deposits: ReactNode }) {
  const [tab] = useProvidersTab();
  return tab === 'deposits' ? <>{deposits}</> : null;
}
