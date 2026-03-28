import type { Page } from '../../lib/router';
import { code, docNav, highlightAll } from '../../lib/doc-utils';

const page: Page = {
  render() {
    return `
      <div class="doc-content">
        <h1>Theming</h1>
        <p class="doc-lead">
          Customize the player's appearance with CSS custom properties (<code>--cis-*</code>).
          All tokens pierce the Shadow DOM boundary — set them on the host element or any ancestor.
        </p>

        <h2>Theme attribute</h2>
        <p>The <code>theme</code> attribute controls the base color scheme:</p>
        <table>
          <thead><tr><th>Value</th><th>Description</th></tr></thead>
          <tbody>
            <tr><td><code>"dark"</code> (default)</td><td>Dark overlay and controls</td></tr>
            <tr><td><code>"light"</code></td><td>Light overlay and controls</td></tr>
            <tr><td><code>"auto"</code></td><td>Follows <code>prefers-color-scheme</code></td></tr>
          </tbody>
        </table>

        <h2>CSS custom properties</h2>

        <h3>Layout</h3>
        ${code('css', `cloudimage-spotlight {
  --cis-width: 100%;
  --cis-max-width: 1200px;
  --cis-aspect-ratio: 16/9;
  --cis-border-radius: 8px;
  --cis-object-fit: contain;       /* contain | cover | fill */
}`)}

        <h3>Mask overlay</h3>
        ${code('css', `cloudimage-spotlight {
  --cis-mask-color: #000000;
  --cis-mask-opacity: 0.65;
  --cis-mask-transition: 300ms ease;
}`)}

        <h3>Annotation card</h3>
        ${code('css', `cloudimage-spotlight {
  --cis-card-bg: rgba(10, 12, 18, 0.92);
  --cis-card-border: rgba(255, 255, 255, 0.1);
  --cis-card-border-radius: 10px;
  --cis-card-padding: 16px 20px;
  --cis-card-max-width: 320px;
  --cis-card-title-color: #ffffff;
  --cis-card-title-size: 15px;
  --cis-card-body-color: rgba(255, 255, 255, 0.7);
  --cis-card-body-size: 13px;
  --cis-card-backdrop-blur: blur(12px);
}`)}

        <h3>Controls</h3>
        ${code('css', `cloudimage-spotlight {
  --cis-btn-bg: rgba(255, 255, 255, 0.1);
  --cis-btn-bg-hover: rgba(255, 255, 255, 0.2);
  --cis-btn-color: #ffffff;
  --cis-btn-border-radius: 6px;
  --cis-btn-size: 36px;
  --cis-progress-color: rgba(255, 255, 255, 0.6);
  --cis-progress-font-size: 12px;
  --cis-skip-color: rgba(255, 255, 255, 0.5);
  --cis-skip-bg: transparent;
}`)}

        <h3>Accent &amp; regions</h3>
        ${code('css', `cloudimage-spotlight {
  --cis-accent: oklch(0.578 0.198 268.129);
  --cis-region-border: 2px solid oklch(0.578 0.198 268.129 / 0.6);
  --cis-region-border-radius: 4px;
  --cis-region-pulse-color: oklch(0.578 0.198 268.129 / 0.4);
  --cis-region-pulse-duration: 600ms;
  --cis-region-pulse-count: 2;
}`)}

        <h3>Badges &amp; CTA</h3>
        ${code('css', `cloudimage-spotlight {
  --cis-badge-bg: var(--cis-accent);
  --cis-badge-color: #ffffff;
  --cis-badge-size: 22px;
  --cis-badge-font-size: 11px;
  --cis-badge-border-radius: 50%;

  --cis-cta-bg: var(--cis-accent);
  --cis-cta-color: #ffffff;
  --cis-cta-border-radius: 6px;
  --cis-cta-padding: 8px 16px;
  --cis-cta-font-size: 13px;
}`)}

        <h3>Transitions &amp; focus</h3>
        ${code('css', `cloudimage-spotlight {
  --cis-transition-duration: 300ms;
  --cis-transition-easing: ease;
  --cis-focus-ring-color: var(--cis-accent);
  --cis-focus-ring-width: 2px;
  --cis-focus-ring-offset: 2px;
}`)}

        <h2>Light theme example</h2>
        ${code('css', `cloudimage-spotlight[theme="light"] {
  --cis-mask-color: #ffffff;
  --cis-card-bg: rgba(255, 255, 255, 0.95);
  --cis-card-border: rgba(0, 0, 0, 0.08);
  --cis-card-title-color: #0b0c0f;
  --cis-card-body-color: rgba(0, 0, 0, 0.6);
  --cis-btn-bg: rgba(0, 0, 0, 0.08);
  --cis-btn-bg-hover: rgba(0, 0, 0, 0.14);
  --cis-btn-color: #0b0c0f;
  --cis-progress-color: rgba(0, 0, 0, 0.5);
  --cis-skip-color: rgba(0, 0, 0, 0.4);
}`)}

        <h2>Custom brand example</h2>
        ${code('css', `/* Purple brand accent */
cloudimage-spotlight.purple-brand {
  --cis-accent: oklch(0.541 0.281 293.009);
  --cis-card-bg: rgba(30, 20, 60, 0.95);
  --cis-cta-bg: oklch(0.541 0.281 293.009);
  --cis-badge-bg: oklch(0.541 0.281 293.009);
  --cis-border-radius: 16px;
  --cis-card-border-radius: 12px;
}`)}

        ${docNav(
          { href: '#/docs/api', label: 'API' },
          undefined,
        )}
      </div>
    `;
  },

  init() {
    highlightAll();
  },
};

export default page;
