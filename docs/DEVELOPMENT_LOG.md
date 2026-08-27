# SatQuery AI — Development Log

## 2026-08-23 — Master Architecture & Persistent Project Context System

### Added
- Created complete `/docs` persistent project memory system (`PROJECT_CONTEXT.md`, `ARCHITECTURE.md`, `DECISIONS.md`, `API_CONTRACTS.md`, `DATABASE_SCHEMA.md`, `AI_AGENT_CONTEXT.md`, `DATA_PIPELINE.md`, `MVP_SCOPE.md`, `KNOWN_ISSUES.md`, `FUTURE_ROADMAP.md`, `DEVELOPMENT_LOG.md`).
- Defined complete System Architecture, AI Agent pipeline, Scientific Data processing workflows, and 3D Globe camera controller specifications.
- Updated `metadata.json` with descriptive application title and summary.

### Architectural Decisions
- **ADR-001**: Use CesiumJS / 3D Globe as the primary user experience canvas for continuous spherical flight and polygon highlighting.
- **ADR-002**: Clean separation between Application Orchestrator, Scientific Remote-Sensing Engine, and Visualization Controller.
- **ADR-003**: Evidence-First calculation rule — LLM never hallucinates quantitative numbers; indices are calculated deterministically.
- **ADR-004**: Decoupled `SatelliteDataProvider` interface with initial curated mock provider and live STAC readiness.
- **ADR-005**: High-legibility, dark mission control interface designed for geospatial operations.

---

## 2026-08-23 — Implementation of Multi-Service Architecture & Earth Controller Abstractions

### Objective
Execute Phase 1 & Phase 2 of the architectural refactoring: decompose monolithic prototype into dedicated microservices (`backend/spring-boot`, `services/nlp-service`, `services/eo-analysis-service`, `services/data-service`, `database/`, `docker/`), and extract robust Earth navigation abstractions (`EarthCameraController`, `ResultTourEngine`, `LocationResolver`, `QueryApiClient`).

### Changes Made
1. **Container & Microservice Scaffolding**:
   - Created root `docker-compose.yml` orchestrating `frontend` (3000), `spring-boot-backend` (8080), `nlp-service` (8001), `data-service` (8002), `eo-analysis-service` (8003), and `postgres/postgis` (5432).
   - Created individual Dockerfiles in `docker/` (`Dockerfile.frontend`, `Dockerfile.spring-boot`, `Dockerfile.nlp`, `Dockerfile.data-service`, `Dockerfile.eo-analysis`, `nginx.conf`).
2. **Spring Boot Orchestrator & API Gateway (`backend/spring-boot/`)**:
   - Created Maven project configuration (`pom.xml`, Java 21, Spring Boot 3.2.3, Actuator, Web).
   - Created application configuration (`application.yml`) with microservice routing endpoints.
   - Created `SatQueryApplication.java`, `QueryController.java` (`POST /api/v1/query`), `QueryOrchestrationService.java`, and DTO records.
3. **NLP / AI Service (`services/nlp-service/`)**:
   - Created FastAPI application (`app/main.py`) exposing `POST /api/v1/nlp/parse`.
   - Created Pydantic schemas for `StructuredQueryResponse`, `IntentType`, `SpatialScope`, `TemporalScope`, and `Threshold`.
   - Created model-agnostic `LLMProvider` abstraction with `RuleBasedProvider` default and factory extensible to Gemini/OpenAI.
4. **Data Service & PostGIS Storage (`services/data-service/`, `database/`)**:
   - Created FastAPI application (`app/main.py`) exposing `POST /api/v1/spatial/search`.
   - Created PostGIS SQL migration (`database/migrations/001_initial_schema.sql`) and seed data (`database/seeds/001_initial_regions.sql`).
   - Implemented `SpatialRepository` managing multi-temporal satellite records.
5. **Earth Observation Analysis Service (`services/eo-analysis-service/`)**:
   - Created FastAPI application (`app/main.py`) exposing `POST /api/v1/eo/analyze`.
   - Created `SpectralCalculator` computing multi-spectral mathematical band formulas (NDVI, NDWI, NDBI, NBR) and generating scientific evidence narratives.
6. **Frontend Earth Controller & User Interaction Abstractions**:
   - Created `EarthCameraController.ts` for spherical flight interpolation, bounding-box framing, and coordinate transforms.
   - Created `ResultTourEngine.ts` managing sequential waypoint flights with automatic timer resets and step callbacks.
   - Implemented non-combative user gesture override detection: manual orbital drag on the 3D Earth immediately pauses the autonomous tour.
   - Created `LocationResolver.ts` provider-agnostic place-resolution abstraction.
   - Created `QueryApiClient.ts` proxying queries to the Spring Boot gateway with graceful fallback.

---

## 2026-08-23 — Live 3D Earth Navigation & Natural Language Spatial Interaction Implementation

### Objective
Completely connect the natural-language query engine, EarthCameraController, and ResultTourEngine to the live user interface, making the 3D Earth the primary output of the product. Replace the 3-column static dashboard with an interactive, cinematic, AI-driven Earth exploration system.

### Key Changes Made
1. **Full-Screen 3D Earth Centerpiece (`src/App.tsx`, `src/components/globe/GlobeViewer.tsx`)**:
   - Smashed the rigid 3-column layout. The 3D Earth now fills 100% of the viewport.
   - Interactive spherical mesh rendering: Added 3D spherical curved polygon surfaces matching the globe curvature (`R = 2.025`) and thick glowing boundary lines for active anomaly regions.
   - Active result is highlighted with thermal glowing orange/cyan pulsing shaders, while all other identified candidate regions appear as glowing beacon pins with interactive raycasting hover tooltips.
   - Raycasting on 3D Globe: Clicking on any region node or polygon directly selects that result, centers the camera, and pauses the tour.

2. **Prominent Floating Natural-Language Query Bar (`src/components/query/FloatingQueryBar.tsx`)**:
   - Added a prominent floating command bar centered over the Earth canvas.
   - Accepts open natural-language questions (e.g. *"Show me areas where vegetation decreased"*, *"Show me areas where vegetation decreased in India"*, *"Show me areas where water bodies expanded"*).
   - Instant query execution with secondary suggested query pills.

3. **Autonomous AI Investigation Pipeline HUD (`src/components/query/InvestigationStatusHUD.tsx`)**:
   - When a query is submitted, displays real-time state progression:
     - ◉ Understanding Query Intent
     - ◉ Resolving Geographic Scope
     - ◉ Searching Earth Observations
     - ◉ Computing Spectral Change Anomaly
     - ◉ Preparing 3D Earth Navigation
   - As each stage finishes, the camera initiates flight to Result #1.

4. **Smooth Spherical Camera Flight & Dynamic Zooming**:
   - Connected `EarthCameraController` and camera orientation interpolators.
   - Camera smoothly glides around the globe with spherical shortest-arc geometry and cubic easing.
   - Dynamic camera altitude calculation: Zooms in closer for localized targets (e.g. Attica, Sundarbans) and zooms out for massive biomes (e.g. Amazon Basin).
   - **Real Live Telemetry**: Latitude, Longitude, and Altitude in km update on every single frame from actual camera orientation (no static fake values).

5. **Spatial Floating Result HUD (`src/components/results/SpatialResultHUD.tsx`)**:
   - Displays a compact, floating glassmorphic evidence card directly over the Earth.
   - Shows site code, rank (`RESULT 1 OF 7`), region name, country, big bold metric delta (`-34.2% NDVI`), baseline vs target values, sensor provenance (`Sentinel-2 L2A`, `94% Confidence`), and primary drivers.

6. **Visualization Mode & Layer Controls (`src/components/globe/GlobeLayerControls.tsx`)**:
   - Interactive `[ BEFORE | DIFFERENCE | AFTER ]` mode switcher: switches the polygon spectral shader between baseline green, anomaly difference glow, and degraded terrain.
   - Dynamic opacity slider (0% to 100%) allows users to inspect the underlying topography.

7. **ResultTourEngine & Non-Combative User Control**:
   - Connected `TourControls.tsx` for `[ ◀ PREVIOUS ]`, `[ ❚❚ PAUSE / ▶ RESUME ]`, and `[ NEXT ▶ ]`.
   - **User Overrides AI**: Dragging, panning, or zooming the globe immediately pauses the tour and enters `USER EXPLORATION MODE`. The camera never fights the user.

8. **Slide-Out Evidence Drawer (`src/components/results/EvidenceDrawer.tsx`)**:
   - Slide-out drawer on the right side provides deep multi-spectral band reflectance graphs, scientific assessments, and provenance without permanently shrinking the Earth.

### Verification & Testing
- Query 1 Tested: `"Show me areas where vegetation decreased."` → Identified 7 global regions (Amazon Basin Brazil, Central Indian Forest, Sundarbans Delta India, Western Ghats India, Gran Chaco Argentina, Madagascar Rainforest, San Joaquin Valley USA). Camera flies to Result #1, highlights polygon, and tours sequentially.
- Query 2 Tested: `"Show me areas where vegetation decreased in India."` → Filtered to 3 Indian biomes (Central India Forest Corridor, Sundarbans Biosphere Delta, Western Ghats Rainforest). Camera glides across India.
- Query 3 Tested: `"Show me areas where water bodies expanded."` → Identified South Aral Sea Basin and Lake Chad Basin. Switch to NDWI water index and cyan alert shaders.
- Query 4 Tested: `"Analyze wildfire burn scars in the Mediterranean."` → Identified Attica Peninsula Greece.
- User Interaction Test: Manual globe dragging pauses tour; clicking Resume resumes tour smoothly.
- `lint_applet` passed (`tsc --noEmit` clean).
- `compile_applet` passed (`vite build` production compilation clean).

### Current Status
All 14 steps of the primary user experience loop are fully connected, operational, and verified.

---

## 2026-08-27 — Phase 3: Intelligent Image Upload & Agentic Analysis Workflow

### Objective
Upgrade SatQuery AI from a query-only platform to a comprehensive remote-sensing intelligence system capable of ingesting user imagery across 3 input modes (`SINGLE_IMAGE`, `BI_TEMPORAL`, `OPTICAL_SAR`), validating raster compatibility, classifying query intent, orchestrating specialist tools, and producing structured spatial evidence and multi-layer visual canvases.

### Key Changes Made
1. **Data Models & Contracts (`src/types/upload.ts`)**:
   - Defined `UploadedImage`, `AnalysisInput`, `ValidationReport`, `ValidationCheck`, `SpecialistToolDefinition`, and `WorkflowExecutionPlan`.
2. **Automated Raster Inspection & Validation (`src/services/imageInspector.ts`)**:
   - Parses file headers, raster dimensions, format tags, and acquisition timestamps.
   - Evaluates sensor modality pairings, spatial resolution differences, and temporal separation.
   - Computes explicit compatibility statuses (`COMPATIBLE`, `LIKELY_COMPATIBLE`, `COMPATIBILITY_UNKNOWN`, `NOT_COMPATIBLE`).
3. **Geospatial Reference & Camera Positioning (`src/services/locationContextService.ts`)**:
   - Extracts geographic centroids and bounding boxes from metadata.
   - Computes smooth Cesium camera flight coordinates for uploaded scenes.
4. **Specialist Model & Tool Catalog (`src/services/tools/toolRegistry.ts`)**:
   - Implemented registry of 6 modular remote-sensing tools (`RS_VQA_CLASSIFIER`, `RS_REGION_GROUNDING_SEGMENTER`, `BI_TEMPORAL_CHANGE_DIFF`, `OPTICAL_SAR_FUSION_CORE`, `GEOTIFF_METADATA_PARSER`, `SPATIAL_EVIDENCE_EXTRACTOR`).
5. **Agentic Orchestrator (`src/services/satQueryOrchestrator.ts`)**:
   - Classifies query intent and plans 8-stage execution workflows (`WorkflowExecutionPlan`).
   - Dispatches execution to active analysis providers with real-time stage progress callbacks.
6. **Extensible Analysis Provider Abstraction (`src/services/providers/`)**:
   - `AnalysisProvider` interface.
   - `MockAnalysisProvider`: Deterministic client-side remote-sensing reasoning across all 3 modes and scenarios.
   - `ColabMLAnalysisProvider`: Prepared adapter for connecting to external Google Colab / GPU PyTorch ML backends.
7. **Interactive Upload Wizard (`src/components/upload/UploadWizardModal.tsx`)**:
   - 3 mode cards with descriptive guidelines.
   - Dual dropzone slots with live file inspection tags.
   - 5 benchmark presets for immediate evaluation.
   - Interactive prompt input with recommended queries.
8. **Active Input Context Banner (`src/components/upload/ActiveInputBanner.tsx`)**:
   - Persistent banner docked below the header showing current input thumbnails, sensor modalities, and fast shortcuts.
9. **Interactive Canvas & Pixel Inspector (`src/components/upload/InteractiveImageCanvas.tsx`)**:
   - High-resolution zoom/pan canvas with coordinate HUD.
   - Layer toggling: `[Original]`, `[Spatial Evidence]`, `[Class Mask]`.
   - Side panel with itemized polygonal evidence items and area calculations.
10. **Manual Location Assignment Modal (`src/components/upload/ManualLocationModal.tsx`)**:
    - Grounds standard PNG/JPEG rasters onto the 3D globe.

### Verification & Testing
- Mode 1 Verified: Single Scene VQA & Land-Cover understanding.
- Mode 2 Verified: Text-guided spatial region grounding (Water Body segmentation).
- Mode 3 Verified: Bi-temporal urban expansion & canopy loss detection with `TemporalComparisonViewer`.
- Mode 4 Verified: Optical + SAR multimodal fusion with `MultimodalViewer`.
- In-browser file inspection and manual coordinate overrides verified.
- `compile_applet` passed (`vite build` production build completed cleanly).

---

## 2026-08-27 — Cinematic Scroll-Driven Landing Page Refactor: NASA-Grade Earth Storytelling

### Objective
Complete overhaul of the SatQuery AI landing page to eliminate generic SaaS UI tropes (excessive pills, floating cards with glowing drop-shadows, redundant section jump buttons, repetitive buzzwords) and implement a NASA/Apple-inspired cinematic, scroll-driven storytelling experience.

### What Was Removed
- **Redundant Header Navigation**: Removed buttons that jumped directly to distinct sections. Replaced with a minimal, elegant header (`MinimalHeader.tsx`) featuring only the SatQuery AI logo, orbital status telemetry, and a clean "Launch App" CTA.
- **Generic SaaS Card Grids & Pills**: Removed `Hero.tsx`, `ProblemSection.tsx`, `AgentWorkflow.tsx`, `EarthDemo.tsx`, `UseCases.tsx`, `FutureVision.tsx`, `LandingNav.tsx`, and `FinalCTA.tsx`.
- **Arbitrary Glowing Gradients & Visual Slop**: Stripped artificial glassmorphism and multi-color glow elements in favor of high-contrast, mathematically grounded typography, scientific WGS-84/EPSG coordinates, and authentic space-tech aesthetics.

### What Was Created & Refactored
1. **Persistent Three.js 3D Canvas (`CinematicScrollCanvas.tsx`)**:
   - Built a single persistent Three.js WebGL canvas pinned across the entire scroll sequence.
   - Generated procedural, high-resolution NASA Blue Marble Earth textures (`realisticEarthTextures.ts`) featuring natural continental biomes (Amazon rainforest greens, Saharan/Gobi ochre deserts, mountain ridges, polar ice sheets) and deep bathymetric ocean blue.
   - Added ocean specular mapping for sunlight reflection, dual-layer Rayleigh atmospheric limb scattering shaders, and rotating cloud layers.
   - Realistic satellite with gold MLI thermal blanket body, dual photovoltaic solar panel wings, optical Earth-observation lens, SAR radar dish, and an animated scanning swath cone touching the Earth's surface.
   - Target change polygon and coordinate reticle dynamically mapped at Mato Grosso, Amazon Basin (`-10.83° S, -55.86° W`).

2. **5-Stage Scroll Storytelling Flow (`ScrollStoryOverlay.tsx`)**:
   - `0% - 15% (SPACE)`: Distant Earth in space revealing *"SATQUERY AI — Turn satellite imagery into answers."*
   - `20% - 35% (GLOBAL OBSERVATION)`: Camera glides forward, Earth rotates into orbital trajectory framing 700+ active Earth-observing satellites.
   - `40% - 55% (REMOTE SENSING)`: Camera approaches closer; satellite activates scanning beam demonstrating optical multispectral and SAR radar fusion.
   - `60% - 74% (REGIONAL FOCUS)`: Precision lock onto Mato Grosso, Amazon Basin coordinates (`-10.83° S, -55.86° W`).
   - `80% - 100% (CHANGE DELINEATION & AI INTELLIGENCE)`: Surface change polygon activates with analytical telemetry matrix (`-18.4% Canopy Delta`, `1,248 ha`, `94% Confidence`).

3. **Problem → Solution Product Story (`ProblemSolutionStory.tsx`)**:
   - Clean comparison of legacy GIS friction (manual tile discovery, band algebra, NetCDF reprojection) vs. SatQuery's natural-language agentic execution.
   - 4-step workflow breakdown (`PARSE` → `DISPATCH` → `NAVIGATE` → `QUANTIFY`).
   - Interactive planetary query box with benchmark chips triggering live 3D Mission Control dispatch.

4. **Cinematic Closing & Navigation Bridge (`CinematicCTA.tsx`, `LandingPage.tsx`)**:
   - Minimalist NASA-grade call-to-action inviting users into 3D Cesium Mission Control.
   - Non-destructive integration with all existing Phase 1, Phase 2, and Phase 3 capabilities.

### Verification & Testing
- `lint_applet` passed (`tsc --noEmit` clean with zero errors).
- `compile_applet` passed (`vite build` production build completed cleanly).


