import type { Page } from '../../lib/router';
import type { CloudimageSpotlightElement } from '../../../src/types';
import { renderCodeBlock } from '../../lib/code-block';

const page: Page = {
  render() {
    return `
      <div class="page-header">
        <h1>Autoplay</h1>
        <p>Automatically advance through scenes. Autoplay pauses when the tab is hidden and resumes when visible.</p>
      </div>

      <section class="page-section">
        <div class="config-controls">
          <div class="form-group">
            <label for="autoplay-toggle">Autoplay</label>
            <select id="autoplay-toggle">
              <option value="off">Off</option>
              <option value="on" selected>On</option>
            </select>
          </div>
          <div class="form-group">
            <label for="interval-input">Interval (ms)</label>
            <input type="number" id="interval-input" value="4000" min="1000" max="15000" step="500" />
          </div>
        </div>
        <div class="example-demo">
          <cloudimage-spotlight
            id="example-spotlight"
            config="./configs/full-example.json"
            theme="light"
            eager
            show-progress
            autoplay
            autoplay-interval="4000"
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
    const toggle = document.getElementById('autoplay-toggle') as HTMLSelectElement;
    const intervalInput = document.getElementById('interval-input') as HTMLInputElement;

    toggle.addEventListener('change', () => {
      if (toggle.value === 'on') {
        spotlight.play();
      } else {
        spotlight.pause();
      }
    });

    intervalInput.addEventListener('change', () => {
      spotlight.setAttribute('autoplay-interval', intervalInput.value);
    });

    // Sync toggle when autoplay completes
    spotlight.addEventListener('cis:complete', () => {
      toggle.value = 'off';
    });

    renderCodeBlock('#code-container', [
      {
        label: 'HTML',
        lang: 'markup',
        code: `
<cloudimage-spotlight
  config="..."
  autoplay
  autoplay-interval="4000"
></cloudimage-spotlight>`,
      },
      {
        label: 'JavaScript',
        lang: 'javascript',
        code: `
const spotlight = document.querySelector('cloudimage-spotlight');

// Programmatic control
spotlight.play();
spotlight.pause();

// Check state
console.log(spotlight.isPlaying); // boolean`,
      },
      {
        label: 'Config',
        lang: 'json',
        code: `
{
  "settings": {
    "autoplayInterval": 4000
  }
}`,
      },
    ]);
  },
};

export default page;
