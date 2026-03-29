import type { Page } from '../../lib/router';
import type { CloudimageSpotlightElement } from '../../../src/types';
import { renderCodeBlock } from '../../lib/code-block';

const page: Page = {
  render() {
    return `
      <div class="page-header">
        <h1>Transitions</h1>
        <p>Choose the animation effect used when navigating between scenes. Switch between <strong>fade</strong>, <strong>slide</strong>, and <strong>zoom</strong> transitions in real time.</p>
      </div>

      <section class="page-section">
        <div class="config-controls">
          <div class="form-group">
            <label>Transition effect</label>
            <div class="radio-group" id="transition-radios">
              <label><input type="radio" name="transition" value="fade" checked /> Fade</label>
              <label><input type="radio" name="transition" value="slide" /> Slide</label>
              <label><input type="radio" name="transition" value="zoom" /> Zoom</label>
            </div>
          </div>
        </div>
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
    const spotlight = document.getElementById('example-spotlight') as CloudimageSpotlightElement;
    const radios = document.getElementById('transition-radios')!;

    // Mutate the internal config's transition setting in place.
    // The transition type is read fresh on each scene change,
    // so the next navigation uses the selected effect immediately.
    radios.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      if (target.name !== 'transition') return;
      const config = (spotlight as any)._config;
      if (config) {
        if (!config.settings) config.settings = {};
        config.settings.transition = target.value;
      }
    });

    renderCodeBlock('#code-container', [
      {
        label: 'HTML',
        lang: 'markup',
        code: `<cloudimage-spotlight
  config="./config.json"
  theme="light"
></cloudimage-spotlight>`,
      },
      {
        label: 'Config (fade)',
        lang: 'json',
        code: `{
  "version": "1.0",
  "ciToken": "your-token",
  "settings": {
    "transition": "fade"
  },
  "scenes": [...]
}`,
      },
      {
        label: 'Config (slide)',
        lang: 'json',
        code: `{
  "version": "1.0",
  "ciToken": "your-token",
  "settings": {
    "transition": "slide"
  },
  "scenes": [...]
}`,
      },
      {
        label: 'Config (zoom)',
        lang: 'json',
        code: `{
  "version": "1.0",
  "ciToken": "your-token",
  "settings": {
    "transition": "zoom"
  },
  "scenes": [...]
}`,
      },
    ]);
  },
};

export default page;
