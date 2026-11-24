"use client";

import { Bold, Code, Italic, Link2, Strikethrough, Unlink2 } from "lucide-react";
import { useEditorState, type Editor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { t } from "@/lib/i18n";

const FORMATS = [
  { mark: "bold", icon: Bold },
  { mark: "italic", icon: Italic },
  { mark: "strike", icon: Strikethrough },
  { mark: "code", icon: Code },
] as const;

const BUTTON_STYLE =
  "size-11 rounded-full p-0 aria-pressed:bg-accent-soft aria-pressed:text-accent";

export function isHttpsLink(href: string): boolean {
  return /^https:\/\//i.test(href) && URL.parse(href)?.protocol === "https:";
}

export function BubbleToolbar({ editor }: { readonly editor: Editor }) {
  const [editingLink, setEditingLink] = useState(false);
  const [url, setUrl] = useState("");
  const [invalid, setInvalid] = useState(false);
  const marks = useEditorState({
    editor,
    selector: ({ editor }) => ({
      bold: editor.isActive("bold"),
      italic: editor.isActive("italic"),
      strike: editor.isActive("strike"),
      code: editor.isActive("code"),
      link: editor.isActive("link"),
    }),
  });

  function closeLink() {
    setEditingLink(false);
    setUrl("");
    setInvalid(false);
  }

  function applyLink() {
    const href = url.trim();
    if (!isHttpsLink(href)) {
      setInvalid(true);
      return;
    }
    editor.chain().focus().setLink({ href }).run();
    closeLink();
  }

  return (
    <BubbleMenu
      editor={editor}
      updateDelay={0}
      options={{ placement: "top", offset: 8, onHide: closeLink }}
      tabIndex={-1}
      className="z-30 max-w-[calc(100vw-2rem)]"
      onKeyDown={(event) => {
        if (event.key === "Escape" && editingLink) {
          event.preventDefault();
          event.stopPropagation();
          closeLink();
          editor.commands.focus();
        }
      }}
    >
      <div
        role="group"
        aria-label={t("editor.formatting")}
        data-glass-permitted
        className="glass mx-auto flex w-fit origin-(--transform-origin) gap-1 rounded-full p-1 [--transform-origin:50%_100%]"
      >
        {FORMATS.map(({ mark, icon }) => (
          <Button
            key={mark}
            variant="ghost"
            size="sm"
            icon={icon}
            className={BUTTON_STYLE}
            aria-label={t(`editor.${mark}`)}
            title={t(`editor.${mark}`)}
            aria-pressed={marks[mark]}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => editor.chain().focus().toggleMark(mark).run()}
          />
        ))}
        <Button
          variant="ghost"
          size="sm"
          icon={marks.link ? Unlink2 : Link2}
          className={BUTTON_STYLE}
          aria-label={t(marks.link ? "editor.unlink" : "editor.link")}
          title={t(marks.link ? "editor.unlink" : "editor.link")}
          aria-pressed={marks.link}
          aria-expanded={editingLink}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => {
            if (marks.link) editor.chain().focus().unsetLink().run();
            else setEditingLink((open) => !open);
          }}
        />
      </div>
      {editingLink && (
        <div className="mt-2 grid gap-2 rounded-xl border border-(--border-subtle) bg-(--bg-surface-elevated) p-2 shadow-(--shadow-raised)">
          <div className="flex gap-2">
            <Input
              autoFocus
              type="url"
              aria-label={t("editor.linkAddress")}
              placeholder="https://"
              invalid={invalid}
              value={url}
              className="min-w-0"
              onChange={(event) => {
                setUrl(event.target.value);
                setInvalid(false);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  applyLink();
                }
              }}
            />
            <Button onClick={applyLink}>{t("editor.link")}</Button>
          </div>
          {invalid && (
            <p role="alert" className="text-negative text-xs">
              {t("editor.linkInvalid")}
            </p>
          )}
        </div>
      )}
    </BubbleMenu>
  );
}
