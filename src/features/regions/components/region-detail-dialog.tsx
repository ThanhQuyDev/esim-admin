'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQuery } from '@tanstack/react-query';
import { regionQueryOptions } from '../api/queries';
import type { Region } from '../api/types';
import { Skeleton } from '@/components/ui/skeleton';

interface RegionDetailDialogProps {
  region: Region;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RegionDetailDialog({ region, open, onOpenChange }: RegionDetailDialogProps) {
  const { data, isLoading } = useQuery({
    ...regionQueryOptions(region.id),
    enabled: open
  });

  const countries = data?.destinations ?? region.destinations ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-3'>
            {region.avatarUrl && (
              <img
                src={region.avatarUrl}
                alt={region.name}
                className='h-8 w-8 rounded-full object-cover'
              />
            )}
            {region.name}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className='space-y-3'>
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className='h-10 w-full' />
            ))}
          </div>
        ) : countries.length === 0 ? (
          <p className='text-muted-foreground py-8 text-center text-sm'>
            No countries in this region.
          </p>
        ) : (
          <ScrollArea className='max-h-[400px]'>
            <div className='space-y-1'>
              {countries.map((country) => (
                <div
                  key={country.id}
                  className='hover:bg-muted flex items-center gap-3 rounded-md px-3 py-2'
                >
                  {country.flagUrl ? (
                    <img
                      src={country.flagUrl}
                      alt={country.name}
                      className='h-5 w-7 rounded object-cover'
                    />
                  ) : (
                    <div className='bg-muted h-5 w-7 rounded' />
                  )}
                  <span className='text-sm font-medium'>{country.name}</span>
                  {country.countryCode && (
                    <span className='text-muted-foreground ml-auto text-xs'>
                      {country.countryCode}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
