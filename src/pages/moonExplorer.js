import { createScene } from '../scene/scene.js';
import { loadMoon } from '../moon/moon.js';
import { loadMars } from '../mars/mars.js';
import { marsCoordinatesToUV, marsDirectionFromCoordinates } from '../mars/marsCoordinates.js';
import { moonCoordinatesToUV, moonDirectionFromCoordinates } from '../moon/moonCoordinates.js';
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
      ${isMars
        ? '<p class="planet-preview-note">Map: Viking Global Colour Mosaic · 925 m/pixel</p>'
        : '<p class="planet-preview-note">Map: LRO WAC Global Grayscale Mosaic · 100 m/pixel source</p>'}
    </div>
    <div class="moon-stage">
      <div class="moon-loading">Preparing ${isMars ? 'Mars' : 'lunar'} exploration...</div>
    </div>
    <div class="coordinate-readout">
      <div class="coordinate-label">SURFACE COORDINATES</div>

      <div class="coordinate-value">
        <span>LAT</span>
        <strong class="coordinate-latitude">--.------°</strong>
      </div>

      <div class="coordinate-value">
        <span>LON</span>
        <strong class="coordinate-longitude">--.------°</strong>
      </div>
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
  let planetResources = null;
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
      // Moon and Mars share the same equirectangular sphere renderer.
      // Each planet retains its own georeferencing conversion for markers.
      const result = await loadPlanet(scene, (percent) => {
        if (!disposed) loading.textContent = `Loading ${planetName} preview... ${percent}%`;
      }, renderer.capabilities.maxTextureSize);

      if (disposed) {
        sceneParts.renderer.dispose();
        return;
      }

      planetResources = result;
      const moon = result.moon;
      const moonFrame = result.moonFrame;

      const siteOptions = isMars
        ? {
            directionFromCoordinates: marsDirectionFromCoordinates,
            getSiteUV: marsCoordinatesToUV
          }
        : {
            directionFromCoordinates: moonDirectionFromCoordinates,
            getSiteUV: moonCoordinatesToUV
          };

      siteManager = createSiteManager(moon, moonFrame, stories, siteOptions);
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
      renderer.domElement.addEventListener(
        'pointermove',
        onPointerMove
      );

      loading.remove();
    } catch (error) {
      console.error(`Unable to load ${planetName}:`, error);
      if (!disposed) {
        const requiredAsset = isMars
          ? 'public/textures/mars_color.jpg'
          : 'public/textures/moon_gray_8k.jpg and public/textures/moon_gray_16k.jpg';
        loading.textContent = `The ${planetName} preview could not be loaded. Check that ${requiredAsset} exists.`;
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
      canvas.removeEventListener('pointermove', onPointerMove);
    }

    storyPanel?.destroy();
    surfacePainting?.dispose();
    siteManager?.dispose();
    planetResources?.dispose?.();

    if (sceneParts) {
      sceneParts.controls.dispose();
      sceneParts.renderer.dispose();
      sceneParts.renderer.domElement.remove();
    }
  }

  function onPointerMove(event) {
  if (!sitePicker) return;

  const coordinates = sitePicker.getCoordinates(event);

  const readout = element.querySelector('.coordinate-readout');
  const latitudeElement = element.querySelector('.coordinate-latitude');
  const longitudeElement = element.querySelector('.coordinate-longitude');

  if (!coordinates) {
    readout.classList.remove('is-visible');
    return;
  }

  latitudeElement.textContent =
    `${coordinates.latitude.toFixed(6)}°`;

  longitudeElement.textContent =
    `${coordinates.longitude.toFixed(6)}°`;

  readout.classList.add('is-visible');
}

  return { element, mount, destroy };
}
