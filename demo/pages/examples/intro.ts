import type { Page } from '../../lib/router';
import { renderCodeBlock } from '../../lib/code-block';

const page: Page = {
  render() {
    return `
      <div class="page-header">
        <h1>Intro screen</h1>
        <p>Display a branded welcome screen before the tour starts. The user clicks "Start" to begin navigating scenes.</p>
      </div>

      <section class="page-section">
        <div class="example-demo">
          <cloudimage-spotlight
            id="example-spotlight"
            config="./configs/intro.json"
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
  "title": "Product Tour",
  "settings": {
    "intro": {
      "title": "Welcome to the Product Tour",
      "description": "Learn how to use the key features.",
      "startLabel": "Start Tour"
    }
  },
  "scenes": [
    {
      "id": "step-1",
      "image": "https://scaleflex.cloudimg.io/v7/...",
      "title": "First Step",
      "description": "This is the first thing you need to know."
    }
  ]
}`,
      },
      {
        label: 'Simple intro',
        lang: 'json',
        code: `
{
  "settings": {
    "intro": true
  }
}

// Uses the config "title" as the intro heading
// and default "Start" button label`,
      },
    ]);
  },
};

export default page;
