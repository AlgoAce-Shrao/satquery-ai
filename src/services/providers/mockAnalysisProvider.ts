/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Mock & Rule-Based Analysis Provider
 * Provides deterministic, technically accurate remote-sensing AI reasoning for demo
 * and local inference across single scenes, bi-temporal pairs, and multimodal optical+SAR pairs.
 */

import { AnalysisProvider } from './analysisProvider';
import { AnalysisInput } from '../../types/upload';
import {
  AnalysisResult,
  ExecutionPipelineStage,
  SpatialEvidenceItem,
  TemporalComparisonData,
  MultimodalComparisonData,
} from '../../types/geospatial';
import { LocationContextService } from '../locationContextService';
import { SatelliteImageService } from '../satelliteImageService';

export class MockAnalysisProvider implements AnalysisProvider {
  public id = 'mock_rule_engine';
  public name = 'SatQuery Deterministic AI Engine (Demo Mode)';
  public type: 'MOCK_RULE_ENGINE' = 'MOCK_RULE_ENGINE';

  public async isAvailable(): Promise<boolean> {
    return true;
  }

  public async execute(
    input: AnalysisInput,
    query: string,
    onProgressStage?: (stage: ExecutionPipelineStage) => void
  ): Promise<AnalysisResult> {
    const q = query.toLowerCase();
    const mode = input.mode;
    const primaryImg = input.images.primary;
    const secondaryImg = input.images.secondary;

    // 1. Resolve Location & Camera Coordinates
    const loc = LocationContextService.resolve(
      primaryImg.geospatialInfo,
      input.spatialContext
        ? {
            name: input.spatialContext.locationName,
            country: input.spatialContext.country,
            lat: input.spatialContext.coordinates?.lat,
            lon: input.spatialContext.coordinates?.lon,
          }
        : undefined
    );

    const stages: ExecutionPipelineStage[] = [
      {
        id: 'stg_1',
        stage: 'QUERY_RECEIVED',
        title: 'Query & Input Ingestion',
        description: `Ingested ${mode.replace(/_/g, ' ')} payload (${primaryImg.fileName}${secondaryImg ? ` + ${secondaryImg.fileName}` : ''})`,
        durationMs: 250,
        outputSummary: 'Raster headers & user prompt verified.',
      },
      {
        id: 'stg_2',
        stage: 'INPUT_VALIDATED',
        title: 'Raster & Sensor Compatibility Check',
        description: input.validationReport.summary,
        durationMs: 300,
        outputSummary: `Status: ${input.validationReport.overallStatus}`,
      },
      {
        id: 'stg_3',
        stage: 'TASK_IDENTIFIED',
        title: 'Agentic Task & Intent Classification',
        description: this.classifyTaskDescription(mode, q),
        durationMs: 320,
        outputSummary: 'Target analysis pipeline routed.',
      },
      {
        id: 'stg_4',
        stage: 'SPECIALIST_TOOL_SELECTED',
        title: 'Specialist Model Dispatch',
        description: this.getDispatchedModels(mode, q),
        durationMs: 280,
        outputSummary: 'Dual-encoder weights initialized.',
      },
      {
        id: 'stg_5',
        stage: 'REMOTE_SENSING_ANALYSIS',
        title: 'Remote-Sensing Feature Extraction',
        description: 'Computing spectral indices, spatial texture gradients & backscatter deltas.',
        durationMs: 400,
        outputSummary: 'Feature maps compiled.',
      },
      {
        id: 'stg_6',
        stage: 'SPATIAL_EVIDENCE_EXTRACTED',
        title: 'Spatial Evidence & Mask Delineation',
        description: 'Extracting bounding coordinates, polygon vertices and confidence intervals.',
        durationMs: 350,
        outputSummary: 'Spatial evidence localized.',
      },
      {
        id: 'stg_7',
        stage: 'RESULT_VALIDATED',
        title: 'Scientific Consistency Verification',
        description: 'Cross-checking spectral responses against sensor calibration baselines.',
        durationMs: 280,
        outputSummary: 'Verification passed (0.94 score).',
      },
      {
        id: 'stg_8',
        stage: 'INSIGHT_GENERATED',
        title: 'Synthesis & Intelligence Report',
        description: 'Compiling final actionable intelligence and structured evidence cards.',
        durationMs: 220,
        outputSummary: 'Analysis ready for operator review.',
      },
    ];

    // Emit stage updates sequentially
    for (const stage of stages) {
      if (onProgressStage) {
        onProgressStage(stage);
      }
      await new Promise((resolve) => setTimeout(resolve, stage.durationMs || 150));
    }

    // Determine Specific Scenario Outcomes
    return this.buildResultForScenario(input, query, loc, stages);
  }

  private classifyTaskDescription(mode: string, q: string): string {
    if (mode === 'OPTICAL_SAR' || q.includes('sar') || q.includes('optical and sar')) {
      return 'Cross-Modal Optical Reflectance + SAR Backscatter Fusion';
    }
    if (q.includes('highlight') || q.includes('grounding') || q.includes('water body')) {
      return 'Zero-Shot Text-Conditioned Spatial Region Grounding';
    }
    if (q.includes('what changed') || q.includes('change') || mode === 'BI_TEMPORAL') {
      return 'Bi-Temporal Radiometric Change Detection & Classification';
    }
    return 'Multispectral Land-Cover Understanding & Visual Question Answering';
  }

  private getDispatchedModels(mode: string, q: string): string {
    if (mode === 'OPTICAL_SAR') {
      return 'Sentinel-1 SAR C-band + Sentinel-2 MSI Optical Dual-Sensor Fusion';
    }
    if (mode === 'BI_TEMPORAL') {
      return 'Bi-Temporal Siamese Difference Engine (CD-ViT & NDVI/NDWI Delta)';
    }
    return 'Remote-Sensing Vision-Language Model (RS-VLM Multi-Task ViT)';
  }

  private buildResultForScenario(
    input: AnalysisInput,
    query: string,
    loc: any,
    stages: ExecutionPipelineStage[]
  ): AnalysisResult {
    const q = query.toLowerCase();
    const mode = input.mode;
    const primary = input.images.primary;
    const secondary = input.images.secondary;

    const lat = loc.point.lat || 3.139;
    const lon = loc.point.lon || 101.686;

    // Define polygon footprint
    const polygon = [
      { lat: lat - 0.08, lon: lon - 0.12 },
      { lat: lat - 0.08, lon: lon + 0.12 },
      { lat: lat + 0.08, lon: lon + 0.12 },
      { lat: lat + 0.08, lon: lon - 0.12 },
    ];
    const boundingBox: [number, number, number, number] = [lon - 0.12, lat - 0.08, lon + 0.12, lat + 0.08];

    // SCENARIO A: Optical + SAR Multimodal Analysis
    if (mode === 'OPTICAL_SAR' || (q.includes('optical') && q.includes('sar'))) {
      const spatialEvidence: SpatialEvidenceItem[] = [
        {
          id: 'SE_MM_01',
          type: 'CHANGE_REGION',
          label: 'SAR-Confirmed High Roughness Built-Up Core',
          category: 'URBAN_EXPANSION',
          confidence: 0.94,
          coordinates: polygon,
          boundingBox,
          changeStatus: 'NEW_INCREASED',
          areaSqKm: 142,
          description:
            'Strong double-bounce radar backscatter in SAR (VV/VH) confirms dense structural development despite cloud cover in optical pass.',
          sourceSensor: 'Sentinel-1 SAR C-Band',
          metricDelta: '+28.4% Built-Up',
        },
        {
          id: 'SE_MM_02',
          type: 'POINT',
          label: 'Specular Low-Backscatter Water Reservoir',
          category: 'WATER_CHANGE',
          confidence: 0.96,
          coordinates: [{ lat: lat + 0.02, lon: lon - 0.03 }],
          changeStatus: 'UNCHANGED',
          areaSqKm: 34,
          description:
            'Near-zero radar reflection combined with Optical Green (B03) absorption isolates permanent open water body with high certainty.',
          sourceSensor: 'Sentinel-2 MSI + Sentinel-1 SAR',
          metricDelta: 'Stable Water Surface',
        },
      ];

      const multimodalData: MultimodalComparisonData = {
        opticalSensor: 'Sentinel-2 Multispectral Instrument (MSI)',
        opticalResolution: '10m GSD (13 Spectral Bands)',
        opticalBands: ['B02 (Blue)', 'B03 (Green)', 'B04 (Red)', 'B08 (NIR)', 'B11 (SWIR)'],
        opticalInterpretation:
          'High sensitivity to spectral pigment signatures, chlorophyllic vegetation, and surface water reflectance.',
        sarSensor: 'Sentinel-1A SAR C-Band Radar (5.405 GHz)',
        sarBand: 'Interferometric Wide Swath (IW) VV + VH Polarizations',
        sarResolution: '20m x 22m Ground Resolution',
        sarInterpretation:
          'Microwave dielectric penetration isolates surface roughness, impervious geometric structures, and moisture levels through all weather.',
        jointInsight:
          'Both sensing modalities corroborate the identification of built-up urban corridors through structural double-bounce, while multispectral bands confirm surface water delineation.',
        confidence: 0.94,
      };

      return {
        id: `RES_MM_${Date.now()}`,
        rank: 1,
        siteCode: 'SITE_UPLOAD_MM',
        regionName: loc.locationName,
        country: loc.country,
        biome: 'Tropical Urban-Riparian Biome',
        analysisType: 'MULTIMODAL_ANALYSIS',
        visualizationType: 'MULTIMODAL',
        category: 'URBAN_EXPANSION',
        location: loc.point,
        camera: loc.camera,
        polygon,
        boundingBox,
        metric: {
          name: 'Joint Optical-SAR Roughness & Surface Index',
          beforeValue: 0.38,
          afterValue: 0.72,
          percentageChange: 89.5,
          unit: 'Cross-Modal Score',
          severity: 'HIGH',
        },
        confidence: 0.94,
        satellite: 'Sentinel-1 & Sentinel-2 Constellation',
        sensor: 'MSI Optical + C-SAR Radar',
        modality: 'MULTIMODAL',
        dataStatus: 'PUBLIC_DATA',
        cloudCover: 12.4,
        observationPeriod: {
          beforeDate: input.temporalContext?.beforeDate || '2023-08-10',
          afterDate: input.temporalContext?.afterDate || '2026-06-15',
          beforeLabel: 'Baseline Optical Observation',
          afterLabel: 'Target Multimodal Fusion Pass',
        },
        headline: 'Co-Registered Optical & SAR Analysis Confirms Urban-Water Partitioning',
        evidenceNarrative:
          'Cross-modal fusion demonstrates high structural backscatter in SAR over commercial sectors, with optical reflectance isolating vegetation buffers and water containment basins.',
        primaryDrivers: [
          'High SAR Double-Bounce Reflectivity',
          'Optical SWIR / NIR Vegetation Signatures',
          'Specular Microwave Water Absorption',
        ],
        spectralBands: [
          { band: 'B04', wavelength: '665 nm', name: 'Red', beforeReflectance: 0.095, afterReflectance: 0.185 },
          { band: 'B08', wavelength: '842 nm', name: 'NIR', beforeReflectance: 0.440, afterReflectance: 0.220 },
          { band: 'SAR_VV', wavelength: '5.6 cm', name: 'C-Band VV', beforeReflectance: -14.2, afterReflectance: -6.8 },
          { band: 'SAR_VH', wavelength: '5.6 cm', name: 'C-Band VH', beforeReflectance: -22.5, afterReflectance: -12.1 },
        ],
        areaAffectedSqKm: 176,
        spatialEvidence,
        multimodalData,
        executionPipeline: stages,
      };
    }

    // SCENARIO B: Region Grounding (e.g. "Highlight the water body")
    if (q.includes('water body') || q.includes('highlight') || q.includes('grounding')) {
      const spatialEvidence: SpatialEvidenceItem[] = [
        {
          id: 'SE_GR_01',
          type: 'POLYGON',
          label: 'Grounded Water Body Boundary (NDWI > 0.35)',
          category: 'WATER_CHANGE',
          confidence: 0.96,
          coordinates: polygon,
          boundingBox,
          changeStatus: 'UNCHANGED',
          areaSqKm: 88,
          description:
            'Grounded contiguous water body identified via Normalized Difference Water Index (NDWI) thresholding.',
          metricDelta: 'Delineated Perimeter: 42.6 km',
        },
      ];

      return {
        id: `RES_GR_${Date.now()}`,
        rank: 1,
        siteCode: 'SITE_GROUNDING_01',
        regionName: loc.locationName,
        country: loc.country,
        biome: 'Hydrological Basin',
        analysisType: 'GROUNDING',
        visualizationType: 'GROUNDING',
        category: 'WATER_CHANGE',
        location: loc.point,
        camera: loc.camera,
        polygon,
        boundingBox,
        metric: {
          name: 'Normalized Difference Water Index (NDWI)',
          beforeValue: 0.48,
          afterValue: 0.52,
          percentageChange: 8.3,
          unit: 'Index Value',
          severity: 'MODERATE',
        },
        confidence: 0.96,
        satellite: primary.geospatialInfo.satellitePlatform || 'Sentinel-2',
        sensor: primary.geospatialInfo.sensorType || 'MSI (10m)',
        modality: primary.modality,
        dataStatus: 'PUBLIC_DATA',
        cloudCover: 4.1,
        observationPeriod: {
          beforeDate: primary.acquisitionDate || '2024-05-12',
          afterDate: primary.acquisitionDate || '2024-05-12',
          beforeLabel: 'Target Scene Observation',
          afterLabel: 'Segmented Feature Footprint',
        },
        headline: 'Target Water Body Delineated with 96% Spatial Confidence',
        evidenceNarrative:
          'The requested water feature was localized via deep multi-band absorption gradients. Strong NIR band suppression confirms surface water boundary.',
        primaryDrivers: ['Strong NIR Band Absorption (B08)', 'High Green Band Reflectance (B03)'],
        spectralBands: [
          { band: 'B03', wavelength: '560 nm', name: 'Green', beforeReflectance: 0.22, afterReflectance: 0.22 },
          { band: 'B08', wavelength: '842 nm', name: 'NIR', beforeReflectance: 0.04, afterReflectance: 0.04 },
        ],
        areaAffectedSqKm: 88,
        spatialEvidence,
        executionPipeline: stages,
      };
    }

    // SCENARIO C: Bi-Temporal Change Detection (e.g. "What changed?", "Has built-up area increased?")
    if (mode === 'BI_TEMPORAL' || q.includes('what changed') || q.includes('built-up') || q.includes('vegetation')) {
      const isVegetationLoss = q.includes('vegetation') || q.includes('canopy') || q.includes('forest');
      const category = isVegetationLoss ? 'DEFORESTATION' : 'URBAN_EXPANSION';
      const deltaPercent = isVegetationLoss ? -34.8 : 42.6;
      const headline = isVegetationLoss
        ? 'Significant Vegetation Canopy Reduction Detected'
        : 'Substantial Urban Expansion & Impervious Surface Growth';

      const spatialEvidence: SpatialEvidenceItem[] = [
        {
          id: 'SE_TC_01',
          type: 'CHANGE_REGION',
          label: isVegetationLoss ? 'Active Canopy Clearing Zone' : 'New Impervious Built-Up Sector',
          category,
          confidence: 0.92,
          coordinates: polygon,
          boundingBox,
          changeStatus: isVegetationLoss ? 'REMOVED_DECREASED' : 'NEW_INCREASED',
          areaSqKm: 215,
          description: isVegetationLoss
            ? 'Radiometric shift in B08 (NIR) indicates complete removal of primary canopy across the sector.'
            : 'Expansion of concrete structures, road networks, and logistics facilities confirmed across the baseline epoch.',
          metricDelta: `${deltaPercent > 0 ? '+' : ''}${deltaPercent}%`,
        },
      ];

      const temporalComparison: TemporalComparisonData = {
        beforeDate: input.temporalContext?.beforeDate || '2021-04-18',
        afterDate: input.temporalContext?.afterDate || '2026-06-20',
        beforeMetricValue: isVegetationLoss ? 0.78 : 0.24,
        afterMetricValue: isVegetationLoss ? 0.42 : 0.58,
        percentageDelta: deltaPercent,
        metricName: isVegetationLoss ? 'NDVI Canopy Index' : 'NDBI Built-Up Index',
        changeType: category,
        changeStatus: isVegetationLoss ? 'DECREASED' : 'INCREASED',
        changeRegions: spatialEvidence,
        aiInference: isVegetationLoss
          ? 'Bi-temporal comparison isolates abrupt reduction in near-infrared reflectance consistent with deliberate mechanical clearing.'
          : 'High-contrast spectral shift confirms significant conversion of open terrain into high-density commercial infrastructure.',
        rawEvidenceIndicators: [
          'Pixel-level difference delta exceeds 3.5-sigma threshold',
          'Continuous spatial connectivity in target epoch',
        ],
      };

      return {
        id: `RES_TC_${Date.now()}`,
        rank: 1,
        siteCode: 'SITE_TEMPORAL_01',
        regionName: loc.locationName,
        country: loc.country,
        biome: isVegetationLoss ? 'Tropical Rainforest' : 'Urban Transition Zone',
        analysisType: isVegetationLoss ? 'VEGETATION_CHANGE' : 'URBAN_GROWTH',
        visualizationType: 'CHANGE_DETECTION',
        category,
        location: loc.point,
        camera: loc.camera,
        polygon,
        boundingBox,
        metric: {
          name: isVegetationLoss ? 'NDVI Vegetation Index' : 'NDBI Built-Up Index',
          beforeValue: isVegetationLoss ? 0.78 : 0.24,
          afterValue: isVegetationLoss ? 0.42 : 0.58,
          percentageChange: deltaPercent,
          unit: 'Index Value',
          severity: 'HIGH',
        },
        confidence: 0.92,
        satellite: primary.geospatialInfo.satellitePlatform || 'Sentinel-2',
        sensor: primary.geospatialInfo.sensorType || 'MSI (10m)',
        modality: primary.modality,
        dataStatus: 'PUBLIC_DATA',
        cloudCover: 5.2,
        observationPeriod: {
          beforeDate: input.temporalContext?.beforeDate || '2021-04-18',
          afterDate: input.temporalContext?.afterDate || '2026-06-20',
          beforeLabel: 'Baseline Epoch (T0)',
          afterLabel: 'Target Observation (T1)',
        },
        headline,
        evidenceNarrative: isVegetationLoss
          ? 'Bi-temporal delta confirms 215 km² of dense canopy loss, showing bare soil spectral signatures.'
          : 'Rapid conversion of agricultural and fallow terrain into high-density industrial and residential clusters.',
        primaryDrivers: isVegetationLoss
          ? ['Canopy Removal / Logging', 'Agricultural Encroachment']
          : ['Infrastructure Corridor Expansion', 'Commercial Logistics Development'],
        spectralBands: [
          { band: 'B04', wavelength: '665 nm', name: 'Red', beforeReflectance: 0.065, afterReflectance: 0.175 },
          { band: 'B08', wavelength: '842 nm', name: 'NIR', beforeReflectance: 0.720, afterReflectance: 0.310 },
          { band: 'B11', wavelength: '1610 nm', name: 'SWIR', beforeReflectance: 0.110, afterReflectance: 0.280 },
        ],
        areaAffectedSqKm: 215,
        spatialEvidence,
        temporalComparison,
        executionPipeline: stages,
      };
    }

    // SCENARIO D: Single Image Scene & Land-Cover Understanding
    const spatialEvidence: SpatialEvidenceItem[] = [
      {
        id: 'SE_LC_01',
        type: 'CHANGE_REGION',
        label: 'Dominant Agricultural & Managed Cultivation (46%)',
        category: 'AGRICULTURE',
        confidence: 0.91,
        coordinates: polygon,
        boundingBox,
        changeStatus: 'UNCHANGED',
        areaSqKm: 130,
        description: 'Regular geometric plot partitions exhibiting characteristic seasonal crop signatures.',
        metricDelta: '46% Land Area',
      },
      {
        id: 'SE_LC_02',
        type: 'CHANGE_REGION',
        label: 'Dense Riparian Vegetation & Forest (34%)',
        category: 'VEGETATION_CHANGE',
        confidence: 0.95,
        coordinates: [],
        changeStatus: 'UNCHANGED',
        areaSqKm: 95,
        description: 'Continuous tree canopy concentrated along watercourses and elevated slopes.',
        metricDelta: '34% Land Area',
      },
      {
        id: 'SE_LC_03',
        type: 'POINT',
        label: 'Built-Up Infrastructure & Settlement Clusters (20%)',
        category: 'URBAN_EXPANSION',
        confidence: 0.88,
        coordinates: [{ lat, lon }],
        changeStatus: 'UNCHANGED',
        areaSqKm: 55,
        description: 'Concentrated road networks and residential roof materials.',
        metricDelta: '20% Land Area',
      },
    ];

    return {
      id: `RES_SCENE_${Date.now()}`,
      rank: 1,
      siteCode: 'SITE_SINGLE_SCENE',
      regionName: loc.locationName,
      country: loc.country,
      biome: 'Mixed Agricultural-Vegetation Matrix',
      analysisType: 'LAND_COVER',
      visualizationType: 'SINGLE_IMAGE',
      category: 'VEGETATION_CHANGE',
      location: loc.point,
      camera: loc.camera,
      polygon,
      boundingBox,
      metric: {
        name: 'Land-Cover Diversity & Heterogeneity Index',
        beforeValue: 0.72,
        afterValue: 0.72,
        percentageChange: 0.0,
        unit: 'Shannon Index',
        severity: 'LOW',
      },
      confidence: 0.93,
      satellite: primary.geospatialInfo.satellitePlatform || 'Sentinel-2',
      sensor: primary.geospatialInfo.sensorType || 'MSI (10m)',
      modality: primary.modality,
      dataStatus: 'PUBLIC_DATA',
      cloudCover: 3.5,
      observationPeriod: {
        beforeDate: primary.acquisitionDate || '2024-05-18',
        afterDate: primary.acquisitionDate || '2024-05-18',
        beforeLabel: 'Scene Acquisition',
        afterLabel: 'Land-Cover Segmentation',
      },
      headline: 'Multi-Class Land-Cover Partitioning & Biome Classification',
      evidenceNarrative:
        'The analyzed satellite scene comprises 46% active agricultural plots, 34% natural vegetation canopy, and 20% built-up structural settlements.',
      primaryDrivers: ['Agricultural Crop Geometry', 'Riparian Forest Canopy', 'Linear Infrastructure Networks'],
      spectralBands: [
        { band: 'B02', wavelength: '490 nm', name: 'Blue', beforeReflectance: 0.075, afterReflectance: 0.075 },
        { band: 'B03', wavelength: '560 nm', name: 'Green', beforeReflectance: 0.125, afterReflectance: 0.125 },
        { band: 'B04', wavelength: '665 nm', name: 'Red', beforeReflectance: 0.090, afterReflectance: 0.090 },
        { band: 'B08', wavelength: '842 nm', name: 'NIR', beforeReflectance: 0.540, afterReflectance: 0.540 },
      ],
      areaAffectedSqKm: 280,
      spatialEvidence,
      executionPipeline: stages,
    };
  }
}
