# Architectural Decision Records (ADRs)

## ADR-001 — 3D Earth Visualization Engine
### Decision
Use CesiumJS (with high-performance WebGL/WebGPU ellipsoid rendering) as the primary 3D Earth visualization canvas.
### Reason
SatQuery AI requires smooth continuous camera navigation, orbital perspective, terrain elevation, dynamic polygon clipping, and real-time bounding box projection. Cesium provides spherical geometry and camera controls designed specifically for aerospace and geospatial applications.
### Status
Accepted.

---

## ADR-002 — Separation of Orchestration and Scientific ML Processing
### Decision
Separate the general application orchestration (Spring Boot / Node.js API layer) from the AI/ML and geospatial raster processing service (Python / FastAPI).
### Reason
Python possesses the standard remote sensing ecosystem (GDAL, Rasterio, NumPy, GeoPandas, PyTorch), whereas Spring Boot/Node provides enterprise REST management, connection resilience, and session handling.
### Status
Accepted.

---

## ADR-003 — Deterministic Scientific Computation vs. LLM Generation
### Decision
The LLM is strictly prohibited from generating or hallucinating numerical indices (e.g. NDVI, percentage change, square kilometers affected). All numerical metrics MUST be derived deterministically from raster math or spatial vector calculations. The LLM only interprets the structured evidence output.
### Reason
Ensures 100% scientific integrity and credibility for research, defense, and environmental monitoring applications.
### Status
Accepted.

---

## ADR-004 — Satellite Data Provider Abstraction Layer
### Decision
Implement a polymorphic `SatelliteDataProvider` interface with a `MockSatelliteDataProvider` implementation for initial offline development and immediate readiness for `SentinelHubProvider` / `LandsatSTACProvider`.
### Reason
Avoids blocking development on external satellite API rate limits or gigabyte raster downloads while keeping the exact same downstream contracts.
### Status
Accepted.

---

## ADR-005 — Mission Control Dark Visual Aesthetic
### Decision
Adopt a focused, high-contrast scientific mission control aesthetic (dark slate backgrounds, crisp spatial overlays, legible numerical metrics, clear status telemetry) over generic SaaS dashboard designs.
### Reason
Earth Observation analysis is inherently visual and map-centric; the 3D globe must dominate the viewport with unobtrusive floating HUD controls.
### Status
Accepted.
