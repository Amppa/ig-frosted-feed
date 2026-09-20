# Frosted Feed (for Instagram)

A lightweight, high-performance Chrome Extension (Manifest V3) designed to eliminate distracting recommendations and sponsored posts from your Instagram web feed using an elegant **Zero-Shift Frosted Overlay Mask** and **Intelligent Boundary Detection**.

---

## ✨ Key Features

- **Zero Layout Shift (Zero Stutter)**:
  - Avoids removing DOM nodes dynamically, completely preventing scrollbar bouncing and skeleton placeholder flashes.
- **Home Feed Only Masking**:
  - Masks are applied exclusively to the Instagram home feed (`instagram.com/`). Other pages (Explore, Reels, profiles, single posts) are never masked — this avoids false positives on pages where all content is intentionally discoverable.
  - Single Page App (SPA) navigation is detected automatically: masks are stripped when you leave the home feed and re-applied when you return, with no page reload required.
- **Precision Media-Only Mask**:
  - Accurately detects the bounding box of photos and videos. Keeps the author header and bottom interactive buttons (like/comment/share) accessible, so you can interact with creators without distraction from media content.
- **Full Click Pass-Through & Reveal**:
  - Click on the overlay to toggle Show Media.
  - Once revealed, the overlay becomes fully click-transparent (pointer-events: none), completely restoring all native Instagram interactions (double-tap like, open post, swipe carousel, play/pause video).
  - A subtle pill button remains pinned to the top-left corner (Mask Media), allowing you to restore the mask at any time.
- **Dedicated Settings & Customization**:
  - **Mask Color & Opacity**: Adjust background tint and opacity from 0% (transparent glass) to 100% (solid dark).
  - **Backdrop Blur**: Real-time frosted glass effect (0px - 20px).
  - **Diagnostic Logging**: Optional F12 Developer Console logs for troubleshooting.
- **Minimalist Popup Interface**:
  - One-click master toggle switch.
  - Live masked items counter with a reset button.
  - **Your Following Only** button: one click opens Instagram's official Following feed (`?variant=following`), hiding algorithmic suggestions.
  - Quick-access button to the Settings page.

---

## 🚀 Installation

1. Clone or download this repository.
2. Open Google Chrome and navigate to chrome://extensions/.
3. Toggle on **Developer mode** in the top-right corner.
4. Click **Load unpacked** and select the extension directory (rosted-feed).
5. Visit [Instagram](https://www.instagram.com/) and enjoy a clean, distraction-free feed.

---

## 🛠️ Project Structure

`	ext
frosted-feed/
├── manifest.json            # Manifest V3 configuration
├── README.md                # Project documentation
├── develop.md               # Architecture and technical design notes
├── icons/                   # Extension icons (16, 48, 128)
└── src/
    ├── content/
    │   ├── content.css      # Overlay mask and interaction styling
    │   └── content.js       # Recommendation detection and boundary math
    ├── options/
    │   ├── options.html     # Dedicated customization settings page
    │   ├── options.css      # Dark-themed responsive settings styling
    │   └── options.js       # Real-time settings persistence
    └── popup/
        ├── popup.html       # Streamlined popup interface
        ├── popup.css        # Compact glassmorphism styling
        └── popup.js         # Master toggle and live counter logic
`

---

## 📄 License

MIT License.