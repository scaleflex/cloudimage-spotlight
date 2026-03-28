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
  "title": "Create an API Key",
  "settings": {
    "intro": {
      "title": "Create an API Key",
      "description": "Follow this quick 5-step guide to generate your first API key."
    },
    "outro": {
      "title": "You're all set!",
      "description": "Your API key is ready. Want to see the steps again?"
    }
  },
  "scenes": [
    {
      "id": "home",
      "image": "https://scaleflex.cloudimg.io/v7/...",
      "title": "Spotlight Dashboard",
      "description": "Start from the Experiences home page."
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
}`,
      },
    ]);
  },
};

export default page;
