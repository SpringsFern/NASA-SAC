import * as THREE from 'three';
import { createSiteTexture } from './siteTexture.js';

const SPATIAL_CELL_SIZE = 0.15;

function directionFromCoordinates(latitude, longitude) {
  const lat = THREE.MathUtils.degToRad(latitude);
  const lon = THREE.MathUtils.degToRad(longitude);

  // This orientation was verified against the project's NASA Moon model.
  return new THREE.Vector3(
    Math.cos(lat) * Math.cos(lon),
    Math.sin(lat),
    -Math.cos(lat) * Math.sin(lon)
  ).normalize();
}

function cellCoordinate(value) {
  return Math.floor((value + 1) / SPATIAL_CELL_SIZE);
}

function cellKey(direction) {
  return `${cellCoordinate(direction.x)}:${cellCoordinate(direction.y)}:${cellCoordinate(direction.z)}`;
}

export function createSiteManager(moon, moonFrame, initialSites = []) {
  const sites = new Map();
  const uvPositions = new Map();
  const directions = new Map();
  const spatialCells = new Map();
  const raycaster = new THREE.Raycaster();
  const painting = createSiteTexture();

  let selectedSiteId = null;

  function findSiteUV(site) {
    const direction = directionFromCoordinates(site.latitude, site.longitude);

    moonFrame.updateMatrixWorld(true);
    moon.updateMatrixWorld(true);

    const center = moonFrame.localToWorld(new THREE.Vector3(0, 0, 0));
    const worldDirection = direction.clone().transformDirection(moonFrame.matrixWorld);
    const origin = center.clone().addScaledVector(worldDirection, 3);

    raycaster.set(origin, worldDirection.clone().negate());

    const hit = raycaster.intersectObject(moon, true)[0];
    if (!hit?.uv) {
      console.warn(`Could not map site to Moon UV coordinates: ${site.id}`);
      return null;
    }

    return hit.uv.clone();
  }

  function addToSpatialIndex(site, direction) {
    const key = cellKey(direction);
    if (!spatialCells.has(key)) spatialCells.set(key, new Set());
    spatialCells.get(key).add(site.id);
    directions.set(site.id, direction);
  }

  function removeFromSpatialIndex(siteId) {
    const direction = directions.get(siteId);
    if (!direction) return;

    const key = cellKey(direction);
    const cell = spatialCells.get(key);
    if (cell) {
      cell.delete(siteId);
      if (cell.size === 0) spatialCells.delete(key);
    }
    directions.delete(siteId);
  }

  function validateSite(site) {
    if (!site?.id || typeof site.id !== 'string') {
      throw new Error('Every lunar site must have a string ID.');
    }

    if (
      !Number.isFinite(site.latitude) ||
      !Number.isFinite(site.longitude) ||
      !Number.isFinite(site.color) ||
      site.latitude < -90 ||
      site.latitude > 90 ||
      site.longitude < -180 ||
      site.longitude > 180
    ) {
      throw new Error(`Invalid coordinates or color for site: ${site.id}`);
    }
  }

  function addSite(site, { deferTextureUpdate = false } = {}) {
    validateSite(site);
    if (sites.has(site.id)) return false;

    const uv = findSiteUV(site);
    if (!uv) return false;

    const storedSite = { ...site };
    const direction = directionFromCoordinates(site.latitude, site.longitude);

    sites.set(storedSite.id, storedSite);
    uvPositions.set(storedSite.id, uv);
    addToSpatialIndex(storedSite, direction);

    if (!deferTextureUpdate) painting.addBaseSite(storedSite, uv);
    return true;
  }

  function addSites(newSites) {
    let added = 0;

    for (const site of newSites) {
      if (addSite(site, { deferTextureUpdate: true })) added++;
    }

    if (added) painting.rebuildBase(sites.values(), uvPositions);
    return added;
  }

  function removeSite(siteId) {
    if (!sites.has(siteId)) return false;

    sites.delete(siteId);
    uvPositions.delete(siteId);
    removeFromSpatialIndex(siteId);

    if (selectedSiteId === siteId) {
      selectedSiteId = null;
      painting.setSelectedSite(null, null);
    }

    painting.rebuildBase(sites.values(), uvPositions);
    return true;
  }

  function updateSite(siteId, changes) {
    const existing = sites.get(siteId);
    if (!existing) return false;

    const updated = { ...existing, ...changes, id: siteId };
    validateSite(updated);

    const coordinatesChanged =
      updated.latitude !== existing.latitude ||
      updated.longitude !== existing.longitude;

    let uv = uvPositions.get(siteId);

    if (coordinatesChanged) {
      uv = findSiteUV(updated);
      if (!uv) return false;

      removeFromSpatialIndex(siteId);
      addToSpatialIndex(
        updated,
        directionFromCoordinates(updated.latitude, updated.longitude)
      );
      uvPositions.set(siteId, uv);
    }

    sites.set(siteId, updated);
    painting.rebuildBase(sites.values(), uvPositions);

    if (selectedSiteId === siteId) painting.setSelectedSite(updated, uv);
    return true;
  }

  function setSelected(siteId) {
    if (siteId !== null && !sites.has(siteId)) return false;

    selectedSiteId = siteId;
    const site = siteId ? sites.get(siteId) : null;
    const uv = siteId ? uvPositions.get(siteId) : null;
    painting.setSelectedSite(site, uv);
    return true;
  }

  // Search only nearby spatial cells rather than comparing every stored site.
  function findNearestSite(direction, maxAngleDegrees = 1.7) {
    const maxAngle = THREE.MathUtils.degToRad(maxAngleDegrees);
    const maxChord = 2 * Math.sin(maxAngle / 2);
    const range = Math.ceil(maxChord / SPATIAL_CELL_SIZE);
    const cx = cellCoordinate(direction.x);
    const cy = cellCoordinate(direction.y);
    const cz = cellCoordinate(direction.z);

    let closest = null;
    let closestDot = Math.cos(maxAngle);

    for (let x = -range; x <= range; x++) {
      for (let y = -range; y <= range; y++) {
        for (let z = -range; z <= range; z++) {
          const cell = spatialCells.get(`${cx + x}:${cy + y}:${cz + z}`);
          if (!cell) continue;

          for (const siteId of cell) {
            const dot = direction.dot(directions.get(siteId));
            if (dot >= closestDot) {
              closestDot = dot;
              closest = sites.get(siteId);
            }
          }
        }
      }
    }

    return closest;
  }

  function getSite(siteId) {
    return sites.get(siteId) ?? null;
  }

  function getSites() {
    return Array.from(sites.values());
  }

  function getSelectedSite() {
    return selectedSiteId ? getSite(selectedSiteId) : null;
  }

  function dispose() {
    painting.dispose();
    sites.clear();
    uvPositions.clear();
    directions.clear();
    spatialCells.clear();
    selectedSiteId = null;
  }

  addSites(initialSites);

  return {
    baseTexture: painting.baseTexture,
    selectedTexture: painting.selectedTexture,
    addSite,
    addSites,
    removeSite,
    updateSite,
    setSelected,
    findNearestSite,
    getSite,
    getSites,
    getSelectedSite,
    dispose
  };
}
