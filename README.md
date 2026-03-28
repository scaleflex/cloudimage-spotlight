# @cloudimage/spotlight

CDN-native, screenshot-based interactive experience player. Built as a Web Component (`<cloudimage-spotlight>`) with zero runtime dependencies.

Part of the [Scaleflex plugin ecosystem](https://scaleflex.github.io/scaleflex-plugins/) and the [Cloudimage plugin family](https://scaleflex.github.io/cloudimage-plugins/).

## Installation

```bash
npm install @cloudimage/spotlight
```

### Script tag (CDN)

```html
<script src="https://unpkg.com/@cloudimage/spotlight/dist/define.min.js"></script>
```

### ES module

```js
import '@cloudimage/spotlight/define';
```

### Manual registration

```js
import { CloudimageSpotlight } from '@cloudimage/spotlight';
customElements.define('my-spotlight', CloudimageSpotlight);
```

## Usage

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

## React

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

## HTML Attributes

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

## Config Schema

```typescript
interface SpotlightConfig {
  version: "1.0";
  ciToken: string;
  title?: string;
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

## Events

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

## Public Methods

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

## CSS Custom Properties

All styles are customizable via `--cis-*` CSS variables:

```css
cloudimage-spotlight {
  --cis-accent: oklch(0.578 0.198 268.129);
  --cis-border-radius: 8px;
  --cis-card-bg: rgba(0, 0, 0, 0.85);
  --cis-transition-duration: 300ms;
  --cis-mobile-breakpoint: 600px;
}
```

## Keyboard Navigation

| Key | Action |
|-----|--------|
| `→` / `Space` | Next scene |
| `←` | Previous scene |
| `Escape` | Skip tour |
| `Home` / `End` | First / last scene |
| `1`–`9` | Jump to scene (≤9 scenes) |

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

MIT
