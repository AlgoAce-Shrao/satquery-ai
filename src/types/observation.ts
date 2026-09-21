/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ObservationCategory =
  | 'DEFORESTATION'
  | 'FLOOD'
  | 'WILDFIRE'
  | 'URBAN_EXPANSION'
  | 'VEGETATION_CHANGE'
  | 'WATER_CHANGE'
  | 'AGRICULTURE'
  | 'INFRASTRUCTURE'
  | 'COASTAL_CHANGE';

export type ObservationSeverity = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

export type SensorType =
  | 'Sentinel-1'
  | 'Sentinel-2'
  | 'Landsat-8'
  | 'Landsat-9'
  | 'MODIS'
  | 'PlanetScope'
  | 'ALOS PALSAR'
  | string;

export type ModalityType = 'OPTICAL' | 'SAR' | 'MULTIMODAL';

// PUBLIC_DATA: sourced from the public satellite benchmark catalogue.
// DEMO_DATA: fabricated/simulated for demonstration (no real computation behind it).
// USER_RASTER_ANALYSIS: real rule-based pixel analysis computed from a user-uploaded image.
export type DataStatus = 'PUBLIC_DATA' | 'DEMO_DATA' | 'USER_RASTER_ANALYSIS';
export type ObservationDataStatus = DataStatus;

export interface SpectralBandData {
  band: string;
  wavelength: string;
  name: string;
  beforeReflectance: number;
  afterReflectance: number;
}

export interface AgentExecutionTrace {
  task: string;
  agent: string;
  models: string[];
  tools: string[];
  confidence: number;
  reasoning?: string;
  timestamp?: string;
}

export interface GeoCoordinate {
  lat: number;
  lon: number;
  altitude?: number;
}

export interface GeoJsonGeometry {
  type: 'Polygon' | 'MultiPolygon' | 'Point';
  coordinates: number[][][] | number[][][][] | number[];
}

export interface Observation {
  id: string;
  title: string;
  region: string;
  country: string;
  latitude: number;
  longitude: number;
  category: ObservationCategory;
  severity: ObservationSeverity;
  baselineDate: string;
  targetDate: string;
  metricName: string;
  baselineValue: number;
  targetValue: number;
  percentageChange: number;
  confidence: number;
  sensor: SensorType;
  modality: ModalityType;
  platform: string;
  description: string;
  inference: string;
  evidence: string[];
  dataStatus: DataStatus;
  geometry: GeoJsonGeometry;
  boundingBox?: [number, number, number, number]; // [minLon, minLat, maxLon, maxLat]
  polygonCoordinates?: GeoCoordinate[];
  beforeImage?: string;
  afterImage?: string;
  differenceImage?: string;
  cloudCover?: number;
  areaAffectedSqKm?: number;
  biome?: string;
  primaryDrivers?: string[];
  spectralBands?: SpectralBandData[];
  agentTrace?: AgentExecutionTrace;
  camera?: {
    lat: number;
    lon: number;
    altitude: number;
    heading?: number;
    pitch?: number;
  };
}

export interface ObservationFilter {
  query?: string;
  country?: string;
  region?: string;
  category?: ObservationCategory | 'ALL';
  severity?: ObservationSeverity | 'ALL';
  sensor?: string | 'ALL';
  modality?: ModalityType | 'ALL';
  dataStatus?: DataStatus | 'ALL';
  minConfidence?: number;
  dateRange?: {
    start?: string;
    end?: string;
  };
}
