'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import {
  CHAT_FILE_ACCEPT,
  CHAT_FILE_MAX_SIZE,
  isAcceptedChatFile,
  uploadChatFileToCloudinary,
  type ChatUploadResult
} from '../api/upload';

interface ChatComposerProps {
  draft: string;
  onDraftChange: (text: string) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>, attachment?: ChatUploadResult) => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ChatComposer({ draft, onDraftChange, onSubmit }: ChatComposerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<ChatUploadResult | null>(null);

  // Manage object URL lifecycle for the preview
  useEffect(() => {
    if (!pendingFile) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(pendingFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [pendingFile]);

  const resetAttachment = () => {
    setPendingFile(null);
    setUploadResult(null);
    setUploadProgress(0);
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFilePicked = async (file: File) => {
    if (!isAcceptedChatFile(file)) {
      toast.error('Chỉ hỗ trợ tệp hình ảnh hoặc video');
      return;
    }
    if (file.size > CHAT_FILE_MAX_SIZE) {
      toast.error('Tệp vượt quá 25MB');
      return;
    }

    setPendingFile(file);
    setUploadResult(null);
    setUploadProgress(0);
    setIsUploading(true);

    try {
      const result = await uploadChatFileToCloudinary(file, (percent) => {
        setUploadProgress(percent);
      });
      setUploadResult(result);
      setUploadProgress(100);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Tải tệp lên thất bại';
      toast.error(message);
      resetAttachment();
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      void handleFilePicked(file);
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    if (isUploading) {
      e.preventDefault();
      return;
    }
    // Caller decides whether the message is empty; we just forward the attachment
    e.preventDefault();
    if (!draft.trim() && !uploadResult) return;

    onSubmit(e, uploadResult ?? undefined);
    resetAttachment();
  };

  const isImage = pendingFile?.type.startsWith('image/');
  const isVideo = pendingFile?.type.startsWith('video/');
  const canSubmit = !isUploading && (draft.trim().length > 0 || !!uploadResult);

  return (
    <form onSubmit={handleSubmit} className='space-y-2 sm:space-y-3' aria-label='Khung trả lời'>
      <label htmlFor='messenger-editor' className='sr-only'>
        Viết tin nhắn
      </label>

      {pendingFile && (
        <div
          className='border-border/40 bg-muted/40 flex items-center gap-3 rounded-2xl border p-2 sm:p-3'
          role='group'
          aria-label='Tệp đính kèm'
        >
          <div className='bg-background/80 relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border sm:h-16 sm:w-16'>
            {isImage && previewUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt={pendingFile.name} className='h-full w-full object-cover' />
            )}
            {isVideo && previewUrl && (
              <video src={previewUrl} muted className='h-full w-full object-cover' />
            )}
            {!isImage && !isVideo && (
              <div className='text-muted-foreground flex h-full w-full items-center justify-center'>
                <Icons.page className='h-5 w-5' />
              </div>
            )}
            {isUploading && (
              <div className='bg-background/70 absolute inset-0 flex items-center justify-center'>
                <Spinner className='text-foreground h-4 w-4' />
              </div>
            )}
          </div>

          <div className='min-w-0 flex-1'>
            <p className='text-foreground truncate text-xs font-medium sm:text-sm'>
              {pendingFile.name}
            </p>
            <p className='text-muted-foreground text-[0.7rem] sm:text-xs'>
              {formatBytes(pendingFile.size)}
              {isUploading && ` · Đang tải lên ${uploadProgress}%`}
              {!isUploading && uploadResult && ' · Sẵn sàng gửi'}
            </p>
            {isUploading && (
              <div
                className='bg-muted mt-1.5 h-1 w-full overflow-hidden rounded-full'
                role='progressbar'
                aria-valuenow={uploadProgress}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className='bg-primary h-full transition-all'
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}
          </div>

          <Button
            type='button'
            variant='ghost'
            size='icon'
            className='text-muted-foreground hover:text-foreground size-8 shrink-0 rounded-full'
            aria-label='Xóa tệp đính kèm'
            onClick={resetAttachment}
          >
            <Icons.close className='h-4 w-4' />
          </Button>
        </div>
      )}

      <div className='border-border/40 bg-background/80 flex items-end gap-2 rounded-2xl border p-3 backdrop-blur sm:gap-3 sm:rounded-3xl sm:p-4'>
        <div className='min-w-0 flex-1'>
          <Textarea
            id='messenger-editor'
            value={draft}
            onChange={(e) => onDraftChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (canSubmit) {
                  const form = e.currentTarget.closest('form');
                  form?.requestSubmit();
                }
              }
            }}
            placeholder='Nhập tin nhắn... (Enter để gửi, Shift+Enter để xuống dòng)'
            rows={2}
            className='text-foreground placeholder:text-muted-foreground/70 min-h-[3rem] w-full resize-none border-none bg-transparent text-xs focus-visible:ring-0 focus-visible:outline-none sm:min-h-[4rem] sm:text-sm'
            aria-label='Ô nhập tin nhắn'
          />
        </div>
        <div className='flex shrink-0 flex-col items-end gap-1.5 sm:w-24 sm:gap-2'>
          <input
            ref={fileInputRef}
            type='file'
            accept={CHAT_FILE_ACCEPT}
            className='hidden'
            aria-hidden='true'
            onChange={handleFileChange}
          />
          <Button
            type='button'
            variant='ghost'
            size='icon'
            className={cn(
              'border-border/40 bg-background/70 text-muted-foreground hover:bg-muted/50 focus-visible:ring-primary/40 focus-visible:ring-offset-background size-8 rounded-full border transition focus-visible:ring-2 focus-visible:ring-offset-2 sm:size-10',
              pendingFile && 'opacity-50'
            )}
            aria-label='Đính kèm hình ảnh hoặc video'
            disabled={!!pendingFile || isUploading}
            onClick={() => fileInputRef.current?.click()}
          >
            <Icons.paperclip className='h-3.5 w-3.5 sm:h-4 sm:w-4' />
          </Button>
          <Button
            type='submit'
            size='icon'
            className='bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-primary/40 focus-visible:ring-offset-background size-8 rounded-full shadow-lg transition focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 sm:size-10'
            disabled={!canSubmit}
            aria-label='Gửi tin nhắn'
          >
            {isUploading ? (
              <Spinner className='h-3.5 w-3.5 sm:h-4 sm:w-4' />
            ) : (
              <Icons.send className='h-3.5 w-3.5 sm:h-4 sm:w-4' aria-hidden='true' />
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
