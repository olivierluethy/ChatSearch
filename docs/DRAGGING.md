# Dragging the ChatSearch panel

How the floating panel is positioned and dragged, why the first approach was
unreliable, and why the current one is the correct pattern for a Manifest V3
content-script overlay injected into a third-party page (Google Search).

## The earlier approach and why it fell short

The panel started life as a **centered, transform-positioned box**:

```css
position: fixed;
top: 57.8%;
left: 80%;
transform: translate(-50%, -50%);
height: 80vh;            /* outer container */
```

…with an **inner card that was only `height: 80%`** of that container.

Three things made this drag poorly:

1. **An artificial vertical limit.** The inner card filled just 80% of the outer
   container, so ~16vh of the container was invisible padding. Dragging clamped the
   *outer* box against the viewport, but the part the user sees is the *card*. The
   card therefore stopped ~16vh short of the bottom edge — it looked like the panel
   "refused" to go to the bottom of the page. The limit was a side effect of the
   layout, not an intentional boundary, which made it feel like a bug.

2. **Two positioning systems fighting.** `translate(-50%, -50%)` centering and
   explicit `left/top` pixel dragging express position in different coordinate
   spaces. Mixing them (translate still applied while you set pixel `left/top`)
   produces a jump on the first drag and off-by-half-size clamping math.

3. **Assumptions that don't hold.** It assumed the container box equals the visible
   panel, and that the viewport never changes size. Neither is true: the visible card
   ≠ container, and users resize/zoom the window, which left the panel stranded
   off-screen with no re-clamp.

## The current approach

A **fixed-position overlay with measured, viewport-clamped pixel positioning**:

- The panel is `position: fixed`, so its coordinates are relative to the **viewport**,
  not the page. Google can scroll, reflow, or mutate its DOM underneath — the panel
  stays put. Round 2 also makes the inner card `height: 100%`, so the visible card and
  the clamp box are the same rectangle.
- On the **first drag** we switch cleanly to pixel positioning: read the live
  `getBoundingClientRect()`, set `left/top` to those pixels, and set
  `transform: none`. From then on there is exactly one coordinate system.
- Every move clamps against the **measured size**:

  ```js
  const rect = container.getBoundingClientRect();
  const maxLeft = Math.max(0, window.innerWidth  - rect.width);
  const maxTop  = Math.max(0, window.innerHeight - rect.height);
  left = Math.min(Math.max(0, left), maxLeft);
  top  = Math.min(Math.max(0, top),  maxTop);
  ```

  With a **0px margin** on all four edges, so each edge of the panel can meet the
  matching viewport edge — including all the way to the bottom.

- Moves are applied inside a **`requestAnimationFrame`** callback (one paint per
  frame, no layout thrash), and the drag uses **pointer events with
  `setPointerCapture`** so tracking survives fast movement and the cursor leaving the
  handle. Only the sidebar header is a handle, and drags never start from its control
  cluster, so collapse/expand/settings keep working.
- The final position is **persisted** to `chrome.storage` and **restored** on load
  (with transitions suppressed so it doesn't animate in from the default spot), and a
  **`resize` listener re-clamps** a dragged panel so a smaller viewport can never
  strand it off-screen.

## Why this is the right pattern for an MV3 content-script overlay

- **`position: fixed` + high `z-index`** is the only positioning that is immune to the
  host page's scrolling and layout. An `absolute`/in-flow element would move with
  Google's DOM and could be pushed anywhere by their CSS.
- **Measured clamping** (not hardcoded vh/%) is resolution-, zoom-, and
  resize-independent — it always reflects the panel's real rendered size.
- **No dependency on host page CSS or scripts.** The content script runs in an
  isolated world; positioning math uses only `window.innerWidth/innerHeight` and the
  element's own rect, nothing from Google.
- **Pointer capture + rAF** give smooth, cross-page dragging without per-move layout
  cost — the standard high-quality drag loop.

In short: a viewport-anchored overlay that is dragged in one coordinate system,
clamped to its measured size, persisted, and re-clamped on resize. That is the
reliable pattern for a draggable widget living on someone else's page.
