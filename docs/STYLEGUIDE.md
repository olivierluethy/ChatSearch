# ChatSearch — Visual Style Guide

**Status:** Source of truth for all UI work. Extracted verbatim from the shipped
`content.js` (commit `c64b780`). Every new feature must match these tokens exactly.
The light palette in §1–§9 is the baseline; §10 adds the Round 2 dark-mode tokens
(the light values here are unchanged).

> This document records what the extension *already looks like*. When adding features,
> reuse these tokens. Do not restyle existing colours or typography.

---

## 1. Colour tokens

### Surfaces
| Token | Value | Where used |
|---|---|---|
| App container background | `linear-gradient(145deg, #ffffff, #f8fafc)` | Outer chat panel |
| Main content background | `#ffffff` | Chat area, threads list card |
| Sidebar background | `#f1f5f9` | Left sidebar |
| Chat display background | `#f8fafc` | Message scroll area |
| Border / divider | `#e2e8f0` | Sidebar right border |
| Row divider | `#e5e7eb` | Thread list item bottom border |

### Text
| Token | Value | Where used |
|---|---|---|
| Text primary | `#1e293b` | Headings, body, message text |
| Text muted | `#64748b` | Timestamps, thread meta, tips |
| Text on primary | `#ffffff` | Text on blue / red / green buttons |

### Brand / accent
| Token | Value | Where used |
|---|---|---|
| Primary blue | `#2563eb` | New Chat button, user bubble, input focus |
| Primary blue (hover) | `#1e40af` | New Chat hover |
| Focus ring | `rgba(37, 99, 235, 0.2)` | Input focus glow (`0 0 0 3px`) |
| Active thread bg | `#e3f2fd` | Selected thread row |
| Active thread hover | `#bfdbfe` | Selected thread row hover |
| AI accent (icon) | `#1565C0` on `#E3F2FD` | Default AI avatar SVG |

### Semantic
| Token | Value | Where used |
|---|---|---|
| Danger red | `#dc2626` | Clear All button |
| Danger red (hover) | `#b91c1c` | Clear All hover |
| Send green | `#25D366` | Send button |
| Neutral button bg | `#e5e7eb` | Report Bug / Help / Privacy / Feature Request; AI bubble |
| Neutral button border | `#d1d5db` | Secondary buttons, inputs |
| Neutral button hover | `#d1d5db` | Secondary button hover |

### Scrollbar
| Token | Value |
|---|---|
| Thumb | `#94a3b8` |
| Track | `#e2e8f0` |

### Overlays & shadows
| Token | Value | Where used |
|---|---|---|
| Panel glow | `0px 0px 36px 0px rgba(255,255,255,0.6)` | Outer container |
| Inset shadow | `inset 0 2px 4px rgba(0,0,0,0.05)` | Threads card, chat display |
| Modal overlay | `rgba(0,0,0,0.6)` | Modal backdrop |
| Modal shadow | `0 4px 20px rgba(0,0,0,0.15)` | Modal card |

---

## 2. Typography

**Font family (single stack, everywhere):**
```
-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif
```

**Monospace (new — for code blocks, #10):** use the platform mono stack so it reads as
native to the OS, consistent with the sans stack above:
```
ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace
```

| Role | Size | Weight | Line height | Colour |
|---|---|---|---|---|
| Section heading (`Talk to AI`, modal `h2`) | `1.5rem` | 600 | — | `#1e293b` |
| Sidebar heading (`Chat Threads`) | `1.25rem` | 600 | — | `#1e293b` |
| Thread name | `0.95rem` | 500 | — | `#1e293b` |
| Message text / body | `0.95rem` | 400 | 1.5 | `#1e293b` (AI) / `#ffffff` (user) |
| Primary button | `0.95rem` | 500 | — | `#ffffff` |
| Secondary button | `0.85rem` | 500 | — | `#1e293b` |
| Input | `1rem` | 400 | — | `#1e293b` |
| Thread meta / timestamp / tip | `0.75rem` | 400 | — | `#64748b` |

---

## 3. Spacing scale

Observed values (px): **4, 6, 8, 12, 16, 24**. Reuse these; do not introduce new steps.

| Element | Padding | Gap |
|---|---|---|
| Sidebar | `24px` (collapsed `16px 8px`) | `16px` |
| Main content | `24px` | `16px` |
| Threads card | `12px` | — |
| Thread row | `12px` | `8px` |
| Message bubble | `12px 16px` | — |
| Input | `12px 16px` | — |
| Primary button | `10px` | `8px` |
| Secondary button | `8px` | `6px` |
| Send button | `12px 20px` | — |
| Input ↔ Send row | — | `8px` |

---

## 4. Radii

| Element | Radius |
|---|---|
| Outer container | `16px` |
| Modal card | `12px` |
| Threads card / chat display | `10px` |
| Buttons, inputs | `8px` |
| Toggle (burger) button | `6px` |
| User bubble | `12px 12px 0 12px` |
| AI bubble | `12px 12px 12px 0` |

---

## 5. Borders

- Standard border: `1px solid #d1d5db` (buttons, inputs).
- Sidebar divider: `1px solid #e2e8f0`.
- Row divider: `1px solid #e5e7eb`.

---

## 6. Interactive states

- **Transitions:** `0.2s ease` for colour/background; `0.3s ease` for layout/opacity
  (sidebar collapse, message/thread reveal, modal `fadeIn`).
- **Primary button hover:** `#2563eb → #1e40af`.
- **Danger button hover:** `#dc2626 → #b91c1c`.
- **Secondary button hover:** `#e5e7eb → #d1d5db`.
- **Input focus:** border `#2563eb`, box-shadow `0 0 0 3px rgba(37,99,235,0.2)`.
- **Thread row hover:** active `#e3f2fd → #bfdbfe`; inactive `transparent → #f1f5f9`.
- **Icon button hover (edit/delete):** colour `#64748b → #2563eb` (edit) / `#dc2626` (delete).

### Animations (keyframes already defined)
- `slideIn` — thread rows (translateX -20→0, opacity 0→1, `0.3s ease`, staggered `index*0.1s`).
- `slideInMessage` — messages (translateY -20→0).
- `fadeIn` — modals (scale 0.95→1).
- `dots` — typing indicator.

---

## 7. Layout

- **Panel:** `position: fixed; top: 57.8%; left: 80%; transform: translate(-50%,-50%);`
  `z-index: 1000; max-width: 1200px; height: 80vh; max-height: 900px;` — right-of-viewport
  placement (Issue #5, do not disturb).
- **Structure:** flex row → `#sidebar` (`260px`, collapsed `60px`) + `#main-content` (`flex: 1`).
- **Scroll areas:** `#threads-container` and `#chat-display` use `overflow-y: auto` with the
  thin scrollbar tokens above.

---

## 8. Component patterns

- **Buttons:** three tiers — primary (blue, filled), danger (red, filled), secondary
  (neutral `#e5e7eb`, bordered). All `border-radius: 8px`, icon + label, `gap: 6–8px`.
- **Modals:** full-viewport overlay `rgba(0,0,0,0.6)` + centred white card (`max-width: 500px`,
  radius `12px`, `fadeIn`) + a single primary "Close" button.
- **Chat bubbles:** user = blue on right, tail bottom-right; AI = neutral grey on left,
  tail bottom-left; avatar beside bubble; timestamp `0.75rem` muted below.
- **Sidebar rows:** thread name + meta line (`Created … | Messages: n`) + edit/delete icon buttons.

---

## 9. Derived tokens for new features

These are **derived from the palette above** so new UI (code highlighting, settings,
banners, PDF export) stays on-brand. They introduce no new hues beyond the existing slate/blue set.

### Code block (Issue #10)
| Token | Value |
|---|---|
| Code surface | `#f8fafc` (matches chat display) |
| Code border | `1px solid #e2e8f0` |
| Code radius | `8px` |
| Inline code bg | `#e5e7eb` |
| Code text | `#1e293b` |
| Mono font | platform mono stack (§2) |

**Syntax highlight theme (light, slate/blue family):**
| Scope | Colour |
|---|---|
| Keyword / built-in | `#2563eb` |
| String / added | `#0f766e` |
| Number / literal / constant | `#b45309` |
| Comment | `#64748b` (italic) |
| Function / title | `#1e40af` |
| Attr / variable | `#1e293b` |
| Meta / tag | `#7c3aed` |

### Copy button (Issue #10)
Secondary style: `#e5e7eb` bg, `#1e293b` text, radius `6px`, `0.75rem`; hover `#d1d5db`;
transient "Copied!" label on success.

### Settings panel & banner (Issues #1, #3, #9)
- Panel reuses the modal pattern (§8) exactly.
- Toggle track: off `#d1d5db`, on `#2563eb`, white knob; `0.2s ease`.
- Context-invalidated banner: neutral card `#f1f5f9`, `1px solid #e2e8f0`, text `#1e293b`,
  primary "Reload" button (blue). No alarming red — it is informational.

### Drag handle (Issue #6)
Sidebar header acts as the handle; `cursor: grab` (→ `grabbing` while dragging). No new colours.

---

## 10. Dark mode (Round 2)

The widget is themeable via a `data-theme` attribute on the root `#custom-ai-box`
(`light` | `dark` | `auto`). `auto` follows `prefers-color-scheme`. The **light
palette and typography in §1–§9 are unchanged** — dark mode only *adds* the token
values below. Colours are delivered as CSS custom properties defined on the root and
overridden under `[data-theme="dark"]` and `@media (prefers-color-scheme: dark)
[data-theme="auto"]`.

### Token map (light → dark)

| Token | Role | Light | Dark |
|---|---|---|---|
| `--cs-grad-a` / `--cs-grad-b` | Panel gradient | `#ffffff` / `#f8fafc` | `#1f2937` / `#111827` |
| `--cs-surface` | Main content, threads card, modal, inputs | `#ffffff` | `#111827` |
| `--cs-sidebar` | Sidebar background | `#f1f5f9` | `#0f172a` |
| `--cs-chat-bg` | Chat display, code surface (`#f8fafc`) | `#f8fafc` | `#0f172a` |
| `--cs-border` | Dividers, borders (`#e2e8f0`) | `#e2e8f0` | `#334155` |
| `--cs-border-strong` | Input/secondary borders (`#d1d5db`) | `#d1d5db` | `#475569` |
| `--cs-neutral` | Secondary buttons, AI bubble (`#e5e7eb`) | `#e5e7eb` | `#334155` |
| `--cs-neutral-hover` | Secondary hover (`#d1d5db`) | `#d1d5db` | `#475569` |
| `--cs-text` | Primary text (`#1e293b`) | `#1e293b` | `#e2e8f0` |
| `--cs-text-muted` | Muted text/icons (`#64748b`) | `#64748b` | `#94a3b8` |
| `--cs-text-invert` | Text on coloured buttons | `#ffffff` | `#ffffff` |
| `--cs-primary` | Primary blue (`#2563eb`) | `#2563eb` | `#3b82f6` |
| `--cs-primary-hover` | Primary hover (`#1e40af`) | `#1e40af` | `#2563eb` |
| `--cs-active` | Active thread (`#e3f2fd`) | `#e3f2fd` | `#1e3a5f` |
| `--cs-active-hover` | Active thread hover (`#bfdbfe`) | `#bfdbfe` | `#274b7a` |
| `--cs-hover` | Inactive row hover (`#f1f5f9`) | `#f1f5f9` | `#1e293b` |
| `--cs-danger` | Danger red (`#dc2626`) | `#dc2626` | `#ef4444` |
| `--cs-danger-hover` | Danger hover (`#b91c1c`) | `#b91c1c` | `#dc2626` |
| `--cs-send` | Send green (`#25D366`) | `#25D366` | `#22c55e` |
| `--cs-scroll-thumb` | Scrollbar thumb (`#94a3b8`) | `#94a3b8` | `#475569` |
| `--cs-scroll-track` | Scrollbar track (`#e2e8f0`) | `#e2e8f0` | `#1e293b` |
| `--cs-glow` | Panel outer shadow | `rgba(255,255,255,0.6)` | `rgba(0,0,0,0.55)` |

### Syntax highlight (light → dark)

| Scope | Light | Dark |
|---|---|---|
| keyword / built-in | `#2563eb` | `#60a5fa` |
| string / added | `#0f766e` | `#34d399` |
| number / literal | `#b45309` | `#fbbf24` |
| comment | `#64748b` | `#94a3b8` |
| function / title | `#1e40af` | `#818cf8` |
| type / meta / tag | `#7c3aed` | `#c084fc` |
| inline code bg | `#e5e7eb` | `#334155` |

### Interactive states (Round 2 additions)

- **Thread action icons** (clone / rename / delete): resting `--cs-text-muted`; on hover
  the icon gains a circular hit background `--cs-hover` and its colour shifts to
  `--cs-primary` (clone/rename) or `--cs-danger` (delete). Hit target ≥ 28×28px.
- **Thread card hover** raises the whole row to `--cs-hover` (or `--cs-active-hover`
  when active) and reveals the action row at full opacity.
- **Search input**: same focus treatment as the message input (border `--cs-primary`,
  ring `rgba(37,99,235,0.2)`).
- **Resize handles**: 6px hit area; resting transparent, hover shows `--cs-primary` at
  40% opacity; `cursor: col-resize` (column handle) / `nwse-resize` (corner handle).
- **Search match highlight**: `<mark>` uses `--cs-active` background with `--cs-text`.

### Date buckets (thread grouping)

Group headers use `0.7rem`, weight 600, `--cs-text-muted`, uppercase, letter-spacing
`0.04em`. Buckets, in order: **Today**, **Yesterday**, **Previous 7 days**,
**Previous 30 days**, then **month-year** (e.g. "March 2026") for anything older,
keyed on each thread's last-activity time.
