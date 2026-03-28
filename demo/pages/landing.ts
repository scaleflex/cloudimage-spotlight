import type { Page } from '../lib/router';
import { renderCodeBlock } from '../lib/code-block';
import type { CloudimageSpotlightElement } from '../../src/types';

const page: Page = {
  render() {
    return `
      <section class="hero">
        <div class="hero-inner">
          <div class="hero-badge">@cloudimage/spotlight</div>
          <h1><span class="gradient-text">Spotlight</span></h1>
          <p>CDN-native, screenshot-based interactive experience player. Build guided product tours with region highlighting, zoom, and annotations — powered by Cloudimage.</p>
          <div class="hero-actions">
            <a href="#/docs/getting-started" class="btn-primary">
              Get Started
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </a>
            <a href="https://www.npmjs.com/package/@cloudimage/spotlight" target="_blank" rel="noopener" class="btn-secondary">
              <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor"><path d="M0 256V0h256v256H0zm41-41h59.2v-133H141v133h33.4V41H41v174z"/></svg>
              npm
            </a>
          </div>
          <div class="hero-meta">
            <span>Web Component</span>
            <span>CDN-native zoom</span>
            <span>&lt; 16 KB gzipped</span>
            <span>React wrapper</span>
            <span>TypeScript</span>
          </div>
        </div>
      </section>

      <section class="demo-section">
        <div class="section-inner">
          <div class="section-header">
            <div class="section-label">Live demo</div>
            <h2>See it in action</h2>
            <p>An interactive product tour built with Spotlight. Click through scenes to see region highlighting, zoom, and annotations.</p>
          </div>
          <div class="demo-controls">
            <div class="demo-control-group">
              <span class="demo-control-label">Theme</span>
              <div class="demo-pills" id="theme-pills">
                <button class="demo-pill active" data-value="light">Light</button>
                <button class="demo-pill" data-value="dark">Dark</button>
                <button class="demo-pill" data-value="moon">Moon</button>
              </div>
            </div>
            <div class="demo-control-group">
              <span class="demo-control-label">Color</span>
              <div class="demo-pills" id="color-pills">
                <button class="demo-pill active" data-value="default"><span class="demo-pill-dot" style="background: #155bcd"></span>Default</button>
                <button class="demo-pill" data-value="emerald"><span class="demo-pill-dot" style="background: #10b981"></span>Emerald</button>
                <button class="demo-pill" data-value="purple"><span class="demo-pill-dot" style="background: #8b5cf6"></span>Purple</button>
                <button class="demo-pill" data-value="sunset"><span class="demo-pill-dot" style="background: #E07B00"></span>Sunset</button>
              </div>
            </div>
            <div class="demo-control-group">
              <span class="demo-control-label">Style</span>
              <div class="demo-pills" id="style-pills">
                <button class="demo-pill active" data-value="card">Card</button>
                <button class="demo-pill" data-value="tooltip">Tooltip</button>
                <button class="demo-pill" data-value="minimal">Minimal</button>
              </div>
            </div>
          </div>
          <div class="demo-spotlight-container">
            <cloudimage-spotlight
              id="demo-spotlight"
              config="./configs/full-example.json"
              theme="light"
              eager
              show-progress
            ></cloudimage-spotlight>
          </div>
        </div>
      </section>

      <section class="quick-start-section">
        <div class="section-inner">
          <div class="section-header">
            <div class="section-label">Quick Start</div>
            <h2>Up and running in under a minute</h2>
            <p>Install from npm, import the custom element, and embed your first Spotlight tour.</p>
          </div>
          <div class="quick-start-steps">
            <div class="quick-start-step">
              <div class="step-header">
                <div class="step-number">1</div>
                <h3>Install</h3>
              </div>
              <div class="step-code">
                <code>npm install @cloudimage/spotlight</code>
                <button class="step-copy" data-code="npm install @cloudimage/spotlight" aria-label="Copy to clipboard">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                </button>
              </div>
            </div>
            <div class="quick-start-step">
              <div class="step-header">
                <div class="step-number">2</div>
                <h3>Import</h3>
              </div>
              <div class="step-code">
                <code>import '@cloudimage/spotlight/define';</code>
                <button class="step-copy" data-code="import '@cloudimage/spotlight/define';" aria-label="Copy to clipboard">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                </button>
              </div>
            </div>
            <div class="quick-start-step">
              <div class="step-header">
                <div class="step-number">3</div>
                <h3>Embed</h3>
              </div>
              <p class="step-description">Add <code>&lt;cloudimage-spotlight&gt;</code> to your HTML and point it at your config JSON.</p>
            </div>
          </div>
          <div id="quick-start-code"></div>
        </div>
      </section>

      <section class="examples-section">
        <div class="section-inner">
          <div class="section-header">
            <div class="section-label">Examples</div>
            <h2>Explore what's possible</h2>
          </div>
          <div class="quick-start-grid">
            <a href="#/examples/basic" class="quick-start-card">
              <h3>Basic usage</h3>
              <p>Minimal config to render a single-scene spotlight tour.</p>
            </a>
            <a href="#/examples/multi-scene" class="quick-start-card">
              <h3>Multi-scene tour</h3>
              <p>A full 5-scene guided walkthrough with CTA buttons.</p>
            </a>
            <a href="#/examples/multi-region" class="quick-start-card">
              <h3>Multiple regions</h3>
              <p>Highlight multiple areas on a single screenshot with numbered badges.</p>
            </a>
            <a href="#/examples/blur-mode" class="quick-start-card">
              <h3>Blur mode</h3>
              <p>Use CDN-powered blur instead of color overlay for the mask.</p>
            </a>
            <a href="#/examples/intro" class="quick-start-card">
              <h3>Intro screen</h3>
              <p>Add a branded intro screen before the tour starts.</p>
            </a>
            <a href="#/examples/theming" class="quick-start-card">
              <h3>Theming</h3>
              <p>Switch between dark, light, and auto themes with CSS custom properties.</p>
            </a>
            <a href="#/examples/annotation-styles" class="quick-start-card">
              <h3>Annotation styles</h3>
              <p>Card, tooltip, and minimal styles with connector lines, progress pill, and close button.</p>
            </a>
            <a href="#/examples/autoplay" class="quick-start-card">
              <h3>Autoplay</h3>
              <p>Automatically advance through scenes with configurable timing.</p>
            </a>
            <a href="#/examples/events" class="quick-start-card">
              <h3>Event handling</h3>
              <p>Listen to scene changes, completion, CTA clicks, and errors.</p>
            </a>
          </div>
        </div>
      </section>

      <section class="demo-also" id="also-slider">
        <div class="demo-also-slides">
          <div class="demo-also-slide active">
            <div class="demo-also-inner">
              <div class="demo-also-content">
                <div class="demo-also-label">Also by Scaleflex</div>
                <h2>js-cloudimage-360-view</h2>
                <p>Interactive 360 product views with drag, zoom, autoplay and hotspots. Perfect for e-commerce product pages.</p>
                <div class="demo-also-actions">
                  <a href="https://scaleflex.github.io/js-cloudimage-360-view/" target="_blank" rel="noopener" class="btn-primary btn-sm">Live demo</a>
                  <a href="https://github.com/scaleflex/js-cloudimage-360-view" target="_blank" rel="noopener" class="btn-secondary btn-sm">GitHub</a>
                </div>
              </div>
              <div class="demo-also-visual">
                <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="grad360" x1="0" y1="0" x2="200" y2="200"><stop offset="0%" stop-color="rgba(44,153,255,0.3)"/><stop offset="100%" stop-color="rgba(0,212,170,0.15)"/></linearGradient></defs><circle cx="100" cy="100" r="80" stroke="rgba(255,255,255,0.08)" stroke-width="1"/><circle cx="100" cy="100" r="60" stroke="rgba(255,255,255,0.06)" stroke-width="1"/><ellipse cx="100" cy="100" rx="80" ry="32" stroke="url(#grad360)" stroke-width="2"/><ellipse cx="100" cy="100" rx="80" ry="32" transform="rotate(60 100 100)" stroke="rgba(0,212,170,0.2)" stroke-width="1.5"/><ellipse cx="100" cy="100" rx="80" ry="32" transform="rotate(120 100 100)" stroke="rgba(0,212,170,0.15)" stroke-width="1.5"/><circle cx="100" cy="100" r="6" fill="rgba(44,153,255,0.7)"/><circle cx="100" cy="100" r="3" fill="rgba(44,153,255,1)"/></svg>
              </div>
            </div>
          </div>
          <div class="demo-also-slide">
            <div class="demo-also-inner">
              <div class="demo-also-content">
                <div class="demo-also-label">Also by Scaleflex</div>
                <h2>js-cloudimage-hotspot</h2>
                <p>Add interactive hotspots to images with tooltips, custom styling, and responsive positioning.</p>
                <div class="demo-also-actions">
                  <a href="https://scaleflex.github.io/js-cloudimage-hotspot/" target="_blank" rel="noopener" class="btn-primary btn-sm">Live demo</a>
                  <a href="https://github.com/scaleflex/js-cloudimage-hotspot" target="_blank" rel="noopener" class="btn-secondary btn-sm">GitHub</a>
                </div>
              </div>
              <div class="demo-also-visual">
                <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="20" y="40" width="160" height="120" rx="8" stroke="rgba(255,255,255,0.1)" stroke-width="1.5" fill="rgba(255,255,255,0.02)"/><circle cx="65" cy="75" r="10" stroke="rgba(0,212,170,0.6)" stroke-width="2" fill="rgba(0,212,170,0.12)"/><circle cx="65" cy="75" r="3.5" fill="rgba(0,212,170,0.8)"/><circle cx="130" cy="110" r="10" stroke="rgba(44,153,255,0.6)" stroke-width="2" fill="rgba(44,153,255,0.12)"/><circle cx="130" cy="110" r="3.5" fill="rgba(44,153,255,0.8)"/><circle cx="90" cy="135" r="8" stroke="rgba(255,255,255,0.15)" stroke-width="1.5" fill="rgba(255,255,255,0.04)"/><circle cx="90" cy="135" r="3" fill="rgba(255,255,255,0.2)"/></svg>
              </div>
            </div>
          </div>
          <div class="demo-also-slide">
            <div class="demo-also-inner">
              <div class="demo-also-content">
                <div class="demo-also-label">Also by Scaleflex</div>
                <h2>filerobot-image-editor</h2>
                <p>Full-featured image editor with cropping, filters, annotations, and more. Works standalone or embedded.</p>
                <div class="demo-also-actions">
                  <a href="https://scaleflex.github.io/filerobot-image-editor/" target="_blank" rel="noopener" class="btn-primary btn-sm">Live demo</a>
                  <a href="https://github.com/scaleflex/filerobot-image-editor" target="_blank" rel="noopener" class="btn-secondary btn-sm">GitHub</a>
                </div>
              </div>
              <div class="demo-also-visual">
                <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="gradFIE" x1="20" y1="40" x2="180" y2="160"><stop offset="0%" stop-color="rgba(44,153,255,0.1)"/><stop offset="100%" stop-color="rgba(0,212,170,0.05)"/></linearGradient></defs><rect x="20" y="40" width="160" height="120" rx="8" stroke="rgba(255,255,255,0.1)" stroke-width="1.5" fill="rgba(255,255,255,0.02)"/><rect x="20" y="40" width="160" height="24" rx="8" fill="rgba(255,255,255,0.03)"/><circle cx="33" cy="52" r="4" fill="rgba(44,153,255,0.3)"/><circle cx="47" cy="52" r="4" fill="rgba(0,212,170,0.25)"/><circle cx="61" cy="52" r="4" fill="rgba(255,255,255,0.1)"/><path d="M45 130l30-40 22 22 18-18 30 36" stroke="rgba(44,153,255,0.5)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M45 130l30-40 22 22 18-18 30 36z" fill="url(#gradFIE)"/></svg>
              </div>
            </div>
          </div>
        </div>
        <div class="demo-also-dots" id="also-dots"></div>
      </section>

      <footer class="demo-footer">
        <div class="demo-footer-main">
          <div class="demo-footer-brand">
            <a href="https://www.scaleflex.com" target="_blank" rel="noopener">
              <img src="https://assets.scaleflex.com/Marketing/Logos/Scaleflex%20Logos/Logo%20Horizontal/scaleflex%20logo%20without%20tagline%20white%20text%20%28horizontal%29%20.png?vh=85bc00" alt="Scaleflex" class="demo-footer-logo" />
            </a>
            <p>CDN-native interactive experience player for screenshot-based product tours, powered by Cloudimage.</p>
          </div>
          <div class="demo-footer-col">
            <h4>Resources</h4>
            <a href="https://www.npmjs.com/package/@cloudimage/spotlight" target="_blank" rel="noopener">npm</a>
            <a href="#/docs/getting-started">Documentation</a>
            <a href="#/docs/api">API Reference</a>
          </div>
          <div class="demo-footer-col">
            <h4>Examples</h4>
            <a href="#/examples/basic">Basic usage</a>
            <a href="#/examples/theming">Theming</a>
            <a href="#/examples/events">Events</a>
          </div>
          <div class="demo-footer-col">
            <h4>Scaleflex</h4>
            <a href="https://www.scaleflex.com" target="_blank" rel="noopener">Website</a>
            <a href="https://www.cloudimage.io" target="_blank" rel="noopener">Cloudimage</a>
            <a href="https://www.scaleflex.com/en/digital-asset-management" target="_blank" rel="noopener">Scaleflex DAM</a>
          </div>
        </div>
        <div class="demo-footer-bottom">
          <p>Made with care by the <a href="https://www.scaleflex.com" target="_blank" rel="noopener">Scaleflex</a> team</p>
        </div>
      </footer>
    `;
  },

  init() {
    // ── Demo controls (pills) ──────────────────────
    const demoSpotlight = document.getElementById('demo-spotlight') as CloudimageSpotlightElement;
    let baseConfig: any = null;

    // Color presets: CSS custom properties for annotation cards
    const colorPresets: Record<string, Record<string, string>> = {
      default: {},
      emerald: {
        '--cis-accent': 'oklch(0.6 0.2 154.83)',
        '--cis-badge-bg': 'oklch(0.6 0.2 154.83)',
        '--cis-cta-bg': 'oklch(0.6 0.2 154.83)',
        '--cis-nav-btn-primary-bg': 'oklch(0.55 0.18 154.83)',
        '--cis-nav-btn-primary-bg-hover': 'oklch(0.5 0.16 154.83)',
        '--cis-nav-btn-finish-bg': 'oklch(0.6 0.2 154.83)',
        '--cis-nav-btn-finish-bg-hover': 'oklch(0.55 0.18 154.83)',
      },
      purple: {
        '--cis-accent': 'oklch(0.58 0.22 292)',
        '--cis-badge-bg': 'oklch(0.58 0.22 292)',
        '--cis-cta-bg': 'oklch(0.58 0.22 292)',
        '--cis-nav-btn-primary-bg': 'oklch(0.52 0.2 292)',
        '--cis-nav-btn-primary-bg-hover': 'oklch(0.48 0.18 292)',
        '--cis-nav-btn-finish-bg': 'oklch(0.58 0.22 292)',
        '--cis-nav-btn-finish-bg-hover': 'oklch(0.52 0.2 292)',
      },
      sunset: {
        '--cis-accent': 'oklch(0.682 0.162 58.67)',
        '--cis-badge-bg': 'oklch(0.682 0.162 58.67)',
        '--cis-cta-bg': 'oklch(0.682 0.162 58.67)',
        '--cis-cta-color': 'oklch(1 0 0)',
        '--cis-badge-color': 'oklch(1 0 0)',
        '--cis-badge-font-weight': '500',
        '--cis-nav-btn-primary-bg': 'oklch(0.626 0.149 58.56)',
        '--cis-nav-btn-primary-bg-hover': 'oklch(0.57 0.135 59.09)',
        '--cis-nav-btn-finish-bg': 'oklch(0.682 0.162 58.67)',
        '--cis-nav-btn-finish-bg-hover': 'oklch(0.626 0.149 58.56)',
        '--cis-nav-btn-finish-color': 'oklch(1 0 0)',
      },
    };

    // Moon theme: dark with indigo/silver tones
    const moonVars: Record<string, string> = {
      '--cis-accent': 'oklch(0.7 0.12 280)',
      '--cis-badge-bg': 'oklch(0.65 0.14 280)',
      '--cis-card-bg': 'oklch(0.18 0.035 280 / 0.94)',
      '--cis-card-border': 'oklch(0.85 0.06 280 / 0.12)',
      '--cis-card-title-color': 'oklch(0.92 0.02 280)',
      '--cis-card-body-color': 'oklch(0.75 0.03 280)',
      '--cis-cta-bg': 'oklch(0.65 0.14 280)',
      '--cis-nav-btn-primary-bg': 'oklch(0.55 0.12 280)',
      '--cis-nav-btn-primary-bg-hover': 'oklch(0.5 0.1 280)',
      '--cis-nav-btn-ghost-border': 'oklch(0.85 0.06 280 / 0.2)',
      '--cis-nav-btn-ghost-color': 'oklch(0.85 0.04 280)',
      '--cis-progress-color': 'oklch(0.7 0.04 280)',
      '--cis-close-color': 'oklch(0.7 0.04 280)',
      '--cis-nav-btn-finish-bg': 'oklch(0.65 0.14 280)',
      '--cis-nav-btn-finish-bg-hover': 'oklch(0.6 0.12 280)',
    };

    // Pre-compute the full set of CSS custom property keys for cleanup
    const allVarKeys = new Set<string>();
    Object.values(colorPresets).forEach((p) => Object.keys(p).forEach((k) => allVarKeys.add(k)));
    Object.keys(moonVars).forEach((k) => allVarKeys.add(k));

    let currentTheme = 'light';
    let currentColor = 'default';

    function applyStyles() {
      allVarKeys.forEach((k) => demoSpotlight.style.removeProperty(k));

      if (currentTheme === 'moon') {
        demoSpotlight.setAttribute('theme', 'dark');
        Object.entries(moonVars).forEach(([k, v]) => demoSpotlight.style.setProperty(k, v));
        if (currentColor !== 'default') {
          Object.entries(colorPresets[currentColor]).forEach(([k, v]) =>
            demoSpotlight.style.setProperty(k, v),
          );
        }
      } else {
        demoSpotlight.setAttribute('theme', currentTheme);
        if (currentColor !== 'default') {
          Object.entries(colorPresets[currentColor]).forEach(([k, v]) =>
            demoSpotlight.style.setProperty(k, v),
          );
        }
      }
    }

    async function applyAnnotationStyle(style: string) {
      if (!baseConfig) return;
      const savedIndex = demoSpotlight.currentIndex;
      const cfg = JSON.parse(JSON.stringify(baseConfig));
      for (const scene of cfg.scenes) {
        if (!scene.annotation) scene.annotation = {};
        scene.annotation.style = style;
      }
      await demoSpotlight.reload(cfg);
      if (savedIndex > 0) demoSpotlight.goTo(savedIndex);
    }

    // Fetch base config once for style switching
    fetch('./configs/full-example.json')
      .then((r) => r.json())
      .then((cfg) => { baseConfig = cfg; })
      .catch(() => { /* config already loaded via attribute; style switching just won't work */ });

    // Generic pill handler
    function setupPills(id: string, cb: (value: string) => void) {
      const container = document.getElementById(id);
      if (!container) return;
      container.addEventListener('click', (e) => {
        const btn = (e.target as HTMLElement).closest('.demo-pill') as HTMLElement | null;
        if (!btn || btn.classList.contains('active')) return;
        container.querySelector('.demo-pill.active')?.classList.remove('active');
        btn.classList.add('active');
        cb(btn.dataset.value ?? '');
      });
    }

    setupPills('theme-pills', (value) => {
      currentTheme = value;
      applyStyles();
    });

    setupPills('color-pills', (value) => {
      currentColor = value;
      applyStyles();
    });

    setupPills('style-pills', (value) => {
      applyAnnotationStyle(value);
    });

    // Copy buttons in quick-start steps
    document.querySelectorAll<HTMLButtonElement>('.step-copy').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const code = btn.dataset.code ?? '';
        try {
          await navigator.clipboard.writeText(code);
          btn.classList.add('copied');
          btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';
        } catch {
          // ignore
        }
        setTimeout(() => {
          btn.classList.remove('copied');
          btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
        }, 1500);
      });
    });

    renderCodeBlock('#quick-start-code', [
      {
        label: 'HTML',
        lang: 'markup',
        code: `
<script type="module">
  import '@cloudimage/spotlight/define';
</script>

<cloudimage-spotlight
  config="https://your-cdn.com/spotlight-config.json"
  theme="light"
  show-progress
></cloudimage-spotlight>`,
      },
      {
        label: 'React',
        lang: 'tsx',
        code: `
import { useRef } from 'react';
import {
  CloudimageSpotlight,
  type CloudimageSpotlightRef,
} from '@cloudimage/spotlight/react';

export function App() {
  const ref = useRef<CloudimageSpotlightRef>(null);

  return (
    <CloudimageSpotlight
      ref={ref}
      config="https://your-cdn.com/spotlight-config.json"
      theme="light"
      showProgress
      onSceneChange={(e) => console.log('Scene:', e.detail)}
      onComplete={() => console.log('Tour complete!')}
    />
  );
}`,
      },
    ]);

    // "Also by Scaleflex" slider
    const slides = document.querySelectorAll<HTMLElement>('.demo-also-slide');
    const dotsContainer = document.getElementById('also-dots');
    if (slides.length && dotsContainer) {
      let current = 0;
      let animating = false;
      let autoTimer: ReturnType<typeof setInterval>;

      slides.forEach((_, i) => {
        const dot = document.createElement('button');
        dot.className = `demo-also-dot${i === 0 ? ' active' : ''}`;
        dot.setAttribute('aria-label', `Slide ${i + 1}`);
        dot.addEventListener('click', () => goTo(i));
        dotsContainer.appendChild(dot);
      });
      const dots = dotsContainer.querySelectorAll<HTMLElement>('.demo-also-dot');

      function goTo(index: number) {
        if (index === current || animating) return;
        animating = true;
        const direction = index > current ? 'left' : 'right';
        const leaving = slides[current];
        const entering = slides[index];

        leaving.classList.add(`slide-out-${direction}`);
        entering.classList.add(`slide-in-${direction}`, 'active');

        entering.addEventListener('animationend', () => {
          leaving.classList.remove('active', `slide-out-${direction}`);
          entering.classList.remove(`slide-in-${direction}`);
          dots[current].classList.remove('active');
          dots[index].classList.add('active');
          current = index;
          animating = false;
        }, { once: true });

        resetAuto();
      }

      function resetAuto() {
        clearInterval(autoTimer);
        autoTimer = setInterval(() => goTo((current + 1) % slides.length), 5000);
      }
      resetAuto();

      (page as any)._cleanupSlider = () => clearInterval(autoTimer);
    }
  },

  destroy() {
    // Clean up demo spotlight
    const demoSpotlight = document.getElementById('demo-spotlight') as CloudimageSpotlightElement | null;
    if (demoSpotlight) demoSpotlight.pause();
    (page as any)._cleanupSlider?.();
    delete (page as any)._cleanupSlider;
  },
};

export default page;
