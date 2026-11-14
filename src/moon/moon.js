import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const MOON_MODEL = '/models/moon_topo_small.glb';

export function loadMoon(scene, onProgress) {
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader();

    loader.load(
      MOON_MODEL,
      (gltf) => {
        const moon = gltf.scene;
        const bounds = new THREE.Box3().setFromObject(moon);
        const center = bounds.getCenter(new THREE.Vector3());
        const size = bounds.getSize(new THREE.Vector3());
        const maxDimension = Math.max(size.x, size.y, size.z);

        if (!Number.isFinite(maxDimension) || maxDimension === 0) {
          reject(new Error('The Moon model has invalid dimensions.'));
          return;
        }

        const moonFrame = new THREE.Group();

        moon.position.sub(center);
        moon.scale.setScalar(2 / maxDimension);

        moonFrame.add(moon);
        scene.add(moonFrame);

        resolve({ moon, moonFrame, radius: 1 });
      },
      (progress) => {
        if (progress.total > 0 && onProgress) {
          onProgress(Math.round((progress.loaded / progress.total) * 100));
        }
      },
      reject
    );
  });
}
