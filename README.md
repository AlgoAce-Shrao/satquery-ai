# SatQuery AI — Multi-Service Earth Observation Intelligence System

SatQuery AI is an agentic Earth Observation (EO) intelligence analyst combining natural language understanding, intelligent satellite raster ingestion, multi-spectral band mathematics, cross-modal sensor fusion (Optical + SAR), and autonomous 3D Earth globe navigation.

[![Frontend Build](https://img.shields.io/badge/Frontend%20Build-PASSING-brightgreen)]()
[![TypeCheck](https://img.shields.io/badge/TypeScript%20Strict-0%20Errors-brightgreen)]()
[![Java Backend](https://img.shields.io/badge/Spring%20Boot-3.2.3%20%2F%20Java%2021-blue)]()
[![Python Microservices](https://img.shields.io/badge/FastAPI-3%20Microservices-blue)]()
[![Database](https://img.shields.io/badge/Database-PostgreSQL%2016%20%2B%20PostGIS%203.4-blue)]()

---

## 📚 Complete Technical Documentation Suite

| Document | Description |
|----------|-------------|
| [📖 System Architecture](file:///docs/ARCHITECTURE.md) | High-level topology, component diagrams, communication protocols, ADRs |
| [🔄 System & Execution Flows](file:///docs/SYSTEM_FLOW.md) | Sequence diagrams for query execution, image ingestion, and tool lifecycle |
| [🔌 API Reference](file:///docs/API.md) | Complete REST API contracts for Gateway, NLP, Data, and EO Analysis services |
| [🗄️ Database & Spatial Model](file:///docs/DATABASE.md) | PostGIS tables, ER diagrams, spatial GIST indexing, and migrations |
| [🧠 AI, Vision & EO Pipeline](file:///docs/AI_PIPELINE.md) | NLU intent routing, spectral band math formulas, and specialist tool suite |
| [🚀 Production Deployment Guide](file:///docs/DEPLOYMENT.md) | Platform recommendations, build/start commands, multi-cloud guide, deployment order |
| [⚙️ Environment Variables Reference](file:///docs/ENVIRONMENT.md) | Comprehensive table of environment variables, defaults, and secrets |
| [🔒 Security & Hardening Policy](file:///docs/SECURITY.md) | Network isolation, secrets management, input sanitization, and CORS rules |
| [💻 Local Development Guide](file:///docs/DEVELOPMENT.md) | Quickstart guide for native development, venvs, tests, and Maven setup |
| [🛠️ Troubleshooting & Diagnostics](file:///docs/TROUBLESHOOTING.md) | Solutions for WebGL, network connections, ports, and Docker issues |
| [📂 Repository Structure Map](file:///docs/PROJECT_STRUCTURE.md) | Directory breakdown and module responsibilities |
| [📋 Deployment Readiness Report](file:///DEPLOYMENT_READINESS_REPORT.md) | Final verification audit and executive readiness certification |

---

## Core Capabilities

### 1. Cinematic NASA-Style Landing Experience
- **Photorealistic 3D Three.js Earth Canvas** (`CinematicScrollCanvas.tsx`): Custom GLSL shaders blending NASA Blue Marble surface textures with Black Marble city night lights, ocean specular reflections, atmospheric limb scattering, procedural cloud layers, and an orbiting remote-sensing satellite with gold MLI thermal insulation, solar arrays, SAR dish, and scanning swath cone.
- **5-Stage Scroll-Driven Storytelling** (`ScrollStoryOverlay.tsx`): SPACE → GLOBAL OBSERVATION → REMOTE SENSING → REGIONAL FOCUS → CHANGE DELINEATION & AI INTELLIGENCE.
- **Problem → Solution Narrative** (`ProblemSolutionStory.tsx`): Clean comparison of legacy GIS friction vs. SatQuery's natural-language agentic execution with interactive planetary query box.

### 2. Intelligent Satellite Ingestion Wizard (`UploadWizardModal`)
- **Single Scene Understanding**: Ingest optical or SAR scenes for land cover classification, object identification, and remote-sensing questions.
- **Temporal Comparison**: Pair baseline $T_0$ and target $T_1$ observations to detect canopy loss, urban build-up, flood extents, and radiometric shifts.
- **Multimodal Optical + SAR Fusion**: Jointly evaluate optical multi-spectral reflectance and Sentinel-1 SAR C-band radar backscatter to isolate physical surface roughness and penetrate clouds.
- **5 Benchmark Presets**: One-click demo scenarios for rapid evaluation.

### 3. Automated Raster Inspection & Compatibility Validation (`ImageInspector`)
- In-browser file inspection for GeoTIFF, COG, NetCDF, PNG, JPEG formats.
- Evaluates sensor modality matching, raster dimension alignment, temporal delta separation, geodetic coordinate consistency.
- Assigns explicit compatibility status: `COMPATIBLE`, `LIKELY_COMPATIBLE`, `COMPATIBILITY_UNKNOWN`, `NOT_COMPATIBLE`.

### 4. Specialist Model & Tool Registry (`ToolRegistry`)
- Catalog of 6 modular remote-sensing tools with observable metadata and readiness tags:
  - `RS_VQA_CLASSIFIER` — Vision-language scene understanding
  - `RS_REGION_GROUNDING_SEGMENTER` — Text-guided spatial delineation
  - `BI_TEMPORAL_CHANGE_DIFF` — Bi-temporal radiometric delta engine
  - `OPTICAL_SAR_FUSION_CORE` — Cross-modal sensor fusion
  - `GEOTIFF_METADATA_PARSER` — Geospatial tag parsing & CRS verification
  - `SPATIAL_EVIDENCE_EXTRACTOR` — Polygon delineation & severity metrics

### 5. Observable 8-Stage Agentic Pipeline
1. `QUERY_RECEIVED` — Ingestion & parameter validation
2. `INPUT_VALIDATED` — Sensor & CRS verification
3. `TASK_IDENTIFIED` — Intent classification
4. `SPECIALIST_TOOL_SELECTED` — Model weight dispatch
5. `REMOTE_SENSING_ANALYSIS` — Spectral & backscatter calculation
6. `SPATIAL_EVIDENCE_EXTRACTED` — Polygon & bounding-box delineation
7. `RESULT_VALIDATED` — Sensor calibration verification
8. `INSIGHT_GENERATED` — Structured intelligence summary

### 6. Extensible Analysis Provider Abstraction (`AnalysisProvider`)
- **MockAnalysisProvider**: Deterministic client-side remote-sensing reasoning for demo mode (all 3 input modes, 4 scenarios).
- **ColabMLAnalysisProvider**: Prepared adapter for external Google Colab / GPU PyTorch ML backends (`POST /api/v1/analyze`).

### 7. Interactive Canvas & Pixel Inspector (`InteractiveImageCanvas`)
- High-resolution zoom & pan viewport.
- Layer toggling: `[Original]`, `[Spatial Evidence]`, `[Class Mask]`, `[Difference Heatmap]`.
- Real-time cursor coordinates and pixel telemetry HUD.

### 8. Autonomous 3D Globe Navigation (`CesiumGlobeViewer`)
- CesiumJS-powered 3D Earth with ESRI World Imagery and terrain providers.
- Smooth spherical camera flights with cubic easing.
- Dynamic polygon overlays clamped to terrain with glowing boundaries.
- Interactive marker pins with raycasting hover tooltips.
- Automated tour engine with user-gesture override protection.

---

## Technology Stack

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Frontend** | React, TypeScript, Vite, Tailwind CSS | React 19, TS 5.8, Vite 6, Tailwind 4 | Responsive mission control UI & spatial interaction |
| **3D Globe** | CesiumJS, Three.js | Cesium 1.144, Three 0.185 | 3D photogrammetric globe & landing page canvas |
| **Animation** | GSAP, Motion, Lenis | GSAP 3.15, Motion 12, Lenis 1.3 | Cinematic scroll storytelling & HUD animations |
| **Backend API** | Spring Boot, Java, Maven | Spring Boot 3.2.3, Java 21 | Request orchestration gateway & microservice routing |
| **Microservices** | Python, FastAPI, Uvicorn | Python 3.11+, FastAPI 0.110 | NLP parsing, PostGIS spatial queries, spectral math |
| **Database** | PostgreSQL + PostGIS | PostgreSQL 16, PostGIS 3.4 | Geospatial scene catalog & polygon indexing |
| **Containerization** | Docker, Docker Compose | Docker Engine 24+, Compose v2 | Multi-service reproducible production topology |

---

## Repository Structure

```text
satquery-ai/
├── src/                          # Frontend React 19 SPA
├── backend/spring-boot/          # Spring Boot 3.2.3 API Gateway (Java 21)
├── services/                     # Python FastAPI microservices
│   ├── nlp-service/              # Natural language parsing (Port 8001)
│   ├── data-service/             # PostGIS spatial catalog (Port 8002)
│   └── eo-analysis-service/      # Spectral band math (Port 8003)
├── database/                     # Database schemas & seeds
│   ├── migrations/               # PostGIS schema migrations
│   └── seeds/                    # Seed regions and observations
├── docker/                       # Production Dockerfiles & Nginx configs
├── docs/                         # Technical documentation suite
├── .env.example                  # Environment configuration template
└── docker-compose.yml            # Complete multi-service compose file
```

---

## Quick Start

### 1. Local Development (Frontend Only)
```bash
npm install
npm run dev          # Starts Vite on http://localhost:3000
```
*Note: The frontend operates with an automatic client-side fallback engine, allowing full exploration of the UI, 3D globe, and raster tools without external backend dependencies.*

### 2. Production Build (Frontend)
```bash
npm run lint         # Strict TypeScript typechecking
npm run build        # Production bundle into /dist
```

### 3. Full Multi-Service Stack with Docker Compose
```bash
cp .env.example .env
docker compose up -d --build
```

**Services initialized:**
- **Frontend SPA**: [http://localhost:3000](http://localhost:3000)
- **Spring Boot API Gateway**: [http://localhost:8080](http://localhost:8080)
- **NLP Service**: [http://localhost:8001/health](http://localhost:8001/health)
- **Data Service**: [http://localhost:8002/health](http://localhost:8002/health)
- **EO Analysis Service**: [http://localhost:8003/health](http://localhost:8003/health)
- **PostGIS Database**: `localhost:5432`

---

## License

This project is licensed under the Apache License 2.0.