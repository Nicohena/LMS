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

export function RichTextEditor({ value, onChange, placeholder, readOnly }: RichTextEditorProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!wrapperRef.current || readOnly) return;
    const btn = wrapperRef.current.querySelectorAll('.mdxeditor-toolbar button');

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
      if (title) return; 
      for (const [key, val] of Object.entries(labelMap)) {
        if (text.includes(key) || aria.includes(key)) {
          b.setAttribute('title', val);
          return;
        }
      }
      
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
