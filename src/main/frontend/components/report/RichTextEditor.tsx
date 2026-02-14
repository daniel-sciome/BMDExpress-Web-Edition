import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { Button, Space, Divider, Tooltip } from 'antd';
import {
  BoldOutlined,
  ItalicOutlined,
  OrderedListOutlined,
  UnorderedListOutlined,
  UndoOutlined,
  RedoOutlined,
  TableOutlined,
  LinkOutlined,
} from '@ant-design/icons';

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({ content, onChange, placeholder }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
      }),
      Image,
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      Link.configure({ openOnClick: false }),
      Placeholder.configure({
        placeholder: placeholder || 'Start writing...',
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Sync external content changes (e.g., LLM-generated content)
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content, { emitUpdate: false });
    }
  }, [content]);

  if (!editor) return null;

  return (
    <div style={{ border: '1px solid #d9d9d9', borderRadius: 6 }}>
      {/* Toolbar */}
      <div style={{
        padding: '4px 8px',
        borderBottom: '1px solid #f0f0f0',
        background: '#fafafa',
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 2,
      }}>
        <Space size={2}>
          <Tooltip title="Bold (Ctrl+B)">
            <Button
              type={editor.isActive('bold') ? 'primary' : 'text'}
              size="small"
              icon={<BoldOutlined />}
              onClick={() => editor.chain().focus().toggleBold().run()}
            />
          </Tooltip>
          <Tooltip title="Italic (Ctrl+I)">
            <Button
              type={editor.isActive('italic') ? 'primary' : 'text'}
              size="small"
              icon={<ItalicOutlined />}
              onClick={() => editor.chain().focus().toggleItalic().run()}
            />
          </Tooltip>
        </Space>

        <Divider type="vertical" />

        <Space size={2}>
          <Tooltip title="Heading 2">
            <Button
              type={editor.isActive('heading', { level: 2 }) ? 'primary' : 'text'}
              size="small"
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            >
              H2
            </Button>
          </Tooltip>
          <Tooltip title="Heading 3">
            <Button
              type={editor.isActive('heading', { level: 3 }) ? 'primary' : 'text'}
              size="small"
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            >
              H3
            </Button>
          </Tooltip>
          <Tooltip title="Heading 4">
            <Button
              type={editor.isActive('heading', { level: 4 }) ? 'primary' : 'text'}
              size="small"
              onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
            >
              H4
            </Button>
          </Tooltip>
        </Space>

        <Divider type="vertical" />

        <Space size={2}>
          <Tooltip title="Bullet List">
            <Button
              type={editor.isActive('bulletList') ? 'primary' : 'text'}
              size="small"
              icon={<UnorderedListOutlined />}
              onClick={() => editor.chain().focus().toggleBulletList().run()}
            />
          </Tooltip>
          <Tooltip title="Ordered List">
            <Button
              type={editor.isActive('orderedList') ? 'primary' : 'text'}
              size="small"
              icon={<OrderedListOutlined />}
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
            />
          </Tooltip>
          <Tooltip title="Blockquote">
            <Button
              type={editor.isActive('blockquote') ? 'primary' : 'text'}
              size="small"
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
            >
              &ldquo;
            </Button>
          </Tooltip>
        </Space>

        <Divider type="vertical" />

        <Space size={2}>
          <Tooltip title="Insert Table">
            <Button
              type="text"
              size="small"
              icon={<TableOutlined />}
              onClick={() => editor.chain().focus()
                .insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
            />
          </Tooltip>
          <Tooltip title="Insert Link">
            <Button
              type={editor.isActive('link') ? 'primary' : 'text'}
              size="small"
              icon={<LinkOutlined />}
              onClick={() => {
                const url = window.prompt('URL:');
                if (url) {
                  editor.chain().focus().setLink({ href: url }).run();
                }
              }}
            />
          </Tooltip>
        </Space>

        <Divider type="vertical" />

        <Space size={2}>
          <Tooltip title="Undo">
            <Button
              type="text"
              size="small"
              icon={<UndoOutlined />}
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
            />
          </Tooltip>
          <Tooltip title="Redo">
            <Button
              type="text"
              size="small"
              icon={<RedoOutlined />}
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
            />
          </Tooltip>
        </Space>
      </div>

      {/* Editor content */}
      <EditorContent
        editor={editor}
        style={{ padding: 16, minHeight: 350 }}
      />

      <style>{`
        .tiptap {
          outline: none;
          font-size: 14px;
          line-height: 1.7;
        }
        .tiptap h2 { font-size: 1.4em; font-weight: 600; margin-top: 1em; }
        .tiptap h3 { font-size: 1.2em; font-weight: 600; margin-top: 0.8em; }
        .tiptap h4 { font-size: 1.1em; font-weight: 600; margin-top: 0.6em; }
        .tiptap p { margin-bottom: 0.5em; }
        .tiptap ul, .tiptap ol { padding-left: 1.5em; }
        .tiptap blockquote {
          border-left: 3px solid #ddd;
          padding-left: 12px;
          color: #666;
          margin: 0.5em 0;
        }
        .tiptap table {
          border-collapse: collapse;
          width: 100%;
          margin: 0.5em 0;
        }
        .tiptap th, .tiptap td {
          border: 1px solid #d9d9d9;
          padding: 6px 10px;
          text-align: left;
        }
        .tiptap th { background: #fafafa; font-weight: 600; }
        .tiptap img { max-width: 100%; border-radius: 4px; }
        .tiptap p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #adb5bd;
          pointer-events: none;
          height: 0;
        }
      `}</style>
    </div>
  );
}
