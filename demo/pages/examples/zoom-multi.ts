import type { Page } from '../../lib/router';
import { renderCodeBlock } from '../../lib/code-block';

const page: Page = {
  render() {
    return `
      <div class="page-header">
        <h1>Zoom — Multiple regions</h1>
        <p>When <code>zoom: true</code> is set with multiple regions, the CDN crops to the smallest bounding box that contains all regions. All highlighted areas remain visible in the zoomed view.</p>
      </div>

      <section class="page-section">
        <div class="example-demo">
          <cloudimage-spotlight
            id="example-spotlight"
            config="./configs/zoom-multi.json"
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
      "id": "key-details",
      "image": "https://scaleflex.cloudimg.io/v7/...",
      "title": "Warning & Copy",
      "regions": [
        { "tl_x": 0.28, "tl_y": 0.36, "br_x": 0.72, "br_y": 0.44, "label": "Warning" },
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
