
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

        // Calculate original model bounds
        const box = new THREE.Box3().setFromObject(moon);

        const centre = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        const maxDimension = Math.max(
          size.x,
          size.y,
          size.z
        );

        // Create geographic reference frame
        const moonFrame = new THREE.Group();

        // Centre and normalise Moon
        moon.position.sub(centre);
        moon.scale.setScalar(2 / maxDimension);

        // Attach Moon to geographic frame
        moonFrame.add(moon);

        // Add reference frame to scene
        scene.add(moonFrame);

        console.log('Moon loaded:', MOON_MODEL);
        console.log('Original centre:', centre);
        console.log('Original dimensions:', size);
        console.log('Normalised radius:', 1);

        resolve({
          moon,
          moonFrame,
          radius: 1
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
