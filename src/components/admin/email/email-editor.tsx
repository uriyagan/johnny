"use client";

import { useState } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";

function ToolbarButton({
  active,
  onClick,
  title,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`h-8 min-w-8 rounded-md px-2 text-sm font-medium ${
        active
          ? "bg-emerald-600 text-white"
          : "bg-surface-2 text-foreground hover:bg-white/10"
      }`}
    >
      {children}
    </button>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  const setLink = () => {
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("כתובת הקישור:", prev ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  return (
    <div className="flex flex-wrap gap-1 border-b border-border bg-surface p-2">
      <ToolbarButton
        title="מודגש"
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <b>B</b>
      </ToolbarButton>
      <ToolbarButton
        title="נטוי"
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <i>I</i>
      </ToolbarButton>
      <ToolbarButton
        title="כותרת"
        active={editor.isActive("heading", { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        כותרת
      </ToolbarButton>
      <ToolbarButton
        title="רשימה"
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        • רשימה
      </ToolbarButton>
      <ToolbarButton
        title="רשימה ממוספרת"
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        1. רשימה
      </ToolbarButton>
      <ToolbarButton
        title="קישור"
        active={editor.isActive("link")}
        onClick={setLink}
      >
        🔗 קישור
      </ToolbarButton>
    </div>
  );
}

export function EmailEditor({
  name,
  defaultValue,
  mergeTags,
}: {
  name: string;
  defaultValue: string;
  mergeTags: string[];
}) {
  const [html, setHtml] = useState(defaultValue);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false, HTMLAttributes: { rel: "noopener" } }),
    ],
    content: defaultValue,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        dir: "rtl",
        class: "tiptap min-h-[260px] px-4 py-3 focus:outline-none",
      },
    },
    onUpdate: ({ editor }) => setHtml(editor.getHTML()),
  });

  return (
    <div>
      <div className="overflow-hidden rounded-lg border border-border bg-surface-2">
        {editor && <Toolbar editor={editor} />}
        <EditorContent editor={editor} />
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1">
        <span className="text-xs text-muted-2">הוספת תג:</span>
        {mergeTags.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() =>
              editor?.chain().focus().insertContent(`{{${tag}}}`).run()
            }
            className="rounded bg-surface-2 px-2 py-0.5 text-xs text-emerald-300 hover:bg-white/10"
            dir="ltr"
          >
            {`{{${tag}}}`}
          </button>
        ))}
      </div>

      <input type="hidden" name={name} value={html} />
    </div>
  );
}
