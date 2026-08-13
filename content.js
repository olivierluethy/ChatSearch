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
        margin: 8px 0 4px; font-weight: 600; line-height: 1.3; color: #1e293b;
      }
      .cs-md h1 { font-size: 1.15rem; }
      .cs-md h2 { font-size: 1.08rem; }
      .cs-md h3 { font-size: 1rem; }
      .cs-md h4, .cs-md h5, .cs-md h6 { font-size: 0.95rem; }
      .cs-md a { color: #2563eb; text-decoration: underline; }
      .cs-md blockquote {
        margin: 0 0 8px; padding: 4px 12px;
        border-left: 3px solid #cbd5e1; color: #475569;
      }
      .cs-md hr { border: none; border-top: 1px solid #e2e8f0; margin: 12px 0; }
      .cs-md :not(pre) > code {
        background: #e5e7eb; color: #1e293b; padding: 1px 5px;
        border-radius: 4px; font-family: ${MONO_FONT}; font-size: 0.85em;
      }
      .cs-md table { border-collapse: collapse; margin: 0 0 8px; font-size: 0.9rem; }
      .cs-md th, .cs-md td { border: 1px solid #e2e8f0; padding: 4px 8px; }
      .cs-md th { background: #f1f5f9; }

      .cs-code-wrap { position: relative; margin: 0 0 8px; }
      .cs-code-wrap pre {
        margin: 0; background: #f8fafc; border: 1px solid #e2e8f0;
        border-radius: 8px; padding: 12px 14px; overflow-x: auto;
      }
      .cs-code-wrap pre code {
        font-family: ${MONO_FONT}; font-size: 0.85rem; line-height: 1.5;
        background: none; padding: 0; color: #1e293b;
      }

      .cs-copy-btn {
        background: #e5e7eb; color: #1e293b; border: none; border-radius: 6px;
        font-size: 0.75rem; font-weight: 500; padding: 4px 8px; cursor: pointer;
        transition: background 0.2s ease;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      .cs-copy-btn:hover { background: #d1d5db; }
      .cs-code-copy {
        position: absolute; top: 8px; right: 8px; opacity: 0;
        transition: opacity 0.2s ease, background 0.2s ease;
      }
      .cs-code-wrap:hover .cs-code-copy,
      .cs-code-copy:focus { opacity: 1; }
      .cs-msg-copy { margin-top: 4px; align-self: flex-start; }

      /* highlight.js theme — light, slate/blue (STYLEGUIDE §9) */
      .hljs { color: #1e293b; background: transparent; }
      .hljs-comment, .hljs-quote { color: #64748b; font-style: italic; }
      .hljs-keyword, .hljs-selector-tag, .hljs-built_in,
      .hljs-name, .hljs-literal { color: #2563eb; }
      .hljs-string, .hljs-addition, .hljs-regexp, .hljs-symbol { color: #0f766e; }
      .hljs-number, .hljs-meta .hljs-number, .hljs-bullet, .hljs-link { color: #b45309; }
      .hljs-title, .hljs-title.function_, .hljs-section { color: #1e40af; font-weight: 500; }
      .hljs-attr, .hljs-attribute, .hljs-variable, .hljs-template-variable { color: #1e293b; }
      .hljs-type, .hljs-class .hljs-title, .hljs-tag, .hljs-meta { color: #7c3aed; }
      .hljs-deletion { color: #b91c1c; }
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
  const DEFAULT_SETTINGS = { newChatPerSearch: false, aiAvatarUrl: "" };

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
  }

  function restorePanelPosition(container) {
    chrome.storage.local.get({ panelPosition: null }, (r) => {
      const p = r.panelPosition;
      if (!p || typeof p.left !== "number" || typeof p.top !== "number") return;
      container.style.transform = "none";
      const pos = clampToViewport(container, p.left, p.top);
      container.style.left = pos.left + "px";
      container.style.top = pos.top + "px";
    });
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
    )}</h1>${innerHtml}<script>window.onload=function(){setTimeout(function(){window.focus();window.print();},250);};</script></body></html>`;
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
        height: 80%; /* Wichtig, um die 90vh/maxHeight des äußeren Containers zu nutzen */
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

          <div id="threads-container" style="
            flex: 1;
            /* Max-Height kann jetzt gelöscht oder angepasst werden, da der Elter die Höhe vorgibt */
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
});

    // Sanfte Animation für Hauptbereich
    uiContainer.style.transition = "all 0.3s ease";

    // Dynamically adjust threads container height
    function adjustThreadsContainerHeight() {
      const mainContent = document.getElementById("main-content");
      const threadsContainer = document.getElementById("threads-container");
      if (mainContent && threadsContainer) {
        const mainContentHeight = mainContent.getBoundingClientRect().height;
        threadsContainer.style.maxHeight = `${mainContentHeight - 80}px`;
      }
    }

    // Render threads with animation
    function renderThreads(animate = true) {
      chrome.storage.local.get({ threads: [], chats: [] }, function (result) {
        let threads = result.threads;
        const chats = result.chats;

        threads = threads.sort((a, b) => b.created - a.created);

        const hasActiveThread = threads.some((t) => t.isActive === "yes");
        if (!hasActiveThread && threads.length > 0) {
          threads = threads.map((t, index) => ({
            ...t,
            isActive: index === 0 ? "yes" : "no",
          }));
          chrome.storage.local.set({ threads: threads }, () => {
            console.log("Set newest thread as active:", threads[0]);
          });
        }

        const threadsList = document.getElementById("threads");
        threadsList.innerHTML = "";

        threads.forEach((thread, index) => {
          const li = document.createElement("li");
          li.style.padding = "12px";
          li.style.cursor = "pointer";
          li.style.backgroundColor =
            thread.isActive === "yes" ? "#e3f2fd" : "transparent";
          li.style.borderBottom = "1px solid #e5e7eb";
          li.style.display = "flex";
          li.style.alignItems = "center";
          li.style.gap = "8px";
          li.style.transition = "background 0.2s ease";
          if (animate) {
            li.style.opacity = "0";
            li.style.transform = "translateX(-20px)";
            li.style.animation = `slideIn 0.3s ease forwards ${index * 0.1}s`;
          }

          const threadInfoContainer = document.createElement("div");
          threadInfoContainer.style.flex = "1";
          threadInfoContainer.style.overflow = "hidden";
          threadInfoContainer.style.textOverflow = "ellipsis";
          threadInfoContainer.style.whiteSpace = "normal";

          const threadNameSpan = document.createElement("span");
          threadNameSpan.textContent = thread.name;
          threadNameSpan.style.fontWeight = "500";
          threadNameSpan.style.fontSize = "0.95rem";
          threadNameSpan.style.color = "#1e293b";

          const threadDetails = document.createElement("div");
          threadDetails.style.fontSize = "0.75rem";
          threadDetails.style.color = "#64748b";
          threadDetails.style.marginTop = "4px";

          const createdDate = new Date(thread.created).toLocaleDateString(
            "en-GB",
            {
              day: "2-digit",
              month: "short",
              year: "numeric",
            },
          );
          const messageCount = chats.filter(
            (chat) => chat.threadId === thread.id,
          ).length;
          threadDetails.textContent = `Created: ${createdDate} | Messages: ${messageCount}`;

          // Issue #7 — clone/fork this conversation into a new thread.
          const cloneBtn = document.createElement("button");
          cloneBtn.title = "Continue in new chat";
          cloneBtn.style.background = "none";
          cloneBtn.style.border = "none";
          cloneBtn.style.cursor = "pointer";
          cloneBtn.style.fontSize = "0.9rem";
          cloneBtn.style.transition = "color 0.2s ease";
          cloneBtn.style.display = "flex";
          cloneBtn.style.alignItems = "center";
          cloneBtn.style.color = "#64748b";
          cloneBtn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="3" x2="6" y2="15"></line><circle cx="18" cy="6" r="3"></circle><circle cx="6" cy="18" r="3"></circle><path d="M18 9a9 9 0 0 1-9 9"></path></svg>`;

          const editBtn = document.createElement("button");
          editBtn.textContent = "✏️";
          editBtn.style.background = "none";
          editBtn.style.border = "none";
          editBtn.style.cursor = "pointer";
          editBtn.style.fontSize = "0.9rem";
          editBtn.style.transition = "color 0.2s ease";

          const deleteBtn = document.createElement("button");
          deleteBtn.textContent = "🗑️";
          deleteBtn.style.background = "none";
          deleteBtn.style.border = "none";
          deleteBtn.style.cursor = "pointer";
          deleteBtn.style.fontSize = "0.9rem";
          deleteBtn.style.transition = "color 0.2s ease";

          cloneBtn.addEventListener("mouseenter", () => {
            cloneBtn.style.color = "#2563eb";
          });
          cloneBtn.addEventListener("mouseleave", () => {
            cloneBtn.style.color = "#64748b";
          });
          cloneBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            chrome.storage.local.get(
              { threads: [], chats: [] },
              function (data) {
                const sourceThread = data.threads.find(
                  (t) => t.id === thread.id,
                );
                if (!sourceThread) return;
                const newId = "thread_" + Date.now();
                // Deep-copy every message from the source thread.
                const clonedChats = data.chats
                  .filter((c) => c.threadId === thread.id)
                  .map((c) => ({
                    ...JSON.parse(JSON.stringify(c)),
                    threadId: newId,
                  }));
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
              },
            );
          });

          editBtn.addEventListener("mouseenter", () => {
            editBtn.style.color = "#2563eb";
          });
          editBtn.addEventListener("mouseleave", () => {
            editBtn.style.color = "#64748b";
          });
          deleteBtn.addEventListener("mouseenter", () => {
            deleteBtn.style.color = "#dc2626";
          });
          deleteBtn.addEventListener("mouseleave", () => {
            deleteBtn.style.color = "#64748b";
          });

          li.addEventListener("click", () => {
            const updatedThreads = threads.map((t) => ({
              ...t,
              isActive: t.id === thread.id ? "yes" : "no",
            }));
            chrome.storage.local.set({ threads: updatedThreads }, () => {
              renderThreads(false); // No animation on thread switch
              renderChatMessages(thread.id, true); // Animate chat messages
            });
          });

          editBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            const newName = prompt("Enter new thread name:", thread.name);
            if (newName && newName.trim()) {
              const updatedThreads = threads.map((t) =>
                t.id === thread.id ? { ...t, name: newName.trim() } : t,
              );
              chrome.storage.local.set({ threads: updatedThreads }, () => {
                renderThreads(animate);
              });
            }
          });

          deleteBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            if (confirm(`Are you sure you want to delete "${thread.name}"?`)) {
              chrome.storage.local.get(
                { threads: [], chats: [] },
                function (data) {
                  let updatedThreads = data.threads.filter(
                    (t) => t.id !== thread.id,
                  );
                  const updatedChats = data.chats.filter(
                    (chat) => chat.threadId !== thread.id,
                  );
                  updatedThreads = updatedThreads.sort(
                    (a, b) => b.created - a.created,
                  );
                  if (updatedThreads.length > 0) {
                    updatedThreads = updatedThreads.map((t, index) => ({
                      ...t,
                      isActive: index === 0 ? "yes" : "no",
                    }));
                  }
                  chrome.storage.local.set(
                    { threads: updatedThreads, chats: updatedChats },
                    () => {
                      renderThreads(animate);
                      const newActiveThread = updatedThreads.find(
                        (t) => t.isActive === "yes",
                      );
                      renderChatMessages(
                        newActiveThread ? newActiveThread.id : "",
                        true,
                      );
                    },
                  );
                },
              );
            }
          });

          li.addEventListener("mouseenter", () => {
            li.style.backgroundColor =
              thread.isActive === "yes" ? "#bfdbfe" : "#f1f5f9";
          });
          li.addEventListener("mouseleave", () => {
            li.style.backgroundColor =
              thread.isActive === "yes" ? "#e3f2fd" : "transparent";
          });

          threadInfoContainer.appendChild(threadNameSpan);
          threadInfoContainer.appendChild(threadDetails);
          li.appendChild(threadInfoContainer);
          li.appendChild(cloneBtn);
          li.appendChild(editBtn);
          li.appendChild(deleteBtn);
          threadsList.appendChild(li);
        });

        const style = document.createElement("style");
        style.textContent = `
          @keyframes slideIn {
            from { opacity: 0; transform: translateX(-20px); }
            to { opacity: 1; transform: translateX(0); }
          }
          @keyframes slideInMessage {
            from { opacity: 0; transform: translateY(-20px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `;
        document.head.appendChild(style);

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

        const title = document.createElement("h2");
        title.textContent = "Settings";
        title.style.cssText =
          "margin: 0 0 16px; font-size: 1.5rem; font-weight: 600;";
        modal.appendChild(title);

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
      chrome.storage.local.get({ chats: [], threads: [] }, function (result) {
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
          // Issue #10 — render AI Markdown/code; keep user input as plain text.
          if (chat.role === "user") {
            messageBubble.textContent = chat.text;
          } else {
            renderMarkdownInto(messageBubble, chat.text);
          }

          const timestamp = document.createElement("div");
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
            iconContainer.innerHTML = aiIcon;
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

        chatDisplay.scrollTop = chatDisplay.scrollHeight;
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
      iconContainer.innerHTML = aiIcon;

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
