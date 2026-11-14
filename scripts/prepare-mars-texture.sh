#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 /path/to/Mars_Viking_ClrMosaic_global_925m.tif" >&2
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
OUTPUT="$OUTPUT_DIR/mars_color.jpg"
mkdir -p "$OUTPUT_DIR"

echo "Reading source metadata..."
gdalinfo "$INPUT" | grep -E 'Size is|Origin =|Pixel Size =|Mars|AREA_OR_POINT' || true

echo "Creating 8192 x 4096 Mars colour texture..."
gdal_translate \
  -of JPEG \
  -outsize 8192 4096 \
  -co QUALITY=92 \
  "$INPUT" \
  "$OUTPUT"

echo "Created: $OUTPUT"
ls -lh "$OUTPUT"
echo "The app uses the GeoTIFF transform recorded in src/mars/marsCoordinates.js."
