// src/popup/popup.js
document.addEventListener('DOMContentLoaded', () => {
  const enabledToggle = document.getElementById('enabled');
  const blockedCountEl = document.getElementById('blockedCount');
  const resetBtn = document.getElementById('resetBtn');
  const openOptionsBtn = document.getElementById('openOptionsBtn');
  const openFollowingBtn = document.getElementById('openFollowingBtn');

  function updateCounter(count) {
    if (blockedCountEl) {
      blockedCountEl.textContent = (count || 0).toLocaleString();
    }
  }

  // Load stored settings and count
  chrome.storage.local.get({ enabled: true, blockedCount: 0 }, (settings) => {
    if (enabledToggle) {
      enabledToggle.checked = settings.enabled;
    }
    updateCounter(settings.blockedCount);
  });

  // Listen for storage changes in real-time
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local') {
      if (changes.blockedCount) {
        updateCounter(changes.blockedCount.newValue);
      }
      if (changes.enabled && enabledToggle) {
        enabledToggle.checked = changes.enabled.newValue;
      }
    }
  });

  // Toggle master switch
  if (enabledToggle) {
    enabledToggle.addEventListener('change', () => {
      chrome.storage.local.set({ enabled: enabledToggle.checked });
    });
  }

  // Reset counter button
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      chrome.storage.local.set({ blockedCount: 0 }, () => {
        updateCounter(0);
      });
    });
  }

  // Open Options page
  if (openOptionsBtn) {
    openOptionsBtn.addEventListener('click', () => {
      chrome.runtime.openOptionsPage();
    });
  }

  // Open Instagram's "Following" feed in a new tab
  if (openFollowingBtn) {
    openFollowingBtn.addEventListener('click', () => {
      chrome.tabs.create({ url: 'https://www.instagram.com/?variant=following' });
    });
  }
});
