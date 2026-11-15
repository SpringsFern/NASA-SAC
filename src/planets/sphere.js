import * as THREE from 'three';

export function loadPlanetSphere(
  scene,
  {
    name,
    textureUrl,
    onProgress,
    widthSegments = 256,
    heightSegments = 128,
    colorSpace = THREE.SRGBColorSpace
  }
) {
  return new Promise((resolve, reject) => {
    const loader = new THREE.TextureLoader();

    loader.load(
      textureUrl,
      (texture) => {
        texture.colorSpace = colorSpace;
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.generateMipmaps = true;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.anisotropy = 8;

        const geometry = new THREE.SphereGeometry(1, widthSegments, heightSegments);
        const material = new THREE.MeshStandardMaterial({
          map: texture,
          roughness: 1,
          metalness: 0
        });
        const sphere = new THREE.Mesh(geometry, material);
        sphere.name = `${name} georeferenced sphere`;

        const frame = new THREE.Group();
        frame.name = `${name} coordinate frame`;
        frame.add(sphere);
        scene.add(frame);

        onProgress?.(100);

        resolve({
          moon: sphere,
          moonFrame: frame,
          radius: 1,
          dispose() {
            geometry.dispose();
            material.dispose();
            texture.dispose();
            scene.remove(frame);
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
