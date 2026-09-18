// src/content/content.js
// Frosted Feed - Core Filter Engine with Boundary Detection & Pass-Through Interactions
(() => {
  'use strict';

  // --- 1. Configuration & State Management ---
  const DEFAULT_CONFIG = {
    enabled: true,
    maskSuggested: true,
    maskCoverage: 'mediaOnly', // 'mediaOnly' | 'entireCard'
    maskColor: '#000000',
    maskOpacity: 78,
    maskBlur: 4,
    maskShiftY: 0,
    debugLog: false,
    blockedCount: 0,
  };

  let currentConfig = { ...DEFAULT_CONFIG };

  const log = (...args) => {
    if (currentConfig.debugLog) {
      console.log('%c[Frosted Feed]', 'background: #18181c; color: #e1306c; border-radius: 3px; padding: 2px 6px; font-weight: bold;', ...args);
    }
  };

  // Convert hex color and opacity percentage to RGBA string
  function hexToRgba(hex, opacityPercent) {
    let c = (hex || '#000000').replace('#', '');
    if (c.length === 3) {
      c = c.split('').map((x) => x + x).join('');
    }
    const num = parseInt(c, 16);
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    const a = ((opacityPercent ?? 78) / 100).toFixed(2);
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }

  // Update dynamic CSS custom variables on the document root
  function applyDynamicCssVars(config) {
    const root = document.documentElement;
    if (!root) return;
    const rgba = hexToRgba(config.maskColor, config.maskOpacity);
    root.style.setProperty('--frosted-mask-bg', rgba);
    root.style.setProperty('--frosted-mask-blur', `${config.maskBlur ?? 4}px`);
    root.style.setProperty('--frosted-mask-shift-y', `${config.maskShiftY ?? 0}px`);
  }

  // --- 2. Batched Counter Storage ---
  let pendingCount = 0;
  let saveTimer = null;

  function commitBlockedCount() {
    if (pendingCount === 0) return;
    const toAdd = pendingCount;
    pendingCount = 0;

    chrome.storage.local.get({ blockedCount: 0 }, (res) => {
      const newCount = (res.blockedCount || 0) + toAdd;
      chrome.storage.local.set({ blockedCount: newCount });
    });
  }

  function incrementBlockedCount(amount = 1) {
    pendingCount += amount;
    if (!saveTimer) {
      saveTimer = setTimeout(() => {
        commitBlockedCount();
        saveTimer = null;
      }, 500);
    }
  }

  // --- 3. Post & Media Detection ---
  const SUGGESTED_PHRASES = [
    '為你推薦',
    '推薦給你',
    '为你推荐',
    'suggested for you',
    'suggestions for you',
    'sponsored',
    '贊助',
    '赞助',
  ];

  function containsAnyPhrase(el, phrases) {
    if (!el) return false;
    const text = (el.innerText || el.textContent || '').trim().toLowerCase();
    return phrases.some((p) => text.includes(p));
  }

  function isDangerousContainer(el) {
    if (!el) return true;
    const tag = el.tagName;
    if (tag === 'BODY' || tag === 'HTML' || tag === 'MAIN' || tag === 'SECTION' || tag === 'NAV') {
      return true;
    }
    return el.querySelectorAll('article').length > 1;
  }

  // Locate the primary image or video of the post
  function findPostPic(post) {
    const header = post.querySelector('header');

    // 1. Check for video
    const video = post.querySelector('video');
    if (video && (video.offsetHeight > 100 || video.videoWidth > 0)) {
      return video;
    }

    // 2. Check for images outside header (excluding avatars)
    const allImgs = Array.from(post.querySelectorAll('img'));
    const candidateImgs = allImgs.filter((img) => {
      if (header && header.contains(img)) return false;
      const w = img.offsetWidth || img.naturalWidth || 0;
      const h = img.offsetHeight || img.naturalHeight || 0;
      return !(w > 0 && w < 80 && h > 0 && h < 80);
    });

    if (candidateImgs.length === 0) {
      return video || null;
    }

    // Sort by rendered or natural visual area descending
    candidateImgs.sort((a, b) => {
      const areaA = (a.offsetWidth || a.naturalWidth || 1) * (a.offsetHeight || a.naturalHeight || 1);
      const areaB = (b.offsetWidth || b.naturalWidth || 1) * (b.offsetHeight || b.naturalHeight || 1);
      return areaB - areaA;
    });

    return candidateImgs[0];
  }

  // --- 4. Overlay Lifecycle & Positioning ---

  // Align the overlay precisely to the pic boundary or the entire card
  function alignOverlay(overlay, post, pic) {
    if (!overlay || !post) return;

    if (currentConfig.maskCoverage === 'entireCard' || !pic) {
      // Entire Card: compensate for margin collapse / header offset
      const postRect = post.getBoundingClientRect();
      const header = post.querySelector('header') || post.firstElementChild;
      let topOffset = 0;
      let totalHeight = postRect.height;

      if (header) {
        const headerRect = header.getBoundingClientRect();
        if (headerRect.height > 0) {
          topOffset = headerRect.top - postRect.top;
          totalHeight = Math.max(postRect.height, postRect.bottom - headerRect.top);
        }
      }

      overlay.style.top = `${topOffset}px`;
      overlay.style.left = '0px';
      overlay.style.width = '100%';
      overlay.style.height = `${totalHeight}px`;
      overlay.style.borderRadius = '8px';
      return;
    }

    // Media Only: detect pic bounds relative to post
    const postRect = post.getBoundingClientRect();
    const picRect = pic.getBoundingClientRect();

    if (picRect.width > 0 && picRect.height > 0) {
      const topOffset = Math.max(0, picRect.top - postRect.top);
      const leftOffset = Math.max(0, picRect.left - postRect.left);

      overlay.style.top = `${topOffset}px`;
      overlay.style.left = `${leftOffset}px`;
      overlay.style.width = `${picRect.width}px`;
      overlay.style.height = `${picRect.height}px`;
      overlay.style.borderRadius = '4px';
    } else {
      pic.addEventListener('load', () => alignOverlay(overlay, post, pic), { once: true });
    }
  }

  // Observe element resizing to synchronize overlay bounds
  const picObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const el = entry.target;
      const post = el.closest('article');
      if (post) {
        const overlay = post.querySelector('.frosted-feed-overlay');
        const pic = findPostPic(post);
        if (overlay) {
          alignOverlay(overlay, post, pic);
        }
      }
    }
  });

  // Mask a suggested/sponsored post with floating overlay and interactive badge
  function maskSuggestedPost(post, reason) {
    if (!post || isDangerousContainer(post)) return;

    post.dataset.frostedFeedMasked = 'true';

    const pic = findPostPic(post);
    if (pic) picObserver.observe(pic);

    const header = post.querySelector('header');
    if (header) picObserver.observe(header);

    let overlay = post.querySelector('.frosted-feed-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'frosted-feed-overlay';
      overlay.innerHTML = '<div class="frosted-feed-badge">Show Media</div>';

      const badge = overlay.querySelector('.frosted-feed-badge');

      function setRevealed(revealed) {
        if (revealed) {
          overlay.classList.add('is-revealed');
          if (badge) badge.textContent = 'Mask Media';
        } else {
          overlay.classList.remove('is-revealed');
          if (badge) badge.textContent = 'Show Media';
        }
      }

      // Clicking overlay while masked reveals original photo
      overlay.addEventListener('click', (e) => {
        if (!overlay.classList.contains('is-revealed')) {
          e.stopPropagation();
          e.preventDefault();
          setRevealed(true);
        }
      });

      // Clicking the badge toggles between reveal and mask
      if (badge) {
        badge.addEventListener('click', (e) => {
          e.stopPropagation();
          e.preventDefault();
          const isCurrentlyRevealed = overlay.classList.contains('is-revealed');
          setRevealed(!isCurrentlyRevealed);
        });
      }

      post.appendChild(overlay);
      incrementBlockedCount(1);
    }

    alignOverlay(overlay, post, pic);
    log(`🛡️ Masked [${currentConfig.maskCoverage}]: ${reason}`, { post, pic });
  }

  // Remove mask from post
  function unmaskPost(post) {
    if (!post) return;
    delete post.dataset.frostedFeedMasked;
    const overlay = post.querySelector('.frosted-feed-overlay');
    if (overlay) overlay.remove();
  }

  // --- 5. DOM Filter Pipeline & Observer ---
  function filterDOM(root = document) {
    const isMaskActive = currentConfig.enabled && currentConfig.maskSuggested;

    const articles = root.querySelectorAll ? root.querySelectorAll('article') : [];
    articles.forEach((post) => {
      let isSuggested = false;
      let reason = '';

      const header = post.querySelector('header') || post;
      if (containsAnyPhrase(header, SUGGESTED_PHRASES)) {
        isSuggested = true;
        reason = 'Suggested / Sponsored Post (Header Phrase)';
      } else {
        const buttons = header.querySelectorAll('button, [role="button"], span');
        for (const btn of buttons) {
          const btnText = (btn.innerText || '').trim().toLowerCase();
          if (btnText === '追蹤' || btnText === '关注' || btnText === 'follow') {
            isSuggested = true;
            reason = 'Suggested Post (Follow CTA)';
            break;
          }
        }
      }

      if (isSuggested) {
        if (isMaskActive) {
          maskSuggestedPost(post, reason);
        } else {
          unmaskPost(post);
        }
      } else {
        unmaskPost(post);
      }
    });

    if (!isMaskActive) {
      document.querySelectorAll('.frosted-feed-overlay').forEach((el) => el.remove());
      document.querySelectorAll('article[data-frosted-feed-masked]').forEach((el) => delete el.dataset.frostedFeedMasked);
    }
  }

  // Storage change listener
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local') {
      const functionalKeys = [
        'enabled',
        'maskSuggested',
        'maskCoverage',
        'maskColor',
        'maskOpacity',
        'maskBlur',
        'maskShiftY',
        'debugLog',
      ];
      const hasFunctionalChange = functionalKeys.some((k) => k in changes);

      if (hasFunctionalChange) {
        chrome.storage.local.get(DEFAULT_CONFIG, (updated) => {
          currentConfig = { ...updated };
          applyDynamicCssVars(updated);
          filterDOM();
        });
      }
    }
  });

  // MutationObserver for infinite scroll
  let debounceTimer = null;
  const observer = new MutationObserver((mutations) => {
    let hasNewArticles = false;
    for (const m of mutations) {
      if (m.addedNodes && m.addedNodes.length > 0) {
        for (const n of m.addedNodes) {
          if (n instanceof Element) {
            if (n.tagName === 'ARTICLE' || n.querySelector('article')) {
              hasNewArticles = true;
              break;
            }
          }
        }
      }
      if (hasNewArticles) break;
    }

    if (hasNewArticles) {
      if (debounceTimer) return;
      debounceTimer = setTimeout(() => {
        filterDOM();
        debounceTimer = null;
      }, 50);
    }
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });

  // Window resize handler
  window.addEventListener('resize', () => {
    document.querySelectorAll('article[data-frosted-feed-masked="true"]').forEach((post) => {
      const overlay = post.querySelector('.frosted-feed-overlay');
      const pic = findPostPic(post);
      if (overlay) {
        alignOverlay(overlay, post, pic);
      }
    });
  });

  // Initial startup
  chrome.storage.local.get(DEFAULT_CONFIG, (stored) => {
    currentConfig = { ...stored };
    applyDynamicCssVars(stored);
    filterDOM();
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => filterDOM(), { once: true });
  }
  window.addEventListener('load', () => filterDOM(), { once: true });

  log('🚀 Frosted Feed activated with decoupled CSS and boundary detection.');
})();
