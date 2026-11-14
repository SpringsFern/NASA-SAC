import { createScene } from '../scene/scene.js';
import { loadMoon } from '../moon/moon.js';
import { loadMars } from '../mars/mars.js';
import { applySurfacePainting } from '../moon/surfacePainting.js';
import { createSiteManager } from '../sites/siteManager.js';
import { createSitePicker } from '../sites/sitePicker.js';
import { createStoryPanel } from '../ui/storyPanel.js';

export function createMoonExplorerPage({ stories, navigate, planet = 'moon' }) {
  const isMars = planet === 'mars';
  const planetName = isMars ? 'Mars' : 'The Moon';
  const element = document.createElement('section');
  element.className = `moon-page ${isMars ? 'mars-page' : 'lunar-page'}`;
  element.innerHTML = `
    <div class="moon-heading">
      <p class="eyebrow">${isMars ? 'INTERACTIVE MARS MAP' : 'INTERACTIVE LUNAR MAP'}</p>
      <h1>${planetName}</h1>
      <p>Rotate ${isMars ? 'Mars' : 'the Moon'} and select a highlighted location to explore its story.</p>
      ${isMars ? '<p class="planet-preview-note">Mars model loaded. Location coordinates currently reuse the Moon coordinate orientation and will be calibrated for Mars later.</p>' : ''}
    </div>
    <div class="moon-stage">
      <div class="moon-loading">Preparing ${isMars ? 'Mars' : 'lunar'} exploration...</div>
    </div>
    <div class="moon-hint">DRAG TO ROTATE <span>·</span> SCROLL TO ZOOM</div>
  `;

  const stage = element.querySelector('.moon-stage');
  const loading = element.querySelector('.moon-loading');

  let sceneParts = null;
  let siteManager = null;
  let surfacePainting = null;
  let sitePicker = null;
  let storyPanel = null;
  let pointerStart = null;
  let disposed = false;
  let resizeObserver = null;

  async function mount() {
    sceneParts = createScene(stage, planetName);
    storyPanel = createStoryPanel(stage, navigate, planet);

    const { scene, camera, renderer, controls } = sceneParts;
    const loadPlanet = isMars ? loadMars : loadMoon;

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointerup', onPointerUp);
    renderer.domElement.addEventListener('pointercancel', onPointerCancel);

    resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(stage);

    try {
      // Mars uses its own GLB loader, while reusing the Moon's current
      // rendering, surface painting, and coordinate conversion logic for now.
      const result = await loadPlanet(scene, (percent) => {
        if (!disposed) loading.textContent = `Loading ${planetName} preview... ${percent}%`;
      });

      if (disposed) {
        sceneParts.renderer.dispose();
        return;
      }

      const moon = result.moon;
      const moonFrame = result.moonFrame;

      siteManager = createSiteManager(moon, moonFrame, stories);
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

      loading.remove();
    } catch (error) {
      console.error(`Unable to load ${planetName}:`, error);
      if (!disposed) {
        const modelPath = isMars
          ? 'public/models/mars.glb'
          : 'public/models/moon_topo_small.glb';
        loading.textContent = `The ${planetName} preview could not be loaded. Check that ${modelPath} exists.`;
        loading.classList.add('has-error');
      }
    }

    animate();
  }

  function onPointerDown(event) {
    pointerStart = { x: event.clientX, y: event.clientY };
    if (sceneParts) sceneParts.controls.autoRotate = false;
  }

  function onPointerUp(event) {
    if (!pointerStart || !sitePicker || !siteManager) return;

    const movement = Math.hypot(
      event.clientX - pointerStart.x,
      event.clientY - pointerStart.y
    );
    pointerStart = null;

    if (movement > 5) return;

    const site = sitePicker.pick(event);
    if (!site) return;

    siteManager.setSelected(site.id);
    storyPanel.show(site);
  }

  function onPointerCancel() {
    pointerStart = null;
  }

  function resize() {
    if (!sceneParts) return;

    const width = stage.clientWidth;
    const height = stage.clientHeight;
    if (!width || !height) return;

    sceneParts.camera.aspect = width / height;
    sceneParts.camera.updateProjectionMatrix();
    sceneParts.renderer.setSize(width, height);
  }

  let animationFrame = 0;

  function animate() {
    if (disposed || !sceneParts) return;
    animationFrame = requestAnimationFrame(animate);
    sceneParts.controls.update();
    sceneParts.renderer.render(sceneParts.scene, sceneParts.camera);
  }

  function destroy() {
    disposed = true;
    cancelAnimationFrame(animationFrame);
    resizeObserver?.disconnect();

    if (sceneParts) {
      const canvas = sceneParts.renderer.domElement;
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerCancel);
    }

    storyPanel?.destroy();
    surfacePainting?.dispose();
    siteManager?.dispose();

    if (sceneParts) {
      sceneParts.controls.dispose();
      sceneParts.renderer.dispose();
      sceneParts.renderer.domElement.remove();
    }
  }

  return { element, mount, destroy };
}
