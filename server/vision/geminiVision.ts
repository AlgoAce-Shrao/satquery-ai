/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Server-side Gemini vision analysis for uploaded Earth-observation imagery.
 *
 * Runs only on the server (Vercel function in production, Vite dev middleware
 * locally) so GEMINI_API_KEY never reaches the browser bundle. The model is
 * asked for structured JSON: land cover shares, grounded regions (bounding
 * boxes on the image), change notes for image pairs, and a direct answer to
 * the user's question. Everything it returns is a model interpretation of the
 * pixels it was shown — the client labels it that way.
 */

import { GoogleGenAI } from '@google/genai';

export const DEFAULT_GEMINI_MODEL = 'gemini-3.6-flash';
/** Tried in order after the configured model if it is unavailable or rate-limited. */
const FALLBACK_MODELS = ['gemini-3.5-flash', 'gemini-3.5-flash-lite'];

export const REGION_CATEGORIES = [
  'VEGETATION',
  'FOREST',
  'CROPLAND',
  'WATER',
  'WETLAND',
  'BUILT_UP',
  'BARE_SOIL',
  'BURN_SCAR',
  'FLOOD',
  'SNOW_ICE',
  'CLOUD',
  'OTHER',
] as const;
export type RegionCategory = (typeof REGION_CATEGORIES)[number];

export const CHANGE_STATUSES = ['INCREASED', 'DECREASED', 'UNCHANGED', 'NOT_APPLICABLE'] as const;
export type RegionChangeStatus = (typeof CHANGE_STATUSES)[number];

export interface VisionImageInput {
  mimeType: string;
  dataBase64: string;
  label?: string;
}

export interface VisionAnalyzeRequest {
  mode: 'SINGLE_IMAGE' | 'BI_TEMPORAL' | 'OPTICAL_SAR';
  prompt: string;
  images: VisionImageInput[];
  context?: {
    locationName?: string;
    country?: string;
    lat?: number;
    lon?: number;
    beforeDate?: string;
    afterDate?: string;
    sensor?: string;
  };
}

export interface VisionRegion {
  label: string;
  category: RegionCategory;
  /** [ymin, xmin, ymax, xmax] normalised to 0–1 on the (first / "after") image */
  box: [number, number, number, number];
  observation: string;
  changeStatus: RegionChangeStatus;
  confidence: number;
}

export interface VisionAnalysis {
  answer: string;
  sceneSummary: string;
  sceneType: string;
  landCover: { category: RegionCategory; percent: number }[];
  regions: VisionRegion[];
  changes: { description: string; direction: 'INCREASE' | 'DECREASE' | 'MODIFIED'; magnitude: 'LOW' | 'MODERATE' | 'HIGH' }[];
  /** Image pairs only: visual coverage estimate of the class that changed most, in each image */
  coverageComparison: { category: RegionCategory; beforePercent: number; afterPercent: number } | null;
  insights: string[];
  estimatedLocation: { name: string; country: string; lat: number; lon: number; confidence: number } | null;
  imageQuality: { cloudCoverPercent: number; notes: string };
  caveats: string[];
  overallConfidence: number;
  model: string;
  /** DETAILED = vision model; BASIC = in-browser colour interpretation fallback */
  level?: 'DETAILED' | 'BASIC';
}

// JSON schema handed to Gemini's structured-output mode.
const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    answer: { type: 'string', description: "Direct answer to the user's question, 1–3 sentences." },
    sceneSummary: { type: 'string', description: 'What the scene shows overall, 2–3 sentences.' },
    sceneType: { type: 'string', description: 'Short scene type, e.g. "irrigated agricultural plain".' },
    landCover: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          category: { type: 'string', enum: [...REGION_CATEGORIES] },
          percent: { type: 'number', description: 'Estimated share of the image, 0–100.' },
        },
        required: ['category', 'percent'],
      },
    },
    regions: {
      type: 'array',
      description: 'Up to 8 distinct, clearly visible features relevant to the question.',
      items: {
        type: 'object',
        properties: {
          label: { type: 'string', description: 'Short name, e.g. "River channel", "Cleared parcels".' },
          category: { type: 'string', enum: [...REGION_CATEGORIES] },
          box_2d: {
            type: 'array',
            items: { type: 'integer' },
            description: 'Bounding box [ymin, xmin, ymax, xmax] normalised to 0–1000.',
          },
          observation: {
            type: 'string',
            description: 'What is visible here and, for image pairs, what changed. One sentence.',
          },
          changeStatus: { type: 'string', enum: [...CHANGE_STATUSES] },
          confidence: { type: 'number', description: '0–1, how clearly the feature is visible.' },
        },
        required: ['label', 'category', 'box_2d', 'observation', 'changeStatus', 'confidence'],
      },
    },
    changes: {
      type: 'array',
      description: 'Only for image pairs: the notable differences between the first and second image.',
      items: {
        type: 'object',
        properties: {
          description: { type: 'string' },
          direction: { type: 'string', enum: ['INCREASE', 'DECREASE', 'MODIFIED'] },
          magnitude: { type: 'string', enum: ['LOW', 'MODERATE', 'HIGH'] },
        },
        required: ['description', 'direction', 'magnitude'],
      },
    },
    coverageComparison: {
      type: 'object',
      nullable: true,
      description: 'Only for image pairs: the land-cover class that changed most, with its estimated share of each image (0–100). Null for a single image.',
      properties: {
        category: { type: 'string', enum: [...REGION_CATEGORIES] },
        beforePercent: { type: 'number' },
        afterPercent: { type: 'number' },
      },
      required: ['category', 'beforePercent', 'afterPercent'],
    },
    insights: { type: 'array', items: { type: 'string' }, description: '3–5 specific, evidence-based insights.' },
    estimatedLocation: {
      type: 'object',
      nullable: true,
      description: 'Only if the place is recognisable from visual cues; otherwise null.',
      properties: {
        name: { type: 'string' },
        country: { type: 'string' },
        lat: { type: 'number' },
        lon: { type: 'number' },
        confidence: { type: 'number' },
      },
      required: ['name', 'country', 'lat', 'lon', 'confidence'],
    },
    imageQuality: {
      type: 'object',
      properties: {
        cloudCoverPercent: { type: 'number' },
        notes: { type: 'string' },
      },
      required: ['cloudCoverPercent', 'notes'],
    },
    caveats: { type: 'array', items: { type: 'string' } },
    overallConfidence: { type: 'number', description: '0–1 confidence in the answer.' },
  },
  required: [
    'answer',
    'sceneSummary',
    'sceneType',
    'landCover',
    'regions',
    'changes',
    'insights',
    'imageQuality',
    'caveats',
    'overallConfidence',
  ],
};

function buildInstructions(req: VisionAnalyzeRequest): string {
  const ctx = req.context ?? {};
  const known: string[] = [];
  if (ctx.locationName || ctx.country) known.push(`Location given by the user: ${[ctx.locationName, ctx.country].filter(Boolean).join(', ')}`);
  if (typeof ctx.lat === 'number' && typeof ctx.lon === 'number') known.push(`Approximate centre: ${ctx.lat.toFixed(4)}, ${ctx.lon.toFixed(4)}`);
  if (ctx.beforeDate || ctx.afterDate) known.push(`Dates: ${ctx.beforeDate ?? 'unknown'} → ${ctx.afterDate ?? 'unknown'}`);
  if (ctx.sensor) known.push(`Sensor hint: ${ctx.sensor}`);

  const modeText =
    req.mode === 'BI_TEMPORAL'
      ? 'You are given TWO images of the same area: the first is the earlier (baseline) image, the second is the later (target) image. Compare them and describe what changed. Give region boxes on the SECOND image.'
      : req.mode === 'OPTICAL_SAR'
      ? 'You are given an optical image and a SAR (radar) image of the same area. Use both. Give region boxes on the FIRST (optical) image.'
      : 'You are given ONE image. Describe it and answer the question. Give region boxes on this image.';

  return [
    'You are an Earth-observation analyst reviewing satellite or aerial imagery for a geospatial intelligence console.',
    modeText,
    known.length ? `Known context:\n- ${known.join('\n- ')}` : 'No location or date metadata is available.',
    `User question: "${req.prompt}"`,
    'Rules:',
    '- Describe only what is visible. Do not invent measurements, dates, sensors or place names.',
    '- Percentages and changes are visual estimates; say so in caveats when relevant.',
    '- Bounding boxes must tightly enclose the feature and use [ymin, xmin, ymax, xmax] on a 0–1000 scale.',
    '- Prefer features that answer the question (e.g. the river, the cleared fields, the burn scar).',
    '- If the image is not Earth imagery, say so in the answer and return empty regions.',
    '- estimatedLocation must be null unless the place is genuinely recognisable.',
  ].join('\n');
}

// ---------------------------------------------------------------------------
// Output sanitising — never trust model JSON blindly.
// ---------------------------------------------------------------------------

const clamp = (v: unknown, min: number, max: number, fallback: number) => {
  const n = typeof v === 'number' && Number.isFinite(v) ? v : fallback;
  return Math.min(max, Math.max(min, n));
};
const str = (v: unknown, max = 600) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const oneOf = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T =>
  allowed.includes(v as T) ? (v as T) : fallback;

function sanitize(raw: any, model: string): VisionAnalysis {
  const regions: VisionRegion[] = (Array.isArray(raw?.regions) ? raw.regions : [])
    .map((r: any): VisionRegion | null => {
      const b = Array.isArray(r?.box_2d) ? r.box_2d.map((n: unknown) => clamp(n, 0, 1000, 0) / 1000) : [];
      if (b.length !== 4) return null;
      const [y0, x0, y1, x1] = b;
      const box: [number, number, number, number] = [Math.min(y0, y1), Math.min(x0, x1), Math.max(y0, y1), Math.max(x0, x1)];
      if (box[2] - box[0] < 0.01 || box[3] - box[1] < 0.01) return null;
      return {
        label: str(r.label, 60) || 'Feature',
        category: oneOf(r.category, REGION_CATEGORIES, 'OTHER'),
        box,
        observation: str(r.observation, 300),
        changeStatus: oneOf(r.changeStatus, CHANGE_STATUSES, 'NOT_APPLICABLE'),
        confidence: clamp(r.confidence, 0, 1, 0.5),
      };
    })
    .filter(Boolean)
    .slice(0, 8) as VisionRegion[];

  const loc = raw?.estimatedLocation;
  const estimatedLocation =
    loc && Number.isFinite(loc.lat) && Number.isFinite(loc.lon) && Math.abs(loc.lat) <= 90 && Math.abs(loc.lon) <= 180
      ? {
          name: str(loc.name, 80) || 'Estimated location',
          country: str(loc.country, 60),
          lat: loc.lat,
          lon: loc.lon,
          confidence: clamp(loc.confidence, 0, 1, 0),
        }
      : null;

  return {
    answer: str(raw?.answer, 800) || 'The model did not return an answer.',
    sceneSummary: str(raw?.sceneSummary, 800),
    sceneType: str(raw?.sceneType, 80) || 'Unclassified scene',
    landCover: (Array.isArray(raw?.landCover) ? raw.landCover : [])
      .map((l: any) => ({ category: oneOf(l?.category, REGION_CATEGORIES, 'OTHER'), percent: clamp(l?.percent, 0, 100, 0) }))
      .filter((l: { percent: number }) => l.percent > 0)
      .sort((a: { percent: number }, b: { percent: number }) => b.percent - a.percent)
      .slice(0, 8),
    regions,
    changes: (Array.isArray(raw?.changes) ? raw.changes : []).slice(0, 8).map((c: any) => ({
      description: str(c?.description, 300),
      direction: oneOf(c?.direction, ['INCREASE', 'DECREASE', 'MODIFIED'] as const, 'MODIFIED'),
      magnitude: oneOf(c?.magnitude, ['LOW', 'MODERATE', 'HIGH'] as const, 'LOW'),
    })),
    coverageComparison:
      raw?.coverageComparison && typeof raw.coverageComparison === 'object'
        ? {
            category: oneOf(raw.coverageComparison.category, REGION_CATEGORIES, 'OTHER'),
            beforePercent: clamp(raw.coverageComparison.beforePercent, 0, 100, 0),
            afterPercent: clamp(raw.coverageComparison.afterPercent, 0, 100, 0),
          }
        : null,
    insights: (Array.isArray(raw?.insights) ? raw.insights : []).map((s: unknown) => str(s, 300)).filter(Boolean).slice(0, 6),
    estimatedLocation,
    imageQuality: {
      cloudCoverPercent: clamp(raw?.imageQuality?.cloudCoverPercent, 0, 100, 0),
      notes: str(raw?.imageQuality?.notes, 300),
    },
    caveats: (Array.isArray(raw?.caveats) ? raw.caveats : []).map((s: unknown) => str(s, 300)).filter(Boolean).slice(0, 5),
    overallConfidence: clamp(raw?.overallConfidence, 0, 1, 0.5),
    model,
    level: 'DETAILED',
  };
}

function isRetryableModelError(err: unknown) {
  const e = err as { status?: number; message?: string };
  const msg = (e?.message ?? '').toLowerCase();
  return e?.status === 404 || e?.status === 429 || e?.status === 503 || msg.includes('not found') || msg.includes('quota') || msg.includes('overloaded');
}

export async function analyzeSceneWithGemini(
  req: VisionAnalyzeRequest,
  opts: { apiKey: string; model?: string }
): Promise<VisionAnalysis> {
  const ai = new GoogleGenAI({ apiKey: opts.apiKey });
  const models = [opts.model || DEFAULT_GEMINI_MODEL, ...FALLBACK_MODELS.filter((m) => m !== opts.model)];

  const parts = [
    { text: buildInstructions(req) },
    ...req.images.flatMap((img, i) => [
      { text: img.label ?? `Image ${i + 1}` },
      { inlineData: { mimeType: img.mimeType, data: img.dataBase64 } },
    ]),
  ];

  let lastError: unknown;
  for (const model of models) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: [{ role: 'user', parts }],
        config: {
          responseMimeType: 'application/json',
          responseJsonSchema: RESPONSE_SCHEMA,
          temperature: 0.2,
        },
      });
      const text = response.text;
      if (!text) throw new Error('Gemini returned an empty response.');
      return sanitize(JSON.parse(text), model);
    } catch (err) {
      lastError = err;
      if (!isRetryableModelError(err)) break;
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}
