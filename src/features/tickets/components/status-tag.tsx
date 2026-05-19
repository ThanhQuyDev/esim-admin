import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getTicketStatusOption } from '../constants/status';
import type { TicketStatus } from '../api/types';

interface StatusTagProps {
  status: TicketStatus;
  className?: string;
}

export function StatusTag({ status, className }: StatusTagProps) {
  const opt = getTicketStatusOption(status);
  return (
    <Badge variant='outline' className={cn('font-medium', opt.className, className)}>
      {opt.label}
    </Badge>
  );
}
