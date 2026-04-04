'use client';

import { useQuery } from '@tanstack/react-query';
import { authMeQueryOptions } from '@/features/auth/api/queries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserAvatarProfile } from '@/components/user-avatar-profile';

export default function ProfileViewPage() {
  const { data: user } = useQuery(authMeQueryOptions);

  if (!user) return null;

  return (
    <div className='flex w-full flex-col gap-4 p-4'>
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <UserAvatarProfile className='h-16 w-16' showInfo user={user} />
          <div className='grid gap-2'>
            <div>
              <span className='text-muted-foreground text-sm'>Email</span>
              <p>{user.email}</p>
            </div>
            <div>
              <span className='text-muted-foreground text-sm'>Role</span>
              <p className='capitalize'>{user.role?.name}</p>
            </div>
            <div>
              <span className='text-muted-foreground text-sm'>Status</span>
              <p className='capitalize'>{user.status?.name}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
