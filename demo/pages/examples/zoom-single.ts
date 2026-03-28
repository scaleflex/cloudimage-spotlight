import type { Page } from '../../lib/router';
import { renderCodeBlock } from '../../lib/code-block';

const page: Page = {
  render() {
    return `
      <div class="page-header">
        <h1>Zoom — Single region</h1>
        <p>When <code>zoom: true</code> is set with a single region, the Cloudimage CDN crops the image directly to that region's bounds — giving a close-up view without any client-side scaling.</p>
      </div>

      <section class="page-section">
        <div class="example-demo">
          <cloudimage-spotlight
            id="example-spotlight"
            config="./configs/zoom-single.json"
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
  "settings": {
    "transition": "fade",
    "maskStyle": "color",
    "maskOpacity": 0.65
  },
  "scenes": [
    {
      "id": "copy-key",
      "image": "v7/plugins/cloudimage/spotlight/api-key-generated-modal.png",
      "title": "Copy Your API Key",
      "description": "With zoom enabled, the image crops directly to the highlighted area via the Cloudimage CDN.",
      "regions": [
        { "tl_x": 0.34, "tl_y": 0.49, "br_x": 0.66, "br_y": 0.58, "label": "Copy key" }
      ],
      "zoomPadding": 0.15,
      "zoom": true
    },
    {
      "id": "new-key-row",
      "image": "v7/plugins/cloudimage/spotlight/settings-api-keys-with-new-created-key.png",
      "title": "Key Listed",
      "description": "The CDN crops to the single region, giving a close-up view.",
      "regions": [
        { "tl_x": 0.29, "tl_y": 0.21, "br_x": 0.9, "br_y": 0.265, "label": "New key" }
      ],
      "zoomPadding": 0.15,
      "zoom": true
    }
  ]
}`,
      },
    ]);
  },
};

export default page;
