
import './styles/base.css';
import './styles/moon.css';
import './styles/storyPanel.css';

import { createScene } from './scene/scene.js';
import { loadMoon } from './moon/moon.js';

import {
  createMarkers,
  getClickedMarker
} from './moon/markers.js';

import { lunarSites } from './data/lunarSites.js';
import { createStoryPanel } from './ui/storyPanel.js';

// Main container
const container = document.querySelector('#app');
const loading = document.querySelector('#loading');

// Create Three.js scene
const {
  scene,
  camera,
  renderer,
  controls
} = createScene(container);

// Create story panel
const storyPanel = createStoryPanel(container);

// Load Moon
let markers = [];

loadMoon(scene, (percent) => {
  loading.textContent = `Loading Moon... ${percent}%`;
})
.then(({ moon, moonFrame, radius }) => {

  // Create geographically aligned markers
  markers = createMarkers(
    moonFrame,
    moon,
    lunarSites,
    radius
  );

  loading.textContent =
    'Select a glowing marker to discover a lunar story';

  loading.classList.add('loaded');

})
.catch((error) => {
  console.error(error);
  loading.textContent = 'Unable to load Moon model.';
});

// Detect clicks
let pointerStart = null;

renderer.domElement.addEventListener('pointerdown', (event) => {
  pointerStart = {
    x: event.clientX,
    y: event.clientY
  };

  controls.autoRotate = false;
});

renderer.domElement.addEventListener('pointerup', (event) => {
  if (!pointerStart) return;

  const movement = Math.hypot(
    event.clientX - pointerStart.x,
    event.clientY - pointerStart.y
  );

  pointerStart = null;

  // Ignore drag movements
  if (movement > 5) return;

  const site = getClickedMarker(
    event,
    renderer.domElement,
    camera,
    markers
  );

  if (site) {
    storyPanel.show(site);
  }
});

// Resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(
    window.innerWidth,
    window.innerHeight
  );
});

// Animation
function animate() {
  requestAnimationFrame(animate);

  controls.update();
  renderer.render(scene, camera);
}

animate();
