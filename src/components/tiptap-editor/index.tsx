'use client';

import { Document } from '@tiptap/extension-document';
import { HardBreak } from '@tiptap/extension-hard-break';
import { ListItem } from '@tiptap/extension-list';
import { Paragraph } from '@tiptap/extension-paragraph';
import { Text } from '@tiptap/extension-text';
import { TextStyle } from '@tiptap/extension-text-style';
import { Dropcursor, Gapcursor, Placeholder, TrailingNode } from '@tiptap/extensions';
import { EditorContent, useEditor } from '@tiptap/react';
import { memo, useMemo, useRef, useEffect } from 'react';
import { RichTextProvider } from 'reactjs-tiptap-editor';
import { Attachment, RichTextAttachment } from 'reactjs-tiptap-editor/attachment';
import { Blockquote, RichTextBlockquote } from 'reactjs-tiptap-editor/blockquote';
import { Bold, RichTextBold } from 'reactjs-tiptap-editor/bold';
import {
  RichTextBubbleColumns,
  RichTextBubbleLink,
  RichTextBubbleImage,
  RichTextBubbleVideo,
  RichTextBubbleImageGif,
  RichTextBubbleTable,
  RichTextBubbleText,
  RichTextBubbleMenuDragHandle
} from 'reactjs-tiptap-editor/bubble';
import { BulletList, RichTextBulletList } from 'reactjs-tiptap-editor/bulletlist';
import { Color, RichTextColor } from 'reactjs-tiptap-editor/color';
import {
  Column,
  ColumnNode,
  MultipleColumnNode,
  RichTextColumn
} from 'reactjs-tiptap-editor/column';
import { Emoji, RichTextEmoji } from 'reactjs-tiptap-editor/emoji';
import { ExportPdf, RichTextExportPdf } from 'reactjs-tiptap-editor/exportpdf';
import { ExportWord, RichTextExportWord } from 'reactjs-tiptap-editor/exportword';
import { FontFamily, RichTextFontFamily } from 'reactjs-tiptap-editor/fontfamily';
import { FontSize, RichTextFontSize } from 'reactjs-tiptap-editor/fontsize';
import { Heading, RichTextHeading } from 'reactjs-tiptap-editor/heading';
import { Highlight, RichTextHighlight } from 'reactjs-tiptap-editor/highlight';
import { History, RichTextUndo, RichTextRedo } from 'reactjs-tiptap-editor/history';
import { HorizontalRule, RichTextHorizontalRule } from 'reactjs-tiptap-editor/horizontalrule';
import { Image, RichTextImage } from 'reactjs-tiptap-editor/image';
import { ImageGif, RichTextImageGif } from 'reactjs-tiptap-editor/imagegif';
import { ImportWord, RichTextImportWord } from 'reactjs-tiptap-editor/importword';
import { Indent, RichTextIndent } from 'reactjs-tiptap-editor/indent';
import { Italic, RichTextItalic } from 'reactjs-tiptap-editor/italic';
import { LineHeight, RichTextLineHeight } from 'reactjs-tiptap-editor/lineheight';
import { Link, RichTextLink } from 'reactjs-tiptap-editor/link';
import { MarkdownPaste } from 'reactjs-tiptap-editor/markdownpaste';
import { MoreMark, RichTextMoreMark } from 'reactjs-tiptap-editor/moremark';
import { OrderedList, RichTextOrderedList } from 'reactjs-tiptap-editor/orderedlist';
import { SlashCommand, SlashCommandList } from 'reactjs-tiptap-editor/slashcommand';
import { Strike, RichTextStrike } from 'reactjs-tiptap-editor/strike';
import { Table, RichTextTable } from 'reactjs-tiptap-editor/table';
import { TaskList, RichTextTaskList } from 'reactjs-tiptap-editor/tasklist';
import { TextAlign, RichTextAlign } from 'reactjs-tiptap-editor/textalign';
import { TextDirection, RichTextTextDirection } from 'reactjs-tiptap-editor/textdirection';
import { TextUnderline, RichTextUnderline } from 'reactjs-tiptap-editor/textunderline';
import { Video, RichTextVideo } from 'reactjs-tiptap-editor/video';

import 'reactjs-tiptap-editor/style.css';

const DocumentColumn = Document.extend({ content: '(block|columns)+' });

function buildExtensions(options?: {
  placeholder?: string;
  onImageUpload?: (file: File) => Promise<string>;
}) {
  return [
    DocumentColumn,
    Text,
    Dropcursor.configure({
      class: 'reactjs-tiptap-editor-theme',
      color: 'hsl(var(--primary))',
      width: 2
    }),
    Gapcursor,
    HardBreak,
    Paragraph,
    TrailingNode,
    ListItem,
    TextStyle,
    Placeholder.configure({ placeholder: options?.placeholder || "Press '/' for commands" }),
    History,
    FontFamily,
    Heading,
    FontSize,
    Bold,
    Italic,
    TextUnderline,
    Strike,
    MoreMark,
    Emoji,
    Color,
    Highlight,
    BulletList,
    OrderedList,
    TextAlign,
    Indent,
    LineHeight,
    TaskList,
    Link,
    Image.configure({
      upload: options?.onImageUpload
        ? (file: File) => options.onImageUpload!(file)
        : (file: File) => Promise.resolve(URL.createObjectURL(file))
    }),
    Video.configure({ upload: (file: File) => Promise.resolve(URL.createObjectURL(file)) }),
    ImageGif,
    Blockquote,
    HorizontalRule,
    Column,
    ColumnNode,
    MultipleColumnNode,
    Table,
    ExportPdf,
    ImportWord,
    ExportWord,
    TextDirection,
    Attachment.configure({ upload: (file: File) => Promise.resolve(URL.createObjectURL(file)) }),
    SlashCommand,
    MarkdownPaste
  ];
}

const Toolbar = memo(function Toolbar() {
  return (
    <div className='flex flex-wrap items-center gap-1 border-b border-border p-1'>
      <RichTextUndo />
      <RichTextRedo />
      <RichTextFontFamily />
      <RichTextHeading />
      <RichTextFontSize />
      <RichTextBold />
      <RichTextItalic />
      <RichTextUnderline />
      <RichTextStrike />
      <RichTextMoreMark />
      <RichTextEmoji />
      <RichTextColor />
      <RichTextHighlight />
      <RichTextBulletList />
      <RichTextOrderedList />
      <RichTextAlign />
      <RichTextIndent />
      <RichTextLineHeight />
      <RichTextTaskList />
      <RichTextLink />
      <RichTextImage />
      <RichTextVideo />
      <RichTextImageGif />
      <RichTextBlockquote />
      <RichTextHorizontalRule />
      <RichTextColumn />
      <RichTextTable />
      <RichTextExportPdf />
      <RichTextImportWord />
      <RichTextExportWord />
      <RichTextTextDirection />
      <RichTextAttachment />
    </div>
  );
});

interface TiptapEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  onImageUpload?: (file: File) => Promise<string>;
}

export function TiptapEditor({ content, onChange, placeholder, onImageUpload }: TiptapEditorProps) {
  const onImageUploadRef = useRef(onImageUpload);
  onImageUploadRef.current = onImageUpload;

  const extensions = useMemo(
    () =>
      buildExtensions({
        placeholder,
        onImageUpload: (f) =>
          onImageUploadRef.current?.(f) ?? Promise.resolve(URL.createObjectURL(f))
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const debounceTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const editor = useEditor({
    immediatelyRender: false,
    shouldRerenderOnTransaction: false,
    content,
    extensions,
    onUpdate: ({ editor }) => {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        onChangeRef.current(editor.getHTML());
      }, 500);
    }
  });

  useEffect(() => {
    return () => clearTimeout(debounceTimer.current);
  }, []);

  if (!editor) return null;

  return (
    <RichTextProvider editor={editor}>
      <div className='overflow-hidden rounded-[0.5rem] bg-background shadow outline outline-1 outline-border'>
        <div className='flex max-h-full w-full flex-col'>
          <Toolbar />
          <EditorContent editor={editor} />
          <RichTextBubbleColumns />
          <RichTextBubbleLink />
          <RichTextBubbleImage />
          <RichTextBubbleVideo />
          <RichTextBubbleImageGif />
          <RichTextBubbleTable />
          <RichTextBubbleText />
          <RichTextBubbleMenuDragHandle />
          <SlashCommandList />
        </div>
      </div>
    </RichTextProvider>
  );
}
