# SatQuery AI - Data Model Specification

## 1. Overview
The SatQuery AI Observation Intelligence Registry provides structured, multi-sensor remote sensing observations across global biomes, disaster zones, and agricultural frontiers.

## 2. Core Observation Schema (`Observation`)

```typescript
export interface Observation {
  id: string;                         // e.g. 'OBS_AMAZON_DEFOREST_01'
  title: string;                      // Display headline
  category: ObservationCategory;      // Domain classification
  severity: ObservationSeverity;      // 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW'
  country: string;                    // Primary country
  region: string;                     // Province / State / Regional name
  biome?: string;                     // Ecological land cover biome
  latitude: number;                   // Geographic WGS84 decimal latitude
  longitude: number;                  // Geographic WGS84 decimal longitude
  
  // Temporal & Sensor Provenance
  baselineDate: string;               // ISO 8601 YYYY-MM-DD
  targetDate: string;                 // ISO 8601 YYYY-MM-DD
  sensor: string;                     // e.g. 'Sentinel-2 MSI', 'Sentinel-1 SAR C-Band'
  platform: string;                   // e.g. 'Sentinel-2A/B L2A BOA'
  modality: ModalityType;             // 'OPTICAL' | 'SAR' | 'THERMAL' | 'MULTISPECTRAL'
  cloudCover?: number;                // Estimated cloud contamination %
  dataStatus: ObservationDataStatus;  // 'PUBLIC_DATA' | 'DEMO_DATA'
  
  // Deterministic Radiometric Metrics
  metricName: string;                 // e.g. 'NDVI (Canopy Vitality)'
  baselineValue: number;              // T0 measurement
  targetValue: number;                // T1 measurement
  percentageChange: number;           // Calculated delta (%)
  confidence: number;                 // Model / agent confidence (0.00 - 1.00)
  
  // Geospatial Footprint & Camera Flight
  areaAffectedSqKm?: number;          // Surface footprint
  geometry?: GeoJSONGeometry;         // GeoJSON Polygon / MultiPolygon
  polygonCoordinates?: { lat: number; lon: number }[];
  boundingBox?: [number, number, number, number]; // [minLon, minLat, maxLon, maxLat]
  camera?: {
    lat: number;
    lon: number;
    altitude: number;
    heading: number;
    pitch: number;
  };
  
  // Scientific Evidence & AI Trace
  description: string;
  inference: string;
  primaryDrivers?: string[];
  spectralBands?: SpectralBandReflectance[];
  agentTrace?: AgentExecutionTrace;
}
```

## 4. Phase 2 Spatial & Temporal Evidence Structures

### 4.1 Spatial Evidence Item (`SpatialEvidenceItem`)
```typescript
export interface SpatialEvidenceItem {
  id: string;
  type: 'POLYGON' | 'POINT' | 'BOUNDING_BOX' | 'CHANGE_REGION';
  label: string;
  category: ObservationCategory;
  confidence: number;
  changeStatus: 'NEW_INCREASED' | 'REMOVED_DECREASED' | 'UNCHANGED';
  areaSqKm?: number;
  coordinates: { lat: number; lon: number }[];
  boundingBox?: [number, number, number, number];
  description?: string;
  metricDelta?: string;
}
```

### 4.2 Bi-Temporal Comparison Data (`TemporalComparisonData`)
```typescript
export interface TemporalComparisonData {
  beforeDate: string;
  afterDate: string;
  beforeMetricValue: number;
  afterMetricValue: number;
  percentageDelta: number;
  metricName: string;
  changeType: ObservationCategory;
  changeStatus: 'DECREASED' | 'INCREASED' | 'UNCHANGED' | 'ANOMALY';
  changeRegions: SpatialEvidenceItem[];
  aiInference: string;
  rawEvidenceIndicators: string[];
}
```

### 4.3 Multimodal Comparison Data (`MultimodalComparisonData`)
```typescript
export interface MultimodalComparisonData {
  opticalSensor: string;
  opticalResolution: string;
  opticalBands: string[];
  opticalInterpretation: string;
  sarSensor: string;
  sarBand: string;
  sarResolution: string;
  sarInterpretation: string;
  jointInsight: string;
  confidence: number;
}
```

### 4.4 8-Stage Execution Pipeline (`ExecutionPipelineStage`)
```typescript
export interface ExecutionPipelineStage {
  id: string;
  title: string;
  agentOrTool: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'SKIPPED';
  durationMs: number;
  summary: string;
  artifacts?: string[];
}
```
- **Modality**: `OPTICAL`, `SAR`, `THERMAL`, `MULTISPECTRAL`.
- **Data Status**: `PUBLIC_DATA` (Copernicus/USGS benchmarks), `DEMO_DATA` (synthesized demonstration scenes).

## 4. Multi-Band Spectral Profile (`SpectralBandReflectance`)
Tracks Top-of-Canopy / Bottom-of-Atmosphere (BOA) reflectances across key wavelengths (e.g., B02 Blue 490nm, B03 Green 560nm, B04 Red 665nm, B08 NIR 842nm, B11 SWIR-1 1610nm, B12 SWIR-2 2190nm).
