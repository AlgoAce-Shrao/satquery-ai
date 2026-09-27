/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Builds a console-styled equirectangular Earth texture at runtime from a
 * land/water mask (NASA-derived, from the three-globe examples): warm graphite
 * ocean, dark olive-gray land, warm-gray coastlines, faint rivers and a
 * warm-gray 15° graticule. Generating it locally keeps the globe on-palette without
 * shipping a large bespoke image or depending on a CDN.
 */

import { useEffect, useState } from 'react';
import waterMaskUrl from '../../../assets/console-landing/earth-water.png';

const WIDTH = 2048;
const HEIGHT = 1024;

const OCEAN = [14, 15, 12];
const LAND = [31, 32, 26];
const COAST = [157, 155, 143];

async function buildTexture(): Promise<string> {
  const img = new Image();
  img.src = waterMaskUrl;
  await img.decode();

  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('2D canvas unavailable');

  // A slight blur turns the binary mask into a soft edge, so coastlines are
  // anti-aliased and thin rivers survive as faint traces on land.
  ctx.filter = 'blur(1.2px)';
  ctx.drawImage(img, 0, 0, WIDTH, HEIGHT);
  ctx.filter = 'none';
  const src = ctx.getImageData(0, 0, WIDTH, HEIGHT).data;
  const out = ctx.createImageData(WIDTH, HEIGHT);
  const px = out.data;

  for (let i = 0; i < src.length; i += 4) {
    const water = src[i] / 255; // 0 = land, 1 = water
    const edge = Math.max(0, 1 - Math.abs(water * 2 - 1) * 1.6); // peaks on the shoreline
    for (let c = 0; c < 3; c++) {
      const base = LAND[c] + (OCEAN[c] - LAND[c]) * water;
      px[i + c] = base + (COAST[c] - base) * edge;
    }
    px[i + 3] = 255;
  }
  ctx.putImageData(out, 0, 0);

  // Graticule every 15°, equator and prime meridian slightly stronger.
  ctx.lineWidth = 1;
  for (let lon = -180; lon <= 180; lon += 15) {
    const x = ((lon + 180) / 360) * WIDTH;
    ctx.strokeStyle = lon === 0 ? 'rgba(157,155,143,0.16)' : 'rgba(157,155,143,0.06)';
    ctx.beginPath();
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, HEIGHT);
    ctx.stroke();
  }
  for (let lat = -75; lat <= 75; lat += 15) {
    const y = ((90 - lat) / 180) * HEIGHT;
    ctx.strokeStyle = lat === 0 ? 'rgba(157,155,143,0.16)' : 'rgba(157,155,143,0.06)';
    ctx.beginPath();
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(WIDTH, y + 0.5);
    ctx.stroke();
  }

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('Texture encoding failed');
  return URL.createObjectURL(blob);
}

/** Returns an object URL for the generated texture once ready, or null while building. */
export function useConsoleEarthTexture(): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let created: string | null = null;
    buildTexture()
      .then((u) => {
        created = u;
        if (cancelled) URL.revokeObjectURL(u);
        else setUrl(u);
      })
      .catch((err) => console.warn('Console Earth texture generation failed:', err));
    return () => {
      cancelled = true;
      if (created) URL.revokeObjectURL(created);
    };
  }, []);

  return url;
}
