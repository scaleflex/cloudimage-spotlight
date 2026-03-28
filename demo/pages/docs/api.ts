import type { Page } from '../../lib/router';
import { code, docNav, highlightAll } from '../../lib/doc-utils';

const page: Page = {
  render() {
    return `
      <div class="doc-content">
        <h1>API</h1>
        <p class="doc-lead">
          Public methods, read-only properties, and typed events available on the
          <code>&lt;cloudimage-spotlight&gt;</code> element.
        </p>

        <h2>Methods</h2>
        <table>
          <thead><tr><th>Method</th><th>Description</th></tr></thead>
          <tbody>
            <tr><td><code>next()</code></td><td>Advance to next scene. On last scene, dispatches <code>cis:complete</code>.</td></tr>
            <tr><td><code>prev()</code></td><td>Go to previous scene. No-op on first scene.</td></tr>
            <tr><td><code>goTo(index)</code></td><td>Go to scene by 0-based index. No-op if out of range.</td></tr>
            <tr><td><code>goToId(id)</code></td><td>Go to scene by <code>scene.id</code>. No-op if not found.</td></tr>
            <tr><td><code>play()</code></td><td>Start autoplay.</td></tr>
            <tr><td><code>pause()</code></td><td>Pause autoplay.</td></tr>
            <tr><td><code>destroy()</code></td><td>Tear down all listeners and clear Shadow DOM. Call <code>reload()</code> to re-init.</td></tr>
            <tr><td><code>reload(config?)</code></td><td>Reset to scene 0 and re-render. Omit config to re-fetch current URL.</td></tr>
          </tbody>
        </table>

        <h3>Read-only properties</h3>
        <table>
          <thead><tr><th>Property</th><th>Type</th><th>Description</th></tr></thead>
          <tbody>
            <tr><td><code>currentIndex</code></td><td><code>number</code></td><td>Current scene index (0-based)</td></tr>
            <tr><td><code>totalScenes</code></td><td><code>number</code></td><td>Total number of scenes</td></tr>
            <tr><td><code>isPlaying</code></td><td><code>boolean</code></td><td>Whether autoplay is active</td></tr>
            <tr><td><code>currentScene</code></td><td><code>SpotlightScene</code></td><td>Current scene object</td></tr>
          </tbody>
        </table>

        <h3>Usage example</h3>
        ${code('javascript', `const spotlight = document.querySelector('cloudimage-spotlight');

// External navigation
document.querySelector('#next-btn').onclick = () => spotlight.next();

// Deep link to a specific scene
spotlight.goToId('smart-tags');

// Programmatic autoplay
spotlight.play();
setTimeout(() => spotlight.pause(), 10000);`)}

        <h2>Events</h2>
        <p>All events are <code>CustomEvent</code> instances that bubble and cross the Shadow DOM boundary (<code>composed: true</code>).</p>

        <table>
          <thead><tr><th>Event</th><th>Fired when</th><th><code>detail</code> payload</th></tr></thead>
          <tbody>
            <tr>
              <td><code>cis:ready</code></td>
              <td>Config loaded, first scene rendered</td>
              <td><code>{ totalScenes, config }</code></td>
            </tr>
            <tr>
              <td><code>cis:scene-change</code></td>
              <td>User navigates to a new scene</td>
              <td><code>{ from, to, scene, totalScenes }</code></td>
            </tr>
            <tr>
              <td><code>cis:complete</code></td>
              <td>User clicks Next on last scene</td>
              <td><code>{ totalScenes, timeSpent, config }</code></td>
            </tr>
            <tr>
              <td><code>cis:skip</code></td>
              <td>User clicks Skip</td>
              <td><code>{ atScene, scene, totalScenes }</code></td>
            </tr>
            <tr>
              <td><code>cis:cta-click</code></td>
              <td>CTA button clicked (no <code>href</code>)</td>
              <td><code>{ scene, cta, metadata? }</code></td>
            </tr>
            <tr>
              <td><code>cis:region-enter</code></td>
              <td>Scene with regions becomes active</td>
              <td><code>{ scene, regions }</code></td>
            </tr>
            <tr>
              <td><code>cis:error</code></td>
              <td>Config fetch or validation error</td>
              <td><code>{ message, code }</code></td>
            </tr>
            <tr>
              <td><code>cis:fullscreen-change</code></td>
              <td>Fullscreen mode entered or exited</td>
              <td><code>{ isFullscreen }</code></td>
            </tr>
          </tbody>
        </table>

        <h3>Error codes</h3>
        <table>
          <thead><tr><th>Code</th><th>Description</th></tr></thead>
          <tbody>
            <tr><td><code>FETCH_FAILED</code></td><td>Config URL returned non-OK status or network error</td></tr>
            <tr><td><code>INVALID_JSON</code></td><td>Config is not valid JSON</td></tr>
            <tr><td><code>INVALID_VERSION</code></td><td>Unknown config version string</td></tr>
            <tr><td><code>MISSING_TOKEN</code></td><td>No <code>ciToken</code> in config or <code>ci-token</code> attribute</td></tr>
            <tr><td><code>MISSING_IMAGE</code></td><td>A scene is missing the <code>image</code> field</td></tr>
            <tr><td><code>INVALID_REGION</code></td><td>Region coordinates are out of 0\u20131 range</td></tr>
            <tr><td><code>IMAGE_LOAD_FAILED</code></td><td>An image URL failed to load</td></tr>
          </tbody>
        </table>

        <h3>Listening to events</h3>
        ${code('javascript', `const el = document.querySelector('cloudimage-spotlight');

el.addEventListener('cis:ready', (e) => {
  console.log('Ready! Total scenes:', e.detail.totalScenes);
});

el.addEventListener('cis:scene-change', (e) => {
  console.log(\`Scene \${e.detail.from} \u2192 \${e.detail.to}\`);
});

el.addEventListener('cis:complete', (e) => {
  console.log('Tour complete in', Math.round(e.detail.timeSpent / 1000), 's');
});

el.addEventListener('cis:error', (e) => {
  console.error(\`[\${e.detail.code}] \${e.detail.message}\`);
});`)}

        <h3>Analytics integration</h3>
        ${code('javascript', `el.addEventListener('cis:scene-change', ({ detail }) => {
  gtag('event', 'spotlight_scene_view', {
    scene_id: detail.scene.id,
    scene_index: detail.to,
  });
});

el.addEventListener('cis:complete', ({ detail }) => {
  gtag('event', 'spotlight_complete', {
    time_spent_ms: detail.timeSpent,
  });
});`)}

        <h2>Keyboard controls</h2>
        <table>
          <thead><tr><th>Key</th><th>Action</th></tr></thead>
          <tbody>
            <tr><td><code>\u2192</code> / <code>Space</code></td><td>Next scene</td></tr>
            <tr><td><code>\u2190</code></td><td>Previous scene</td></tr>
            <tr><td><code>Escape</code></td><td>Skip / exit fullscreen</td></tr>
            <tr><td><code>Home</code></td><td>First scene</td></tr>
            <tr><td><code>End</code></td><td>Last scene</td></tr>
            <tr><td><code>1\u20139</code></td><td>Jump to scene by number</td></tr>
          </tbody>
        </table>
        <p>Keyboard navigation can be disabled with <code>allow-keyboard="false"</code>.</p>

        ${docNav(
          { href: '#/docs/configuration', label: 'Configuration' },
          { href: '#/docs/theming', label: 'Theming' },
        )}
      </div>
    `;
  },

  init() {
    highlightAll();
  },
};

export default page;
