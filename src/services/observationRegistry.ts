/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Observation Intelligence Registry Service
 * Central service managing all remote-sensing observations, filtering, ranking, and adapter mappings.
 */

import {
  Observation,
  ObservationFilter,
  ObservationCategory,
  ObservationSeverity,
} from '../types/observation';
import { AnalysisResult, AnalysisType } from '../types/geospatial';
import { GLOBAL_OBSERVATIONS } from '../data/observations';

/**
 * Maps Observation Category to legacy AnalysisType for visualization consistency
 */
export function categoryToAnalysisType(category: ObservationCategory): AnalysisType {
  switch (category) {
    case 'DEFORESTATION':
    case 'VEGETATION_CHANGE':
    case 'AGRICULTURE':
      return 'VEGETATION_CHANGE';
    case 'FLOOD':
    case 'WATER_CHANGE':
    case 'COASTAL_CHANGE':
      return 'WATER_EXPANSION';
    case 'WILDFIRE':
      return 'WILDFIRE_BURN';
    case 'URBAN_EXPANSION':
    case 'INFRASTRUCTURE':
      return 'URBAN_GROWTH';
    default:
      return 'TEMPORAL_COMPARISON';
  }
}

/**
 * Transforms an Observation into an AnalysisResult format consumed by the Cesium Globe and HUD
 */
export function observationToAnalysisResult(obs: Observation, rank: number = 1): AnalysisResult {
  // Generate polygon coordinates if not explicitly provided
  let polygon = obs.polygonCoordinates || [];
  if (polygon.length === 0 && obs.geometry && obs.geometry.type === 'Polygon') {
    const coords = obs.geometry.coordinates as number[][][];
    if (coords && coords[0]) {
      polygon = coords[0].map(([lon, lat]) => ({ lat, lon }));
    }
  }

  // Fallback camera setup if not defined
  const camera = obs.camera || {
    lat: obs.latitude,
    lon: obs.longitude,
    altitude: 1200000,
    heading: 0,
    pitch: -55,
  };

  // Spectral bands fallback if not present
  const spectralBands = obs.spectralBands && obs.spectralBands.length > 0
    ? obs.spectralBands
    : [
        { band: 'B02', wavelength: '490 nm', name: 'Blue', beforeReflectance: 0.040, afterReflectance: 0.055 },
        { band: 'B03', wavelength: '560 nm', name: 'Green', beforeReflectance: 0.055, afterReflectance: 0.075 },
        { band: 'B04', wavelength: '665 nm', name: 'Red', beforeReflectance: 0.045, afterReflectance: 0.120 },
        { band: 'B08', wavelength: '842 nm', name: 'NIR', beforeReflectance: 0.410, afterReflectance: 0.250 },
        { band: 'B11', wavelength: '1610 nm', name: 'SWIR-1', beforeReflectance: 0.120, afterReflectance: 0.260 },
      ];

  // Bounding box calculation
  let minLon = obs.longitude - 0.25;
  let maxLon = obs.longitude + 0.25;
  let minLat = obs.latitude - 0.25;
  let maxLat = obs.latitude + 0.25;

  if (polygon.length > 0) {
    minLon = Math.min(...polygon.map((p) => p.lon));
    maxLon = Math.max(...polygon.map((p) => p.lon));
    minLat = Math.min(...polygon.map((p) => p.lat));
    maxLat = Math.max(...polygon.map((p) => p.lat));
  }
  const boundingBox: [number, number, number, number] = [minLon, minLat, maxLon, maxLat];

  // Sub-region spatial evidence annotations
  const isDecrease = obs.percentageChange < 0;
  const primaryChangeStatus: 'NEW_INCREASED' | 'REMOVED_DECREASED' = isDecrease
    ? 'REMOVED_DECREASED'
    : 'NEW_INCREASED';

  const spatialEvidence = [
    {
      id: `${obs.id}_SE_01`,
      type: 'CHANGE_REGION' as const,
      label: `Core ${obs.category.replace(/_/g, ' ')} Impact Sector`,
      category: obs.category,
      confidence: obs.confidence,
      changeStatus: primaryChangeStatus,
      areaSqKm: Math.round((obs.areaAffectedSqKm || 500) * 0.7),
      coordinates: polygon,
      boundingBox,
      description: obs.title,
      metricDelta: `${obs.percentageChange > 0 ? '+' : ''}${obs.percentageChange}%`,
    },
    {
      id: `${obs.id}_SE_02`,
      type: 'CHANGE_REGION' as const,
      label: 'Stable Perimeter / Baseline Buffer',
      category: obs.category,
      confidence: 0.96,
      changeStatus: 'UNCHANGED' as const,
      areaSqKm: Math.round((obs.areaAffectedSqKm || 500) * 0.3),
      coordinates: [],
      description: 'Adjacent natural terrain exhibiting stable spectral reflectance across epochs.',
      metricDelta: '±0.5%',
    },
  ];

  // Temporal comparison package
  const temporalComparison = {
    beforeDate: obs.baselineDate,
    afterDate: obs.targetDate,
    beforeMetricValue: obs.baselineValue,
    afterMetricValue: obs.targetValue,
    percentageDelta: obs.percentageChange,
    metricName: obs.metricName,
    changeType: obs.category,
    changeStatus: isDecrease ? ('DECREASED' as const) : ('INCREASED' as const),
    changeRegions: spatialEvidence,
    aiInference: obs.inference || obs.description,
    rawEvidenceIndicators: obs.evidence || obs.primaryDrivers || ['Spectral Radiometric Shift'],
  };

  // Multimodal Optical + SAR comparison package
  const multimodalData = {
    opticalSensor: `${obs.sensor} Multispectral Instrument`,
    opticalResolution: '10m GSD (13 Spectral Bands)',
    opticalBands: ['B02 (Blue)', 'B03 (Green)', 'B04 (Red)', 'B08 (NIR)', 'B11 (SWIR)'],
    opticalInterpretation: `High sensitivity to ${obs.metricName} pigmentation, surface reflection, and vegetation chlorophyll.`,
    sarSensor: 'Sentinel-1A SAR C-Band Radar (5.405 GHz)',
    sarBand: 'Interferometric Wide Swath (IW) VV + VH Polarizations',
    sarResolution: '20m x 22m Spatial Resolution',
    sarInterpretation: `Microwave radar backscatter reveals structural roughness and dielectric moisture, penetrating cloud obstruction.`,
    jointInsight: `Joint Optical + SAR fusion validates that observed radiometric change in ${obs.region} reflects physical surface transformation.`,
    confidence: obs.confidence,
  };

  return {
    id: obs.id,
    rank,
    siteCode: obs.id.replace('OBS_', 'SITE_'),
    regionName: obs.region,
    country: obs.country,
    biome: obs.biome || 'Global Terrestrial Biome',
    analysisType: categoryToAnalysisType(obs.category),
    category: obs.category,
    location: {
      lat: obs.latitude,
      lon: obs.longitude,
    },
    camera,
    polygon,
    boundingBox,
    metric: {
      name: obs.metricName,
      beforeValue: obs.baselineValue,
      afterValue: obs.targetValue,
      percentageChange: obs.percentageChange,
      unit: 'index / metric',
      severity: obs.severity,
    },
    confidence: obs.confidence,
    satellite: obs.sensor,
    sensor: obs.platform,
    modality: obs.modality,
    dataStatus: obs.dataStatus,
    cloudCover: obs.cloudCover ?? 2.0,
    observationPeriod: {
      beforeDate: obs.baselineDate,
      afterDate: obs.targetDate,
      beforeLabel: obs.baselineDate.slice(0, 7),
      afterLabel: obs.targetDate.slice(0, 7),
    },
    headline: obs.title,
    evidenceNarrative: obs.inference || obs.description,
    primaryDrivers: obs.primaryDrivers || ['Anthropogenic activity', 'Climatic factor'],
    spectralBands,
    areaAffectedSqKm: obs.areaAffectedSqKm || 500,
    spatialEvidence,
    temporalComparison,
    multimodalData,
    agentTrace: obs.agentTrace,
    rawObservation: obs,
  };
}

export class ObservationRegistryService {
  private observations: Observation[] = GLOBAL_OBSERVATIONS;

  /**
   * Retrieves all observations in the registry
   */
  getAllObservations(): Observation[] {
    return [...this.observations];
  }

  /**
   * Retrieves an observation by its unique ID
   */
  getObservationById(id: string): Observation | undefined {
    return this.observations.find((obs) => obs.id.toLowerCase() === id.toLowerCase());
  }

  /**
   * Filter observations using structured criteria
   */
  filterObservations(filter: ObservationFilter): Observation[] {
    return this.observations.filter((obs) => {
      // 1. Category Filter
      if (filter.category && filter.category !== 'ALL' && obs.category !== filter.category) {
        return false;
      }

      // 2. Severity Filter
      if (filter.severity && filter.severity !== 'ALL' && obs.severity !== filter.severity) {
        return false;
      }

      // 3. Sensor Filter
      if (filter.sensor && filter.sensor !== 'ALL' && !obs.sensor.toLowerCase().includes(filter.sensor.toLowerCase())) {
        return false;
      }

      // 4. Modality Filter
      if (filter.modality && filter.modality !== 'ALL' && obs.modality !== filter.modality) {
        return false;
      }

      // 5. Data Status Filter
      if (filter.dataStatus && filter.dataStatus !== 'ALL' && obs.dataStatus !== filter.dataStatus) {
        return false;
      }

      // 6. Country Filter
      if (filter.country && !obs.country.toLowerCase().includes(filter.country.toLowerCase())) {
        return false;
      }

      // 7. Region Filter
      if (filter.region && !obs.region.toLowerCase().includes(filter.region.toLowerCase())) {
        return false;
      }

      // 8. Confidence Filter
      if (filter.minConfidence !== undefined && obs.confidence < filter.minConfidence) {
        return false;
      }

      // 9. Query text search
      if (filter.query && filter.query.trim() !== '') {
        const q = filter.query.toLowerCase();
        const matchesText =
          obs.title.toLowerCase().includes(q) ||
          obs.region.toLowerCase().includes(q) ||
          obs.country.toLowerCase().includes(q) ||
          obs.description.toLowerCase().includes(q) ||
          obs.category.toLowerCase().includes(q) ||
          obs.sensor.toLowerCase().includes(q) ||
          obs.id.toLowerCase().includes(q);
        if (!matchesText) return false;
      }

      return true;
    });
  }

  /**
   * Calculate a relevance score for ranking observations against a query
   */
  calculateRelevanceScore(
    obs: Observation,
    queryKeywords: string[],
    targetCategories: ObservationCategory[],
    targetCountry?: string,
    targetSensor?: string
  ): number {
    let score = 0;

    // Severity weighting
    const severityWeight: Record<ObservationSeverity, number> = {
      CRITICAL: 40,
      HIGH: 30,
      MODERATE: 20,
      LOW: 10,
    };
    score += severityWeight[obs.severity] || 0;

    // Confidence weighting (0 to 20 points)
    score += Math.round(obs.confidence * 20);

    // Target Category matches (+50 points)
    if (targetCategories.includes(obs.category)) {
      score += 50;
    }

    // Country match (+60 points)
    if (targetCountry && obs.country.toLowerCase().includes(targetCountry.toLowerCase())) {
      score += 60;
    }

    // Sensor match (+30 points)
    if (targetSensor && obs.sensor.toLowerCase().includes(targetSensor.toLowerCase())) {
      score += 30;
    }

    // Keyword hits
    const fullText = `${obs.title} ${obs.region} ${obs.country} ${obs.description} ${obs.inference} ${obs.category}`.toLowerCase();
    for (const kw of queryKeywords) {
      if (fullText.includes(kw)) {
        score += 15;
      }
    }

    return score;
  }

  /**
   * Get formatted AnalysisResult array for consumption by map and HUD
   */
  getAnalysisResults(filter?: ObservationFilter): AnalysisResult[] {
    const list = filter ? this.filterObservations(filter) : this.getAllObservations();
    return list.map((obs, index) => observationToAnalysisResult(obs, index + 1));
  }
}

export const observationRegistry = new ObservationRegistryService();
