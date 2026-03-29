# Changelog

## 1.0.1 (2026-03-29)

First public release.

### Features

- **Web Component** (`<cloudimage-spotlight>`) with Shadow DOM and constructable stylesheets
- **CDN-only zoom** via Cloudimage `func=crop` with `tl_px`/`br_px` percentage coordinates, DPR-aware (1-3x)
- **SVG mask overlay** with region cut-outs, numbered badges, and pulse highlights
- **Blur mask mode** — blurred full image with sharp region reveal via CSS clip-path
- **Annotation cards** with auto-positioning (top/bottom/left/right/auto), CTA buttons, and connector lines
- **Scene transitions** — fade, slide, zoom with `prefers-reduced-motion` support
- **Autoplay** with visibility-aware pause/resume and play/pause button
- **Keyboard navigation** — Arrow keys, Home/End, 1-9 jump, Escape to skip, full RTL support
- **Deep linking** — hash-based URL sync (`#id:sceneId` or `#cis-sceneId`)
- **Responsive layout** — mobile bottom-sheet annotations below `--cis-mobile-breakpoint` (600px)
- **Intro/outro screens** — optional welcome overlay and completion screen with scene navigation (grid/list)
- **Staggered scene entry** — overlays animate in sequentially after image load
- **Fullscreen** via Fullscreen API with toggle button
- **Lazy loading** via IntersectionObserver (opt out with `eager` attribute)
- **React wrapper** — `forwardRef` component with typed props, events, and SSR-safe custom element registration
- **Three entry points** — `index` (exports), `define` (side-effect registration), `react` (wrapper)
- **i18n** — full string table with interpolation, overridable via `strings` property
- **OKLCH color system** — `--cis-*` CSS custom properties with dark/light/auto theming
- **Print stylesheet** — clean single-page print layout
- **Content security** — CTA href sanitization (blocks javascript:/data:/blob: schemes)
- **Zero runtime dependencies** — 23 KB gzip (ESM + CSS), 0.96 KB gzip (React wrapper)
