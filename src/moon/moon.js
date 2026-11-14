
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

        // Calculate bounding box
        const box = new THREE.Box3().setFromObject(moon);

        const centre = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        const maxDimension = Math.max(
          size.x,
          size.y,
          size.z
        );

        // Centre and scale model
        moon.position.sub(centre);
        moon.scale.setScalar(2 / maxDimension);

        scene.add(moon);

        resolve({
          moon,
          radius: maxDimension / 2
        });
      },

      (progress) => {
        if (progress.total > 0 && onProgress) {
          const percent = Math.round(
            (progress.loaded / progress.total) * 100
          );

          onProgress(percent);
        }
      },

      (error) => {
        console.error('Moon loading error:', error);
        reject(error);
      }
    );
  });
}
