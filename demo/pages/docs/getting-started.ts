import type { Page } from '../../lib/router';
import { code, docNav, highlightAll } from '../../lib/doc-utils';

const page: Page = {
  render() {
    return `
      <div class="doc-content">
        <h1>Getting started</h1>
        <p class="doc-lead">
          <code>@cloudimage/spotlight</code> is a CDN-native, screenshot-based interactive experience player
          built as a Web Component. It renders guided walkthroughs with region highlighting, zoom, and annotations
          — powered by <a href="https://www.cloudimage.io" target="_blank" rel="noopener">Cloudimage</a>.
        </p>

        <h2>Features</h2>
        <ul>
          <li><strong>Web Component</strong> — standard <code>&lt;cloudimage-spotlight&gt;</code> custom element, works in any framework</li>
          <li><strong>CDN-native zoom</strong> — region coordinates map directly to Cloudimage crop params. No CSS zoom fallback.</li>
          <li><strong>SVG mask overlay</strong> — spotlight effect with color or blur masking per scene</li>
          <li><strong>Multiple regions per scene</strong> — numbered badges, all shown simultaneously</li>
          <li><strong>Annotation cards</strong> — auto-positioned with optional CTA buttons</li>
          <li><strong>Autoplay</strong> — configurable interval with visibility-aware pause/resume</li>
          <li><strong>Deep linking</strong> — hash-based scene navigation with <code>sync-url</code></li>
          <li><strong>Keyboard navigation</strong> — arrow keys, Space, Escape</li>
          <li><strong>Mobile-first</strong> — bottom-sheet annotations below 600px breakpoint</li>
          <li><strong>React wrapper</strong> — typed component with <code>forwardRef</code> and imperative ref</li>
          <li><strong>Tiny footprint</strong> — &lt; 16 KB gzipped including CSS</li>
          <li><strong>Zero dependencies</strong> — no runtime deps</li>
        </ul>

        <h2>Requirements</h2>
        <ul>
          <li>A <a href="https://www.cloudimage.io" target="_blank" rel="noopener">Cloudimage</a> token for CDN-powered zoom</li>
          <li>Modern browser: Chrome 73+, Firefox 101+, Safari 16.4+, Edge 79+</li>
        </ul>

        <h2>Installation</h2>
        ${code('bash', 'npm install @cloudimage/spotlight')}
        ${code('bash', 'yarn add @cloudimage/spotlight')}

        <h3>Package exports</h3>
        <table>
          <thead><tr><th>Export path</th><th>Description</th></tr></thead>
          <tbody>
            <tr><td><code>@cloudimage/spotlight</code></td><td><code>CloudimageSpotlightElement</code> class + all TypeScript types</td></tr>
            <tr><td><code>@cloudimage/spotlight/react</code></td><td>React wrapper component with typed ref</td></tr>
            <tr><td><code>@cloudimage/spotlight/define</code></td><td>Side-effect import — registers the custom element</td></tr>
          </tbody>
        </table>
        <p>Both ESM and CJS builds are provided.</p>

        <h2>Quick start</h2>

        <h3>Vanilla JS / Web Component</h3>
        ${code('markup', `<!-- 1. Register the custom element (once) -->
<script type="module">
  import '@cloudimage/spotlight/define';
</script>

<!-- 2. Embed with a config URL -->
<cloudimage-spotlight
  config="https://your-cdn.com/spotlight-config.json"
  theme="light"
  show-progress
></cloudimage-spotlight>`)}

        <h3>Inline JSON config</h3>
        ${code('markup', `<cloudimage-spotlight theme="light">
  <script type="application/json">
    {
      "version": "1.0",
      "ciToken": "your-token",
      "scenes": [
        {
          "id": "welcome",
          "image": "https://your-cdn.com/screenshot.jpg",
          "title": "Welcome",
          "description": "This is your dashboard."
        }
      ]
    }
  </script>
</cloudimage-spotlight>`)}

        <h3>React</h3>
        ${code('tsx', `import { useRef } from 'react';
import {
  CloudimageSpotlight,
  type CloudimageSpotlightRef,
} from '@cloudimage/spotlight/react';

function App() {
  const ref = useRef<CloudimageSpotlightRef>(null);

  return (
    <CloudimageSpotlight
      ref={ref}
      config="https://your-cdn.com/spotlight-config.json"
      theme="light"
      showProgress
      onSceneChange={(e) => console.log('Scene:', e.detail)}
      onComplete={() => console.log('Done!')}
    />
  );
}`)}

        <h2>Browser support</h2>
        <table>
          <thead><tr><th>Browser</th><th>Minimum version</th></tr></thead>
          <tbody>
            <tr><td>Chrome</td><td>73+</td></tr>
            <tr><td>Firefox</td><td>101+</td></tr>
            <tr><td>Safari</td><td>16.4+</td></tr>
            <tr><td>Edge (Chromium)</td><td>79+</td></tr>
          </tbody>
        </table>
        <p>Requires Custom Elements v1, Shadow DOM, and constructable stylesheets.</p>

        ${docNav(undefined, { href: '#/docs/configuration', label: 'Configuration' })}
      </div>
    `;
  },

  init() {
    highlightAll();
  },
};

export default page;
