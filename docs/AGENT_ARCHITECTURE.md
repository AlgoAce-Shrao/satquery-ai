# SatQuery AI - Multi-Agent Architecture

## 1. Agent System Overview
SatQuery AI leverages a multi-specialist agent pipeline for natural-language geospatial analysis, image anomaly grounding, and camera flight trajectory generation:

```
                  ┌───────────────────────────────┐
                  │  Natural-Language User Query  │
                  └───────────────┬───────────────┘
                                  │
                                  ▼
                  ┌───────────────────────────────┐
                  │      Supervisor / Router      │
                  │       (QueryInterpreter)      │
                  └───────┬───────────────┬───────┘
                          │               │
            ┌─────────────┴─────┐   ┌─────┴─────────────┐
            ▼                   ▼   ▼                   ▼
    ┌───────────────┐   ┌───────────────┐   ┌───────────────────┐
    │ Deforestation │   │  Flood & SAR  │   │  Wildfire / Thermal│
    │  Specialist   │   │  Specialist   │   │    Specialist     │
    └───────┬───────┘   └───────┬───────┘   └─────────┬─────────┘
            │                   │                     │
            └─────────────┬─────┴─────────────────────┘
                          ▼
            ┌───────────────────────────────┐
            │   Deterministic Radiometry   │
            │   (NDVI / NDWI / dNBR / NDBI) │
            └───────────────┬───────────────┘
                            ▼
            ┌───────────────────────────────┐
            │   Camera Flight Controller    │
            │   (3D Cesium Navigation Engine)│
            └───────────────────────────────┘
```

## 2. Agent Execution Trace Schema (`AgentExecutionTrace`)
Every observation or live query result carries provenance tracing:
- `task`: High-level natural-language assignment (e.g. "Canopy loss detection in Amazon frontier")
- `agent`: Assigned specialist agent (e.g. `DeforestationVisionSpecialist`, `FloodInundationAgent`, `WildfireBurnAnalyst`)
- `models`: Vision models and LLM backends invoked (e.g. `Gemini-1.5-Pro`, `Copernicus-Vision-L2A`)
- `tools`: Specialized tools executed (e.g. `SentinelHub_NDVI`, `PostGIS_Spatial_Intersection`, `B08_B04_Radiometry_Delta`, `Cesium_Flight_Trajectory`)
- `reasoning`: Chain-of-thought explanation for scientific conclusions
- `confidence`: Calibrated statistical confidence score (0.00 - 1.00)
