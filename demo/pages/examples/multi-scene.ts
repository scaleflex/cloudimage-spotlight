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
        label: 'Config',
        lang: 'json',
        code: `
{
  "version": "1.0",
  "ciToken": "your-token",
  "title": "Create an API Key",
  "settings": {
    "transition": "fade",
    "maskStyle": "color",
    "maskOpacity": 0.65,
    "allowSkip": true,
    "intro": {
      "title": "Create an API Key",
      "description": "Follow this quick 5-step guide to generate your first API key for the Asset Picker."
    },
    "outro": {
      "title": "You're all set!",
      "description": "Your API key is ready. Want to see the steps again?"
    }
  },
  "scenes": [
    {
      "id": "home",
      "image": "v7/plugins/cloudimage/spotlight/home.png",
      "title": "Spotlight Dashboard",
      "description": "Start from the Experiences home page. Navigate to API Keys in the sidebar.",
      "regions": [
        { "tl_x": 0.003, "tl_y": 0.45, "br_x": 0.18, "br_y": 0.50, "label": "API Keys page" }
      ],
      "annotation": { "position": "right" }
    },
    {
      "id": "api-keys-empty",
      "image": "v7/plugins/cloudimage/spotlight/settings-api-keys.png",
      "title": "API Keys Page",
      "description": "Click \\"Create key\\" to generate a new one.",
      "regions": [
        { "tl_x": 0.40, "tl_y": 0.20, "br_x": 0.78, "br_y": 0.45, "label": "Create key" }
      ],
      "annotation": { "position": "bottom" }
    },
    {
      "id": "create-modal",
      "image": "v7/plugins/cloudimage/spotlight/create-api-key-modal.png",
      "title": "Name Your Key",
      "description": "Give your API key a descriptive name and click Create.",
      "regions": [
        { "tl_x": 0.335, "tl_y": 0.41, "br_x": 0.665, "br_y": 0.585, "label": "Fill details" },
        { "tl_x": 0.605, "tl_y": 0.595, "br_x": 0.66, "br_y": 0.645, "label": "Click create" }
      ],
      "annotation": { "position": "right" }
    },
    {
      "id": "key-generated",
      "image": "v7/plugins/cloudimage/spotlight/api-key-generated-modal.png",
      "title": "Copy Your API Key",
      "description": "Copy it now — you won't be able to see it again after closing this dialog.",
      "regions": [
        { "tl_x": 0.34, "tl_y": 0.425, "br_x": 0.66, "br_y": 0.485, "label": "Warning" },
        { "tl_x": 0.34, "tl_y": 0.52, "br_x": 0.66, "br_y": 0.57, "label": "Copy key" }
      ],
      "zoomPadding": 0.15,
      "zoom": true
    },
    {
      "id": "key-listed",
      "image": "v7/plugins/cloudimage/spotlight/settings-api-keys-with-new-created-key.png",
      "title": "Key Ready to Use",
      "description": "Your new API key is now listed and ready to use.",
      "regions": [
        { "tl_x": 0.27, "tl_y": 0.14, "br_x": 0.91, "br_y": 0.29, "label": "New key" }
      ],
      "maskStyle": "blur",
      "cta": {
        "label": "View Asset Picker docs",
        "href": "https://www.scaleflex.com/en/asset-picker",
        "style": "link"
      }
    }
  ]
}`,
      },
    ]);
  },
};

export default page;
