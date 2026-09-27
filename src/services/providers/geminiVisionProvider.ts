/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Gemini Vision Analysis Provider
 * Sends uploaded imagery (downscaled in the browser) to the server-side
 * /api/vision/analyze endpoint, which calls Gemini with the API key held on
 * the server. The structured reply — land cover, grounded regions, changes and
 * a direct answer — is mapped onto the console's AnalysisResult so every
 * existing panel renders it. Results are labelled AI_VISION_ANALYSIS: they are
 * a model's visual interpretation, not pixel measurements.
 */

import { AnalysisProvider } from './analysisProvider';
import { AnalysisInput, UploadedImage } from '../../types/upload';
import {
  AnalysisResult,
  AnalysisType,
  ChangeStatus,
  ExecutionPipelineStage,
  ObservationCategory,
  ObservationSeverity,
  PolygonCoordinate,
  SpatialEvidenceItem,
  VisionAnalysis,
  VisionRegion,
} from '../../types/geospatial';
import { LocationContextService } from '../locationContextService';

const ENDPOINT = '/api/vision/analyze';
const MAX_EDGE_PX = 1600;
/** Minimum model-reported confidence before a guessed location is used on the globe */
const MIN_LOCATION_CONFIDENCE = 0.6;

type RegionCategory = VisionRegion['category'];

const CATEGORY_TO_OBSERVATION: Record<RegionCategory, ObservationCategory> = {
  VEGETATION: 'VEGETATION_CHANGE',
  FOREST: 'DEFORESTATION',
  CROPLAND: 'AGRICULTURE',
  WATER: 'WATER_CHANGE',
  WETLAND: 'WATER_CHANGE',
  BUILT_UP: 'URBAN_EXPANSION',
  BARE_SOIL: 'VEGETATION_CHANGE',
  BURN_SCAR: 'WILDFIRE',
  FLOOD: 'FLOOD',
  SNOW_ICE: 'WATER_CHANGE',
  CLOUD: 'VEGETATION_CHANGE',
  OTHER: 'VEGETATION_CHANGE',
};

const CATEGORY_TO_ANALYSIS: Partial<Record<ObservationCategory, AnalysisType>> = {
  VEGETATION_CHANGE: 'VEGETATION_CHANGE',
  DEFORESTATION: 'VEGETATION_CHANGE',
  AGRICULTURE: 'VEGETATION_CHANGE',
  WATER_CHANGE: 'WATER_EXPANSION',
  FLOOD: 'WATER_EXPANSION',
  URBAN_EXPANSION: 'URBAN_GROWTH',
  WILDFIRE: 'WILDFIRE_BURN',
};

export const CATEGORY_LABEL: Record<RegionCategory, string> = {
  VEGETATION: 'Vegetation',
  FOREST: 'Forest',
  CROPLAND: 'Cropland',
  WATER: 'Water',
  WETLAND: 'Wetland',
  BUILT_UP: 'Built-up',
  BARE_SOIL: 'Bare soil',
  BURN_SCAR: 'Burn scar',
  FLOOD: 'Flood water',
  SNOW_ICE: 'Snow / ice',
  CLOUD: 'Cloud',
  OTHER: 'Other',
};

const CHANGE_MAP: Record<VisionRegion['changeStatus'], ChangeStatus> = {
  INCREASED: 'NEW_INCREASED',
  DECREASED: 'REMOVED_DECREASED',
  UNCHANGED: 'UNCHANGED',
  NOT_APPLICABLE: 'UNCHANGED',
};

/** Draws the upload onto a canvas and returns a downscaled JPEG as base64. */
async function toJpegBase64(image: UploadedImage): Promise<string> {
  const img = new Image();
  img.decoding = 'async';
  img.src = image.previewUrl;
  try {
    await img.decode();
  } catch {
    throw new Error(
      `${image.fileName} can't be decoded by the browser (GeoTIFF previews aren't supported). Export it as PNG or JPEG for AI vision analysis.`
    );
  }
  const scale = Math.min(1, MAX_EDGE_PX / Math.max(img.naturalWidth || 1, img.naturalHeight || 1));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round((img.naturalWidth || 800) * scale));
  canvas.height = Math.max(1, Math.round((img.naturalHeight || 600) * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable.');
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.86).split(',')[1];
}

/** Maps a normalised image box onto real geographic bounds. */
function boxToGeo(box: VisionRegion['box'], bounds: [number, number, number, number]) {
  const [minLon, minLat, maxLon, maxLat] = bounds;
  const [y0, x0, y1, x1] = box;
  const lon = (x: number) => minLon + x * (maxLon - minLon);
  const lat = (y: number) => maxLat - y * (maxLat - minLat);
  const coordinates: PolygonCoordinate[] = [
    { lat: lat(y0), lon: lon(x0) },
    { lat: lat(y0), lon: lon(x1) },
    { lat: lat(y1), lon: lon(x1) },
    { lat: lat(y1), lon: lon(x0) },
  ];
  const bbox: [number, number, number, number] = [lon(x0), lat(y1), lon(x1), lat(y0)];
  return { coordinates, bbox };
}

function approxAreaSqKm(bbox: [number, number, number, number]) {
  const [w, s, e, n] = bbox;
  const midLat = ((s + n) / 2) * (Math.PI / 180);
  return Math.round(Math.abs(e - w) * 111.32 * Math.cos(midLat) * Math.abs(n - s) * 110.57 * 10) / 10;
}

function firstSentence(text: string, max = 110) {
  const s = text.split(/(?<=[.!?])\s/)[0] ?? text;
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

export class GeminiVisionProvider implements AnalysisProvider {
  public id = 'gemini_vision';
  public name = 'SatQuery Vision';
  public type: 'VISION_LLM' = 'VISION_LLM';

  private availability: Promise<boolean> | null = null;

  /** Probes the server once per session; re-probes after a failure. */
  public isAvailable(): Promise<boolean> {
    if (!this.availability) {
      this.availability = fetch(ENDPOINT, { method: 'GET', signal: AbortSignal.timeout(8000) })
        .then(async (r) => (r.ok ? Boolean((await r.json())?.configured) : false))
        .catch(() => false)
        .then((ok) => {
          if (!ok) this.availability = null;
          return ok;
        });
    }
    return this.availability;
  }

  public async execute(
    input: AnalysisInput,
    query: string,
    onProgressStage?: (stage: ExecutionPipelineStage) => void,
    _intent?: string
  ): Promise<AnalysisResult> {
    const { primary, secondary } = input.images;
    const started = performance.now();

    onProgressStage?.({
      id: 'stg_vision_prepare',
      stage: 'SPECIALIST_TOOL_SELECTED',
      title: 'Preparing imagery',
      description: `Preparing ${primary.fileName}${secondary ? ` + ${secondary.fileName}` : ''} for analysis.`,
    });

    const images = [{ mimeType: 'image/jpeg', dataBase64: await toJpegBase64(primary), label: primary.label || (input.mode === 'BI_TEMPORAL' ? 'Earlier image (baseline)' : input.mode === 'OPTICAL_SAR' ? 'Optical image' : 'Image') }];
    if (secondary && input.mode !== 'SINGLE_IMAGE') {
      images.push({
        mimeType: 'image/jpeg',
        dataBase64: await toJpegBase64(secondary),
        label: secondary.label || (input.mode === 'BI_TEMPORAL' ? 'Later image (target)' : 'SAR image'),
      });
    }

    onProgressStage?.({
      id: 'stg_vision_analyze',
      stage: 'REMOTE_SENSING_ANALYSIS',
      title: 'Scene analysis',
      description: 'Interpreting land cover, grounding visible features and answering the question.',
    });

    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: input.mode,
        prompt: query,
        images,
        context: {
          locationName: input.spatialContext?.locationName,
          country: input.spatialContext?.country,
          lat: input.spatialContext?.coordinates?.lat,
          lon: input.spatialContext?.coordinates?.lon,
          beforeDate: input.temporalContext?.beforeDate ?? primary.acquisitionDate,
          afterDate: input.temporalContext?.afterDate ?? secondary?.acquisitionDate,
          sensor: primary.geospatialInfo.sensorType,
        },
      }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload?.error || `Vision analysis failed with status ${response.status}`);

    const analysis = payload as VisionAnalysis;
    onProgressStage?.({
      id: 'stg_vision_ground',
      stage: 'SPATIAL_EVIDENCE_EXTRACTED',
      title: 'Grounded regions extracted',
      description: `${analysis.regions.length} feature(s) located on the image.`,
    });

    return this.buildResult(input, query, { ...analysis, level: 'DETAILED' }, Math.round(performance.now() - started));
  }

  /** Maps a VisionAnalysis (detailed or basic) onto the console's AnalysisResult. */
  public buildResult(input: AnalysisInput, query: string, a: VisionAnalysis, elapsedMs: number): AnalysisResult {
    const isBasic = a.level === 'BASIC';
    const { primary, secondary } = input.images;
    const isPair = input.mode === 'BI_TEMPORAL' && Boolean(secondary);

    // ---- Location: metadata / user input first; a confident model guess only as a labelled last resort.
    let loc = LocationContextService.resolve(
      primary.geospatialInfo,
      input.spatialContext
        ? {
            name: input.spatialContext.locationName,
            country: input.spatialContext.country,
            lat: input.spatialContext.coordinates?.lat,
            lon: input.spatialContext.coordinates?.lon,
          }
        : undefined
    );
    let locationNote: string | null = null;
    if (!loc.hasCoordinates && a.estimatedLocation && a.estimatedLocation.confidence >= MIN_LOCATION_CONFIDENCE) {
      const g = a.estimatedLocation;
      loc = LocationContextService.resolve(undefined, {
        name: `${g.name} (estimated)`,
        country: g.country || 'Estimated',
        lat: g.lat,
        lon: g.lon,
      });
      locationNote = `Location estimated from visual cues; verify before relying on it.`;
    }

    // Only real embedded bounds let image boxes become map polygons — no assumed footprints.
    const geoBounds = primary.geospatialInfo.bounds;

    // ---- Primary theme: the most clearly changed region, else the dominant land cover.
    const changedRegion = a.regions.find((r) => r.changeStatus === 'INCREASED' || r.changeStatus === 'DECREASED');
    const dominantCover = a.landCover.find((l) => l.category !== 'CLOUD') ?? a.landCover[0];
    const themeCategory: RegionCategory =
      (isPair && a.coverageComparison?.category) || changedRegion?.category || dominantCover?.category || 'OTHER';
    const category = CATEGORY_TO_OBSERVATION[themeCategory];
    const themeLabel = CATEGORY_LABEL[themeCategory];

    // ---- Headline metric (visual estimates, labelled as such)
    const magnitudes = a.changes.map((c) => c.magnitude);
    const severity: ObservationSeverity = magnitudes.includes('HIGH') ? 'HIGH' : magnitudes.includes('MODERATE') ? 'MODERATE' : 'LOW';
    const cmp = isPair ? a.coverageComparison : null;
    const metric = cmp
      ? {
          name: `${CATEGORY_LABEL[cmp.category]} cover (AI visual estimate)`,
          beforeValue: Math.round(cmp.beforePercent) / 100,
          afterValue: Math.round(cmp.afterPercent) / 100,
          percentageChange: Math.round((cmp.afterPercent - cmp.beforePercent) * 10) / 10,
          unit: 'percentage points of scene',
          severity,
        }
      : {
          name: `${themeLabel} share of scene (AI visual estimate)`,
          beforeValue: (dominantCover?.percent ?? 0) / 100,
          afterValue: (dominantCover?.percent ?? 0) / 100,
          percentageChange: Math.round(dominantCover?.percent ?? 0),
          unit: '% of scene',
          severity: 'LOW' as ObservationSeverity,
        };

    // ---- Grounded regions → spatial evidence
    const spatialEvidence: SpatialEvidenceItem[] = a.regions.map((r, i) => {
      const geo = geoBounds ? boxToGeo(r.box, geoBounds) : null;
      return {
        id: `VIS_${Date.now()}_${i}`,
        type: 'BOUNDING_BOX',
        label: r.label,
        category: CATEGORY_TO_OBSERVATION[r.category],
        confidence: r.confidence,
        coordinates: geo?.coordinates ?? [],
        boundingBox: geo?.bbox,
        changeStatus: CHANGE_MAP[r.changeStatus],
        areaSqKm: geo ? approxAreaSqKm(geo.bbox) : undefined,
        description: r.observation,
        sourceSensor: 'SatQuery Vision',
        metricDelta:
          r.changeStatus === 'INCREASED' ? 'Increased' : r.changeStatus === 'DECREASED' ? 'Decreased' : CATEGORY_LABEL[r.category],
        imageBox: r.box,
      };
    });

    const polygon: PolygonCoordinate[] = geoBounds
      ? [
          { lat: geoBounds[3], lon: geoBounds[0] },
          { lat: geoBounds[3], lon: geoBounds[2] },
          { lat: geoBounds[1], lon: geoBounds[2] },
          { lat: geoBounds[1], lon: geoBounds[0] },
        ]
      : [];

    const narrative = [a.answer, a.sceneSummary, locationNote, ...a.caveats.map((c) => `Caveat: ${c}`)]
      .filter(Boolean)
      .join(' ');

    const analysisType: AnalysisType = isPair
      ? 'TEMPORAL_COMPARISON'
      : input.mode === 'OPTICAL_SAR'
      ? 'MULTIMODAL_ANALYSIS'
      : CATEGORY_TO_ANALYSIS[category] ?? 'LAND_COVER';

    const beforeDate = input.temporalContext?.beforeDate || primary.acquisitionDate || 'Unknown (not embedded in upload)';
    const afterDate = input.temporalContext?.afterDate || secondary?.acquisitionDate || primary.acquisitionDate || beforeDate;

    const result: AnalysisResult = {
      id: `RES_VISION_${Date.now()}`,
      rank: 1,
      siteCode: 'SITE_AI_VISION',
      regionName: loc.locationName,
      country: loc.country,
      biome: a.sceneType,
      analysisType,
      visualizationType: isPair ? 'CHANGE_DETECTION' : input.mode === 'OPTICAL_SAR' ? 'MULTIMODAL' : 'GROUNDING',
      category,
      location: loc.point,
      camera: loc.camera,
      polygon,
      boundingBox: geoBounds,
      metric,
      confidence: a.overallConfidence,
      satellite: 'Uploaded image',
      sensor: isBasic ? 'SatQuery basic image interpretation' : 'SatQuery Vision analysis',
      modality: input.mode === 'OPTICAL_SAR' ? 'MULTIMODAL' : primary.modality,
      // Basic results are real (rule-based) pixel computations; detailed ones are model estimates.
      dataStatus: isBasic ? 'USER_RASTER_ANALYSIS' : 'AI_VISION_ANALYSIS',
      cloudCover: a.imageQuality.cloudCoverPercent,
      observationPeriod: {
        beforeDate,
        afterDate,
        beforeLabel: isPair ? 'Uploaded baseline (T0)' : 'Uploaded scene',
        afterLabel: isPair ? 'Uploaded target (T1)' : 'Uploaded scene',
      },
      headline: firstSentence(a.answer),
      evidenceNarrative: narrative,
      primaryDrivers: (a.changes.length ? a.changes.map((c) => c.description) : a.insights).slice(0, 3),
      spectralBands: a.landCover.map((l) => ({
        band: l.category,
        wavelength: 'AI visual estimate',
        name: `${CATEGORY_LABEL[l.category]} cover`,
        beforeReflectance: (cmp && cmp.category === l.category ? cmp.beforePercent : l.percent) / 100,
        afterReflectance: l.percent / 100,
      })),
      areaAffectedSqKm: spatialEvidence.reduce((sum, e) => sum + (e.changeStatus !== 'UNCHANGED' ? e.areaSqKm ?? 0 : 0), 0),
      spatialEvidence,
      agentTrace: {
        task: query,
        agent: 'SatQuery Vision',
        models: ['SatQuery Vision'],
        tools: isBasic ? ['Colour-based land-cover estimate', 'Grid localisation'] : ['Scene interpretation', 'Feature localisation'],
        confidence: a.overallConfidence,
        reasoning: a.sceneSummary,
        timestamp: new Date().toISOString(),
      },
      executionPipeline: [
        {
          id: 'stg_vision_model',
          stage: 'REMOTE_SENSING_ANALYSIS',
          title: 'Scene analysis',
          description: `${a.regions.length} grounded feature(s), ${a.landCover.length} land-cover classes, ${a.changes.length} change note(s).`,
          modelsUsed: ['SatQuery Vision'],
          durationMs: elapsedMs,
          confidence: a.overallConfidence,
        },
      ],
      visionAnalysis: a,
    };

    if (isPair && secondary) {
      result.temporalComparison = {
        beforeDate,
        afterDate,
        beforeImageUrl: primary.previewUrl,
        afterImageUrl: secondary.previewUrl,
        beforeMetricValue: metric.beforeValue,
        afterMetricValue: metric.afterValue,
        percentageDelta: metric.percentageChange,
        metricName: metric.name,
        changeType: cmp ? `${CATEGORY_LABEL[cmp.category]} cover change` : 'Visual change',
        changeStatus: !cmp ? 'MODIFIED' : cmp.afterPercent > cmp.beforePercent ? 'INCREASED' : cmp.afterPercent < cmp.beforePercent ? 'DECREASED' : 'STABLE',
        changeRegions: spatialEvidence.filter((e) => e.changeStatus !== 'UNCHANGED'),
        aiInference: a.answer,
        rawEvidenceIndicators: a.changes.length ? a.changes.map((c) => `${c.magnitude} ${c.direction.toLowerCase()}: ${c.description}`) : a.insights,
      };
    }

    if (input.mode === 'OPTICAL_SAR' && secondary) {
      result.multimodalData = {
        opticalSensor: primary.geospatialInfo.sensorType || 'Uploaded optical image',
        opticalResolution: `${primary.width}x${primary.height}px`,
        opticalBands: ['Visible RGB (as uploaded)'],
        opticalInterpretation: a.sceneSummary,
        opticalImageUrl: primary.previewUrl,
        sarSensor: secondary.geospatialInfo.sensorType || 'Uploaded SAR image',
        sarBand: 'As uploaded',
        sarResolution: `${secondary.width}x${secondary.height}px`,
        sarInterpretation: a.insights.join(' '),
        sarImageUrl: secondary.previewUrl,
        jointInsight: a.answer,
        confidence: a.overallConfidence,
      };
    }

    return result;
  }
}
