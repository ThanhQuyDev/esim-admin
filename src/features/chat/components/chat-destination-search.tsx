'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Icons } from '@/components/icons';
import { apiClient } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import type { Destination } from '@/features/destinations/api/types';
import type { Region } from '@/features/regions/api/types';
import { useChatStore } from '../utils/store';
import {
  destinationLabel,
  destinationMessage,
  destinationUrl,
  mergeDestinationResults,
  type ChatLinkLang,
  type LinkableDestination
} from '../utils/destination-link';

const MIN_QUERY = 2;
const PER_SOURCE = 6;

function searchParams(query: string): string {
  const filters = JSON.stringify({ search: query, isActive: true });
  return `filters=${encodeURIComponent(filters)}&limit=${PER_SOURCE}`;
}

/**
 * Find a country / region and send its page into the conversation (#050).
 *
 * "Xem" opens the page in a new tab so the admin can check it first; "Gửi"
 * posts the link without touching what the admin is typing. The chat does not
 * know the customer's language, so the admin picks which site to link.
 */
export function ChatDestinationSearch() {
  const selectedRoomId = useChatStore((s) => s.selectedRoomId);
  const sendQuickMessage = useChatStore((s) => s.sendQuickMessage);

  const [query, setQuery] = useState('');
  const [lang, setLang] = useState<ChatLinkLang>('vi');
  const [results, setResults] = useState<LinkableDestination[]>([]);
  const [loading, setLoading] = useState(false);
  const [sentKey, setSentKey] = useState<string | null>(null);

  useEffect(() => {
    const q = query.trim();
    if (q.length < MIN_QUERY) {
      setResults([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    const timer = window.setTimeout(() => {
      Promise.all([
        apiClient<{ data: Destination[] }>(`/destinations?${searchParams(q)}`)
          .then((res) => res.data ?? [])
          .catch(() => [] as Destination[]),
        apiClient<{ data: Region[] }>(`/regions?${searchParams(q)}`)
          .then((res) => res.data ?? [])
          .catch(() => [] as Region[])
      ])
        .then(([destinations, regions]) => {
          if (!cancelled) setResults(mergeDestinationResults(destinations, regions));
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query]);

  if (!selectedRoomId) return null;

  const send = (item: LinkableDestination) => {
    const text = destinationMessage(item, lang);
    if (!text) {
      toast.error('Điểm đến này chưa có đường link');
      return;
    }
    if (sendQuickMessage(text)) {
      setSentKey(`${item.kind}-${item.id}-${lang}`);
      toast.success(`Đã gửi link ${destinationLabel(item, lang)} vào cuộc trò chuyện`);
    } else {
      toast.error('Chat chưa kết nối, chưa gửi được link');
    }
  };

  const trimmed = query.trim();

  return (
    <Card className='border-border/50' data-testid='chat-destination-search'>
      <CardHeader className='pb-2'>
        <CardTitle className='flex items-center gap-2 text-sm font-medium'>
          <Icons.worldMap className='h-4 w-4' />
          Gửi link điểm đến
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-2'>
        <div className='relative'>
          <Icons.search className='text-muted-foreground absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2' />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder='Tìm quốc gia / khu vực...'
            className='h-8 pl-8 text-xs'
            aria-label='Tìm quốc gia hoặc khu vực'
          />
        </div>

        <div
          className='flex items-center gap-1 text-xs'
          role='group'
          aria-label='Ngôn ngữ đường link'
        >
          <span className='text-muted-foreground mr-1'>Link:</span>
          {(['vi', 'en'] as const).map((option) => (
            <Button
              key={option}
              type='button'
              size='sm'
              variant={lang === option ? 'default' : 'outline'}
              className='h-6 px-2 text-[11px]'
              aria-pressed={lang === option}
              onClick={() => setLang(option)}
            >
              {option === 'vi' ? 'Tiếng Việt' : 'English'}
            </Button>
          ))}
        </div>

        {trimmed.length > 0 && trimmed.length < MIN_QUERY && (
          <p className='text-muted-foreground text-xs'>Nhập ít nhất {MIN_QUERY} ký tự.</p>
        )}

        {loading && (
          <div className='space-y-2'>
            <Skeleton className='h-12 w-full' />
            <Skeleton className='h-12 w-full' />
          </div>
        )}

        {!loading && trimmed.length >= MIN_QUERY && results.length === 0 && (
          <p className='text-muted-foreground text-xs'>Không tìm thấy điểm đến nào.</p>
        )}

        {!loading && results.length > 0 && (
          <ul className='space-y-1.5'>
            {results.map((item) => {
              const url = destinationUrl(item, lang);
              const key = `${item.kind}-${item.id}`;
              const justSent = sentKey === `${key}-${lang}`;
              return (
                <li
                  key={key}
                  data-testid={`chat-destination-${key}`}
                  className='bg-muted/30 space-y-1.5 rounded-lg border p-2 text-xs'
                >
                  <div className='flex items-center gap-2'>
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.imageUrl}
                        alt=''
                        className='h-4 w-6 shrink-0 rounded-sm object-cover'
                        loading='lazy'
                      />
                    ) : (
                      <Icons.worldMap className='text-muted-foreground h-4 w-4 shrink-0' />
                    )}
                    <span className='min-w-0 flex-1 truncate font-medium'>
                      {destinationLabel(item, lang)}
                    </span>
                    <span className='text-muted-foreground shrink-0 text-[10px]'>
                      {item.kind === 'destination' ? 'Quốc gia' : 'Khu vực'}
                    </span>
                  </div>
                  <div className='flex gap-1.5'>
                    <Button
                      asChild
                      size='sm'
                      variant='outline'
                      className={cn(
                        'h-7 flex-1 px-2 text-[11px]',
                        !url && 'pointer-events-none opacity-50'
                      )}
                    >
                      <a
                        href={url ?? undefined}
                        target='_blank'
                        rel='noopener noreferrer'
                        aria-label={`Xem trang ${destinationLabel(item, lang)} ở tab mới`}
                      >
                        <Icons.externalLink className='mr-1 h-3 w-3' />
                        Xem
                      </a>
                    </Button>
                    <Button
                      type='button'
                      size='sm'
                      className='h-7 flex-1 px-2 text-[11px]'
                      disabled={!url}
                      onClick={() => send(item)}
                      aria-label={`Gửi link ${destinationLabel(item, lang)} vào cuộc trò chuyện`}
                    >
                      {justSent ? (
                        <Icons.check className='mr-1 h-3 w-3' />
                      ) : (
                        <Icons.send className='mr-1 h-3 w-3' />
                      )}
                      {justSent ? 'Đã gửi' : 'Gửi'}
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
