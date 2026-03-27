import { CloudimageSpotlight } from './spotlight-element';

if (typeof window !== 'undefined' && typeof customElements !== 'undefined') {
  if (!customElements.get('cloudimage-spotlight')) {
    customElements.define('cloudimage-spotlight', CloudimageSpotlight);
  }
}
