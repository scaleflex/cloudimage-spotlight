# cloudimage-spotlight — Plugin Specification

> **Status:** Draft v0.5 — all design decisions resolved, implementation-ready
> **Type:** Web Component (Custom Element v1)  
> **Target:** Embeddable runtime player for Spotlight screenshot-based interactive experiences

---

## Table of Contents

1. [Overview](#overview)
2. [Design Decisions](#design-decisions)
3. [Why Web Components](#why-web-components)
4. [Custom Element API](#custom-element-api)
5. [Config Schema](#config-schema)
6. [Cloudimage URL Builder](#cloudimage-url-builder)
7. [Rendering Architecture](#rendering-architecture)
8. [Shadow DOM Structure](#shadow-dom-structure)
9. [CSS Custom Properties (Theming)](#css-custom-properties-theming)
10. [Loading States](#loading-states)
11. [Responsive Behavior](#responsive-behavior)
12. [Lazy Loading](#lazy-loading)
13. [Events](#events)
14. [Public Methods](#public-methods)
15. [Keyboard & Accessibility](#keyboard--accessibility)
16. [Bundle & Browser Support](#bundle--browser-support)
17. [Build Configuration](#build-configuration)
18. [Testing Strategy](#testing-strategy)
19. [Development](#development)
20. [Integration with Spotlight (Authoring)](#integration-with-spotlight-authoring)

---

## Overview

`cloudimage-spotlight` is a **screenshot-based interactive experience player** built as a Web Component. It renders a guided, scene-by-scene walkthrough of annotated screenshots — with region highlighting, masking, CDN-native zoom, and annotation cards.

It is authored in the **Scaleflex Spotlight dashboard** (alongside hotspot, 360°, and before/after experiences) and embedded on any webpage via a single custom element tag.

### What it is NOT

- Not a live DOM tour (no `document.querySelector` targeting, no DOM mutation)
- Not a screen recording player
- Not a competitor to Shepherd.js or Intro.js — those work on live UIs, this works on static images
- Not a standalone SaaS — it is a plugin that derives value from the Cloudimage CDN and Spotlight authoring platform

---

## Design Decisions

Resolved decisions that shaped the architecture. Do not reopen without a strong reason.

| # | Decision | Choice | Rationale |
|---|---|---|---|
| 1 | **Zoom implementation** | CDN-only. No CSS fallback. | Two zoom code paths compound complexity in tests, docs, and edge cases. This is a Cloudimage plugin — requiring a Cloudimage URL is a feature. Non-Cloudimage URLs throw a clear error. |
| 2 | **Aspect ratio handling** | `object-fit: contain` default, configurable via `--cis-object-fit` CSS var | Letterboxing is the safest default for screenshots of varying dimensions. Cover/crop available via CSS var override. |
| 3 | **Multiple regions per scene** | `regions[]` array, **all shown simultaneously** with numbered badges | Sub-navigation within a scene creates a confusing two-level hierarchy. One scene = one screenshot moment. Multiple regions = "here are N things on this screen", each with a badge number. Annotation card lists all. |
| 4 | **Annotation CTA button** | Included in v1 as optional `cta` field on each scene | Low implementation cost; high value for e-commerce and sales use cases. |
| 5 | **Config versioning** | Strict `"version"` string field. Unknown versions: log warning + best-effort render. | Protects against silent breakage on schema changes. Best-effort render avoids hard failure for minor version drift. |
| 6 | **Config loading** | Simple `fetch()` for URL-based configs. No `sessionStorage` caching. | Caching is Spotlight's concern (CDN `Cache-Control` headers on the config JSON). The plugin stays stateless. |

---

## Why Web Components

This plugin is built as a Web Component (`<cloudimage-spotlight>`) rather than a vanilla JS init function (the pattern used by older `cloudimage-*` plugins). Reasons:

| Concern | Vanilla JS init | Web Component |
|---|---|---|
| Framework integration | Requires wrapper per framework | Works natively in React, Vue, Angular, vanilla |
| Style isolation | Global CSS conflicts possible | Shadow DOM encapsulates all styles |
| Embed API | `new CloudimageSpotlight(el, config)` | `<cloudimage-spotlight config="...">` |
| Lifecycle | Manual | `connectedCallback` / `disconnectedCallback` built-in |
| Multiple instances | Manual ID management | Each element is isolated automatically |
| Tree-shaking | N/A | Custom element registry is lazy by design |

**Shadow DOM theming note:** Shadow DOM prevents external CSS from leaking in (good for isolation) but also prevents host page from styling internals (bad for customization). This is solved via **CSS custom properties** (`--cis-*`), which do pierce the shadow boundary. All visual tokens are exposed as CSS variables — see [CSS Custom Properties](#css-custom-properties-theming).

**Generational note:** This is intentionally a break from the init-function pattern of `cloudimage-hotspot` and `cloudimage-360-view`. Those plugins predate Custom Elements v1 wide adoption. New plugins in the Spotlight ecosystem should use Web Components going forward.

### Lifecycle: disconnect and reconnect

When the element is moved in the DOM (e.g., reparented to a different container), `disconnectedCallback` fires followed by `connectedCallback` on the same instance.

- **`disconnectedCallback`**: Tears down observers (`ResizeObserver`, `IntersectionObserver`), cancels pending fetches (via `AbortController`), pauses autoplay, cancels `requestAnimationFrame` handles, and removes `window` event listeners (`hashchange`, `visibilitychange`). Does **not** call `destroy()` — Shadow DOM content is preserved.
- **`connectedCallback` (re-mount)**: Detects that the shadow root already exists (`_initialized` flag). Resumes from the current scene index and config — does not re-fetch or re-initialize. Re-attaches observers and resumes autoplay if it was active.

This is intentional: DOM reparenting should feel seamless. For a full reset, call `reload()` explicitly.

> **`adoptedCallback`** is a no-op in v1. If the element is adopted into a new document (e.g., via iframe), call `reload()` manually to recalculate DPR and viewport dimensions.

---

## Custom Element API

### Basic embed

```html
<!-- Load the plugin -->
<script type="module" src="https://scaleflex.cloudimg.io/v7/plugins/cloudimage/spotlight/1.0.0/spotlight.min.js"></script>

<!-- Embed the experience — config loaded from URL -->
<cloudimage-spotlight
  config="https://samples.scaleflex.com/experiences/asset-library-tour.json"
></cloudimage-spotlight>
```

### Inline JSON config

```html
<cloudimage-spotlight>
  <script type="application/json">
    {
      "version": "1.0",
      "ciToken": "your-token",
      "scenes": [ ... ]
    }
  </script>
</cloudimage-spotlight>
```

> **Priority:** If both `config` attribute and inline `<script type="application/json">` are present, the inline JSON takes priority.

> If inline `<script type="application/json">` is present but contains invalid JSON, the plugin dispatches `cis:error` with code `INVALID_JSON` and does **not** fall back to the `config` attribute. Silent fallback would mask authoring errors.

### Attributes

| Attribute | Type | Default | Description |
|---|---|---|---|
| `config` | `string` (URL) | — | URL to a JSON config file. Fetched on `connectedCallback`. |
| `ci-token` | `string` | — | Cloudimage token. Overrides `ciToken` from config JSON. Useful for multi-tenant setups. |
| `theme` | `"dark" \| "light" \| "auto"` | `"dark"` | Base color theme. `"auto"` follows `prefers-color-scheme`. Can be further customized with CSS vars. |
| `lang` | `string` (BCP 47) | `"en"` | UI language for built-in strings (Next, Previous, Skip, etc.). |
| `autoplay` | `boolean` | `false` | If present, advances scenes automatically. Uses `autoplay-interval`. |
| `autoplay-interval` | `number` (ms) | `4000` | Milliseconds between auto-advance steps. |
| `show-progress` | `boolean` | `true` | Show "Step X of Y" counter in annotation card. |
| `allow-skip` | `boolean` | `true` | Show Skip button. Always recommended. |
| `allow-keyboard` | `boolean` | `true` | Enable keyboard navigation. Maps to `settings.allowKeyboard`. |
| `sync-url` | `boolean` | `false` | Sync current scene to URL hash. Enables hash-based deep linking and `hashchange` navigation. |
| `eager` | `boolean` | `false` | If present, disables lazy loading. Config is fetched immediately on mount. Use for above-the-fold embeds. |

> **Visibility handling:** Autoplay automatically pauses when `document.visibilityState === 'hidden'` (user switches tabs) and resumes when the tab becomes visible again. This prevents the user from returning to an unexpected scene and avoids wasting resources on a hidden tab.

### Attribute reactivity

All attributes are observed via `observedAttributes`. Changing them after mount triggers a re-render:

```js
const el = document.querySelector('cloudimage-spotlight');
el.setAttribute('theme', 'light'); // re-renders with light theme
```

```typescript
static get observedAttributes() {
  return [
    'config', 'ci-token', 'theme', 'lang',
    'autoplay', 'autoplay-interval',
    'show-progress', 'allow-skip',
    'allow-keyboard',
    'sync-url', 'eager',
  ];
}
```

> **Precedence:** HTML attributes take precedence over `config.settings` for properties that exist in both (e.g., `autoplay`, `show-progress`, `allow-skip`). This allows a single shared config JSON to be customized per-instance via attributes.

### Config as a JavaScript property

In addition to the `config` URL attribute and inline `<script type="application/json">`, the config can be set directly as a JS property:

```js
const el = document.querySelector('cloudimage-spotlight');
el.config = {
  version: "1.0",
  ciToken: "demo",
  scenes: [/* ... */]
};
```

> **Priority:** JS property > inline `<script type="application/json">` > `config` URL attribute. Setting the property triggers an immediate re-render (equivalent to `reload(config)`).

This is the recommended approach for framework integrations (React, Vue, Angular) where the config is constructed in JavaScript.

### Deep linking

Scene `id` values support URL-based deep linking via the hash fragment:

```
https://example.com/features#cis-smart-tags
                              ^^^-----------  prefix "cis-" + scene id
```

**On initialization:** After config loads and first render, the component checks `window.location.hash`. If it matches `#cis-{sceneId}`, the player jumps to that scene.

> If the URL hash references a scene ID not found in the config, the player logs a `console.warn` and starts at scene 0.

**URL sync (opt-in):** When `sync-url` is present, navigating between scenes updates the URL hash:

```html
<cloudimage-spotlight config="..." sync-url></cloudimage-spotlight>
```

The component also listens for `hashchange` events, allowing external links or buttons to navigate:
```js
// External navigation
window.location.hash = '#cis-bulk-actions';
```

> When `sync-url` is enabled, the component uses `history.replaceState()` (not `window.location.hash =`) to avoid pushing history entries that break the browser back button. For SPAs using hash-based routing, `sync-url` should be disabled in favor of programmatic `goToId()`.

**Multiple instances:** When multiple `<cloudimage-spotlight>` elements exist on one page, the component uses its own `id` attribute as a namespace: `#myTour:smart-tags`. If no `id` is set, the `cis-` prefix is used.

> **Parsing rules:**
> - If the element has an `id` attribute, it responds only to `#{id}:{sceneId}` and ignores `#cis-{sceneId}`.
> - If the element has no `id`, it responds to `#cis-{sceneId}`.
> - The separator is `:` (first occurrence). Element IDs must not contain `:`.
> - If multiple instances without an `id` share the same namespace, the first in DOM order responds.

> When `sync-url` is enabled, the hash is cleared (via `history.replaceState`) when `cis:complete` or `cis:skip` fires.

> See `sync-url` in the [Attributes table](#attributes) above.

---

## Config Schema

The config JSON is the contract between Spotlight (authoring) and the plugin (player). It must be stable across versions.

### Full TypeScript types

```typescript
interface SpotlightConfig {
  version: "1.0";
  ciToken: string;                    // Cloudimage token
  title?: string;                     // Experience title (used in aria-label)
  aspectRatio?: string;               // Display aspect ratio, e.g. "16:9". Overrides --cis-aspect-ratio CSS var.
  settings?: SpotlightSettings;
  scenes: SpotlightScene[];
}

interface SpotlightSettings {
  transition?: "fade" | "slide" | "zoom";   // Default: "fade"
  autoplay?: boolean;                        // Default: false
  autoplayInterval?: number;                 // ms, default: 4000
  showProgress?: boolean;                    // Default: true
  allowSkip?: boolean;                       // Default: true
  allowKeyboard?: boolean;                   // Default: true
  maskOpacity?: number;                      // 0–1, default: 0.65
  maskColor?: string;                        // CSS color, default: "oklch(0 0 0)"
  maskStyle?: "color" | "blur";              // Default: "color". "blur" uses CDN-blurred full image instead of solid overlay.
  maskBlurRadius?: number;                   // 1–20, default: 8. Only used when maskStyle is "blur".
  intro?: boolean | SpotlightIntro;          // Default: false. Show welcome screen before first scene.
  outro?: boolean | SpotlightOutro;          // Default: false. Show completion screen after last scene.
  staggerEntry?: boolean;                    // Default: true. Stagger overlay elements on scene entry.
}

interface SpotlightOutro {
  title?: string;                            // Override default "Tour complete" text
  description?: string;                      // Subtitle / description text
  restartLabel?: string;                     // Restart button label. Default: i18n "Watch again" string
}

interface SpotlightIntro {
  title?: string;                            // Override config.title for intro card
  description?: string;                      // Subtitle / description text
  startLabel?: string;                       // CTA button label. Default: i18n "Start" string
}

interface SpotlightScene {
  id: string;                          // Unique within experience, used for deep-linking
  image: string;                       // Cloudimage-compatible URL. Required.
  title?: string;                      // Annotation card title
  description?: string;                // Annotation card body text
  regions?: SpotlightRegion[];         // Empty or absent = full image, no spotlight
  mask?: boolean;                      // Dim outside all regions. Default: true if regions set
  zoom?: boolean;                      // CDN-crop to the first region's bounds. Default: false
  annotation?: SpotlightAnnotation;
  cta?: SpotlightCTA;                  // Optional call-to-action button in annotation card
  maskStyle?: "color" | "blur";       // Override settings.maskStyle for this scene
  metadata?: Record<string, string>;  // Arbitrary key-value pairs (e.g. productId, sku). Forwarded in event payloads.
}

interface SpotlightCTA {
  label: string;                       // Button text, e.g. "Learn more"
  href?: string;                       // If set, renders as <a target="_blank">
  // If href is absent, clicking the CTA dispatches a cis:cta-click event only
  metadata?: Record<string, string>;  // Forwarded in cis:cta-click event detail
}

interface SpotlightRegion {
  // Normalized coordinates: 0.0 = left/top edge, 1.0 = right/bottom edge
  // Resolution-independent — converted to pixel coords (tl_px/br_px) using the image's natural dimensions at render time
  tl_x: number;
  tl_y: number;
  br_x: number;
  br_y: number;
  shape?: "rect" | "ellipse";  // Default: "rect". "polygon" planned for v2 (will add points?: [number, number][])
  padding?: number;             // Extra padding in normalized units. Default: 0.02
  label?: string;               // Override the auto-numbered badge (e.g. "A", "1", "→")
                                // Auto-numbered 1, 2, 3... if absent
}

interface SpotlightAnnotation {
  position?:
    | "top" | "bottom" | "left" | "right"
    | "auto";   // Default: "auto" — picks the side of the primary region with most space
  style?: "card" | "tooltip" | "minimal";  // Default: "card"
  maxWidth?: number;  // px, default: 340
  showConnector?: boolean;  // Default: false — opt-in connector line from card to region
}
```

> **Auto-positioning algorithm:** The annotation card is positioned **relative to the primary region** (first in the `regions[]` array). The card is placed on the side with the most available space (top, bottom, left, or right of the region) with a 20px gap. The algorithm checks each side's primary axis to ensure the card fits without overlapping the region, then scores by available space minus overlap with reserved UI rects (action buttons, controls bar). Cross-axis positioning aligns to the region's start edge, clamped to stage bounds with a 12px edge margin. In RTL mode, left/right are mirrored. If no regions exist, the card is centered in the stage.

> The annotation card is rendered only if at least one of `scene.title`, `scene.description`, or `scene.cta` is present. If `annotation` is absent but title/description exist, default annotation settings are used (`position: "auto"`, `style: "card"`, `maxWidth: 340`). `annotation.maxWidth` is applied as an inline style on the card element. The `--cis-card-max-width` CSS variable is used as a fallback when `annotation.maxWidth` is not set. Consumer-defined CSS custom properties on the host element override both.

### Minimal valid config

```json
{
  "version": "1.0",
  "ciToken": "demo",
  "scenes": [
    {
      "id": "intro",
      "image": "https://samples.scaleflex.com/screenshots/dashboard.jpg",
      "title": "Welcome to Scaleflex DAM",
      "description": "This is your central asset hub."
    }
  ]
}
```

> **Single-scene edge case:** With one scene, the Previous button is `aria-disabled`, the Next button triggers `cis:complete` on click, and progress reads "Step 1 of 1".

### Full example config

```json
{
  "version": "1.0",
  "ciToken": "your-token",
  "title": "Asset Library Feature Tour",
  "settings": {
    "transition": "fade",
    "showProgress": true,
    "allowSkip": true,
    "maskOpacity": 0.7,
    "maskStyle": "color"
  },
  "scenes": [
    {
      "id": "overview",
      "image": "https://demo.scaleflex.com/screenshots/asset-library.jpg",
      "title": "Asset Library",
      "description": "Your central hub for all media assets across all projects."
    },
    {
      "id": "smart-tags",
      "image": "https://demo.scaleflex.com/screenshots/asset-library.jpg",
      "title": "AI Smart Tagging",
      "description": "Assets are automatically tagged on upload using visual AI.",
      "regions": [
        {
          "tl_x": 0.62,
          "tl_y": 0.08,
          "br_x": 0.98,
          "br_y": 0.44
        }
      ],
      "mask": true,
      "zoom": true,
      "annotation": {
        "position": "bottom",
        "style": "card"
      },
      "cta": {
        "label": "Learn about AI tagging",
        "href": "https://docs.scaleflex.com/ai-tagging"
      },
      "metadata": {
        "feature": "ai-tagging",
        "docsUrl": "https://docs.scaleflex.com/ai-tagging"
      }
    },
    {
      "id": "bulk-actions",
      "image": "https://demo.scaleflex.com/screenshots/asset-library.jpg",
      "title": "Bulk Actions",
      "description": "Select multiple assets and apply operations in one click.",
      "regions": [
        {
          "tl_x": 0.0,
          "tl_y": 0.0,
          "br_x": 0.45,
          "br_y": 0.08,
          "label": "Toolbar"
        },
        {
          "tl_x": 0.0,
          "tl_y": 0.88,
          "br_x": 0.45,
          "br_y": 1.0,
          "label": "Selection bar"
        }
      ],
      "mask": true,
      "zoom": false
    }
  ]
}
```

---

## Cloudimage URL Builder

This is the core technical differentiator. The plugin is **CDN-only** — there is no CSS zoom fallback. This keeps the codebase clean and makes the Cloudimage dependency explicit. If `image` is not a Cloudimage-compatible URL, the plugin throws a descriptive error at init time.

### CDN URL requirement

A valid scene `image` value must be either:
- An origin URL that will be proxied through the Cloudimage CDN token: `https://yourdomain.com/screenshot.jpg`
- An already-constructed Cloudimage URL: `https://token.cloudimg.io/yourdomain.com/screenshot.jpg`

The plugin always constructs delivery URLs via the token. If `ciToken` is missing, `cis:error` is dispatched immediately.

### Formula: normalized coords → Cloudimage URL

```
https://{ciToken}.cloudimg.io/{originUrl}?func=crop&tl_px={x1},{y1}&br_px={x2},{y2}&w={containerWidth}
```

Cloudimage's `tl_px` and `br_px` parameters accept pixel coordinates. The plugin converts normalized 0–1 coordinates to pixels using the source image's natural dimensions (obtained from the base image's `load` event): `0.62 × 1920 = 1190`. The zoomed URL is therefore built after the base image loads, not at initial render time.

### Device pixel ratio

The URL builder passes `dpr` as a native Cloudimage parameter (clamped to 1–3) for Retina-quality delivery. Cloudimage handles the multiplication server-side. All URLs also include `org_if_sml=1` to prevent Cloudimage from upscaling beyond the original image dimensions.

> **Format negotiation:** Cloudimage automatically serves optimized formats (WebP, AVIF) based on the browser's `Accept` header. No `force_format` parameter is needed — this is default CDN behavior.

### URL construction per variant

```typescript
type SceneImageVariant = "full" | "zoomed" | "blurred";

function buildCiUrl(
  originUrl: string,
  ciToken: string,
  variant: SceneImageVariant,
  regions?: SpotlightRegion[],
  containerWidth?: number,
  dpr?: number,
  blurRadius?: number,
  naturalWidth?: number,
  naturalHeight?: number,
): string {
  const base = `https://${ciToken}.cloudimg.io/${stripProtocol(originUrl)}`;
  const clampedDpr = Math.min(Math.max(dpr ?? 1, 1), 3);
  // Width is rounded up to the nearest 100px to maximize CDN cache hit rate.
  // Without rounding, every pixel-different container width produces a unique URL, defeating edge caching.
  const w = roundWidth(containerWidth ?? 1200);

  switch (variant) {
    case "full":
      return `${base}?w=${w}&dpr=${clampedDpr}&q=85&org_if_sml=1`;

    case "zoomed": {
      if (!regions || regions.length === 0 || !naturalWidth || !naturalHeight)
        return buildCiUrl(originUrl, ciToken, "full", undefined, containerWidth, dpr);
      const bounds = getRegionsBoundingBox(regions);
      const pad = bounds.padding ?? 0.02;
      const x1 = Math.max(0, bounds.tl_x - pad);
      const y1 = Math.max(0, bounds.tl_y - pad);
      const x2 = Math.min(1, bounds.br_x + pad);
      const y2 = Math.min(1, bounds.br_y + pad);
      const tlX = Math.round(x1 * naturalWidth);
      const tlY = Math.round(y1 * naturalHeight);
      const brX = Math.round(x2 * naturalWidth);
      const brY = Math.round(y2 * naturalHeight);
      return `${base}?func=crop`
        + `&tl_px=${tlX},${tlY}`
        + `&br_px=${brX},${brY}`
        + `&w=${w}&dpr=${clampedDpr}&org_if_sml=1`;
    }

    case "blurred": {
      // blurRadius: scene.maskBlurRadius ?? settings.maskBlurRadius ?? 8
      return `${base}?blur=${blurRadius}&w=${w}&dpr=${clampedDpr}&q=70&org_if_sml=1`;
    }
  }
}

interface BoundingBox {
  tl_x: number;
  tl_y: number;
  br_x: number;
  br_y: number;
  padding: number;
}

/**
 * Returns the smallest bounding box that contains all provided regions.
 * Used when multiple regions exist and zoom: true — we zoom to show all of them.
 */
function getRegionsBoundingBox(regions: SpotlightRegion[]): BoundingBox {
  return {
    tl_x: Math.min(...regions.map(r => r.tl_x)),
    tl_y: Math.min(...regions.map(r => r.tl_y)),
    br_x: Math.max(...regions.map(r => r.br_x)),
    br_y: Math.max(...regions.map(r => r.br_y)),
    padding: Math.max(...regions.map(r => r.padding ?? 0.02)),
  };
}

function stripProtocol(url: string): string {
  // encodeURI handles spaces and special chars in origin URLs
  return encodeURI(url.replace(/^https?:\/\//, ''));
}

/** Round up to nearest step for better CDN cache hit rate */
function roundWidth(w: number, step: number = 100): number {
  return Math.ceil(w / step) * step;
}
```

### Error class

```typescript
type CISErrorCode =
  | "FETCH_FAILED"
  | "INVALID_JSON"
  | "INVALID_VERSION"
  | "MISSING_TOKEN"
  | "MISSING_IMAGE"
  | "INVALID_REGION"
  | "IMAGE_LOAD_FAILED";

class CISError extends Error {
  code: CISErrorCode;
  constructor(code: CISErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = "CISError";
  }
}
```

### Validation at init

```typescript
function validateSceneImage(image: string, ciToken: string): void {
  if (!image) {
    throw new CISError("MISSING_IMAGE", `Scene is missing an 'image' field.`);
  }
  if (!ciToken) {
    throw new CISError("MISSING_TOKEN", `'ciToken' is required. Set it in the config JSON or via the ci-token attribute.`);
  }
  // Could extend with URL format check if needed
}
```

### Image pre-loading strategy

After scene N renders, pre-load scenes N+1 and N-1 to avoid flashes on both forward and backward navigation:

```typescript
function preloadScene(scene: SpotlightScene, ciToken: string, containerWidth: number, dpr: number): void {
  const fullUrl = buildCiUrl(scene.image, ciToken, "full", undefined, containerWidth, dpr);
  new Image().src = fullUrl;

  // Zoomed variant requires natural dimensions (pixel coords). Two-phase preload:
  // full image loads → natural dimensions available → build and preload zoomed URL.
  if (scene.zoom && scene.regions?.length) {
    const fullImg = new Image();
    fullImg.src = fullUrl;
    fullImg.addEventListener("load", () => {
      new Image().src = buildCiUrl(scene.image, ciToken, "zoomed", scene.regions,
        containerWidth, dpr, undefined, fullImg.naturalWidth, fullImg.naturalHeight);
    }, { once: true });
  }
}
```

> Both adjacent scenes are preloaded after each navigation. The cost is two additional CDN requests per scene change (already edge-cached after first load). This is especially important for the `"slide"` transition where back-navigation is visually expected.

> Zoomed variants are preloaded in two phases: the full image loads first (providing natural dimensions), then the zoomed crop URL is built and preloaded. This adds one sequential request but ensures the zoomed image is cached when the user navigates to that scene.

> If the upcoming scene uses `maskStyle: "blur"` (per-scene or inherited from settings), the blurred image variant is also preloaded alongside the full variant.

### Resolution warning

After the first scene image loads, the plugin checks `naturalWidth`. If below 1920px, a non-blocking `console.warn` recommends higher resolution source images for optimal CDN zoom quality.

```typescript
function checkImageResolution(img: HTMLImageElement, sceneId: string): void {
  if (img.naturalWidth > 0 && img.naturalWidth < 1920) {
    console.warn(
      `[cloudimage-spotlight] Scene "${sceneId}": source image is ${img.naturalWidth}px wide. ` +
      `Recommended minimum: 1920px for optimal zoom quality.`
    );
  }
}
```

### Image error handling

If a scene image fails to load (404, CORS, network error), the plugin:
1. Dispatches `cis:error` with code `IMAGE_LOAD_FAILED`
2. Renders a fallback placeholder inside the stage area
3. Allows navigation to other scenes — a single broken image does not block the experience

---

## Intro / Welcome Screen

When `settings.intro` is set (boolean `true` or an `SpotlightIntro` object), the component shows a welcome overlay before the first scene:

1. **Scene 0's base image** loads in the background (clean, no overlays/mask/annotation)
2. A **semi-transparent overlay** covers the image with a centered welcome card
3. The card displays a title, optional description, and a "Start" button
4. Clicking "Start" (or pressing **Escape**) dismisses the intro and transitions to the full scene 0 with staggered entry animation

### Title resolution

| Priority | Source |
|---|---|
| 1 | `settings.intro.title` (explicit override) |
| 2 | `i18n.introDefault` interpolated with `config.title` → "Learn about {title}" |
| 3 | `i18n.tourLabel` fallback → "Interactive tour" |

### Intro + other features

| Feature | Behavior |
|---|---|
| **Autoplay** | Intro skipped — autoplay starts immediately at scene 0 |
| **Deep link** | Intro skipped — navigates directly to the linked scene |
| **Navigation** | `next()`, `prev()`, `goTo()`, `goToId()` are no-ops during intro |
| **Keyboard** | Only **Escape** is handled (dismisses intro). Arrow keys, Space, etc. are blocked. |
| **`cis:ready`** | Fires during intro (before dismiss). `cis:region-enter` fires after dismiss. |
| **Mobile** | Intro card renders as a bottom-sheet (full-width, bottom-aligned) below `--cis-mobile-breakpoint` |

---

## Outro / Completion Screen

When `settings.outro` is set, the component shows a completion overlay after the user finishes the last scene (clicks "Next" on the final scene):

1. The **last scene remains visible** underneath the overlay (unlike intro which shows the clean image)
2. A **semi-transparent overlay** covers the scene with a centered completion card
3. The card displays a title (default: "Tour complete"), optional description, and a "Watch again" button
4. Clicking "Watch again" (or pressing **Escape**) dismisses the outro and restarts the tour from scene 0

### Outro + other features

| Feature | Behavior |
|---|---|
| **`cis:complete`** | Fires before the outro appears |
| **Navigation** | `next()` and `prev()` are no-ops during outro. `goTo()` and `goToId()` dismiss the outro and navigate. |
| **Keyboard** | Only **Escape** is handled (restarts tour). |
| **Mobile** | Outro card renders as a bottom-sheet (same as intro). |
| **Autoplay** | Autoplay stops at the last scene. If outro is configured, it appears after the autoplay-triggered `cis:complete`. |

---

## Staggered Scene Entry

When `settings.staggerEntry !== false` (default: `true`), overlay elements animate in sequentially after the scene image loads. This is CSS-driven via animation delays.

### Timing table

| Phase | Delay | Element | Animation |
|---|---|---|---|
| 0 | 0ms | Base image | Visible immediately |
| 1 | `--cis-stagger-delay-mask` (600ms) | Mask + overlay wrapper | Fade in |
| 2 | `--cis-stagger-delay-badge` (900ms) | Badges | Scale + fade in |
| 3 | `--cis-stagger-delay-annotation` (1050ms) | Annotation card | Slide up + fade in |
| 4 | `--cis-stagger-delay-connector` (1200ms) | Connector line | Fade in |

Animation duration per element: `--cis-stagger-duration` (default: 500ms).

### Stagger + transitions

Stagger applies on every scene entry (including after scene-to-scene transitions). The stagger classes are cleared at the start of each new `renderScene` call.

### Reduced motion

When `prefers-reduced-motion: reduce` is active, all stagger animations are disabled. Elements appear instantly.

---

## Rendering Architecture

### Overlay approach: SVG mask

The spotlight mask is implemented using an **SVG mask layer** positioned over the image. Chosen over CSS `clip-path` because:

- Supports **multiple cut-outs** in one SVG element — critical for the multi-region model
- Animatable via CSS transitions on SVG attributes
- Supports ellipse regions natively
- No clipping artifacts at viewport edges

```
┌─────────────────────────────────────┐
│  Image layer (full screenshot)      │  ← <img> base layer
│                                     │
│  SVG mask overlay (full size)       │  ← dark rect with N transparent cut-outs
│  │                                  │
│  │  ┌──────┐        ┌──────┐        │    Each cut-out = one SpotlightRegion
│  │  │ [1]  │        │ [2]  │        │    Numbered badge overlaid at top-left
│  │  └──────┘        └──────┘        │    of each region's bounding box
│  │                                  │
│  Zoomed image (optional)            │  ← CDN-cropped to bounding box of all regions
│                                     │    fades in over the full image
│  Annotation card                    │  ← single card for the scene
│  (lists all regions if multiple)    │
│                                     │
│  Navigation controls                │
└─────────────────────────────────────┘
```

### SVG mask with multiple cut-outs

```html
<!-- viewBox="0 0 1 1" + preserveAspectRatio="none" means region coords ARE SVG coords -->
<svg class="cis-mask" viewBox="0 0 1 1" preserveAspectRatio="none" aria-hidden="true">
  <defs>
    <mask id="cis-mask-{instanceId}-{sceneId}">
      <rect width="1" height="1" fill="white"/>
      <!-- Each region punches a black hole = transparent in the mask -->
      <rect x="{tl_x}" y="{tl_y}" width="{w}" height="{h}" fill="black" rx="0.005"/>
      <rect x="{tl_x}" y="{tl_y}" width="{w}" height="{h}" fill="black" rx="0.005"/>
      <!-- ellipse regions use <ellipse> with matching cx/cy/rx/ry -->
    </mask>
  </defs>
  <!-- Dark overlay, cut out at region positions -->
  <rect
    width="1" height="1"
    fill="var(--cis-mask-color, #000)"
    opacity="var(--cis-mask-opacity, 0.65)"
    mask="url(#cis-mask-{instanceId}-{sceneId})"
  />
</svg>

<!-- Region badges — absolutely positioned over the image, one per region -->
<span class="cis-badge" style="left: {tl_x * 100}%; top: {tl_y * 100}%">1</span>
<span class="cis-badge" style="left: {tl_x * 100}%; top: {tl_y * 100}%">2</span>
```

> Badge positioning uses `left/top` percentage values matching the normalized coordinates, inside a `position: relative` container — no JS coordinate calculation needed.

> Each component instance generates a unique `instanceId` (incrementing counter or short random string) to prefix all SVG `id` attributes. This prevents ID collisions when multiple `<cloudimage-spotlight>` elements share the same config on one page. SVG `url(#id)` references in some browsers resolve from the document root, not the shadow root.

### Region highlight borders

Each region has a corresponding `<div class="cis-region-highlight">` positioned over the image using percentage-based `left`/`top`/`width`/`height` matching the region's normalized coordinates. These divs render the visible border (`--cis-region-border`) and the entry pulse animation (`--cis-region-pulse-*`). They are separate from the SVG mask layer to allow independent styling and animation.

### Transition system

Each transition is implemented as a CSS class swap + `requestAnimationFrame`:

| Transition | How it works |
|---|---|
| `fade` | Outgoing scene opacity `1→0`, incoming `0→1`. Crossfade. Duration: 300ms. |
| `slide` | Outgoing slides out left, incoming slides in from right. Duration: 350ms. |
| `zoom` | Full image fades, zoomed CDN image scales in from region center. Duration: 400ms. |

All transitions respect `prefers-reduced-motion: reduce` — they fall back to an instant cut when set.

> **Cross-mode transitions:** When transitioning between a blur-mask scene and a color-mask scene, each scene is treated as an atomic unit (image + its mask layers). The outgoing scene fades/slides out as a whole; the incoming scene fades/slides in as a whole. The transition system does not interpolate between blur and color overlay types.

### Blur mask mode

When `maskStyle: "blur"` (per-scene or global setting), the overlay uses a CDN-blurred image instead of the solid-color SVG mask:

```
┌─────────────────────────────────────┐
│  Blurred image (CDN ?blur=8)        │  ← full image, blurred server-side
│                                     │
│  Sharp image (clip-masked)          │  ← full sharp image, clipped to region bounds
│  │  ┌──────┐        ┌──────┐       │    via SVG mask (inverse of color mode)
│  │  │ [1]  │        │ [2]  │       │
│  │  └──────┘        └──────┘       │
│                                     │
│  Annotation card + controls         │  ← same as color mode
└─────────────────────────────────────┘
```

> **DOM structure in blur mode:** `cis-image--base` is replaced by two layers: `cis-image--blurred` (the CDN-blurred full image, z-index +0) and `cis-image--sharp` (the full sharp image clipped to region bounds via CSS `clip-path`, z-index +0.5). The SVG mask overlay (`cis-mask`) is not rendered in blur mode — the sharp/blurred layering provides the spotlight effect. All other layers (badges, highlights, annotation, controls) remain unchanged.

The blurred image URL is cached at the CDN edge — second load from any user is instant. This produces a depth-of-field effect that CSS `backdrop-filter` cannot match in quality or consistency across browsers.

> **No-region fallback:** If `maskStyle: "blur"` is set but the scene has no regions, the blurred layer is not rendered. The scene displays the sharp full image with no mask, identical to the color-mode no-region behavior. A `console.warn` is logged if the author explicitly sets blur on a regionless scene.

### Content security

All config-derived text fields (`title`, `description`, `region.label`, `cta.label`) are rendered via `textContent` — never `innerHTML`. This prevents XSS when configs are loaded from third-party URLs.

CTA links (`cta.href`) are validated at render time:
- Only `https://`, `http://`, and `/` (relative) schemes are allowed
- `javascript:`, `data:`, `vbscript:`, and `blob:` schemes are stripped with a `console.warn`
- All `<a>` tags include `rel="noopener noreferrer"` alongside `target="_blank"`

---

## Shadow DOM Structure

```
<cloudimage-spotlight>
  └── #shadow-root
      ├── <!-- Styles via adoptedStyleSheets (constructable stylesheet singleton) -->
      ├── <div class="cis-root" role="region" aria-label="{config.title}" aria-roledescription="Interactive tour">
      │   ├── <div class="cis-stage">
      │   │   ├── <img class="cis-image cis-image--base" src="..." alt="...">
      │   │   ├── <img class="cis-image cis-image--zoomed" src="..." alt="..." aria-hidden="true">
      │   │   ├── <svg class="cis-mask" aria-hidden="true"> ... </svg>
      │   │   ├── <div class="cis-region-highlight" data-index="0" aria-hidden="true"></div>
      │   │   ├── <div class="cis-region-highlight" data-index="1" aria-hidden="true"></div>
      │   │   ├── <!-- One badge per region, absolutely positioned -->
      │   │   ├── <span class="cis-badge" data-index="0" aria-hidden="true">1</span>
      │   │   ├── <span class="cis-badge" data-index="1" aria-hidden="true">2</span>
      │   │   └── <div class="cis-annotation" role="status" aria-live="polite">
      │   │       ├── <p class="cis-annotation__title"> ... </p>
      │   │       ├── <p class="cis-annotation__body"> ... </p>
      │   │       └── <a class="cis-cta" href="..." target="_blank" rel="noopener noreferrer"> Learn more </a>  <!-- optional -->
      │   ├── <nav class="cis-controls" aria-label="Experience navigation">
      │   │   ├── <button class="cis-btn cis-btn--prev" aria-label="Previous step"> <svg> (lucide:chevron-left) </svg> </button>
      │   │   ├── <span class="cis-progress" aria-live="polite"> Step 2 of 5 </span>
      │   │   ├── <button class="cis-btn cis-btn--next" aria-label="Next step"> <svg> (lucide:chevron-right) </svg> </button>
      │   │   └── <button class="cis-btn cis-btn--skip" aria-label="Skip tour"> <svg> (lucide:x) </svg> </button>
      └── <slot></slot>   <!-- for inline <script type="application/json"> -->
```

### CSS class naming convention

All classes are prefixed `cis-` (Cloudimage Spotlight). BEM-style:

- Block: `cis-root`, `cis-stage`, `cis-controls`
- Element: `cis-annotation__title`, `cis-btn--prev`
- State modifiers: `cis-image--visible`, `cis-image--hidden`

### Style injection

Styles are injected via **constructable stylesheets** (`adoptedStyleSheets`), not `<link>` or inline `<style>` tags. A single `CSSStyleSheet` instance is shared across all component instances on the page:

```typescript
const sheet = new CSSStyleSheet();
sheet.replaceSync(cssText); // cssText imported via Vite ?inline

class CloudimageSpotlight extends HTMLElement {
  connectedCallback() {
    const shadow = this.attachShadow({ mode: 'open' });
    shadow.adoptedStyleSheets = [sheet]; // shared singleton — zero duplication
    // ...
  }
}
```

This approach:
- **Zero style duplication** — 10 instances on one page share one parsed stylesheet
- **Self-contained** — no external CSS file to load (bundled via Vite `?inline` import)
- **Shadow DOM encapsulated** — styles don't leak to/from the host page
- **Browser support** — Chrome 73+, Firefox 101+, Safari 16.4+ (within target range)

---

## CSS Custom Properties (Theming)

These variables can be set on the host element or any ancestor — they pierce the Shadow DOM boundary.

```css
cloudimage-spotlight {
  /* Layout */
  --cis-width: 100%;
  --cis-max-width: 1200px;
  --cis-aspect-ratio: 16/9;         /* Container aspect ratio */
  --cis-border-radius: 8px;
  --cis-object-fit: contain;               /* "contain" | "cover" */

  /* Mask */
  --cis-mask-color: oklch(0 0 0);
  --cis-mask-opacity: 0.65;
  --cis-mask-transition: 450ms ease;

  /* Annotation card */
  --cis-card-bg: oklch(0.13 0.027 261.692 / 0.92);
  --cis-card-border: oklch(0.95 0.01 264.55 / 0.1);
  --cis-card-border-radius: 12px;
  --cis-card-padding: 16px 20px;
  --cis-card-max-width: 340px;
  --cis-card-title-color: oklch(0.95 0.01 264.55);
  --cis-card-title-size: 15px;
  --cis-card-body-color: oklch(0.82 0.025 249.89);
  --cis-card-body-size: 13px;
  --cis-card-backdrop-blur: blur(12px);

  /* Controls */
  --cis-btn-bg: oklch(0.18 0.01 261 / 0.9);
  --cis-btn-bg-hover: oklch(0.3 0.01 261 / 0.95);
  --cis-btn-color: oklch(0.94 0.005 264);
  --cis-btn-border-radius: 6px;
  --cis-btn-size: 36px;
  --cis-btn-shadow: 0 2px 8px oklch(0 0 0 / 0.15);
  --cis-progress-color: oklch(0.82 0.025 249.89);
  --cis-progress-font-size: 11px;

  /* Accent (progress indicator, region border) */
  --cis-accent: oklch(0.578 0.198 268.129);

  /* Region highlight border */
  --cis-region-border: 2px solid oklch(0.578 0.198 268.129 / 0.6);
  --cis-region-border-radius: 4px;

  /* Region pulse animation (plays on scene entry, 1–2 cycles) */
  --cis-region-pulse-color: oklch(0.578 0.198 268.129 / 0.4);
  --cis-region-pulse-duration: 600ms;
  --cis-region-pulse-count: 2;

  /* Transition */
  --cis-transition-duration: 300ms;
  --cis-transition-easing: ease;

  /* Badge (region number labels) */
  --cis-badge-bg: var(--cis-accent);
  --cis-badge-color: oklch(1 0 0);
  --cis-badge-size: 22px;
  --cis-badge-font-size: 11px;
  --cis-badge-border-radius: 50%;

  /* CTA button */
  --cis-cta-bg: var(--cis-accent);
  --cis-cta-bg-hover: color-mix(in srgb, var(--cis-accent) 85%, white);
  --cis-cta-color: oklch(1 0 0);
  --cis-cta-border-radius: 6px;
  --cis-cta-padding: 8px 16px;
  --cis-cta-font-size: 13px;

  /* Focus ring (Shadow DOM isolates from host :focus-visible) */
  --cis-focus-ring-color: var(--cis-accent);
  --cis-focus-ring-width: 2px;
  --cis-focus-ring-offset: 2px;

  /* Z-index base (useful if embedding inside modals) */
  --cis-z-base: 1;
  /*
   * Internal z-index stack (relative to --cis-z-base):
   *   +0  cis-image (base + zoomed)
   *   +1  cis-mask (SVG overlay)
   *   +2  cis-region-highlight (border + pulse)
   *   +3  cis-badge (numbered labels)
   *   +4  cis-annotation (card)
   *   +5  cis-controls (nav buttons)
   *   +6  cis-bottom-sheet (mobile)
   */

  /* Additional CSS variables defined in context:
   *   Loading:    --cis-skeleton-*       (see Loading States section)
   *   Mobile:     --cis-mobile-*,
   *               --cis-bottom-sheet-*   (see Responsive Behavior section)
   */
}
```

### Light theme override example

```css
cloudimage-spotlight[theme="light"] {
  --cis-card-bg: oklch(1 0 0 / 0.95);
  --cis-card-border: oklch(0 0 0 / 0.08);
  --cis-card-title-color: oklch(0.37 0.022 248.413);
  --cis-card-body-color: oklch(0.5303 0.039 249.89);
  --cis-btn-bg: oklch(1 0 0 / 0.9);
  --cis-btn-bg-hover: oklch(0.92 0.005 264 / 0.95);
  --cis-btn-color: oklch(0.27 0.01 261);
  --cis-btn-shadow: 0 2px 8px oklch(0 0 0 / 0.15);
  --cis-progress-color: oklch(0.5303 0.039 249.89);
}
```

### Auto theme detection

When `theme="auto"`, the component applies dark or light variables based on the system preference:

```css
@media (prefers-color-scheme: light) {
  :host([theme="auto"]) .cis-root {
    --cis-card-bg: oklch(1 0 0 / 0.95);
    --cis-card-border: oklch(0 0 0 / 0.08);
    --cis-card-title-color: oklch(0.37 0.022 248.413);
    --cis-card-body-color: oklch(0.5303 0.039 249.89);
    --cis-btn-bg: oklch(1 0 0 / 0.9);
    --cis-btn-bg-hover: oklch(0.92 0.005 264 / 0.95);
    --cis-btn-color: oklch(0.27 0.01 261);
    --cis-btn-shadow: 0 2px 8px oklch(0 0 0 / 0.15);
    --cis-progress-color: oklch(0.5303 0.039 249.89);
  }
}
```

The theme responds to system changes in real time (no reload needed). Because the auto theme is implemented via a CSS `@media (prefers-color-scheme)` rule inside the shadow stylesheet, it responds to OS theme changes automatically without any JavaScript listener.

### Print stylesheet

When the page is printed, the component renders a clean, ink-friendly layout:

```css
@media print {
  .cis-controls,
  .cis-bottom-sheet nav,
  .cis-mask,
  .cis-region-highlight,
  .cis-badge,
  .cis-skeleton {
    display: none !important;
  }

  .cis-image--zoomed {
    display: none !important;
  }

  .cis-annotation {
    position: static !important;
    max-width: 100% !important;
    background: transparent !important;
    color: oklch(0 0 0) !important;
    border: 1px solid oklch(0.75 0 0) !important;
    margin-top: 8px;
  }

  .cis-root {
    break-inside: avoid;
  }
}
```

The printed output shows the base screenshot image with annotation text below it — no overlay, no controls.

---

## Loading States

### Loading sequence

The plugin goes through three states before it is interactive:

| State | What happens | What the user sees |
|---|---|---|
| **Config loading** | `fetch()` in progress (or inline JSON parsing). No image requests yet. | Component reserves space via `--cis-aspect-ratio`. Skeleton shimmer placeholder renders inside the shadow DOM. |
| **Image loading** | Config parsed, first scene image requested. Annotation text renders immediately. Cards with explicit `position` are placed relative to the primary region; `position: "auto"` cards use `bottom` as fallback until image dimensions are known. | Skeleton in the image area. Title/description visible in the annotation card. |
| **Ready** | First image loaded. Full render. `cis:ready` dispatched. | Complete scene with image, mask, badges, annotation, controls. |

### Skeleton markup

```html
<div class="cis-skeleton" aria-hidden="true">
  <div class="cis-skeleton__shimmer"></div>
</div>
```

The `.cis-loading` class is added to `.cis-root` during states 1 and 2, removed on ready. The skeleton element is removed from the DOM when `cis:ready` fires.

### CSS variables

```css
  /* Loading skeleton */
  --cis-skeleton-bg: oklch(0.95 0.01 264.55 / 0.05);
  --cis-skeleton-shimmer: oklch(0.95 0.01 264.55 / 0.08);
  --cis-skeleton-duration: 1.5s;
```

---

## Responsive Behavior

### Container resize handling

The plugin observes its own container width via `ResizeObserver` on `.cis-root`:

- On resize: rebuild CDN image URLs with the new `containerWidth` (debounced at 100ms via `requestAnimationFrame`)
- SVG mask coordinates are resolution-independent (normalized 0–1) — no mask recalculation needed on resize
- Annotation cards with `position: "auto"` are re-evaluated on resize
- Pre-loaded images for the next scene are re-requested at the new width

> **Transition guard:** Image URL rebuilds from `ResizeObserver` are suppressed while a scene transition is in progress (300-400ms). The resize is queued and applied after the transition completes. This prevents mid-transition image swaps that would cause visual artifacts.

### Mobile breakpoint and bottom-sheet annotations

Below `--cis-mobile-breakpoint` (default `600px`), the annotation card switches from a floating overlay to a **bottom-sheet** layout:

| Aspect | Desktop (above breakpoint) | Mobile (below breakpoint) |
|---|---|---|
| Annotation | Floating card, positioned per `annotation.position` | Bottom-sheet: full width, slides up from bottom |
| Image | Fills stage with `object-fit` | Fills available height above the sheet |
| Controls | Inside the annotation card or below stage | Integrated into the bottom sheet |

### Bottom-sheet Shadow DOM variant

```
Below --cis-mobile-breakpoint:

<div class="cis-root cis-root--mobile">
  <div class="cis-stage"> ... (image + mask, no floating annotation) </div>
  <div class="cis-bottom-sheet">
    <div class="cis-annotation"> ... </div>
    <nav class="cis-controls"> ... </nav>
  </div>
</div>
```

### Mobile CSS variables

```css
  /* Mobile / bottom-sheet */
  --cis-mobile-breakpoint: 600px;
  --cis-bottom-sheet-bg: var(--cis-card-bg);
  --cis-bottom-sheet-max-height: 40%;
  --cis-bottom-sheet-border-radius: 12px 12px 0 0;
  --cis-bottom-sheet-padding: 16px 20px;
```

### Responsive image delivery

Cloudimage delivers correctly sized images based on the `w` parameter. On container resize, the new width produces a new CDN URL that is cached independently at the edge. No `srcset` needed — the URL builder handles responsive delivery by re-requesting at the current container width.

---

## Lazy Loading

### IntersectionObserver-based deferral

By default, the plugin defers config fetch and image loading until the element enters the viewport. This prevents below-the-fold embeds from blocking page load.

- Uses `IntersectionObserver` with `threshold: 0.1` and `rootMargin: "200px"` (pre-fetches slightly before the element scrolls into view)
- During the deferred state, the component reserves space using `--cis-aspect-ratio` to prevent layout shift
- When the observer fires, normal initialization proceeds: fetch config → load first image → render → dispatch `cis:ready`

> **Deep link override:** If `window.location.hash` matches the component's deep-link namespace on `connectedCallback`, lazy loading is bypassed and initialization proceeds immediately — equivalent to `eager`. This ensures shared deep-link URLs always resolve without requiring scroll.

### Opt-out

```html
<!-- Disable lazy loading — fetch immediately on connectedCallback -->
<cloudimage-spotlight config="..." eager></cloudimage-spotlight>
```

| Attribute | Type | Default | Description |
|---|---|---|---|
| `eager` | `boolean` | `false` | If present, disables lazy loading. Config is fetched immediately on mount. Use for above-the-fold embeds. |

### Cleanup

The `IntersectionObserver` is disconnected after first trigger or on `disconnectedCallback` / `destroy()`.

---

## Events

All events are standard `CustomEvent` dispatched on the `<cloudimage-spotlight>` element. They bubble and are composed (cross shadow boundary).

```typescript
// Listen like any DOM event
const el = document.querySelector('cloudimage-spotlight');

el.addEventListener('cis:ready', (e) => { ... });
el.addEventListener('cis:scene-change', (e) => { ... });
el.addEventListener('cis:complete', (e) => { ... });
el.addEventListener('cis:skip', (e) => { ... });
```

### Event reference

| Event | Fired when | `detail` payload |
|---|---|---|
| `cis:ready` | Config loaded and first scene rendered | `{ totalScenes: number, config: SpotlightConfig }` |
| `cis:scene-change` | User moves to a new scene | `{ from: number, to: number, scene: SpotlightScene, totalScenes: number }` |
| `cis:complete` | User reaches the last scene and clicks Next | `{ totalScenes: number, timeSpent: number, config: SpotlightConfig }` |

> **Autoplay at end:** When autoplay reaches the last scene, `cis:complete` fires and autoplay pauses. The tour does not loop. To implement looping, listen for `cis:complete` and call `goTo(0)` followed by `play()`.

| `cis:skip` | User clicks Skip button | `{ atScene: number, scene: SpotlightScene, totalScenes: number }` |
| `cis:cta-click` | User clicks a CTA button that has no `href` | `{ scene: SpotlightScene, cta: SpotlightCTA, metadata?: Record<string, string> }` |
| `cis:region-enter` | Scene with regions becomes active | `{ scene: SpotlightScene, regions: SpotlightRegion[] }` |
| `cis:error` | Config fetch failed or JSON invalid | `{ message: string, code: "FETCH_FAILED" \| "INVALID_JSON" \| "INVALID_VERSION" \| "MISSING_TOKEN" \| "MISSING_IMAGE" \| "INVALID_REGION" \| "IMAGE_LOAD_FAILED" }` |

> **Init failure:** If config loading or validation fails (any `cis:error` during initialization), the component enters a failed state. An error message is rendered inside the shadow DOM. All navigation methods (`next()`, `prev()`, `goTo()`, etc.) become no-ops. Call `reload()` to retry.

### Typed event details (TypeScript)

```typescript
interface CISReadyDetail {
  totalScenes: number;
  config: SpotlightConfig;
}

interface CISSceneChangeDetail {
  from: number;
  to: number;
  scene: SpotlightScene;
  totalScenes: number;
}

interface CISCompleteDetail {
  totalScenes: number;
  timeSpent: number;
  config: SpotlightConfig;
}

interface CISSkipDetail {
  atScene: number;
  scene: SpotlightScene;
  totalScenes: number;
}

interface CISCTAClickDetail {
  scene: SpotlightScene;
  cta: SpotlightCTA;
  metadata?: Record<string, string>;
}

interface CISRegionEnterDetail {
  scene: SpotlightScene;
  regions: SpotlightRegion[];
}

interface CISErrorDetail {
  message: string;
  code: CISErrorCode;
}

interface CISStrings {
  prev: string;
  next: string;
  finish: string;
  skip: string;
  progress: string;     // Supports {n} and {total} interpolation
  tourLabel: string;
  navLabel: string;
}

// Global event map augmentation — enables type-safe addEventListener
declare global {
  interface HTMLElementEventMap {
    'cis:ready': CustomEvent<CISReadyDetail>;
    'cis:scene-change': CustomEvent<CISSceneChangeDetail>;
    'cis:complete': CustomEvent<CISCompleteDetail>;
    'cis:skip': CustomEvent<CISSkipDetail>;
    'cis:cta-click': CustomEvent<CISCTAClickDetail>;
    'cis:region-enter': CustomEvent<CISRegionEnterDetail>;
    'cis:error': CustomEvent<CISErrorDetail>;
  }
}
```

> This augmentation makes `el.addEventListener('cis:ready', (e) => { e.detail.totalScenes })` fully type-safe — no casts needed.

### Analytics integration example

```js
el.addEventListener('cis:scene-change', ({ detail }) => {
  gtag('event', 'spotlight_scene_view', {
    experience_id: el.getAttribute('config'),
    scene_id: detail.scene.id,
    scene_index: detail.to,
  });
});

el.addEventListener('cis:complete', ({ detail }) => {
  gtag('event', 'spotlight_complete', {
    time_spent_ms: detail.timeSpent,
  });
});
```

---

## Public Methods

Accessible via direct element reference (not attributes):

```typescript
interface CloudimageSpotlightElement extends HTMLElement {
  // Navigation
  next(): void;                    // Advance to next scene. On the last scene, does not advance but dispatches cis:complete.
  prev(): void;                    // Go to previous scene. No-op on first scene.
  goTo(index: number): void;       // Go to scene by 0-based index. No-op if out of range.
  goToId(id: string): void;        // Go to scene by scene.id. No-op if no match. Used internally by the deep linking hash parser.

  // Playback
  play(): void;                    // Start autoplay.
  pause(): void;                   // Pause autoplay.

  // State (read-only)
  readonly currentIndex: number;
  readonly totalScenes: number;
  readonly isPlaying: boolean;
  readonly currentScene: SpotlightScene;

  // Internationalization
  strings: Partial<CISStrings>;        // Override built-in UI strings. Partial merge with defaults.

  // Lifecycle
  destroy(): void;                 // Remove all listeners, cancel pending fetches/timers/rAF handles, clear Shadow DOM. Element stays in DOM as inert node. Methods become no-ops. Re-initialize via reload().
  reload(config?: SpotlightConfig): Promise<void>;  // Reset to scene 0 and re-render. Omit config to re-fetch current URL. Cancels in-progress transitions. Rejects with CISError on fetch/validation failure (cis:error also dispatched).
}
```

> `destroy()` handles the pre-initialization state gracefully. If called before the `IntersectionObserver` fires (component was always below the fold), it disconnects the observer and sets a `_destroyed` flag. If the observer fires after `destroy()`, the callback exits immediately without initializing.

> `play()` and `pause()` control runtime autoplay state only. They do not reflect back to the `autoplay` attribute. The attribute sets the initial state on `connectedCallback`; programmatic control takes over from there.

### Usage example

```js
const spotlight = document.querySelector('cloudimage-spotlight');

// Controlled navigation (e.g., from external prev/next buttons)
document.querySelector('#next-btn').onclick = () => spotlight.next();

// Deep link to a specific scene
spotlight.goToId('smart-tags');

// Programmatic autoplay control
spotlight.play();
setTimeout(() => spotlight.pause(), 10000);
```

---

## Keyboard & Accessibility

### Keyboard controls

| Key | Action |
|---|---|
| `→` / `Space` | Next scene |
| `←` | Previous scene |
| `Escape` | Skip / close |
| `Home` | First scene |
| `End` | Last scene |
| `1`–`9` | Jump to scene by number (if ≤9 scenes) |
| `Tab` | Focus next interactive element (annotation CTA, controls) |

Keyboard navigation is enabled only when the component has focus or a child has focus — it does not capture global keyboard events.

> **Focus management:** On user-initiated scene change (button or keyboard), focus remains on the triggering control. On programmatic change (`goTo()`, autoplay), focus is not moved. The `aria-live="polite"` progress counter announces the new step to screen readers.

The component sets `tabindex="0"` on the host element in `connectedCallback` if not already present, making it keyboard-focusable.

### ARIA roles & attributes

```html
<!-- Host container -->
<div role="region" aria-label="Asset Library Feature Tour" aria-roledescription="Interactive tour">

  <!-- Image -->
  <img alt="Step 2 of 5: AI Smart Tagging — Assets are automatically tagged on upload using visual AI.">
    <!-- alt is auto-generated: "{step title} — {scene description truncated to 80 chars}" -->

  <!-- Progress -->
  <span aria-live="polite" aria-atomic="true">Step 2 of 5</span>

  <!-- Controls -->
  <button aria-label="Previous step" aria-disabled="true">  <!-- disabled on first step -->
  <button aria-label="Next step">
  <button aria-label="Skip tour">
```

### Reduced motion

All transitions respect `prefers-reduced-motion`:

```css
@media (prefers-reduced-motion: reduce) {
  .cis-image,
  .cis-mask__overlay,
  .cis-annotation {
    transition: none !important;
    animation: none !important;
  }
}
```

### Internationalization

The `lang` attribute (default `"en"`) controls the language of all built-in UI strings. The component ships with English strings and accepts overrides via a `strings` property (JS only, not an HTML attribute).

#### Default string table

| Key | Default (en) | Used in |
|---|---|---|
| `prev` | `"Previous step"` | Previous button `aria-label` |
| `next` | `"Next step"` | Next button `aria-label` |
| `finish` | `"Finish tour"` | Next button `aria-label` on last scene |
| `skip` | `"Skip tour"` | Skip button `aria-label` and text |
| `progress` | `"Step {n} of {total}"` | Progress counter text and `aria-live` |
| `tourLabel` | `"Interactive tour"` | Root `aria-roledescription` |
| `navLabel` | `"Experience navigation"` | Controls `aria-label` |

`{n}`, `{total}`, and `{title}` are interpolated at render time.

#### Overriding strings

```js
const el = document.querySelector('cloudimage-spotlight');
el.strings = {
  prev: "Étape précédente",
  next: "Étape suivante",
  finish: "Terminer",
  skip: "Passer",
  progress: "Étape {n} sur {total}",
  tourLabel: "Visite interactive",
  navLabel: "Navigation",
};
```

Partial overrides are merged with defaults — only the keys you provide are replaced.

> Setting `strings` triggers an immediate re-render of all visible UI text: progress counter, button labels, `aria-label` attributes, `aria-roledescription`, and the current image `alt` text. No `reload()` needed.

> See `CISStrings` interface definition in [Events > Typed event details](#typed-event-details-typescript).

### RTL support

The component respects `dir="rtl"` on the host element or any ancestor. When RTL is active:

| Aspect | LTR behavior | RTL behavior |
|---|---|---|
| Slide transition | Next slides left ← | Next slides right → |
| Previous / Next buttons | ← Prev \| Next → | → Prev \| Next ← |
| Annotation `position` | `left` = left side | `left` mirrors to `right` side |
| Keyboard `→` / `←` | → = Next, ← = Prev | → = Prev, ← = Next |

#### Implementation

The Shadow DOM stylesheet uses **CSS logical properties** throughout:

```css
/* Instead of: */
.cis-annotation { left: 16px; }

/* Use: */
.cis-annotation { inset-inline-start: 16px; }
```

Logical property mapping:
- `left` / `right` → `inset-inline-start` / `inset-inline-end`
- `margin-left` → `margin-inline-start`
- `padding-right` → `padding-inline-end`
- `text-align: left` → `text-align: start`

The `position: "auto"` algorithm accounts for `dir` when choosing the annotation quadrant.

RTL is detected via `getComputedStyle(this).direction` on `connectedCallback` and on `lang`/`dir` attribute changes.

---

## Bundle & Browser Support

### Output formats

| Format | File | Use case |
|---|---|---|
| ESM | `dist/index.esm.js` | Modern bundlers (Vite, webpack 5, Rollup) |
| IIFE | `dist/index.iife.js` | Direct `<script>` tag without a bundler |
| CJS | `dist/index.cjs.js` | Node.js / SSR (renders nothing, registers element) |

### Entry points

Following the pattern established by `@scaleflex/asset-picker`, the plugin provides three entry points:

| Entry | Import path | Side effect | Use case |
|---|---|---|---|
| Class + types | `@cloudimage/spotlight` | None | Manual registration, SSR, tree-shaking |
| Auto-register | `@cloudimage/spotlight/define` | Registers `<cloudimage-spotlight>` | Script tag, quick setup |
| React wrapper | `@cloudimage/spotlight/react` | None | React/Next.js integration |

```js
// Auto-register (side effect — defines the custom element)
import '@cloudimage/spotlight/define';

// Class + types only (no side effect — register manually)
import { CloudimageSpotlight } from '@cloudimage/spotlight';
customElements.define('cloudimage-spotlight', CloudimageSpotlight);

// React wrapper
import { CloudimageSpotlightReact } from '@cloudimage/spotlight/react';
```

### React wrapper

`src/react.ts` provides a `forwardRef` wrapper matching the `@scaleflex/asset-picker` pattern:

```typescript
import { forwardRef, useRef, useEffect, useImperativeHandle } from 'react';
import type { CloudimageSpotlightElement } from './index';

export interface CloudimageSpotlightProps {
  config?: string | SpotlightConfig;
  theme?: 'dark' | 'light' | 'auto';
  lang?: string;
  autoplay?: boolean;
  autoplayInterval?: number;
  showProgress?: boolean;
  allowSkip?: boolean;
  allowKeyboard?: boolean;
  syncUrl?: boolean;
  eager?: boolean;
  strings?: Partial<CISStrings>;
  onReady?: (detail: CISReadyDetail) => void;
  onSceneChange?: (detail: CISSceneChangeDetail) => void;
  onComplete?: (detail: CISCompleteDetail) => void;
  onSkip?: (detail: CISSkipDetail) => void;
  onCtaClick?: (detail: CISCTAClickDetail) => void;
  onError?: (detail: CISErrorDetail) => void;
  className?: string;
  style?: React.CSSProperties;
}

export const CloudimageSpotlightReact = forwardRef<
  CloudimageSpotlightElement,
  CloudimageSpotlightProps
>((props, ref) => { /* ... */ });
```

The wrapper:
- Maps React props to HTML attributes and JS properties
- Maps `cis:*` events to `on*` callback props via stable refs (no re-subscription on re-render)
- Exposes `next()`, `prev()`, `goTo()`, `goToId()`, `play()`, `pause()`, `reload()`, `destroy()` via `useImperativeHandle`
- SSR-safe: dynamically imports `@cloudimage/spotlight/define` in a `useEffect`

> **Next.js:** Use with `'use client'` directive. No `dynamic()` or `ssr: false` needed — the `useEffect`-based registration is inherently client-only.

### Public type exports

`src/index.ts` re-exports all public types for consumer use:

```typescript
// src/index.ts
export { CloudimageSpotlight } from './spotlight-element';
export type { CloudimageSpotlightElement } from './spotlight-element';

// Config types
export type {
  SpotlightConfig,
  SpotlightSettings,
  SpotlightScene,
  SpotlightRegion,
  SpotlightAnnotation,
  SpotlightCTA,
  CISStrings,
} from './types';

// Event detail types
export type {
  CISReadyDetail,
  CISSceneChangeDetail,
  CISCompleteDetail,
  CISSkipDetail,
  CISCTAClickDetail,
  CISRegionEnterDetail,
  CISErrorDetail,
  CISErrorCode,
} from './types';
```

### SSR safety

The component checks for `customElements` and `window` availability before registration:

```typescript
if (typeof window !== 'undefined' && typeof customElements !== 'undefined') {
  if (!customElements.get('cloudimage-spotlight')) {
    customElements.define('cloudimage-spotlight', CloudimageSpotlight);
  }
}
```

> The `customElements.get()` guard prevents `DOMException` if the script is loaded twice (common in micro-frontend setups). The first-loaded version wins.

In Next.js, use with `dynamic` and `ssr: false`, or wrap in a `useEffect` that dynamically imports the module.

### Target browsers

| Browser | Minimum version |
|---|---|
| Chrome / Edge | 73+ |
| Firefox | 101+ |
| Safari | 16.4+ |
| Samsung Internet | 17.0+ |
| Node.js (SSR) | No rendering; safe to import |

> Browser minimums raised from the original Custom Elements v1 targets to account for constructable stylesheets (`adoptedStyleSheets`). All target browsers have supported this since 2023.

No polyfills required for target browsers. The `@webcomponents/custom-elements` polyfill can be added by consumers who need IE11 support (not officially supported).

### Bundle size target

| Layer | Target gzipped size |
|---|---|
| Core runtime (no assets) | < 12 KB |
| With CSS | < 16 KB |
| Fonts / icons | Lucide icons (inline SVG, tree-shaken — only used icons are bundled) |

---

## Build Configuration

The build system follows patterns established by `@cloudimage/hotspot` (Vite) and `@scaleflex/asset-picker` (Vite 6 + library mode).

### Build tool

Vite with `build.lib` mode. Single entry point (unlike hotspot's four configs) since the plugin is a self-contained Web Component.

### Vite config

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'CloudimageSpotlight',
      formats: ['es', 'cjs', 'iife'],
      fileName: (format) => {
        if (format === 'es') return 'index.esm.js';
        if (format === 'cjs') return 'index.cjs.js';
        return 'index.iife.js';
      },
    },
    sourcemap: true,
    cssCodeSplit: false,   // Styles injected into Shadow DOM
    minify: 'esbuild',
    rollupOptions: {
      output: {
        assetFileNames: 'spotlight.[ext]',
      },
    },
  },
});
```

### Demo Vite config

```typescript
// vite.demo.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
  root: 'demo',
  build: {
    outDir: '../demo-dist',
    emptyOutDir: true,
  },
});
```

### Target package.json

```json
{
  "name": "@cloudimage/spotlight",
  "version": "1.0.0",
  "description": "CDN-native screenshot-based interactive experience player",
  "main": "dist/index.cjs.js",
  "module": "dist/index.esm.js",
  "unpkg": "dist/index.iife.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.esm.js",
      "require": "./dist/index.cjs.js",
      "types": "./dist/index.d.ts"
    },
    "./define": {
      "import": "./dist/define.esm.js",
      "require": "./dist/define.cjs.js"
    },
    "./react": {
      "import": "./dist/react.esm.js",
      "require": "./dist/react.cjs.js",
      "types": "./dist/react.d.ts"
    }
  },
  "files": ["dist"],
  "sideEffects": ["./dist/define.*"],
  "scripts": {
    "dev": "vite --config vite.demo.config.ts",
    "build": "vite build",
    "build:demo": "vite build --config vite.demo.config.ts",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "lint": "eslint src/ tests/ --ext .ts"
  },
  "keywords": ["cloudimage", "spotlight", "web-component", "interactive", "tour", "cdn"],
  "license": "MIT"
}
```

> `sideEffects: ["./dist/define.*"]` marks only the auto-register entry point as having side effects. The main entry (`@cloudimage/spotlight`) and React wrapper are side-effect-free, enabling tree-shaking. This matches the `@scaleflex/asset-picker` pattern.

### CDN delivery URLs

```
Versioned:  https://scaleflex.cloudimg.io/v7/plugins/cloudimage/spotlight/{version}/spotlight.min.js
```

> No `latest` alias is provided. Always pin to a specific version to avoid unexpected breaking changes.

### Dependencies

**One runtime dependency: `lucide` (icons).** All other functionality — SVG masking, annotation positioning, transitions, config validation — is implemented internally. Lucide icons are imported as inline SVG functions and tree-shaken — only the icons actually used are included in the bundle (typically ~1 KB for the set: chevron-left, chevron-right, x, skip-forward).

Dev dependencies:

```json
{
  "devDependencies": {
    "typescript": "^5.5.0",
    "vite": "^6.0.0",
    "vitest": "^3.0.0",
    "@testing-library/dom": "^10.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "jsdom": "^25.0.0",
    "eslint": "^9.0.0",
    "@typescript-eslint/eslint-plugin": "^8.0.0",
    "@typescript-eslint/parser": "^8.0.0"
  }
}
```

---

## Testing Strategy

Test infrastructure follows `@cloudimage/hotspot` (Vitest + jsdom, 243 tests across 18 files).

### Config

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.ts'],
    setupFiles: ['tests/setup.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },
  },
});
```

### Test file structure

```
tests/
├── setup.ts                    # jsdom setup, custom matchers
├── url-builder.test.ts         # Pure function tests — highest priority
├── config-loader.test.ts       # fetch mock, validation, error codes
├── config-validator.test.ts    # Schema validation edge cases
├── spotlight-element.test.ts   # Web Component lifecycle
├── scene-navigation.test.ts    # next/prev/goTo/goToId behavior
├── svg-mask.test.ts            # Mask rendering, region cut-outs
├── transitions.test.ts         # Fade/slide/zoom class swaps
├── keyboard.test.ts            # Keyboard navigation
├── accessibility.test.ts       # ARIA attributes, focus management
├── autoplay.test.ts            # Play/pause/interval logic
├── events.test.ts              # All custom events and payloads
├── responsive.test.ts          # ResizeObserver, mobile breakpoint
├── lazy-loading.test.ts        # IntersectionObserver deferral
└── destroy.test.ts             # Cleanup, idempotency
```

### Testing priorities

| Priority | Area | Why first |
|---|---|---|
| 1 | `url-builder.ts` | Pure functions, no DOM. All variants (full, zoomed, blurred), edge cases (0-width regions, DPR), error paths. |
| 2 | Config validation | All error codes, version warnings, region coordinate validation, duplicate IDs. |
| 3 | Web Component lifecycle | `connectedCallback`, `disconnectedCallback`, attribute changes, `destroy()`, `reload()`. |
| 4 | Navigation + events | Scene transitions, event payloads, edge cases (single scene, last-scene next). |
| 5 | Rendering | SVG mask generation, annotation positioning, responsive layout, blur mode. |

---

## Development

### Dev server

```bash
npm run dev    # Starts Vite dev server with demo page at localhost:5173
```

### Demo page structure

```
demo/
├── index.html          # Main demo page with sidebar nav
├── demo.ts             # Demo initialization, config examples
├── demo.css            # Demo page styling
└── configs/            # Sample JSON configs for testing
    ├── minimal.json
    ├── full-example.json
    ├── single-scene.json
    ├── multi-region.json
    └── blur-mode.json
```

The demo page should include:
- Inline JSON config embed for instant testing (no fetch delay)
- Theme toggle (dark / light)
- Live config editor panel (edit JSON → see updates)
- Multiple embed examples at different sizes and settings
- Mobile viewport simulation

Reference `../../scaleflex/asset-picker/demo/` for demo page patterns: sidebar navigation, auth UI, hash-based routing, docs integration, and GitHub Pages deployment.

### Debugging CDN URLs

Append `ci_info=1` to any generated Cloudimage URL to inspect how the image was processed:

```
https://token.cloudimg.io/example.com/image.jpg?func=crop&tl_px=1190,86&br_px=1882,475&w=800&dpr=2&ci_info=1
```

This returns metadata about the applied transformations (crop bounds, output dimensions, format, compression). Useful during development to verify that region coordinates and DPR scaling produce the expected results.

The demo page should include a "Debug URLs" toggle that appends `ci_info=1` to all generated image URLs and displays the responses in a panel.

### Build commands

| Command | Description |
|---|---|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Build production bundle (ESM + CJS + IIFE) |
| `npm run build:demo` | Build demo page for GitHub Pages → `demo-dist/` |
| `npm run test` | Run tests once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run typecheck` | TypeScript type checking (no emit) |
| `npm run lint` | ESLint on `src/` and `tests/` |

---

## Integration with Spotlight (Authoring)

> **Scope note:** This section describes what the Spotlight dashboard needs to support this plugin. The plugin itself is independent — it only consumes the JSON config.

### New experience type in Spotlight

The dashboard needs a new experience type: **"Spotlight Tour"** (working name). The authoring flow:

```
1. Create new experience → select "Spotlight Tour"
2. Upload or select screenshot images from the DAM
3. For each image, define scenes:
   a. Add annotation (title + description)
   b. Optionally draw a region on the image (drag to select)
   c. Toggle mask / zoom options
4. Configure experience settings (transition, autoplay, etc.)
5. Preview in embedded player
6. Publish → generates JSON config hosted on Cloudimage CDN
7. Copy embed snippet → paste into any webpage
```

### Region drawing editor (Spotlight dashboard)

The editor for step 3b is a rectangle-drag overlay on the screenshot image. Implementation recommendation: use `marker.js 2` or `Annotorious` as the base, stripped to rectangle drawing only.

Output: normalized 0–1 coordinates stored in the scene JSON.

### Config loading

The plugin performs a simple `fetch()` for URL-based configs. No `sessionStorage` caching — that concern belongs to Spotlight via `Cache-Control` headers on the published config JSON. The plugin is stateless with respect to caching.

> The `fetch()` call uses the browser default `mode: 'cors'` and `credentials: 'omit'` (no cookies sent to the config CDN). If the config JSON is hosted on a different origin than the embedding page, the server must include `Access-Control-Allow-Origin` headers. Cloudimage CDN serves these headers by default.

```typescript
async function loadConfig(url: string, signal?: AbortSignal): Promise<SpotlightConfig> {
  const res = await fetch(url, { signal });
  if (!res.ok) throw new CISError("FETCH_FAILED", `Failed to load config: ${res.status} ${url}`);
  const json = await res.json().catch(() => {
    throw new CISError("INVALID_JSON", `Config at ${url} is not valid JSON`);
  });
  return validateConfig(json);
}

function validateConfig(raw: unknown): SpotlightConfig {
  if (typeof raw !== 'object' || raw === null) throw new CISError("INVALID_JSON", "Config must be a JSON object");
  const config = raw as Record<string, unknown>;
  if (config.version !== "1.0") {
    console.warn(`[cloudimage-spotlight] Unknown config version "${config.version}". Attempting best-effort render.`);
  }
  if (!config.ciToken) throw new CISError("MISSING_TOKEN", "'ciToken' is required in config JSON");
  if (!Array.isArray(config.scenes) || config.scenes.length === 0) {
    throw new CISError("INVALID_JSON", "'scenes' must be a non-empty array");
  }
  // Validate unique scene IDs
  const ids = (config.scenes as SpotlightScene[]).map(s => s.id);
  if (new Set(ids).size !== ids.length) {
    throw new CISError("INVALID_JSON", "Duplicate scene IDs found");
  }
  // Validate region coordinates
  for (const scene of config.scenes as SpotlightScene[]) {
    for (const region of scene.regions ?? []) {
      if (region.tl_x < 0 || region.tl_y < 0 || region.br_x > 1 || region.br_y > 1) {
        throw new CISError("INVALID_REGION", `Scene "${scene.id}": region coordinates must be between 0 and 1`);
      }
      if (region.tl_x >= region.br_x || region.tl_y >= region.br_y) {
        throw new CISError("INVALID_REGION", `Scene "${scene.id}": region tl must be less than br`);
      }
    }
  }
  // Validate metadata values are strings
  for (const scene of config.scenes as SpotlightScene[]) {
    if (scene.metadata) {
      for (const [key, val] of Object.entries(scene.metadata)) {
        if (typeof val !== 'string') {
          console.warn(`[cloudimage-spotlight] Scene "${scene.id}": metadata.${key} is not a string, coercing`);
          (scene.metadata as Record<string, string>)[key] = String(val);
        }
      }
    }
  }
  return config as SpotlightConfig;
}
```

---

*Spec v0.4 — all design decisions resolved, implementation-ready. Start with `src/url-builder.ts` (pure functions, no DOM dependency, fully unit-testable), then the Web Component scaffold, then the SVG overlay engine.*
