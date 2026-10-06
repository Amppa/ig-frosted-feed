# Development Guide

Project notes for **Frosted Feed** — only what the code does not say itself.
The project-agnostic engineering contract (branching, commit granularity,
verification) is in [AGENTS.md](AGENTS.md).

## Documentation Ownership

This table is the single source of truth for what each file governs. If a fact
appears in two places, that is a bug in the table, not a second source.
Anything a file already says for itself is not repeated below.

| File | Owns |
| :--- | :--- |
| [AGENTS.md](AGENTS.md) | Engineering contract: workflow, commit granularity, verification discipline. |
| **DEVELOPMENT.md** (this file) | Project goal, overlay rationale, abandoned approaches, release note. |
| [README.md](README.md) | User-facing overview, features, installation, project tree. |
| `manifest.json` | Extension configuration (version, icons, content scripts, permissions). |
| `src/shared/defaults.js` | Default settings, including the `content.css` first-paint mirror note. |
| `src/content/content.js` comments | Detection phrases, media-box geometry, observer and re-align timings. |

## Why This Exists

Instagram Web mixes suggested and sponsored posts into the home feed with no
native opt-out. Frosted Feed masks only the **media box** of those posts,
leaving the creator header and action buttons usable, so the feed stays
readable without breaking Instagram's layout or interactions.

Masking applies to the home feed only as a product decision, not just a code
branch: Explore, Reels, profile, and permalink pages are intentionally
discoverable, so masking there would be false positives.

## Why an Overlay, Not Removal

Removing `<article>` nodes or collapsing their height triggers Instagram's
React virtualized feed to re-render skeletons and jump the scroll position.
The extension instead appends a floating `position: absolute` overlay inside
the article, so document flow stays intact.

Two earlier approaches failed and must not be retried:

- **Rewriting GraphQL / fetch responses**: Instagram verifies internal token
  signatures and pagination structures; tampering crashes React to a blank
  screen.
- **Shrinking articles to 1px or hiding media divs**: causes severe scroll
  bouncing and flickering skeletons.

## Pipeline

Detect header signals on the home feed → locate the media box → pin the
absolute overlay; observers and the SPA route poll keep it aligned across
async layout shifts and navigation. Thresholds, rect math, and timings live
in `src/content/content.js` comments — read them there, do not duplicate them
here.

## Release Note

`manifest.json` `version` is the only version source; bump it before
packaging because the Chrome Web Store rejects re-uploads with an unchanged
version. Packaged zips are release assets, never tracked in git.

## Documentation Language

`README.md`, `DEVELOPMENT.md`, and code comments are English. Planning notes
and walkthroughs may be written in Traditional Chinese (繁體中文).
