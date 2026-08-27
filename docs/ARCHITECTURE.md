# SatQuery AI — System Architecture Specification

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              INTERNET / USERS                                   │
└─────────────────────────────────────┬───────────────────────────────────────────┘
                                      │ HTTPS
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND (nginx + React)                              │
│  Port 3000                                                                        │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │ LandingPage (Three.js) ──► Mission Control (CesiumJS 3D Globe)              │ │
│  │ • Cinematic scroll storytelling                                            │ │
│  │ • Autonomous camera tours                                                  │ │
│  │ • Interactive polygon overlays & markers                                   │ │
│  │ • Real-time telemetry HUD                                                  │ │
│  └────────────────────────────────┬────────────────────────────────────────────┘ │
│                                   │ REST API (optional)                          │
└───────────────────────────────────┼──────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    SPRING BOOT API GATEWAY (Port 8080)                          │
│  SatQueryApplication + QueryController + QueryOrchestrationService              │
│  • Request validation & routing                                                │
│  • Orchestrates NLP → Data → EO Analysis pipeline                             │
│  • Fallback to in-memory engine if backend unavailable                         │
│  • Health: GET /api/v1/health                                                  │
└──────────┬────────────────────────┬────────────────────────┬────────────────────┘
           │                        │                        │
           ▼                        ▼                        ▼
┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐
│   NLP SERVICE       │  │   DATA SERVICE      │  │  EO ANALYSIS SVC    │
│   Port 8001         │  │   Port 8002         │  │  Port 8003          │
│   FastAPI + Uvicorn │  │   FastAPI + Uvicorn │  │   FastAPI + Uvicorn │
│   • RuleBased NLU   │  │   • SpatialRepository│  │  • SpectralCalculator│
│   • Intent parsing  │  │   • PostGIS / Memory│  │  • NDVI/NDWI/NDBI   │
│   • StructuredQuery │  │   • Observations    │  │  • NBR/EVI          │
└─────────────────────┘  └──────────┬──────────┘  └─────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    POSTGIS DATABASE (Port 5432)                                 │
│  postgis/postgis:16-3.4                                                         │
│  • regions table (spatial index)                                                │
│  • observations table (footprint index)                                         │
│  • analysis_jobs & analysis_results tables                                     │
│  • Migrations in database/migrations/                                          │
│  • Seeds in database/seeds/                                                    │
└─────────────────────────────────────────────────────────────────────────────────┘

                                    ▲
                                    │ Optional GPU Backend
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│              COLAB ML SERVER (External / Optional)                              │
│  Google Colab / Cloud Run GPU / Self-hosted PyTorch                             │
│  • Endpoint: POST /api/v1/analyze                                               │
│  • Health: GET /health                                                          │
│  • Adapter: ColabMLAnalysisProvider                                             │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 2. Component Architecture

### Frontend Layer (React 19 + TypeScript + Vite 6)

| Component | Responsibility | Key Technologies |
|-----------|---------------|------------------|
| `LandingPage` | Cinematic scroll-driven entry experience | Three.js, GLSL shaders, GSAP, Lenis |
| `CesiumGlobeViewer` | 3D Earth visualization & navigation | CesiumJS 1.144, ESRI World Imagery |
| `UploadWizardModal` | 3-mode image ingestion (Single/Bi-Temporal/Optical+SAR) | React hooks, File API, ImageInspector |
| `InteractiveImageCanvas` | Zoom/pan pixel inspector with layer toggle | Canvas 2D, coordinate HUD |
| `SatQueryOrchestrator` | Client-side agentic pipeline coordinator | Singleton, provider abstraction |
| `AnalysisProvider` | Pluggable analysis backends | Mock (demo) / Colab ML (production) |
| `ToolRegistry` | 6 specialist remote-sensing tools | Metadata, readiness tags |
| `ImageInspector` | Raster format, dimension, CRS validation | Browser File API, Image loader |
| `QueryApiClient` | Backend communication with fallback | Fetch API, in-memory engine |

### Backend API Gateway (Spring Boot 3.2.3 + Java 21)

| Component | Responsibility |
|-----------|---------------|
| `SatQueryApplication` | Spring Boot entry point, RestTemplate bean |
| `QueryController` | REST endpoints: `POST /api/v1/query`, `GET /api/v1/health` |
| `QueryOrchestrationService` | Pipeline: NLP → Data → EO Analysis → Synthesized response |
| `application.yml` | Service URLs via environment variables |

### Python Microservices (FastAPI + Uvicorn)

| Service | Port | Purpose | Key Modules |
|---------|------|---------|-------------|
| **NLP Service** | 8001 | Natural language → StructuredQuery | `LLMProvider` (RuleBased), Pydantic schemas |
| **Data Service** | 8002 | Spatial observations & PostGIS access | `SpatialRepository`, in-memory catalog fallback |
| **EO Analysis Service** | 8003 | Spectral index math & change detection | `SpectralCalculator` (NDVI, NDWI, NDBI, NBR, EVI) |

### Database Layer (PostgreSQL 16 + PostGIS 3.4)

| Table | Purpose | Key Indexes |
|-------|---------|-------------|
| `regions` | Reference regions with geometry | GIST on `geom`, `centroid` |
| `observations` | Satellite scene catalog | GIST on `footprint`, BTREE on `(region_id, acquisition_date)` |
| `analysis_jobs` | Query execution audit log | BTREE on `created_at` |
| `analysis_results` | Computed findings with geometry | GIST on `affected_geom`, BTREE on `job_id` |

### External Integrations

| Service | Purpose | Required | Fallback |
|---------|---------|----------|----------|
| **Cesium Ion** | 3D globe terrain/imagery | Recommended | ESRI World Imagery (free) |
| **ESRI World Imagery** | Satellite basemap | Built-in | OpenStreetMap |
| **Gemini API** | LLM provider for NLP | Optional | RuleBasedProvider (built-in) |
| **Colab ML Server** | GPU PyTorch vision models | Optional | MockAnalysisProvider (built-in) |
| **STAC / Copernicus** | Live satellite data | Future | In-memory catalog |

## 3. Communication Protocols

| Path | Protocol | Format | Auth |
|------|----------|--------|------|
| Frontend → Spring Boot | HTTPS/REST | JSON | None (CORS *) |
| Spring Boot → NLP | HTTP/REST | JSON | None (internal network) |
| Spring Boot → Data | HTTP/REST | JSON | None (internal network) |
| Spring Boot → EO | HTTP/REST | JSON | None (internal network) |
| Data → PostGIS | PostgreSQL Wire | SQL | User/Pass (env) |
| Frontend → Colab ML | HTTPS/REST | JSON | Optional API key |

## 4. Deployment Architecture

### Production Topology

```
                         INTERNET (HTTPS)
                              │
                              ▼
                    ┌─────────────────┐
                    │   CDN / WAF     │  (Cloudflare / CloudFront)
                    │   TLS Termination│
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  FRONTEND       │  Static hosting (Vercel/Netlify/S3+CloudFront)
                    │  (nginx + React)│  Port 443 → 3000
                    └────────┬────────┘
                             │ API Calls
                             ▼
              ┌────────────────────────────────┐
              │  API GATEWAY / LOAD BALANCER   │  (AWS ALB / Cloud Run / Fly.io)
              │  Routes /api/* → Spring Boot   │
              └────────────┬───────────────────┘
                           │
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
    ┌────────────┐  ┌────────────┐  ┌────────────┐
    │ NLP SVC    │  │ DATA SVC   │  │ EO SVC     │
    │ (Container)│  │ (Container)│  │ (Container)│
    └─────┬──────┘  └─────┬──────┘  └─────┬──────┘
          │               │               │
          └───────────────┼───────────────┘
                          ▼
                 ┌────────────────┐
                 │ MANAGED POSTGIS│  (AWS RDS / GCP Cloud SQL / Supabase / Neon)
                 │ PostgreSQL 16  │
                 │ PostGIS 3.4    │
                 └────────────────┘
                          ▲
                          │ Optional
                          ▼
                 ┌────────────────┐
                 │ COLAB ML / GPU │  (Cloud Run GPU / Vertex AI / Self-hosted)
                 │ PyTorch Backend│
                 └────────────────┘
```

## 5. Data Flow Summary

```
User Query
    │
    ▼
Frontend (QueryApiClient)
    │
    ├─► Spring Boot (/api/v1/query) ──► NLP Service (parse) ──► StructuredQuery
    │                                      │
    │                                      ▼
    │                                Data Service (search) ──► Observations[]
    │                                      │
    │                                      ▼
    │                                EO Analysis (analyze) ──► AnalyzedResults[]
    │                                      │
    │                                      ▼
    └──────────────────────► Synthesized Response ◄──────────┘
                               │
                               ▼
Frontend State Update (QueryExecutionState)
    │
    ▼
CesiumGlobeViewer: Camera Flight → Polygon Render → Tour Start
```

## 6. Key Design Decisions (ADRs)

| ADR | Decision | Rationale |
|-----|----------|-----------|
| ADR-001 | CesiumJS for 3D Globe | Aerospace-grade spherical math, camera controls, terrain |
| ADR-002 | Spring Boot + Python separation | Python for raster science (GDAL/NumPy), Java for REST orchestration |
| ADR-003 | Deterministic computation only | LLM never generates numerical indices; all metrics from raster math |
| ADR-004 | SatelliteDataProvider abstraction | Mock → STAC → Live providers without contract changes |
| ADR-005 | Dark mission-control aesthetic | Globe dominates viewport; unobtrusive floating HUD |

## 7. Scalability Considerations

| Component | Scaling Strategy |
|-----------|------------------|
| Frontend | Static CDN (zero scaling concerns) |
| Spring Boot | Horizontal (stateless), connection pooling to services |
| NLP Service | Horizontal (stateless), rule-based = fast |
| Data Service | Read replicas for PostGIS, in-memory cache |
| EO Analysis | Horizontal (stateless), NumPy releases GIL |
| PostGIS | Managed service (RDS/Cloud SQL), read replicas |
| Colab ML | GPU autoscaling (Cloud Run GPU / Vertex AI) |

## 8. Failure Modes & Resilience

| Failure | Detection | Mitigation |
|---------|-----------|------------|
| Spring Boot down | Frontend health check | Fallback to in-memory `queryEngine` |
| NLP Service down | Timeout / circuit breaker | Rule-based fallback in orchestrator |
| Data Service down | Timeout / 5xx | Return empty observations, continue |
| EO Service down | Timeout / 5xx | Skip analysis, return raw observations |
| PostGIS down | Connection pool exhaustion | In-memory catalog fallback |
| Colab ML down | Health check | Auto-fallback to MockProvider |
| Cesium Ion unavailable | Tile load errors | ESRI World Imagery fallback |