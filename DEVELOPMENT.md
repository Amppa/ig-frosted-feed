# Development Guide

Navigation hub for **Frosted Feed**. Every rule and procedure lives in exactly one place; this page only points at it. The project-agnostic engineering contract (branching, commit granularity, verification) is in [AGENTS.md](AGENTS.md).

## Documentation Ownership

This table is the single source of truth for what each file governs. If a fact appears in two places, that is a bug in the table, not a second source.

| File | Owns |
| :--- | :--- |
| [AGENTS.md](AGENTS.md) | Engineering contract: workflow, task decomposition, commit granularity, verification discipline, autonomy boundaries. |
| **DEVELOPMENT.md** (this file) | Project guide: architecture, component map, conventions, invariants, verification checklist, versioning, branding, hard constraints. |
| [README.md](README.md) | User-facing overview, features, installation, permissions. |
| `manifest.json` | Extension configuration source of truth (version, icons, content scripts, permissions). |
| `src/shared/defaults.js` | Default settings source of truth. |

## Project Structure

| Path | Responsibility |
| :--- | :--- |
| `manifest.json` | MV3 config: icons, popup, options page, content scripts (`document_start`). |
| `src/shared/defaults.js` | Defaults (`globalThis.FROSTED_FEED_DEFAULTS`), loaded first in all extension contexts. |
| `src/content/` | ISOLATED world: detection, geometric alignment, batched storage, SPA route handling. |
| `src/popup/` | Popup UI: master toggle, masked counter, Following shortcut, Settings entry. |
| `src/options/` | Options UI: mask color / opacity / blur, console log toggle. |
| `icons/` | Extension icons `icon16/32/48/128.png`. |
| `design/` | Affinity Designer source for the icon artwork. |

## Start Here

| Task | Read |
| :--- | :--- |
| Change masking behavior or geometry | § Architecture and § Constraints That Must Not Be Broken |
| Touch popup / options markup, CSS, or settings | § Build & Tooling, § Invariants That Must Be Kept In Sync |
| Add or rename a file | § Invariants (README tree must match) |
| Run it in a browser | § Verification Checklist |
| Ship a release | § Versioning & Release Policy |
| Change icons or brand artwork | § Branding Assets |
| Understand *why* a rule is shaped this way | § Key Evolution & Abandoned Approaches |

## Architecture & Philosophy

Three core principles for a distraction-free Instagram Web experience:

1. **Zero Layout Shift (Zero Stutter)**:
   - Traditional blockers remove `<article>` nodes or force height to `0px`. In Instagram's React virtualized feed (StyleX), this triggers skeleton re-rendering and severe scroll jumping.
   - **Solution**: **Floating Zero-Shift Frosted Overlay Mask** (`position: absolute`). Document flow stays 100% intact.
2. **Precision Boundary Detection**:
   - Instead of fragile DOM hierarchy traversal, inspect post bounding boxes (`getBoundingClientRect`) and sync with `ResizeObserver`.
   - The mask bounds the photo/video box exactly, leaving creator header and action buttons accessible. Media-only by design; no user-facing coverage mode.
   - `alignOverlay()` subtracts the article's `clientTop` / `clientLeft` from media offsets, because `getBoundingClientRect()` returns the border box while absolutely-positioned children resolve against the padding box.
3. **Pass-Through Native Interactions**:
   - Revealing a masked post sets the overlay to `pointer-events: none`, so double-tap likes, carousel clicks, and video play/pause work normally, while a floating top-left pill button stays active for re-masking.

## Key Evolution & Abandoned Approaches

Abandoned: GraphQL Network Response Interception:
  *Attempted*: Modifying Instagram's internal fetch responses in the `MAIN` world to strip suggested items.
  *Outcome*: Instagram verifies internal token signatures and edge pagination structures. Altering items caused fatal errors and blank-screen crashes.
  *Decision*: No network tampering. Zero risk of breaking Instagram's React state.

Abandoned: Dynamic Height Truncation / Collapsing:
  *Attempted*: Shrinking suggested articles to 1px or hiding media divs.
  *Outcome*: Severe scroll bouncing and flickering skeletons.
  *Decision*: Absolute floating frosted overlays with CSS custom variables.

## Component Breakdown

- `src/content/`: `content.css` (overlay styling, injected at `document_start`), `content.js` (detection, alignment, batched storage).
- `src/shared/`: `defaults.js` (settings source of truth via `globalThis`, no modules/bundler).
- `src/options/`: `options.html / css / js` (Mask Color, 0-100% Opacity, Backdrop Blur, Console Log toggle).
- `src/popup/`: `popup.html / css / js` (master toggle, live masked-items counter).

## Build & Tooling

- There is **no build step, bundler, package manager, or automated test suite**. Every file ships to Chrome exactly as it sits in the repo.
- Do not introduce `package.json`, npm dependencies, ES module `import` / `export`, or any syntax that needs transpiling. Runtime files are classic scripts sharing state through `globalThis`.
- `src/shared/defaults.js` must stay listed in `manifest.json` **before** `src/content/content.js`, and must be loaded via a `<script>` tag before `options.js` / `popup.js`:

```json
"js": ["src/shared/defaults.js", "src/content/content.js"]
```

## Invariants That Must Be Kept In Sync

| Source of truth | Must stay in sync with | Why it matters |
| --- | --- | --- |
| `src/shared/defaults.js` (`maskOpacity`, `maskBlur`) | `--frosted-mask-bg` / `--frosted-mask-blur` in `src/content/content.css` | These CSS values prevent first-paint flash; `content.css` is injected at `document_start`, before any JS runs, so it cannot read the JS defaults. |
| `manifest.json` `icons` / `action.default_icon` keys | Actual PNG pixel size and exact path casing in `icons/` | A size or casing mismatch makes Chrome fall back to a blurry scaled icon. |
| `README.md` project tree | The real repository layout | Renamed or added files (e.g. `DEVELOPMENT.md`, `design/`, `src/shared/`) must be reflected there. |

## Verification Checklist (before every commit)

1. Parse the manifest: `Get-Content manifest.json -Raw | ConvertFrom-Json` (or any JSON linter). Nothing else validates it for you.
2. Confirm every path referenced by `manifest.json` exists, and that each icon size key equals the actual PNG width and height (16/32/48/128).
3. Load the folder in `chrome://extensions` -> **Load unpacked** (or **Reload** for an existing install), then exercise the popup, the options page, and a live `instagram.com` home feed with `debugLog` enabled.
4. `git status --short` must be clean after committing: no stray untracked artifacts left behind.

## Versioning & Release Policy

- `manifest.json` `version` is the only version source. Bump it in a dedicated `chore: bump version to vX.Y.Z` commit before packaging, because the Chrome Web Store rejects a re-upload whose version is unchanged.
- Tag each release `vX.Y.Z` (existing tag: `v1.0.2`).
- Packaged archives (`frosted-feed-vX.Y.Z.zip`) are **not tracked in version control**. Keep built packages out of the repository tree and ship them as release assets / store uploads instead.

## Commit Message Convention

Conventional Commits, imperative English subject, with optional body bullets separated by blank lines:

```
<type>(<scope>): <subject>

- <area>: <what changed and why>
```

- Types used in this repo: `feat`, `fix`, `style`, `refactor`, `docs`, `chore`.
- Scopes used in this repo: `content`, `popup`, `options`, `shared`, `icons`, `design`, `docs`.
- One logical change per commit; keep asset changes, code changes, and documentation changes in separate commits when they can be reviewed independently.

## Branding Assets

- `icons/` ships `icon16/32/48/128.png`: a transparent rounded square with a pink-to-orange gradient and a white "FF" mark. All four sizes come from one artwork.
- `design/` holds the tracked Affinity Designer source for that artwork. Regenerate the PNGs from it rather than hand-editing exported PNGs.
- The popup / options pages use the PNGs directly via `<img class="logo-badge">` (popup: `icon32.png` at 32px; options: `icon48.png` at 44px). The `--accent-gradient` in popup / options CSS is a separate UI accent and is no longer the logo itself.

## Constraints That Must Not Be Broken

- Never intercept or rewrite Instagram's network responses (see § Key Evolution): Instagram verifies internal tokens and fails to a blank screen.
- Never remove `<article>` nodes or collapse their height. Masking must remain a floating `position: absolute` overlay so the feed's document flow and Instagram's virtualized scroll stay intact.
- Masking applies to the Instagram home feed only. Explore, Reels, profile, and permalink routes must stay unmasked.

## Documentation Language

`README.md`, `DEVELOPMENT.md`, and code comments are English. Planning notes and walkthroughs may be written in Traditional Chinese (繁體中文).
