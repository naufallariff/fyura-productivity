"use client";

import type { Editor } from "@tiptap/react";
import { FloatingMenu } from "@tiptap/react/menus";
import { Heading1, Heading2, Heading3, List, ListOrdered, Minus, Quote } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { t } from "@/lib/i18n";

type Chain = ReturnType<Editor["chain"]>;

export const BLOCK_COMMANDS = [
  {
    key: "editor.heading1",
    icon: Heading1,
    run: (chain: Chain) => chain.toggleHeading({ level: 1 }),
  },
  {
    key: "editor.heading2",
    icon: Heading2,
    run: (chain: Chain) => chain.toggleHeading({ level: 2 }),
  },
  {
    key: "editor.heading3",
    icon: Heading3,
    run: (chain: Chain) => chain.toggleHeading({ level: 3 }),
  },
  { key: "editor.bulletList", icon: List, run: (chain: Chain) => chain.toggleBulletList() },
  {
    key: "editor.numberedList",
    icon: ListOrdered,
    run: (chain: Chain) => chain.toggleOrderedList(),
  },
  { key: "editor.quote", icon: Quote, run: (chain: Chain) => chain.toggleBlockquote() },
  { key: "editor.divider", icon: Minus, run: (chain: Chain) => chain.setHorizontalRule() },
];

function slashPosition(editor: Editor): number | null {
  const { empty, $from } = editor.state.selection;
  return empty &&
    $from.parentOffset === 1 &&
    $from.parent.type.name === "paragraph" &&
    $from.parent.textContent === "/"
    ? $from.pos
    : null;
}

function runCommand(editor: Editor, index: number) {
  const to = slashPosition(editor);
  if (to === null) return;
  BLOCK_COMMANDS[index]
    ?.run(
      editor
        .chain()
        .focus()
        .deleteRange({ from: to - 1, to }),
    )
    .run();
}

export function SlashMenu({ editor }: { readonly editor: Editor }) {
  const pluginKey = useId();
  const dismissed = useRef<number | null>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const dom = editor.view.dom;
    const clearDismissal = () => {
      if (slashPosition(editor) !== dismissed.current) dismissed.current = null;
    };
    const navigate = (event: KeyboardEvent) => {
      const position = slashPosition(editor);
      if (event.isComposing || position === null || position === dismissed.current) return;

      switch (event.key) {
        case "ArrowDown":
          setActive((index) => (index + 1) % BLOCK_COMMANDS.length);
          break;
        case "ArrowUp":
          setActive((index) => (index + BLOCK_COMMANDS.length - 1) % BLOCK_COMMANDS.length);
          break;
        case "Enter":
          runCommand(editor, active);
          break;
        case "Escape":
          dismissed.current = position;
          editor.commands.setMeta(pluginKey, "hide");
          break;
        default:
          return;
      }
      event.preventDefault();
      event.stopPropagation();
    };

    editor.on("transaction", clearDismissal);
    dom.addEventListener("keydown", navigate, true);
    return () => {
      editor.off("transaction", clearDismissal);
      dom.removeEventListener("keydown", navigate, true);
    };
  }, [active, editor, pluginKey]);

  return (
    <FloatingMenu
      editor={editor}
      pluginKey={pluginKey}
      updateDelay={0}
      tabIndex={-1}
      options={{ placement: "bottom-start", offset: 8, onHide: () => setActive(0) }}
      shouldShow={({ editor, view }) => {
        const position = slashPosition(editor);
        return (
          view.hasFocus() &&
          editor.isEditable &&
          position !== null &&
          position !== dismissed.current
        );
      }}
      className="z-20 max-h-[50dvh] max-w-[calc(100vw-2rem)] overflow-y-auto rounded-xl border border-(--border-subtle) bg-(--bg-surface-elevated) p-1 shadow-(--shadow-raised)"
    >
      <div role="group" aria-label={t("editor.blocks")} className="grid min-w-44">
        {BLOCK_COMMANDS.map(({ key, icon: Icon }, index) => (
          <button
            key={key}
            type="button"
            tabIndex={-1}
            data-active={active === index ? "true" : undefined}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => runCommand(editor, index)}
            className="text-ink hover:bg-accent-soft data-[active=true]:bg-accent-soft flex min-h-11 items-center gap-2 rounded-lg px-3 text-start text-sm"
          >
            <Icon aria-hidden className="size-4" />
            {t(key)}
          </button>
        ))}
      </div>
      <span role="status" className="sr-only">
        {t(BLOCK_COMMANDS[active]?.key ?? "editor.blocks")}
      </span>
    </FloatingMenu>
  );
}
