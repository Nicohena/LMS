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
  StrikeThroughSupSubToggles,
  Separator,
  InsertFrontmatter,
  frontmatterPlugin,
  directivesPlugin,
  AdmonitionDirectiveDescriptor,
  InsertAdmonition,
} from '@mdxeditor/editor';
import '@mdxeditor/editor/style.css';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
}

/**
 * Enhanced markdown-based rich text editor powered by MDXEditor.
 * Full Word-like toolbar with: undo/redo, block type (headings/quote/paragraph),
 * bold/italic/underline, strikethrough/subscript/superscript, highlight,
 * bullet/numbered lists, links, code blocks, images, tables, thematic breaks,
 * frontmatter, admonitions (callouts), and markdown source view toggle.
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
                <Separator />
                <BlockTypeSelect />
                <Separator />
                <BoldItalicUnderlineToggles />
                <StrikeThroughSupSubToggles />
                <HighlightToggle />
                <Separator />
                <ListsToggle />
                <Separator />
                <CreateLink />
                <InsertImage />
                <Separator />
                <InsertTable />
                <InsertThematicBreak />
                <InsertCodeBlock />
                <InsertFrontmatter />
                <InsertAdmonition />
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
          frontmatterPlugin(),
          directivesPlugin({
            directiveDescriptors: [AdmonitionDirectiveDescriptor],
          }),
        ]}
        contentEditableClassName="prose prose-slate max-w-none min-h-[300px] p-5 focus:outline-none"
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
          frontmatterPlugin(),
          directivesPlugin({
            directiveDescriptors: [AdmonitionDirectiveDescriptor],
          }),
        ]}
        contentEditableClassName="focus:outline-none"
      />
    </div>
  );
}
