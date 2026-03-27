export interface Page {
  render(): string;
  init?(): void;
  destroy?(): void;
}

type RouteEntry = { pattern: string; load: () => Promise<Page> };

const routes: RouteEntry[] = [
  { pattern: '/', load: () => import('../pages/landing').then((m) => m.default) },
  // Docs
  { pattern: '/docs/getting-started', load: () => import('../pages/docs/getting-started').then((m) => m.default) },
  { pattern: '/docs/configuration', load: () => import('../pages/docs/configuration').then((m) => m.default) },
  { pattern: '/docs/api', load: () => import('../pages/docs/api').then((m) => m.default) },
  { pattern: '/docs/theming', load: () => import('../pages/docs/theming').then((m) => m.default) },
  // Examples
  { pattern: '/examples/basic', load: () => import('../pages/examples/basic').then((m) => m.default) },
  { pattern: '/examples/multi-scene', load: () => import('../pages/examples/multi-scene').then((m) => m.default) },
  { pattern: '/examples/multi-region', load: () => import('../pages/examples/multi-region').then((m) => m.default) },
  { pattern: '/examples/zoom-single', load: () => import('../pages/examples/zoom-single').then((m) => m.default) },
  { pattern: '/examples/zoom-multi', load: () => import('../pages/examples/zoom-multi').then((m) => m.default) },
  { pattern: '/examples/blur-mode', load: () => import('../pages/examples/blur-mode').then((m) => m.default) },
  { pattern: '/examples/intro', load: () => import('../pages/examples/intro').then((m) => m.default) },
  { pattern: '/examples/theming', load: () => import('../pages/examples/theming').then((m) => m.default) },
  { pattern: '/examples/autoplay', load: () => import('../pages/examples/autoplay').then((m) => m.default) },
  { pattern: '/examples/annotation-styles', load: () => import('../pages/examples/annotation-styles').then((m) => m.default) },
  { pattern: '/examples/events', load: () => import('../pages/examples/events').then((m) => m.default) },
];

let currentPage: Page | null = null;
let navId = 0;

export function initRouter() {
  const content = document.getElementById('content')!;
  const sidebar = document.getElementById('sidebar')!;
  const sidebarDocs = document.getElementById('sidebar-docs')!;
  const sidebarExamples = document.getElementById('sidebar-examples')!;
  const topbarNavLinks = document.querySelectorAll<HTMLElement>('.topbar-nav-link');

  async function navigate() {
    const hash = location.hash.slice(1) || '/';
    const thisNav = ++navId;

    // Destroy previous page
    if (currentPage?.destroy) currentPage.destroy();

    // Find matching route
    const route = routes.find((r) => r.pattern === hash);
    if (!route) {
      location.hash = '#/';
      return;
    }

    // Determine section
    const isDocs = hash.startsWith('/docs/');
    const isExamples = hash.startsWith('/examples/');
    const hasSidebar = isDocs || isExamples;

    // Toggle layout classes
    const isHome = hash === '/';
    sidebar.classList.toggle('hidden', !hasSidebar);
    document.body.classList.toggle('has-sidebar', hasSidebar);
    document.body.classList.toggle('is-home', isHome);

    // Toggle doc vs example sidebar nav
    sidebarDocs.classList.toggle('hidden', !isDocs);
    sidebarExamples.classList.toggle('hidden', !isExamples);

    // Update active sidebar link
    sidebar.querySelectorAll('.sidebar-link').forEach((link) => {
      link.classList.toggle('active', link.getAttribute('data-route') === hash);
    });

    // Update active topbar nav link
    const activeSection = isDocs ? 'docs' : isExamples ? 'examples' : 'home';
    topbarNavLinks.forEach((link) => {
      link.classList.toggle('active', link.getAttribute('data-section') === activeSection);
    });

    // Close mobile sidebar
    sidebar.classList.remove('mobile-open');

    // Scroll to top
    window.scrollTo(0, 0);

    // Load & render page
    const page = await route.load();
    if (thisNav !== navId) return; // stale navigation
    currentPage = page;
    content.innerHTML = page.render();
    if (page.init) page.init();
  }

  window.addEventListener('hashchange', navigate);
  navigate();
}
