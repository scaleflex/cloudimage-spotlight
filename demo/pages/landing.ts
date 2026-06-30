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
          <p>Turn screenshots into interactive product tours — with CDN-native zoom, region highlighting, and guided annotations.</p>
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
            <div class="quick-start-step quick-start-step--full">
              <div class="step-header">
                <div class="step-number">3</div>
                <h3>Embed</h3>
              </div>
              <p class="step-description">Add <code>&lt;cloudimage-spotlight&gt;</code> to your HTML and point it at your config JSON.</p>
              <div id="quick-start-code"></div>
            </div>
          </div>
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
              <div class="card-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>
              </div>
              <h3>Basic usage</h3>
              <p>Minimal config to render a spotlight tour with no regions or zoom.</p>
            </a>
            <a href="#/examples/multi-scene" class="quick-start-card">
              <div class="card-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 10h20"/><path d="M12 4v16"/></svg>
              </div>
              <h3>Multi-scene tour</h3>
              <p>A full 5-scene guided walkthrough with CTA buttons.</p>
            </a>
            <a href="#/examples/multi-region" class="quick-start-card">
              <div class="card-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
              </div>
              <h3>Multiple regions</h3>
              <p>Highlight multiple areas on a single screenshot with numbered badges.</p>
            </a>
            <a href="#/examples/zoom-single" class="quick-start-card">
              <div class="card-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
              </div>
              <h3>Zoom — Single region</h3>
              <p>CDN-native cropping zooms into a single highlighted region.</p>
            </a>
            <a href="#/examples/zoom-multi" class="quick-start-card">
              <div class="card-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              </div>
              <h3>Zoom — Multiple regions</h3>
              <p>Zoom to the bounding box of multiple highlighted areas at once.</p>
            </a>
            <a href="#/examples/blur-mode" class="quick-start-card">
              <div class="card-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
              </div>
              <h3>Blur mode</h3>
              <p>Use CDN-powered blur instead of color overlay for the mask.</p>
            </a>
            <a href="#/examples/intro" class="quick-start-card">
              <div class="card-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
              </div>
              <h3>Intro screen</h3>
              <p>Add a branded intro screen before the tour starts.</p>
            </a>
            <a href="#/examples/theming" class="quick-start-card">
              <div class="card-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
              </div>
              <h3>Theming</h3>
              <p>Switch between dark, light, and auto themes with CSS custom properties.</p>
            </a>
            <a href="#/examples/annotation-styles" class="quick-start-card">
              <div class="card-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              </div>
              <h3>Annotation styles</h3>
              <p>Card, tooltip, and minimal styles with connector lines, progress pill, and close button.</p>
            </a>
            <a href="#/examples/autoplay" class="quick-start-card">
              <div class="card-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </div>
              <h3>Autoplay</h3>
              <p>Automatically advance through scenes with configurable timing.</p>
            </a>
            <a href="#/examples/events" class="quick-start-card">
              <div class="card-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg>
              </div>
              <h3>Event handling</h3>
              <p>Listen to scene changes, completion, CTA clicks, and errors.</p>
            </a>
            <a href="#/examples/customization" class="quick-start-card">
              <div class="card-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              </div>
              <h3>CSS customization</h3>
              <p>Override every visual detail with <code>--cis-*</code> CSS custom properties.</p>
            </a>
          </div>
        </div>
      </section>

      <section class="sfx-also">
      <div class="sfx-also-head">
        <div class="sfx-also-label">Also by Scaleflex</div>
        <h2>Plugins for the modern web</h2>
        <p>A family of framework-agnostic JavaScript plugins — for digital asset management and interactive media experiences.</p>
      </div>
      <div class="sfx-also-cols">
        <div class="sfx-col sfx-col--sf">
          <div class="sfx-col-head">
            <span class="sfx-col-badge"></span>
            <span class="sfx-col-title">Scaleflex</span>
            <span class="sfx-col-ns">@scaleflex/*</span>
            <span class="sfx-col-count">3</span>
          </div>
          <div class="sfx-col-sub">Digital asset management</div>
          <div><a class="sfx-plugin-item" href="https://scaleflex.github.io/asset-picker/" target="_blank" rel="noopener"><span class="sfx-plugin-icon"><svg viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7.5" height="7.5" rx="1.6" stroke="currentColor" stroke-width="1.7"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.6" stroke="currentColor" stroke-width="1.7"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.6" stroke="currentColor" stroke-width="1.7"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.6" stroke="currentColor" stroke-width="1.7"/></svg></span><span class="sfx-plugin-name">Asset Picker</span><svg class="sfx-plugin-arrow" width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></a><a class="sfx-plugin-item" href="https://scaleflex.github.io/uploader/" target="_blank" rel="noopener"><span class="sfx-plugin-icon"><svg viewBox="0 0 24 24" fill="none"><path d="M12 16V6m0 0l-4 4m4-4l4 4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 18h14" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg></span><span class="sfx-plugin-name">Uploader</span><svg class="sfx-plugin-arrow" width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></a><a class="sfx-plugin-item" href="https://spotlight.scaleflex.com/docs/experience-picker" target="_blank" rel="noopener"><span class="sfx-plugin-icon"><svg viewBox="0 0 24 24" fill="none"><path d="M12 3l9 5-9 5-9-5 9-5z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M3 13l9 5 9-5" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg></span><span class="sfx-plugin-name">Experience Picker</span><svg class="sfx-plugin-arrow" width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></a></div>
        </div>
        <div class="sfx-col sfx-col--ci">
          <div class="sfx-col-head">
            <span class="sfx-col-badge"></span>
            <span class="sfx-col-title">Cloudimage</span>
            <span class="sfx-col-ns">js-cloudimage-*</span>
            <span class="sfx-col-count">9</span>
          </div>
          <div class="sfx-col-sub">Interactive media experiences</div>
          <div class="sfx-list-2col"><a class="sfx-plugin-item" href="https://scaleflex.github.io/cloudimage-3d-view/" target="_blank" rel="noopener"><span class="sfx-plugin-icon"><svg viewBox="0 0 24 24" fill="none"><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M12 3v9m0 0l8-4.5M12 12l-8-4.5" stroke="currentColor" stroke-width="1.4"/></svg></span><span class="sfx-plugin-name">3D Viewer</span><svg class="sfx-plugin-arrow" width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></a><a class="sfx-plugin-item" href="https://scaleflex.github.io/cloudimage-360-view/" target="_blank" rel="noopener"><span class="sfx-plugin-icon"><svg viewBox="0 0 24 24" fill="none"><path d="M3 12a9 9 0 0 1 9-9 9 9 0 0 1 6.7 3" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><path d="M21 12a9 9 0 0 1-9 9 9 9 0 0 1-6.7-3" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><path d="M18 3v3.5h-3.5M6 21v-3.5h3.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg></span><span class="sfx-plugin-name">360° Image View</span><svg class="sfx-plugin-arrow" width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></a><a class="sfx-plugin-item" href="https://scaleflex.github.io/cloudimage-360-video/" target="_blank" rel="noopener"><span class="sfx-plugin-icon"><svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.6"/><path d="M10 9l5 3-5 3V9z" fill="currentColor"/></svg></span><span class="sfx-plugin-name">360° Video</span><svg class="sfx-plugin-arrow" width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></a><a class="sfx-plugin-item" href="https://scaleflex.github.io/cloudimage-hotspot/" target="_blank" rel="noopener"><span class="sfx-plugin-icon"><svg viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" stroke-width="1.6"/><circle cx="9" cy="11" r="2.4" stroke="currentColor" stroke-width="1.6"/><path d="M9 8.6V6m0 7.4V16m-2.4-4.6H4m7.4 0H14" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg></span><span class="sfx-plugin-name">Image Hotspots</span><svg class="sfx-plugin-arrow" width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></a><a class="sfx-plugin-item" href="https://scaleflex.github.io/cloudimage-video-hotspot/" target="_blank" rel="noopener"><span class="sfx-plugin-icon"><svg viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" stroke-width="1.6"/><path d="M10 9l5 3-5 3V9z" fill="currentColor"/></svg></span><span class="sfx-plugin-name">Video Hotspots</span><svg class="sfx-plugin-arrow" width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></a><a class="sfx-plugin-item" href="https://scaleflex.github.io/cloudimage-before-after/" target="_blank" rel="noopener"><span class="sfx-plugin-icon"><svg viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" stroke-width="1.6"/><path d="M12 5v14" stroke="currentColor" stroke-width="1.6"/><path d="M8.5 10l-2 2 2 2M15.5 10l2 2-2 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></span><span class="sfx-plugin-name">Image Before/After</span><svg class="sfx-plugin-arrow" width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></a><a class="sfx-plugin-item" href="https://scaleflex.github.io/cloudimage-carousel/" target="_blank" rel="noopener"><span class="sfx-plugin-icon"><svg viewBox="0 0 24 24" fill="none"><rect x="7" y="6" width="10" height="12" rx="2" stroke="currentColor" stroke-width="1.6"/><path d="M4 9v6M20 9v6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg></span><span class="sfx-plugin-name">Image Carousel</span><svg class="sfx-plugin-arrow" width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></a><a class="sfx-plugin-item" href="https://scaleflex.github.io/cloudimage-image-crop/" target="_blank" rel="noopener"><span class="sfx-plugin-icon"><svg viewBox="0 0 24 24" fill="none"><path d="M6 2v14a2 2 0 0 0 2 2h14" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M18 22V8a2 2 0 0 0-2-2H2" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg></span><span class="sfx-plugin-name">Image Crop</span><svg class="sfx-plugin-arrow" width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></a><a class="sfx-plugin-item" href="https://scaleflex.github.io/cloudimage-spotlight/" target="_blank" rel="noopener"><span class="sfx-plugin-icon"><svg viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="1.6"/><path d="M16 16l4 4M11 8v6M8 11h6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg></span><span class="sfx-plugin-name">Spotlight</span><svg class="sfx-plugin-arrow" width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></a></div>
        </div>
      </div>
    </section>

      <footer class="demo-footer" role="contentinfo">
      <div class="demo-footer-main">
        <div class="demo-footer-brand">
          <a href="https://www.scaleflex.com" target="_blank" rel="noopener">
            <img src="https://assets.scaleflex.com/Marketing/Logos/Scaleflex%20Logos/Logo%20Horizontal/scaleflex%20logo%20without%20tagline%20white%20text%20%28horizontal%29%20.png?vh=85bc00" alt="Scaleflex" height="26" />
          </a>
          <p>CDN-native interactive experience player for screenshot-based product tours, powered by Cloudimage.</p>
        </div>
        <div class="demo-footer-links">
          <div class="demo-footer-col">
            <h4>Resources</h4>
            <a href="https://github.com/scaleflex/cloudimage-spotlight" target="_blank" rel="noopener">GitHub</a>
            <a href="https://www.npmjs.com/package/@cloudimage/spotlight" target="_blank" rel="noopener">npm</a>
            <a href="#/docs/getting-started">Documentation</a>
          </div>
          <div class="demo-footer-col">
            <h4>Examples</h4>
            <a href="#/examples/basic">Basic usage</a>
            <a href="#/examples/theming">Theming</a>
            <a href="#/examples/events">Events</a>
          </div>
          <div class="demo-footer-col">
            <h4>Support</h4>
            <a href="https://github.com/scaleflex/cloudimage-spotlight/issues" target="_blank" rel="noopener">Report an Issue</a>
            <a href="https://www.scaleflex.com/en/contact" target="_blank" rel="noopener">Contact Us</a>
          </div>
        </div>
      </div>
      <div class="demo-footer-bottom">
        <span>MIT License — Made with care by the <a href="https://www.scaleflex.com" target="_blank" rel="noopener">Scaleflex</a> team — Powered by <a href="https://www.cloudimage.io" target="_blank" rel="noopener">Cloudimage.io</a></span>
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
        '--cis-nav-btn-primary-bg': 'oklch(0.55 0.18 154.83)',
        '--cis-nav-btn-primary-bg-hover': 'oklch(0.5 0.16 154.83)',
        '--cis-nav-btn-finish-bg': 'oklch(0.6 0.2 154.83)',
        '--cis-nav-btn-finish-bg-hover': 'oklch(0.55 0.18 154.83)',
      },
      purple: {
        '--cis-accent': 'oklch(0.58 0.22 292)',
        '--cis-badge-bg': 'oklch(0.58 0.22 292)',
        '--cis-nav-btn-primary-bg': 'oklch(0.52 0.2 292)',
        '--cis-nav-btn-primary-bg-hover': 'oklch(0.48 0.18 292)',
        '--cis-nav-btn-finish-bg': 'oklch(0.58 0.22 292)',
        '--cis-nav-btn-finish-bg-hover': 'oklch(0.52 0.2 292)',
      },
      sunset: {
        '--cis-accent': 'oklch(0.682 0.162 58.67)',
        '--cis-badge-bg': 'oklch(0.682 0.162 58.67)',
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

  },

  destroy() {
    // Clean up demo spotlight
    const demoSpotlight = document.getElementById('demo-spotlight') as CloudimageSpotlightElement | null;
    if (demoSpotlight && typeof demoSpotlight.pause === 'function') demoSpotlight.pause();
    (page as any)._cleanupSlider?.();
    delete (page as any)._cleanupSlider;
  },
};

export default page;
