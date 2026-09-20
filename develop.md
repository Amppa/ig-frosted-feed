# Frosted Feed - Technical Architecture & Design Document (develop.md)

## 1. Vision & Architectural Philosophy

This project aims to provide an elegant, distraction-free browsing experience on Instagram Web with three core engineering principles:

1. **Zero Layout Shift (Zero Stutter)**:
   - Traditional content blockers either remove `<article>` nodes or force height to `0px`. In Instagram's React virtualized feed (StyleX), this triggers placeholder skeleton re-rendering and severe scroll jumping.
   - **Solution**: We adopt a **Floating Zero-Shift Frosted Overlay Mask (`position: absolute`)***. The original document flow remains 100% intact, preventing any layout thrashing or viewport hopping.
2. **Precision Boundary Detection**:
   - Instead of fragile DOM hierarchy traversing, the extension directly inspects post element bounding boxes (`getBoundingClientRect`) and synchronizes with `ResizeObserver`.
   - In **Media Only** mode, the mask perfectly bounds the photo/video, leaving the creator header and action buttons accessible.
   - In **Entire Card** mode, the mask automatically compensates for Instagram's top margin collapse (~15px) to achieve seamless edge-to-edge coverage.
3. **Pass-Through Native Interactions**:
   - Revealing the masked post sets the overlay to `pointer-events: none`, allowing double-tap likes, carousel clicks, and video play/pause to function normally, while keeping a floating top-left pill button active for re-masking.

---

## 2. Key Evolution & Abandoned Approaches (Post-Mortem)

Abandoned: GraphQL Network Response Interception:
  *Attempted*: Modifying Instagram's internal fetch responses in the `MAIN` world to strip suggested items.
  *Outcome*: Instagram's client-side React code verifies internal token signatures and edge pagination structures. Altering items caused client-side fatal errors and blank screen crashes.
  *Decision*: Completely removed network tampering. Zero risk of breaking Instagram's React state.

Abandoned: Dynamic Height Truncation / Collapsing:
  *Attempted*: Shrinking suggested articles to 1px or hiding media divs.
  *Outcome*: Triggered severe scroll bouncing and flickering skeletons.
  *Decision*: Adopted absolute floating frosted overlays with CSS custom variables.

---

## 3. Component Breakdown

- `src/content/`:
  - `content.css`: Decoupled overlay and badge styling, natively injected by Chrome at `document_start`.
  - `content.js`: Pure detection, geometric alignment, and batched storage logic.
- `src/options/`:
  - `options.html / css / js`: Standalone dark-themed settings panel for real-time visual customizability (Mask Color, 0-100% Opacity, Blur, Coverage Mode).
- `src/popup/`:
  - `popup.html / css / js`: Clean master toggle and live masked items counter.
