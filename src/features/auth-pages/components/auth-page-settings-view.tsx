'use client';

import { useSuspenseQuery } from '@tanstack/react-query';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { parseAsStringLiteral, useQueryState } from 'nuqs';
import { authPageSettingsQueryOptions } from '../api/queries';
import { AuthPageSettingsForm } from './auth-page-settings-form';

const MODES = ['admin', 'partner'] as const;
const MODE_LABELS: Record<(typeof MODES)[number], string> = {
  admin: 'Trang quản trị',
  partner: 'Trang đối tác'
};

const tabParser = parseAsStringLiteral(MODES).withDefault('admin');

export function AuthPageSettingsView() {
  const { data } = useSuspenseQuery(authPageSettingsQueryOptions());
  const [mode, setMode] = useQueryState('mode', tabParser.withOptions({ shallow: true }));

  const setting = data.data.find((row) => row.mode === mode) ?? data.data[0];

  return (
    <div className='flex flex-1 flex-col gap-4'>
      <Tabs value={mode} onValueChange={(value) => setMode(value as (typeof MODES)[number])}>
        <TabsList>
          {MODES.map((value) => (
            <TabsTrigger key={value} value={value}>
              {MODE_LABELS[value]}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      {setting ? (
        // Remount per mode so the inputs reload from that row's saved values.
        <AuthPageSettingsForm key={setting.mode} setting={setting} />
      ) : null}
    </div>
  );
}

export function AuthPageSettingsSkeleton() {
  return (
    <div className='flex flex-1 animate-pulse flex-col gap-4'>
      <div className='bg-muted h-10 w-64 rounded' />
      <div className='bg-muted h-[520px] w-full rounded-lg' />
    </div>
  );
}
