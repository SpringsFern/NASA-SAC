import { loadPlanetSphere } from '../planets/sphere.js';

const MOON_TEXTURE_8K = `${import.meta.env.BASE_URL}textures/moon_gray_8k.jpg`;
const MOON_TEXTURE_16K = `${import.meta.env.BASE_URL}textures/moon_gray_16k.jpg`;

export function loadMoon(scene, onProgress, maxTextureSize = 8192) {
  const textureUrl = maxTextureSize >= 16384
    ? MOON_TEXTURE_16K
    : MOON_TEXTURE_8K;

  return loadPlanetSphere(scene, {
    name: 'Moon',
    textureUrl,
    onProgress,
    widthSegments: 384,
    heightSegments: 192
  });
}
