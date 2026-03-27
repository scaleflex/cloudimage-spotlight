import type { Page } from '../../lib/router';
import { code, docNav, highlightAll } from '../../lib/doc-utils';

const page: Page = {
  render() {
    return `
      <div class="doc-content">
        <h1>Configuration</h1>
        <p class="doc-lead">
          The config JSON is the contract between the Spotlight authoring dashboard and the player component.
          It defines scenes, regions, annotations, and visual settings.
        </p>

        <h2>Config schema</h2>
        ${code('typescript', `interface SpotlightConfig {
  version: "1.0";
  ciToken: string;                    // Cloudimage token
  title?: string;                     // Experience title (used in aria-label)
  settings?: SpotlightSettings;
  scenes: SpotlightScene[];
}`)}

        <h3>Settings</h3>
        ${code('typescript', `interface SpotlightSettings {
  transition?: "fade" | "slide" | "zoom";   // Default: "fade"
  autoplay?: boolean;                        // Default: false
  autoplayInterval?: number;                 // ms, default: 4000
  showProgress?: boolean;                    // Default: true
  allowSkip?: boolean;                       // Default: true
  allowKeyboard?: boolean;                   // Default: true
  maskOpacity?: number;                      // 0\u20131, default: 0.65
  maskColor?: string;                        // CSS color, default: "#000000"
  maskStyle?: "color" | "blur";              // Default: "color"
  maskBlurRadius?: number;                   // 1\u201320, default: 8
  intro?: boolean | SpotlightIntro;          // Welcome screen
  outro?: boolean | SpotlightOutro;          // Completion screen
  staggerEntry?: boolean;                    // Default: true
}`)}

        <h3>Scene</h3>
        ${code('typescript', `interface SpotlightScene {
  id: string;                         // Unique, used for deep linking
  image: string;                      // Cloudimage-compatible URL
  title?: string;                     // Annotation card title
  description?: string;               // Annotation card body
  regions?: SpotlightRegion[];        // Highlight areas
  mask?: boolean;                     // Dim outside regions (default: true if regions set)
  zoom?: boolean;                     // CDN-crop to first region (default: false)
  annotation?: SpotlightAnnotation;
  cta?: SpotlightCTA;                 // Call-to-action button
  maskStyle?: "color" | "blur";       // Override per scene
  metadata?: Record<string, string>;  // Forwarded in event payloads
}`)}

        <h3>Region</h3>
        ${code('typescript', `interface SpotlightRegion {
  // Normalized coordinates: 0.0 = left/top, 1.0 = right/bottom
  tl_x: number;
  tl_y: number;
  br_x: number;
  br_y: number;
  shape?: "rect" | "ellipse";   // Default: "rect"
  padding?: number;              // Extra padding (normalized). Default: 0.02
  label?: string;                // Override auto-numbered badge
}`)}

        <h3>Annotation &amp; CTA</h3>
        ${code('typescript', `interface SpotlightAnnotation {
  position?: "top" | "bottom" | "left" | "right" | "auto";  // Default: "auto"
  style?: "card" | "tooltip" | "minimal";   // Default: "card"
  maxWidth?: number;                         // px, default: 320
  showConnector?: boolean;                   // Default: false
}

interface SpotlightCTA {
  label: string;                   // Button text
  href?: string;                   // If set, opens in new tab
  metadata?: Record<string, string>;
}`)}

        <h2>HTML attributes</h2>
        <table>
          <thead><tr><th>Attribute</th><th>Type</th><th>Default</th><th>Description</th></tr></thead>
          <tbody>
            <tr><td><code>config</code></td><td>string (URL)</td><td>\u2014</td><td>URL to JSON config file</td></tr>
            <tr><td><code>ci-token</code></td><td>string</td><td>\u2014</td><td>Cloudimage token (overrides config)</td></tr>
            <tr><td><code>theme</code></td><td>"dark" | "light" | "auto"</td><td>"dark"</td><td>Color theme</td></tr>
            <tr><td><code>lang</code></td><td>string (BCP 47)</td><td>"en"</td><td>UI language</td></tr>
            <tr><td><code>autoplay</code></td><td>boolean</td><td>false</td><td>Auto-advance scenes</td></tr>
            <tr><td><code>autoplay-interval</code></td><td>number (ms)</td><td>4000</td><td>Autoplay timing</td></tr>
            <tr><td><code>show-progress</code></td><td>boolean</td><td>true</td><td>Show "Step X of Y"</td></tr>
            <tr><td><code>allow-skip</code></td><td>boolean</td><td>true</td><td>Show Skip button</td></tr>
            <tr><td><code>allow-keyboard</code></td><td>boolean</td><td>true</td><td>Enable keyboard nav</td></tr>
            <tr><td><code>sync-url</code></td><td>boolean</td><td>false</td><td>Hash-based deep linking</td></tr>
            <tr><td><code>eager</code></td><td>boolean</td><td>false</td><td>Disable lazy loading</td></tr>
          </tbody>
        </table>
        <p><strong>Precedence:</strong> HTML attributes override <code>config.settings</code> for shared properties.</p>

        <h2>Minimal config</h2>
        ${code('json', `{
  "version": "1.0",
  "ciToken": "demo",
  "scenes": [
    {
      "id": "intro",
      "image": "https://samples.scaleflex.com/screenshots/dashboard.jpg",
      "title": "Welcome to Scaleflex DAM",
      "description": "This is your central asset hub."
    }
  ]
}`)}

        <h2>Full example</h2>
        ${code('json', `{
  "version": "1.0",
  "ciToken": "your-token",
  "title": "Asset Library Feature Tour",
  "settings": {
    "transition": "fade",
    "showProgress": true,
    "allowSkip": true,
    "maskOpacity": 0.7,
    "maskStyle": "color"
  },
  "scenes": [
    {
      "id": "overview",
      "image": "https://demo.scaleflex.com/screenshots/asset-library.jpg",
      "title": "Asset Library",
      "description": "Your central hub for all media assets."
    },
    {
      "id": "smart-tags",
      "image": "https://demo.scaleflex.com/screenshots/asset-library.jpg",
      "title": "AI Smart Tagging",
      "description": "Assets are automatically tagged using visual AI.",
      "regions": [{ "tl_x": 0.62, "tl_y": 0.08, "br_x": 0.98, "br_y": 0.44 }],
      "mask": true,
      "zoom": true,
      "cta": {
        "label": "Learn about AI tagging",
        "href": "https://docs.scaleflex.com/ai-tagging"
      }
    }
  ]
}`)}

        ${docNav(
          { href: '#/docs/getting-started', label: 'Getting started' },
          { href: '#/docs/api', label: 'API' },
        )}
      </div>
    `;
  },

  init() {
    highlightAll();
  },
};

export default page;
