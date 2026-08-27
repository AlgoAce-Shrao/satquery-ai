/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Upload & Ingestion Data Models for SatQuery AI
 * Defines the standardized structures for user-uploaded single images,
 * temporal pairs, and multimodal optical+SAR pairs.
 */

import { ModalityType, SensorType, ObservationCategory, ObservationSeverity } from './observation';
import { AnalysisResult, SpatialEvidenceItem, ExecutionPipelineStage } from './geospatial';

export type InputMode = 'SINGLE_IMAGE' | 'BI_TEMPORAL' | 'OPTICAL_SAR';

export type ImageFormat = 'GEOTIFF' | 'COG' | 'NETCDF' | 'PNG' | 'JPEG' | 'WEBP' | 'TIFF' | 'UNKNOWN';

export type CompatibilityStatus =
  | 'COMPATIBLE'
  | 'LIKELY_COMPATIBLE'
  | 'COMPATIBILITY_UNKNOWN'
  | 'NOT_COMPATIBLE';

export type ToolStatus = 'CONNECTED' | 'DEMO_MODE' | 'MOCKED' | 'READY_FOR_BACKEND';

export interface GeospatialMetadata {
  hasGeospatial: boolean;
  crs?: string;
  epsg?: number;
  bounds?: [number, number, number, number]; // [minLon, minLat, maxLon, maxLat]
  center?: { lat: number; lon: number };
  pixelSizeMeters?: number;
  acquisitionDate?: string;
  satellitePlatform?: string;
  sensorType?: SensorType;
  cloudCoverPercentage?: number;
  sunElevationAngle?: number;
  bandNames?: string[];
}

export interface UploadedImage {
  id: string;
  file?: File;
  fileName: string;
  format: ImageFormat;
  fileSizeBytes: number;
  previewUrl: string;
  width: number;
  height: number;
  modality: ModalityType;
  modalityConfidence: number;
  isUserSpecifiedModality: boolean;
  geospatialInfo: GeospatialMetadata;
  acquisitionDate?: string;
  label?: string; // e.g. "Baseline (T0)", "Target (T1)", "Optical RGB", "SAR VV/VH"
  source: 'USER_UPLOAD' | 'BENCHMARK_DEMO' | 'COPERNICUS_OPEN_ACCESS';
  validationStatus: 'VALID' | 'WARNING' | 'INVALID';
  validationNotes?: string[];
}

export interface CompatibilityCheckItem {
  id: string;
  title: string;
  status: 'PASS' | 'WARNING' | 'FAIL' | 'UNKNOWN';
  message: string;
}

export interface ValidationReport {
  overallStatus: CompatibilityStatus;
  canExecuteAnalysis: boolean;
  summary: string;
  checks: CompatibilityCheckItem[];
  suggestedAction?: string;
}

export interface AnalysisInput {
  id: string;
  mode: InputMode;
  title: string;
  userPrompt?: string;
  images: {
    primary: UploadedImage;
    secondary?: UploadedImage; // After image in bi-temporal, or SAR in optical+SAR
  };
  validationReport: ValidationReport;
  spatialContext?: {
    locationName?: string;
    country?: string;
    coordinates?: { lat: number; lon: number };
    isManuallyAssigned?: boolean;
  };
  temporalContext?: {
    beforeDate?: string;
    afterDate?: string;
    timeDeltaDays?: number;
  };
  createdAt: string;
}

export interface SpecialistToolDefinition {
  id: string;
  name: string;
  code: string;
  category: 'VISION_LANGUAGE' | 'CHANGE_DETECTION' | 'FUSION' | 'SPATIAL_INDEX' | 'GEODETIC';
  supportedInputs: InputMode[];
  supportedTasks: string[];
  status: ToolStatus;
  statusDescription: string;
  backendProvider: 'COLAB_PYTORCH' | 'CLIENT_DEMO_ENGINE' | 'GEMINI_MULTIMODAL' | 'GEOSPATIAL_INDEX';
  description: string;
}

export interface WorkflowExecutionPlan {
  planId: string;
  classifiedIntent: string;
  recommendedWorkflow: string;
  selectedTools: SpecialistToolDefinition[];
  stages: ExecutionPipelineStage[];
  confidenceScore: number;
  reasoningNotes: string[];
}

export interface ColabAnalyzeRequest {
  query: string;
  task: string;
  inputMode: InputMode;
  images: {
    primary: {
      fileName: string;
      modality: ModalityType;
      dataBase64?: string;
      url?: string;
      metadata?: GeospatialMetadata;
    };
    secondary?: {
      fileName: string;
      modality: ModalityType;
      dataBase64?: string;
      url?: string;
      metadata?: GeospatialMetadata;
    };
  };
  options?: {
    confidenceThreshold?: number;
    returnHeatmaps?: boolean;
    delineateMasks?: boolean;
  };
}

export interface ColabAnalyzeResponse {
  taskId: string;
  query: string;
  status: 'SUCCESS' | 'ERROR';
  analysisResult: AnalysisResult;
  processingTimeMs: number;
  modelProvenance: {
    modelName: string;
    backendRuntime: string;
    modelVersion: string;
  };
}
