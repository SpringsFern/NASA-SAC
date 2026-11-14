import './styles/base.css';
import './styles/moon.css';
import './styles/storyPanel.css';

import { createScene } from './scene/scene.js';
import { loadMoon } from './moon/moon.js';
import { applySurfacePainting } from './moon/surfacePainting.js';
import { createSiteManager } from './sites/siteManager.js';
import { createSitePicker } from './sites/sitePicker.js';
import { lunarSites } from './data/lunarSites.js';
import { createStoryPanel } from './ui/storyPanel.js';

const container = document.querySelector('#app');
const loading = document.querySelector('#loading');

if (!container || !loading) {
  throw new Error('The application container or loading element is missing.');
}

const { scene, camera, renderer, controls } = createScene(container);
const storyPanel = createStoryPanel(container);

let moon = null;
let moonFrame = null;
let siteManager = null;
let surfacePainting = null;
let sitePicker = null;
let pointerStart = null;

async function start() {
  try {
    const result = await loadMoon(scene, (percent) => {
      loading.textContent = `Loading Moon... ${percent}%`;
    });

    moon = result.moon;
    moonFrame = result.moonFrame;

    siteManager = createSiteManager(moon, moonFrame, lunarSites);
    surfacePainting = applySurfacePainting(
      moon,
      siteManager.baseTexture,
      siteManager.selectedTexture
    );

    sitePicker = createSitePicker(
      renderer.domElement,
      camera,
      moon,
      moonFrame,
      siteManager
    );

    loading.textContent =
      'Select a highlighted location to discover its story';
    loading.classList.add('loaded');
  } catch (error) {
    console.error('Unable to start Beyond the Mission:', error);
    loading.textContent = 'Unable to load the Moon. Please refresh the page.';
  }
}

renderer.domElement.addEventListener('pointerdown', (event) => {
  pointerStart = {
    x: event.clientX,
    y: event.clientY
  };

  controls.autoRotate = false;
});

renderer.domElement.addEventListener('pointerup', (event) => {
  if (!pointerStart || !sitePicker || !siteManager) return;

  const movement = Math.hypot(
    event.clientX - pointerStart.x,
    event.clientY - pointerStart.y
  );

  pointerStart = null;

  // Ignore drags; only treat a stationary pointer release as a click.
  if (movement > 5) return;

  const site = sitePicker.pick(event);

  if (!site) return;

  siteManager.setSelected(site.id);
  storyPanel.show(site);
});

renderer.domElement.addEventListener('pointercancel', () => {
  pointerStart = null;
});

function resize() {
  const width = container.clientWidth;
  const height = container.clientHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}

window.addEventListener('resize', resize);

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

start();
animate();
