import "server-only";
import DOMPurify from "isomorphic-dompurify";

const TAGS = [
  "p",
  "h1",
  "h2",
  "h3",
  "strong",
  "em",
  "s",
  "ul",
  "ol",
  "li",
  "blockquote",
  "code",
  "pre",
  "hr",
  "a",
];

function cleanDocument(dirty: string) {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: TAGS,
    ALLOWED_ATTR: ["href"],
    ALLOW_ARIA_ATTR: false,
    ALLOW_DATA_ATTR: false,
    ALLOWED_URI_REGEXP: /^https:\/\//i,
    RETURN_DOM: true,
  });
}

export function sanitizeHtml(dirty: string): string {
  const body = cleanDocument(dirty);
  for (const element of body.querySelectorAll("[href]")) {
    const href = element.getAttribute("href") ?? "";
    if (
      element.localName === "a" &&
      /^https:\/\//i.test(href) &&
      URL.parse(href)?.protocol === "https:"
    ) {
      element.setAttribute("rel", "noopener noreferrer nofollow");
    } else {
      element.removeAttribute("href");
    }
  }
  return body.innerHTML;
}

export function hasHtmlText(html: string): boolean {
  return /[^\s\p{Default_Ignorable_Code_Point}]/u.test(cleanDocument(html).textContent ?? "");
}
