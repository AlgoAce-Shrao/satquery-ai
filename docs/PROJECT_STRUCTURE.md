# SatQuery AI — Repository Structure & Directory Map

This document provides a comprehensive map of the SatQuery AI repository, explaining the purpose, responsibility, and dependencies of each directory and core module.

---

## 1. Directory Tree Overview

```text
satquery-ai/
├── .env.example               # Complete environment variable template
├── .dockerignore              # Docker build exclusions
├── .gitignore                 # Git ignore rules for node, python, java, secrets
├── docker-compose.yml         # Multi-service production orchestration
├── index.html                 # HTML5 entrypoint with Google Fonts & Cesium links
├── package.json               # Node.js dependencies and build scripts
├── tsconfig.json              # TypeScript compiler configuration
├── vite.config.ts             # Vite bundler, Cesium plugin, and dev proxy config
│
├── backend/                   # Backend services root
│   └── spring-boot/           # Java 21 Spring Boot API Gateway
│       ├── pom.xml            # Maven build definition & dependencies
│       └── src/main/java/com/satquery/
│           ├── SatQueryApplication.java       # Spring Boot main class
│           ├── controller/QueryController.java # REST API endpoints
│           ├── dto/QueryRequest.java          # Request DTO record
│           ├── dto/QueryResponse.java         # Response DTO record
│           └── service/QueryOrchestrationService.java # Downstream pipeline coordinator
│
├── database/                  # Database definitions and spatial migrations
│   ├── migrations/
│   │   ├── 001_initial_schema.sql             # PostGIS schema, tables, spatial indexes
│   │   └── 002_seed_regions.sql               # Critical global Earth observation regions
│   └── seeds/
│       └── 001_initial_regions.sql            # Seed dataset backup
│
├── docker/                    # Docker container definitions
│   ├── Dockerfile.data-service    # Python Data Service container
│   ├── Dockerfile.eo-analysis     # Python EO Analysis Service container
│   ├── Dockerfile.frontend        # Multi-stage Node + Nginx SPA container
│   ├── Dockerfile.nlp             # Python NLP Service container
│   ├── Dockerfile.spring-boot     # Multi-stage Maven + JRE container
│   └── nginx.conf                 # Production Nginx reverse proxy configuration
│
├── docs/                      # Comprehensive technical documentation suite
│   ├── ARCHITECTURE.md        # System architecture and layer responsibilities
│   ├── SYSTEM_FLOW.md         # Request, query, and analysis sequence flows
│   ├── API.md                 # Complete REST API specifications & schemas
│   ├── DATABASE.md            # PostGIS database schema, ERD, and indexing
│   ├── AI_PIPELINE.md         # NLU intent routing, spectral math, and tools
│   ├── DEPLOYMENT.md          # Production deployment guide and order
│   ├── ENVIRONMENT.md         # Master environment variables matrix
│   ├── SECURITY.md            # Security policy, network hardening, secrets
│   ├── DEVELOPMENT.md         # Local development quickstart and testing
│   ├── TROUBLESHOOTING.md     # Diagnostic guide and incident resolution
│   └── PROJECT_STRUCTURE.md   # Repository structure and directory breakdown
│
├── services/                  # Python FastAPI microservices
│   ├── data-service/          # PostGIS spatial query and scene metadata service
│   │   ├── requirements.txt
│   │   └── app/
│   │       ├── main.py
│   │       ├── repositories/spatial_repository.py
│   │       └── schemas/spatial.py
│   ├── eo-analysis-service/   # Multi-spectral band arithmetic & change detection
│   │   ├── requirements.txt
│   │   └── app/
│   │       ├── main.py
│   │       ├── analysis/spectral_calculator.py
│   │       └── schemas/analysis.py
│   └── nlp-service/           # Natural language query parsing & intent extraction
│       ├── requirements.txt
│       └── app/
│           ├── main.py
│           ├── providers/llm_provider.py
│           └── schemas/query.py
│
└── src/                       # Frontend React 19 + TypeScript Application
    ├── App.tsx                # Main view router (LandingPage vs Mission Control)
    ├── index.css              # Global styling, Tailwind tokens, CSS variables
    ├── main.tsx               # React DOM root mounting
    │
    ├── components/            # UI components by domain
    │   ├── footer/            # Footer bar and telemetry status
    │   ├── globe/             # Cesium 3D Globe Viewer and polygon overlays
    │   ├── header/            # Top navigation, status indicator, mode selector
    │   ├── landing/           # Cinematic Three.js scroll landing page
    │   │   ├── CinematicScrollCanvas.tsx  # Three.js 3D earth and shaders
    │   │   ├── LandingPage.tsx           # Hero section and scroll flow
    │   │   └── AgentWorkflowSection.tsx  # Interactive agent pipeline demo
    │   ├── query/             # Natural language query input bar & suggestions
    │   ├── results/           # Analysis result cards, charts, evidence tabs
    │   └── upload/            # Ingestion wizard, image inspector, canvas
    │
    ├── data/                  # Static geojson boundaries, mock observations
    ├── lib/                   # Utility helpers (math, colors, formatting)
    ├── services/              # Frontend service layer
    │   ├── api/queryApiClient.ts          # Gateway fetch client with fallback
    │   ├── imageInspector.ts              # Client-side raster metadata extraction
    │   ├── observationRegistry.ts         # In-memory scene repository
    │   ├── queryEngine.ts                 # In-memory query simulation engine
    │   ├── queryInterpreter.ts            # Client-side NLP rule parser
    │   ├── satQueryOrchestrator.ts        # Agent orchestrator singleton
    │   ├── satelliteDataProvider.ts       # Satellite metadata provider
    │   ├── satelliteImageService.ts       # Imagery tile provider
    │   ├── providers/                     # Analysis providers (Mock, Colab ML)
    │   └── tools/toolRegistry.ts          # 6 specialist remote-sensing tools
    │
    └── types/                 # TypeScript type definitions
        └── geospatial.ts      # Core geospatial interfaces and enums
```
