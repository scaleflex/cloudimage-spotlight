import type { Page } from '../../lib/router';
import { renderCodeBlock } from '../../lib/code-block';

const page: Page = {
  render() {
    return `
      <div class="page-header">
        <h1>Blur mode</h1>
        <p>Instead of a solid color overlay, use a CDN-powered blurred version of the image as the mask. The highlighted region stays sharp.</p>
      </div>

      <section class="page-section">
        <div class="example-demo">
          <cloudimage-spotlight
            id="example-spotlight"
            config="./configs/blur-mode.json"
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
  "title": "Blur Mask Demo",
  "settings": {
    "maskStyle": "blur",
    "maskBlurRadius": 10
  },
  "scenes": [
    {
      "id": "blur-create-key",
      "image": "https://scaleflex.cloudimg.io/v7/...",
      "title": "Focus on the Modal",
      "description": "Blur mode keeps the background visible but blurred.",
      "regions": [
        { "tl_x": 0.27, "tl_y": 0.27, "br_x": 0.73, "br_y": 0.65 }
      ]
    },
    {
      "id": "blur-copy-key",
      "image": "https://scaleflex.cloudimg.io/v7/...",
      "title": "Highlight Multiple Areas",
      "description": "Multiple sharp regions cut through the blurred background.",
      "regions": [
        { "tl_x": 0.28, "tl_y": 0.36, "br_x": 0.72, "br_y": 0.44 },
        { "tl_x": 0.28, "tl_y": 0.47, "br_x": 0.72, "br_y": 0.56 }
      ]
    }
  ]
}`,
      },
      {
        label: 'CSS override',
        lang: 'css',
        code: `
/* Increase blur strength */
cloudimage-spotlight {
  --cis-mask-opacity: 0.8;
}`,
      },
    ]);
  },
};

export default page;
