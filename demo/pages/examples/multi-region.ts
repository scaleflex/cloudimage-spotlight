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
  "title": "Multi-Region Demo",
  "scenes": [
    {
      "id": "dashboard-layout",
      "image": "v7/plugins/cloudimage/spotlight/home.png",
      "title": "Dashboard Layout",
      "description": "The dashboard has three key areas.",
      "regions": [
        { "tl_x": 0.003, "tl_y": 0.03, "br_x": 0.08, "br_y": 0.60, "label": "Sidebar" },
        { "tl_x": 0.085, "tl_y": 0.06, "br_x": 0.99, "br_y": 0.13, "label": "Filters" },
        { "tl_x": 0.085, "tl_y": 0.14, "br_x": 0.99, "br_y": 0.72, "label": "Experiences" }
      ]
    }
  ]
}`,
      },
    ]);
  },
};

export default page;
