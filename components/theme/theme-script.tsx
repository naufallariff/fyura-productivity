/** Runs before first paint. Resolves "system" to light or dark from the OS preference. */
const SCRIPT = `(function(){
    var root = document.documentElement;
    var mode = root.getAttribute("data-mode");
    if (mode === "system") {
        var dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        root.setAttribute("data-mode", dark ? "dark" : "light");
    }
})();`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: SCRIPT }} />;
}
