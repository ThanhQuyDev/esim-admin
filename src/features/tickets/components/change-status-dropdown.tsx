'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import { TICKET_STATUS_OPTIONS } from '../constants/status';
import { updateTicketStatusMutation } from '../api/mutations';
import type { TicketStatus } from '../api/types';

interface ChangeStatusDropdownProps {
  id: number;
  status: TicketStatus;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  align?: 'start' | 'center' | 'end';
  asMenuItems?: boolean;
  onChanged?: () => void;
}

export function ChangeStatusDropdown({
  id,
  status,
  variant = 'outline',
  size = 'sm',
  align = 'end',
  onChanged
}: ChangeStatusDropdownProps) {
  const mutation = useMutation({
    ...updateTicketStatusMutation,
    onSuccess: () => {
      toast.success('Đã cập nhật trạng thái');
      onChanged?.();
    },
    onError: (e) => toast.error(e.message || 'Cập nhật thất bại')
  });

  const handleSelect = (next: TicketStatus) => {
    if (next === status || mutation.isPending) return;
    mutation.mutate({ id, values: { status: next } });
  };

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} disabled={mutation.isPending}>
          {mutation.isPending ? (
            <Icons.spinner className='mr-2 h-4 w-4 animate-spin' />
          ) : (
            <Icons.edit className='mr-2 h-4 w-4' />
          )}
          Đổi trạng thái
          <Icons.chevronDown className='ml-2 h-4 w-4' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className='w-48'>
        <DropdownMenuLabel>Đổi sang</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {TICKET_STATUS_OPTIONS.map((opt) => (
          <DropdownMenuItem
            key={opt.value}
            disabled={opt.value === status}
            onClick={() => handleSelect(opt.value)}
            className='flex items-center justify-between gap-2'
          >
            <span className={cn('h-2 w-2 rounded-full', opt.className)} aria-hidden />
            <span className='flex-1'>{opt.label}</span>
            {opt.value === status && <Icons.check className='h-4 w-4' />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
