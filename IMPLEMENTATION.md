# cloudimage-spotlight — Implementation Plan

> **Status:** Pre-implementation
> **Spec version:** v0.5 (1880 lines, 20 sections)
> **Stages:** 12
> **Pattern references:** `@cloudimage/hotspot` (build/test), `@scaleflex/asset-picker` (Web Component/React)

---

## Stage Overview

| Stage | Focus | Key Deliverable | Dependencies |
|---|---|---|---|
| 1 | Project scaffolding + types | Vite build, Vitest, all TypeScript interfaces, 3 entry point stubs | — |
| 2 | URL builder + config loader | Pure functions: `buildCiUrl()` all 3 variants, `validateConfig()`, all error codes | 1 |
| 3 | Web Component scaffold | Shadow DOM, constructable stylesheets, config loading (URL/inline/property), lazy loading gate | 2 |
| 4 | Scene rendering + navigation | Images in stage, next/prev/goTo, progress counter, all navigation events | 3 |
| 5 | SVG mask + badges | Spotlight overlay with region cut-outs, numbered badges, region highlights with pulse | 4 |
| 6 | Zoom + blur + annotations | CDN zoom images, blur mask mode, annotation cards with CTA + auto-positioning | 5 |
| 7 | Transitions + autoplay + loading | Fade/slide/zoom transitions, autoplay with visibility handling, skeleton loading state | 6 |
| 8 | Keyboard + accessibility | Full keyboard nav, ARIA roles, focus management, RTL support | 7 |
| 9 | Deep linking | Hash-based deep linking, `sync-url` | 7 |
| 10 | Responsive + mobile + lifecycle | Bottom-sheet mobile layout, `destroy()`/`reload()`, ResizeObserver | 8, 9 |
| 11 | React wrapper | `forwardRef` wrapper, SSR-safe, typed props/events/ref | 10 |
| 12 | Demo + integration tests + docs | Demo page, integration tests, README, bundle size verification, release prep | 11 |

### Dependency Graph

```
Stage 1  (Scaffold + Types)
  │
  ▼
Stage 2  (URL Builder + Config Loader)
  │
  ▼
Stage 3  (Web Component Lifecycle + Shadow DOM)
  │
  ▼
Stage 4  (Scene Rendering + Navigation)
  │
  ▼
Stage 5  (SVG Mask + Badges)
  │
  ▼
Stage 6  (Zoom + Blur + Annotations)
  │
  ▼
Stage 7  (Transitions + Autoplay + Loading)
  │
  ├───────────┐
  ▼           ▼
Stage 8     Stage 9
(Keyboard)  (Deep Link)
  │           │
  └─────┬─────┘
        ▼
Stage 10 (Responsive + Mobile + Destroy/Reload)
  │
  ▼
Stage 11 (React Wrapper + Entry Points)
  │
  ▼
Stage 12 (Demo + Integration Tests + Docs + Release)
```

Stages 1–4 are strictly sequential. After Stage 7, Stages 8 and 9 can be parallelized. Stage 11 (React) could start after Stage 4 but benefits from the full feature set.

---

## Stage 1: Project Scaffolding, Build Pipeline, and Type Definitions

**Goal:** Replace the placeholder setup with a production-grade build toolchain. Establish all TypeScript interfaces so subsequent stages have a stable type foundation.

### Files to create/modify

| File | Action | Description |
|------|--------|-------------|
| `package.json` | Rewrite | Name `@cloudimage/spotlight`. Add vite, vitest, jsdom, eslint, typescript devDeps. Define all npm scripts. Set up `exports` map with three entry points (`.`, `./define`, `./react`). Set `main`, `module`, `unpkg`, `types`, `files`, `sideEffects`. |
| `tsconfig.json` | Rewrite | Target ES2020, module ESNext, moduleResolution bundler, strict, declaration, dom/dom.iterable libs. |
| `vite.config.ts` | Create | Library mode: entry `src/index.ts`, formats `['es', 'cjs', 'iife']`, fileName mapping. `cssCodeSplit: false`, sourcemap, esbuild minify. |
| `vite.demo.config.ts` | Create | App mode targeting `demo/index.html` → `demo-dist/`. |
| `vitest.config.ts` | Create | jsdom environment, setup file, V8 coverage with 80% thresholds. |
| `.eslintrc.cjs` | Create | TypeScript-eslint recommended rules. |
| `src/types.ts` | Create | All TypeScript interfaces: `SpotlightConfig`, `SpotlightSettings`, `SpotlightScene`, `SpotlightRegion`, `SpotlightAnnotation`, `SpotlightCTA`, `CISStrings`, `SceneImageVariant`, event detail types, `CISErrorCode`, `CISError` class, `CloudimageSpotlightElement` interface, `HTMLElementEventMap` augmentation. |
| `src/index.ts` | Rewrite | Stub `CloudimageSpotlight` class extending `HTMLElement` with `observedAttributes` and empty lifecycle methods. Re-export all types. |
| `src/define.ts` | Create | Side-effect entry: SSR-safe `customElements.define()` with `customElements.get()` guard. |
| `tests/setup.ts` | Create | jsdom setup, global mocks for `CSSStyleSheet` (constructable stylesheets not available in jsdom). |
| `tests/types.test.ts` | Create | Type-level validation: ensure interfaces compile, config shapes conform. |

### Acceptance criteria

- `npm install` succeeds
- `npm run build` produces three bundle files in `dist/`
- `npm run typecheck` passes
- `npm test` runs and passes (stub tests)
- Importing `@cloudimage/spotlight` in ESM and CJS both work
- `@cloudimage/spotlight/define` registers the custom element in jsdom

---

## Stage 2: URL Builder — All CDN Variants

**Goal:** Implement the complete Cloudimage URL builder as pure functions with zero DOM dependencies. This is the core technical differentiator and the highest-priority testing target.

### Files to create/modify

| File | Action | Description |
|------|--------|-------------|
| `src/url-builder.ts` | Create | `buildCiUrl()` handling all three variants: `full`, `zoomed`, `blurred`. Helpers: `stripProtocol()` (with `encodeURI`), `toPercent()` (normalized 0–1 → `"62p"` format), `roundWidth()` (nearest 100px for CDN cache hits), `getRegionsBoundingBox()`. Native `dpr` param (clamped 1–3). `org_if_sml=1` on all URLs. |
| `src/config-loader.ts` | Create | `loadConfig(url, signal)` with `AbortSignal`. `validateConfig(raw)` with: version check (warn on unknown), `ciToken` required, `scenes` non-empty, unique scene IDs, region coordinate validation (0–1 range, tl < br), metadata string coercion. `CISError` class. |
| `src/validation.ts` | Create | `validateSceneImage(image, ciToken)`, CTA href sanitization (allow `https://`, `http://`, `/`; block `javascript:`, `data:`, `vbscript:`, `blob:`). |
| `tests/url-builder.test.ts` | Create | All five variants with expected URLs. Edge cases: zero-width regions, DPR clamping, width rounding, multi-region bounding box, padding, `toPercent` precision, `stripProtocol` with special chars. |
| `tests/config-loader.test.ts` | Create | Fetch mock (success, 404, network error, invalid JSON). All error codes. Version warning path. Duplicate scene IDs. |
| `tests/config-validator.test.ts` | Create | Region coordinate edge cases (exact 0/1, negative, >1, tl >= br). Metadata coercion. CTA href sanitization. |

### Acceptance criteria

- `buildCiUrl('example.com/img.jpg', 'demo', 'full', undefined, 800, 2)` → `https://demo.cloudimg.io/example.com/img.jpg?w=800&dpr=2&q=85&org_if_sml=1`
- `buildCiUrl(..., 'zoomed', [region], 800, 1, undefined, 1920, 1080)` → URL with `func=crop&tl_px=1152,65&br_px=1920,497`
- `buildCiUrl(..., 'blurred', ...)` → URL with `blur={blurRadius}`
- `validateConfig` throws correct `CISError` for each invalid input
- 100% branch coverage on `url-builder.ts` and `config-loader.ts`

### Risk: Cloudimage `tl_px`/`br_px` percentage params

The `tl_px=62p,8p` format must be verified against the live CDN before proceeding. Build a manual test URL and check with `ci_info=1`. If percentages are not supported, fall back to pixel conversion using the image's natural dimensions (requires an initial HEAD request or waiting for the image to load).

---

## Stage 3: Web Component Scaffold — Lifecycle, Config Loading, Shadow DOM Shell

**Goal:** Build the real `CloudimageSpotlight` custom element with full lifecycle management, config loading from three sources, constructable stylesheet injection, and the basic Shadow DOM structure.

### Files to create/modify

| File | Action | Description |
|------|--------|-------------|
| `src/spotlight-element.ts` | Create | `CloudimageSpotlight` class. `observedAttributes` (12 attrs). `connectedCallback`: attach Shadow DOM, inject constructable stylesheet, determine config source (JS property > inline JSON > URL), init `AbortController`, parse attributes, lazy loading gate (IntersectionObserver vs `eager` vs deep-link hash). `disconnectedCallback`: tear down observers, cancel fetches, pause autoplay, remove window listeners (`hashchange`, `visibilitychange`), preserve Shadow DOM. `attributeChangedCallback`: reactive updates. `_initialized` flag for reconnection. Instance ID for SVG mask uniqueness. |
| `src/styles/spotlight.css` | Create | `:host` display block, all `--cis-*` custom properties, `.cis-root` container, light theme override, auto theme `@media (prefers-color-scheme)`, print stylesheet, reduced motion. Import via Vite `?inline`. |
| `src/i18n.ts` | Create | Default English string table (`CISStrings`), `interpolate(template, vars)` helper. |
| `src/index.ts` | Modify | Export `CloudimageSpotlight` from `spotlight-element.ts`, re-export all types. |
| `src/define.ts` | Modify | Import actual `CloudimageSpotlight` class. |
| `tests/spotlight-element.test.ts` | Create | Registration, `connectedCallback`, Shadow DOM attached, constructable stylesheet applied, config attribute triggers fetch, inline JSON parsing, JS property setting, `disconnectedCallback` cleanup, attribute reactivity, reconnection preserves state. |
| `tests/lazy-loading.test.ts` | Create | IntersectionObserver mock: deferred init, `eager` bypass, deep link hash bypass, observer cleanup. |

### Acceptance criteria

- `<cloudimage-spotlight>` creates Shadow DOM, applies styles, loads config from any source
- Invalid inline JSON dispatches `cis:error`, does NOT fall back to URL
- `disconnectedCallback` cancels AbortController, `connectedCallback` resumes state
- Constructable stylesheet singleton shared across instances (mocked in tests)

### Risk: `adoptedStyleSheets` in jsdom

jsdom does not support constructable stylesheets. Mock `CSSStyleSheet` constructor and `shadowRoot.adoptedStyleSheets` in `tests/setup.ts`.

---

## Stage 4: Scene Rendering — Images, Navigation State Machine, Controls

**Goal:** Render scenes with images inside the stage. Implement the full navigation state machine and progress counter. The component becomes visually functional.

### Files to create/modify

| File | Action | Description |
|------|--------|-------------|
| `src/scene-renderer.ts` | Create | `renderScene(scene, config, containerWidth, dpr)`: creates `<img class="cis-image cis-image--base">`, sets `src` via `buildCiUrl('full')`, generates alt text, handles image load/error events. Resolution warning (`naturalWidth < 1920`). Image error: dispatch `cis:error` with `IMAGE_LOAD_FAILED`, render fallback, allow navigation. |
| `src/navigation.ts` | Create | State machine: `next()`, `prev()`, `goTo(index)`, `goToId(id)`. Tracks `currentIndex`, `totalScenes`, `isPlaying`, `currentScene`. Dispatches `cis:scene-change`. Edge cases: single-scene, last-scene `next()` → `cis:complete`, out-of-range no-op. Bidirectional preloading (N+1 and N−1). |
| `src/spotlight-element.ts` | Modify | Wire config loading → scene rendering → navigation. Build controls bar: prev/next/skip buttons, progress counter (`aria-live="polite"`). Dispatch `cis:ready` after first image. Wire public methods. |
| `src/styles/spotlight.css` | Modify | `.cis-stage` layout, `.cis-image` styles, `.cis-controls` bar, `.cis-btn` variants, `.cis-progress` counter. |
| `tests/scene-navigation.test.ts` | Create | Forward/backward, goTo/goToId, single-scene, last-scene complete, out-of-range no-op, event payloads. |
| `tests/events.test.ts` | Create | All events: `cis:ready`, `cis:scene-change`, `cis:complete` (with `timeSpent`), `cis:skip`, `cis:error`. Bubble + composed. |

### Acceptance criteria

- Config with 3 scenes shows first scene image
- `next()` changes to scene 2, dispatches `cis:scene-change { from: 0, to: 1 }`
- `prev()` on scene 0 is no-op
- `next()` on last scene dispatches `cis:complete`
- Progress shows "Step 1 of 3", updates on navigation
- Image load failure renders fallback, does not block navigation
- Visually: basic image carousel with nav bar. No mask, zoom, or annotations yet.

---

## Stage 5: SVG Mask Overlay Engine and Region Badges

**Goal:** Implement the SVG mask that creates the spotlight effect — the visual signature of the plugin. Also implement region highlights and numbered badges.

### Files to create/modify

| File | Action | Description |
|------|--------|-------------|
| `src/svg-mask.ts` | Create | `createMask(instanceId, sceneId, regions, maskOpacity, maskColor)`: SVG with `viewBox="0 0 1 1"`, `preserveAspectRatio="none"`. `<mask>` with white rect + black rect/ellipse cut-outs per region. Overlay rect via `url(#cis-mask-{instanceId}-{sceneId})`. Supports `rect` and `ellipse` shapes. |
| `src/region-highlights.ts` | Create | `<div class="cis-region-highlight">` positioned with percentage left/top/width/height. Pulse animation on scene entry. |
| `src/badges.ts` | Create | `<span class="cis-badge">` at region top-left. Uses `region.label` or auto-numbers 1, 2, 3. All text via `textContent`. |
| `src/scene-renderer.ts` | Modify | Integrate mask, highlights, badges. Conditional on `scene.mask` (default true when regions present). |
| `src/styles/spotlight.css` | Modify | `.cis-mask`, `.cis-region-highlight` with pulse keyframe, `.cis-badge` circular labels, z-index stack (+0 image, +1 mask, +2 highlight, +3 badge). |
| `tests/svg-mask.test.ts` | Create | SVG generation, single/multiple cut-outs, ellipse, instance-unique IDs, no mask when no regions. |

### Acceptance criteria

- Scene with regions shows darkened overlay with transparent cut-outs
- Numbered badges at region corners
- Ellipse regions produce `<ellipse>` in SVG
- Multiple instances on one page: no SVG ID collisions
- Scene with `mask: false` or no regions: no overlay

### Risk: SVG `url(#id)` resolution in Shadow DOM

Some browsers resolve SVG `url(#id)` from the document root, not the shadow root. Instance-unique IDs (`cis-mask-{instanceId}-{sceneId}`) mitigate this. Test with multiple instances sharing the same config.

---

## Stage 6: CDN Zoom, Blur Mask Mode, and Annotation Cards

**Goal:** Implement the three remaining visual layers: CDN-zoomed images, blur mask variant, and annotation cards with CTA and auto-positioning.

### Files to create/modify

| File | Action | Description |
|------|--------|-------------|
| `src/scene-renderer.ts` | Modify | Zoom: second `<img class="cis-image--zoomed">` via `buildCiUrl('zoomed')`. Blur mode: `cis-image--blurred` (CDN `?blur=`) + `cis-image--sharp` (clipped to regions via `clip-path`). No SVG mask in blur mode. No-region fallback: skip blur, log `console.warn`. |
| `src/annotation.ts` | Create | `.cis-annotation` card with title, body, optional CTA. Renders only if title/description/cta present. `textContent` only. CTA href validation. `rel="noopener noreferrer"`. CTA without `href` dispatches `cis:cta-click`. |
| `src/auto-position.ts` | Create | Annotation `position: "auto"`: render off-screen to measure, evaluate 6 positions, select best fit. RTL-aware. Fallback: `bottom-center`. |
| `src/styles/spotlight.css` | Modify | `.cis-annotation` card (glassmorphism), 6 position variants (CSS logical properties for RTL), `.cis-cta` button, zoom/blur image layers, z-index +4 for annotation. |
| `tests/annotation.test.ts` | Create | Card render, CTA as link/button, `cis:cta-click`, auto-positioning, href sanitization. |

### Acceptance criteria

- `zoom: true` produces base + zoomed `<img>` with `func=crop` URL
- Blur mode: blurred + sharp layers, no SVG mask
- Blur with no regions: sharp image only, `console.warn`
- CTA with `javascript:` href stripped
- Annotation auto-position selects best quadrant

### Risk: Blur mode clip-path performance

CSS `clip-path` with multiple regions can be slow. Benchmark in demo. CDN-side blur is cached at edge.

---

## Stage 7: Transitions, Autoplay, and Loading States

**Goal:** Add scene-to-scene transitions, autoplay with visibility handling, and the skeleton loading state.

### Files to create/modify

| File | Action | Description |
|------|--------|-------------|
| `src/transitions.ts` | Create | CSS-class-swap transitions via `requestAnimationFrame`. Fade (300ms), slide (350ms, direction-aware), zoom (400ms). Respects `prefers-reduced-motion`. Cross-mode guard (blur ↔ color: atomic scene units). Transition flag suppresses ResizeObserver URL rebuilds. |
| `src/autoplay.ts` | Create | `play()`, `pause()`, interval from config/attribute. Pauses on `visibilityState === 'hidden'`, resumes on visible. Stops at last scene → `cis:complete`, does not loop. Does not reflect to `autoplay` attribute. |
| `src/loading.ts` | Create | Three states: config loading → image loading → ready. Skeleton markup. `.cis-loading` class on `.cis-root`. Skeleton removed on `cis:ready`. |
| `src/spotlight-element.ts` | Modify | Integrate transitions, autoplay, loading. `ResizeObserver` on `.cis-root` (debounced 100ms, suppressed during transitions). |
| `src/styles/spotlight.css` | Modify | Transition classes, skeleton shimmer animation, reduced-motion override. |
| `tests/transitions.test.ts` | Create | Class swap sequence, reduced motion bypass, transition guard. |
| `tests/autoplay.test.ts` | Create | Interval advance, visibility pause/resume, stop at last scene. |

### Acceptance criteria

- Navigation triggers correct transition classes
- `prefers-reduced-motion` → instant cut
- Autoplay advances, pauses on hidden tab, stops at end
- Skeleton shows during config loading, removed on `cis:ready`
- ResizeObserver suppressed during transitions

---

## Stage 8: Keyboard Navigation, Accessibility, and Focus Management

**Goal:** Full WCAG 2.1 AA accessibility: keyboard controls, ARIA, focus management, RTL.

### Files to create/modify

| File | Action | Description |
|------|--------|-------------|
| `src/keyboard.ts` | Create | →/Space = next, ← = prev, Esc = skip, Home/End, 1–9 jump. Active only when focused. RTL-aware. |
| `src/a11y.ts` | Create | `tabindex="0"`, `role="region"`, `aria-label`, `aria-roledescription`, `aria-live` on progress, `aria-disabled` on prev at scene 0, image alt generation. |
| `src/spotlight-element.ts` | Modify | Integrate keyboard, ARIA setup/updates, `allow-keyboard` attribute. |
| `src/styles/spotlight.css` | Modify | `:focus-visible` styles with `--cis-focus-ring-*` vars. |
| `tests/keyboard.test.ts` | Create | All key bindings, RTL reversal, `allow-keyboard="false"`. |
| `tests/accessibility.test.ts` | Create | ARIA attributes, `aria-live` updates, `aria-disabled`, `tabindex`, alt text. |

### Acceptance criteria

- Full keyboard navigation works
- RTL: ←/→ keys swap
- All ARIA roles and attributes present
- Screen reader announces scene changes via `aria-live`

---

## Stage 9: Deep Linking and URL Sync

**Goal:** Hash-based deep linking and `sync-url`.

### Files to create/modify

| File | Action | Description |
|------|--------|-------------|
| `src/deep-link.ts` | Create | Parse `window.location.hash` for `#cis-{sceneId}` or `#{elementId}:{sceneId}`. Jump to match; warn + scene 0 if not found. `sync-url`: update via `history.replaceState()`. Listen `hashchange`. Clear hash on complete/skip. Deep link overrides lazy loading. |
| `src/spotlight-element.ts` | Modify | Integrate deep linking (check hash after config loads). |
| `tests/deep-link.test.ts` | Create | Hash parsing, scene jump, unknown ID warning, `replaceState`, `hashchange`, multi-instance namespace, lazy loading bypass, hash cleanup. |

### Acceptance criteria

- `#cis-smart-tags` in URL jumps to that scene on init
- `sync-url` updates hash via `replaceState`
- Deep link bypasses lazy loading

---

## Stage 10: Responsive Behavior, Mobile Bottom-Sheet, and Destroy/Reload

**Goal:** Mobile layout, bottom-sheet annotations, and lifecycle methods.

### Files to create/modify

| File | Action | Description |
|------|--------|-------------|
| `src/responsive.ts` | Create | `ResizeObserver` check against `--cis-mobile-breakpoint` (600px). Toggle `.cis-root--mobile`. Desktop: floating annotation. Mobile: bottom-sheet (annotation + controls in `.cis-bottom-sheet`). |
| `src/spotlight-element.ts` | Modify | `destroy()`: remove all listeners, cancel fetches/timers/rAF, clear Shadow DOM, `_destroyed` flag. `reload(config?)`: reset to scene 0, re-fetch if no config, reject with `CISError` on failure. |
| `src/styles/spotlight.css` | Modify | `.cis-root--mobile`, `.cis-bottom-sheet` styles, progress dots for mobile. |
| `tests/responsive.test.ts` | Create | Mobile breakpoint toggle, bottom-sheet layout. |
| `tests/destroy.test.ts` | Create | `destroy()` clears DOM, methods no-op, `reload()` resets, destroy before IO fires, idempotent destroy. |

### Acceptance criteria

- Container < 600px triggers bottom-sheet layout
- `destroy()` fully cleans up, subsequent calls are no-ops
- `reload()` re-fetches and resets
- `destroy()` before lazy load: observer disconnected, no late init

---

## Stage 11: React Wrapper and Entry Point Polish

**Goal:** React `forwardRef` wrapper, finalize all three entry points, SSR safety.

### Files to create/modify

| File | Action | Description |
|------|--------|-------------|
| `src/react.ts` | Create | `CloudimageSpotlightReact` forwardRef. Maps props → attrs/properties. Maps `cis:*` → `on*` callbacks via stable refs. `useImperativeHandle` for public methods. SSR-safe: dynamic import of `define` in `useEffect`. |
| `src/index.ts` | Finalize | Clean re-exports: class, element interface, all config types, all event detail types. |
| `src/define.ts` | Finalize | SSR-safe registration with guard. |
| `vite.react.config.ts` | Create | Library mode for React entry: externalize `react`/`react-dom`. |
| `tests/react.test.tsx` | Create | Render, ref API, event callbacks, unmount cleanup, SSR import safety. |

### Acceptance criteria

- `<CloudimageSpotlightReact config={...} onReady={fn} />` works
- Ref exposes `next()`, `prev()`, `goTo()`, etc.
- SSR import does not throw
- Tree-shaking: `@cloudimage/spotlight` does not pull in React

---

## Stage 12: Demo Site, Integration Tests, Documentation, and Release Prep

**Goal:** Demo page, integration tests, README, bundle size verification, release preparation.

### Files to create/modify

| File | Action | Description |
|------|--------|-------------|
| `demo/index.html` | Create | Main demo page with sidebar nav, multiple embed examples. |
| `demo/demo.ts` | Create | Theme toggle, live config editor, debug URLs toggle (`ci_info=1`). |
| `demo/demo.css` | Create | Demo page styling. |
| `demo/configs/*.json` | Create | `minimal.json`, `full-example.json`, `single-scene.json`, `multi-region.json`, `blur-mode.json`. |
| `tests/integration.test.ts` | Create | Full flow: load → render → navigate → mask → zoom → skip → events → destroy. Multiple instances. |
| `tests/edge-cases.test.ts` | Create | Zero scenes error, single scene, 50+ scenes, empty regions, rapid navigation, double destroy, attribute change during transition, concurrent reload. |
| `README.md` | Create | Installation, usage (script tag + npm), API, config schema, CSS vars, events, React, a11y, browser support. |
| `LICENSE` | Create | MIT. |

### Acceptance criteria

- `npm run dev` starts demo server
- `npm run build:demo` produces static site in `demo-dist/`
- Full integration test passes
- Bundle sizes: ESM < 12 KB gzip (core), < 16 KB with CSS
- `npm run typecheck` and `npm run lint` clean
- All tests pass with > 80% coverage
- Package ready for `npm publish` and CDN deployment

---

## Risk Register

| Risk | Stage | Severity | Mitigation |
|------|-------|----------|------------|
| `tl_px`/`br_px` percentage format (`62p`) not supported by Cloudimage | 2 | **Mitigated** | Confirmed `p` suffix does not work. Fixed: pixel conversion using image natural dimensions from base image `load` event. Two-phase preloading restores prefetch of zoomed URLs. |
| `adoptedStyleSheets` not available in jsdom | 3 | Medium | Mock `CSSStyleSheet` constructor and `shadowRoot.adoptedStyleSheets` in `tests/setup.ts`. |
| SVG `url(#id)` resolving from document root in some browsers | 5 | Medium | Instance-unique IDs (`cis-mask-{instanceId}-{sceneId}`). Test with multiple instances. |
| Auto-positioning algorithm complexity | 6 | Low | Start with simple heuristic (most space). Fallback to `bottom-center`. |
| Blur mode `clip-path` performance with many regions | 6 | Low | Benchmark in demo. CDN blur is cached at edge. |
| Mobile bottom-sheet touch gesture conflicts | 10 | Medium | Fixed-position sheet with `max-height`. Test on real mobile devices. |

---

## Source File Map (Final)

```
src/
├── index.ts                  # Public exports: class + all types
├── define.ts                 # Side-effect: custom element registration
├── react.ts                  # React forwardRef wrapper
├── spotlight-element.ts      # Main CloudimageSpotlight class
├── url-builder.ts            # CDN URL construction (pure functions)
├── config-loader.ts          # Config fetch + validation
├── validation.ts             # Scene image + CTA href validation
├── scene-renderer.ts         # Scene DOM rendering (images, mask, annotation)
├── svg-mask.ts               # SVG mask overlay generation
├── region-highlights.ts      # Region border + pulse highlight divs
├── badges.ts                 # Numbered badge elements
├── annotation.ts             # Annotation card + CTA
├── auto-position.ts          # Annotation auto-positioning algorithm
├── navigation.ts             # Scene navigation state machine
├── transitions.ts            # Fade/slide/zoom transition engine
├── autoplay.ts               # Autoplay controller
├── loading.ts                # Skeleton loading states
├── deep-link.ts              # Hash-based deep linking + URL sync
├── responsive.ts             # Mobile breakpoint + bottom-sheet
├── keyboard.ts               # Keyboard navigation handler
├── a11y.ts                   # ARIA setup and management
├── i18n.ts                   # String table + interpolation
├── types.ts                  # All TypeScript interfaces and types
└── styles/
    └── spotlight.css          # All component styles (imported via ?inline)

tests/
├── setup.ts
├── types.test.ts
├── url-builder.test.ts
├── config-loader.test.ts
├── config-validator.test.ts
├── spotlight-element.test.ts
├── lazy-loading.test.ts
├── scene-navigation.test.ts
├── events.test.ts
├── svg-mask.test.ts
├── annotation.test.ts
├── transitions.test.ts
├── autoplay.test.ts
├── keyboard.test.ts
├── accessibility.test.ts
├── deep-link.test.ts
├── responsive.test.ts
├── destroy.test.ts
├── react.test.tsx
├── integration.test.ts
└── edge-cases.test.ts

demo/
├── index.html
├── demo.ts
├── demo.css
└── configs/
    ├── minimal.json
    ├── full-example.json
    ├── single-scene.json
    ├── multi-region.json
    ├── blur-mode.json
    └── intro.json
```

---

## Post-Stage 12: Intro Screen + Staggered Scene Entry

**Added after all 12 stages were complete.**

### Staggered scene entry (`settings.staggerEntry`, default: true)

Overlay elements (mask, badges, annotation, connector) now animate in sequentially after the image loads, instead of appearing all at once. CSS-driven via `animation-delay` custom properties. Respects `prefers-reduced-motion`.

**Files modified:** `src/scene-renderer.ts` (applyStagger/clearStagger helpers), `src/spotlight-element.ts` (trigger stagger on image load), `src/styles/spotlight.css` (keyframes + stagger classes), `src/types.ts` (staggerEntry field).

### Intro / welcome screen (`settings.intro`, default: false)

Optional welcome overlay before the first scene. Shows scene 0's clean image with a centered card ("Learn about [title]" + Start button). Dismiss via click or Escape key. Skipped when autoplay or deep links are active. Navigation is blocked during intro. Mobile: card renders as bottom-aligned sheet.

**Files modified:** `src/spotlight-element.ts` (_renderIntro/_dismissIntro), `src/types.ts` (SpotlightIntro interface), `src/i18n.ts` (introStart/introDefault strings), `src/styles/spotlight.css` (intro card + mobile styles), `spec.md` (behavioral docs).

**Tests:** `tests/intro-stagger.test.ts` — 16 tests covering stagger classes, intro rendering, dismiss, keyboard, autoplay skip, navigation blocking.

**Bundle:** 16.10 KB gzip (ESM core + CSS). React wrapper: 0.92 KB gzip.
