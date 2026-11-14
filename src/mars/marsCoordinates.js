import * as THREE from 'three';

/**
 * Georeferencing extracted from Mars_Viking_ClrMosaic_global_925m.tif
 * using the user's gdalinfo output.
 *
 * CRS: Simple Cylindrical Mars
 * Mars equatorial radius: 3,396,190 metres
 * Raster size: 23,059 x 11,530 pixels
 * Upper-left origin: (-10,669,931.18, 5,334,965.59)
 * Pixel size: (925.406, -925.406) metres
 * Latitude: planetocentric; longitude: positive east.
 * AREA_OR_POINT: Area
 */
export const MARS_RASTER = Object.freeze({
  width: 23059,
  height: 11530,
  originX: -10669931.18,
  originY: 5334965.59,
  pixelWidth: 925.406,
  pixelHeight: 925.406,
  radius: 3396190
});

/**
 * Converts planetocentric latitude and positive-east longitude into the
 * local direction used by the Mars SphereGeometry UV layout.
 * This matches Three.js SphereGeometry: longitude 0° is at local +X,
 * and positive-east longitude proceeds toward local -Z.
 */
export function marsDirectionFromCoordinates(latitude, longitude) {
  const lat = THREE.MathUtils.degToRad(latitude);
  const lon = THREE.MathUtils.degToRad(longitude);

  return new THREE.Vector3(
    Math.cos(lat) * Math.cos(lon),
    Math.sin(lat),
    -Math.cos(lat) * Math.sin(lon)
  ).normalize();
}

/**
 * Converts geographic coordinates directly to UV coordinates using the
 * GeoTIFF affine transform. The returned UV is normalized to the resized
 * texture too, because the local conversion preserves the full raster extent.
 */
export function marsCoordinatesToUV(latitude, longitude) {
  const { width, height, originX, originY, pixelWidth, pixelHeight, radius } = MARS_RASTER;
  const x = radius * THREE.MathUtils.degToRad(longitude);
  const y = radius * THREE.MathUtils.degToRad(latitude);

  const rawU = (x - originX) / (pixelWidth * width);
  const u = ((rawU % 1) + 1) % 1;
  const row = (originY - y) / (pixelHeight * height);
  const v = THREE.MathUtils.clamp(1 - row, 0, 1);

  return { x: u, y: v };
}
