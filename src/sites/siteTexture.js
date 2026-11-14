import * as THREE from 'three';

const WIDTH = 2048;
const HEIGHT = 1024;
const SELECTED_SITE_RADIUS = 2.5;
const SITE_RADIUS = 1.7;

function createLayer() {
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;

  const context = canvas.getContext('2d');
  if (!context) throw new Error('Could not create the lunar paint canvas.');

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;

  return { canvas, context, texture };
}

function colorToRgba(color, alpha) {
  const hex = new THREE.Color(color).getHex();
  const red = (hex >> 16) & 255;
  const green = (hex >> 8) & 255;
  const blue = hex & 255;
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function drawSite(context, site, uv, selected) {
  if (!uv) return;

  const radiusDegrees = selected ? SELECTED_SITE_RADIUS : SITE_RADIUS;
  const latitude = THREE.MathUtils.degToRad(site.latitude);
  const cosLatitude = Math.max(Math.abs(Math.cos(latitude)), 0.15);

  const radiusX = Math.min(
    (radiusDegrees / 360 / cosLatitude) * WIDTH,
    WIDTH * 0.45
  );
  const radiusY = (radiusDegrees / 180) * HEIGHT;

  const centerX = uv.x * WIDTH;
  const centerY = (1 - uv.y) * HEIGHT;
  const centerAlpha = selected ? 0.72 : 0.34;
  const middleAlpha = selected ? 0.34 : 0.15;

  // Draw across the longitude seam as well as at the main UV position.
  for (const offset of [-WIDTH, 0, WIDTH]) {
    const x = centerX + offset;

    context.save();
    context.translate(x, centerY);
    context.scale(1, radiusY / Math.max(radiusX, 1));

    const gradient = context.createRadialGradient(0, 0, 0, 0, 0, radiusX);
    gradient.addColorStop(0, colorToRgba(site.color, centerAlpha));
    gradient.addColorStop(0.62, colorToRgba(site.color, middleAlpha));
    gradient.addColorStop(1, colorToRgba(site.color, 0));

    context.fillStyle = gradient;
    context.beginPath();
    context.arc(0, 0, radiusX, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }
}

export function createSiteTexture() {
  const base = createLayer();
  const selected = createLayer();

  function clear(layer) {
    layer.context.clearRect(0, 0, WIDTH, HEIGHT);
  }

  function addBaseSite(site, uv) {
    drawSite(base.context, site, uv, false);
    base.texture.needsUpdate = true;
  }

  function rebuildBase(sites, uvPositions) {
    clear(base);
    for (const site of sites) {
      drawSite(base.context, site, uvPositions.get(site.id), false);
    }
    base.texture.needsUpdate = true;
  }

  function setSelectedSite(site, uv) {
    clear(selected);
    if (site && uv) drawSite(selected.context, site, uv, true);
    selected.texture.needsUpdate = true;
  }

  return {
    baseTexture: base.texture,
    selectedTexture: selected.texture,
    addBaseSite,
    rebuildBase,
    setSelectedSite,
    dispose() {
      base.texture.dispose();
      selected.texture.dispose();
    }
  };
}
