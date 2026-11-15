import { loadPlanetSphere } from '../planets/sphere.js';

const MARS_TEXTURE = `${import.meta.env.BASE_URL}textures/mars_color.jpg`;

export function loadMars(scene, onProgress) {
  return loadPlanetSphere(scene, {
    name: 'Mars',
    textureUrl: MARS_TEXTURE,
    onProgress,
    widthSegments: 256,
    heightSegments: 128
  });
}
