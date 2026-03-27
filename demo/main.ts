import '../src/define';
import { initRouter } from './lib/router';

// Sidebar toggle (mobile)
const sidebarToggle = document.getElementById('sidebar-toggle')!;
const sidebar = document.getElementById('sidebar')!;
sidebarToggle.addEventListener('click', () => {
  sidebar.classList.toggle('mobile-open');
});

// Close mobile sidebar when tapping content area
document.getElementById('content')!.addEventListener('click', () => {
  sidebar.classList.remove('mobile-open');
});

// Router
initRouter();
