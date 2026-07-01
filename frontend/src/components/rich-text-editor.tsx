'use client';

import {
  MDXEditor,
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  thematicBreakPlugin,
  markdownShortcutPlugin,
  toolbarPlugin,
  BoldItalicUnderlineToggles,
  ListsToggle,
  BlockTypeSelect,
  UndoRedo,
  CreateLink,
  InsertThematicBreak,
  InsertCodeBlock,
  InsertImage,
  InsertTable,
  codeBlockPlugin,
  imagePlugin,
  tablePlugin,
  linkDialogPlugin,
  linkPlugin,
  diffSourcePlugin,
  DiffSourceToggleWrapper,
  HighlightToggle,
  KitchenSinkToolbar,
} from '@mdxeditor/editor';
import '@mdxeditor/editor/style.css';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
}

/**
 * Markdown-based rich text editor powered by MDXEditor.
 * Supports: headings, bold/italic/underline, lists, quotes, links,
 * code blocks, images, tables, thematic breaks, source view toggle.
 */
export function RichTextEditor({ value, onChange, placeholder, readOnly }: RichTextEditorProps) {
  return (
    <div className="rich-text-editor-wrapper rounded-lg border border-slate-200 bg-white overflow-hidden">
      <MDXEditor
        markdown={value || ''}
        onChange={onChange}
        placeholder={placeholder || 'Start writing...'}
        readOnly={readOnly}
        plugins={[
          toolbarPlugin({
            toolbarContents: () => (
              <DiffSourceToggleWrapper>
                <UndoRedo />
                <BlockTypeSelect />
                <BoldItalicUnderlineToggles />
                <HighlightToggle />
                <ListsToggle />
                <CreateLink />
                <InsertCodeBlock />
                <InsertImage />
                <InsertTable />
                <InsertThematicBreak />
              </DiffSourceToggleWrapper>
            ),
          }),
          headingsPlugin(),
          listsPlugin(),
          quotePlugin(),
          thematicBreakPlugin(),
          markdownShortcutPlugin(),
          codeBlockPlugin(),
          imagePlugin(),
          tablePlugin(),
          linkPlugin(),
          linkDialogPlugin(),
          diffSourcePlugin(),
        ]}
        contentEditableClassName="prose max-w-none min-h-[200px] p-4 focus:outline-none"
      />
    </div>
  );
}

/**
 * Render stored markdown content as read-only HTML.
 * Uses the same MDXEditor in readOnly mode for consistent rendering.
 */
export function RichTextRenderer({ content }: { content: string }) {
  if (!content || content.trim() === '') {
    return <p className="text-sm italic text-slate-400">No content yet.</p>;
  }
  return (
    <div className="prose prose-slate max-w-none">
      <MDXEditor
        markdown={content}
        readOnly
        plugins={[
          headingsPlugin(),
          listsPlugin(),
          quotePlugin(),
          thematicBreakPlugin(),
          codeBlockPlugin(),
          imagePlugin(),
          tablePlugin(),
          linkPlugin(),
        ]}
        contentEditableClassName="focus:outline-none"
      />
    </div>
  );
}
