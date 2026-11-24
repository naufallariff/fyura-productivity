export function RichTextContent({
  body,
  isHtml,
}: {
  readonly body: string;
  readonly isHtml: boolean;
}) {
  return isHtml ? (
    <div
      className="rich-text text-ink max-w-prose text-sm leading-relaxed"
      dangerouslySetInnerHTML={{ __html: body }}
    />
  ) : (
    <p className="text-ink max-w-prose text-sm leading-relaxed wrap-anywhere whitespace-pre-wrap">
      {body}
    </p>
  );
}

export function plainTextToEditorHtml(text: string): string {
  return text
    .split(/\r\n?|\n/)
    .map(
      (line) =>
        `<p>${line.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")}</p>`,
    )
    .join("");
}
