import * as THREE from 'three';

const MARS_TEXTURE = `${import.meta.env.BASE_URL}textures/mars_color.jpg`;

export function loadMars(scene, onProgress) {
  return new Promise((resolve, reject) => {
    const loader = new THREE.TextureLoader();

    loader.load(
      MARS_TEXTURE,
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.generateMipmaps = true;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.magFilter = THREE.LinearFilter;

        // SphereGeometry has a predictable equirectangular UV layout:
        // u=0 is -180°, u=0.5 is 0°, and u=1 is +180°.
        // The default SphereGeometry orientation puts longitude 0° on +X,
        // matching the project's initial camera direction.
        const geometry = new THREE.SphereGeometry(1, 192, 96);
        const material = new THREE.MeshStandardMaterial({
          map: texture,
          roughness: 1,
          metalness: 0
        });
        const mars = new THREE.Mesh(geometry, material);
        mars.name = 'Mars georeferenced sphere';

        const marsFrame = new THREE.Group();
        marsFrame.name = 'Mars coordinate frame';
        marsFrame.add(mars);
        scene.add(marsFrame);

        onProgress?.(100);

        resolve({
          moon: mars,
          moonFrame: marsFrame,
          radius: 1,
          dispose() {
            geometry.dispose();
            material.dispose();
            texture.dispose();
          }
        });
      },
      (event) => {
        if (event.total > 0 && onProgress) {
          onProgress(Math.round((event.loaded / event.total) * 100));
        }
      },
      reject
    );
  });
}
