import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface UserAvatarProfileProps {
  className?: string;
  showInfo?: boolean;
  user: {
    photo?: { path: string } | null;
    firstName?: string;
    lastName?: string;
    email?: string;
  } | null;
}

export function UserAvatarProfile({ className, showInfo = false, user }: UserAvatarProfileProps) {
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ');
  const initials = fullName
    ? fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : 'CN';

  return (
    <div className='flex items-center gap-2'>
      <Avatar className={className}>
        <AvatarImage src={user?.photo?.path || ''} alt={fullName} />
        <AvatarFallback className='rounded-lg'>{initials}</AvatarFallback>
      </Avatar>

      {showInfo && (
        <div className='grid flex-1 text-left text-sm leading-tight'>
          <span className='truncate font-semibold'>{fullName}</span>
          <span className='truncate text-xs'>{user?.email || ''}</span>
        </div>
      )}
    </div>
  );
}
