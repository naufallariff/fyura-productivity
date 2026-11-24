import { describe, expect, it } from "vitest";
import { hasHtmlText, sanitizeHtml } from "@/server/validation/sanitize";

describe("sanitizeHtml", () => {
  it("drops executable markup, embeds, event handlers, and inline styles", () => {
    expect(
      sanitizeHtml(
        '<script>bad()</script><style>p { color: red }</style><iframe src="https://example.com"></iframe>' +
          '<img src="invalid" onerror="bad()"><p onclick="bad()" style="color: red" data-id="1" aria-label="unsafe">Keep this</p>',
      ),
    ).toBe("<p>Keep this</p>");
  });

  it("allows href only on HTTPS anchors and enforces the link relation", () => {
    expect(
      sanitizeHtml(
        '<a href="jav&#97;script:bad()">script</a><a href="data:text/html,test">data</a>' +
          '<a href="http://example.com">http</a><a href="//example.com">relative</a>' +
          '<p href="https://example.com"><a href="https://example.com/" target="_blank" rel="opener">safe</a></p>',
      ),
    ).toBe(
      '<a>script</a><a>data</a><a>http</a><a>relative</a><p><a href="https://example.com/" rel="noopener noreferrer nofollow">safe</a></p>',
    );
  });

  it("preserves the supported formatting", () => {
    const html =
      "<h1>One</h1><h2>Two</h2><h3>Three</h3><p><strong>Bold</strong> <em>em</em> <s>strike</s> <code>x</code></p>" +
      "<ul><li><p>Item</p></li></ul><ol><li><p>First</p></li></ol><blockquote><p>Quote</p></blockquote><pre><code>line\nline</code></pre><hr>";
    expect(sanitizeHtml(html)).toBe(html);
  });

  it("requires readable text after sanitization", () => {
    expect(hasHtmlText(sanitizeHtml("<p>&#8203;&nbsp;</p><hr><script>bad()</script>"))).toBe(false);
    expect(hasHtmlText(sanitizeHtml("<p>&lt;3</p>"))).toBe(true);
  });
});
