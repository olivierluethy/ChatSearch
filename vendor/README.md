# Vendored libraries

Local, CSP-safe copies loaded by `manifest.json` (`content_scripts.js`) **before**
`content.js`. No CDN is used at runtime (Manifest V3 disallows remote code).

| File | Library | Version | Notes |
|---|---|---|---|
| `marked.min.js` | [marked](https://github.com/markedjs/marked) | 12.0.2 | Markdown → HTML. Exposes global `marked` (`marked.parse`). |
| `purify.min.js` | [DOMPurify](https://github.com/cure53/DOMPurify) | 3.1.6 | HTML sanitiser. Exposes global `DOMPurify`. |
| `highlight.min.js` | [highlight.js](https://github.com/highlightjs/highlight.js) | 11.9.0 | **Custom trimmed build** (esbuild IIFE). Exposes global `hljs`. |

## highlight.js custom build

Trimmed to only the languages ChatSearch needs, keeping the bundle small:
`javascript` (js), `typescript` (ts), `python` (py), `json`, `bash` (sh/shell/zsh),
`xml` (html/xhtml), `css`. Built from `highlight.js/lib/core` + individual language
grammars, bundled with esbuild (`--format=iife --minify`), attaching `window.hljs`.

The syntax-highlight colour theme is **not** an external stylesheet — it is injected as
an inline `<style>` by `content.js`, using the slate/blue tokens in `docs/STYLEGUIDE.md`.
