/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Specialist Model & Tool Registry
 * Maintains the catalog of agentic remote-sensing tools, supported tasks,
 * readiness statuses, and backend execution dispatchers.
 */

import { SpecialistToolDefinition, InputMode, ToolStatus } from '../../types/upload';

export class ToolRegistry {
  private static tools: SpecialistToolDefinition[] = [
    {
      id: 'tool_single_image_vqa',
      name: 'Remote Sensing VQA & Scene Understanding',
      code: 'RS_VQA_CLASSIFIER',
      category: 'VISION_LANGUAGE',
      supportedInputs: ['SINGLE_IMAGE'],
      supportedTasks: [
        'SINGLE_IMAGE_ANALYSIS',
        'VISUAL_QUESTION_ANSWERING',
        'SCENE_DESCRIPTION',
        'LAND_COVER_ANALYSIS',
        'OBJECT_ANALYSIS',
      ],
      status: 'READY_FOR_BACKEND',
      statusDescription: 'Ready for PyTorch ViT / Gemini 2.5 Flash Vision backend adapter.',
      backendProvider: 'COLAB_PYTORCH',
      description:
        'Analyzes single optical or SAR rasters to interpret surface biomes, land-cover classes, structures, and answer complex visual queries.',
    },
    {
      id: 'tool_region_grounding',
      name: 'Text-Guided Spatial Region Grounding',
      code: 'RS_REGION_GROUNDING_SEGMENTER',
      category: 'SPATIAL_INDEX',
      supportedInputs: ['SINGLE_IMAGE', 'BI_TEMPORAL'],
      supportedTasks: [
        'REGION_GROUNDING',
        'SPATIAL_DELINEATION',
        'WATER_GROUNDING',
        'STRUCTURE_BOUNDING',
      ],
      status: 'READY_FOR_BACKEND',
      statusDescription: 'Supports zero-shot bounding-box and polygon mask segmentation.',
      backendProvider: 'COLAB_PYTORCH',
      description:
        'Localizes and extracts polygonal bounding coordinates corresponding to semantic terms in the user prompt (e.g. "the water body", "forest perimeter").',
    },
    {
      id: 'tool_change_detection',
      name: 'Bi-Temporal Change & Radiometric Delta Engine',
      code: 'BI_TEMPORAL_CHANGE_DIFF',
      category: 'CHANGE_DETECTION',
      supportedInputs: ['BI_TEMPORAL'],
      supportedTasks: [
        'CHANGE_DETECTION',
        'CHANGE_DESCRIPTION',
        'CHANGE_VQA',
        'URBAN_CHANGE',
        'VEGETATION_CHANGE',
        'WATER_CHANGE',
        'FLOOD_ANALYSIS',
      ],
      status: 'DEMO_MODE',
      statusDescription: 'Active deterministic delta engine with full temporal comparison viewer.',
      backendProvider: 'CLIENT_DEMO_ENGINE',
      description:
        'Calculates pixel-level difference masks between baseline T0 and target T1 observations, isolating canopy loss, urban build-up, and flood extents.',
    },
    {
      id: 'tool_optical_sar_fusion',
      name: 'Cross-Modal Optical + SAR Fusion Engine',
      code: 'OPTICAL_SAR_FUSION_CORE',
      category: 'FUSION',
      supportedInputs: ['OPTICAL_SAR'],
      supportedTasks: [
        'MULTIMODAL_ANALYSIS',
        'RADAR_SURFACE_ROUGHNESS',
        'DIELECTRIC_MOISTURE_EXTRACTION',
        'ALL_WEATHER_MAPPING',
      ],
      status: 'READY_FOR_BACKEND',
      statusDescription: 'Prepared for dual-encoder optical & SAR backscatter joint embeddings.',
      backendProvider: 'COLAB_PYTORCH',
      description:
        'Synthesizes multi-spectral optical reflectance with Sentinel-1 SAR C-band radar backscatter to isolate physical surface roughness and penetrate clouds.',
    },
    {
      id: 'tool_metadata_inspector',
      name: 'Geospatial Metadata & Projection Tag Inspector',
      code: 'GEOTIFF_METADATA_PARSER',
      category: 'GEODETIC',
      supportedInputs: ['SINGLE_IMAGE', 'BI_TEMPORAL', 'OPTICAL_SAR'],
      supportedTasks: ['METADATA_EXTRACTION', 'COORDINATE_SYSTEM_VERIFY', 'CRS_TRANSFORMATION'],
      status: 'CONNECTED',
      statusDescription: 'In-browser raster header inspection and WGS-84 coordinate resolution.',
      backendProvider: 'GEOSPATIAL_INDEX',
      description:
        'Parses embedded raster tags, validates EPSG projections, and aligns observations with global 3D Earth ellipsoid coordinates.',
    },
    {
      id: 'tool_spatial_evidence',
      name: 'Spatial Evidence & Annotation Delineator',
      code: 'SPATIAL_EVIDENCE_EXTRACTOR',
      category: 'SPATIAL_INDEX',
      supportedInputs: ['SINGLE_IMAGE', 'BI_TEMPORAL', 'OPTICAL_SAR'],
      supportedTasks: ['SPATIAL_EVIDENCE_EXTRACTION', 'HEATMAP_GENERATION', 'SEVERITY_SCORING'],
      status: 'CONNECTED',
      statusDescription: 'Produces polygon hierarchies and Cesium-clamped overlay geometry.',
      backendProvider: 'GEOSPATIAL_INDEX',
      description:
        'Transforms raw pixel anomalies into structured spatial evidence annotations, bounding boxes, and severity confidence metrics.',
    },
  ];

  public static getAllTools(): SpecialistToolDefinition[] {
    return [...this.tools];
  }

  public static getToolById(id: string): SpecialistToolDefinition | undefined {
    return this.tools.find((t) => t.id === id);
  }

  public static getToolsForInputMode(mode: InputMode): SpecialistToolDefinition[] {
    return this.tools.filter((t) => t.supportedInputs.includes(mode));
  }

  public static selectToolsForTask(
    task: string,
    mode: InputMode
  ): SpecialistToolDefinition[] {
    const matched = this.tools.filter(
      (t) => t.supportedInputs.includes(mode) && t.supportedTasks.includes(task)
    );

    // Always include metadata parser and spatial evidence delineator
    const metaTool = this.getToolById('tool_metadata_inspector');
    const spatialTool = this.getToolById('tool_spatial_evidence');

    const result = [...matched];
    if (metaTool && !result.some((t) => t.id === metaTool.id)) result.unshift(metaTool);
    if (spatialTool && !result.some((t) => t.id === spatialTool.id)) result.push(spatialTool);

    return result;
  }
}
