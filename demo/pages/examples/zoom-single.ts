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
  "scenes": [
    {
      "id": "copy-key",
      "image": "https://scaleflex.cloudimg.io/v7/...",
      "title": "Copy Your API Key",
      "regions": [
        { "tl_x": 0.28, "tl_y": 0.47, "br_x": 0.72, "br_y": 0.56, "label": "Copy key" }
      ],
      "zoom": true
    }
  ]
}`,
      },
    ]);
  },
};

export default page;
