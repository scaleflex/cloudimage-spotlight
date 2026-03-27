import type { Page } from '../../lib/router';
import { renderCodeBlock } from '../../lib/code-block';

const page: Page = {
  render() {
    return `
      <div class="page-header">
        <h1>Annotation styles</h1>
        <p>The annotation popover supports multiple visual styles, connector lines, custom widths, and a full set of <code>--cis-*</code> CSS variables.</p>
      </div>

      <section class="page-section">
        <div class="example-demo">
          <cloudimage-spotlight
            id="example-spotlight"
            config="./configs/annotation-styles.json"
            theme="light"
            eager
            show-progress
            allow-skip
          ></cloudimage-spotlight>
        </div>
      </section>

      <section class="page-section">
        <h2>Annotation options</h2>
        <table class="options-table">
          <thead><tr><th>Option</th><th>Values</th><th>Description</th></tr></thead>
          <tbody>
            <tr><td><code>annotation.style</code></td><td><code>"card"</code> (default), <code>"tooltip"</code>, <code>"minimal"</code></td><td>Visual style of the annotation card</td></tr>
            <tr><td><code>annotation.position</code></td><td><code>"auto"</code>, <code>"top"</code>, <code>"bottom"</code>, <code>"left"</code>, <code>"right"</code></td><td>Position relative to the primary region</td></tr>
            <tr><td><code>annotation.maxWidth</code></td><td>Number (px)</td><td>Override the card max-width for wider content</td></tr>
            <tr><td><code>annotation.showConnector</code></td><td><code>true</code> / <code>false</code></td><td>Show a line connecting the card to the region</td></tr>
            <tr><td><code>settings.showProgress</code></td><td><code>true</code> (default) / <code>false</code></td><td>Show or hide the "1 / 3" progress pill</td></tr>
            <tr><td><code>settings.allowSkip</code></td><td><code>true</code> / <code>false</code> (default)</td><td>Show a close (X) button in the card header</td></tr>
          </tbody>
        </table>
      </section>

      <section class="page-section">
        <h2>Code</h2>
        <div id="code-container"></div>
      </section>

      <section class="page-section">
        <h2>CSS customization</h2>
        <div id="css-code-container"></div>
      </section>
    `;
  },

  init() {
    renderCodeBlock('#code-container', [
      {
        label: 'Card (default)',
        lang: 'json',
        code: `
{
  "annotation": { "style": "card", "position": "right" }
}`,
      },
      {
        label: 'Tooltip',
        lang: 'json',
        code: `
{
  "annotation": { "style": "tooltip", "position": "bottom" }
}`,
      },
      {
        label: 'Minimal',
        lang: 'json',
        code: `
{
  "annotation": { "style": "minimal", "position": "bottom" }
}`,
      },
      {
        label: 'Connector',
        lang: 'json',
        code: `
{
  "annotation": {
    "style": "card",
    "position": "auto",
    "showConnector": true
  }
}`,
      },
      {
        label: 'Custom width',
        lang: 'json',
        code: `
{
  "annotation": {
    "maxWidth": 420,
    "position": "bottom"
  }
}`,
      },
    ]);

    renderCodeBlock('#css-code-container', [
      {
        label: 'Card & text',
        lang: 'css',
        code: `
cloudimage-spotlight {
  /* Card container */
  --cis-card-max-width: 340px;
  --cis-card-padding: 16px 20px;
  --cis-card-bg: oklch(0.13 0.027 261.692 / 0.92);
  --cis-card-border: oklch(0.95 0.01 264.55 / 0.1);
  --cis-card-border-radius: 12px;
  --cis-card-backdrop-blur: blur(12px);

  /* Title & body */
  --cis-card-title-size: 15px;
  --cis-card-title-color: oklch(0.95 0.01 264.55);
  --cis-card-body-size: 13px;
  --cis-card-body-color: oklch(0.75 0.01 249.82);
}`,
      },
      {
        label: 'Progress & close',
        lang: 'css',
        code: `
cloudimage-spotlight {
  /* Progress pill "1 / 3" */
  --cis-progress-bg: oklch(0.95 0.01 264.55 / 0.1);
  --cis-progress-font-size: 11px;
  --cis-progress-color: oklch(0.75 0.01 249.82);

  /* Close (X) button */
  --cis-close-color: oklch(0.75 0.01 249.82);
  --cis-close-bg-hover: oklch(0.95 0.01 264.55 / 0.1);
  --cis-close-color-hover: oklch(0.95 0.01 264.55);
}`,
      },
      {
        label: 'Nav buttons',
        lang: 'css',
        code: `
cloudimage-spotlight {
  /* Shared nav button sizing */
  --cis-nav-btn-padding: 7px 16px;
  --cis-nav-btn-font-size: 13px;
  --cis-nav-btn-border-radius: 8px;

  /* Previous button (ghost/outlined) */
  --cis-nav-btn-ghost-border: oklch(0.95 0.01 264.55 / 0.2);
  --cis-nav-btn-ghost-color: oklch(0.85 0.01 264.55);
  --cis-nav-btn-ghost-bg-hover: oklch(0.95 0.01 264.55 / 0.08);

  /* Next button (filled primary) */
  --cis-nav-btn-primary-bg: oklch(0.15 0.02 261.692);
  --cis-nav-btn-primary-color: oklch(0.95 0.01 264.55);
  --cis-nav-btn-primary-bg-hover: oklch(0.22 0.025 261.692);

  /* Finish button (last scene, success green) */
  --cis-nav-btn-finish-bg: oklch(0.5 0.17 154.83);
  --cis-nav-btn-finish-color: oklch(1 0 0);
  --cis-nav-btn-finish-bg-hover: oklch(0.45 0.15 154.83);
}`,
      },
    ]);
  },
};

export default page;
