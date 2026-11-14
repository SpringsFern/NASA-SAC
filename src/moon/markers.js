
import * as THREE from 'three';
import { DecalGeometry } from 'three/addons/geometries/DecalGeometry.js';

// Convert latitude/longitude into a 3D direction
export function latLonToVector3(
  latitude,
  longitude,
  radius = 1
) {
  const lat = THREE.MathUtils.degToRad(latitude);
  const lon = THREE.MathUtils.degToRad(longitude);

  return new THREE.Vector3(
    radius * Math.cos(lat) * Math.cos(lon),
    radius * Math.sin(lat),
    -radius * Math.cos(lat) * Math.sin(lon)
  );
}

// Create a soft circular highlight texture
function createHighlightTexture() {
  const canvas = document.createElement('canvas');

  canvas.width = 128;
  canvas.height = 128;

  const ctx = canvas.getContext('2d');

  const gradient = ctx.createRadialGradient(
    64, 64, 0,
    64, 64, 64
  );

  gradient.addColorStop(0, 'rgba(255,255,255,0.75)');
  gradient.addColorStop(0.45, 'rgba(255,255,255,0.45)');
  gradient.addColorStop(0.75, 'rgba(255,255,255,0.15)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;

  return texture;
}

// Create surface highlights
export function createMarkers(
  moonFrame,
  moon,
  sites,
  radius = 1
) {
  const markers = [];

  const raycaster = new THREE.Raycaster();

  const highlightTexture = createHighlightTexture();

  moonFrame.updateMatrixWorld(true);
  moon.updateMatrixWorld(true);

  sites.forEach((site) => {

    // Calculate geographical direction
    const direction = latLonToVector3(
      site.latitude,
      site.longitude
    ).normalize();

    // Find the actual lunar surface position
    raycaster.set(
      new THREE.Vector3(0, 0, 0),
      direction
    );

    const hits = raycaster.intersectObject(moon, true);

    if (hits.length === 0) {
      console.warn('Could not locate lunar site:', site.name);
      return;
    }

    const hit = hits[0];

    // Calculate the surface normal
    const normalMatrix = new THREE.Matrix3()
      .getNormalMatrix(hit.object.matrixWorld);

    const normal = hit.face.normal
      .clone()
      .applyMatrix3(normalMatrix)
      .normalize();

    // Orient the decal to the surface
    const quaternion = new THREE.Quaternion()
      .setFromUnitVectors(
        new THREE.Vector3(0, 0, 1),
        normal
      );

    const orientation = new THREE.Euler()
      .setFromQuaternion(quaternion);

    // Project the coloured highlight onto the surface
    const decalGeometry = new DecalGeometry(
      hit.object,
      hit.point,
      orientation,
      new THREE.Vector3(0.12, 0.12, 0.04)
    );

    const decalMaterial = new THREE.MeshBasicMaterial({
      map: highlightTexture,
      color: site.color,
      transparent: true,
      depthTest: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -4,
      side: THREE.DoubleSide
    });

    const decal = new THREE.Mesh(
      decalGeometry,
      decalMaterial
    );

    decal.userData.site = site;

    // Decal geometry is generated in world coordinates.
    // Our geographic frame currently has an identity transform.
    moonFrame.add(decal);

    markers.push(decal);

    console.log('Surface highlight created:', site.name);
  });

  return markers;
}

// Detect clicked highlight
export function getClickedMarker(
  event,
  canvas,
  camera,
  markers
) {
  const rect = canvas.getBoundingClientRect();

  const pointer = new THREE.Vector2(
    ((event.clientX - rect.left) / rect.width) * 2 - 1,
    -((event.clientY - rect.top) / rect.height) * 2 + 1
  );

  const raycaster = new THREE.Raycaster();

  raycaster.setFromCamera(pointer, camera);

  const intersections = raycaster.intersectObjects(
    markers,
    false
  );

  if (intersections.length > 0) {
    return intersections[0].object.userData.site;
  }

  return null;
}
