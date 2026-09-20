// src/options/options.js

// Guard: if the extension was reloaded while this page is open, chrome APIs
// become unavailable. Bail out silently.
function isExtContextValid() {
  return typeof chrome !== 'undefined' && !!chrome.storage && !!chrome.runtime?.id;
}

document.addEventListener('DOMContentLoaded', () => {
  if (!isExtContextValid()) return;
  // Defaults come from src/shared/defaults.js (loaded via options.html script tag).
  const DEFAULT_SETTINGS = { ...FROSTED_FEED_DEFAULTS };

  // UI Elements
  const maskColorInput = document.getElementById('maskColor');
  const maskColorCode = document.getElementById('maskColorCode');
  const maskOpacityInput = document.getElementById('maskOpacity');
  const maskOpacityVal = document.getElementById('maskOpacityVal');
  const maskBlurInput = document.getElementById('maskBlur');
  const maskBlurVal = document.getElementById('maskBlurVal');
  const debugLogInput = document.getElementById('debugLog');
  const resetBtn = document.getElementById('resetDefaultsBtn');

  // Update UI values
  function applyToUI(settings) {
    maskColorInput.value = settings.maskColor;
    maskColorCode.textContent = settings.maskColor.toUpperCase();

    maskOpacityInput.value = settings.maskOpacity;
    maskOpacityVal.textContent = `${settings.maskOpacity}%`;

    maskBlurInput.value = settings.maskBlur;
    maskBlurVal.textContent = `${settings.maskBlur}px`;

    debugLogInput.checked = settings.debugLog;
  }

  // Load saved settings
  chrome.storage.local.get(DEFAULT_SETTINGS, (stored) => {
    applyToUI(stored);
  });

  // Save specific field change
  function saveChange(key, value) {
    chrome.storage.local.set({ [key]: value });
  }

  // Event Listeners for Live adjustments
  maskColorInput.addEventListener('input', (e) => {
    const val = e.target.value;
    maskColorCode.textContent = val.toUpperCase();
    saveChange('maskColor', val);
  });

  maskOpacityInput.addEventListener('input', (e) => {
    const val = parseInt(e.target.value, 10);
    maskOpacityVal.textContent = `${val}%`;
    saveChange('maskOpacity', val);
  });

  maskBlurInput.addEventListener('input', (e) => {
    const val = parseInt(e.target.value, 10);
    maskBlurVal.textContent = `${val}px`;
    saveChange('maskBlur', val);
  });

  debugLogInput.addEventListener('change', (e) => {
    saveChange('debugLog', e.target.checked);
  });

  // Reset Button
  resetBtn.addEventListener('click', () => {
    chrome.storage.local.set(DEFAULT_SETTINGS, () => {
      applyToUI(DEFAULT_SETTINGS);
    });
  });
});
