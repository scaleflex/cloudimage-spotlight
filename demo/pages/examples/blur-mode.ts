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
  "settings": {
    "maskStyle": "blur",
    "maskBlurRadius": 8
  },
  "scenes": [
    {
      "id": "blur-demo",
      "image": "https://scaleflex.cloudimg.io/v7/...",
      "title": "Blur Masking",
      "description": "The area outside the region is blurred via the CDN.",
      "regions": [{ "tl_x": 0.3, "tl_y": 0.2, "br_x": 0.7, "br_y": 0.8 }],
      "mask": true,
      "maskStyle": "blur"
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
