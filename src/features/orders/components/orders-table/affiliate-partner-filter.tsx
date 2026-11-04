'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';

type AffiliatePartner = {
  id: number;
  companyName: string | null;
  contactName: string;
  email?: string | null;
};

function plain(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase();
}

function partnerName(partner: AffiliatePartner): string {
  return `${partner.companyName || partner.contactName} (#${partner.id})`;
}

/**
 * The affiliate filter, with a box to find one among many (vande-0411 #048).
 * Accents are optional in the box: "tho" finds "Thọ".
 */
export function AffiliatePartnerFilter({
  partners,
  value,
  onChange
}: {
  partners: AffiliatePartner[];
  value: string | null;
  onChange: (partnerId: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = partners.find((partner) => String(partner.id) === value);
  const pick = (partnerId: string | null) => {
    onChange(partnerId);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          role='combobox'
          aria-expanded={open}
          aria-label='Lọc theo đối tác Affiliate'
          className='w-60 justify-between font-normal'
          data-testid='orders-affiliate'
        >
          <span className='truncate'>
            {selected
              ? partnerName(selected)
              : value
                ? `Đối tác #${value}`
                : 'Đối tác Affiliate: Tất cả'}
          </span>
          <Icons.chevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-80 p-0' align='start'>
        <Command filter={(itemValue, search) => (plain(itemValue).includes(plain(search)) ? 1 : 0)}>
          <CommandInput placeholder='Tìm tên, email hoặc ID đối tác...' />
          <CommandList>
            <CommandEmpty>Không tìm thấy đối tác</CommandEmpty>
            <CommandGroup>
              <CommandItem value='Tất cả' onSelect={() => pick(null)}>
                <Icons.check className={cn('mr-2 h-4 w-4', value ? 'opacity-0' : 'opacity-100')} />
                Tất cả
              </CommandItem>
              {partners.map((partner) => (
                <CommandItem
                  key={partner.id}
                  value={`${partner.id} ${partner.companyName ?? ''} ${partner.contactName} ${partner.email ?? ''}`}
                  onSelect={() => pick(String(partner.id))}
                >
                  <Icons.check
                    className={cn(
                      'mr-2 h-4 w-4',
                      String(partner.id) === value ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <span className='truncate'>{partnerName(partner)}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
