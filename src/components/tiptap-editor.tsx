'use client';

import { useRef, useCallback, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import LinkExtension from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import Youtube from '@tiptap/extension-youtube';
import Color from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import FontFamily from '@tiptap/extension-font-family';
import Typography from '@tiptap/extension-typography';
import CharacterCount from '@tiptap/extension-character-count';
import Focus from '@tiptap/extension-focus';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { common, createLowlight } from 'lowlight';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const lowlight = createLowlight(common);

// Custom FontSize extension (TextStyle doesn't support fontSize natively)
const FontSize = TextStyle.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      fontSize: {
        default: null,
        parseHTML: (element) => element.style.fontSize || null,
        renderHTML: (attributes) => {
          if (!attributes.fontSize) return {};
          return { style: `font-size: ${attributes.fontSize}` };
        }
      }
    };
  }
});

const FONT_FAMILIES = [
  { value: 'default', label: 'Default' },
  { value: 'Inter', label: 'Inter' },
  { value: 'Georgia', label: 'Georgia' },
  { value: 'Arial', label: 'Arial' },
  { value: 'Verdana', label: 'Verdana' },
  { value: 'Tahoma', label: 'Tahoma' },
  { value: 'Times New Roman', label: 'Times New Roman' },
  { value: 'Courier New', label: 'Courier New' },
  { value: 'monospace', label: 'Monospace' }
];

const FONT_SIZES = [
  '10px',
  '12px',
  '14px',
  '16px',
  '18px',
  '20px',
  '24px',
  '28px',
  '32px',
  '36px',
  '48px',
  '64px'
];

const HEADING_LEVELS = [1, 2, 3, 4, 5, 6] as const;

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
  const [isFullscreen, setIsFullscreen] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      LinkExtension.configure({
        openOnClick: false,
        HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' }
      }),
      Placeholder.configure({ placeholder }),
      Image.configure({ inline: false, allowBase64: true }),
      Underline,
      Subscript,
      Superscript,
      FontSize,
      Color,
      FontFamily,
      Typography,
      CharacterCount,
      Focus.configure({ className: 'has-focus', mode: 'all' }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Highlight.configure({ multicolor: true }),
      TaskList,
      TaskItem.configure({ nested: true }),
      CodeBlockLowlight.configure({ lowlight }),
      Youtube.configure({ width: 640, height: 360 }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader
    ],
    content,
    onUpdate: ({ editor: e }) => {
      onChange?.(e.getHTML());
    },
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm dark:prose-invert max-w-none min-h-[400px] rounded-b-md border border-t-0 border-input bg-transparent px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
          '[&_table]:border-collapse [&_table]:w-full [&_td]:border [&_td]:border-muted [&_td]:p-2 [&_th]:border [&_th]:border-muted [&_th]:p-2 [&_th]:bg-muted/50 [&_th]:font-semibold',
          '[&_pre]:bg-muted [&_pre]:rounded-md [&_pre]:p-4 [&_pre]:text-sm [&_code]:bg-muted [&_code]:rounded [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-xs',
          '[&_ul[data-type="taskList"]]:list-none [&_ul[data-type="taskList"]]:pl-0 [&_ul[data-type="taskList"]_li]:flex [&_ul[data-type="taskList"]_li]:items-start [&_ul[data-type="taskList"]_li]:gap-2',
          '[&_iframe]:rounded-md [&_iframe]:max-w-full',
          '[&_.has-focus]:outline-none',
          '[&_img]:rounded-md [&_img]:max-w-full [&_img]:cursor-pointer',
          className
        )
      }
    }
  });

  const handleImageUpload = useCallback(async () => {
    if (onImageUpload) {
      fileInputRef.current?.click();
    } else {
      const url = window.prompt('Enter image URL:');
      if (url && editor) editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor, onImageUpload]);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !onImageUpload || !editor) return;
      try {
        const url = await onImageUpload(file);
        editor.chain().focus().setImage({ src: url }).run();
      } catch {
        // silently fail
      }
      e.target.value = '';
    },
    [editor, onImageUpload]
  );

  if (!editor) return null;

  const charCount = editor.storage.characterCount;

  return (
    <TooltipProvider delayDuration={300}>
      <div
        className={cn(
          'rounded-md border border-input',
          isFullscreen && 'fixed inset-0 z-50 flex flex-col bg-background'
        )}
      >
        {/* Toolbar Row 1: Font family, size, heading, text formatting */}
        <div className='flex flex-wrap items-center gap-0.5 border-b border-input bg-muted/30 p-1.5'>
          {/* Font Family */}
          <Select
            value={editor.getAttributes('textStyle').fontFamily || 'default'}
            onValueChange={(val) => {
              if (val === 'default') {
                editor.chain().focus().unsetFontFamily().run();
              } else {
                editor.chain().focus().setFontFamily(val).run();
              }
            }}
          >
            <SelectTrigger className='h-8 w-[120px] text-xs'>
              <SelectValue placeholder='Font' />
            </SelectTrigger>
            <SelectContent>
              {FONT_FAMILIES.map((f) => (
                <SelectItem
                  key={f.value}
                  value={f.value}
                  style={{ fontFamily: f.value === 'default' ? undefined : f.value }}
                >
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Font Size */}
          <FontSizePicker editor={editor} />

          <ToolbarSep />

          {/* Heading dropdown */}
          <HeadingPicker editor={editor} />

          <ToolbarSep />

          {/* Text formatting */}
          <ToolbarGroup>
            <ToolBtn
              active={editor.isActive('bold')}
              onClick={() => editor.chain().focus().toggleBold().run()}
              tooltip='Bold (Ctrl+B)'
              icon={<Icons.bold className='h-4 w-4' />}
            />
            <ToolBtn
              active={editor.isActive('italic')}
              onClick={() => editor.chain().focus().toggleItalic().run()}
              tooltip='Italic (Ctrl+I)'
              icon={<Icons.italic className='h-4 w-4' />}
            />
            <ToolBtn
              active={editor.isActive('underline')}
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              tooltip='Underline (Ctrl+U)'
              icon={<Icons.underline className='h-4 w-4' />}
            />
            <ToolBtn
              active={editor.isActive('strike')}
              onClick={() => editor.chain().focus().toggleStrike().run()}
              tooltip='Strikethrough'
              icon={<Icons.strikethrough className='h-4 w-4' />}
            />
            <ToolBtn
              active={editor.isActive('code')}
              onClick={() => editor.chain().focus().toggleCode().run()}
              tooltip='Inline Code'
              icon={<Icons.code className='h-4 w-4' />}
            />
            <ToolBtn
              active={editor.isActive('subscript')}
              onClick={() => editor.chain().focus().toggleSubscript().run()}
              tooltip='Subscript'
              icon={<Icons.subscript className='h-4 w-4' />}
            />
            <ToolBtn
              active={editor.isActive('superscript')}
              onClick={() => editor.chain().focus().toggleSuperscript().run()}
              tooltip='Superscript'
              icon={<Icons.superscript className='h-4 w-4' />}
            />
          </ToolbarGroup>

          <ToolbarSep />

          {/* Colors */}
          <ToolbarGroup>
            <ColorPicker
              currentColor={editor.getAttributes('textStyle').color || '#000000'}
              onColorChange={(color) => editor.chain().focus().setColor(color).run()}
              onReset={() => editor.chain().focus().unsetColor().run()}
              tooltip='Text Color'
              icon={<Icons.colorSwatch className='h-3.5 w-3.5' />}
            />
            <HighlightColorPicker editor={editor} />
          </ToolbarGroup>
        </div>

        {/* Toolbar Row 2: Lists, blocks, alignment, media, table, undo/redo */}
        <div className='flex flex-wrap items-center gap-0.5 border-b border-input bg-muted/30 p-1.5'>
          {/* Lists */}
          <ToolbarGroup>
            <ToolBtn
              active={editor.isActive('bulletList')}
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              tooltip='Bullet List'
              icon={<Icons.bulletList className='h-4 w-4' />}
            />
            <ToolBtn
              active={editor.isActive('orderedList')}
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              tooltip='Ordered List'
              icon={<Icons.orderedList className='h-4 w-4' />}
            />
            <ToolBtn
              active={editor.isActive('taskList')}
              onClick={() => editor.chain().focus().toggleTaskList().run()}
              tooltip='Task List'
              icon={<Icons.taskList className='h-4 w-4' />}
            />
          </ToolbarGroup>

          <ToolbarSep />

          {/* Indent / Outdent */}
          <ToolbarGroup>
            <ToolBtn
              onClick={() => editor.chain().focus().sinkListItem('listItem').run()}
              disabled={!editor.can().sinkListItem('listItem')}
              tooltip='Indent'
              icon={<Icons.indentIncrease className='h-4 w-4' />}
            />
            <ToolBtn
              onClick={() => editor.chain().focus().liftListItem('listItem').run()}
              disabled={!editor.can().liftListItem('listItem')}
              tooltip='Outdent'
              icon={<Icons.indentDecrease className='h-4 w-4' />}
            />
          </ToolbarGroup>

          <ToolbarSep />

          {/* Block elements */}
          <ToolbarGroup>
            <ToolBtn
              active={editor.isActive('blockquote')}
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              tooltip='Blockquote'
              icon={<Icons.blockquote className='h-4 w-4' />}
            />
            <ToolBtn
              active={editor.isActive('codeBlock')}
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              tooltip='Code Block'
              icon={<Icons.codeBlock className='h-4 w-4' />}
            />
            <ToolBtn
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
              tooltip='Horizontal Rule'
              icon={<Icons.horizontalRule className='h-4 w-4' />}
            />
          </ToolbarGroup>

          <ToolbarSep />

          {/* Alignment */}
          <ToolbarGroup>
            <ToolBtn
              active={editor.isActive({ textAlign: 'left' })}
              onClick={() => editor.chain().focus().setTextAlign('left').run()}
              tooltip='Align Left'
              icon={<Icons.alignLeft className='h-4 w-4' />}
            />
            <ToolBtn
              active={editor.isActive({ textAlign: 'center' })}
              onClick={() => editor.chain().focus().setTextAlign('center').run()}
              tooltip='Align Center'
              icon={<Icons.alignCenter className='h-4 w-4' />}
            />
            <ToolBtn
              active={editor.isActive({ textAlign: 'right' })}
              onClick={() => editor.chain().focus().setTextAlign('right').run()}
              tooltip='Align Right'
              icon={<Icons.alignRight className='h-4 w-4' />}
            />
            <ToolBtn
              active={editor.isActive({ textAlign: 'justify' })}
              onClick={() => editor.chain().focus().setTextAlign('justify').run()}
              tooltip='Justify'
              icon={<Icons.alignJustify className='h-4 w-4' />}
            />
          </ToolbarGroup>

          <ToolbarSep />

          {/* Links & Media */}
          <ToolbarGroup>
            <LinkButton editor={editor} />
            <ToolBtn
              onClick={handleImageUpload}
              tooltip='Insert Image'
              icon={<Icons.media className='h-4 w-4' />}
            />
            <YoutubeButton editor={editor} />
          </ToolbarGroup>

          <ToolbarSep />

          {/* Table */}
          <ToolbarGroup>
            <ToolBtn
              onClick={() =>
                editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
              }
              tooltip='Insert Table'
              icon={<Icons.table className='h-4 w-4' />}
            />
            {editor.isActive('table') && (
              <>
                <ToolBtn
                  onClick={() => editor.chain().focus().addColumnAfter().run()}
                  tooltip='Add Column'
                  icon={<Icons.columnInsertRight className='h-4 w-4' />}
                />
                <ToolBtn
                  onClick={() => editor.chain().focus().deleteColumn().run()}
                  tooltip='Delete Column'
                  icon={<Icons.columnRemove className='h-4 w-4' />}
                />
                <ToolBtn
                  onClick={() => editor.chain().focus().addRowAfter().run()}
                  tooltip='Add Row'
                  icon={<Icons.rowInsertBottom className='h-4 w-4' />}
                />
                <ToolBtn
                  onClick={() => editor.chain().focus().deleteRow().run()}
                  tooltip='Delete Row'
                  icon={<Icons.rowRemove className='h-4 w-4' />}
                />
                <ToolBtn
                  onClick={() => editor.chain().focus().mergeCells().run()}
                  tooltip='Merge Cells'
                  icon={<Icons.tablePlus className='h-4 w-4' />}
                />
                <ToolBtn
                  onClick={() => editor.chain().focus().splitCell().run()}
                  tooltip='Split Cell'
                  icon={<Icons.tableMinus className='h-4 w-4' />}
                />
                <ToolBtn
                  onClick={() => editor.chain().focus().deleteTable().run()}
                  tooltip='Delete Table'
                  icon={<Icons.tableOff className='h-4 w-4' />}
                />
              </>
            )}
          </ToolbarGroup>

          <ToolbarSep />

          {/* Undo/Redo & Clear */}
          <ToolbarGroup>
            <ToolBtn
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              tooltip='Undo (Ctrl+Z)'
              icon={<Icons.undo className='h-4 w-4' />}
            />
            <ToolBtn
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              tooltip='Redo (Ctrl+Shift+Z)'
              icon={<Icons.redo className='h-4 w-4' />}
            />
            <ToolBtn
              onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
              tooltip='Clear Formatting'
              icon={<Icons.clearFormatting className='h-4 w-4' />}
            />
          </ToolbarGroup>

          <ToolbarSep />

          {/* Fullscreen */}
          <ToolBtn
            onClick={() => setIsFullscreen((v) => !v)}
            tooltip={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            icon={
              isFullscreen ? (
                <Icons.minimize className='h-4 w-4' />
              ) : (
                <Icons.maximize className='h-4 w-4' />
              )
            }
          />
        </div>

        {/* Editor content */}
        <div className={cn(isFullscreen && 'flex-1 overflow-auto')}>
          <EditorContent editor={editor} />
        </div>

        {/* Status bar: character & word count */}
        <div className='flex items-center justify-end gap-4 border-t border-input bg-muted/20 px-3 py-1 text-xs text-muted-foreground'>
          <span>{charCount?.characters?.() ?? 0} characters</span>
          <span>{charCount?.words?.() ?? 0} words</span>
        </div>

        <input
          ref={fileInputRef}
          type='file'
          accept='image/*'
          className='hidden'
          onChange={handleFileChange}
        />
      </div>
    </TooltipProvider>
  );
}

/* ─── Toolbar sub-components ─── */

function ToolbarGroup({ children }: { children: React.ReactNode }) {
  return <div className='flex items-center gap-0.5'>{children}</div>;
}

function ToolbarSep() {
  return <Separator orientation='vertical' className='mx-1 h-6' />;
}

function ToolBtn({
  active,
  onClick,
  icon,
  tooltip,
  disabled
}: {
  active?: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  tooltip: string;
  disabled?: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type='button'
          variant={active ? 'default' : 'ghost'}
          size='sm'
          className='h-8 w-8 p-0'
          onClick={onClick}
          disabled={disabled}
        >
          {icon}
        </Button>
      </TooltipTrigger>
      <TooltipContent side='bottom' className='text-xs'>
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
}

function LinkButton({ editor }: { editor: ReturnType<typeof useEditor> }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState('');

  if (!editor) return null;

  const isActive = editor.isActive('link');

  const handleSetLink = () => {
    if (url) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }
    setUrl('');
    setOpen(false);
  };

  const handleUnsetLink = () => {
    editor.chain().focus().unsetLink().run();
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              type='button'
              variant={isActive ? 'default' : 'ghost'}
              size='sm'
              className='h-8 w-8 p-0'
              onClick={() => {
                if (isActive) {
                  setUrl(editor.getAttributes('link').href || '');
                }
                setOpen(true);
              }}
            >
              <Icons.link className='h-4 w-4' />
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side='bottom' className='text-xs'>
          Link
        </TooltipContent>
      </Tooltip>
      <PopoverContent className='w-80 space-y-3' align='start'>
        <Label htmlFor='link-url'>URL</Label>
        <Input
          id='link-url'
          placeholder='https://example.com'
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSetLink()}
        />
        <div className='flex gap-2'>
          <Button size='sm' onClick={handleSetLink} disabled={!url}>
            {isActive ? 'Update' : 'Add'} Link
          </Button>
          {isActive && (
            <Button size='sm' variant='destructive' onClick={handleUnsetLink}>
              <Icons.unlink className='mr-1 h-3 w-3' /> Remove
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function YoutubeButton({ editor }: { editor: ReturnType<typeof useEditor> }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState('');

  if (!editor) return null;

  const handleInsert = () => {
    if (url) {
      editor.commands.setYoutubeVideo({ src: url });
    }
    setUrl('');
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button type='button' variant='ghost' size='sm' className='h-8 w-8 p-0'>
              <Icons.youtube className='h-4 w-4' />
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side='bottom' className='text-xs'>
          YouTube Video
        </TooltipContent>
      </Tooltip>
      <PopoverContent className='w-80 space-y-3' align='start'>
        <Label htmlFor='youtube-url'>YouTube URL</Label>
        <Input
          id='youtube-url'
          placeholder='https://youtube.com/watch?v=...'
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleInsert()}
        />
        <Button size='sm' onClick={handleInsert} disabled={!url}>
          Insert Video
        </Button>
      </PopoverContent>
    </Popover>
  );
}

const PRESET_COLORS = [
  '#000000',
  '#434343',
  '#666666',
  '#999999',
  '#cccccc',
  '#ffffff',
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#14b8a6',
  '#06b6d4',
  '#3b82f6',
  '#6366f1',
  '#8b5cf6',
  '#a855f7',
  '#ec4899',
  '#f43f5e'
];

function ColorPicker({
  currentColor,
  onColorChange,
  onReset,
  tooltip = 'Text Color',
  icon
}: {
  currentColor: string;
  onColorChange: (color: string) => void;
  onReset: () => void;
  tooltip?: string;
  icon?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [customColor, setCustomColor] = useState(currentColor);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button type='button' variant='ghost' size='sm' className='h-8 w-8 p-0'>
              <div className='flex flex-col items-center gap-0.5'>
                {icon || <Icons.colorSwatch className='h-3.5 w-3.5' />}
                <div
                  className='h-0.5 w-3.5 rounded-full'
                  style={{ backgroundColor: currentColor }}
                />
              </div>
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side='bottom' className='text-xs'>
          {tooltip}
        </TooltipContent>
      </Tooltip>
      <PopoverContent className='w-56 space-y-2' align='start'>
        <div className='grid grid-cols-6 gap-1'>
          {PRESET_COLORS.map((color) => (
            <button
              key={color}
              type='button'
              className={cn(
                'h-6 w-6 rounded border border-border transition-transform hover:scale-110',
                currentColor === color && 'ring-2 ring-ring ring-offset-1'
              )}
              style={{ backgroundColor: color }}
              onClick={() => {
                onColorChange(color);
                setOpen(false);
              }}
            />
          ))}
        </div>
        <div className='flex items-center gap-2'>
          <input
            type='color'
            value={customColor}
            onChange={(e) => setCustomColor(e.target.value)}
            className='h-7 w-7 cursor-pointer rounded border border-border'
          />
          <Button
            size='sm'
            variant='outline'
            className='flex-1 text-xs'
            onClick={() => {
              onColorChange(customColor);
              setOpen(false);
            }}
          >
            Apply
          </Button>
          <Button
            size='sm'
            variant='ghost'
            className='text-xs'
            onClick={() => {
              onReset();
              setOpen(false);
            }}
          >
            Reset
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function HighlightColorPicker({ editor }: { editor: ReturnType<typeof useEditor> }) {
  const [open, setOpen] = useState(false);
  if (!editor) return null;

  const highlightColors = [
    { color: '#fef08a', label: 'Yellow' },
    { color: '#bbf7d0', label: 'Green' },
    { color: '#bfdbfe', label: 'Blue' },
    { color: '#fecaca', label: 'Red' },
    { color: '#e9d5ff', label: 'Purple' },
    { color: '#fed7aa', label: 'Orange' },
    { color: '#fce7f3', label: 'Pink' },
    { color: '#ccfbf1', label: 'Teal' }
  ];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              type='button'
              variant={editor.isActive('highlight') ? 'default' : 'ghost'}
              size='sm'
              className='h-8 w-8 p-0'
            >
              <Icons.highlight className='h-4 w-4' />
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side='bottom' className='text-xs'>
          Highlight Color
        </TooltipContent>
      </Tooltip>
      <PopoverContent className='w-48 space-y-2' align='start'>
        <div className='grid grid-cols-4 gap-1'>
          {highlightColors.map((h) => (
            <button
              key={h.color}
              type='button'
              title={h.label}
              className='h-7 w-7 rounded border border-border transition-transform hover:scale-110'
              style={{ backgroundColor: h.color }}
              onClick={() => {
                editor.chain().focus().toggleHighlight({ color: h.color }).run();
                setOpen(false);
              }}
            />
          ))}
        </div>
        <Button
          size='sm'
          variant='ghost'
          className='w-full text-xs'
          onClick={() => {
            editor.chain().focus().unsetHighlight().run();
            setOpen(false);
          }}
        >
          Remove Highlight
        </Button>
      </PopoverContent>
    </Popover>
  );
}

function FontSizePicker({ editor }: { editor: ReturnType<typeof useEditor> }) {
  if (!editor) return null;

  return (
    <Select
      value=''
      onValueChange={(val) => {
        editor.chain().focus().setMark('textStyle', { fontSize: val }).run();
      }}
    >
      <SelectTrigger className='h-8 w-[80px] text-xs'>
        <Icons.fontSize className='mr-1 h-3.5 w-3.5' />
        <SelectValue placeholder='Size' />
      </SelectTrigger>
      <SelectContent>
        {FONT_SIZES.map((size) => (
          <SelectItem key={size} value={size} className='text-xs'>
            {size}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function HeadingPicker({ editor }: { editor: ReturnType<typeof useEditor> }) {
  if (!editor) return null;

  const headingIcons: Record<number, React.ReactNode> = {
    1: <Icons.h1 className='h-4 w-4' />,
    2: <Icons.h2 className='h-4 w-4' />,
    3: <Icons.h3 className='h-4 w-4' />,
    4: <Icons.h4 className='h-4 w-4' />,
    5: <Icons.h5 className='h-4 w-4' />,
    6: <Icons.h6 className='h-4 w-4' />
  };

  const currentLevel = HEADING_LEVELS.find((l) => editor.isActive('heading', { level: l }));

  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button type='button' variant='ghost' size='sm' className='h-8 gap-1 px-2 text-xs'>
              {currentLevel ? headingIcons[currentLevel] : <Icons.paragraph className='h-4 w-4' />}
              <Icons.chevronDown className='h-3 w-3' />
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side='bottom' className='text-xs'>
          Heading Level
        </TooltipContent>
      </Tooltip>
      <PopoverContent className='w-40 p-1' align='start'>
        <button
          type='button'
          className={cn(
            'flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent',
            !currentLevel && 'bg-accent'
          )}
          onClick={() => editor.chain().focus().setParagraph().run()}
        >
          <Icons.paragraph className='h-4 w-4' /> Paragraph
        </button>
        {HEADING_LEVELS.map((level) => (
          <button
            key={level}
            type='button'
            className={cn(
              'flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent',
              currentLevel === level && 'bg-accent'
            )}
            onClick={() => editor.chain().focus().toggleHeading({ level }).run()}
          >
            {headingIcons[level]} Heading {level}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
