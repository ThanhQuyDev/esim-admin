'use client';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { parseAsStringLiteral, useQueryState } from 'nuqs';
import { USER_TAB_DEFAULT, USER_TAB_VALUES, type UserTab } from './user-tab-config';

const tabParser = parseAsStringLiteral(USER_TAB_VALUES).withDefault(USER_TAB_DEFAULT);

export function useUsersTab() {
  return useQueryState('tab', tabParser.withOptions({ shallow: true }));
}

export function UsersTabs() {
  const [tab, setTab] = useUsersTab();

  return (
    <Tabs value={tab} onValueChange={(value) => setTab(value as UserTab)}>
      <TabsList>
        <TabsTrigger value='user'>Người dùng</TabsTrigger>
        <TabsTrigger value='admin'>Quản trị viên</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
