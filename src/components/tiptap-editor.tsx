'use client';

import { useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { Separator } from '@/components/ui/separator';

interface TiptapEditorProps {
  content?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  className?: string;
  onImageUpload?: (file: File) => Promise<string>;
}

export function TiptapEditor({
  content = '',
  onChange,
  placeholder = 'Write something...',
  className,
  onImageUpload
}: TiptapEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder }),
      Image.configure({ inline: false, allowBase64: true }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Highlight.configure({ multicolor: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm dark:prose-invert max-w-none min-h-[200px] rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring [&_table]:border-collapse [&_table]:w-full [&_td]:border [&_td]:border-muted [&_td]:p-2 [&_th]:border [&_th]:border-muted [&_th]:p-2 [&_th]:bg-muted/50 [&_th]:font-semibold',
          className
        )
      }
    }
  });

  if (!editor) return null;

  const handleImageUpload = async () => {
    if (onImageUpload) {
      fileInputRef.current?.click();
    } else {
      const url = window.prompt('Enter image URL:');
      if (url) editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onImageUpload) return;
    try {
      const url = await onImageUpload(file);
      editor.chain().focus().setImage({ src: url }).run();
    } catch {
      // silently fail
    }
    e.target.value = '';
  };

  const ToolBtn = ({
    active,
    onClick,
    children,
    title
  }: {
    active?: boolean;
    onClick: () => void;
    children: React.ReactNode;
    title?: string;
  }) => (
    <Button
      type='button'
      variant={active ? 'default' : 'ghost'}
      size='sm'
      className='h-7 w-7 p-0'
      onClick={onClick}
      title={title}
    >
      {children}
    </Button>
  );

  const ToolBtnText = ({
    active,
    onClick,
    children,
    title
  }: {
    active?: boolean;
    onClick: () => void;
    children: React.ReactNode;
    title?: string;
  }) => (
    <Button
      type='button'
      variant={active ? 'default' : 'ghost'}
      size='sm'
      className='h-7 px-2 text-xs'
      onClick={onClick}
      title={title}
    >
      {children}
    </Button>
  );

  return (
    <div className='space-y-2'>
      <div className='flex flex-wrap items-center gap-0.5 rounded-md border p-1'>
        {/* Text formatting */}
        <ToolBtn
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title='Bold'
        >
          <Icons.bold className='h-3.5 w-3.5' />
        </ToolBtn>
        <ToolBtn
          active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title='Italic'
        >
          <Icons.italic className='h-3.5 w-3.5' />
        </ToolBtn>
        <ToolBtn
          active={editor.isActive('underline')}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          title='Underline'
        >
          <Icons.underline className='h-3.5 w-3.5' />
        </ToolBtn>
        <ToolBtn
          active={editor.isActive('highlight')}
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          title='Highlight'
        >
          <span className='rounded bg-yellow-200 px-1 text-[10px] font-bold text-black'>H</span>
        </ToolBtn>
        <ToolBtn
          active={editor.isActive('code')}
          onClick={() => editor.chain().focus().toggleCode().run()}
          title='Code'
        >
          <Icons.code className='h-3.5 w-3.5' />
        </ToolBtn>

        <Separator orientation='vertical' className='mx-1 h-5' />

        {/* Headings */}
        <ToolBtnText
          active={editor.isActive('heading', { level: 1 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          title='Heading 1'
        >
          H1
        </ToolBtnText>
        <ToolBtnText
          active={editor.isActive('heading', { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          title='Heading 2'
        >
          H2
        </ToolBtnText>
        <ToolBtnText
          active={editor.isActive('heading', { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          title='Heading 3'
        >
          H3
        </ToolBtnText>

        <Separator orientation='vertical' className='mx-1 h-5' />

        {/* Lists */}
        <ToolBtnText
          active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title='Bullet List'
        >
          • List
        </ToolBtnText>
        <ToolBtnText
          active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title='Ordered List'
        >
          1. List
        </ToolBtnText>
        <ToolBtnText
          active={editor.isActive('blockquote')}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          title='Blockquote'
        >
          Quote
        </ToolBtnText>

        <Separator orientation='vertical' className='mx-1 h-5' />

        {/* Text Align */}
        <ToolBtnText
          active={editor.isActive({ textAlign: 'left' })}
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          title='Align Left'
        >
          Left
        </ToolBtnText>
        <ToolBtnText
          active={editor.isActive({ textAlign: 'center' })}
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          title='Align Center'
        >
          Center
        </ToolBtnText>
        <ToolBtnText
          active={editor.isActive({ textAlign: 'right' })}
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          title='Align Right'
        >
          Right
        </ToolBtnText>

        <Separator orientation='vertical' className='mx-1 h-5' />

        {/* Image */}
        <ToolBtn onClick={handleImageUpload} title='Insert Image'>
          <Icons.media className='h-3.5 w-3.5' />
        </ToolBtn>

        {/* Table */}
        <ToolBtnText
          onClick={() =>
            editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
          }
          title='Insert Table'
        >
          Table
        </ToolBtnText>
        {editor.isActive('table') && (
          <>
            <ToolBtnText
              onClick={() => editor.chain().focus().addColumnAfter().run()}
              title='Add Column'
            >
              +Col
            </ToolBtnText>
            <ToolBtnText onClick={() => editor.chain().focus().addRowAfter().run()} title='Add Row'>
              +Row
            </ToolBtnText>
            <ToolBtnText
              onClick={() => editor.chain().focus().deleteColumn().run()}
              title='Delete Column'
            >
              -Col
            </ToolBtnText>
            <ToolBtnText
              onClick={() => editor.chain().focus().deleteRow().run()}
              title='Delete Row'
            >
              -Row
            </ToolBtnText>
            <ToolBtnText
              onClick={() => editor.chain().focus().deleteTable().run()}
              title='Delete Table'
            >
              ×Table
            </ToolBtnText>
          </>
        )}

        <Separator orientation='vertical' className='mx-1 h-5' />

        {/* Undo/Redo */}
        <ToolBtn onClick={() => editor.chain().focus().undo().run()} title='Undo'>
          ↩
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().redo().run()} title='Redo'>
          ↪
        </ToolBtn>
      </div>

      <EditorContent editor={editor} />

      <input
        ref={fileInputRef}
        type='file'
        accept='image/*'
        className='hidden'
        onChange={handleFileChange}
      />
    </div>
  );
}
