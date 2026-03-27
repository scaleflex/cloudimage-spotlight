import type { Page } from '../../lib/router';
import { renderCodeBlock } from '../../lib/code-block';

const page: Page = {
  render() {
    return `
      <div class="page-header">
        <h1>Multi-scene tour</h1>
        <p>A full guided walkthrough with 5 scenes, region highlighting, zoom, and a CTA button on the final scene.</p>
      </div>

      <section class="page-section">
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
    renderCodeBlock('#code-container', [
      {
        label: 'HTML',
        lang: 'markup',
        code: `
<cloudimage-spotlight
  config="./configs/full-example.json"
  theme="light"
  show-progress
></cloudimage-spotlight>`,
      },
      {
        label: 'Config (excerpt)',
        lang: 'json',
        code: `
{
  "version": "1.0",
  "ciToken": "your-token",
  "title": "Create API Key Tour",
  "settings": {
    "transition": "fade",
    "maskOpacity": 0.65,
    "maskStyle": "color"
  },
  "scenes": [
    {
      "id": "navigate",
      "image": "https://scaleflex.cloudimg.io/v7/...",
      "title": "Navigate to API Keys",
      "description": "Open the sidebar and find API Keys.",
      "regions": [{ "tl_x": 0.0, "tl_y": 0.3, "br_x": 0.15, "br_y": 0.45 }],
      "mask": true
    },
    {
      "id": "create-key",
      "image": "https://scaleflex.cloudimg.io/v7/...",
      "title": "Create New Key",
      "description": "Click the Create API Key button.",
      "regions": [{ "tl_x": 0.7, "tl_y": 0.05, "br_x": 0.95, "br_y": 0.12 }],
      "mask": true,
      "zoom": true,
      "cta": {
        "label": "Learn more about API keys",
        "href": "https://docs.scaleflex.com"
      }
    }
  ]
}`,
      },
    ]);
  },
};

export default page;
