# SatQuery AI — Project Context

## Project Vision
**SatQuery AI** is an AI-powered Earth Observation (EO) intelligence platform. Users interact with multi-spectral satellite imagery and geospatial data using natural language (e.g. *"What changed between these two dates?"*, *"Highlight the water body"*, *"Identify built-up and water-covered regions"*).

The platform operates as an **autonomous geospatial intelligence analyst**, capable of:
1. Ingesting user-uploaded satellite imagery (GeoTIFF, COG, standard rasters).
2. Routing requests through an **observable agentic pipeline** with specialized remote-sensing tools.
3. Performing deterministic multi-spectral band mathematics (NDVI, NDWI, NDBI) and radar backscatter analysis (Sentinel-1 SAR VV/VH).
4. Generating structured spatial evidence (polygons, bounding boxes, severity deltas) clamped to a 3D Cesium Earth globe.

---

## Current Architecture & Implementation State (Phase 3 Complete)

### 1. Ingestion & Compatibility Subsystem
- **`ImageInspector` (`src/services/imageInspector.ts`)**: In-browser inspection of raw files. Parses header metadata, dimensions, formats (`GEOTIFF`, `COG`, `NETCDF`, `PNG`, `JPEG`), sensor modalities (`OPTICAL`, `SAR`), and acquisition dates. Runs automated compatibility validation checks across 5 criteria (Format, Dimensions, Temporal separation, Modality pairing, Spatial reference) with clear statuses (`COMPATIBLE`, `LIKELY_COMPATIBLE`, `COMPATIBILITY_UNKNOWN`, `NOT_COMPATIBLE`).
- **`LocationContextService` (`src/services/locationContextService.ts`)**: Resolves geographic bounding boxes, centroids, and Cesium camera placement vectors from embedded EPSG tags or manual user input.
- **`ManualLocationModal` (`src/components/upload/ManualLocationModal.tsx`)**: Allows linking non-georeferenced imagery to custom coordinates on Earth.

### 2. Specialist Tool Catalog & Agentic Orchestration
- **`ToolRegistry` (`src/services/tools/toolRegistry.ts`)**: Catalog of 6 modular remote-sensing tools:
  - `RS_VQA_CLASSIFIER`: Single image scene understanding & visual question answering.
  - `RS_REGION_GROUNDING_SEGMENTER`: Text-guided zero-shot spatial bounding & polygon extraction.
  - `BI_TEMPORAL_CHANGE_DIFF`: Bi-temporal change detection & radiometric delta computation.
  - `OPTICAL_SAR_FUSION_CORE`: Cross-modal Optical + SAR backscatter fusion.
  - `GEOTIFF_METADATA_PARSER`: Geospatial tag parsing & CRS verification.
  - `SPATIAL_EVIDENCE_EXTRACTOR`: Polygon delineation & severity metrics.
- **`SatQueryOrchestrator` (`src/services/satQueryOrchestrator.ts`)**:
  - Classifies user intent into target tasks (`LAND_COVER_ANALYSIS`, `REGION_GROUNDING`, `VEGETATION_CHANGE`, `URBAN_CHANGE`, `FLOOD_ANALYSIS`, `MULTIMODAL_ANALYSIS`, `VISUAL_QUESTION_ANSWERING`).
  - Assembles an observable 8-stage execution plan (`WorkflowExecutionPlan`).
  - Dispatches execution to the active `AnalysisProvider`.

### 3. Analysis Provider Abstraction Layer
- **`AnalysisProvider` (`src/services/providers/analysisProvider.ts`)**: Common contract decoupling the UI/Orchestrator from backend implementations.
- **`MockAnalysisProvider` (`src/services/providers/mockAnalysisProvider.ts`)**: Built-in deterministic remote-sensing AI engine for standalone client execution.
- **`ColabMLAnalysisProvider` (`src/services/providers/colabMLAnalysisProvider.ts`)**: Prepared adapter for remote Google Colab / Cloud GPU PyTorch backends (`POST /api/v1/analyze`).

### 4. Interactive Visualization & UI Layer
- **`LandingPage` (`src/components/landing/LandingPage.tsx`)**: Cinematic, NASA-inspired scroll-driven storytelling landing experience acting as a seamless bridge into the Cesium 3D Mission Control application.
  - **`CinematicScrollCanvas.tsx`**: Persistent Three.js WebGL canvas featuring photorealistic procedural NASA Blue Marble Earth textures, ocean specular sunlight reflections, dual-layer Rayleigh atmospheric limb scattering shaders, starfield, and an orbiting NASA-grade remote-sensing satellite with solar arrays and active ground-scanning swath cone.
  - **`ScrollStoryOverlay.tsx`**: 5-stage scroll-driven storytelling overlay (`SPACE` → `GLOBAL OBSERVATION` → `REMOTE SENSING` → `REGIONAL FOCUS` → `CHANGE DELINEATION & AI INTELLIGENCE`).
  - **`ProblemSolutionStory.tsx`**: NASA/Apple-style clean product narrative contrasting legacy GIS friction against SatQuery's natural-language agentic execution, complete with an interactive planetary query box.
  - **`MinimalHeader.tsx`**: Streamlined branding with clean telemetry and "Launch App" action (no distracting jump links).
  - **`CinematicCTA.tsx`**: Minimalist NASA-grade call-to-action inviting users into 3D Cesium Mission Control.
- **`UploadWizardModal` (`src/components/upload/UploadWizardModal.tsx`)**: 3-mode upload wizard (Single Scene, Temporal Comparison, Optical+SAR) with live inspection tags, validation reports, and 5 benchmark presets.
- **`ActiveInputBanner` (`src/components/upload/ActiveInputBanner.tsx`)**: Persistent context banner showing active ingested imagery, sensor tags, and fast inspection shortcuts.
- **`InteractiveImageCanvas` (`src/components/upload/InteractiveImageCanvas.tsx`)**: Zoom & pan high-resolution canvas with layer switcher (`[Original]`, `[Spatial Evidence]`, `[Class Mask]`), pixel HUD, and polygon evidence list.
- **`CesiumGlobeViewer` (`src/components/globe/CesiumGlobeViewer.tsx`)**: 3D globe rendering georeferenced bounding footprints, camera flights, and telemetry.
- **`TemporalComparisonViewer` & `MultimodalViewer`**: Interactive before/after split sliders and dual-modality inspection viewers.

---

## Supported Input Modes & Workflows

| Input Mode | Primary Use Cases | Dispatched Tools | Key Output Components |
|---|---|---|---|
| `SINGLE_IMAGE` | Land cover classification, scene description, object grounding | `RS_VQA_CLASSIFIER`, `RS_REGION_GROUNDING_SEGMENTER` | Scene breakdown, Grounded bounding boxes, Spectral stats |
| `BI_TEMPORAL` | Urban expansion, deforestation, flood inundation, canopy loss | `BI_TEMPORAL_CHANGE_DIFF`, `SPATIAL_EVIDENCE_EXTRACTOR` | `TemporalComparisonViewer`, Delta metric %, Polygon masks |
| `OPTICAL_SAR` | Cloud-penetrating mapping, surface roughness, dielectric moisture | `OPTICAL_SAR_FUSION_CORE`, `SPATIAL_EVIDENCE_EXTRACTOR` | `MultimodalViewer`, SAR VV/VH curves, Joint confidence |
