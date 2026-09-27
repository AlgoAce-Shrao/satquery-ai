/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Basic image interpreter — runs entirely in the browser on the uploaded
 * pixels, so an upload always gets a result even when the detailed vision
 * analysis is unavailable. It classifies pixels by colour (vegetation, water,
 * bare soil, grey built-up surfaces, bright cloud/snow), measures class shares
 * and where each class sits on a coarse grid, and for image pairs measures how
 * much of the scene changed. Output uses the same VisionAnalysis shape as the
 * detailed analysis so the report renders either one.
 */

import { AnalysisInput, UploadedImage } from '../types/upload';
import { VisionAnalysis, VisionRegion } from '../types/geospatial';
import { LAND_COVER_LABEL, LandCoverClass } from '../lib/geo/landCover';

const SIZE = 256; // analysis resolution (square)
const GRID = 8; // coarse grid for locating classes

type PixelClass = Extract<LandCoverClass, 'VEGETATION' | 'FOREST' | 'WATER' | 'BARE_SOIL' | 'BUILT_UP' | 'CLOUD' | 'OTHER'>;
const CLASSES: PixelClass[] = ['VEGETATION', 'FOREST', 'WATER', 'BARE_SOIL', 'BUILT_UP', 'CLOUD', 'OTHER'];

interface Raster {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

async function rasterize(image: UploadedImage): Promise<Raster> {
  const img = new Image();
  img.src = image.previewUrl;
  await img.decode();
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Canvas unavailable');
  ctx.drawImage(img, 0, 0, SIZE, SIZE);
  return { data: ctx.getImageData(0, 0, SIZE, SIZE).data, width: SIZE, height: SIZE };
}

function classify(r: number, g: number, b: number): PixelClass {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const brightness = (r + g + b) / (3 * 255);
  const saturation = max === 0 ? 0 : (max - min) / max;
  const exg = (2 * g - r - b) / 255; // excess-green vegetation index

  if (brightness > 0.82 && saturation < 0.18) return 'CLOUD';
  if (b > r * 1.05 && b >= g * 0.92 && brightness < 0.55) return 'WATER';
  if (brightness < 0.12 && b >= r) return 'WATER';
  if (exg > 0.06 && g >= r) return brightness < 0.22 ? 'FOREST' : 'VEGETATION';
  if (saturation < 0.16 && brightness >= 0.25) return 'BUILT_UP';
  if (r >= g && g >= b && saturation >= 0.16) return 'BARE_SOIL';
  return 'OTHER';
}

interface ClassStats {
  share: Record<PixelClass, number>; // 0–100
  cellClass: PixelClass[]; // GRID*GRID dominant class per cell
  labels: PixelClass[]; // per pixel
  meanBrightness: number;
}

function analyzeRaster(r: Raster): ClassStats {
  const counts = Object.fromEntries(CLASSES.map((c) => [c, 0])) as Record<PixelClass, number>;
  const cellCounts: Record<PixelClass, number>[] = Array.from({ length: GRID * GRID }, () =>
    Object.fromEntries(CLASSES.map((c) => [c, 0])) as Record<PixelClass, number>
  );
  const labels: PixelClass[] = new Array(r.width * r.height);
  let brightnessSum = 0;
  const cell = r.width / GRID;

  for (let y = 0; y < r.height; y++) {
    for (let x = 0; x < r.width; x++) {
      const i = (y * r.width + x) * 4;
      const cls = classify(r.data[i], r.data[i + 1], r.data[i + 2]);
      labels[y * r.width + x] = cls;
      counts[cls]++;
      cellCounts[Math.floor(y / cell) * GRID + Math.floor(x / cell)][cls]++;
      brightnessSum += (r.data[i] + r.data[i + 1] + r.data[i + 2]) / 765;
    }
  }
  const total = r.width * r.height;
  const share = Object.fromEntries(CLASSES.map((c) => [c, (counts[c] / total) * 100])) as Record<PixelClass, number>;
  const cellClass = cellCounts.map(
    (cc) => CLASSES.reduce((best, c) => (cc[c] > cc[best] ? c : best), CLASSES[0])
  );
  return { share, cellClass, labels, meanBrightness: brightnessSum / total };
}

/** Bounding box (normalised [ymin, xmin, ymax, xmax]) of grid cells matching a predicate. */
function cellsBox(match: (index: number) => boolean): [number, number, number, number] | null {
  let y0 = GRID, x0 = GRID, y1 = -1, x1 = -1;
  for (let i = 0; i < GRID * GRID; i++) {
    if (!match(i)) continue;
    const y = Math.floor(i / GRID), x = i % GRID;
    y0 = Math.min(y0, y); x0 = Math.min(x0, x); y1 = Math.max(y1, y); x1 = Math.max(x1, x);
  }
  if (y1 < 0) return null;
  return [y0 / GRID, x0 / GRID, (y1 + 1) / GRID, (x1 + 1) / GRID];
}

const DESCRIBE: Record<PixelClass, string> = {
  VEGETATION: 'Green, vegetated surfaces',
  FOREST: 'Dense, dark-green vegetation',
  WATER: 'Dark or blue tones consistent with water',
  BARE_SOIL: 'Brown and tan tones typical of bare soil or dry land',
  BUILT_UP: 'Grey, low-colour surfaces typical of buildings or paving',
  CLOUD: 'Very bright surfaces such as cloud, snow or haze',
  OTHER: 'Mixed surfaces that do not match a clear class',
};

const pct = (n: number) => `${Math.round(n)}%`;

/** Topics a question can ask about, mapped to the colour classes that answer it. */
const TOPICS: { pattern: RegExp; classes: PixelClass[]; name: string }[] = [
  { pattern: /water|river|lake|flood|sea|reservoir|wetland/i, classes: ['WATER'], name: 'water' },
  { pattern: /vegetation|green|forest|tree|crop|farm|agri|canopy/i, classes: ['VEGETATION', 'FOREST'], name: 'vegetation' },
  { pattern: /built|urban|city|town|building|settlement|road|infrastructure/i, classes: ['BUILT_UP'], name: 'built-up surfaces' },
  { pattern: /cloud|haze|snow|ice/i, classes: ['CLOUD'], name: 'cloud, snow or haze' },
  { pattern: /soil|bare|desert|dry|sand/i, classes: ['BARE_SOIL'], name: 'bare soil' },
];

const shareOf = (stats: ClassStats, classes: PixelClass[]) => classes.reduce((sum, c) => sum + stats.share[c], 0);

/** A first sentence that responds to what the question asked about, when it names a topic. */
function topicSentence(question: string, stats: ClassStats, before?: ClassStats): string | null {
  const topic = TOPICS.find((t) => t.pattern.test(question));
  if (!topic) return null;
  const now = shareOf(stats, topic.classes);
  if (before) {
    const delta = now - shareOf(before, topic.classes);
    if (Math.abs(delta) < 2) return `${topic.name[0].toUpperCase()}${topic.name.slice(1)} stayed roughly the same (about ${pct(now)} of the scene).`;
    return `${topic.name[0].toUpperCase()}${topic.name.slice(1)} ${delta > 0 ? 'increased' : 'decreased'} from about ${pct(now - delta)} to ${pct(now)} of the scene.`;
  }
  if (now < 2) return `No significant ${topic.name} was detected in this image.`;
  return `${topic.name[0].toUpperCase()}${topic.name.slice(1)} covers about ${pct(now)} of the image.`;
}

function landCoverList(stats: ClassStats) {
  return CLASSES.filter((c) => c !== 'OTHER' || stats.share.OTHER > 5)
    .map((c) => ({ category: c as LandCoverClass, percent: Math.round(stats.share[c] * 10) / 10 }))
    .filter((l) => l.percent >= 1)
    .sort((a, b) => b.percent - a.percent);
}

function classRegions(stats: ClassStats, limit = 4): VisionRegion[] {
  return landCoverList(stats)
    .filter((l) => l.percent >= 5 && l.category !== 'OTHER')
    .slice(0, limit)
    .map((l): VisionRegion | null => {
      const box = cellsBox((i) => stats.cellClass[i] === l.category);
      if (!box) return null;
      return {
        label: LAND_COVER_LABEL[l.category],
        category: l.category,
        box,
        observation: `${DESCRIBE[l.category as PixelClass]} cover about ${pct(l.percent)} of the image.`,
        changeStatus: 'NOT_APPLICABLE',
        confidence: 0.4,
      };
    })
    .filter(Boolean) as VisionRegion[];
}

function singleImageAnalysis(stats: ClassStats, question: string): VisionAnalysis {
  const cover = landCoverList(stats).filter((l) => l.category !== 'OTHER');
  const [first, second, third] = cover;
  const mix = [first, second, third]
    .filter(Boolean)
    .map((l) => `${LAND_COVER_LABEL[l!.category].toLowerCase()} (about ${pct(l!.percent)})`);
  const answer = first
    ? `This image is mostly ${mix[0]}${mix.length > 1 ? `, with ${mix.slice(1).join(' and ')}` : ''}.`
    : 'The image does not show a clear dominant surface type.';

  const distinctCells = new Set(stats.cellClass).size;
  const insights = [
    distinctCells >= 5
      ? 'The landscape is fragmented — several surface types alternate across the scene.'
      : 'The landscape is fairly uniform, with one or two surface types dominating.',
    stats.share.WATER >= 3
      ? `Water-like surfaces cover roughly ${pct(stats.share.WATER)} of the image.`
      : 'No significant water surfaces are visible.',
    stats.share.CLOUD >= 10
      ? `About ${pct(stats.share.CLOUD)} of the image is very bright (cloud, snow or haze), which may hide the ground.`
      : 'The view is largely clear of cloud or haze.',
  ];

  const topic = topicSentence(question, stats);
  return {
    answer: topic ? `${topic} ${answer}` : answer,
    sceneSummary: `Colour-based reading of the scene in response to “${question}”.`,
    sceneType: first ? `${LAND_COVER_LABEL[first.category]}-dominated scene` : 'Mixed scene',
    landCover: cover,
    regions: classRegions(stats),
    changes: [],
    coverageComparison: null,
    insights,
    estimatedLocation: null,
    imageQuality: {
      cloudCoverPercent: Math.round(stats.share.CLOUD),
      notes: stats.meanBrightness < 0.15 ? 'The image is very dark.' : stats.meanBrightness > 0.8 ? 'The image is very bright.' : 'Normal exposure.',
    },
    caveats: ['Based on colour only; classes such as cropland and forest, or water and shadow, can look alike.'],
    overallConfidence: 0.4,
    model: 'basic',
    level: 'BASIC',
  };
}

function pairAnalysis(before: ClassStats, after: ClassStats, question: string): VisionAnalysis {
  // Pixel-level change: class label differs between the two images.
  let changed = 0;
  const cellChanged = new Array(GRID * GRID).fill(0);
  const cell = SIZE / GRID;
  for (let i = 0; i < before.labels.length; i++) {
    if (before.labels[i] !== after.labels[i]) {
      changed++;
      const y = Math.floor(i / SIZE), x = i % SIZE;
      cellChanged[Math.floor(y / cell) * GRID + Math.floor(x / cell)]++;
    }
  }
  const changedPct = (changed / before.labels.length) * 100;
  const cellArea = cell * cell;

  const deltas = CLASSES.filter((c) => c !== 'OTHER')
    .map((c) => ({ c, delta: after.share[c] - before.share[c] }))
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  const main = deltas[0];
  const magnitude = (d: number) => (Math.abs(d) >= 15 ? 'HIGH' : Math.abs(d) >= 5 ? 'MODERATE' : 'LOW') as 'HIGH' | 'MODERATE' | 'LOW';

  const changes = deltas
    .filter((d) => Math.abs(d.delta) >= 2)
    .slice(0, 4)
    .map((d) => ({
      description: `${LAND_COVER_LABEL[d.c]} ${d.delta > 0 ? 'increased' : 'decreased'} by about ${Math.abs(Math.round(d.delta))} points (${pct(before.share[d.c])} → ${pct(after.share[d.c])}).`,
      direction: (d.delta > 0 ? 'INCREASE' : 'DECREASE') as 'INCREASE' | 'DECREASE',
      magnitude: magnitude(d.delta),
    }));

  const changedBox = cellsBox((i) => cellChanged[i] / cellArea > 0.35);
  const regions: VisionRegion[] = [];
  if (changedBox && main) {
    regions.push({
      label: 'Main area of change',
      category: main.c,
      box: changedBox,
      observation: `Most visible differences between the two images are concentrated here; ${LAND_COVER_LABEL[main.c].toLowerCase()} ${main.delta > 0 ? 'increased' : 'decreased'} overall.`,
      changeStatus: main.delta > 0 ? 'INCREASED' : 'DECREASED',
      confidence: 0.4,
    });
  }
  regions.push(...classRegions(after, 3));

  const answer =
    changedPct < 5
      ? 'The two images look largely the same — very little of the scene changed.'
      : `About ${pct(changedPct)} of the scene changed between the two images${
          main && Math.abs(main.delta) >= 2
            ? `, mainly ${main.delta > 0 ? 'an increase' : 'a decrease'} in ${LAND_COVER_LABEL[main.c].toLowerCase()} (${pct(before.share[main.c])} → ${pct(after.share[main.c])})`
            : ''
        }.`;

  const topic = topicSentence(question, after, before);
  return {
    answer: topic ? `${topic} ${answer}` : answer,
    sceneSummary: `Colour-based comparison of the two images in response to “${question}”.`,
    sceneType: `Change comparison`,
    landCover: landCoverList(after).filter((l) => l.category !== 'OTHER'),
    regions,
    changes,
    coverageComparison: main
      ? { category: main.c, beforePercent: Math.round(before.share[main.c]), afterPercent: Math.round(after.share[main.c]) }
      : null,
    insights: [
      `${pct(changedPct)} of pixels changed surface type between the two images.`,
      changes[1] ? changes[1].description : 'Other surface types stayed broadly stable.',
      Math.abs(before.meanBrightness - after.meanBrightness) > 0.15
        ? 'The images differ noticeably in brightness, so some change may reflect lighting or season rather than the ground.'
        : 'Both images have similar lighting, which makes the comparison more reliable.',
    ],
    estimatedLocation: null,
    imageQuality: { cloudCoverPercent: Math.round(after.share.CLOUD), notes: 'Compared after resizing both images to the same grid.' },
    caveats: ['Based on colour only and assumes both images show the same area at the same scale.'],
    overallConfidence: 0.35,
    model: 'basic',
    level: 'BASIC',
  };
}

/** Last resort when the browser cannot decode the file (e.g. GeoTIFF). */
function minimalAnalysis(input: AnalysisInput): VisionAnalysis {
  const img = input.images.primary;
  const sizeMb = (img.fileSizeBytes / (1024 * 1024)).toFixed(1);
  return {
    answer: `${img.fileName} was received, but its format can't be displayed in the browser, so only its details can be summarised. Export it as PNG or JPEG for a full reading of the scene.`,
    sceneSummary: `${img.format} file, ${sizeMb} MB${img.geospatialInfo.sensorType ? `, ${img.geospatialInfo.sensorType} sensor (from the file name)` : ''}.`,
    sceneType: `${img.format} file`,
    landCover: [],
    regions: [],
    changes: [],
    coverageComparison: null,
    insights: [
      img.acquisitionDate ? `Acquisition date: ${img.acquisitionDate}.` : 'No acquisition date found.',
      input.spatialContext?.coordinates
        ? `Location: ${input.spatialContext.coordinates.lat.toFixed(3)}, ${input.spatialContext.coordinates.lon.toFixed(3)}.`
        : 'No location metadata found in the file.',
    ],
    estimatedLocation: null,
    imageQuality: { cloudCoverPercent: 0, notes: 'Pixels could not be read.' },
    caveats: [],
    overallConfidence: 0.1,
    model: 'basic',
    level: 'BASIC',
  };
}

export async function interpretLocally(input: AnalysisInput, question: string): Promise<VisionAnalysis> {
  try {
    const primary = analyzeRaster(await rasterize(input.images.primary));
    if (input.mode === 'BI_TEMPORAL' && input.images.secondary) {
      const secondary = analyzeRaster(await rasterize(input.images.secondary));
      return pairAnalysis(primary, secondary, question);
    }
    return singleImageAnalysis(primary, question);
  } catch {
    return minimalAnalysis(input);
  }
}
