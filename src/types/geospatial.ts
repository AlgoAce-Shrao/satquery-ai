/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Observation,
  ObservationCategory,
  ObservationSeverity,
  ModalityType,
  DataStatus,
  AgentExecutionTrace,
  SpectralBandData,
} from './observation';

export * from './observation';

export type AnalysisType =
  | 'VEGETATION_CHANGE'
  | 'WATER_EXPANSION'
  | 'URBAN_GROWTH'
  | 'WILDFIRE_BURN'
  | 'TEMPORAL_COMPARISON'
  | 'GROUNDING'
  | 'MULTIMODAL_ANALYSIS'
  | 'LAND_COVER';

export type AnalysisVisualizationType =
  | 'SINGLE_IMAGE'
  | 'GROUNDING'
  | 'CHANGE_DETECTION'
  | 'MULTIMODAL'
  | 'REGION_ANALYSIS';

export type SpatialAnnotationType = 'POINT' | 'BOUNDING_BOX' | 'POLYGON' | 'CHANGE_REGION';

export type ChangeStatus = 'UNCHANGED' | 'NEW_INCREASED' | 'REMOVED_DECREASED';

export interface GeoPoint {
  lat: number;
  lon: number;
  altitude?: number;
}

export interface CameraPosition {
  lat: number;
  lon: number;
  altitude: number;
  heading?: number;
  pitch?: number;
}

export interface PolygonCoordinate {
  lat: number;
  lon: number;
}

export interface SpatialEvidenceItem {
  id: string;
  type: SpatialAnnotationType;
  label: string;
  category: ObservationCategory;
  confidence: number;
  coordinates: PolygonCoordinate[];
  boundingBox?: [number, number, number, number]; // [minLon, minLat, maxLon, maxLat]
  changeStatus?: ChangeStatus;
  areaSqKm?: number;
  description?: string;
  sourceSensor?: string;
  metricDelta?: string;
}

export interface TemporalComparisonData {
  beforeDate: string;
  afterDate: string;
  beforeImageUrl?: string;
  afterImageUrl?: string;
  differenceImageUrl?: string;
  beforeMetricValue: number;
  afterMetricValue: number;
  percentageDelta: number;
  metricName: string;
  changeType: string;
  changeStatus: 'INCREASED' | 'DECREASED' | 'MODIFIED' | 'STABLE';
  changeRegions: SpatialEvidenceItem[];
  aiInference: string;
  rawEvidenceIndicators: string[];
}

export interface MultimodalComparisonData {
  opticalSensor: string;
  opticalResolution: string;
  opticalBands: string[];
  opticalInterpretation: string;
  opticalImageUrl?: string;

  sarSensor: string;
  sarBand: string;
  sarResolution: string;
  sarInterpretation: string;
  sarImageUrl?: string;

  jointInsight: string;
  confidence: number;
}

export interface ExecutionPipelineStage {
  id: string;
  stage:
    | 'QUERY_RECEIVED'
    | 'TASK_IDENTIFIED'
    | 'INPUT_VALIDATED'
    | 'SPECIALIST_TOOL_SELECTED'
    | 'REMOTE_SENSING_ANALYSIS'
    | 'SPATIAL_EVIDENCE_EXTRACTED'
    | 'RESULT_VALIDATED'
    | 'INSIGHT_GENERATED';
  title: string;
  description: string;
  toolsUsed?: string[];
  modelsUsed?: string[];
  outputSummary?: string;
  durationMs?: number;
  confidence?: number;
}

export interface SpectralBand extends SpectralBandData {}

export interface AnalysisMetric {
  name: string;
  beforeValue: number;
  afterValue: number;
  percentageChange: number;
  unit: string;
  severity: ObservationSeverity;
}

export interface AnalysisResult {
  id: string;
  rank: number;
  siteCode: string;
  regionName: string;
  country: string;
  biome: string;
  analysisType: AnalysisType;
  visualizationType?: AnalysisVisualizationType;
  category: ObservationCategory;
  location: GeoPoint;
  camera: CameraPosition;
  polygon: PolygonCoordinate[];
  boundingBox?: [number, number, number, number]; // [minLon, minLat, maxLon, maxLat]
  metric: AnalysisMetric;
  confidence: number;
  satellite: string;
  sensor: string;
  modality: ModalityType;
  dataStatus: DataStatus;
  cloudCover: number;
  observationPeriod: {
    beforeDate: string;
    afterDate: string;
    beforeLabel: string;
    afterLabel: string;
  };
  headline: string;
  evidenceNarrative: string;
  primaryDrivers: string[];
  spectralBands: SpectralBand[];
  areaAffectedSqKm: number;
  spatialEvidence?: SpatialEvidenceItem[];
  temporalComparison?: TemporalComparisonData;
  multimodalData?: MultimodalComparisonData;
  executionPipeline?: ExecutionPipelineStage[];
  agentTrace?: AgentExecutionTrace;
  rawObservation?: Observation;
}

export interface ProcessStep {
  id: string;
  label: string;
  detail: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'ERROR';
  durationMs?: number;
}

export interface StructuredQuery {
  rawQuery: string;
  intent: string;
  direction: 'DECREASE' | 'INCREASE' | 'ANOMALY' | 'COMPARISON';
  spatialScope: string;
  timeRange: string;
  targetMetric: string;
  threshold?: string;
  categoryFilter?: ObservationCategory;
  countryFilter?: string;
  sensorFilter?: string;
  modalityFilter?: ModalityType;
  severityFilter?: ObservationSeverity;
}

export interface QueryExecutionState {
  queryId: string;
  rawQuery: string;
  structuredQuery: StructuredQuery;
  status: 'IDLE' | 'PROCESSING' | 'COMPLETED' | 'ERROR';
  currentStepIndex: number;
  steps: ProcessStep[];
  results: AnalysisResult[];
  activeResultIndex: number;
  isTourActive: boolean;
  systemMessage: string;
  observationId: string;
  filterCount?: number;
}
