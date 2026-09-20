// src/shared/defaults.js
// Single source of truth for Frosted Feed default settings.
// Loaded before content/options/popup scripts (see manifest.json & HTML script tags),
// exposing a shared global constant — no modules/bundler needed.
//
// NOTE: The initial flash-prevention value in src/content/content.css
// (--frosted-mask-bg) mirrors maskOpacity below and must be kept in sync manually,
// because Chrome injects content.css at document_start before any JS runs.
// Uses globalThis (not const) so repeated injection into the same page never throws.
globalThis.FROSTED_FEED_DEFAULTS = {
  enabled: true,
  maskSuggested: true,
  maskCoverage: 'mediaOnly', // 'mediaOnly' | 'entireCard'
  maskColor: '#000000',
  maskOpacity: 80, // 0 = fully transparent, 100 = solid
  maskBlur: 4, // px, backdrop-filter blur radius
  debugLog: false,
  blockedCount: 0,
};
