
import * as THREE from 'three';

// Match the normal painted-region radius in siteTexture.js.
const SELECTION_RADIUS_DEG = 1.7;

export function createSitePicker(
    canvas,
    camera,
    moon,
    moonFrame,
    siteManager
) {
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    function pick(event) {
        const rect = canvas.getBoundingClientRect();

        if (!rect.width || !rect.height) {
            return null;
        }

        pointer.set(
            ((event.clientX - rect.left) / rect.width) * 2 - 1,
            -((event.clientY - rect.top) / rect.height) * 2 + 1
        );

        raycaster.setFromCamera(pointer, camera);

        const hit = raycaster.intersectObject(moon, true)[0];

        if (!hit) return null;

        const localPoint = moonFrame.worldToLocal(
            hit.point.clone()
        );

        const clickedDirection = localPoint.normalize();

        return siteManager.findNearestSite(
            clickedDirection,
            SELECTION_RADIUS_DEG
        );
    }

    return { pick };
}
