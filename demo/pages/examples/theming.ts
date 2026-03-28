import type { Page } from '../../lib/router';
import type { CloudimageSpotlightElement } from '../../../src/types';
import { renderCodeBlock } from '../../lib/code-block';

const page: Page = {
  render() {
    return `
      <div class="page-header">
        <h1>Theming</h1>
        <p>Switch between dark, light, and auto themes. All visual tokens are exposed as <code>--cis-*</code> CSS custom properties.</p>
      </div>

      <section class="page-section">
        <div class="config-controls">
          <div class="form-group">
            <label for="theme-select">Theme</label>
            <select id="theme-select">
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="auto">Auto</option>
            </select>
          </div>
        </div>
        <div class="example-demo">
          <cloudimage-spotlight
            id="example-spotlight"
            config="./configs/full-example.json"
            theme="light"
            eager
            show-progress
          ></cloudimage-spotlight>
        </div>
      </section>

      <section class="page-section">
        <h2>Code</h2>
        <div id="code-container"></div>
      </section>
    `;
  },

  init() {
    const spotlight = document.getElementById('example-spotlight') as CloudimageSpotlightElement;
    const themeSelect = document.getElementById('theme-select') as HTMLSelectElement;

    themeSelect.addEventListener('change', () => {
      spotlight.setAttribute('theme', themeSelect.value);
    });

    renderCodeBlock('#code-container', [
      {
        label: 'HTML',
        lang: 'markup',
        code: `
<!-- Dark (default) -->
<cloudimage-spotlight config="..." theme="dark"></cloudimage-spotlight>

<!-- Light -->
<cloudimage-spotlight config="..." theme="light"></cloudimage-spotlight>

<!-- Auto (follows prefers-color-scheme) -->
<cloudimage-spotlight config="..." theme="auto"></cloudimage-spotlight>`,
      },
      {
        label: 'Custom CSS',
        lang: 'css',
        code: `
/* Custom brand colors */
cloudimage-spotlight {
  --cis-accent: oklch(0.58 0.22 292);
  --cis-card-bg: oklch(0.15 0.04 292 / 0.95);
  --cis-cta-bg: oklch(0.58 0.22 292);
  --cis-badge-bg: oklch(0.58 0.22 292);
  --cis-border-radius: 16px;
}`,
      },
    ]);
  },
};

export default page;
