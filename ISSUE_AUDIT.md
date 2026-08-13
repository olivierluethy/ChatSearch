# Issue Audit — ChatSearch

**Repository:** [olivierluethy/ChatSearch](https://github.com/olivierluethy/ChatSearch)
**Audit date:** 2026-08-13
**Auditor:** Automated code-vs-issue reconciliation (evidence-based)
**Codebase audited at commit:** `c64b780` (main)

The product is a Chrome extension (Manifest V3) that injects an AI chat sidebar into
Google Search result pages. Effectively the entire application lives in a single file,
[`content.js`](content.js) (~1350 lines), plus [`manifest.json`](manifest.json).
The extension declares only the `storage` permission and its content script runs on
`www.google.*` domains.

**Method:** For every issue I extracted the concrete requirement, then cross-referenced
it against the current source (`content.js`, `manifest.json`), git history, and PRs.
**Code is treated as the source of truth** — not the issue's stated status, and not
marketing copy inside the UI. There are **no pull requests** in this repository
(`gh pr list --state all` → empty); all work landed as direct commits to `main`.

---

## 1. Summary

| Metric | Count |
|---|---|
| Total issues | 10 |
| Open | 9 (#1, #2, #3, #4, #6, #7, #8, #9, #10) |
| Closed | 1 (#5) |
| Requirements fully implemented in code | 1 (#5 only) |
| Requirements partially implemented | 1 (#1) |
| Requirements not implemented | 8 (#2, #3, #4, #6, #7, #8, #9, #10) |
| **Proposed issue closures** | **0** |
| Wrongly-closed issues (regressions) | 0 |

**Headline result:** No open issue is fully and demonstrably implemented, so **no open
issue qualifies for closure** under the "fully implemented" bar. The single closed issue
(#5) is correctly resolved (solved via an equivalent mechanism) and stays closed.
Net state changes to apply in Step 6: **none.**

---

## 2. Implemented / Done

| # | Title | State | Evidence | Notes (esp. "solved differently") |
|---|---|---|---|---|
| 5 | extension on right side just on the right next to gemini answer | CLOSED | `content.js:77-83` fixes the UI container to the right of the viewport (`position:fixed; left:80%`). `content.js:1337-1354` (`waitForElements`) reproduces the issue's DOM manipulation goal: shows `.OZ9ddf` (`display:block`) and removes the `zp3Dsd` / `uLislf` blocks so the assistant sits beside the results. Issue closed `2025-11-11`. | **Accepted as solved differently.** The issue proposed a raw inline CSS/JS snippet (mutating `#rcnt` margins, hiding `#LUqzrb`, etc.). The shipped solution reaches the same end-state — the panel rendered on the right, next to the answer — using a robust `waitForElements` guard plus fixed positioning, instead of the exact one-shot snippet. The product also removed Gemini entirely (commit `c279471`, "Removal of Gemini AI") and now uses a custom API, so the literal "next to gemini answer" wording is obsolete while the underlying layout requirement (right-side placement) is met. A working, proven layout takes precedence over matching the original snippet. **Leave closed.** |

### Partially implemented (does NOT qualify as "done")

| # | Title | State | What works | What is missing |
|---|---|---|---|---|
| 1 | Chats | OPEN | Per-message date/time **is** stored: every message object carries a `date` ISO timestamp (`content.js:766-769`, `787-792`, `1214-1219`, `1237-1242`) and it is rendered per bubble (`content.js:959-963`). Threads carry `created` timestamps and a message count (`content.js:508-519`). "Create a new chat easily" exists via the **New Chat** button (`content.js:877-897`) and auto-thread bootstrap (`content.js:1095-1106`). | The explicitly-requested **user-configurable preference** — "let the user pre-configure whether each Google search query starts a *new* chat, or always reuses the *same* chat window" — is **not implemented**. There is no settings UI and no stored option; a Google-search-originated query is always appended to the current active thread (`content.js:1114-1194`). Grep for `perSearch|newChatPer|settings|preference|option` in `content.js` → no matches. Because a stated requirement is unmet, #1 is **partial** and must stay open. |

---

## 3. Not yet implemented / Incomplete

| # | Title | State | What is missing | Supporting evidence for the gap |
|---|---|---|---|---|
| 4 | 🔁 Context Awareness: AI remembers previous messages within a thread | OPEN | The AI does **not** receive prior messages. Each request sends only the single current message, so there is no cross-message memory. | `sendToApi()` builds `messages: [{ role: "user", content: text }]` — one message only (`content.js:1270-1274`). No thread history is read or forwarded. **Note:** the Help modal *claims* "The AI remembers the conversation context per thread" (`content.js:829`) and the Privacy modal repeats it (`content.js:860`), but this is UI copy contradicted by the code. Code is source of truth ⇒ not implemented. |
| 10 | Format KI outputs correctly (Markdown + code syntax highlighting + copy) | OPEN | No Markdown rendering, no code syntax highlighting, no copy-to-clipboard button. AI text is shown verbatim as plain text. | Message content is assigned via `messageBubble.textContent = chat.text` (`content.js:957`) — `textContent` escapes all markup, so Markdown/code never render. Grep for `markdown|marked|highlight|hljs|prism|clipboard|copy` in `content.js` → no matches. |
| 6 | Window fully draggable with the mouse (smooth) | OPEN | The panel cannot be dragged. It is pinned at a fixed position; there are no drag handlers. | Container is `position:fixed` at `top:57.8%; left:80%` (`content.js:77-83`) with no reposition logic. Grep for `drag|mousedown|mousemove|pointerdown` in `content.js` → no matches. (The existing mouse handler at `content.js:363` only collapses/expands the sidebar.) |
| 7 | Continue a conversation in a new chat (clone/fork) | OPEN | No ability to clone an existing conversation into a new thread and continue it; no "cloned from…" indicator. | **New Chat** always creates an *empty* thread (`content.js:882-889`, `messages:[]`). Grep for `clone|fork|duplicate|weiterf|verlager` in `content.js` → no matches. |
| 8 | Export chats as PDF | OPEN | No PDF/print export of a chat or a single message. | Grep for `pdf|jspdf|window.print|.print(` in `content.js` → no matches. `manifest.json` declares only `["storage"]` permissions — no export/download plumbing exists. |
| 9 | Custom AI profile picture via URL (preview + apply) | OPEN | The AI avatar is a hard-coded inline SVG; users cannot upload/set a custom image or preview a URL. | Avatar is the static `aiIcon` SVG constant (`content.js:55-64`), injected at `content.js:980` and `content.js:1059`. Grep for `avatar|profile|upload` in `content.js` → no matches. |
| 3 | Alert user when the extension context is invalidated (force reload) | OPEN | No detection of an invalidated extension context and no reload prompt/alert. | Grep for `invalidat|location.reload|runtime.id|chrome.runtime` in `content.js` → no matches. This issue is also phrased as a "how/where do I add this" question; it remains unanswered in code. |
| 2 | Moats analysis & AI research for the product | OPEN | This is a **research/business** deliverable ("Chatverläufe" / competitive-moat analysis), not a code feature. Nothing in the repo satisfies or could satisfy it. | Not a code artifact; cannot be evidenced in `content.js`. Kept open as a non-engineering task. |

---

## 4. Prioritized ranking (what to implement first → last)

**Criteria (in order of weight):**
1. **Correctness / trust** — fix behavior the product already claims but does not do.
2. **Core UX impact** — how much it improves the everyday reading/using experience.
3. **Effort & dependencies** — cheaper, unblocking work ranked ahead of heavier features.
4. Discretionary/cosmetic features by impact-per-effort; non-code research last.

| Rank | # | Item | Rationale (one line) |
|---|---|---|---|
| 1 | 4 | Context awareness (send thread history) | Cheap fix (populate the `messages` array in `sendToApi`, `content.js:1270`) that also removes a **false claim** already shown to users (`content.js:829`). Highest value-per-effort. |
| 2 | 10 | Format AI output (Markdown + code + copy) | Core readability of the product; replacing `textContent` (`content.js:957`) with safe Markdown + syntax highlight + copy is high daily impact, moderate effort. |
| 3 | 1 | Config: new-chat-per-search vs. reuse window | Completes the core chat model; a stated requirement with default-behavior impact; medium effort (settings UI + stored flag consumed at `content.js:1114`). |
| 4 | 3 | Extension-context-invalidated alert | Reliability: prevents silent breakage after extension reload/update; low effort; small, self-contained guard. |
| 5 | 6 | Fully draggable panel | Clear UX win but non-blocking; medium effort to add smooth pointer-drag without jank. |
| 6 | 7 | Clone conversation into a new chat | Useful power feature; medium effort; benefits from the chat model being finalized (#1) first. |
| 7 | 8 | Export chat/message as PDF | Nice-to-have; medium effort (rendering pipeline / print; may need extra permissions). |
| 8 | 9 | Custom AI avatar via URL | Cosmetic personalization; lowest functional impact among features; low-medium effort. |
| 9 | 2 | Moats analysis / AI research | Non-code research deliverable; no engineering blocker; schedule outside the code backlog. |

---

## 5. Proposed state changes (before any change is applied)

**Issues to close:** _none._ No open issue meets the "fully and demonstrably implemented"
bar required for closure.

**Issues to leave OPEN (9):** #1 (partial — missing per-search config), #2 (research task),
#3, #4, #6, #7, #8, #9, #10 (each not implemented per Section 3).

**Issues to leave CLOSED (1):** #5 — requirement (right-side placement next to the answer)
is satisfied by the current fixed-position layout + `waitForElements` DOM adjustments,
even though solved differently than the original snippet. Not a regression; **not reopened.**

**Wrongly-closed / regressions to flag:** none.

> Conservative stance: where a requirement was only partially met (#1) or is a non-code
> deliverable (#2), the issue is left in its current state and the gap/uncertainty is
> documented above rather than acted upon.
