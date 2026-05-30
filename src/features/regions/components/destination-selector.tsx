'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { destinationsQueryOptions } from '@/features/destinations/api/queries';
import type { Destination } from '@/features/destinations/api/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command';
import { cn } from '@/lib/utils';

interface DestinationSelectorProps {
  selectedIds: number[];
  onChange: (ids: number[]) => void;
  initialDestinations?: Destination[];
}

export function DestinationSelector({
  selectedIds,
  onChange,
  initialDestinations = []
}: DestinationSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const { data } = useQuery({
    ...destinationsQueryOptions({ page: 1, limit: 250 }),
    staleTime: 5 * 60 * 1000
  });

  const allDestinations = useMemo(() => {
    const map = new Map<number, Destination>();
    for (const d of initialDestinations) {
      map.set(d.id, d);
    }
    for (const d of data?.data ?? []) {
      map.set(d.id, d);
    }
    return Array.from(map.values());
  }, [data, initialDestinations]);

  const filteredDestinations = useMemo(() => {
    if (!search.trim()) return allDestinations;
    const q = search.toLowerCase();
    return allDestinations.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.countryCode?.toLowerCase().includes(q) ||
        d.slug?.toLowerCase().includes(q)
    );
  }, [allDestinations, search]);

  const destinationMap = useMemo(() => {
    const map = new Map<number, Destination>();
    for (const d of allDestinations) {
      map.set(d.id, d);
    }
    return map;
  }, [allDestinations]);

  const toggleDestination = (id: number) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((i) => i !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const removeDestination = (id: number) => {
    onChange(selectedIds.filter((i) => i !== id));
  };

  return (
    <div className='space-y-2'>
      <label className='text-sm font-medium'>Destinations</label>

      {selectedIds.length > 0 && (
        <div className='flex flex-wrap gap-1.5'>
          {selectedIds.map((id) => {
            const dest = destinationMap.get(id);
            return (
              <Badge key={id} variant='secondary' className='gap-1 pr-1'>
                {dest?.flagUrl && (
                  <img src={dest.flagUrl} alt='' className='h-3 w-4 rounded-sm object-cover' />
                )}
                <span className='max-w-[120px] truncate text-xs'>{dest?.name ?? `#${id}`}</span>
                <button
                  type='button'
                  className='ml-0.5 rounded-sm p-0.5 hover:bg-muted'
                  onClick={() => removeDestination(id)}
                >
                  <Icons.close className='h-3 w-3' />
                </button>
              </Badge>
            );
          })}
        </div>
      )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button type='button' variant='outline' size='sm' className='w-full justify-start'>
            <Icons.search className='mr-2 h-4 w-4' />
            <span className='text-muted-foreground'>
              {selectedIds.length > 0
                ? `${selectedIds.length} destination đã chọn`
                : 'Tìm và chọn destination...'}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className='w-[320px] p-0' align='start'>
          <Command shouldFilter={false}>
            <CommandInput
              placeholder='Tìm destination...'
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              <CommandEmpty>Không tìm thấy destination.</CommandEmpty>
              <CommandGroup>
                {filteredDestinations.map((dest) => {
                  const isSelected = selectedIds.includes(dest.id);
                  return (
                    <CommandItem
                      key={dest.id}
                      value={String(dest.id)}
                      onSelect={() => toggleDestination(dest.id)}
                    >
                      <div
                        className={cn(
                          'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border',
                          isSelected
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-muted-foreground'
                        )}
                      >
                        {isSelected && <Icons.check className='h-3 w-3' />}
                      </div>
                      {dest.flagUrl && (
                        <img
                          src={dest.flagUrl}
                          alt=''
                          className='mr-2 h-4 w-5 rounded-sm object-cover'
                        />
                      )}
                      <span className='truncate'>{dest.name}</span>
                      {dest.countryCode && (
                        <span className='ml-auto text-xs text-muted-foreground'>
                          {dest.countryCode}
                        </span>
                      )}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
