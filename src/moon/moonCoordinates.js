import * as THREE from 'three';

/**
 * Georeferencing from the supplied gdalinfo output for
 * Lunar_LRO_LROC-WAC_Mosaic_global_100m_June2013.tif.
 *
 * CRS: Simple Cylindrical MOON; lunar radius: 1,737,400 m
 * Raster: 109,164 x 54,582 pixels; 100 m x 100 m source pixels
 * Origin: (-5458203.0763469003, 2729101.5381734502)
 * Pixel size: (100, -100) m; one grayscale Byte band; NoData: 0
 * The raster corners cover approximately 180W..180E and 90N..90S.
 *
 * For the global sphere UVs, the corner coordinates provide a direct
 * equirectangular longitude/latitude mapping.
 */
export const MOON_RASTER = Object.freeze({
  width: 109164,
  height: 54582,
  west: -180,
  east: 180,
  south: -90,
  north: 90,
  pixelWidth: 360 / 109164,
  pixelHeight: 180 / 54582,
  sourcePixelSizeMetres: 100,
  lunarRadiusMetres: 1737400,
  originX: -5458203.0763469003,
  originY: 2729101.5381734502
});

/**
 * Moon's local sphere orientation matches Three.js SphereGeometry:
 * 0° longitude is +X and positive-east longitude points toward -Z.
 */
export function moonDirectionFromCoordinates(latitude, longitude) {
  const lat = THREE.MathUtils.degToRad(latitude);
  const lon = THREE.MathUtils.degToRad(longitude);

  return new THREE.Vector3(
    Math.cos(lat) * Math.cos(lon),
    Math.sin(lat),
    -Math.cos(lat) * Math.sin(lon)
  ).normalize();
}

/**
 * Convert lunar latitude/longitude to the equirectangular sphere UV layout.
 * U wraps at the antimeridian; V increases from south to north.
 */
export function moonCoordinatesToUV(latitude, longitude) {
  const { west, east, south, north } = MOON_RASTER;
  const u = ((((longitude - west) / (east - west)) % 1) + 1) % 1;
  const v = THREE.MathUtils.clamp((latitude - south) / (north - south), 0, 1);
  return { x: u, y: v };
}
