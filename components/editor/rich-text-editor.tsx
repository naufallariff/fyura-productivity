"use client";

import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useId } from "react";
import { t } from "@/lib/i18n";
import { BubbleToolbar, isHttpsLink } from "./bubble-toolbar";
import { BLOCK_COMMANDS, SlashMenu } from "./slash-menu";

export function RichTextEditor({
  label,
  initialHtml = "",
  onUpdate,
}: {
  readonly label: string;
  readonly initialHtml?: string;
  readonly onUpdate: (html: string) => void;
}) {
  const labelId = useId();
  const hintId = useId();
  const editor = useEditor({
    immediatelyRender: false,
    injectCSS: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        hardBreak: false,
        link: false,
        underline: false,
      }),
      Placeholder.configure({ placeholder: t("editor.placeholder") }),
      Link.configure({
        defaultProtocol: "https",
        isAllowedUri: isHttpsLink,
        openOnClick: false,
        HTMLAttributes: { target: null, rel: "noopener noreferrer nofollow" },
      }),
    ],
    content: initialHtml,
    editorProps: {
      handleDOMEvents: {
        // ProseMirror consumes Escape by default. Let native dialogs handle it after editor menus.
        keydown: (_view, event) => event.key === "Escape" && !event.isComposing,
      },
      attributes: {
        role: "textbox",
        "aria-labelledby": labelId,
        "aria-describedby": hintId,
        "aria-multiline": "true",
        "aria-required": "true",
        class:
          "rich-text min-h-28 max-w-prose wrap-anywhere px-4 py-3 text-base leading-relaxed outline-hidden focus-visible:ring-2 focus-visible:ring-accent",
      },
    },
    onUpdate: ({ editor }) => onUpdate(editor.isEmpty ? "" : editor.getHTML()),
  });

  return (
    <div className="min-w-0 space-y-2">
      <span id={labelId} className="text-ink block text-sm font-medium">
        {label}
      </span>
      <div className="rounded-xl border border-(--border-control) bg-(--bg-surface)">
        <div className="border-line flex flex-wrap items-center gap-x-3 gap-y-1 border-b px-3">
          <select
            aria-label={t("editor.blocks")}
            className="text-ink min-h-11 max-w-full rounded-lg bg-(--bg-surface) text-base sm:text-sm"
            disabled={!editor}
            value=""
            onChange={(event) => {
              if (editor)
                BLOCK_COMMANDS.find(({ key }) => key === event.target.value)
                  ?.run(editor.chain().focus())
                  .run();
            }}
          >
            <option value="" disabled>
              {t("editor.blocks")}
            </option>
            {BLOCK_COMMANDS.map(({ key }) => (
              <option key={key} value={key}>
                {t(key)}
              </option>
            ))}
          </select>
          <span id={hintId} className="text-ink-muted text-xs">
            {t("editor.slashHint")}
          </span>
        </div>
        <EditorContent editor={editor} className="relative min-h-28" />
        {editor && <BubbleToolbar editor={editor} />}
        {editor && <SlashMenu editor={editor} />}
      </div>
    </div>
  );
}
