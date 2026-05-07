'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { memo, useRef, useEffect, useCallback } from 'react';
import { Icons } from '@/components/icons';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface MinimalTiptapEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

const Toolbar = memo(function Toolbar({ editor }: { editor: ReturnType<typeof useEditor> }) {
  const [linkPopoverOpen, setLinkPopoverOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');

  const openLinkPopover = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href || '';
    setLinkUrl(previousUrl);
    setLinkPopoverOpen(true);
  }, [editor]);

  const saveLink = useCallback(() => {
    if (!editor) return;
    if (linkUrl === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run();
    }
    setLinkPopoverOpen(false);
  }, [editor, linkUrl]);

  const removeLink = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().extendMarkRange('link').unsetLink().run();
    setLinkPopoverOpen(false);
  }, [editor]);

  if (!editor) return null;

  return (
    <div className='flex flex-wrap items-center gap-1 border-b border-border p-1'>
      <ToggleGroup
        type='multiple'
        variant='outline'
        size='sm'
        value={[
          editor.isActive('bold') ? 'bold' : '',
          editor.isActive('italic') ? 'italic' : '',
          editor.isActive('underline') ? 'underline' : ''
        ].filter(Boolean)}
      >
        <ToggleGroupItem
          value='bold'
          aria-label='Bold'
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Icons.bold className='h-4 w-4' />
        </ToggleGroupItem>
        <ToggleGroupItem
          value='italic'
          aria-label='Italic'
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Icons.italic className='h-4 w-4' />
        </ToggleGroupItem>
        <ToggleGroupItem
          value='underline'
          aria-label='Underline'
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <Icons.underline className='h-4 w-4' />
        </ToggleGroupItem>
      </ToggleGroup>

      <Popover open={linkPopoverOpen} onOpenChange={setLinkPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant={editor.isActive('link') ? 'default' : 'ghost'}
            size='icon'
            className='h-8 w-8'
            onClick={openLinkPopover}
            aria-label='Link'
          >
            <Icons.link className='h-4 w-4' />
          </Button>
        </PopoverTrigger>
        <PopoverContent className='w-80 p-3' align='start'>
          <div className='space-y-3'>
            <p className='text-sm font-medium'>Chèn / sửa liên kết</p>
            <Input
              placeholder='https://example.com'
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveLink();
              }}
            />
            <div className='flex gap-2'>
              <Button size='sm' onClick={saveLink}>
                Lưu
              </Button>
              {editor.isActive('link') && (
                <Button size='sm' variant='destructive' onClick={removeLink}>
                  Gỡ liên kết
                </Button>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
});

import { useState } from 'react';

export function MinimalTiptapEditor({
  content,
  onChange,
  placeholder = 'Nhập mô tả...'
}: MinimalTiptapEditorProps) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const debounceTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        bold: {},
        italic: {},
        heading: false,
        bulletList: false,
        orderedList: false,
        blockquote: false,
        codeBlock: false,
        horizontalRule: false,
        strike: false,
        code: false
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline underline-offset-4'
        }
      }),
      Placeholder.configure({ placeholder })
    ],
    content,
    onUpdate: ({ editor }) => {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        onChangeRef.current(editor.getHTML());
      }, 300);
    }
  });

  useEffect(() => {
    return () => clearTimeout(debounceTimer.current);
  }, []);

  if (!editor) return null;

  return (
    <div className='overflow-hidden rounded-[0.5rem] bg-background shadow outline outline-1 outline-border'>
      <Toolbar editor={editor} />
      <EditorContent
        editor={editor}
        className={cn(
          'prose prose-sm max-w-none',
          '[&_.ProseMirror]:min-h-[80px] [&_.ProseMirror]:px-3 [&_.ProseMirror]:py-2',
          '[&_.ProseMirror]:outline-none',
          '[&_.ProseMirror_p.is-editor-empty:first-child::before]:text-muted-foreground',
          '[&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left',
          '[&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0',
          '[&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none',
          '[&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]'
        )}
      />
    </div>
  );
}
