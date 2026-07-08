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
  CodeMirrorEditor,
  codeMirrorPlugin,
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
import { TooltipProvider } from '@/components/ui/tooltip';
import { useEffect, useRef } from 'react';

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
  const wrapperRef = useRef<HTMLDivElement>(null);

  // After mount, set native title attributes on every toolbar button so
  // the browser shows a hover tooltip with the tool name. This is a
  // guaranteed fallback that works even if the radix TooltipProvider
  // doesn't render the styled tooltips.
  useEffect(() => {
    if (!wrapperRef.current || readOnly) return;
    const btn = wrapperRef.current.querySelectorAll('.mdxeditor-toolbar button');
    // Map common button labels/aria-labels to descriptive names
    const labelMap: Record<string, string> = {
      'undo': 'Undo',
      'redo': 'Redo',
      'bold': 'Bold (Ctrl+B)',
      'italic': 'Italic (Ctrl+I)',
      'underline': 'Underline (Ctrl+U)',
      'strikethrough': 'Strikethrough',
      'subscript': 'Subscript',
      'superscript': 'Superscript',
      'highlight': 'Highlight',
      'bullet list': 'Bullet List',
      'numbered list': 'Numbered List',
      'link': 'Insert Link',
      'image': 'Insert Image',
      'table': 'Insert Table',
      'code block': 'Insert Code Block',
      'thematic break': 'Horizontal Rule',
      'frontmatter': 'Insert Frontmatter',
      'admonition': 'Insert Callout',
      'paragraph': 'Paragraph',
      'heading 1': 'Heading 1',
      'heading 2': 'Heading 2',
      'heading 3': 'Heading 3',
      'heading 4': 'Heading 4',
      'heading 5': 'Heading 5',
      'heading 6': 'Heading 6',
      'quote': 'Quote Block',
      'write': 'Write Mode',
      'preview': 'Preview Mode',
      'diff': 'Diff Mode',
    };
    btn.forEach((b) => {
      const text = (b.textContent || '').toLowerCase().trim();
      const aria = (b.getAttribute('aria-label') || '').toLowerCase().trim();
      const title = b.getAttribute('title') || '';
      if (title) return; // already has a title
      // Try to find a matching label
      for (const [key, val] of Object.entries(labelMap)) {
        if (text.includes(key) || aria.includes(key)) {
          b.setAttribute('title', val);
          return;
        }
      }
      // Fallback: use the text content capitalized
      if (text) {
        b.setAttribute('title', text.charAt(0).toUpperCase() + text.slice(1));
      }
    });
  }, [readOnly]);

  return (
    <TooltipProvider delayDuration={300}>
      <div ref={wrapperRef} className="rich-text-editor-wrapper rounded-lg border border-slate-200 bg-white overflow-hidden">
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
            // Register the built-in CodeMirrorEditor as a catch-all so
            // every language (including plaintext) has an editor. Without
            // this, the runtime throws 'No CodeBlockEditor registered'.
            codeBlockEditorDescriptors: [
              {
                priority: 0,
                match: () => true,
                Editor: CodeMirrorEditor,
              },
            ],
            defaultCodeBlockLanguage: 'plaintext',
          }),
          codeMirrorPlugin({
            codeBlockLanguages: {
            plaintext: 'Plain text',
            javascript: 'JavaScript',
            typescript: 'TypeScript',
            js: 'JavaScript',
            ts: 'TypeScript',
            jsx: 'JSX',
            tsx: 'TSX',
            python: 'Python',
            py: 'Python',
            java: 'Java',
            c: 'C',
            cpp: 'C++',
            'c++': 'C++',
            csharp: 'C#',
            'c#': 'C#',
            cs: 'C#',
            go: 'Go',
            rust: 'Rust',
            rs: 'Rust',
            ruby: 'Ruby',
            rb: 'Ruby',
            php: 'PHP',
            sql: 'SQL',
            html: 'HTML',
            css: 'CSS',
            json: 'JSON',
            yaml: 'YAML',
            yml: 'YAML',
            bash: 'Bash',
            sh: 'Shell',
            shell: 'Shell',
            markdown: 'Markdown',
            md: 'Markdown',
            xml: 'XML',
            graphql: 'GraphQL',
            dockerfile: 'Dockerfile',
            ini: 'INI',
            toml: 'TOML',
          },
            autoLoadLanguageSupport: true,
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
    </TooltipProvider>
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
            codeBlockEditorDescriptors: [
              {
                priority: 0,
                match: () => true,
                Editor: CodeMirrorEditor,
              },
            ],
            defaultCodeBlockLanguage: 'plaintext',
          }),
          codeMirrorPlugin({
            codeBlockLanguages: {
            plaintext: 'Plain text',
            javascript: 'JavaScript',
            typescript: 'TypeScript',
            python: 'Python',
            java: 'Java',
            c: 'C',
            cpp: 'C++',
            csharp: 'C#',
            go: 'Go',
            rust: 'Rust',
            ruby: 'Ruby',
            php: 'PHP',
            sql: 'SQL',
            html: 'HTML',
            css: 'CSS',
            json: 'JSON',
            yaml: 'YAML',
            bash: 'Bash',
            shell: 'Shell',
            markdown: 'Markdown',
          },
            autoLoadLanguageSupport: true,
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
