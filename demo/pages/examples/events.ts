import type { Page } from '../../lib/router';
import type { CloudimageSpotlightElement } from '../../../src/types';
import { renderCodeBlock } from '../../lib/code-block';

let listeners: Array<{ event: string; fn: EventListener }> = [];

const page: Page = {
  render() {
    return `
      <div class="page-header">
        <h1>Event handling</h1>
        <p>All events are typed <code>CustomEvent</code> instances that bubble and cross the Shadow DOM boundary. Interact with the player below and watch the event log.</p>
      </div>

      <section class="page-section">
        <div class="example-demo">
          <cloudimage-spotlight
            id="example-spotlight"
            config="./configs/full-example.json"
            theme="light"
            eager
            show-progress
          ></cloudimage-spotlight>
        </div>
        <div id="event-log" class="event-log"></div>
      </section>

      <section class="page-section">
        <h2>Code</h2>
        <div id="code-container"></div>
      </section>
    `;
  },

  init() {
    const spotlight = document.getElementById('example-spotlight') as CloudimageSpotlightElement;
    const logEl = document.getElementById('event-log')!;

    function log(event: string, data: string) {
      const line = document.createElement('div');
      const time = new Date().toLocaleTimeString();
      line.innerHTML = `<span class="log-time">${time}</span> <span class="log-event">${event}</span> <span class="log-data">${data}</span>`;
      logEl.appendChild(line);
      logEl.scrollTop = logEl.scrollHeight;
    }

    function addListener(event: string, fn: EventListener) {
      spotlight.addEventListener(event, fn);
      listeners.push({ event, fn });
    }

    addListener('cis:ready', ((e: CustomEvent) => {
      log('cis:ready', `${e.detail.totalScenes} scenes`);
    }) as EventListener);

    addListener('cis:scene-change', ((e: CustomEvent) => {
      log('cis:scene-change', `${e.detail.from} \u2192 ${e.detail.to} (${e.detail.scene.id})`);
    }) as EventListener);

    addListener('cis:complete', ((e: CustomEvent) => {
      log('cis:complete', `${e.detail.totalScenes} scenes, ${Math.round(e.detail.timeSpent / 1000)}s`);
    }) as EventListener);

    addListener('cis:skip', ((e: CustomEvent) => {
      log('cis:skip', `at scene ${e.detail.atScene}`);
    }) as EventListener);

    addListener('cis:cta-click', ((e: CustomEvent) => {
      log('cis:cta-click', e.detail.cta.label);
    }) as EventListener);

    addListener('cis:error', ((e: CustomEvent) => {
      log('cis:error', `[${e.detail.code}] ${e.detail.message}`);
    }) as EventListener);

    addListener('cis:fullscreen-change', ((e: CustomEvent) => {
      log('cis:fullscreen-change', e.detail.isFullscreen ? 'entered' : 'exited');
    }) as EventListener);

    renderCodeBlock('#code-container', [
      {
        label: 'JavaScript',
        lang: 'javascript',
        code: `
const el = document.querySelector('cloudimage-spotlight');

el.addEventListener('cis:ready', (e) => {
  console.log('Ready!', e.detail.totalScenes, 'scenes');
});

el.addEventListener('cis:scene-change', (e) => {
  console.log(\`Scene \${e.detail.from} \u2192 \${e.detail.to}\`);
});

el.addEventListener('cis:complete', (e) => {
  console.log('Done in', Math.round(e.detail.timeSpent / 1000), 's');
});

el.addEventListener('cis:skip', (e) => {
  console.log('Skipped at scene', e.detail.atScene);
});

el.addEventListener('cis:error', (e) => {
  console.error(\`[\${e.detail.code}] \${e.detail.message}\`);
});`,
      },
      {
        label: 'Analytics',
        lang: 'javascript',
        code: `
el.addEventListener('cis:scene-change', ({ detail }) => {
  gtag('event', 'spotlight_scene_view', {
    scene_id: detail.scene.id,
    scene_index: detail.to,
  });
});

el.addEventListener('cis:complete', ({ detail }) => {
  gtag('event', 'spotlight_complete', {
    time_spent_ms: detail.timeSpent,
  });
});`,
      },
    ]);
  },

  destroy() {
    const spotlight = document.getElementById('example-spotlight');
    if (spotlight) {
      listeners.forEach(({ event, fn }) => spotlight.removeEventListener(event, fn));
    }
    listeners = [];
  },
};

export default page;
