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
 *
 * Full Word-like toolbar with hover tooltips on every button:
 * - Undo / Redo
 * - Block type (Paragraph, H1-H6, Quote)
 * - Bold, Italic, Underline
 * - Strikethrough, Subscript, Superscript
 * - Highlight
 * - Bullet list, Numbered list
 * - Create link, Insert image
 * - Insert table, Horizontal rule, Code block, Frontmatter, Admonition
 * - Markdown source view toggle (write / preview / diff)
 *
 * All toolbar buttons have native `title` attributes AND MDXEditor's
 * built-in TooltipWrap for hover descriptions. Larger 44px click targets
 * and pointer cursors for easy interaction.
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
                {/* Undo / Redo */}
                <UndoRedo />
                <Separator />
                {/* Block type: paragraph, headings, quote */}
                <BlockTypeSelect />
                <Separator />
                {/* Text formatting */}
                <BoldItalicUnderlineToggles />
                <StrikeThroughSupSubToggles />
                <HighlightToggle />
                <Separator />
                {/* Lists */}
                <ListsToggle />
                <Separator />
                {/* Links & images */}
                <CreateLink />
                <InsertImage />
                <Separator />
                {/* Insert blocks */}
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
          codeBlockPlugin({
            // Default language shown when a new code block is inserted.
            defaultCodeBlockLanguage: 'plaintext',
          }),
          imagePlugin({
            // Disable the built-in image dialog and just accept the URL
            // that the user types. When an image is pasted or dragged into
            // the editor, the src is used directly.
            imageAutocompleteSuggestions: [],
          }),
          tablePlugin(),
          linkPlugin(),
          linkDialogPlugin(),
          diffSourcePlugin(),
          frontmatterPlugin(),
          directivesPlugin({
            directiveDescriptors: [AdmonitionDirectiveDescriptor],
          }),
        ]}
        contentEditableClassName="prose prose-slate max-w-none min-h-[400px] p-5 focus:outline-none"
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
          codeBlockPlugin({
            defaultCodeBlockLanguage: 'plaintext',
          }),
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
