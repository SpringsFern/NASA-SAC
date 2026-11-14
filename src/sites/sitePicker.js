
import * as THREE from 'three';

const SELECTION_RADIUS_DEG = 1.7;

export function createSitePicker(canvas, camera, moon, moonFrame, siteManager) {
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  function getSurfaceHit(event) {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;

    pointer.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    );

    raycaster.setFromCamera(pointer, camera);

    return raycaster.intersectObject(moon, true)[0] || null;
  }

  function getCoordinates(event) {
    const hit = getSurfaceHit(event);
    if (!hit) return null;

    moonFrame.updateMatrixWorld(true);

    const localPoint = moonFrame.worldToLocal(hit.point.clone()).normalize();

    const latitude = THREE.MathUtils.radToDeg(
      Math.asin(THREE.MathUtils.clamp(localPoint.y, -1, 1))
    );

    const longitude = THREE.MathUtils.radToDeg(
      Math.atan2(-localPoint.z, localPoint.x)
    );

    return {
      latitude,
      longitude
    };
  }

  function pick(event) {
    const hit = getSurfaceHit(event);
    if (!hit) return null;

    const localPoint = moonFrame
      .worldToLocal(hit.point.clone())
      .normalize();

    return siteManager.findNearestSite(
      localPoint,
      SELECTION_RADIUS_DEG
    );
  }

  return {
    pick,
    getCoordinates
  };
}
