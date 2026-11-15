#!/usr/bin/env bash
set -euo pipefail

# Convert the LRO LROC-WAC global grayscale GeoTIFF into equirectangular
# JPEG textures used by the shared Three.js planet sphere renderer.
#
# Source raster (from gdalinfo):
#   Size:       109164 x 54582
#   CRS:        Simple Cylindrical MOON
#   Moon radius: 1,737,400 m
#   Origin:     (-5458203.0763469003, 2729101.5381734502)
#   Pixel size: (100, -100) m
#   Extent:     approximately 180W..180E, 90N..90S
#   Bands:      1 (Byte, grayscale), NoData: 0
#
# The 16K output is 16384 x 8192 (4x the pixels of an 8K texture).
# Devices limited to 8192 texture dimensions use the 8K fallback.

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 /path/to/Lunar_LRO_LROC-WAC_Mosaic_global_100m_June2013.tif" >&2
  exit 1
fi

INPUT="$1"
if [[ ! -f "$INPUT" ]]; then
  echo "Input TIFF not found: $INPUT" >&2
  exit 1
fi

if ! command -v gdal_translate >/dev/null 2>&1; then
  echo "GDAL is required. On Ubuntu, install it with: sudo apt install gdal-bin" >&2
  exit 1
fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUTPUT_DIR="$ROOT_DIR/public/textures"
mkdir -p "$OUTPUT_DIR"

INFO="$(gdalinfo "$INPUT")"
if ! grep -q 'Size is 109164, 54582' <<< "$INFO"; then
  echo "Warning: source dimensions differ from the expected LRO WAC global mosaic." >&2
fi
if ! grep -q 'SimpleCylindrical MOON' <<< "$INFO"; then
  echo "Warning: source CRS does not appear to be Simple Cylindrical MOON." >&2
fi

echo "Creating 8192 x 4096 Moon grayscale texture..."
gdal_translate \
  -of JPEG \
  -outsize 8192 4096 \
  -co QUALITY=94 \
  "$INPUT" \
  "$OUTPUT_DIR/moon_gray_8k.jpg"

echo "Creating 16384 x 8192 Moon grayscale texture..."
gdal_translate \
  -of JPEG \
  -outsize 16384 8192 \
  -co QUALITY=94 \
  "$INPUT" \
  "$OUTPUT_DIR/moon_gray_16k.jpg"

echo
echo "Created Moon textures:"
ls -lh "$OUTPUT_DIR/moon_gray_8k.jpg" "$OUTPUT_DIR/moon_gray_16k.jpg"
