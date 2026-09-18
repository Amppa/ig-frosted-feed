// src/options/options.js
document.addEventListener('DOMContentLoaded', () => {
  const DEFAULT_SETTINGS = {
    maskCoverage: 'mediaOnly', // 'mediaOnly' | 'entireCard'
    maskColor: '#000000',
    maskOpacity: 78,
    maskBlur: 4,
    maskShiftY: 0,
    debugLog: false,
  };

  // UI Elements
  const covMediaOnlyRadio = document.getElementById('covMediaOnly');
  const covEntireCardRadio = document.getElementById('covEntireCard');
  const maskColorInput = document.getElementById('maskColor');
  const maskColorCode = document.getElementById('maskColorCode');
  const maskOpacityInput = document.getElementById('maskOpacity');
  const maskOpacityVal = document.getElementById('maskOpacityVal');
  const maskBlurInput = document.getElementById('maskBlur');
  const maskBlurVal = document.getElementById('maskBlurVal');
  const maskShiftYInput = document.getElementById('maskShiftY');
  const maskShiftYVal = document.getElementById('maskShiftYVal');
  const debugLogInput = document.getElementById('debugLog');
  const resetBtn = document.getElementById('resetDefaultsBtn');

  // Update UI values
  function applyToUI(settings) {
    if (settings.maskCoverage === 'entireCard') {
      covEntireCardRadio.checked = true;
    } else {
      covMediaOnlyRadio.checked = true;
    }

    maskColorInput.value = settings.maskColor;
    maskColorCode.textContent = settings.maskColor.toUpperCase();

    maskOpacityInput.value = settings.maskOpacity;
    maskOpacityVal.textContent = `${settings.maskOpacity}%`;

    maskBlurInput.value = settings.maskBlur;
    maskBlurVal.textContent = `${settings.maskBlur}px`;

    maskShiftYInput.value = settings.maskShiftY;
    maskShiftYVal.textContent = `${settings.maskShiftY}px`;

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

  // Coverage mode radios
  document.querySelectorAll('input[name="maskCoverage"]').forEach((radio) => {
    radio.addEventListener('change', (e) => {
      if (e.target.checked) {
        saveChange('maskCoverage', e.target.value);
      }
    });
  });

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

  maskShiftYInput.addEventListener('input', (e) => {
    const val = parseInt(e.target.value, 10);
    maskShiftYVal.textContent = `${val}px`;
    saveChange('maskShiftY', val);
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
