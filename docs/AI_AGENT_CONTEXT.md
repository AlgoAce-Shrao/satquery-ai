# AI Agent Context & Handoff Guide

## What is SatQuery AI?
SatQuery AI is an Earth Observation intelligence analyst that controls a 3D Earth globe in response to natural language geospatial queries.

## Architecture & Codebase Map
- **Frontend Layer**:
  - `src/App.tsx`: Main Mission Control container.
  - `src/components/globe/GlobeViewer.tsx`: 3D Globe renderer, camera flight manager, and spatial layer overlays.
  - `src/components/query/QueryBar.tsx`: Geospatial natural language input with prompt suggestions and quick scope chips.
  - `src/components/results/AnalysisPanel.tsx`: Telemetry, before/after metrics, confidence indicator, and tour navigation controls.
  - `src/components/results/EvidenceDrawer.tsx`: Detailed spectral band breakdown, methodology explanation, and satellite observation metadata.
- **Backend & Service Layer**:
  - `src/services/queryEngine.ts`: Query orchestrator and NLU interpreter.
  - `src/services/satelliteDataProvider.ts`: Satellite data provider abstraction (Mock / STAC / Sentinel).
  - `src/services/analysisEngine.ts`: Scientific index computations (NDVI, NDWI, NDBI) and geometric ranking.
- **Types & Contracts**:
  - `src/types/geospatial.ts`: Strongly-typed query intents, observation geometries, analysis metrics, and camera targets.

## What Should NOT Be Changed
1. **Never make the LLM fabricate numbers**: Quantitative values (e.g. NDVI drops, % changes) must come from the scientific calculation layer.
2. **Never turn this into a generic text chatbot**: The 3D globe and automated camera flight is the central UI/UX experience.
3. **Preserve the `SatelliteDataProvider` interface**: Keep all satellite data access decoupled so live providers can replace mock providers seamlessly.

## Running and Verifying the Project
- Run dev server: `npm run dev` (running on port 3000)
- Build check: `npm run build`
- Type verification: `npm run lint` (`tsc --noEmit`)
