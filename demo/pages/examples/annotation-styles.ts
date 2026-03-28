import type { Page } from '../../lib/router';
import { renderCodeBlock } from '../../lib/code-block';

const page: Page = {
  render() {
    return `
      <div class="page-header">
        <h1>Annotation styles</h1>
        <p>The annotation popover supports multiple visual styles, connector lines, and custom widths.</p>
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
    "style": "card",
    "position": "bottom",
    "maxWidth": 420
  }
}`,
      },
    ]);

  },
};

export default page;
