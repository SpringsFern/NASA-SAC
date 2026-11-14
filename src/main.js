import './styles/base.css';
import './styles/sidebar.css';
import './styles/moon.css';
import './styles/story.css';

import { loadStories } from './data/stories.js';
import { createRouter } from './router/router.js';
import { createSidebar } from './ui/sidebar.js';
import { createMoonExplorerPage } from './pages/moonExplorer.js';
import { createStoryIndexPage } from './pages/storyIndex.js';
import { createStoryDetailPage } from './pages/storyDetail.js';

const app = document.querySelector('#app');

if (!app) {
  throw new Error('Application root #app was not found.');
}

const stories = loadStories();

app.innerHTML = `
  <div class="app-shell">
    <aside id="app-sidebar"></aside>
    <main id="page-content" tabindex="-1"></main>
  </div>
`;

const sidebarRoot = app.querySelector('#app-sidebar');
const pageRoot = app.querySelector('#page-content');
const sidebar = createSidebar(sidebarRoot);

let activePage = null;

const router = createRouter((pathname) => {
  if (activePage?.destroy) {
    activePage.destroy();
  }

  activePage = null;
  pageRoot.replaceChildren();
  sidebar.setActivePath(pathname);

  if (pathname === '/' || pathname === '/moon') {
    activePage = createMoonExplorerPage({
      planet: 'moon',
      stories: stories.filter((story) => story.planet === 'moon'),
      navigate: router.navigate
    });
  } else if (pathname === '/mars') {
    activePage = createMoonExplorerPage({
      planet: 'mars',
      stories: stories.filter((story) => story.planet === 'mars'),
      navigate: router.navigate
    });
  } else if (pathname === '/story/moon') {
    activePage = createStoryIndexPage({
      stories: stories.filter((story) => story.planet === 'moon'),
      planet: 'moon'
    });
  } else if (pathname === '/story/mars') {
    activePage = createStoryIndexPage({
      stories: stories.filter((story) => story.planet === 'mars'),
      planet: 'mars'
    });
  } else if (pathname.startsWith('/story/')) {
    const story = stories.find((item) => item.url === pathname);
    activePage = story
      ? createStoryDetailPage(story)
      : createStoryDetailPage(null);
  } else {
    activePage = createStoryDetailPage(null);
  }

  pageRoot.appendChild(activePage.element);
  activePage.mount?.();
  pageRoot.focus({ preventScroll: true });
});

router.start();

window.addEventListener('beforeunload', () => {
  activePage?.destroy?.();
  router.destroy();
  sidebar.destroy();
});
