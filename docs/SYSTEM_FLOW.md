# SatQuery AI — System & Execution Flows

This document details the end-to-end data, execution, and lifecycle flows across the SatQuery AI system architecture.

---

## 1. Primary Request & Analysis Pipeline Flow

The core lifecycle of an Earth Observation query from natural language submission to 3D geospatial rendering and evidence presentation:

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant FE as React Frontend (Vite)
    participant GW as Spring Boot Gateway (Port 8080)
    participant NLP as Python NLP Service (Port 8001)
    participant DATA as Python Data Service (Port 8002)
    participant EO as Python EO Analysis (Port 8003)
    participant DB as PostGIS 16 (Port 5432)
    participant Cesium as CesiumJS 3D Globe

    User->>FE: Submits natural language query (e.g. "Identify Amazon canopy loss > 15%")
    FE->>FE: Set QueryExecutionState = PARSING
    FE->>GW: POST /api/v1/query { query: string }
    
    alt Standalone Container Network Available
        GW->>NLP: POST /api/v1/nlp/parse { raw_query: string }
        NLP->>NLP: RuleBased/Gemini NLU entity extraction
        NLP-->>GW: Return StructuredQuery (intent, metric, bbox, threshold)
        
        GW->>DATA: POST /api/v1/spatial/search { intent, metric, spatial_scope_name }
        DATA->>DB: Query spatial observations & polygons (PostGIS / Memory catalog)
        DB-->>DATA: Return matching scene observations[]
        DATA-->>GW: Return ObservationRecord[]
        
        GW->>EO: POST /api/v1/eo/analyze { metric, intent, direction, observations }
        EO->>EO: Multi-spectral band arithmetic (NDVI/NDWI/NDBI/NBR)
        EO->>EO: Severity scoring & scientific evidence generation
        EO-->>GW: Return AnalyzedRegionResult[] (sorted by severity)
        
        GW-->>FE: Return 200 OK (queryId, structuredQuery, results[], visualization)
    else Gateway or Microservices Unreachable (Client-Side Fallback)
        FE->>FE: QueryApiClient catches network error
        FE->>FE: In-memory QueryEngine executes client-side fallback
        FE->>FE: Synthesize observation registry data with Spectral math
    end

    FE->>FE: Set QueryExecutionState = COMPLETED
    FE->>Cesium: Initialize Camera Tour to Critical Hotspots
    Cesium-->>User: Smooth 3D flight to coordinates & render GeoJSON boundaries
    FE-->>User: Display Spectral Delta Cards, Evidence Narratives, & Telemetry
```

---

## 2. Image Ingestion & Multi-Modal Raster Inspection Flow

SatQuery AI supports direct user imagery uploads (single scene, bi-temporal baseline/resurvey, or optical + SAR fusion):

```mermaid
flowchart TD
    A[User Drag & Drop Image / GeoTIFF / PNG / JPG] --> B[UploadWizardModal]
    B --> C{Select Ingestion Mode}
    C -->|Single Scene| D1[Single Image Inspector]
    C -->|Bi-Temporal| D2[Before & After Comparison Inspector]
    C -->|Optical + SAR| D3[SAR + Optical Fusion Inspector]
    
    D1 & D2 & D3 --> E[ImageInspector Service]
    E --> F[Client-side Metadata Extraction]
    F -->|Extract| G1[Format, Dimensions, Channels]
    F -->|Detect| G2[CRS / GeoTIFF Georeference Tags]
    F -->|Compute| G3[Histogram & Dynamic Range]
    
    G1 & G2 & G3 --> H[InteractiveImageCanvas]
    H --> I[2D Canvas Zoom / Pan / Coordinate Inspector]
    H --> J[Client-side RGB/False-Color Band Toggle]
    H --> K[SatQueryOrchestrator Dispatches to AnalysisProvider]
    
    K --> L{Analysis Provider Selection}
    L -->|Built-in Demo| M1[MockAnalysisProvider]
    L -->|GPU Server Configured| M2[ColabMLAnalysisProvider / Cloud Run]
    
    M1 & M2 --> N[Generate Findings, Spectral Curves & Spatial Overlays]
    N --> O[Render in Mission Control UI]
```

---

## 3. Microservice Orchestration Architecture

```mermaid
graph LR
    subgraph Client [Browser Runtime]
        UI[Mission Control UI]
        QClient[QueryApiClient]
        FallbackEngine[In-Memory QueryEngine]
    end

    subgraph Gateway [Spring Boot Gateway :8080]
        Controller[QueryController]
        Orchestrator[QueryOrchestrationService]
    end

    subgraph Microservices [Python FastAPI Microservices]
        NLP[NLP Service :8001<br/>LLM / Rule-based NLU]
        DATA[Data Service :8002<br/>Spatial Repository]
        EO[EO Analysis :8003<br/>Spectral Math & Indices]
    end

    subgraph Storage [Persistent Storage]
        PG[(PostgreSQL 16 + PostGIS 3.4 :5432)]
    end

    UI --> QClient
    QClient -.->|Network Fallback| FallbackEngine
    QClient -->|POST /api/v1/query| Controller
    Controller --> Orchestrator
    Orchestrator -->|/api/v1/nlp/parse| NLP
    Orchestrator -->|/api/v1/spatial/search| DATA
    Orchestrator -->|/api/v1/eo/analyze| EO
    DATA -->|SQL / Geo Queries| PG
```

---

## 4. Agentic Remote Sensing Tool Invocation Flow

SatQuery AI incorporates a modular `ToolRegistry` with specialized remote-sensing agents:

| Tool Identifier | Category | Target Domain | Implementation Status |
|-----------------|----------|---------------|-----------------------|
| `spectral_index_calculator` | Optical Analysis | NDVI, NDWI, NDBI, NBR, EVI band math | **VERIFIED IN CODE** |
| `canopy_disturbance_detector` | Forest Monitoring | Canopy attenuation & deforestation tracking | **VERIFIED IN CODE** |
| `water_extent_tracker` | Hydrology | Surface water contraction & shoreline delta | **VERIFIED IN CODE** |
| `sar_coherence_analyzer` | Radar Remote Sensing | SAR VV/VH amplitude & surface roughness change | **VERIFIED IN CODE** |
| `fire_scar_mapper` | Disaster Response | NBR pre/post burn severity & perimeter mapping | **VERIFIED IN CODE** |
| `urban_growth_profiler` | Urban Planning | Impervious surface expansion & NDBI change | **VERIFIED IN CODE** |

```mermaid
sequenceDiagram
    autonumber
    participant Orch as SatQueryOrchestrator
    participant Registry as ToolRegistry
    participant Tool as Specialist Analysis Tool
    participant Provider as AnalysisProvider

    Orch->>Registry: getToolsForIntent(intent)
    Registry-->>Orch: Return matched specialist tools
    Orch->>Tool: Execute analysis with input raster / observation
    Tool->>Provider: Compute spectral indices & anomaly masks
    Provider-->>Tool: Raw tensor / numerical output
    Tool->>Tool: Format domain-specific telemetry & evidence
    Tool-->>Orch: Return structured AnalysisResult
```

---

## 5. Startup & Initialization Flow

1. **Docker Compose Startup**:
   - `postgres` initializes schema `001_initial_schema.sql` and seeds `002_seed_regions.sql`.
   - `nlp-service`, `data-service`, and `eo-analysis-service` boot on ports `8001`, `8002`, and `8003`.
   - `spring-boot-backend` starts on port `8080`, probes downstream microservice health endpoints.
   - `frontend` Nginx starts on port `3000`, serving production React assets and proxying `/api/*` to `:8080`.
2. **Client Browser Initialization**:
   - Downloads static bundle, assets, and Cesium / Three.js modules.
   - Loads landing page with interactive Three.js 3D globe and Lenis smooth scrolling.
   - On transition to Mission Control, initializes CesiumJS viewer with ESRI World Imagery and terrain providers.
   - Probes backend health endpoint `/api/v1/health`; enables full microservice mode or in-memory fallback transparently.
