# cloudimage-spotlight

A CDN-native, screenshot-based interactive experience player built as a Web Component (`<cloudimage-spotlight>`). Part of the Scaleflex Spotlight ecosystem alongside `cloudimage-hotspot`, `cloudimage-360-view`, and `cloudimage-responsive`.

## Key Documents

- **`spec.md`** — Full plugin specification (v0.5, implementation-ready). 20 sections, ~1880 lines. Covers: custom element API (3 entry points: index/define/react), config schema, Cloudimage URL builder (`tl_px`/`br_px` percentage coords, native `dpr`, blur, width rounding, `org_if_sml`), SVG mask + blur mode rendering, constructable stylesheets, content security (textContent, href sanitization), loading states, responsive/mobile bottom-sheet, lazy loading (IntersectionObserver), deep linking (hash-based with `sync-url`), typed events with `HTMLElementEventMap` augmentation, React wrapper, public methods + type exports, i18n string table, RTL support (CSS logical properties), print stylesheet, keyboard/accessibility, Vite build config, Vitest testing strategy, dev setup, and Spotlight authoring integration.
- **`cloudimage-spotlight-research.html`** — Deep research report covering: market landscape analysis (Arcade, Storylane, Navattic, Supademo, Walnut), competitive positioning, CDN advantage over CSS-based competitors, architecture overview, scene data model, UX patterns, client use cases (SaaS, e-commerce, automotive, real estate, education), naming analysis, risks/mitigations, and phased build roadmap.

## Sibling Plugin References

Use these as reference for patterns, build setup, demo pages, and conventions already established in the ecosystem.

### `../hotspot` — @cloudimage/hotspot

The closest sibling plugin. Reference for how Cloudimage plugins are structured, built, and demoed.

- **Path:** `../hotspot/` (relative) — `/Users/dmitrystremous/scaleflex/plugins/cloudimage/hotspot/`
- **Build:** Vite, outputs ESM (.esm.js), CJS (.cjs.js), UMD (.min.js). Build configs in `config/` folder.
- **Source structure:** `src/core/` (main class + types), `src/markers/`, `src/popover/`, `src/zoom/`, `src/a11y/`, `src/editor/`, `src/react/`, `src/fullscreen/`, `src/styles/`, `src/utils/` (includes Cloudimage URL builder). Good model for modular src/ organization.
- **Demo page:** `demo/index.html` + `demo/demo.ts` + `demo/demo.css` + `demo/configurator.ts`. Built with Vite (`config/vite.demo.config.ts`) → `dist-demo/`. Also has a separate editor demo and React demo variant.
- **Init pattern:** `CIHotspot` class — constructor takes DOM element + config object. Also has `CIHotspot.autoInit()` for declarative `data-ci-hotspot-*` attribute detection. Note: this is the older init-function pattern that spotlight intentionally moves away from (Web Component instead).
- **Testing:** Vitest + jsdom, 243 tests across 18 files in `tests/`, setup file at `tests/setup.ts`.
- **Key docs:** `SPECS.md` (full specification), `IMPLEMENTATION.md` (build log across 10 phases).
- **What to reference:** Demo page layout/styling, Vite build config structure, Cloudimage URL builder in `src/utils/`, test patterns, CSS variable naming, CDN release scripts in `scripts/`.

### `../../scaleflex/asset-picker` — @scaleflex/asset-picker

A more modern plugin built with Lit 3 + Shadow DOM. Reference for Web Component patterns, Tailwind CSS integration, and demo/docs setup.

- **Path:** `../../scaleflex/asset-picker/` (relative) — `/Users/dmitrystremous/scaleflex/plugins/scaleflex/asset-picker/`
- **Build:** Vite 6 with library mode (ESM + CJS dual format), `vite-plugin-dts` for declarations, Tailwind CSS v4 via `@tailwindcss/vite`.
- **Three entry points:** `src/index.ts` (public exports), `src/react.ts` (React forwardRef wrapper), `src/define.ts` (custom element registration side effect) — good pattern for spotlight to follow.
- **Source structure:** `src/components/` (30+ sub-components), `src/controllers/` (store, selection, scroll), `src/services/` (API, auth, files), `src/store/` (reactive pub/sub), `src/styles/` (`--ap-*` CSS custom properties), `src/types/`, `src/utils/`.
- **Demo page:** `demo/index.html` with hash-based routing, auth UI, sidebar navigation. Separate `vite.demo.config.ts` → `demo-dist/` (GitHub Pages). Good reference for a polished demo with configuration options.
- **Component pattern:** LitElement + Shadow DOM + `@customElement` decorator. All components auto-register on import. File naming: kebab-case, prefixed with `ap-`.
- **CDN release:** `scripts/release-cdn.mjs` — bumps version, builds CDN bundle, uploads, creates git tags.
- **What to reference:** Web Component registration pattern (three entry points), Shadow DOM + CSS custom properties theming, LitElement patterns (though spotlight uses vanilla WC not Lit), demo page structure, CDN release pipeline.

## Architecture

- **Web Component** (Custom Elements v1 + Shadow DOM) — intentional break from the init-function pattern of older `cloudimage-*` plugins
- **CDN-only zoom** — no CSS zoom fallback. Region coordinates (normalized 0–1) map directly to Cloudimage `?func=crop&tl_x=...&tl_y=...&br_x=...&br_y=...` URL params. DPR-aware (clamped 1–3x).
- **SVG mask overlay** for spotlight effect with multiple cut-out regions per scene. Supports `maskStyle: "color"` (default) or `"blur"` (CDN `?blur=` layered image).
- **Config contract**: JSON with `version`, `ciToken`, `scenes[]` — authored in Spotlight dashboard, consumed by the player
- **Lazy loading** by default via `IntersectionObserver` (opt out with `eager` attribute)
- **Mobile bottom-sheet** annotations below `--cis-mobile-breakpoint: 600px`
- **Zero runtime dependencies**

## Design Decisions (Do Not Reopen)

1. **Zoom = CDN-only** — no CSS fallback. Two code paths compound complexity. Non-Cloudimage URLs throw a clear error.
2. **Aspect ratio** — `object-fit: contain` default, configurable via `--cis-object-fit` CSS var.
3. **Multiple regions per scene** — `regions[]` array, all shown simultaneously with numbered badges. No sub-navigation within a scene.
4. **CTA button** — included in v1 as optional `cta` field per scene.
5. **Config versioning** — strict `"version"` string. Unknown versions: warn + best-effort render.
6. **Config loading** — simple `fetch()`, no `sessionStorage` caching (CDN handles caching).

## Config Schema (Quick Reference)

```typescript
interface SpotlightConfig {
  version: "1.0";
  ciToken: string;
  title?: string;
  settings?: SpotlightSettings;   // transition, autoplay, mask, etc.
  scenes: SpotlightScene[];       // each has: id, image, title, description, regions[], mask, zoom, annotation, cta
}
```

Full TypeScript types are in `spec.md` under "Config Schema".

## CSS Class Convention

All classes prefixed `cis-` (Cloudimage Spotlight), BEM-style: `cis-root`, `cis-stage`, `cis-annotation__title`, `cis-btn--prev`, `cis-badge--active`.

## Events

All events prefixed `cis:` — `cis:ready`, `cis:scene-change`, `cis:complete`, `cis:skip`, `cis:cta-click`, `cis:region-enter`, `cis:error`. Bubble and cross shadow boundary.

## Implementation Order (from spec)

1. `src/url-builder.ts` — pure functions, no DOM, fully unit-testable
2. Web Component scaffold — custom element registration, config loading, Shadow DOM setup
3. SVG overlay engine — mask rendering, region badges, transitions

## Color System

The plugin's `--cis-*` CSS custom properties should align with the Scaleflex OKLCH color system used across all projects. Reference: `ui-tw` project's `variables.css`.

Key mappings for the spotlight component:
- **Primary / accent:** `oklch(0.578 0.198 268.129)` — use for `--cis-accent`, badges, CTA buttons, focus rings
- **Background (dark):** `oklch(0.13 0.027 261.692)` — maps to dark theme card/mask backgrounds
- **Foreground (dark):** `oklch(0.95 0.01 264.55)` — maps to dark theme text colors
- **Background (light):** `oklch(1 0 0)` — maps to light theme card backgrounds
- **Foreground (light):** `oklch(0.37 0.022 248.413)` — maps to light theme text
- **Border:** `oklch(92.86% 0.009 247.92)` (light) / `oklch(0.3 0.01 247.92)` (dark)
- **Muted text:** `oklch(0.685 0.033 249.82)` (light) / `oklch(0.75 0.01 249.82)` (dark)
- **Destructive / error:** `oklch(0.577 0.215 27.325)` (light) / `oklch(0.55 0.2 27.325)` (dark)
- **Success:** `oklch(0.637 0.17 151.295)` (light) / `oklch(0.6 0.2 154.83)` (dark)
- **Ring (focus):** `oklch(0.578 0.198 268.129 / 0.7)`
- **Shadow:** `oklch(26.18% 0.024 256.43 / 0.1)` (light) / `oklch(0 0 0 / 0.2)` (dark)

When building `src/styles/spotlight.css` (Stage 3), map these OKLCH values to the `--cis-*` custom properties defined in the spec. The dark theme is the default (`theme="dark"`); light theme is activated via `theme="light"` or `theme="auto"` with `prefers-color-scheme`.

## Build & Tooling

- **Vite** with `build.lib` mode (matching hotspot/asset-picker ecosystem)
- Output: ESM (`dist/index.esm.js`), CJS (`dist/index.cjs.js`). IIFE to be added in Stage 12 via separate config.
- Package: `@cloudimage/spotlight`, `sideEffects: ["./dist/define.*"]`
- Bundle size target: < 12 KB gzipped (core), < 16 KB with CSS
- **Testing:** Vitest + jsdom, 80% coverage threshold
- No external fonts — uses system emoji + CSS for icons
- Browser targets: Chrome 73+, Firefox 101+, Safari 16.4+ (constructable stylesheets)
- CDN: `https://cdn.cloudimage.io/spotlight/{version}/spotlight.min.js`

## Stage Workflow

Implementation follows 12 stages defined in `IMPLEMENTATION.md`. After completing each stage:

### Automatic checklist (enforced by Claude, no prompting needed)

1. **Build** — `npm run build` must pass with no errors
2. **Typecheck** — `npm run typecheck` must pass
3. **Tests** — `npm run test` must pass, all new code covered
4. **Self-review against spec** — re-read the spec sections relevant to this stage, verify no drift (field names, defaults, behavior, error codes)
5. **Report** — summarize: what was built, what tests pass, any spec deviations flagged, acceptance criteria status

### Principles

- **Don't skip build/test** — a broken build compounds across stages
- **Stages are atomic** — each produces a working artifact. If Stage 5 requires changing Stage 2 code, flag it as a plan issue.
- **Flag spec deviations early** — if something in the spec doesn't work in practice, tell the user and update the spec rather than silently diverging
- **Commit after each green stage** — gives rollback points
- **No over-engineering** — only what the spec asks for. No extra features, no premature abstractions.

### User can trigger `/stage-review` at any time

Runs the full checklist manually: build → typecheck → test → spec alignment check → report.

### Deep code review checkpoints

Skip deep code review during individual stages — tests and `/spotlight-review` are the quality gate. Run deep reviews at these two points:

1. **After Stage 6** (zoom + blur + annotations) — full rendering pipeline complete. Review architecture, naming, reuse, spec alignment across all src/ files. Fix issues before building features on top. Use `/simplify` or ask for "deep code review against spec."
2. **After Stage 12** (everything done) — final pre-release review. Dead code, naming consistency, missing edge cases, bundle size audit, security pass across the whole codebase.

**Claude: remind the user to run a deep review when Stage 6 and Stage 12 complete.**

## Current State

Stage 12 complete + post-stage features (intro screen, staggered scene entry). 427+ tests passing across 25 test files. Bundle: 16.10 KB gzip (core ESM with CSS). React wrapper: 0.92 KB gzip (separate entry). Demo site builds to demo-dist/. **DEEP CODE REVIEW CHECKPOINT — run /simplify or ask for deep review before release.**
