/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Real Raster Analysis Provider
 * Sends the actual uploaded image bytes to the already-deployed
 * Spring Boot gateway -> eo-analysis-service pipeline, which decodes real pixels
 * (rasterio/Pillow) and computes real vegetation indices / bi-temporal pixel
 * differences / SAR-modality intensity statistics. Unlike MockAnalysisProvider,
 * every number and trace step returned here reflects a real computation — see
 * services/eo-analysis-service/app/analysis/raster_processor.py for exactly what
 * is (and isn't) claimed.
 */

import { AnalysisProvider } from './analysisProvider';
import { AnalysisInput, UploadedImage } from '../../types/upload';
import {
  AnalysisResult,
  ExecutionPipelineStage,
  AnalysisMetric,
  SpectralBand,
  TemporalComparisonData,
} from '../../types/geospatial';
import { LocationContextService } from '../locationContextService';

interface RasterIndexResult {
  name: string;
  formula: string;
  mean: number;
  min: number;
  max: number;
  interpretation: string;
  caveat?: string | null;
}

interface RasterSarStats {
  meanIntensity: number;
  stdIntensity: number;
  method: string;
  caveat: string;
}

interface RasterSingleAnalysis {
  width: number;
  height: number;
  bandCount: number;
  validPixelFraction: number;
  indices: RasterIndexResult[];
  sarStats?: RasterSarStats | null;
}

interface RasterBiTemporalAnalysis {
  alignment: string;
  width: number;
  height: number;
  meanAbsoluteDifference: number;
  percentChangedPixels: number;
  changeThreshold: number;
  changeMaskPngBase64: string;
  ndviDelta?: { meanDelta: number; interpretation: string } | null;
}

interface RasterExecutionStep {
  step: string;
  tool: string;
  detail: string;
  durationMs: number;
}

interface RasterAnalysisResponse {
  mode: 'SINGLE' | 'BI_TEMPORAL';
  modality: 'OPTICAL' | 'SAR';
  analysisType: string;
  decoder: string;
  single?: RasterSingleAnalysis | null;
  biTemporal?: RasterBiTemporalAnalysis | null;
  confidence: { value: number; method: string };
  executionTrace: RasterExecutionStep[];
  narrative: string;
}

async function fileToBase64(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return btoa(binary);
}

function toExecutionPipeline(steps: RasterExecutionStep[]): ExecutionPipelineStage[] {
  return steps.map((s, idx) => ({
    id: `stg_raster_${idx}`,
    stage: idx === 0 ? 'REMOTE_SENSING_ANALYSIS' : 'REMOTE_SENSING_ANALYSIS',
    title: s.step,
    description: s.detail,
    toolsUsed: [s.tool],
    durationMs: s.durationMs,
  }));
}

export class RealAnalysisProvider implements AnalysisProvider {
  public id = 'real_raster_engine';
  public name = 'SatQuery Raster Analysis Engine (real pixel data, rule-based)';
  public type: 'REAL_RASTER_ENGINE' = 'REAL_RASTER_ENGINE';

  private gatewayUrl: string;

  constructor(gatewayUrl?: string) {
    this.gatewayUrl = gatewayUrl || (import.meta as any).env?.VITE_SPRING_BOOT_API_URL || '';
  }

  public async isAvailable(): Promise<boolean> {
    if (!this.gatewayUrl) return false;
    try {
      const response = await fetch(`${this.gatewayUrl}/api/v1/health`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  private async postRaster(body: Record<string, unknown>): Promise<RasterAnalysisResponse> {
    const response = await fetch(`${this.gatewayUrl}/api/v1/analyze/raster`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body?.detail || body?.error || `Raster analysis failed with status ${response.status}`);
    }
    return (await response.json()) as RasterAnalysisResponse;
  }

  private async analyzeSingle(image: UploadedImage, query: string): Promise<RasterAnalysisResponse> {
    if (!image.file) {
      throw new Error(`${image.fileName} has no raw file data available to analyze.`);
    }
    const contentBase64 = await fileToBase64(image.file);
    return this.postRaster({
      mode: 'SINGLE',
      modality: image.modality === 'SAR' ? 'SAR' : 'OPTICAL',
      query,
      images: [{ filename: image.fileName, content_base64: contentBase64 }],
    });
  }

  private async analyzeBiTemporal(
    before: UploadedImage,
    after: UploadedImage,
    query: string
  ): Promise<RasterAnalysisResponse> {
    if (!before.file || !after.file) {
      throw new Error('Both images need raw file data available to run bi-temporal analysis.');
    }
    const [beforeB64, afterB64] = await Promise.all([fileToBase64(before.file), fileToBase64(after.file)]);
    return this.postRaster({
      mode: 'BI_TEMPORAL',
      modality: before.modality === 'SAR' ? 'SAR' : 'OPTICAL',
      query,
      images: [
        { filename: before.fileName, content_base64: beforeB64, timestamp: 'T0' },
        { filename: after.fileName, content_base64: afterB64, timestamp: 'T1' },
      ],
    });
  }

  public async execute(
    input: AnalysisInput,
    query: string,
    onProgressStage?: (stage: ExecutionPipelineStage) => void,
    _intent?: string
  ): Promise<AnalysisResult> {
    const primary = input.images.primary;
    const secondary = input.images.secondary;

    const loc = LocationContextService.resolve(
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

    if (onProgressStage) {
      onProgressStage({
        id: 'stg_real_dispatch',
        stage: 'SPECIALIST_TOOL_SELECTED',
        title: 'Dispatching to Real Raster Analysis Engine',
        description: `Sending ${primary.fileName}${secondary ? ` + ${secondary.fileName}` : ''} to the deployed eo-analysis-service for real pixel decoding.`,
        durationMs: 200,
      });
    }

    if (input.mode === 'BI_TEMPORAL' && secondary) {
      const resp = await this.analyzeBiTemporal(primary, secondary, query);
      return this.buildBiTemporalResult(input, loc, resp, primary, secondary);
    }

    if (input.mode === 'OPTICAL_SAR' && secondary) {
      const [respA, respB] = await Promise.all([
        this.analyzeSingle(primary, query),
        this.analyzeSingle(secondary, query),
      ]);
      return this.buildMultimodalResult(input, loc, respA, respB, primary, secondary);
    }

    const resp = await this.analyzeSingle(primary, query);
    return this.buildSingleResult(input, loc, resp, primary);
  }

  private buildSingleResult(
    input: AnalysisInput,
    loc: ReturnType<typeof LocationContextService.resolve>,
    resp: RasterAnalysisResponse,
    primary: UploadedImage
  ): AnalysisResult {
    const single = resp.single!;
    const primaryIndex = single.indices[0];

    const metric: AnalysisMetric = {
      name: `${primaryIndex.name} (real pixel statistics)`,
      beforeValue: primaryIndex.min,
      afterValue: primaryIndex.max,
      percentageChange: Math.round((primaryIndex.max - primaryIndex.min) * 10000) / 100,
      unit: `${primaryIndex.name} index range`,
      severity: single.validPixelFraction < 0.5 ? 'MODERATE' : 'LOW',
    };

    const spectralBands: SpectralBand[] = single.indices.map((idx) => ({
      band: idx.name,
      wavelength: single.bandCount >= 4 ? 'Real NIR/Red bands' : 'Visible R/G/B only (no NIR)',
      name: idx.name,
      beforeReflectance: idx.min,
      afterReflectance: idx.max,
    }));

    const evidenceNarrative = [
      resp.narrative,
      primaryIndex.caveat ? `Caveat: ${primaryIndex.caveat}` : null,
      single.sarStats ? `SAR heuristic: ${single.sarStats.caveat}` : null,
    ]
      .filter(Boolean)
      .join(' ');

    return {
      id: `RES_REAL_${Date.now()}`,
      rank: 1,
      siteCode: 'SITE_REAL_UPLOAD',
      regionName: loc.locationName,
      country: loc.country,
      biome: 'Not classified (real pixel analysis does not include land-cover classification)',
      analysisType: 'LAND_COVER',
      visualizationType: 'SINGLE_IMAGE',
      category: 'VEGETATION_CHANGE',
      location: loc.point,
      camera: loc.camera,
      polygon: [],
      metric,
      confidence: resp.confidence.value,
      satellite: 'Uploaded image (no satellite platform metadata claimed)',
      sensor: `${resp.decoder} decoder, ${single.bandCount}-band raster`,
      modality: primary.modality,
      dataStatus: 'USER_RASTER_ANALYSIS',
      cloudCover: 0,
      observationPeriod: {
        beforeDate: primary.acquisitionDate || 'Unknown (not embedded in upload)',
        afterDate: primary.acquisitionDate || 'Unknown (not embedded in upload)',
        beforeLabel: 'Uploaded scene',
        afterLabel: 'Uploaded scene',
      },
      headline: `Real Pixel-Level ${primaryIndex.name} Computed from ${primary.fileName}`,
      evidenceNarrative,
      primaryDrivers: [resp.confidence.method],
      spectralBands,
      areaAffectedSqKm: 0,
      spatialEvidence: [],
      executionPipeline: toExecutionPipeline(resp.executionTrace),
    };
  }

  private buildBiTemporalResult(
    input: AnalysisInput,
    loc: ReturnType<typeof LocationContextService.resolve>,
    resp: RasterAnalysisResponse,
    before: UploadedImage,
    after: UploadedImage
  ): AnalysisResult {
    const bi = resp.biTemporal!;
    const severity = bi.percentChangedPixels > 40 ? 'HIGH' : bi.percentChangedPixels > 15 ? 'MODERATE' : 'LOW';

    const metric: AnalysisMetric = {
      name: 'Real per-pixel mean absolute difference',
      beforeValue: 0,
      afterValue: bi.meanAbsoluteDifference,
      percentageChange: bi.percentChangedPixels,
      unit: '% of pixels changed',
      severity,
    };

    const temporalComparison: TemporalComparisonData = {
      beforeDate: input.temporalContext?.beforeDate || 'Unknown (not embedded in upload)',
      afterDate: input.temporalContext?.afterDate || 'Unknown (not embedded in upload)',
      beforeImageUrl: before.previewUrl,
      afterImageUrl: after.previewUrl,
      differenceImageUrl: `data:image/png;base64,${bi.changeMaskPngBase64}`,
      beforeMetricValue: 0,
      afterMetricValue: bi.meanAbsoluteDifference,
      percentageDelta: bi.percentChangedPixels,
      metricName: 'Real per-pixel absolute difference (0-1 scale) after resize-to-common-grid alignment',
      changeType: 'PIXEL_DIFFERENCE',
      changeStatus: bi.percentChangedPixels > 15 ? 'MODIFIED' : 'STABLE',
      changeRegions: [],
      aiInference: resp.narrative,
      rawEvidenceIndicators: [
        `${bi.percentChangedPixels.toFixed(1)}% of pixels exceed the ${bi.changeThreshold} difference threshold — computed with numpy on the two actual uploaded images.`,
        bi.alignment,
        bi.ndviDelta ? `NDVI mean delta (real NIR bands): ${bi.ndviDelta.meanDelta}. ${bi.ndviDelta.interpretation}` : 'No NIR band available in either image, so no NDVI delta could be computed.',
      ],
    };

    const spectralBands: SpectralBand[] = [
      { band: 'DIFF', wavelength: 'N/A', name: 'Mean Absolute Pixel Difference', beforeReflectance: 0, afterReflectance: bi.meanAbsoluteDifference },
    ];
    if (bi.ndviDelta) {
      spectralBands.push({ band: 'NDVI_DELTA', wavelength: 'Real NIR/Red', name: 'NDVI Delta', beforeReflectance: 0, afterReflectance: bi.ndviDelta.meanDelta });
    }

    return {
      id: `RES_REAL_BT_${Date.now()}`,
      rank: 1,
      siteCode: 'SITE_REAL_BITEMPORAL',
      regionName: loc.locationName,
      country: loc.country,
      biome: 'Not classified',
      analysisType: 'TEMPORAL_COMPARISON',
      visualizationType: 'CHANGE_DETECTION',
      category: 'VEGETATION_CHANGE',
      location: loc.point,
      camera: loc.camera,
      polygon: [],
      metric,
      confidence: resp.confidence.value,
      satellite: 'Uploaded imagery (no satellite platform metadata claimed)',
      sensor: `${resp.decoder} decoder`,
      modality: before.modality,
      dataStatus: 'USER_RASTER_ANALYSIS',
      cloudCover: 0,
      observationPeriod: {
        beforeDate: temporalComparison.beforeDate,
        afterDate: temporalComparison.afterDate,
        beforeLabel: 'Uploaded baseline (T0)',
        afterLabel: 'Uploaded target (T1)',
      },
      headline: `Real Bi-Temporal Pixel Difference: ${bi.percentChangedPixels.toFixed(1)}% of Pixels Changed`,
      evidenceNarrative: resp.narrative,
      primaryDrivers: [resp.confidence.method],
      spectralBands,
      areaAffectedSqKm: 0,
      spatialEvidence: [],
      temporalComparison,
      executionPipeline: toExecutionPipeline(resp.executionTrace),
    };
  }

  private buildMultimodalResult(
    input: AnalysisInput,
    loc: ReturnType<typeof LocationContextService.resolve>,
    respA: RasterAnalysisResponse,
    respB: RasterAnalysisResponse,
    imageA: UploadedImage,
    imageB: UploadedImage
  ): AnalysisResult {
    const opticalResp = respA.modality === 'OPTICAL' ? respA : respB;
    const sarResp = respA.modality === 'SAR' ? respA : respB;
    const opticalImage = respA.modality === 'OPTICAL' ? imageA : imageB;
    const sarImage = respA.modality === 'SAR' ? imageA : imageB;

    const opticalIndex = opticalResp.single?.indices[0];
    const sarStats = sarResp.single?.sarStats;

    const jointInsight =
      'Two independent per-image real raster analyses, computed separately and presented side by side. ' +
      'No joint dual-encoder fusion model was used — this is NOT a learned optical-SAR fusion, only ' +
      'independently-computed real statistics from each image.';

    const combinedConfidence = Math.round(((respA.confidence.value + respB.confidence.value) / 2) * 100) / 100;

    const metric: AnalysisMetric = {
      name: opticalIndex ? `${opticalIndex.name} (optical, real)` : 'Optical index unavailable',
      beforeValue: opticalIndex?.min ?? 0,
      afterValue: opticalIndex?.max ?? 0,
      percentageChange: 0,
      unit: 'Index range (optical channel only)',
      severity: 'LOW',
    };

    return {
      id: `RES_REAL_MM_${Date.now()}`,
      rank: 1,
      siteCode: 'SITE_REAL_MULTIMODAL',
      regionName: loc.locationName,
      country: loc.country,
      biome: 'Not classified',
      analysisType: 'MULTIMODAL_ANALYSIS',
      visualizationType: 'MULTIMODAL',
      category: 'URBAN_EXPANSION',
      location: loc.point,
      camera: loc.camera,
      polygon: [],
      metric,
      confidence: combinedConfidence,
      satellite: 'Uploaded imagery (no satellite platform metadata claimed)',
      sensor: `Optical: ${opticalResp.decoder} | SAR: ${sarResp.decoder}`,
      modality: 'MULTIMODAL',
      dataStatus: 'USER_RASTER_ANALYSIS',
      cloudCover: 0,
      observationPeriod: {
        beforeDate: opticalImage.acquisitionDate || 'Unknown',
        afterDate: sarImage.acquisitionDate || 'Unknown',
        beforeLabel: 'Optical upload',
        afterLabel: 'SAR upload',
      },
      headline: 'Independent Real Per-Image Optical & SAR Raster Statistics',
      evidenceNarrative: `${opticalResp.narrative} ${sarResp.narrative} ${jointInsight}`,
      primaryDrivers: [respA.confidence.method, respB.confidence.method],
      spectralBands: [
        ...(opticalIndex
          ? [{ band: opticalIndex.name, wavelength: 'Optical', name: opticalIndex.name, beforeReflectance: opticalIndex.min, afterReflectance: opticalIndex.max }]
          : []),
        ...(sarStats
          ? [{ band: 'SAR_INTENSITY', wavelength: 'N/A (heuristic)', name: 'SAR mean intensity', beforeReflectance: sarStats.meanIntensity, afterReflectance: sarStats.stdIntensity }]
          : []),
      ],
      areaAffectedSqKm: 0,
      spatialEvidence: [],
      multimodalData: {
        opticalSensor: `Uploaded optical image (${opticalResp.decoder})`,
        opticalResolution: opticalResp.single ? `${opticalResp.single.width}x${opticalResp.single.height}px` : 'Unknown',
        opticalBands: opticalResp.single ? [`${opticalResp.single.bandCount} band(s) decoded`] : [],
        opticalInterpretation: opticalIndex?.interpretation || 'No optical index computed.',
        opticalImageUrl: opticalImage.previewUrl,
        sarSensor: `Uploaded SAR-labelled image (${sarResp.decoder})`,
        sarBand: sarStats?.method || 'N/A',
        sarResolution: sarResp.single ? `${sarResp.single.width}x${sarResp.single.height}px` : 'Unknown',
        sarInterpretation: sarStats?.caveat || 'No SAR-modality statistics computed.',
        sarImageUrl: sarImage.previewUrl,
        jointInsight,
        confidence: combinedConfidence,
      },
      executionPipeline: toExecutionPipeline([...respA.executionTrace, ...respB.executionTrace]),
    };
  }
}
