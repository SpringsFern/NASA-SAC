
import * as THREE from 'three';

export function createMarkers(moon, sites, radius) {
  const markerGroup = new THREE.Group();
  moon.add(markerGroup);

  const markers = [];

  sites.forEach((site) => {
    const lat = THREE.MathUtils.degToRad(site.latitude);
    const lon = THREE.MathUtils.degToRad(site.longitude);

    // Convert latitude and longitude to 3D coordinates.
    // Longitude orientation will be calibrated against the GLB.
    const position = new THREE.Vector3(
      -Math.cos(lat) * Math.sin(lon),
      Math.sin(lat),
      Math.cos(lat) * Math.cos(lon)
    );

    const geometry = new THREE.SphereGeometry(
      radius * 0.025,
      20,
      20
    );

    const material = new THREE.MeshStandardMaterial({
      color: site.color,
      emissive: site.color,
      emissiveIntensity: 2
    });

    const marker = new THREE.Mesh(geometry, material);

    marker.position.copy(
      position.multiplyScalar(radius * 1.025)
    );

    marker.userData.site = site;

    markerGroup.add(marker);
    markers.push(marker);
  });

  return markers;
}

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
