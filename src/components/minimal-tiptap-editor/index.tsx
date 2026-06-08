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

const Toolbar = memo(function Toolbar({
  editor,
  htmlMode,
  onToggleHtmlMode
}: {
  editor: ReturnType<typeof useEditor>;
  htmlMode: boolean;
  onToggleHtmlMode: () => void;
}) {
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
          disabled={htmlMode}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Icons.bold className='h-4 w-4' />
        </ToggleGroupItem>
        <ToggleGroupItem
          value='italic'
          aria-label='Italic'
          disabled={htmlMode}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Icons.italic className='h-4 w-4' />
        </ToggleGroupItem>
        <ToggleGroupItem
          value='underline'
          aria-label='Underline'
          disabled={htmlMode}
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
            disabled={htmlMode}
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

      <div className='ml-auto'>
        <Button
          type='button'
          variant={htmlMode ? 'default' : 'ghost'}
          size='icon'
          className='h-8 w-8'
          onClick={onToggleHtmlMode}
          aria-label='Chỉnh sửa HTML'
          title='Chỉnh sửa HTML'
        >
          <Icons.code className='h-4 w-4' />
        </Button>
      </div>
    </div>
  );
});

import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';

/** Strip `rel` attributes from all `<a>` tags — matches the blog editor behaviour. */
function stripRelAttributes(html: string): string {
  return html.replace(/(<a\b[^>]*?)\s+rel=(?:"[^"]*"|'[^']*'|[^\s>]+)([^>]*>)/gi, '$1$2');
}

export function MinimalTiptapEditor({
  content,
  onChange,
  placeholder = 'Nhập mô tả...'
}: MinimalTiptapEditorProps) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const debounceTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const [htmlMode, setHtmlMode] = useState(false);
  const [htmlDraft, setHtmlDraft] = useState('');

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

  const toggleHtmlMode = useCallback(() => {
    if (!editor) return;
    if (!htmlMode) {
      // Entering HTML mode — seed the textarea with the current HTML.
      setHtmlDraft(editor.getHTML());
      setHtmlMode(true);
    } else {
      // Leaving HTML mode — strip `rel`, push back into the editor and notify.
      const cleaned = stripRelAttributes(htmlDraft);
      editor.commands.setContent(cleaned, { emitUpdate: false });
      clearTimeout(debounceTimer.current);
      onChangeRef.current(cleaned);
      setHtmlMode(false);
    }
  }, [editor, htmlMode, htmlDraft]);

  if (!editor) return null;

  return (
    <div className='mx-1 overflow-hidden rounded-[0.5rem] bg-background shadow outline outline-1 outline-border'>
      <Toolbar editor={editor} htmlMode={htmlMode} onToggleHtmlMode={toggleHtmlMode} />
      {htmlMode ? (
        <Textarea
          value={htmlDraft}
          onChange={(e) => setHtmlDraft(e.target.value)}
          spellCheck={false}
          className='min-h-[160px] resize-y rounded-none border-0 font-mono text-xs focus-visible:ring-0'
          placeholder='<p>HTML...</p>'
        />
      ) : (
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
      )}
    </div>
  );
}
