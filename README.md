<p align="center">
  <img src="https://scaleflex.cloudimg.io/v7/plugins/scaleflex/logo.png?vh=b0a502&radius=25&w=700" alt="Scaleflex" width="350">
</p>

<h1 align="center">@cloudimage/spotlight</h1>

<p align="center">
  CDN-native, screenshot-based interactive experience player. Zero dependencies.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@cloudimage/spotlight"><img src="https://img.shields.io/npm/v/@cloudimage/spotlight.svg?style=flat-square" alt="npm version"></a>
  <a href="https://www.npmjs.com/package/@cloudimage/spotlight"><img src="https://img.shields.io/npm/dm/@cloudimage/spotlight.svg?style=flat-square" alt="npm downloads"></a>
  <a href="https://github.com/scaleflex/cloudimage-spotlight/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/@cloudimage/spotlight.svg?style=flat-square" alt="license"></a>
  <a href="https://bundlephobia.com/package/@cloudimage/spotlight"><img src="https://img.shields.io/bundlephobia/minzip/@cloudimage/spotlight?style=flat-square" alt="bundle size"></a>
</p>

<p align="center">
  <a href="https://scaleflex.github.io/cloudimage-spotlight/">Live Demo</a>
</p>

---

## Why @cloudimage/spotlight?

Product tours and interactive demos shouldn't require heavy SaaS platforms or complex setups. This library was built to fill the gap:

- **Lightweight** — under 16 KB gzipped with zero runtime dependencies
- **Web Component** — works with vanilla JS, React, or any framework via `<cloudimage-spotlight>`
- **CDN-powered zoom** — region coordinates map directly to Cloudimage crop/blur URL params
- **Accessible by default** — WCAG 2.1 AA, full keyboard navigation, screen reader support
- **Mobile-ready** — responsive bottom-sheet annotations below 600px
- **Themeable** — dark/light/auto themes via CSS custom properties

---

## Features

- **Scene-based tours** — Step through screenshots with title, description, and CTA per scene
- **Region highlighting** — SVG mask overlay with multiple cut-out regions and numbered badges
- **CDN zoom** — Cloudimage `tl_px`/`br_px` crop with DPR-aware sizing (no CSS zoom fallback)
- **Blur mask mode** — CDN `?blur=` layered image for frosted-glass spotlight effect
- **Autoplay** — Timer-based auto-advance with pause on hover
- **Deep linking** — Hash-based URL sync for shareable scene links
- **Intro/outro screens** — Optional title cards with staggered entry animations
- **Fullscreen mode** — Toggle fullscreen with keyboard shortcut (`F`)
- **Lazy loading** — IntersectionObserver-based, opt out with `eager` attribute
- **React wrapper** — Separate entry point with ref forwarding and typed event props
- **TypeScript** — Full type definitions
- **Print stylesheet** — Clean print layout

## Installation

```bash
npm install @cloudimage/spotlight
```

### CDN

```html
<script src="https://cdn.cloudimage.io/spotlight/1.0.6/spotlight.min.js"></script>
```

## Quick Start

### HTML

```html
<cloudimage-spotlight
  config="https://example.com/tour.json"
  theme="dark"
  eager
></cloudimage-spotlight>
```

### Inline config

```html
<cloudimage-spotlight eager>
  <script type="application/json">
    {
      "version": "1.0",
      "ciToken": "your-token",
      "scenes": [
        {
          "id": "step-1",
          "image": "example.com/screenshot.png",
          "title": "Welcome",
          "description": "Get started with our platform.",
          "regions": [{ "tl_x": 0.1, "tl_y": 0.1, "br_x": 0.5, "br_y": 0.5 }]
        }
      ]
    }
  </script>
</cloudimage-spotlight>
```

### JavaScript property

```js
const el = document.querySelector('cloudimage-spotlight');
el.config = { version: '1.0', ciToken: 'demo', scenes: [...] };
```

### ES module (manual registration)

```js
import { CloudimageSpotlight } from '@cloudimage/spotlight';
customElements.define('my-spotlight', CloudimageSpotlight);
```

## API Reference

### HTML Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `config` | `string` | — | URL to JSON config file |
| `theme` | `"dark"\|"light"\|"auto"` | `"dark"` | Color theme |
| `autoplay` | `boolean` | `false` | Auto-advance scenes |
| `autoplay-interval` | `number` | `4000` | Autoplay interval (ms) |
| `show-progress` | `boolean` | `true` | Show step counter |
| `allow-skip` | `boolean` | `true` | Show skip button |
| `allow-keyboard` | `boolean` | `true` | Enable keyboard nav |
| `sync-url` | `boolean` | `false` | Sync scene to URL hash |
| `eager` | `boolean` | `false` | Disable lazy loading |

### Config Schema

```typescript
interface SpotlightConfig {
  version: "1.0";
  ciToken: string;
  title?: string;
  aspectRatio?: string;                          // e.g. "16:9", "4:3"
  settings?: {
    transition?: "fade" | "slide" | "zoom";
    autoplay?: boolean;
    autoplayInterval?: number;
    maskStyle?: "color" | "blur";
    maskOpacity?: number;
    maskBlurRadius?: number;
    showProgress?: boolean;
    allowSkip?: boolean;
    allowKeyboard?: boolean;
    intro?: boolean | SpotlightIntro;
    outro?: boolean | SpotlightOutro;
    staggerEntry?: boolean;
  };
  scenes: Array<{
    id: string;
    image: string;
    title?: string;
    description?: string;
    regions?: Array<{
      tl_x: number; tl_y: number;  // top-left (0-1)
      br_x: number; br_y: number;  // bottom-right (0-1)
      shape?: "rect" | "ellipse";
      label?: string;
    }>;
    zoom?: boolean;
    mask?: boolean;
    maskStyle?: "color" | "blur";
    cta?: { label: string; href?: string };
    annotation?: {
      position?: "top"|"bottom"|"left"|"right"|"auto";
      style?: "card"|"tooltip"|"minimal";
    };
  }>;
}
```

### Public Methods

```js
const el = document.querySelector('cloudimage-spotlight');
el.next();           // Next scene
el.prev();           // Previous scene
el.goTo(2);          // Jump to scene index
el.goToId('step-3'); // Jump to scene by ID
el.play();           // Start autoplay
el.pause();          // Pause autoplay
el.destroy();        // Full cleanup
el.reload(config);   // Reset and reload
```

### Events

| Event | Detail | Description |
|-------|--------|-------------|
| `cis:ready` | `{ totalScenes, config }` | Component initialized |
| `cis:scene-change` | `{ from, to, scene, totalScenes }` | Scene navigated |
| `cis:complete` | `{ totalScenes, timeSpent, config }` | Tour completed |
| `cis:skip` | `{ atScene, scene, totalScenes }` | Tour skipped |
| `cis:cta-click` | `{ scene, cta, metadata }` | CTA button clicked |
| `cis:region-enter` | `{ scene, regions }` | Scene with regions entered |
| `cis:error` | `{ message, code }` | Error occurred |
| `cis:fullscreen-change` | `{ isFullscreen }` | Fullscreen mode toggled |

## React Usage

```tsx
import { CloudimageSpotlightReact } from '@cloudimage/spotlight/react';

function App() {
  const ref = useRef(null);
  return (
    <CloudimageSpotlightReact
      ref={ref}
      config={tourConfig}
      theme="dark"
      eager
      onReady={(detail) => console.log('Ready:', detail.totalScenes)}
      onSceneChange={(detail) => console.log('Scene:', detail.to)}
      onComplete={(detail) => console.log('Done:', detail.timeSpent)}
    />
  );
}
```

## Theming

All styles are customizable via `--cis-*` CSS custom properties:

```css
cloudimage-spotlight {
  --cis-accent: oklch(0.578 0.198 268.129);
  --cis-border-radius: 8px;
  --cis-card-bg: rgba(0, 0, 0, 0.85);
  --cis-transition-duration: 300ms;
  --cis-mobile-breakpoint: 600px;
}
```

Set `theme="dark"` (default), `theme="light"`, or `theme="auto"` (follows `prefers-color-scheme`).

## Keyboard Navigation

| Key | Action |
|-----|--------|
| `→` / `Space` | Next scene |
| `←` | Previous scene |
| `Escape` | Skip tour |
| `Home` / `End` | First / last scene |
| `1`–`9` | Jump to scene (≤9 scenes) |
| `F` | Toggle fullscreen |

RTL-aware: arrow keys swap in RTL mode.

## Accessibility

- WCAG 2.1 AA compliant
- `role="region"` with `aria-roledescription`
- `aria-live="polite"` progress announcements
- Full keyboard navigation
- Focus-visible indicators
- `prefers-reduced-motion` respected

## Browser Support

| Browser | Minimum |
|---------|---------|
| Chrome / Edge | 73+ |
| Firefox | 101+ |
| Safari | 16.4+ |

## License

[MIT](./LICENSE)

---

## Support

If this library helped your project, consider buying me a coffee!

<a href="https://buymeacoffee.com/dzmitry.stramavus">
  <img src="https://img.shields.io/badge/Buy%20Me%20a%20Coffee-ffdd00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black" alt="Buy Me A Coffee">
</a>

---

<p align="center">
  Made with care by the <a href="https://www.scaleflex.com">Scaleflex</a> team
</p>
