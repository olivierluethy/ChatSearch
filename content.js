const MEASUREMENT_ID = "G-8MTV9HMJF4";
const API_SECRET = "__REDACTED_GA_SECRET__";

window.dataLayer = window.dataLayer || [];
function gtag() {
  dataLayer.push(arguments);
}
gtag("js", new Date());
gtag("config", "G-8MTV9HMJF4");

function sendGAEvent(eventName, params = {}) {
  const clientId = localStorage.getItem("ga_client_id") || crypto.randomUUID();
  localStorage.setItem("ga_client_id", clientId);

  fetch(
    "https://www.google-analytics.com/mp/collect?measurement_id=G-8MTV9HMJF4&api_secret=__REDACTED_GA_SECRET__",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        events: [
          {
            name: eventName,
            params: {
              ...params,
              timestamp: new Date().toISOString(),
            },
          },
        ],
      }),
    },
  )
    .then((res) => {
      console.log(`[GA] Event "${eventName}" gesendet:`, res.status);
    })
    .catch((err) => {
      console.error(`[GA] Fehler beim Senden des Events "${eventName}":`, err);
    });
}

(function () {
  const CONTAINER_ID = "custom-ai-box";

  // SVG icon for user (unchanged)
  const userIcon = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="#555"/>
    </svg>
  `;

  // SVG icon for AI (unchanged)
  const aiIcon = `
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="24" rx="12" fill="#E3F2FD"/>
      <path d="M12 2C12.55 2 13 2.45 13 3V4H11V3C11 2.45 11.45 2 12 2Z" fill="#1565C0"/>
      <circle cx="12" cy="12" r="6" fill="white" stroke="#1565C0" stroke-width="2"/>
      <circle cx="9.5" cy="11.5" r="1.5" fill="#1565C0"/>
      <circle cx="14.5" cy="11.5" r="1.5" fill="#1565C0"/>
      <path d="M9 15C9.5 15.5 10.7 16 12 16C13.3 16 14.5 15.5 15 15" stroke="#1565C0" stroke-width="1.5" stroke-linecap="round"/>
    </svg>
  `;

  // Issue #9 — custom AI avatar via URL. Cached so the typing indicator and
  // freshly rendered messages use the latest applied image.
  let currentAvatarUrl = "";

  // Round 2 — thread search state (module scope so helpers can read it).
  let threadSearchQuery = "";
  let pendingScroll = null; // { threadId, matchText } — scroll to a match on open

  function isHttpUrl(u) {
    return typeof u === "string" && /^https?:\/\//i.test(u.trim());
  }

  // Build the AI avatar as a real node (inline onerror is blocked by page CSP,
  // so the SVG fallback is wired with addEventListener).
  function createAiAvatarNode(url) {
    const src = url == null ? currentAvatarUrl : url;
    if (isHttpUrl(src)) {
      const img = document.createElement("img");
      img.src = src.trim();
      img.alt = "AI";
      img.style.cssText =
        "width:32px;height:32px;border-radius:50%;object-fit:cover;display:block;";
      img.addEventListener("error", () => {
        const span = document.createElement("span");
        span.innerHTML = aiIcon;
        if (img.parentNode) img.replaceWith(span);
      });
      return img;
    }
    const span = document.createElement("span");
    span.innerHTML = aiIcon;
    return span;
  }

  // =========================================================================
  // Issue #10 — Markdown rendering, code highlighting, and copy buttons
  // =========================================================================
  const MONO_FONT =
    "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace";

  // Clipboard write with a hidden-textarea + execCommand fallback.
  function fallbackCopy(text) {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.top = "-9999px";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      return true;
    } catch (e) {
      return false;
    }
  }

  function copyTextToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard
        .writeText(text)
        .catch(() => fallbackCopy(text));
    }
    return Promise.resolve(fallbackCopy(text));
  }

  // A reusable "Copy" button that shows transient "Copied!" feedback.
  function makeCopyButton(getText, extraClass) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "cs-copy-btn" + (extraClass ? " " + extraClass : "");
    btn.textContent = "Copy";
    btn.title = "Copy to clipboard";
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      Promise.resolve(copyTextToClipboard(getText())).then(() => {
        btn.textContent = "Copied!";
        setTimeout(() => {
          btn.textContent = "Copy";
        }, 1200);
      });
    });
    return btn;
  }

  // Small text button sharing the copy-button styling (used for per-message PDF).
  function makeMiniButton(label, title, onClick) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "cs-copy-btn";
    btn.textContent = label;
    btn.title = title;
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      onClick();
    });
    return btn;
  }

  // Inject the Markdown + highlight.js theme once. Colours come from
  // docs/STYLEGUIDE.md (slate/blue palette) — no external theme file.
  function injectFormattingStyles() {
    if (document.getElementById("cs-formatting-styles")) return;
    const style = document.createElement("style");
    style.id = "cs-formatting-styles";
    style.textContent = `
      .cs-md { font-size: 0.95rem; line-height: 1.5; }
      .cs-md > *:first-child { margin-top: 0; }
      .cs-md > *:last-child { margin-bottom: 0; }
      .cs-md p { margin: 0 0 8px; }
      .cs-md ul, .cs-md ol { margin: 0 0 8px; padding-left: 1.4em; }
      .cs-md li { margin: 2px 0; }
      .cs-md h1, .cs-md h2, .cs-md h3, .cs-md h4, .cs-md h5, .cs-md h6 {
        margin: 8px 0 4px; font-weight: 600; line-height: 1.3; color: var(--cs-text, #1e293b);
      }
      .cs-md h1 { font-size: 1.15rem; }
      .cs-md h2 { font-size: 1.08rem; }
      .cs-md h3 { font-size: 1rem; }
      .cs-md h4, .cs-md h5, .cs-md h6 { font-size: 0.95rem; }
      .cs-md a { color: var(--cs-primary, #2563eb); text-decoration: underline; }
      .cs-md blockquote {
        margin: 0 0 8px; padding: 4px 12px;
        border-left: 3px solid var(--cs-border, #cbd5e1); color: var(--cs-text-muted, #475569);
      }
      .cs-md hr { border: none; border-top: 1px solid var(--cs-border, #e2e8f0); margin: 12px 0; }
      .cs-md :not(pre) > code {
        background: var(--cs-code-inline, #e5e7eb); color: var(--cs-text, #1e293b); padding: 1px 5px;
        border-radius: 4px; font-family: ${MONO_FONT}; font-size: 0.85em;
      }
      .cs-md table { border-collapse: collapse; margin: 0 0 8px; font-size: 0.9rem; }
      .cs-md th, .cs-md td { border: 1px solid var(--cs-border, #e2e8f0); padding: 4px 8px; }
      .cs-md th { background: var(--cs-sidebar, #f1f5f9); }

      .cs-code-wrap { position: relative; margin: 0 0 8px; }
      .cs-code-wrap pre {
        margin: 0; background: var(--cs-chat-bg, #f8fafc); border: 1px solid var(--cs-border, #e2e8f0);
        border-radius: 8px; padding: 12px 14px; overflow-x: auto;
      }
      .cs-code-wrap pre code {
        font-family: ${MONO_FONT}; font-size: 0.85rem; line-height: 1.5;
        background: none; padding: 0; color: var(--cs-text, #1e293b);
      }

      .cs-copy-btn {
        background: var(--cs-neutral, #e5e7eb); color: var(--cs-text, #1e293b); border: none; border-radius: 6px;
        font-size: 0.75rem; font-weight: 500; padding: 4px 8px; cursor: pointer;
        transition: background 0.2s ease;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      .cs-copy-btn:hover { background: var(--cs-neutral-hover, #d1d5db); }
      .cs-code-copy {
        position: absolute; top: 8px; right: 8px; opacity: 0;
        transition: opacity 0.2s ease, background 0.2s ease;
      }
      .cs-code-wrap:hover .cs-code-copy,
      .cs-code-copy:focus { opacity: 1; }
      .cs-msg-copy { margin-top: 4px; align-self: flex-start; }

      /* highlight.js theme — driven by tokens (STYLEGUIDE §9/§10) */
      .hljs { color: var(--cs-text, #1e293b); background: transparent; }
      .hljs-comment, .hljs-quote { color: var(--cs-code-com, #64748b); font-style: italic; }
      .hljs-keyword, .hljs-selector-tag, .hljs-built_in,
      .hljs-name, .hljs-literal { color: var(--cs-code-kw, #2563eb); }
      .hljs-string, .hljs-addition, .hljs-regexp, .hljs-symbol { color: var(--cs-code-str, #0f766e); }
      .hljs-number, .hljs-meta .hljs-number, .hljs-bullet, .hljs-link { color: var(--cs-code-num, #b45309); }
      .hljs-title, .hljs-title.function_, .hljs-section { color: var(--cs-code-fn, #1e40af); font-weight: 500; }
      .hljs-attr, .hljs-attribute, .hljs-variable, .hljs-template-variable { color: var(--cs-text, #1e293b); }
      .hljs-type, .hljs-class .hljs-title, .hljs-tag, .hljs-meta { color: var(--cs-code-type, #7c3aed); }
      .hljs-deletion { color: var(--cs-danger, #b91c1c); }
      .hljs-emphasis { font-style: italic; }
      .hljs-strong { font-weight: 700; }
    `;
    document.head.appendChild(style);
  }

  // Render Markdown text into a container: marked -> DOMPurify -> innerHTML,
  // then highlight fenced code and attach per-block copy buttons.
  function renderMarkdownInto(container, text) {
    injectFormattingStyles();
    if (typeof marked === "undefined" || typeof DOMPurify === "undefined") {
      container.textContent = text; // safe fallback if libs failed to load
      return;
    }
    try {
      const html = marked.parse(text == null ? "" : String(text), {
        gfm: true,
        breaks: true,
      });
      container.innerHTML = DOMPurify.sanitize(html);
    } catch (e) {
      container.textContent = text;
      return;
    }
    container.classList.add("cs-md");

    container.querySelectorAll("pre > code").forEach((code) => {
      const pre = code.parentElement;
      if (typeof hljs !== "undefined") {
        try {
          hljs.highlightElement(code);
        } catch (e) {
          /* unknown language -> leave as plain code */
        }
      }
      const wrap = document.createElement("div");
      wrap.className = "cs-code-wrap";
      pre.parentNode.insertBefore(wrap, pre);
      wrap.appendChild(pre);
      wrap.appendChild(makeCopyButton(() => code.textContent, "cs-code-copy"));
    });
  }

  // =========================================================================
  // Issues #1 / #9 — persisted user settings
  // =========================================================================
  const DEFAULT_SETTINGS = {
    newChatPerSearch: false,
    aiAvatarUrl: "",
    theme: "auto", // "light" | "dark" | "auto"
  };

  // Inject the theme token sheet once: light variables on the root, dark values
  // under [data-theme="dark"] and auto-dark via prefers-color-scheme. Legacy
  // inline colours are overridden in dark only, so the light UI is untouched.
  function injectThemeStyles() {
    if (document.getElementById("cs-theme-styles")) return;
    const R = "#custom-ai-box";
    const lightVars = `
      ${R} {
        --cs-grad-a:#ffffff; --cs-grad-b:#f8fafc;
        --cs-surface:#ffffff; --cs-sidebar:#f1f5f9; --cs-chat-bg:#f8fafc;
        --cs-border:#e2e8f0; --cs-border-strong:#d1d5db;
        --cs-neutral:#e5e7eb; --cs-neutral-hover:#d1d5db;
        --cs-text:#1e293b; --cs-text-muted:#64748b;
        --cs-primary:#2563eb; --cs-primary-hover:#1e40af;
        --cs-active:#e3f2fd; --cs-active-hover:#bfdbfe; --cs-hover:#f1f5f9;
        --cs-danger:#dc2626; --cs-danger-hover:#b91c1c;
        --cs-scroll-thumb:#94a3b8; --cs-scroll-track:#e2e8f0;
        --cs-code-kw:#2563eb; --cs-code-str:#0f766e; --cs-code-num:#b45309;
        --cs-code-com:#64748b; --cs-code-fn:#1e40af; --cs-code-type:#7c3aed;
        --cs-code-inline:#e5e7eb;
      }`;
    const darkVarBody = `
        --cs-grad-a:#1f2937; --cs-grad-b:#111827;
        --cs-surface:#111827; --cs-sidebar:#0f172a; --cs-chat-bg:#0f172a;
        --cs-border:#334155; --cs-border-strong:#475569;
        --cs-neutral:#334155; --cs-neutral-hover:#475569;
        --cs-text:#e2e8f0; --cs-text-muted:#94a3b8;
        --cs-primary:#3b82f6; --cs-primary-hover:#2563eb;
        --cs-active:#1e3a5f; --cs-active-hover:#274b7a; --cs-hover:#1e293b;
        --cs-danger:#ef4444; --cs-danger-hover:#dc2626;
        --cs-scroll-thumb:#475569; --cs-scroll-track:#1e293b;
        --cs-code-kw:#60a5fa; --cs-code-str:#34d399; --cs-code-num:#fbbf24;
        --cs-code-com:#94a3b8; --cs-code-fn:#818cf8; --cs-code-type:#c084fc;
        --cs-code-inline:#334155;`;

    // Dark overrides for legacy inline-styled elements + dynamic classes.
    // {P} is replaced with the theme-scoped prefix.
    const darkBody = `
      {P} > div:first-child { background: linear-gradient(145deg, var(--cs-grad-a), var(--cs-grad-b)) !important; color: var(--cs-text) !important; }
      {P} #sidebar { background: var(--cs-sidebar) !important; border-right-color: var(--cs-border) !important; }
      {P} #threads-title, {P} #main-content h2 { color: var(--cs-text) !important; }
      {P} #sidebar-header svg { stroke: var(--cs-text-muted) !important; }
      {P} #threads-container { background: var(--cs-surface) !important; scrollbar-color: var(--cs-scroll-thumb) var(--cs-scroll-track) !important; }
      {P} #threads { color: var(--cs-text) !important; }
      {P} #new-thread-btn { background: var(--cs-primary) !important; }
      {P} #new-thread-btn:hover { background: var(--cs-primary-hover) !important; }
      {P} #clear-history { background: var(--cs-danger) !important; }
      {P} #clear-history:hover { background: var(--cs-danger-hover) !important; }
      {P} #report-bug-btn, {P} #get-help-btn, {P} #privacy-policy-btn, {P} #feature-request-btn, {P} #export-chat-btn { background: var(--cs-neutral) !important; color: var(--cs-text) !important; border-color: var(--cs-border-strong) !important; }
      {P} #report-bug-btn:hover, {P} #get-help-btn:hover, {P} #privacy-policy-btn:hover, {P} #feature-request-btn:hover, {P} #export-chat-btn:hover { background: var(--cs-neutral-hover) !important; }
      {P} #report-bug-btn svg, {P} #get-help-btn svg, {P} #privacy-policy-btn svg, {P} #feature-request-btn svg, {P} #export-chat-btn svg { stroke: currentColor !important; }
      {P} #main-content { background: var(--cs-surface) !important; }
      {P} #chat-display { background: var(--cs-chat-bg) !important; scrollbar-color: var(--cs-scroll-thumb) var(--cs-scroll-track) !important; }
      {P} #custom-ai-input { background: var(--cs-surface) !important; color: var(--cs-text) !important; border-color: var(--cs-border-strong) !important; }
      {P} #custom-ai-input::placeholder { color: var(--cs-text-muted) !important; }
      {P} .cs-thread { border-bottom-color: var(--cs-border) !important; }
      {P} .cs-thread:hover { background: var(--cs-hover) !important; }
      {P} .cs-thread--active { background: var(--cs-active) !important; }
      {P} .cs-thread--active:hover { background: var(--cs-active-hover) !important; }
      {P} .cs-thread-name { color: var(--cs-text) !important; }
      {P} .cs-thread-meta, {P} .cs-thread-snippet { color: var(--cs-text-muted) !important; }
      {P} .cs-thread-action { color: var(--cs-text-muted) !important; }
      {P} .cs-thread-action:hover { background: var(--cs-hover) !important; }
      {P} .cs-bubble--ai { background: var(--cs-neutral) !important; color: var(--cs-text) !important; }
      {P} .cs-timestamp { color: var(--cs-text-muted) !important; }
      {P} .cs-modal-content { background: var(--cs-surface) !important; color: var(--cs-text) !important; }
      {P} .cs-modal-content h2, {P} .cs-modal-content h3, {P} .cs-modal-content strong { color: var(--cs-text) !important; }
      {P} .cs-search-input { background: var(--cs-surface) !important; color: var(--cs-text) !important; border-color: var(--cs-border-strong) !important; }
      {P} .cs-group-header { color: var(--cs-text-muted) !important; }
      {P} .cs-cloned-indicator { background: var(--cs-sidebar) !important; border-color: var(--cs-border) !important; color: var(--cs-text-muted) !important; }
      {P} .cs-context-banner { background: var(--cs-sidebar) !important; border-color: var(--cs-border) !important; color: var(--cs-text) !important; }
      {P} mark.cs-hit { background: var(--cs-active) !important; color: var(--cs-text) !important; }`;

    const darkExplicit = darkBody.replace(/\{P\}/g, `${R}[data-theme="dark"]`);
    const darkAuto = darkBody.replace(
      /\{P\}/g,
      `${R}[data-theme="auto"]`,
    );

    const style = document.createElement("style");
    style.id = "cs-theme-styles";
    style.textContent = `
      ${lightVars}
      ${R}[data-theme="dark"] { ${darkVarBody} }
      @media (prefers-color-scheme: dark) {
        ${R}[data-theme="auto"] { ${darkVarBody} }
      }
      ${darkExplicit}
      @media (prefers-color-scheme: dark) {
        ${darkAuto}
      }
    `;
    document.head.appendChild(style);
  }

  function applyTheme(theme) {
    const box = document.getElementById(CONTAINER_ID);
    if (box) box.setAttribute("data-theme", theme || "auto");
  }

  function getSettings() {
    return new Promise((resolve) => {
      chrome.storage.local.get({ settings: DEFAULT_SETTINGS }, (r) => {
        resolve(Object.assign({}, DEFAULT_SETTINGS, r.settings || {}));
      });
    });
  }

  function saveSettings(patch) {
    return new Promise((resolve) => {
      chrome.storage.local.get({ settings: DEFAULT_SETTINGS }, (r) => {
        const merged = Object.assign(
          {},
          DEFAULT_SETTINGS,
          r.settings || {},
          patch,
        );
        chrome.storage.local.set({ settings: merged }, () => resolve(merged));
      });
    });
  }

  // =========================================================================
  // Issue #3 — Extension-context-invalidated guard
  // After the extension is reloaded/updated, chrome.* calls in this old content
  // script throw "Extension context invalidated" and chrome.runtime.id becomes
  // undefined. Detect that and prompt the user to reload the page.
  // =========================================================================
  function isContextValid() {
    try {
      return !!(chrome && chrome.runtime && chrome.runtime.id);
    } catch (e) {
      return false;
    }
  }

  function showContextInvalidatedBanner() {
    if (document.getElementById("cs-context-banner")) return;
    const banner = document.createElement("div");
    banner.id = "cs-context-banner";
    banner.className = "cs-context-banner";
    banner.style.cssText = `
      display: flex; align-items: center; justify-content: space-between; gap: 12px;
      background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 8px;
      padding: 10px 14px; margin-bottom: 12px; color: #1e293b; font-size: 0.9rem;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
    const msg = document.createElement("span");
    msg.textContent = "ChatSearch was updated — reload the page to continue.";
    const reload = document.createElement("button");
    reload.type = "button";
    reload.textContent = "Reload";
    reload.style.cssText = `
      padding: 8px 16px; background: #2563eb; color: #ffffff; border: none;
      border-radius: 8px; cursor: pointer; font-size: 0.85rem; font-weight: 500;
      white-space: nowrap; transition: background 0.2s ease;
    `;
    reload.addEventListener("mouseenter", () => {
      reload.style.background = "#1e40af";
    });
    reload.addEventListener("mouseleave", () => {
      reload.style.background = "#2563eb";
    });
    reload.addEventListener("click", () => location.reload());
    banner.appendChild(msg);
    banner.appendChild(reload);

    const main = document.getElementById("main-content");
    if (main) {
      main.insertBefore(banner, main.firstChild);
    } else {
      banner.style.position = "fixed";
      banner.style.top = "12px";
      banner.style.left = "50%";
      banner.style.transform = "translateX(-50%)";
      banner.style.zIndex = "2147483647";
      document.body.appendChild(banner);
    }
  }

  function handlePossibleInvalidation(err) {
    const message = err && (err.message || (typeof err === "string" ? err : ""));
    if (!isContextValid() || (message && /context invalidated/i.test(message))) {
      showContextInvalidatedBanner();
      return true;
    }
    return false;
  }

  // Wrap chrome.storage.local so a thrown invalidation error surfaces the banner
  // instead of silently breaking, without touching every call site.
  function guardChromeStorage() {
    try {
      if (!(chrome && chrome.storage && chrome.storage.local)) return;
      ["get", "set", "remove", "clear"].forEach((method) => {
        const original = chrome.storage.local[method];
        if (typeof original !== "function" || original.__csGuarded) return;
        const guarded = function (...args) {
          if (!isContextValid()) {
            showContextInvalidatedBanner();
            return;
          }
          try {
            return original.apply(chrome.storage.local, args);
          } catch (e) {
            handlePossibleInvalidation(e);
            throw e;
          }
        };
        guarded.__csGuarded = true;
        chrome.storage.local[method] = guarded;
      });
    } catch (e) {
      /* ignore */
    }
  }

  function startContextWatch() {
    window.addEventListener("error", (e) => {
      handlePossibleInvalidation(e.error || e.message);
    });
    window.addEventListener("unhandledrejection", (e) => {
      handlePossibleInvalidation(e.reason);
    });
    // Lightweight periodic backstop.
    const timer = setInterval(() => {
      if (!isContextValid()) {
        showContextInvalidatedBanner();
        clearInterval(timer);
      }
    }, 3000);
  }

  // =========================================================================
  // Issue #6 — Draggable panel (drag handle = sidebar header)
  // =========================================================================
  function clampToViewport(container, left, top) {
    const rect = container.getBoundingClientRect();
    const maxLeft = Math.max(0, window.innerWidth - rect.width);
    const maxTop = Math.max(0, window.innerHeight - rect.height);
    return {
      left: Math.min(Math.max(0, left), maxLeft),
      top: Math.min(Math.max(0, top), maxTop),
    };
  }

  function setupDragging(container) {
    const handle = document.getElementById("sidebar-header");
    if (!handle) return;

    let dragging = false;
    let startX = 0;
    let startY = 0;
    let startLeft = 0;
    let startTop = 0;
    let pendingLeft = 0;
    let pendingTop = 0;
    let rafId = null;

    function applyPending() {
      rafId = null;
      const pos = clampToViewport(container, pendingLeft, pendingTop);
      container.style.left = pos.left + "px";
      container.style.top = pos.top + "px";
    }

    handle.addEventListener("pointerdown", (e) => {
      // Never start a drag from the header controls (settings / collapse).
      if (e.target.closest("#sidebar-header-controls")) return;
      if (e.button !== 0) return;

      const rect = container.getBoundingClientRect();
      // Switch from translate-centering to explicit px positioning.
      container.style.transform = "none";
      container.style.left = rect.left + "px";
      container.style.top = rect.top + "px";
      container.style.transition = "none"; // no lag while dragging

      dragging = true;
      startX = e.clientX;
      startY = e.clientY;
      startLeft = rect.left;
      startTop = rect.top;
      pendingLeft = rect.left;
      pendingTop = rect.top;
      handle.style.cursor = "grabbing";
      try {
        handle.setPointerCapture(e.pointerId);
      } catch (_) {}
      e.preventDefault();
    });

    handle.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      pendingLeft = startLeft + (e.clientX - startX);
      pendingTop = startTop + (e.clientY - startY);
      if (rafId == null) rafId = requestAnimationFrame(applyPending);
    });

    function endDrag(e) {
      if (!dragging) return;
      dragging = false;
      handle.style.cursor = "grab";
      try {
        handle.releasePointerCapture(e.pointerId);
      } catch (_) {}
      if (rafId != null) {
        cancelAnimationFrame(rafId);
        applyPending();
      }
      container.style.transition = "all 0.3s ease"; // restore collapse anim
      const pos = clampToViewport(container, pendingLeft, pendingTop);
      chrome.storage.local.set({ panelPosition: pos });
    }

    handle.addEventListener("pointerup", endDrag);
    handle.addEventListener("pointercancel", endDrag);

    // Issue #1 — never leave the panel stranded off-screen after a viewport resize.
    window.addEventListener("resize", () => {
      if (container.style.transform !== "none") return; // still translate-centred
      const left = parseFloat(container.style.left) || 0;
      const top = parseFloat(container.style.top) || 0;
      const pos = clampToViewport(container, left, top);
      container.style.left = pos.left + "px";
      container.style.top = pos.top + "px";
    });
  }

  function restorePanelPosition(container) {
    chrome.storage.local.get({ panelPosition: null }, (r) => {
      const p = r.panelPosition;
      if (!p || typeof p.left !== "number" || typeof p.top !== "number") return;
      const prevTransition = container.style.transition;
      container.style.transition = "none"; // no animation from the default spot
      container.style.transform = "none";
      const pos = clampToViewport(container, p.left, p.top);
      container.style.left = pos.left + "px";
      container.style.top = pos.top + "px";
      requestAnimationFrame(() => {
        container.style.transition = prevTransition || "all 0.3s ease";
      });
    });
  }

  // =========================================================================
  // Issue #2 (Round 2) — resizable threads column + whole-widget corner resize
  // =========================================================================
  const SIDEBAR_MIN = 220;
  const SIDEBAR_MAX = 480;
  const WIDGET_MIN_W = 420;
  const WIDGET_MIN_H = 320;

  function setupResizing(container) {
    const inner = container.firstElementChild; // the flex card
    const sidebar = container.querySelector("#sidebar");
    const main = container.querySelector("#main-content");
    if (!inner || !sidebar || !main) return;

    // --- Column resize handle (between threads panel and chat) ---
    let colHandle = container.querySelector("#cs-col-resize");
    if (!colHandle) {
      colHandle = document.createElement("div");
      colHandle.id = "cs-col-resize";
      colHandle.title = "Drag to resize the threads panel";
      colHandle.style.cssText =
        "flex: 0 0 6px; align-self: stretch; cursor: col-resize; background: transparent; transition: background 0.15s ease; z-index: 2;";
      inner.insertBefore(colHandle, main);
    }
    colHandle.addEventListener("mouseenter", () => {
      colHandle.style.background = "rgba(37,99,235,0.4)";
    });
    colHandle.addEventListener("mouseleave", () => {
      colHandle.style.background = "transparent";
    });

    let colDragging = false;
    let colStartX = 0;
    let colStartW = 0;
    let colPendingW = 0;
    let colRaf = null;
    function applyColWidth() {
      colRaf = null;
      sidebar.style.width = colPendingW + "px";
    }
    colHandle.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      colDragging = true;
      colStartX = e.clientX;
      colStartW = sidebar.getBoundingClientRect().width;
      colPendingW = colStartW;
      colHandle.style.background = "rgba(37,99,235,0.4)";
      try {
        colHandle.setPointerCapture(e.pointerId);
      } catch (_) {}
      e.preventDefault();
    });
    colHandle.addEventListener("pointermove", (e) => {
      if (!colDragging) return;
      let w = colStartW + (e.clientX - colStartX);
      w = Math.max(SIDEBAR_MIN, Math.min(SIDEBAR_MAX, w));
      colPendingW = w;
      if (colRaf == null) colRaf = requestAnimationFrame(applyColWidth);
    });
    function endCol(e) {
      if (!colDragging) return;
      colDragging = false;
      colHandle.style.background = "transparent";
      try {
        colHandle.releasePointerCapture(e.pointerId);
      } catch (_) {}
      if (colRaf != null) {
        cancelAnimationFrame(colRaf);
        applyColWidth();
      }
      chrome.storage.local.set({ sidebarWidth: colPendingW });
    }
    colHandle.addEventListener("pointerup", endCol);
    colHandle.addEventListener("pointercancel", endCol);

    // --- Corner resize handle (whole widget, bottom-right) ---
    let corner = container.querySelector("#cs-corner-resize");
    if (!corner) {
      corner = document.createElement("div");
      corner.id = "cs-corner-resize";
      corner.title = "Drag to resize the window";
      corner.style.cssText =
        "position: absolute; width: 18px; height: 18px; right: 3px; bottom: 3px; cursor: nwse-resize; z-index: 4; display: flex; align-items: flex-end; justify-content: flex-end;";
      corner.innerHTML = `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#94a3b8" stroke-width="1.6" stroke-linecap="round"><path d="M14 6 L6 14 M14 10 L10 14 M14 14 L13.5 14.5"/></svg>`;
      container.appendChild(corner);
    }

    let cornerDragging = false;
    let cX = 0;
    let cY = 0;
    let cW = 0;
    let cH = 0;
    let cPendingW = 0;
    let cPendingH = 0;
    let cRaf = null;
    function applyWH() {
      cRaf = null;
      container.style.width = cPendingW + "px";
      container.style.height = cPendingH + "px";
    }
    corner.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      const rect = container.getBoundingClientRect();
      container.style.maxWidth = "none";
      container.style.maxHeight = "none";
      container.style.width = rect.width + "px";
      container.style.height = rect.height + "px";
      cornerDragging = true;
      cX = e.clientX;
      cY = e.clientY;
      cW = rect.width;
      cH = rect.height;
      cPendingW = rect.width;
      cPendingH = rect.height;
      try {
        corner.setPointerCapture(e.pointerId);
      } catch (_) {}
      e.preventDefault();
      e.stopPropagation();
    });
    corner.addEventListener("pointermove", (e) => {
      if (!cornerDragging) return;
      cPendingW = Math.max(
        WIDGET_MIN_W,
        Math.min(window.innerWidth, cW + (e.clientX - cX)),
      );
      cPendingH = Math.max(
        WIDGET_MIN_H,
        Math.min(window.innerHeight, cH + (e.clientY - cY)),
      );
      if (cRaf == null) cRaf = requestAnimationFrame(applyWH);
    });
    function endCorner(e) {
      if (!cornerDragging) return;
      cornerDragging = false;
      try {
        corner.releasePointerCapture(e.pointerId);
      } catch (_) {}
      if (cRaf != null) {
        cancelAnimationFrame(cRaf);
        applyWH();
      }
      chrome.storage.local.set({
        widgetSize: { width: cPendingW, height: cPendingH },
      });
    }
    corner.addEventListener("pointerup", endCorner);
    corner.addEventListener("pointercancel", endCorner);

    // --- Restore persisted sizes ---
    chrome.storage.local.get(
      { sidebarWidth: null, widgetSize: null },
      (r) => {
        if (typeof r.sidebarWidth === "number") {
          sidebar.style.width =
            Math.max(SIDEBAR_MIN, Math.min(SIDEBAR_MAX, r.sidebarWidth)) + "px";
        }
        if (r.widgetSize && typeof r.widgetSize.width === "number") {
          container.style.maxWidth = "none";
          container.style.maxHeight = "none";
          container.style.width =
            Math.max(WIDGET_MIN_W, Math.min(window.innerWidth, r.widgetSize.width)) +
            "px";
          container.style.height =
            Math.max(
              WIDGET_MIN_H,
              Math.min(window.innerHeight, r.widgetSize.height),
            ) + "px";
        }
      },
    );
  }

  // =========================================================================
  // Issue #8 — Export chat / message as PDF (print-to-PDF, no new permissions)
  // =========================================================================
  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  // Round 2 — build a short, escaped snippet around the search match, with the
  // matched query wrapped in <mark class="cs-hit">.
  function highlightSnippet(text, matchText) {
    const src = String(text == null ? "" : text);
    const q = String(threadSearchQuery || "").trim();
    if (!q) return escapeHtml(src.slice(0, 120));
    const idx = src.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return escapeHtml(src.slice(0, 120));
    const start = Math.max(0, idx - 30);
    const end = Math.min(src.length, idx + q.length + 60);
    const pre = (start > 0 ? "…" : "") + src.slice(start, idx);
    const hit = src.slice(idx, idx + q.length);
    const post = src.slice(idx + q.length, end) + (end < src.length ? "…" : "");
    return (
      escapeHtml(pre) +
      '<mark class="cs-hit" style="background:#e3f2fd; color:#1e293b; border-radius:3px; padding:0 2px;">' +
      escapeHtml(hit) +
      "</mark>" +
      escapeHtml(post)
    );
  }

  function messageToPrintHtml(chat) {
    const who = chat.role === "user" ? "You" : "AI";
    const when = chat.date ? new Date(chat.date).toLocaleString() : "";
    let body;
    if (
      chat.role !== "user" &&
      typeof marked !== "undefined" &&
      typeof DOMPurify !== "undefined"
    ) {
      try {
        body = `<div class="cs-print-md">${DOMPurify.sanitize(
          marked.parse(String(chat.text || ""), { gfm: true, breaks: true }),
        )}</div>`;
      } catch (e) {
        body = `<div class="cs-print-text">${escapeHtml(chat.text)}</div>`;
      }
    } else {
      body = `<div class="cs-print-text">${escapeHtml(chat.text)}</div>`;
    }
    const role = chat.role === "user" ? "user" : "ai";
    return `
      <div class="cs-print-msg cs-print-${role}">
        <div class="cs-print-meta">
          <span class="cs-print-who">${who}</span>
          <span class="cs-print-when">${escapeHtml(when)}</span>
        </div>
        ${body}
      </div>`;
  }

  function buildPrintDocument(title, innerHtml) {
    const styles = `
      * { box-sizing: border-box; }
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        color: #1e293b; margin: 32px; line-height: 1.5;
      }
      .cs-print-title { font-size: 1.5rem; font-weight: 600; margin: 0 0 20px; }
      .cs-print-msg {
        border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 16px;
        margin: 0 0 12px; page-break-inside: avoid;
      }
      .cs-print-user { background: #eff6ff; }
      .cs-print-ai { background: #f8fafc; }
      .cs-print-meta {
        display: flex; justify-content: space-between;
        font-size: 0.75rem; color: #64748b; margin-bottom: 6px;
      }
      .cs-print-who { font-weight: 600; color: #1e293b; }
      .cs-print-text { white-space: pre-wrap; word-break: break-word; font-size: 0.95rem; }
      .cs-print-md { font-size: 0.95rem; }
      .cs-print-md p { margin: 0 0 8px; }
      .cs-print-md ul, .cs-print-md ol { margin: 0 0 8px; padding-left: 1.4em; }
      .cs-print-md pre {
        background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 8px;
        padding: 12px; overflow-x: auto;
        font-family: ${MONO_FONT}; font-size: 0.85rem;
      }
      .cs-print-md :not(pre) > code {
        background: #e5e7eb; padding: 1px 5px; border-radius: 4px;
        font-family: ${MONO_FONT}; font-size: 0.85em;
      }
      .cs-print-md a { color: #2563eb; }
      .cs-print-empty { color: #64748b; }
      @media print {
        body { margin: 0; }
        .cs-print-msg { break-inside: avoid; }
        a { color: #1e293b; text-decoration: underline; }
      }
    `;
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${escapeHtml(
      title,
    )}</title><style>${styles}</style></head><body><h1 class="cs-print-title">${escapeHtml(
      title,
    )}</h1>${innerHtml}</body></html>`;
  }

  function openPrintWindow(html) {
    const w = window.open("", "_blank");
    if (!w) {
      alert("Please allow pop-ups for this site to export as PDF.");
      return;
    }
    w.document.open();
    w.document.write(html);
    w.document.close();
    // Trigger printing from the opener — the child's inline scripts may be
    // blocked by the host page's CSP, but cross-calling print() is allowed
    // (the about:blank document is same-origin with this opener).
    setTimeout(() => {
      try {
        w.focus();
        w.print();
      } catch (e) {
        /* user can still print manually */
      }
    }, 400);
  }

  function exportMessageToPdf(chat) {
    openPrintWindow(
      buildPrintDocument("ChatSearch message", messageToPrintHtml(chat)),
    );
  }

  function exportChatToPdf(threadId) {
    chrome.storage.local.get({ chats: [], threads: [] }, function (result) {
      const thread = result.threads.find((t) => t.id === threadId);
      const msgs = result.chats.filter((c) => c.threadId === threadId);
      const title = thread
        ? `ChatSearch — ${thread.name}`
        : "ChatSearch conversation";
      const inner = msgs.length
        ? msgs.map(messageToPrintHtml).join("")
        : `<p class="cs-print-empty">This chat has no messages yet.</p>`;
      openPrintWindow(buildPrintDocument(title, inner));
    });
  }

  function createUI(targetDiv) {
    if (document.getElementById(CONTAINER_ID)) return;

    const googleSearchInput = document.querySelector("textarea");

    const uiContainer = document.createElement("div");
    uiContainer.id = CONTAINER_ID;
    uiContainer.setAttribute("data-theme", "auto"); // Round 2 — theming root
    injectThemeStyles();

    // *************************************************************
    // 🌟 WICHTIG: NEUE STYLES FÜR FIXED POSITIONIERUNG UND ZENTRIERUNG
    // *************************************************************
    uiContainer.style.position = "fixed";
    // Zentrieren Sie das Element im Viewport
    uiContainer.style.top = "57.8%";
    uiContainer.style.left = "80%";
    uiContainer.style.transform = "translate(-50%, -50%)";
    // Der Z-Index, um sicherzustellen, dass es über dem Seiteninhalt liegt
    uiContainer.style.zIndex = "1000"; 
    
    // Optionale Anpassung: Setzen Sie die Gesamtgröße fest, damit das "translate" funktioniert
    // Dies stellt sicher, dass es auf allen Bildschirmen gut aussieht
    uiContainer.style.maxWidth = "1200px"; // Maximale Breite beibehalten
    uiContainer.style.height = "80vh"; // Nehmen Sie 90% der Viewport-Höhe ein (damit es passt)
    uiContainer.style.maxHeight = "900px"; // Optional: Eine maximale Höhe
    
    uiContainer.innerHTML = `
      <div style="
        display: flex;
        /* VORHERIGE STYLES WURDEN HIER ENTFERNT/ÜBERSCHRIEBEN: 
           width: 90%; max-width: 1200px; margin: 2em auto; min-height: 400px; */
        
        /* Diese Styles beibehalten, da sie für das Design wichtig sind */
        border-radius: 16px;
        box-shadow: 0px 0px 36px 0px rgba(255,255,255,0.6);
        -webkit-box-shadow: 0px 0px 36px 0px rgba(255,255,255,0.6);
        -moz-box-shadow: 0px 0px 36px 0px rgba(255,255,255,0.6);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        background: linear-gradient(145deg, #ffffff, #f8fafc);
        color: #1e293b;
        height: 100%; /* Fill the container so the card's bottom edge can meet the viewport bottom */
        overflow: hidden;
      ">
        <div id="sidebar" style="
          background: #f1f5f9;
          padding: 24px;
          width: 260px;
          border-right: 1px solid #e2e8f0;
          display: flex;
          flex-direction: column;
          gap: 16px;
          /* height hier auf 100% setzen, da es nun einen fixierten Elter hat */
          height: 100%;
          min-height: 0;
          overflow: hidden;
        ">
          <div id="sidebar-header" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; cursor: grab; user-select: none;">
  <h3 id="threads-title" style="
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
">Chat Threads</h3>
  <div id="sidebar-header-controls" style="display: flex; align-items: center; gap: 4px;">
  <button id="settings-btn" style="
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px;
    border-radius: 6px;
    transition: background 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  " title="Settings">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="3"></circle>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
    </svg>
  </button>
  <button id="toggle-sidebar-btn" style="
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px;
    border-radius: 6px;
    transition: background 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  " title="Navigation ein-/ausklappen">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <line x1="3" y1="12" x2="21" y2="12"></line>
      <line x1="3" y1="6" x2="21" y2="6"></line>
      <line x1="3" y1="18" x2="21" y2="18"></line>
    </svg>
  </button>
  </div>
</div>

          <div id="cs-search-wrap" style="position: relative; margin-bottom: 4px; flex: 0 0 auto;">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); pointer-events: none;">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input id="cs-thread-search" class="cs-search-input" type="text" placeholder="Search chats…" style="
              width: 100%;
              box-sizing: border-box;
              padding: 8px 12px 8px 32px;
              font-size: 0.85rem;
              border: 1px solid #d1d5db;
              border-radius: 8px;
              outline: none;
              color: #1e293b;
              background: #ffffff;
              transition: border-color 0.2s ease, box-shadow 0.2s ease;
            " />
          </div>

          <div id="threads-container" style="
            flex: 1 1 auto;
            min-height: 80px;
            overflow-y: auto;
            background: #ffffff;
            border-radius: 10px;
            padding: 12px;
            box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.05);
            scrollbar-width: thin;
            scrollbar-color: #94a3b8 #e2e8f0;
          ">
            <ul id="threads" style="
              list-style: none;
              padding: 0;
              margin: 0;
              font-size: 0.9rem;
              color: #1e293b;
            "></ul>
          </div>
          <div id="sidebar-actions" style="display: flex; flex-direction: column; gap: 16px; flex: 0 1 auto; min-height: 0; overflow-y: auto;">
          <button id="new-thread-btn" style="
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 10px;
            background: #2563eb;
            color: #ffffff;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 0.95rem;
            font-weight: 500;
            transition: background 0.2s ease;
          ">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="white" viewBox="0 0 16 16">
              <path d="M8 2v12M2 8h12" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            New Chat
          </button>
          <button id="clear-history" style="
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 10px;
            background: #dc2626;
            color: #ffffff;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 0.95rem;
            font-weight: 500;
            transition: background 0.2s ease;
          ">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 19C6 20.1 6.9 21 8 21H16C17.1 21 18 20.1 18 19V7H6V19ZM19 4H15.5L14.5 3H9.5L8.5 4H5V6H19V4Z" fill="white"/>
            </svg>
            Clear All
          </button>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <button id="report-bug-btn" style="
              padding: 8px;
              background: #e5e7eb;
              color: #1e293b;
              border: 1px solid #d1d5db;
              border-radius: 8px;
              cursor: pointer;
              font-size: 0.85rem;
              font-weight: 500;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 6px;
              transition: background 0.2s ease;
            ">
              <svg style="width: 16px; height: 16px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              Report Bug
            </button>
            <button id="get-help-btn" style="
              padding: 8px;
              background: #e5e7eb;
              color: #1e293b;
              border: 1px solid #d1d5db;
              border-radius: 8px;
              cursor: pointer;
              font-size: 0.85rem;
              font-weight: 500;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 6px;
              transition: background 0.2s ease;
            ">
              <svg style="width: 16px; height: 16px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"></path>
              </svg>
              Get Help
            </button>
            <button id="privacy-policy-btn" style="
              padding: 8px;
              background: #e5e7eb;
              color: #1e293b;
              border: 1px solid #d1d5db;
              border-radius: 8px;
              cursor: pointer;
              font-size: 0.85rem;
              font-weight: 500;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 6px;
              transition: background 0.2s ease;
            ">
              <svg style="width: 16px; height: 16px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
              </svg>
              Privacy Policy
            </button>
            <button id="feature-request-btn" style="
              padding: 8px;
              background: #e5e7eb;
              color: #1e293b;
              border: 1px solid #d1d5db;
              border-radius: 8px;
              cursor: pointer;
              font-size: 0.85rem;
              font-weight: 500;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 6px;
              transition: background 0.2s ease;
            ">
              <svg style="width: 16px; height: 16px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7zm2.85 11.1l-.85.6V16h-4v-2.3l-.85-.6C7.8 12.16 7 10.63 7 9c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.63-.8 3.16-2.15 4.1z"/>
            </svg>
              Feature Request
            </button>
          </div>
          </div>
        </div>

        <div id="main-content" style="
          flex: 1;
          padding: 24px;
          background: #ffffff;
          display: flex;
          flex-direction: column;
          gap: 16px;
        ">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px;">
            <h2 style="
              margin: 0;
              font-size: 1.5rem;
              font-weight: 600;
              color: #1e293b;
            ">Talk to AI</h2>
            <button id="export-chat-btn" title="Export this chat as PDF" style="
              display: flex;
              align-items: center;
              gap: 6px;
              padding: 8px 12px;
              background: #e5e7eb;
              color: #1e293b;
              border: 1px solid #d1d5db;
              border-radius: 8px;
              cursor: pointer;
              font-size: 0.85rem;
              font-weight: 500;
              white-space: nowrap;
              transition: background 0.2s ease;
            ">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              Export PDF
            </button>
          </div>

          <div id="chat-display" style="
            flex: 1;
            /* Max-Height kann jetzt gelöscht oder angepasst werden, da der Elter die Höhe vorgibt */
            overflow-y: auto;
            padding: 16px;
            background: #f8fafc;
            border-radius: 10px;
            box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.05);
            display: flex;
            flex-direction: column;
            gap: 12px;
            scrollbar-width: thin;
            scrollbar-color: #94a3b8 #e2e8f0;
          "></div>

          <div style="
            display: flex;
            align-items: center;
            gap: 8px;
          ">
            <input id="custom-ai-input" value="${googleSearchInput ? googleSearchInput.value : ""}" 
              type="text" placeholder="Type your message here..." style="
              flex: 1;
              padding: 12px 16px;
              font-size: 1rem;
              border: 1px solid #d1d5db;
              border-radius: 8px;
              box-sizing: border-box;
              outline: none;
              transition: border-color 0.2s ease, box-shadow 0.2s ease;
            " />

            <button id="sendToApiBtn" style="
              padding: 12px 20px;
              background-color: #25D366;
              color: white;
              border: none;
              border-radius: 8px;
              cursor: pointer;
              font-size: 1rem;
              transition: background 0.2s;
              white-space: nowrap;
            ">Send</button>
          </div>
        </div>
      </div>
    `;

    targetDiv.insertBefore(uiContainer, targetDiv.firstChild);

    // Round 2 — apply the saved theme (light / dark / auto).
    getSettings().then((s) => applyTheme(s.theme));

        // === Burger Button: Sidebar ein-/ausklappen ===
    const sidebar = document.getElementById("sidebar");
    const toggleBtn = document.getElementById("toggle-sidebar-btn");
    const threadsContainer = document.getElementById("threads-container");
    const newThreadBtn = document.getElementById("new-thread-btn");
    const clearBtn = document.getElementById("clear-history");
    const bottomButtons = document.querySelector('#sidebar > div:last-child');

    let isCollapsed = false;

    toggleBtn.addEventListener("click", () => {
  isCollapsed = !isCollapsed;

  const threadsTitle = document.getElementById("threads-title");

  // Globale Variable zum Speichern der ursprünglichen Breite
let originalMainWidth = null;

if (isCollapsed) {
  // 🟪 EINKLAPPEN
  sidebar.style.width = "60px";
  sidebar.style.padding = "16px 8px";
  threadsContainer.style.display = "none";
  newThreadBtn.style.display = "none";
  clearBtn.style.display = "none";
  bottomButtons.style.display = "none";
  threadsTitle.style.display = "none";

  toggleBtn.title = "Navigation ausklappen";
  toggleBtn.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <line x1="3" y1="6" x2="12" y2="6"></line>
      <line x1="3" y1="12" x2="21" y2="12"></line>
      <line x1="3" y1="18" x2="12" y2="18"></line>
    </svg>`;

  toggleBtn.style.margin = "0 auto";

  const mainContent = document.getElementById("main-content");

  // 📏 ursprüngliche Breite speichern (nur beim ersten Mal)
  if (originalMainWidth === null) {
    originalMainWidth = getComputedStyle(mainContent).width;
  }

  // und auf 500px setzen
  mainContent.style.width = "500px";

} else {
  // 🟩 AUSKLAPPEN
  sidebar.style.width = "260px";
  sidebar.style.padding = "24px";
  threadsContainer.style.display = "flex";
  newThreadBtn.style.display = "flex";
  clearBtn.style.display = "flex";
  bottomButtons.style.display = "flex";
  threadsTitle.style.display = "block";

  toggleBtn.title = "Navigation einklappen";
  toggleBtn.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <line x1="3" y1="12" x2="21" y2="12"></line>
      <line x1="3" y1="6" x2="21" y2="6"></line>
      <line x1="3" y1="18" x2="21" y2="18"></line>
    </svg>`;

  toggleBtn.style.margin = "";

  const mainContent = document.getElementById("main-content");

  // 🔙 ursprüngliche Breite wiederherstellen, falls vorhanden
  if (originalMainWidth) {
    mainContent.style.width = originalMainWidth;
  } else {
    mainContent.style.width = ""; // fallback: Standard aus CSS
  }
}


  // Sanfte Animation für Hauptbereich
  const mainContent = document.getElementById("main-content");
  if (mainContent) {
    mainContent.style.transition = "all 0.3s ease";
  }

  // Hide the column resize handle + search box while the sidebar is collapsed.
  const colHandle = document.getElementById("cs-col-resize");
  if (colHandle) colHandle.style.display = isCollapsed ? "none" : "block";
  const searchWrap = document.getElementById("cs-search-wrap");
  if (searchWrap) searchWrap.style.display = isCollapsed ? "none" : "block";
});

    // Sanfte Animation für Hauptbereich
    uiContainer.style.transition = "all 0.3s ease";

    // The threads list now sizes itself via flexbox (flex:1; min-height:0), so
    // the old JS max-height hack is a no-op — clear any stale cap so the list
    // and the button stack stay correctly sized after drag/resize/collapse.
    function adjustThreadsContainerHeight() {
      const threadsContainer = document.getElementById("threads-container");
      if (threadsContainer) threadsContainer.style.maxHeight = "none";
    }

    // Round 2 — thread panel: search, date grouping, discoverable actions,
    // inline rename, richer cards. (threadSearchQuery / pendingScroll are
    // declared at module scope so the snippet helper can read the query.)
    function ensureThreadKeyframes() {
      if (document.getElementById("cs-thread-keyframes")) return;
      const style = document.createElement("style");
      style.id = "cs-thread-keyframes";
      style.textContent =
        "@keyframes slideIn{from{opacity:0;transform:translateX(-20px);}to{opacity:1;transform:translateX(0);}}" +
        "@keyframes slideInMessage{from{opacity:0;transform:translateY(-20px);}to{opacity:1;transform:translateY(0);}}";
      document.head.appendChild(style);
    }

    function fmtDate(ts) {
      if (!ts) return "—";
      return new Date(ts).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    }

    // Date bucket label from a last-activity timestamp.
    function bucketFor(ts) {
      const now = new Date();
      const startOfToday = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
      ).getTime();
      const day = 86400000;
      if (ts >= startOfToday) return "Today";
      if (ts >= startOfToday - day) return "Yesterday";
      if (ts >= startOfToday - 7 * day) return "Previous 7 days";
      if (ts >= startOfToday - 30 * day) return "Previous 30 days";
      return new Date(ts).toLocaleDateString("en-GB", {
        month: "long",
        year: "numeric",
      });
    }
    const BUCKET_ORDER = [
      "Today",
      "Yesterday",
      "Previous 7 days",
      "Previous 30 days",
    ];

    // A discoverable icon action button (hover background + tooltip, 28px target).
    function makeThreadAction(iconHtml, title, kind) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.title = title;
      btn.setAttribute("aria-label", title);
      btn.className = "cs-thread-action cs-thread-action--" + kind;
      btn.innerHTML = iconHtml;
      btn.style.cssText =
        "display:flex; align-items:center; justify-content:center; width:28px; height:28px; padding:0; background:transparent; border:none; border-radius:6px; cursor:pointer; color:#64748b; transition:background 0.15s ease, color 0.15s ease; flex:0 0 auto;";
      const hoverColor = kind === "delete" ? "#dc2626" : "#2563eb";
      btn.addEventListener("mouseenter", () => {
        btn.style.background = "#e2e8f0";
        btn.style.color = hoverColor;
      });
      btn.addEventListener("mouseleave", () => {
        btn.style.background = "transparent";
        btn.style.color = "#64748b";
      });
      return btn;
    }

    const ICON_CLONE = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="3" x2="6" y2="15"></line><circle cx="18" cy="6" r="3"></circle><circle cx="6" cy="18" r="3"></circle><path d="M18 9a9 9 0 0 1-9 9"></path></svg>`;
    const ICON_RENAME = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"></path></svg>`;
    const ICON_DELETE = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>`;

    // Inline rename: swap the title for an input (Enter/blur save, Esc cancel).
    function startInlineRename(thread, nameEl) {
      if (
        nameEl.parentNode &&
        nameEl.parentNode.querySelector(".cs-rename-input")
      )
        return;
      const input = document.createElement("input");
      input.type = "text";
      input.className = "cs-rename-input cs-search-input";
      input.value = thread.name;
      input.style.cssText =
        "width:100%; box-sizing:border-box; padding:4px 8px; font-size:0.9rem; font-weight:500; border:1px solid #2563eb; border-radius:6px; outline:none; color:#1e293b; background:#ffffff;";
      const prevDisplay = nameEl.style.display;
      nameEl.style.display = "none";
      nameEl.parentNode.insertBefore(input, nameEl);
      input.focus();
      input.select();
      let done = false;
      function finish(save) {
        if (done) return;
        done = true;
        const val = input.value.trim();
        input.remove();
        nameEl.style.display = prevDisplay || "";
        if (save && val && val !== thread.name) {
          chrome.storage.local.get({ threads: [] }, (data) => {
            const updated = data.threads.map((t) =>
              t.id === thread.id ? { ...t, name: val } : t,
            );
            chrome.storage.local.set({ threads: updated }, () =>
              renderThreads(false),
            );
          });
        }
      }
      input.addEventListener("keydown", (e) => {
        e.stopPropagation();
        if (e.key === "Enter") {
          e.preventDefault();
          finish(true);
        } else if (e.key === "Escape") {
          e.preventDefault();
          finish(false);
        }
      });
      input.addEventListener("blur", () => finish(true));
      input.addEventListener("click", (e) => e.stopPropagation());
    }

    // Build one thread card. `snippet` (optional) is {text, matchText} for search.
    function createThreadItem(thread, chats, lastTs, count, animate, index, snippet) {
      const isActive = thread.isActive === "yes";
      const li = document.createElement("li");
      li.className = "cs-thread" + (isActive ? " cs-thread--active" : "");
      li.style.padding = "10px 12px";
      li.style.cursor = "pointer";
      li.style.backgroundColor = isActive ? "#e3f2fd" : "transparent";
      li.style.borderBottom = "1px solid #e5e7eb";
      li.style.borderRadius = "8px";
      li.style.display = "flex";
      li.style.alignItems = "center";
      li.style.gap = "8px";
      li.style.transition = "background 0.2s ease";
      if (animate) {
        li.style.opacity = "0";
        li.style.transform = "translateX(-20px)";
        li.style.animation = `slideIn 0.3s ease forwards ${index * 0.05}s`;
      }

      const info = document.createElement("div");
      info.style.flex = "1";
      info.style.minWidth = "0";
      info.style.overflow = "hidden";

      const nameSpan = document.createElement("span");
      nameSpan.className = "cs-thread-name";
      nameSpan.textContent = thread.name;
      nameSpan.style.cssText =
        "display:block; font-weight:500; font-size:0.95rem; color:#1e293b; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;";

      const meta = document.createElement("div");
      meta.className = "cs-thread-meta";
      meta.style.cssText = "font-size:0.72rem; color:#64748b; margin-top:3px;";
      meta.textContent = `Created ${fmtDate(thread.created)} · Updated ${fmtDate(
        lastTs,
      )} · ${count} msg`;

      info.appendChild(nameSpan);
      info.appendChild(meta);

      if (snippet && snippet.text) {
        const snip = document.createElement("div");
        snip.className = "cs-thread-snippet";
        snip.style.cssText =
          "font-size:0.75rem; color:#64748b; margin-top:4px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;";
        snip.innerHTML = highlightSnippet(snippet.text, snippet.matchText);
        info.appendChild(snip);
      }

      const actions = document.createElement("div");
      actions.className = "cs-thread-actions";
      actions.style.cssText =
        "display:flex; align-items:center; gap:2px; opacity:0.55; transition:opacity 0.15s ease; flex:0 0 auto;";

      const cloneBtn = makeThreadAction(
        ICON_CLONE,
        "Continue in new chat",
        "clone",
      );
      const renameBtn = makeThreadAction(ICON_RENAME, "Rename", "rename");
      const deleteBtn = makeThreadAction(ICON_DELETE, "Delete", "delete");

      cloneBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        chrome.storage.local.get({ threads: [], chats: [] }, function (data) {
          const sourceThread = data.threads.find((t) => t.id === thread.id);
          if (!sourceThread) return;
          const newId = "thread_" + Date.now();
          const clonedChats = data.chats
            .filter((c) => c.threadId === thread.id)
            .map((c) => ({ ...JSON.parse(JSON.stringify(c)), threadId: newId }));
          const newThread = {
            id: newId,
            name: `${sourceThread.name} (copy)`,
            created: Date.now(),
            isActive: "yes",
            messages: [],
            clonedFrom: sourceThread.id,
            clonedFromName: sourceThread.name,
          };
          const updatedThreads = data.threads
            .map((t) => ({ ...t, isActive: "no" }))
            .concat(newThread);
          const updatedChats = data.chats.concat(clonedChats);
          chrome.storage.local.set(
            { threads: updatedThreads, chats: updatedChats },
            () => {
              renderThreads(true);
              renderChatMessages(newId, true);
            },
          );
        });
      });

      renameBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        startInlineRename(thread, nameSpan);
      });

      deleteBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (!confirm(`Are you sure you want to delete "${thread.name}"?`)) return;
        chrome.storage.local.get({ threads: [], chats: [] }, function (data) {
          let updatedThreads = data.threads.filter((t) => t.id !== thread.id);
          const updatedChats = data.chats.filter(
            (chat) => chat.threadId !== thread.id,
          );
          updatedThreads = updatedThreads.sort((a, b) => b.created - a.created);
          if (updatedThreads.length > 0) {
            updatedThreads = updatedThreads.map((t, i) => ({
              ...t,
              isActive: i === 0 ? "yes" : "no",
            }));
          }
          chrome.storage.local.set(
            { threads: updatedThreads, chats: updatedChats },
            () => {
              renderThreads(true);
              const newActive = updatedThreads.find(
                (t) => t.isActive === "yes",
              );
              renderChatMessages(newActive ? newActive.id : "", true);
            },
          );
        });
      });

      actions.appendChild(cloneBtn);
      actions.appendChild(renameBtn);
      actions.appendChild(deleteBtn);

      li.addEventListener("mouseenter", () => {
        actions.style.opacity = "1";
        li.style.backgroundColor = isActive ? "#bfdbfe" : "#f1f5f9";
      });
      li.addEventListener("mouseleave", () => {
        actions.style.opacity = "0.55";
        li.style.backgroundColor = isActive ? "#e3f2fd" : "transparent";
      });

      li.addEventListener("click", () => {
        if (snippet && snippet.matchText) {
          pendingScroll = { threadId: thread.id, matchText: snippet.matchText };
        }
        chrome.storage.local.get({ threads: [] }, (data) => {
          const updated = data.threads.map((t) => ({
            ...t,
            isActive: t.id === thread.id ? "yes" : "no",
          }));
          chrome.storage.local.set({ threads: updated }, () => {
            renderThreads(false);
            renderChatMessages(thread.id, true);
          });
        });
      });

      li.appendChild(info);
      li.appendChild(actions);
      return li;
    }

    // Render threads: filter by search, group by last-activity date bucket.
    function renderThreads(animate = true) {
      chrome.storage.local.get({ threads: [], chats: [] }, function (result) {
        let threads = result.threads;
        const chats = result.chats;

        const hasActiveThread = threads.some((t) => t.isActive === "yes");
        if (!hasActiveThread && threads.length > 0) {
          const newest = [...threads].sort((a, b) => b.created - a.created)[0];
          threads = threads.map((t) => ({
            ...t,
            isActive: t.id === newest.id ? "yes" : "no",
          }));
          chrome.storage.local.set({ threads: threads });
        }

        // Per-thread last activity + message count.
        const lastActivity = {};
        const msgCount = {};
        threads.forEach((t) => {
          const msgs = chats.filter((c) => c.threadId === t.id);
          msgCount[t.id] = msgs.length;
          lastActivity[t.id] = msgs.reduce((m, c) => {
            const x = new Date(c.date).getTime();
            return isNaN(x) ? m : Math.max(m, x);
          }, t.created || 0);
        });

        // Search filter (name + message full-text), with a match snippet.
        const q = threadSearchQuery.trim().toLowerCase();
        const snippets = {};
        let ordered = threads.slice();
        if (q) {
          ordered = ordered.filter((t) => {
            if ((t.name || "").toLowerCase().includes(q)) {
              snippets[t.id] = null; // name match, no snippet needed
              return true;
            }
            const hit = chats.find(
              (c) =>
                c.threadId === t.id &&
                (c.text || "").toLowerCase().includes(q),
            );
            if (hit) {
              snippets[t.id] = { text: hit.text, matchText: hit.text };
              return true;
            }
            return false;
          });
        }

        ordered.sort(
          (a, b) => (lastActivity[b.id] || 0) - (lastActivity[a.id] || 0),
        );

        const threadsList = document.getElementById("threads");
        threadsList.innerHTML = "";

        if (ordered.length === 0) {
          const empty = document.createElement("li");
          empty.style.cssText =
            "list-style:none; padding:16px 8px; text-align:center; color:#64748b; font-size:0.85rem;";
          empty.textContent = q
            ? "No chats match your search."
            : "No chats yet.";
          threadsList.appendChild(empty);
          ensureThreadKeyframes();
          adjustThreadsContainerHeight();
          return;
        }

        // Group into date buckets by last activity.
        const groups = {};
        const groupOrder = [];
        ordered.forEach((t) => {
          const label = bucketFor(lastActivity[t.id] || 0);
          if (!groups[label]) {
            groups[label] = [];
            groupOrder.push(label);
          }
          groups[label].push(t);
        });
        groupOrder.sort((a, b) => {
          const ia = BUCKET_ORDER.indexOf(a);
          const ib = BUCKET_ORDER.indexOf(b);
          if (ia !== -1 || ib !== -1) {
            return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
          }
          // both are month-year buckets: newest first
          const ta = groups[a][0] ? lastActivity[groups[a][0].id] : 0;
          const tb = groups[b][0] ? lastActivity[groups[b][0].id] : 0;
          return tb - ta;
        });

        let idx = 0;
        groupOrder.forEach((label) => {
          const header = document.createElement("li");
          header.className = "cs-group-header";
          header.style.cssText =
            "list-style:none; padding:10px 8px 4px; font-size:0.7rem; font-weight:600; letter-spacing:0.04em; text-transform:uppercase; color:#64748b;";
          header.textContent = label;
          threadsList.appendChild(header);
          groups[label].forEach((thread) => {
            const li = createThreadItem(
              thread,
              chats,
              lastActivity[thread.id],
              msgCount[thread.id],
              animate,
              idx++,
              q ? snippets[thread.id] : null,
            );
            threadsList.appendChild(li);
          });
        });

        ensureThreadKeyframes();
        adjustThreadsContainerHeight();
      });
    }

    // Button hover states
    const buttons = [
      "new-thread-btn",
      "clear-history",
      "report-bug-btn",
      "get-help-btn",
      "feature-request-btn",
      "privacy-policy-btn",
    ];
    buttons.forEach((id) => {
      const btn = document.getElementById(id);
      if (btn) {
        btn.addEventListener("mouseenter", () => {
          btn.style.background =
            id === "new-thread-btn"
              ? "#1e40af"
              : id === "clear-history"
                ? "#b91c1c"
                : "#d1d5db";
        });
        btn.addEventListener("mouseleave", () => {
          btn.style.background =
            id === "new-thread-btn"
              ? "#2563eb"
              : id === "clear-history"
                ? "#dc2626"
                : "#e5e7eb";
        });
      }
    });

    // Input focus state
    const input = document.getElementById("custom-ai-input");
    input.addEventListener("focus", () => {
      input.style.borderColor = "#2563eb";
      input.style.boxShadow = "0 0 0 3px rgba(37, 99, 235, 0.2)";
    });
    input.addEventListener("blur", () => {
      input.style.borderColor = "#d1d5db";
      input.style.boxShadow = "none";
    });

    // Issue #7 — thread search box: filter threads by name + message text.
    const searchInput = document.getElementById("cs-thread-search");
    if (searchInput) {
      searchInput.value = threadSearchQuery;
      searchInput.addEventListener("input", () => {
        threadSearchQuery = searchInput.value;
        renderThreads(false);
      });
      // Don't let keystrokes bubble to page/global handlers.
      searchInput.addEventListener("keydown", (e) => e.stopPropagation());
      searchInput.addEventListener("focus", () => {
        searchInput.style.borderColor = "#2563eb";
        searchInput.style.boxShadow = "0 0 0 3px rgba(37, 99, 235, 0.2)";
      });
      searchInput.addEventListener("blur", () => {
        searchInput.style.borderColor = "#d1d5db";
        searchInput.style.boxShadow = "none";
      });
    }

    // Modals
    const modalStyles = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    `;
    const modalContentStyles = `
      background: #ffffff;
      padding: 24px;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      max-width: 500px;
      max-height: 80vh;
      overflow-y: auto;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #1e293b;
      text-align: left;
      animation: fadeIn 0.3s ease;
    `;
    const modalButtonStyles = `
      margin-top: 16px;
      padding: 10px 20px;
      background: #2563eb;
      color: #ffffff;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 0.95rem;
      font-weight: 500;
      transition: background 0.2s ease;
    `;
    const modalStyleElement = document.createElement("style");
    modalStyleElement.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; transform: scale(0.95); }
        to { opacity: 1; transform: scale(1); }
      }
    `;
    document.head.appendChild(modalStyleElement);

    // === Issue #1/#9 — Settings modal ===
    // Small on/off switch matching STYLEGUIDE tokens.
    function makeToggle(initial, onChange) {
      const track = document.createElement("button");
      track.type = "button";
      track.setAttribute("role", "switch");
      let on = !!initial;
      track.setAttribute("aria-checked", String(on));
      track.style.cssText = `
        position: relative; width: 44px; height: 24px; border-radius: 999px;
        border: none; cursor: pointer; flex: 0 0 auto; padding: 0;
        background: ${on ? "#2563eb" : "#d1d5db"}; transition: background 0.2s ease;
      `;
      const knob = document.createElement("span");
      knob.style.cssText = `
        position: absolute; top: 2px; left: ${on ? "22px" : "2px"};
        width: 20px; height: 20px; border-radius: 50%; background: #ffffff;
        box-shadow: 0 1px 2px rgba(0,0,0,0.2); transition: left 0.2s ease;
      `;
      track.appendChild(knob);
      track.addEventListener("click", () => {
        on = !on;
        track.setAttribute("aria-checked", String(on));
        track.style.background = on ? "#2563eb" : "#d1d5db";
        knob.style.left = on ? "22px" : "2px";
        onChange(on);
      });
      return track;
    }

    function openSettingsModal() {
      getSettings().then((settings) => {
        const overlay = document.createElement("div");
        overlay.style.cssText = modalStyles;
        const modal = document.createElement("div");
        modal.style.cssText = modalContentStyles;
        modal.className = "cs-modal-content";

        const title = document.createElement("h2");
        title.textContent = "Settings";
        title.style.cssText =
          "margin: 0 0 16px; font-size: 1.5rem; font-weight: 600;";
        modal.appendChild(title);

        // --- Appearance / theme (Round 2) ---
        const themeSection = document.createElement("div");
        themeSection.style.marginBottom = "20px";
        const themeTitle = document.createElement("h3");
        themeTitle.textContent = "Appearance";
        themeTitle.style.cssText =
          "margin: 0 0 8px; font-size: 1rem; font-weight: 600; color: #1e293b;";
        const themeDesc = document.createElement("p");
        themeDesc.textContent =
          "Choose Light, Dark, or Auto (follow your system).";
        themeDesc.style.cssText =
          "margin: 0 0 12px; font-size: 0.85rem; color: #64748b; line-height: 1.5;";
        const seg = document.createElement("div");
        seg.style.cssText =
          "display: inline-flex; border: 1px solid var(--cs-border-strong, #d1d5db); border-radius: 8px; overflow: hidden;";
        const themeOptions = [
          ["light", "Light"],
          ["dark", "Dark"],
          ["auto", "Auto"],
        ];
        const segButtons = {};
        function paintSeg(active) {
          themeOptions.forEach(([val]) => {
            const b = segButtons[val];
            const on = val === active;
            b.style.background = on ? "var(--cs-primary, #2563eb)" : "transparent";
            b.style.color = on ? "#ffffff" : "var(--cs-text, #1e293b)";
          });
        }
        themeOptions.forEach(([val, label], i) => {
          const b = document.createElement("button");
          b.type = "button";
          b.textContent = label;
          b.style.cssText =
            "padding: 8px 16px; border: none; cursor: pointer; font-size: 0.85rem; font-weight: 500; transition: background 0.2s ease;" +
            (i > 0
              ? " border-left: 1px solid var(--cs-border-strong, #d1d5db);"
              : "");
          b.addEventListener("click", () => {
            applyTheme(val);
            saveSettings({ theme: val });
            paintSeg(val);
          });
          segButtons[val] = b;
          seg.appendChild(b);
        });
        paintSeg(settings.theme || "auto");
        themeSection.appendChild(themeTitle);
        themeSection.appendChild(themeDesc);
        themeSection.appendChild(seg);
        modal.appendChild(themeSection);

        // --- Google search behaviour (#1) ---
        const section = document.createElement("div");
        section.style.marginBottom = "20px";
        const secTitle = document.createElement("h3");
        secTitle.textContent = "Google search behaviour";
        secTitle.style.cssText =
          "margin: 0 0 8px; font-size: 1rem; font-weight: 600; color: #1e293b;";
        const desc = document.createElement("p");
        desc.style.cssText =
          "margin: 0 0 12px; font-size: 0.85rem; color: #64748b; line-height: 1.5;";
        const row = document.createElement("div");
        row.style.cssText =
          "display: flex; align-items: center; justify-content: space-between; gap: 12px;";
        const rowLabel = document.createElement("span");
        rowLabel.style.cssText = "font-size: 0.9rem; color: #1e293b;";
        rowLabel.textContent = "Start a new chat for each Google search";
        function syncDesc(on) {
          desc.textContent = on
            ? "Each Google search opens in a brand-new chat thread."
            : "Google searches continue in your current chat thread.";
        }
        syncDesc(settings.newChatPerSearch);
        const toggle = makeToggle(settings.newChatPerSearch, (on) => {
          syncDesc(on);
          saveSettings({ newChatPerSearch: on });
        });
        row.appendChild(rowLabel);
        row.appendChild(toggle);
        section.appendChild(secTitle);
        section.appendChild(desc);
        section.appendChild(row);
        modal.appendChild(section);

        // --- AI avatar (#9) ---
        const avatarSection = document.createElement("div");
        avatarSection.style.marginBottom = "20px";
        const avTitle = document.createElement("h3");
        avTitle.textContent = "AI avatar";
        avTitle.style.cssText =
          "margin: 0 0 8px; font-size: 1rem; font-weight: 600; color: #1e293b;";
        const avDesc = document.createElement("p");
        avDesc.textContent =
          "Paste an image URL (http/https) to use as the AI's profile picture.";
        avDesc.style.cssText =
          "margin: 0 0 12px; font-size: 0.85rem; color: #64748b; line-height: 1.5;";

        const avRow = document.createElement("div");
        avRow.style.cssText = "display: flex; align-items: center; gap: 12px;";

        const preview = document.createElement("div");
        preview.style.cssText =
          "width: 48px; height: 48px; border-radius: 50%; overflow: hidden; flex: 0 0 auto; border: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: center; background: #f8fafc;";
        function renderPreview(url) {
          preview.innerHTML = "";
          const node = createAiAvatarNode(isHttpUrl(url) ? url : "");
          if (node.tagName === "IMG") {
            node.style.width = "48px";
            node.style.height = "48px";
          }
          preview.appendChild(node);
        }
        renderPreview(settings.aiAvatarUrl);

        const avInputWrap = document.createElement("div");
        avInputWrap.style.cssText =
          "flex: 1; display: flex; flex-direction: column; gap: 8px;";
        const avInput = document.createElement("input");
        avInput.type = "text";
        avInput.placeholder = "https://example.com/avatar.png";
        avInput.value = settings.aiAvatarUrl || "";
        avInput.style.cssText =
          "padding: 10px 12px; font-size: 0.9rem; border: 1px solid #d1d5db; border-radius: 8px; outline: none; box-sizing: border-box; width: 100%;";
        avInput.addEventListener("input", () => renderPreview(avInput.value));
        avInput.addEventListener("focus", () => {
          avInput.style.borderColor = "#2563eb";
          avInput.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.2)";
        });
        avInput.addEventListener("blur", () => {
          avInput.style.borderColor = "#d1d5db";
          avInput.style.boxShadow = "none";
        });

        const avBtnRow = document.createElement("div");
        avBtnRow.style.cssText =
          "display: flex; gap: 8px; align-items: center;";
        const applyBtn = document.createElement("button");
        applyBtn.type = "button";
        applyBtn.textContent = "Apply";
        applyBtn.style.cssText =
          "padding: 8px 16px; background: #2563eb; color: #ffffff; border: none; border-radius: 8px; cursor: pointer; font-size: 0.85rem; font-weight: 500;";
        const resetAvatarBtn = document.createElement("button");
        resetAvatarBtn.type = "button";
        resetAvatarBtn.textContent = "Reset";
        resetAvatarBtn.style.cssText =
          "padding: 8px 16px; background: #e5e7eb; color: #1e293b; border: 1px solid #d1d5db; border-radius: 8px; cursor: pointer; font-size: 0.85rem; font-weight: 500;";
        const avStatus = document.createElement("span");
        avStatus.style.cssText = "font-size: 0.8rem; color: #64748b;";

        function applyAvatar(url) {
          const val = (url || "").trim();
          if (val && !isHttpUrl(val)) {
            avStatus.style.color = "#dc2626";
            avStatus.textContent = "Enter a valid http(s) URL.";
            return;
          }
          saveSettings({ aiAvatarUrl: val }).then(() => {
            currentAvatarUrl = val;
            avStatus.style.color = "#0f766e";
            avStatus.textContent = val ? "Applied!" : "Reset to default.";
            chrome.storage.local.get({ threads: [] }, (r) => {
              const active = r.threads.find((t) => t.isActive === "yes");
              if (active) renderChatMessages(active.id, false);
            });
          });
        }
        applyBtn.addEventListener("click", () => applyAvatar(avInput.value));
        resetAvatarBtn.addEventListener("click", () => {
          avInput.value = "";
          renderPreview("");
          applyAvatar("");
        });

        avBtnRow.appendChild(applyBtn);
        avBtnRow.appendChild(resetAvatarBtn);
        avBtnRow.appendChild(avStatus);
        avInputWrap.appendChild(avInput);
        avInputWrap.appendChild(avBtnRow);
        avRow.appendChild(preview);
        avRow.appendChild(avInputWrap);
        avatarSection.appendChild(avTitle);
        avatarSection.appendChild(avDesc);
        avatarSection.appendChild(avRow);
        modal.appendChild(avatarSection);

        const closeBtn = document.createElement("button");
        closeBtn.textContent = "Close";
        closeBtn.style.cssText = modalButtonStyles;
        closeBtn.addEventListener("click", () =>
          document.body.removeChild(overlay),
        );
        modal.appendChild(closeBtn);

        overlay.appendChild(modal);
        overlay.addEventListener("click", (e) => {
          if (e.target === overlay) document.body.removeChild(overlay);
        });
        document.body.appendChild(overlay);
      });
    }

    const settingsBtn = document.getElementById("settings-btn");
    settingsBtn.addEventListener("click", openSettingsModal);
    settingsBtn.addEventListener("mouseenter", () => {
      settingsBtn.style.background = "#e2e8f0";
    });
    settingsBtn.addEventListener("mouseleave", () => {
      settingsBtn.style.background = "none";
    });

    // Issue #8 — export the active chat as PDF.
    const exportChatBtn = document.getElementById("export-chat-btn");
    exportChatBtn.addEventListener("click", () => {
      chrome.storage.local.get({ threads: [] }, (r) => {
        const active = r.threads.find((t) => t.isActive === "yes");
        if (active) exportChatToPdf(active.id);
      });
    });
    exportChatBtn.addEventListener("mouseenter", () => {
      exportChatBtn.style.background = "#d1d5db";
    });
    exportChatBtn.addEventListener("mouseleave", () => {
      exportChatBtn.style.background = "#e5e7eb";
    });

    document.getElementById("report-bug-btn").addEventListener("click", () => {
      window.open("https://forms.gle/c56V94vX7EZ1wcNx5", "_blank");
    });

    document
      .getElementById("feature-request-btn")
      .addEventListener("click", () => {
        window.open("https://forms.gle/qFsjimyMamC5ibvSA", "_blank");
      });

    document
      .getElementById("sendToApiBtn")
      .addEventListener("click", function () {
        const inputText = customAIInput.value.trim();
        if (!inputText) return;

        const timestamp = new Date().toISOString();
        const chatDisplay = document.getElementById("chat-display");

        chrome.storage.local.get(
          { chats: [], threads: [] },
          async function (result) {
            const chats = result.chats;
            const activeThread = result.threads.find(
              (t) => t.isActive === "yes",
            );
            if (!activeThread) return;

            const userMessage = {
              text: inputText,
              date: timestamp,
              role: "user",
              threadId: activeThread.id,
            };
            chats.push(userMessage);
            customAIInput.value = "";
            await new Promise((resolve) => {
              chrome.storage.local.set({ chats: chats }, () => {
                renderChatMessages(activeThread.id, false); // No animation on new message
                resolve();
              });
            });
            showTypingNotification(chatDisplay);
            const minTypingDuration = new Promise((resolve) =>
              setTimeout(resolve, 500),
            );
            try {
              const [aiResponse] = await Promise.all([
                sendToApi(inputText, activeThread.id),
                minTypingDuration,
              ]);
              const aiMessage = {
                text: aiResponse,
                date: new Date().toISOString(),
                role: "ai",
                threadId: activeThread.id,
              };
              chats.push(aiMessage);
              chrome.storage.local.set({ chats: chats }, () => {
                hideTypingNotification();
                renderChatMessages(activeThread.id, false); // No animation on new message
              });
            } catch (error) {
              console.error("Failed to get AI response:", error);
              hideTypingNotification();
              const errorMessage = {
                text: "Error: Could not get AI response.",
                date: new Date().toISOString(),
                role: "ai",
                threadId: activeThread.id,
              };
              chats.push(errorMessage);
              chrome.storage.local.set({ chats: chats }, () => {
                renderChatMessages(activeThread.id, false); // No animation on new message
              });
            }
          },
        );
      });

    document.getElementById("get-help-btn").addEventListener("click", () => {
      const overlay = document.createElement("div");
      overlay.style.cssText = modalStyles;
      const modal = document.createElement("div");
      modal.style.cssText = modalContentStyles;
        modal.className = "cs-modal-content";
      modal.innerHTML = `
        <h2 style="margin: 0 0 16px; font-size: 1.5rem; font-weight: 600;">How we can help</h2>
        <p style="font-size: 0.95rem; line-height: 1.5;">
          <strong>Welcome to your AI-powered Sidebar!</strong><br><br>
          Here's how this tool can help you be more productive every day:
          <ul style="margin: 1em 0; padding-left: 1.5em; font-size: 0.95rem;">
            <li><strong>🔍 Google Integration:</strong> Just type something into Google – the AI will detect your query and instantly provide a helpful answer.</li>
            <li><strong>💬 Chat History:</strong> All your conversations are saved in threads, so you can return to them anytime or continue where you left off.</li>
            <li><strong>🧠 Context Awareness:</strong> The AI remembers the conversation context per thread. The longer the thread, the smarter the answers.</li>
            <li><strong>✏️ Rename & 🗑 Delete:</strong> Organize your chats with custom titles – or remove old threads when you no longer need them.</li>
            <li><strong>📌 Autoscroll & Scroll Button:</strong> Never miss a new message – or jump to the latest response with a single click.</li>
          </ul>
          <p style="font-size: 0.85rem; color: #64748b;">
            👉 Tip: Use this sidebar daily to get quick answers, make better decisions, or brainstorm ideas – all right next to your search results.
          </p>
        </p>
        <button style="${modalButtonStyles}">Close</button>
      `;
      modal
        .querySelector("button")
        .addEventListener("click", () => document.body.removeChild(overlay));
      overlay.appendChild(modal);
      document.body.appendChild(overlay);
    });

    document
      .getElementById("privacy-policy-btn")
      .addEventListener("click", () => {
        const overlay = document.createElement("div");
        overlay.style.cssText = modalStyles;
        const modal = document.createElement("div");
        modal.style.cssText = modalContentStyles;
        modal.className = "cs-modal-content";
        modal.innerHTML = `
        <h2 style="margin: 0 0 16px; font-size: 1.5rem; font-weight: 600;">Privacy Policy</h2>
        <p style="font-size: 0.95rem; line-height: 1.5;">
          Your privacy is important to us. This tool stores your chat threads locally in your browser using Chrome's extension storage.
          <ul style="margin: 1em 0; padding-left: 1.5em; font-size: 0.95rem;">
            <li><strong>📁 Local Storage:</strong> All messages and threads are saved only on your device. We do not collect or transmit personal data.</li>
            <li><strong>🔐 No Tracking:</strong> This extension does not include analytics, trackers, or ads.</li>
            <li><strong>🧠 Context Handling:</strong> Your messages are used solely to provide better contextual responses. They are not shared.</li>
            <li><strong>📤 API Requests:</strong> Messages are sent to your self-hosted API endpoint, if configured. Ensure it complies with your privacy requirements.</li>
            <li><strong>🗑 Easy Data Removal:</strong> You can clear all stored data anytime via the "Clear All" button.</li>
          </ul>
          <p style="font-size: 0.85rem; color: #64748b;">
            By using this extension, you agree to local-only data handling and understand that your privacy is protected by design.
          </p>
        </p>
        <button style="${modalButtonStyles}">Close</button>
      `;
        modal
          .querySelector("button")
          .addEventListener("click", () => document.body.removeChild(overlay));
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
      });

    document
      .getElementById("new-thread-btn")
      .addEventListener("click", function () {
        chrome.storage.local.get({ threads: [] }, function (result) {
          const threads = result.threads;
          const id = "thread_" + Date.now();
          const newThread = {
            id,
            name: `Thread ${threads.length + 1}`,
            created: Date.now(),
            isActive: "yes",
            messages: [],
          };
          const updatedThreads = threads.map((t) => ({ ...t, isActive: "no" }));
          updatedThreads.push(newThread);
          chrome.storage.local.set({ threads: updatedThreads }, function () {
            renderThreads(true);
            renderChatMessages(id, true);
          });
        });
      });

    document
      .getElementById("clear-history")
      .addEventListener("click", function () {
        if (
          confirm(
            "Are you sure you want to delete all threads and chats? This action cannot be undone.",
          )
        ) {
          chrome.storage.local.set({ threads: [], chats: [] }, function () {
            const newThread = {
              id: "thread_" + Date.now(),
              name: "Thread 1",
              created: Date.now(),
              isActive: "yes",
              messages: [],
            };
            chrome.storage.local.set({ threads: [newThread] }, function () {
              renderThreads(true);
              renderChatMessages(newThread.id, true);
            });
          });
        }
      });

    function renderChatMessages(activeThreadId, animate = false) {
      chrome.storage.local.get(
        { chats: [], threads: [], settings: DEFAULT_SETTINGS },
        function (result) {
        const avatarSettings = Object.assign(
          {},
          DEFAULT_SETTINGS,
          result.settings || {},
        );
        currentAvatarUrl = avatarSettings.aiAvatarUrl || "";
        const chatDisplay = document.getElementById("chat-display");
        const wasTyping =
          document.getElementById("typing-notification") !== null;
        chatDisplay.innerHTML = "";

        // Issue #7 — show a "Cloned from …" indicator for forked threads.
        const currentThread = result.threads.find(
          (t) => t.id === activeThreadId,
        );
        if (currentThread && currentThread.clonedFrom) {
          const badge = document.createElement("div");
          badge.className = "cs-cloned-indicator";
          badge.style.cssText = `
            align-self: center; font-size: 0.75rem; color: #64748b;
            background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 999px;
            padding: 4px 12px; margin-bottom: 4px; max-width: 90%;
            overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
          `;
          const label = currentThread.clonedFromName || "another chat";
          badge.textContent = `Cloned from "${label}"`;
          badge.title = badge.textContent;
          chatDisplay.appendChild(badge);
        }

        const threadChats = result.chats.filter(
          (chat) => chat.threadId === activeThreadId,
        );

        // Issue #7 — if we arrived here from a search result, scroll to the match.
        let matchEl = null;
        let matchBubble = null;

        threadChats.forEach((chat, index) => {
          const messageElement = document.createElement("div");
          messageElement.style.display = "flex";
          messageElement.style.alignItems = "flex-start";
          messageElement.style.marginBottom = "12px";
          //if (animate) {
          //  messageElement.style.opacity = "0";
          // messageElement.style.transform = "translateY(-20px)";
          //  messageElement.style.animation = `slideInMessage 0.3s ease forwards ${index * 0.1}s`;
          // }

          const bubbleContainer = document.createElement("div");
          bubbleContainer.style.maxWidth = "70%";
          bubbleContainer.style.display = "flex";
          bubbleContainer.style.flexDirection = "column";

          const messageBubble = document.createElement("div");
          messageBubble.style.padding = "12px 16px";
          messageBubble.style.borderRadius =
            chat.role === "user" ? "12px 12px 0 12px" : "12px 12px 12px 0";
          messageBubble.style.wordBreak = "break-word";
          messageBubble.style.fontSize = "0.95rem";
          messageBubble.style.lineHeight = "1.5";
          messageBubble.className =
            "cs-bubble cs-bubble--" + (chat.role === "user" ? "user" : "ai");
          // Issue #10 — render AI Markdown/code; keep user input as plain text.
          if (chat.role === "user") {
            messageBubble.textContent = chat.text;
          } else {
            renderMarkdownInto(messageBubble, chat.text);
          }

          const timestamp = document.createElement("div");
          timestamp.className = "cs-timestamp";
          timestamp.style.fontSize = "0.75rem";
          timestamp.style.color = "#64748b";
          timestamp.style.marginTop = "4px";
          timestamp.textContent = new Date(chat.date).toLocaleString();

          const iconContainer = document.createElement("div");
          iconContainer.style.margin =
            chat.role === "user" ? "0 0 0 12px" : "0 12px 0 0";

          if (chat.role === "user") {
            messageElement.style.justifyContent = "flex-end";
            bubbleContainer.style.alignItems = "flex-end";
            messageBubble.style.background = "#2563eb";
            messageBubble.style.color = "#ffffff";
            iconContainer.innerHTML = userIcon;
          } else {
            messageElement.style.justifyContent = "flex-start";
            bubbleContainer.style.alignItems = "flex-start";
            messageBubble.style.background = "#e5e7eb";
            messageBubble.style.color = "#1e293b";
            iconContainer.appendChild(createAiAvatarNode());
          }

          bubbleContainer.appendChild(messageBubble);
          bubbleContainer.appendChild(timestamp);
          // Issues #10 / #8 — per-message actions: copy (AI) + export PDF (all).
          const msgActions = document.createElement("div");
          msgActions.style.cssText =
            "display: flex; gap: 6px; margin-top: 4px; align-self: " +
            (chat.role === "user" ? "flex-end" : "flex-start") +
            ";";
          if (chat.role !== "user") {
            msgActions.appendChild(makeCopyButton(() => chat.text));
          }
          msgActions.appendChild(
            makeMiniButton("PDF", "Export this message as PDF", () =>
              exportMessageToPdf(chat),
            ),
          );
          bubbleContainer.appendChild(msgActions);
          messageElement.appendChild(
            chat.role === "user" ? bubbleContainer : iconContainer,
          );
          messageElement.appendChild(
            chat.role === "user" ? iconContainer : bubbleContainer,
          );
          if (
            pendingScroll &&
            pendingScroll.threadId === activeThreadId &&
            !matchEl &&
            chat.text === pendingScroll.matchText
          ) {
            matchEl = messageElement;
            matchBubble = messageBubble;
          }
          chatDisplay.appendChild(messageElement);
        });

        if (
          wasTyping &&
          threadChats.length > 0 &&
          threadChats[threadChats.length - 1].role === "user"
        ) {
          showTypingNotification(chatDisplay);
        } else {
          hideTypingNotification();
        }

        if (matchEl) {
          // Scroll the matched message into view and flash it briefly.
          requestAnimationFrame(() => {
            matchEl.scrollIntoView({ behavior: "smooth", block: "center" });
          });
          if (matchBubble) {
            const prevShadow = matchBubble.style.boxShadow;
            matchBubble.style.transition = "box-shadow 0.3s ease";
            matchBubble.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.45)";
            setTimeout(() => {
              matchBubble.style.boxShadow = prevShadow || "none";
            }, 1600);
          }
          pendingScroll = null;
        } else {
          chatDisplay.scrollTop = chatDisplay.scrollHeight;
        }
      });
    }

    function showTypingNotification(chatDisplay) {
      hideTypingNotification();
      const typingElement = document.createElement("div");
      typingElement.id = "typing-notification";
      typingElement.style.display = "flex";
      typingElement.style.alignItems = "flex-start";
      typingElement.style.justifyContent = "flex-start";
      typingElement.style.marginBottom = "12px";
      typingElement.style.opacity = "0";
      typingElement.style.transition = "opacity 0.3s ease";

      const bubbleContainer = document.createElement("div");
      bubbleContainer.style.maxWidth = "70%";
      bubbleContainer.style.display = "flex";
      bubbleContainer.style.flexDirection = "column";
      bubbleContainer.style.alignItems = "flex-start";

      const typingBubble = document.createElement("div");
      typingBubble.style.background = "#e5e7eb";
      typingBubble.style.color = "#1e293b";
      typingBubble.style.padding = "12px 16px";
      typingBubble.style.borderRadius = "12px 12px 12px 0";
      typingBubble.style.fontSize = "0.95rem";
      typingBubble.style.display = "flex";
      typingBubble.style.alignItems = "center";
      typingBubble.style.boxShadow = "0 2px 5px rgba(0, 0, 0, 0.1)";
      typingBubble.innerHTML = `AI is typing <span class="typing-dots">...</span>`;

      const style = document.createElement("style");
      style.textContent = `
        .typing-dots {
          display: inline-block;
          width: 24px;
          text-align: left;
        }
        .typing-dots::after {
          content: '...';
          display: inline-block;
          animation: dots 1.5s steps(5, end) infinite;
        }
        @keyframes dots {
          0%, 20% { content: '.'; }
          40% { content: '..'; }
          60% { content: '...'; }
          80%, 100% { content: ''; }
        }
      `;
      document.head.appendChild(style);

      const iconContainer = document.createElement("div");
      iconContainer.style.marginRight = "12px";
      iconContainer.appendChild(createAiAvatarNode());

      bubbleContainer.appendChild(typingBubble);
      typingElement.appendChild(iconContainer);
      typingElement.appendChild(bubbleContainer);
      chatDisplay.appendChild(typingElement);

      setTimeout(() => {
        typingElement.style.opacity = "1";
      }, 10);

      chatDisplay.scrollTop = chatDisplay.scrollHeight;
    }

    function hideTypingNotification() {
      const typingElement = document.getElementById("typing-notification");
      if (typingElement) {
        typingElement.style.opacity = "0";
        setTimeout(() => typingElement.remove(), 300);
      }
    }

    renderThreads(true);
    chrome.storage.local.get({ threads: [] }, function (result) {
      let threads = result.threads;
      threads = threads.sort((a, b) => b.created - a.created);
      const hasActiveThread = threads.some((t) => t.isActive === "yes");
      if (!hasActiveThread && threads.length > 0) {
        threads = threads.map((t, index) => ({
          ...t,
          isActive: index === 0 ? "yes" : "no",
        }));
        chrome.storage.local.set({ threads: threads }, () => {
          renderThreads(true);
          renderChatMessages(threads[0].id, true);
        });
      } else if (threads.length === 0) {
        const newThread = {
          id: "thread_" + Date.now(),
          name: "Thread 1",
          created: Date.now(),
          isActive: "yes",
          messages: [],
        };
        chrome.storage.local.set({ threads: [newThread] }, () => {
          renderThreads(true);
          renderChatMessages(newThread.id, true);
        });
      } else {
        renderThreads(true);
        const activeThread = threads.find((t) => t.isActive === "yes");
        renderChatMessages(activeThread.id, true);
      }
    });

    const customAIInput = document.getElementById("custom-ai-input");

    if (customAIInput.value.trim()) {
      const inputText = customAIInput.value.trim();
      const timestamp = new Date().toISOString();
      const chatDisplay = document.getElementById("chat-display");

      chrome.storage.local.get(
        { chats: [], threads: [], settings: DEFAULT_SETTINGS },
        async function (result) {
          const chats = result.chats;
          const settings = Object.assign(
            {},
            DEFAULT_SETTINGS,
            result.settings || {},
          );

          // Issue #1 — optionally start a fresh chat for each Google search.
          let activeThread;
          if (settings.newChatPerSearch) {
            const threads = result.threads.map((t) => ({
              ...t,
              isActive: "no",
            }));
            activeThread = {
              id: "thread_" + Date.now(),
              name: `Search: ${inputText.slice(0, 40)}`,
              created: Date.now(),
              isActive: "yes",
              messages: [],
            };
            threads.push(activeThread);
            await new Promise((resolve) =>
              chrome.storage.local.set({ threads: threads }, resolve),
            );
            renderThreads(false);
          } else {
            activeThread = result.threads.find((t) => t.isActive === "yes");
          }
          if (!activeThread) return;

          const recentUserMessages = chats
            .slice(-5)
            .filter(
              (entry) =>
                entry.role === "user" && entry.threadId === activeThread.id,
            )
            .slice(-5);

          const isDuplicate = recentUserMessages.some(
            (entry) => entry.text === inputText,
          );

          if (!isDuplicate) {
            const userMessage = {
              text: inputText,
              date: timestamp,
              role: "user",
              threadId: activeThread.id,
            };
            chats.push(userMessage);
            customAIInput.value = "";
            await new Promise((resolve) => {
              chrome.storage.local.set({ chats: chats }, () => {
                renderChatMessages(activeThread.id, false); // No animation on new message
                resolve();
              });
            });
            showTypingNotification(chatDisplay);
            const minTypingDuration = new Promise((resolve) =>
              setTimeout(resolve, 500),
            );
            try {
              const [aiResponse] = await Promise.all([
                sendToApi(inputText, activeThread.id),
                minTypingDuration,
              ]);
              const aiMessage = {
                text: aiResponse,
                date: new Date().toISOString(),
                role: "ai",
                threadId: activeThread.id,
              };
              chats.push(aiMessage);
              chrome.storage.local.set({ chats: chats }, () => {
                hideTypingNotification();
                renderChatMessages(activeThread.id, false); // No animation on new message
              });
            } catch (error) {
              console.error("Failed to get AI response:", error);
              hideTypingNotification();
              const errorMessage = {
                text: "Error: Could not get AI response.",
                date: new Date().toISOString(),
                role: "ai",
                threadId: activeThread.id,
              };
              chats.push(errorMessage);
              chrome.storage.local.set({ chats: chats }, () => {
                renderChatMessages(activeThread.id, false); // No animation on new message
              });
            }
          } else {
            customAIInput.value = "";
          }
        },
      );
    }

    customAIInput.addEventListener("keydown", async function (event) {
      if (event.key === "Enter") {
        event.preventDefault();
        const inputText = customAIInput.value.trim();
        if (!inputText) return;

        const timestamp = new Date().toISOString();
        const chatDisplay = document.getElementById("chat-display");

        chrome.storage.local.get(
          { chats: [], threads: [] },
          async function (result) {
            const chats = result.chats;
            const activeThread = result.threads.find(
              (t) => t.isActive === "yes",
            );
            if (!activeThread) return;

            const userMessage = {
              text: inputText,
              date: timestamp,
              role: "user",
              threadId: activeThread.id,
            };
            chats.push(userMessage);
            customAIInput.value = "";
            await new Promise((resolve) => {
              chrome.storage.local.set({ chats: chats }, () => {
                renderChatMessages(activeThread.id, false); // No animation on new message
                resolve();
              });
            });
            showTypingNotification(chatDisplay);
            const minTypingDuration = new Promise((resolve) =>
              setTimeout(resolve, 500),
            );
            try {
              const [aiResponse] = await Promise.all([
                sendToApi(inputText, activeThread.id),
                minTypingDuration,
              ]);
              const aiMessage = {
                text: aiResponse,
                date: new Date().toISOString(),
                role: "ai",
                threadId: activeThread.id,
              };
              chats.push(aiMessage);
              chrome.storage.local.set({ chats: chats }, () => {
                hideTypingNotification();
                renderChatMessages(activeThread.id, false); // No animation on new message
              });
            } catch (error) {
              console.error("Failed to get AI response:", error);
              hideTypingNotification();
              const errorMessage = {
                text: "Error: Could not get AI response.",
                date: new Date().toISOString(),
                role: "ai",
                threadId: activeThread.id,
              };
              chats.push(errorMessage);
              chrome.storage.local.set({ chats: chats }, () => {
                renderChatMessages(activeThread.id, false); // No animation on new message
              });
            }
          },
        );
      }
    });

    window.addEventListener("resize", adjustThreadsContainerHeight);

    // Issue #6 — make the panel draggable by its header and restore last position.
    setupDragging(uiContainer);
    restorePanelPosition(uiContainer);
    // Issue #2 (Round 2) — resizable threads column + whole-widget corner.
    setupResizing(uiContainer);
  }

  // Issue #4 — Context awareness: forward the active thread's history so the
  // AI actually "remembers" the conversation (the Help/Privacy copy claims this).
  const MAX_HISTORY_MESSAGES = 30;

  function roleForApi(role) {
    return role === "ai" ? "assistant" : "user";
  }

  // Build the API messages array from the stored thread history, in order,
  // capped to the most recent MAX_HISTORY_MESSAGES messages.
  function getThreadHistory(threadId) {
    return new Promise((resolve) => {
      chrome.storage.local.get({ chats: [] }, function (result) {
        const messages = result.chats
          .filter((c) => c.threadId === threadId)
          .map((c) => ({ role: roleForApi(c.role), content: c.text }));
        resolve(messages.slice(-MAX_HISTORY_MESSAGES));
      });
    });
  }

  async function sendToApi(text, threadId) {
    let messages;
    if (threadId) {
      messages = await getThreadHistory(threadId);
      // The current user message is normally already persisted (last item).
      // Only append it if it isn't, then re-cap — always ends with this message.
      const last = messages[messages.length - 1];
      if (!last || last.role !== "user" || last.content !== text) {
        messages.push({ role: "user", content: text });
        messages = messages.slice(-MAX_HISTORY_MESSAGES);
      }
    } else {
      messages = [{ role: "user", content: text }];
    }

    const payload = {
      model: "gpt-3.5-turbo",
      messages,
    };
    try {
      const res = await fetch("https://ai.prompt-in.com/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok)
        throw new Error(`API error: ${res.status} ${res.statusText}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      return data.response || "Keine Antwort erhalten.";
    } catch (error) {
      console.error("API Error:", error);
      return `Error: ${error.message}`;
    }
  }

  function init() {
    const targetDiv = document.getElementById("appbar");
    if (targetDiv) createUI(targetDiv);
  }

  const observer = new MutationObserver(() => {
    const targetDiv = document.getElementById("appbar");
    if (targetDiv && !document.getElementById(CONTAINER_ID))
      createUI(targetDiv);
  });

  window.addEventListener("load", () => {
    guardChromeStorage();
    startContextWatch();
    const body = document.body;
    if (body) {
      observer.observe(body, { childList: true, subtree: true });
      init();
    }
  });
})();

function waitForElements(selectors, callback, interval = 200, timeout = 10000) {
  const start = Date.now();

  const check = () => {
    const allFound = selectors.every(sel => document.querySelector(sel));
    if (allFound) {
      callback();
    } else if (Date.now() - start < timeout) {
      setTimeout(check, interval);
    } else {
      console.warn("Timeout: Nicht alle Elemente wurden gefunden:", selectors);
    }
  };

  if (document.readyState === "complete" || document.readyState === "interactive") {
    check();
  } else {
    window.addEventListener("DOMContentLoaded", check);
  }
}

// === Anwendung ===
waitForElements(
  [
    ".OZ9ddf",
    "div[class=''][jscontroller='zp3Dsd']",
    "[jsname='uLislf']"
  ],
  () => {
    console.log("Alle Ziel-Elemente gefunden – Anpassungen werden ausgeführt.");

    document.querySelector(".OZ9ddf").style.display = "block";

    const el1 = document.querySelector("div[class=''][jscontroller='zp3Dsd']");
    if (el1) el1.remove();

    const el2 = document.querySelector("[jsname='uLislf']");
    if (el2) el2.remove();
  }
);
