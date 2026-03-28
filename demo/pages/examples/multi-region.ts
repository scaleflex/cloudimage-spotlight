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
        { "tl_x": 0, "tl_y": 0.07, "br_x": 0.17, "br_y": 0.98, "label": "Sidebar" },
        { "tl_x": 0.185, "tl_y": 0.16, "br_x": 0.99, "br_y": 0.275, "label": "Filters" },
        { "tl_x": 0.185, "tl_y": 0.28, "br_x": 0.99, "br_y": 0.98, "label": "Experiences" }
      ]
    },
    {
      "id": "api-key-details",
      "image": "v7/plugins/cloudimage/spotlight/settings-api-keys-with-new-created-key.png",
      "title": "API Key Details",
      "description": "Each key shows the name, prefix, creator, and expiration.",
      "regions": [
        { "tl_x": 0.29, "tl_y": 0.21, "br_x": 0.49, "br_y": 0.265, "label": "Name & prefix" },
        { "tl_x": 0.495, "tl_y": 0.21, "br_x": 0.83, "br_y": 0.265, "label": "Metadata" },
        { "tl_x": 0.84, "tl_y": 0.21, "br_x": 0.9, "br_y": 0.265, "label": "Delete" }
      ]
    }
  ]
}`,
      },
    ]);
  },
};

export default page;
