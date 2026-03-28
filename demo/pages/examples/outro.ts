import type { Page } from '../../lib/router';
import type { CloudimageSpotlightElement, SpotlightConfig } from '../../../src/types';
import { renderCodeBlock } from '../../lib/code-block';

const page: Page = {
  render() {
    return `
      <div class="page-header">
        <h1>Outro screen</h1>
        <p>Show a completion screen after the last scene. Optionally display scene navigation so users can jump back to any step.</p>
      </div>

      <section class="page-section">
        <div class="config-controls">
          <div class="form-group">
            <label>Scene navigation</label>
            <div class="radio-group">
              <label><input type="radio" name="scene-nav" value="none"> None</label>
              <label><input type="radio" name="scene-nav" value="list" checked> List</label>
              <label><input type="radio" name="scene-nav" value="grid"> Grid</label>
            </div>
          </div>
        </div>
        <div class="example-demo">
          <cloudimage-spotlight
            id="example-spotlight"
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
    const spotlight = document.getElementById('example-spotlight') as CloudimageSpotlightElement;
    const radios = document.querySelectorAll<HTMLInputElement>('input[name="scene-nav"]');

    // Fetch config once, then drive everything via JS property
    fetch('./configs/full-example.json')
      .then((r) => r.json())
      .then((baseConfig: SpotlightConfig) => {
        const applySceneNav = (value: string) => {
          const config = structuredClone(baseConfig);
          const outro = typeof config.settings!.outro === 'object' ? config.settings!.outro : {};
          if (value === 'none') {
            delete outro.sceneNav;
          } else {
            outro.sceneNav = value as 'list' | 'grid';
          }
          config.settings!.outro = outro;

          // Set config as JS object — triggers full re-init
          spotlight.config = config;
        };

        radios.forEach((radio) => {
          radio.addEventListener('change', () => {
            if (radio.checked) applySceneNav(radio.value);
          });
        });

        // Apply initial "list" config
        applySceneNav('list');
      });

    renderCodeBlock('#code-container', [
      {
        label: 'List',
        lang: 'json',
        code: `
{
  "settings": {
    "outro": {
      "title": "You're all set!",
      "description": "Jump to any step or restart the tour.",
      "sceneNav": "list"
    }
  }
}`,
      },
      {
        label: 'Grid',
        lang: 'json',
        code: `
{
  "settings": {
    "outro": {
      "title": "You're all set!",
      "description": "Jump to any step or restart the tour.",
      "sceneNav": "grid",
      "sceneGridColumns": 3
    }
  }
}`,
      },
      {
        label: 'None',
        lang: 'json',
        code: `
{
  "settings": {
    "outro": {
      "title": "You're all set!",
      "description": "Your API key is ready."
    }
  }
}`,
      },
    ]);
  },
};

export default page;
