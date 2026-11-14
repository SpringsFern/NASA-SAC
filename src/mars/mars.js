import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const MARS_MODEL = `${import.meta.env.BASE_URL}models/mars.glb`;

export function loadMars(scene, onProgress) {
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader();

    loader.load(
      MARS_MODEL,
      (gltf) => {
        const mars = gltf.scene;
        const bounds = new THREE.Box3().setFromObject(mars);
        const center = bounds.getCenter(new THREE.Vector3());
        const size = bounds.getSize(new THREE.Vector3());
        const maxDimension = Math.max(size.x, size.y, size.z);

        if (!Number.isFinite(maxDimension) || maxDimension === 0) {
          reject(new Error('The Mars model has invalid dimensions.'));
          return;
        }

        const marsFrame = new THREE.Group();

        mars.position.sub(center);
        mars.scale.setScalar(2 / maxDimension);

        marsFrame.add(mars);
        scene.add(marsFrame);

        resolve({ moon: mars, moonFrame: marsFrame, radius: 1 });
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
