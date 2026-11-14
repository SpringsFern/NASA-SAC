
import * as THREE from 'three';

// Convert geographical coordinates to 3D position
export function latLonToVector3(
  latitude,
  longitude,
  radius = 1.015
) {
  const lat = THREE.MathUtils.degToRad(latitude);
  const lon = THREE.MathUtils.degToRad(longitude);

  return new THREE.Vector3(
    radius * Math.cos(lat) * Math.cos(lon),
    radius * Math.sin(lat),
    -radius * Math.cos(lat) * Math.sin(lon)
  );
}

// Create markers on the Moon
export function createMarkers(moonFrame, sites, radius = 1) {
  const markerGroup = new THREE.Group();

  // Attach markers to geographic reference frame
  moonFrame.add(markerGroup);

  const markers = [];

  sites.forEach((site) => {
    const geometry = new THREE.SphereGeometry(
      0.025,
      24,
      24
    );

    const material = new THREE.MeshBasicMaterial({
      color: site.color,
      depthTest: true,
      depthWrite: false
    });

    const marker = new THREE.Mesh(geometry, material);

    // Position using correct lunar coordinates
    marker.position.copy(
      latLonToVector3(
        site.latitude,
        site.longitude,
        radius * 1.015
      )
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
