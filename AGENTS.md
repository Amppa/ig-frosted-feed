# Frosted Feed - Technical Architecture & AI Agent Guide (AGENTS.md)

> Repository guidance for human contributors and AI coding agents (AGENTS.md convention).
> Read this file first. Sections 1-3 describe the architecture and the constraints that are
> easy to violate; section 4 lists the project's conventions, invariants, and release policy.

## 1. Vision & Architectural Philosophy

This project aims to provide an elegant, distraction-free browsing experience on Instagram Web with three core engineering principles:

1. **Zero Layout Shift (Zero Stutter)**:
   - Traditional content blockers either remove `<article>` nodes or force height to `0px`. In Instagram's React virtualized feed (StyleX), this triggers placeholder skeleton re-rendering and severe scroll jumping.
   - **Solution**: We adopt a **Floating Zero-Shift Frosted Overlay Mask** (`position: absolute`). The original document flow remains 100% intact, preventing any layout thrashing or viewport hopping.
2. **Precision Boundary Detection**:
   - Instead of fragile DOM hierarchy traversing, the extension directly inspects post element bounding boxes (`getBoundingClientRect`) and synchronizes with `ResizeObserver`.
   - The mask always bounds the photo/video box exactly, leaving the creator header and action buttons accessible. Masking is media-only by design; there is no user-facing coverage mode.
   - `alignOverlay()` subtracts the article's `clientTop` / `clientLeft` from the media offsets, because `getBoundingClientRect()` returns the border box while absolutely-positioned children resolve against the padding box. Without this compensation the overlay drifts right/down by the article border width (visible on `/p/` permalink pages).
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
  - `options.html / css / js`: Standalone dark-themed settings panel for real-time visual customizability (Mask Color, 0-100% Opacity, Backdrop Blur, Console Log toggle).
- `src/popup/`:
  - `popup.html / css / js`: Clean master toggle and live masked items counter.

---

## 4. Repository Conventions (Contributors & AI Agents)

### 4.1 Build & Tooling

- There is **no build step, bundler, package manager, or automated test suite**. Every file is shipped to Chrome exactly as it sits in the repo.
- Do not introduce `package.json`, npm dependencies, ES module `import` / `export`, or any syntax that needs transpiling. Runtime files are classic scripts that share state through `globalThis`.
- `src/shared/defaults.js` is the single source of truth for settings. It must stay listed in `manifest.json` **before** `src/content/content.js`, and must be loaded via a `<script>` tag before `options.js` / `popup.js`:

```json
"js": ["src/shared/defaults.js", "src/content/content.js"]
```

### 4.2 Invariants That Must Be Kept In Sync

| Source of truth | Must stay in sync with | Why it matters |
| --- | --- | --- |
| `src/shared/defaults.js` (`maskOpacity`, `maskBlur`) | `--frosted-mask-bg` / `--frosted-mask-blur` in `src/content/content.css` | These CSS values prevent the first-paint flash; `content.css` is injected at `document_start`, before any JS runs, so it cannot read the JS defaults. |
| `manifest.json` `icons` / `action.default_icon` keys | Actual PNG pixel size and exact path casing in `icons/` | A size or casing mismatch makes Chrome fall back to a blurry scaled icon. |
| `README.md` project tree | The real repository layout | Renamed or added files (e.g. `AGENTS.md`, `design/`) must be reflected there. |

### 4.3 Verification Checklist (before every commit)

1. Parse the manifest: `Get-Content manifest.json -Raw | ConvertFrom-Json` (or any JSON linter). Nothing else validates it for you.
2. Confirm every path referenced by `manifest.json` exists, and that each icon size key equals the actual PNG width and height (16/32/48/128).
3. Load the folder in `chrome://extensions` -> **Load unpacked** (or **Reload** for an existing install), then exercise the popup, the options page, and a live `instagram.com` home feed with `debugLog` enabled.
4. `git status --short` must be clean after committing: no stray untracked artifacts left behind.

### 4.4 Versioning & Release Policy

- `manifest.json` `version` is the only version source. Bump it in a dedicated `chore: bump version to vX.Y.Z` commit before packaging, because the Chrome Web Store rejects a re-upload whose version is unchanged.
- Tag each release `vX.Y.Z` (existing tag: `v1.0.2`).
- Packaged archives (`frosted-feed-vX.Y.Z.zip`) are **not tracked in version control**. Keep built packages out of the repository tree and ship them as release assets / store uploads instead.

### 4.5 Commit Message Convention

Conventional Commits, imperative English subject, with optional body bullets separated by blank lines:

```
<type>(<scope>): <subject>

- <area>: <what changed and why>
```

- Types used in this repo: `feat`, `fix`, `style`, `refactor`, `docs`, `chore`.
- Scopes used in this repo: `content`, `popup`, `options`, `icons`, `design`.
- One logical change per commit; keep asset changes, code changes, and documentation changes in separate commits when they can be reviewed independently.

### 4.6 Branding Assets

- `icons/` ships `icon16/32/48/128.png`: a transparent rounded square with a pink-to-orange gradient and a white "FF" mark. All four sizes come from one artwork.
- `design/ig-ff.af` is the tracked Affinity Designer source for that artwork. Regenerate the PNGs from it rather than hand-editing exported PNGs.
- The popup / options `.logo-badge` recreates the same mark in CSS through `--accent-gradient`, so icon artwork and that CSS gradient should be revised together.

### 4.7 Constraints That Must Not Be Broken

- Never intercept or rewrite Instagram's network responses (see section 2): Instagram verifies internal tokens and fails to a blank screen.
- Never remove `<article>` nodes or collapse their height. Masking must remain a floating `position: absolute` overlay so the feed's document flow and Instagram's virtualized scroll stay intact.
- Masking applies to the Instagram home feed only. Explore, Reels, profile, and permalink routes must stay unmasked.
