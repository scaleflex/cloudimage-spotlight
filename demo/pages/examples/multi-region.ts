import type { Page } from '../../lib/router';
import { renderCodeBlock } from '../../lib/code-block';

const page: Page = {
  render() {
    return `
      <div class="page-header">
        <h1>Multiple regions</h1>
        <p>Highlight multiple areas on a single screenshot. Each region gets a numbered badge, and all are shown simultaneously.</p>
      </div>

      <section class="page-section">
        <div class="example-demo">
          <cloudimage-spotlight
            id="example-spotlight"
            config="./configs/multi-region.json"
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
    renderCodeBlock('#code-container', [
      {
        label: 'Config',
        lang: 'json',
        code: `
{
  "version": "1.0",
  "ciToken": "your-token",
  "scenes": [
    {
      "id": "dashboard-regions",
      "image": "https://scaleflex.cloudimg.io/v7/...",
      "title": "Key Areas",
      "description": "These are the important parts of the dashboard.",
      "regions": [
        { "tl_x": 0.0, "tl_y": 0.0, "br_x": 0.15, "br_y": 1.0, "label": "Sidebar" },
        { "tl_x": 0.15, "tl_y": 0.0, "br_x": 1.0, "br_y": 0.08, "label": "Toolbar" },
        { "tl_x": 0.6, "tl_y": 0.15, "br_x": 1.0, "br_y": 0.5, "label": "Details" }
      ],
      "mask": true
    }
  ]
}`,
      },
    ]);
  },
};

export default page;
