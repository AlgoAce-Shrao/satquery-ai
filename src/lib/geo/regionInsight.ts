/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Turns an AnalysisResult into a plain-language "what changed here" summary
 * for globe pins, hover tooltips and the anchored region callout. Wording is
 * derived from the result's own category, metric sign and evidence — nothing
 * new is inferred.
 */

import { AnalysisResult, ObservationCategory } from '../../types/geospatial';
import { LAND_COVER_LABEL } from './landCover';

export type InsightTone = 'critical' | 'positive' | 'warning' | 'neutral';

export interface RegionInsight {
  /** Short theme, e.g. "Vegetation", "Surface water" */
  theme: string;
  /** What happened, e.g. "Forest canopy loss" */
  headline: string;
  /** "Decrease" / "Increase" / "Observed" */
  direction: string;
  tone: InsightTone;
  /** e.g. "−34.2% NDVI" */
  deltaText: string;
  beforeAfter?: string;
  period?: string;
  area?: string;
  driver?: string;
  evidence?: string;
  /** Label for the result's provenance */
  source: string;
}

/** Palette hex values (mirror src/index.css) for places that need literal colours, e.g. Cesium. */
export const TONE_HEX: Record<InsightTone, string> = {
  critical: '#B85C4A',
  positive: '#7FA66A',
  warning: '#D39B4A',
  neutral: '#9D9B8F',
};

interface Wording {
  theme: string;
  decrease: string;
  increase: string;
  /** Which direction is the harmful one for this phenomenon */
  loss: 'decrease' | 'increase' | 'either';
}

const WORDING: Record<ObservationCategory, Wording> = {
  DEFORESTATION: { theme: 'Forest', decrease: 'Forest canopy loss', increase: 'Forest regrowth', loss: 'decrease' },
  VEGETATION_CHANGE: { theme: 'Vegetation', decrease: 'Vegetation decline', increase: 'Vegetation gain', loss: 'decrease' },
  AGRICULTURE: { theme: 'Cropland', decrease: 'Crop cover cleared', increase: 'Cropland greening', loss: 'decrease' },
  WILDFIRE: { theme: 'Burn scar', decrease: 'Burned vegetation', increase: 'Post-fire recovery', loss: 'decrease' },
  WATER_CHANGE: { theme: 'Surface water', decrease: 'Water body shrinking', increase: 'Water extent expanding', loss: 'decrease' },
  FLOOD: { theme: 'Flood water', decrease: 'Flood water receding', increase: 'Flood inundation', loss: 'increase' },
  COASTAL_CHANGE: { theme: 'Coastline', decrease: 'Coastal land / habitat loss', increase: 'Coastal water advance', loss: 'either' },
  URBAN_EXPANSION: { theme: 'Built-up area', decrease: 'Built-up reduction', increase: 'Built-up expansion', loss: 'either' },
  INFRASTRUCTURE: { theme: 'Infrastructure', decrease: 'Infrastructure removed', increase: 'New infrastructure', loss: 'either' },
};

const round1 = (n: number) => Math.round(n * 10) / 10;

export function describeRegion(result: AnalysisResult): RegionInsight {
  const { metric, category, observationPeriod } = result;
  const wording = WORDING[category] ?? WORDING.VEGETATION_CHANGE;
  // Uploaded single images (detailed or basic analysis) report a share of the scene, not a change.
  const isSingleSceneShare = metric.unit === '% of scene';
  const isCoverageShare = metric.unit === 'percentage points of scene';
  const dominantCover = result.visionAnalysis?.landCover?.[0];

  const pct = metric.percentageChange;
  const decreasing = pct < 0;
  const flat = pct === 0;

  let headline: string;
  let direction: string;
  let tone: InsightTone;

  if (isSingleSceneShare) {
    // A single uploaded image has no "before" — describe what dominates, not a change.
    headline = dominantCover
      ? `Mostly ${LAND_COVER_LABEL[dominantCover.category].toLowerCase()}`
      : `${wording.theme} identified`;
    direction = 'Observed';
    tone = 'neutral';
  } else if (flat) {
    headline = `${wording.theme} stable`;
    direction = 'No net change';
    tone = 'neutral';
  } else {
    headline = decreasing ? wording.decrease : wording.increase;
    direction = decreasing ? 'Decrease' : 'Increase';
    const harmful =
      wording.loss === 'either' ? null : (wording.loss === 'decrease') === decreasing;
    tone = harmful === null ? 'warning' : harmful ? 'critical' : 'positive';
  }

  const metricShort = metric.name.split(/[\s(]/)[0] || metric.name;
  const sign = pct > 0 ? '+' : pct < 0 ? '−' : '';
  const deltaText = isSingleSceneShare
    ? `${Math.round(pct)}% of scene`
    : isCoverageShare
    ? `${sign}${Math.abs(round1(pct))} pts`
    : `${sign}${Math.abs(round1(pct))}% ${metricShort}`;

  const beforeAfter =
    isSingleSceneShare || !Number.isFinite(metric.beforeValue) || !Number.isFinite(metric.afterValue)
      ? undefined
      : isCoverageShare
      ? `${Math.round(metric.beforeValue * 100)}% → ${Math.round(metric.afterValue * 100)}% of scene`
      : `${metric.beforeValue.toFixed(2)} → ${metric.afterValue.toFixed(2)}`;

  const samePeriod = observationPeriod.beforeDate === observationPeriod.afterDate;
  const period = observationPeriod.beforeDate?.startsWith('Unknown')
    ? undefined
    : samePeriod
    ? observationPeriod.afterDate
    : `${observationPeriod.beforeDate} → ${observationPeriod.afterDate}`;

  const evidence =
    result.rawObservation?.evidence?.[0] ??
    result.temporalComparison?.rawEvidenceIndicators?.[0] ??
    result.visionAnalysis?.insights?.[0] ??
    undefined;

  return {
    theme: isSingleSceneShare && dominantCover ? 'Land cover' : wording.theme,
    headline,
    direction,
    tone,
    deltaText,
    beforeAfter,
    period,
    area: result.areaAffectedSqKm > 0 ? `${result.areaAffectedSqKm.toLocaleString('en-US')} km²` : undefined,
    driver: result.primaryDrivers?.[0],
    evidence,
    source:
      result.dataStatus === 'PUBLIC_DATA'
        ? 'Public satellite data'
        : result.dataStatus === 'AI_VISION_ANALYSIS'
        ? 'AI vision estimate'
        : result.dataStatus === 'USER_RASTER_ANALYSIS'
        ? 'Uploaded-image pixel analysis'
        : 'Demo observation',
  };
}

/** Centroid of the result's polygon, falling back to its point location. */
export function regionAnchor(result: AnalysisResult): { lat: number; lon: number } {
  const pts = result.polygon?.length ? result.polygon : null;
  if (!pts) return result.location;
  const unique = pts.length > 3 && pts[0].lat === pts[pts.length - 1].lat && pts[0].lon === pts[pts.length - 1].lon ? pts.slice(0, -1) : pts;
  const lat = unique.reduce((s, p) => s + p.lat, 0) / unique.length;
  const lon = unique.reduce((s, p) => s + p.lon, 0) / unique.length;
  return { lat, lon };
}
