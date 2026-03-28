import type { Page } from '../../lib/router';
import { renderCodeBlock } from '../../lib/code-block';

const page: Page = {
  render() {
    return `
      <div class="page-header">
        <h1>CSS customization</h1>
        <p>Every visual aspect of the annotation card, navigation buttons, progress pill, and close button can be overridden with <code>--cis-*</code> CSS custom properties.</p>
      </div>

      <style>
        #example-spotlight {
          /* Card container */
          --cis-card-max-width: 340px;
          --cis-card-padding: 16px 20px;
          --cis-card-bg: oklch(0.13 0.027 261.692 / 0.92);
          --cis-card-border: oklch(0.95 0.01 264.55 / 0.1);
          --cis-card-border-radius: 12px;
          --cis-card-backdrop-blur: blur(12px);

          /* Title & body */
          --cis-card-title-size: 15px;
          --cis-card-title-color: oklch(0.95 0.01 264.55);
          --cis-card-body-size: 13px;
          --cis-card-body-color: oklch(0.75 0.01 249.82);

          /* Progress pill */
          --cis-progress-bg: oklch(0.95 0.01 264.55 / 0.1);
          --cis-progress-font-size: 11px;
          --cis-progress-color: oklch(0.75 0.01 249.82);

          /* Close (X) button */
          --cis-close-color: oklch(0.75 0.01 249.82);
          --cis-close-bg-hover: oklch(0.95 0.01 264.55 / 0.1);
          --cis-close-color-hover: oklch(0.95 0.01 264.55);

          /* Shared nav button sizing */
          --cis-nav-btn-padding: 7px 16px;
          --cis-nav-btn-font-size: 13px;
          --cis-nav-btn-border-radius: 8px;

          /* Previous button (ghost/outlined) */
          --cis-nav-btn-ghost-border: oklch(0.95 0.01 264.55 / 0.2);
          --cis-nav-btn-ghost-color: oklch(0.85 0.01 264.55);
          --cis-nav-btn-ghost-bg-hover: oklch(0.95 0.01 264.55 / 0.08);

          /* Next button (filled primary) */
          --cis-nav-btn-primary-bg: oklch(0.15 0.02 261.692);
          --cis-nav-btn-primary-color: oklch(0.95 0.01 264.55);
          --cis-nav-btn-primary-bg-hover: oklch(0.22 0.025 261.692);

          /* Finish button (last scene, success green) */
          --cis-nav-btn-finish-bg: oklch(0.5 0.17 154.83);
          --cis-nav-btn-finish-color: oklch(1 0 0);
          --cis-nav-btn-finish-bg-hover: oklch(0.45 0.15 154.83);
        }
      </style>

      <section class="page-section">
        <div class="example-demo">
          <cloudimage-spotlight
            id="example-spotlight"
            config="./configs/annotation-styles.json"
            eager
            show-progress
            allow-skip
          ></cloudimage-spotlight>
        </div>
      </section>

      <section class="page-section">
        <h2>CSS variables</h2>
        <div id="css-code-container"></div>
      </section>
    `;
  },

  init() {
    renderCodeBlock('#css-code-container', [
      {
        label: 'Card & text',
        lang: 'css',
        code: `
cloudimage-spotlight {
  /* Card container */
  --cis-card-max-width: 340px;
  --cis-card-padding: 16px 20px;
  --cis-card-bg: oklch(0.13 0.027 261.692 / 0.92);
  --cis-card-border: oklch(0.95 0.01 264.55 / 0.1);
  --cis-card-border-radius: 12px;
  --cis-card-backdrop-blur: blur(12px);

  /* Title & body */
  --cis-card-title-size: 15px;
  --cis-card-title-color: oklch(0.95 0.01 264.55);
  --cis-card-body-size: 13px;
  --cis-card-body-color: oklch(0.75 0.01 249.82);
}`,
      },
      {
        label: 'Progress & close',
        lang: 'css',
        code: `
cloudimage-spotlight {
  /* Progress pill "1 / 3" */
  --cis-progress-bg: oklch(0.95 0.01 264.55 / 0.1);
  --cis-progress-font-size: 11px;
  --cis-progress-color: oklch(0.75 0.01 249.82);

  /* Close (X) button */
  --cis-close-color: oklch(0.75 0.01 249.82);
  --cis-close-bg-hover: oklch(0.95 0.01 264.55 / 0.1);
  --cis-close-color-hover: oklch(0.95 0.01 264.55);
}`,
      },
      {
        label: 'Nav buttons',
        lang: 'css',
        code: `
cloudimage-spotlight {
  /* Shared nav button sizing */
  --cis-nav-btn-padding: 7px 16px;
  --cis-nav-btn-font-size: 13px;
  --cis-nav-btn-border-radius: 8px;

  /* Previous button (ghost/outlined) */
  --cis-nav-btn-ghost-border: oklch(0.95 0.01 264.55 / 0.2);
  --cis-nav-btn-ghost-color: oklch(0.85 0.01 264.55);
  --cis-nav-btn-ghost-bg-hover: oklch(0.95 0.01 264.55 / 0.08);

  /* Next button (filled primary) */
  --cis-nav-btn-primary-bg: oklch(0.15 0.02 261.692);
  --cis-nav-btn-primary-color: oklch(0.95 0.01 264.55);
  --cis-nav-btn-primary-bg-hover: oklch(0.22 0.025 261.692);

  /* Finish button (last scene, success green) */
  --cis-nav-btn-finish-bg: oklch(0.5 0.17 154.83);
  --cis-nav-btn-finish-color: oklch(1 0 0);
  --cis-nav-btn-finish-bg-hover: oklch(0.45 0.15 154.83);
}`,
      },
      {
        label: 'Apply all at once',
        lang: 'html',
        code: `
<style>
  cloudimage-spotlight {
    --cis-card-bg: oklch(0.13 0.027 261.692 / 0.92);
    --cis-card-border-radius: 12px;
    --cis-card-title-color: oklch(0.95 0.01 264.55);
    --cis-card-body-color: oklch(0.75 0.01 249.82);
    --cis-nav-btn-primary-bg: oklch(0.15 0.02 261.692);
    --cis-nav-btn-primary-color: oklch(0.95 0.01 264.55);
    --cis-nav-btn-finish-bg: oklch(0.5 0.17 154.83);
  }
</style>

<cloudimage-spotlight
  config="./config.json"
  show-progress
  allow-skip
></cloudimage-spotlight>`,
      },
    ]);
  },
};

export default page;
