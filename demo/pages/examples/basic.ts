import type { Page } from '../../lib/router';
import { renderCodeBlock } from '../../lib/code-block';

const page: Page = {
  render() {
    return `
      <div class="page-header">
        <h1>Basic usage</h1>
        <p>The simplest Spotlight embed — a single-scene config with just an image, title, and description.</p>
      </div>

      <section class="page-section">
        <div class="example-demo">
          <cloudimage-spotlight
            id="example-spotlight"
            config="./configs/minimal.json"
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
<script type="module">
  import '@cloudimage/spotlight/define';
</script>

<cloudimage-spotlight
  config="./configs/minimal.json"
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
  "ciToken": "demo",
  "scenes": [
    {
      "id": "welcome",
      "image": "https://scaleflex.cloudimg.io/v7/...",
      "title": "Welcome",
      "description": "This is your dashboard overview."
    }
  ]
}`,
      },
      {
        label: 'React',
        lang: 'tsx',
        code: `
import { CloudimageSpotlight } from '@cloudimage/spotlight/react';

export function App() {
  return (
    <CloudimageSpotlight
      config="./configs/minimal.json"
      theme="light"
      showProgress
    />
  );
}`,
      },
    ]);
  },
};

export default page;
