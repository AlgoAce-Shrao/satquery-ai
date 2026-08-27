# SatQuery AI — Known Issues & Tracking

## Active Investigations

### ISS-001: WebGL Globe Rendering Performance in Sandboxed iFrames
- **Status**: Monitored
- **Description**: Ensure 3D canvas uses adaptive Level-of-Detail (LOD) and hardware acceleration to maintain 60 FPS during camera flight animations.
- **Mitigation**: Implement smooth Bezier camera transitions and lightweight vector polygon layers.

### ISS-002: Mock Data to Live STAC Pipeline Compatibility
- **Status**: Mitigated via Architecture
- **Description**: Need to ensure mock data formats precisely match OpenSearch / STAC / GeoJSON standards.
- **Resolution**: Strict TypeScript and Python Pydantic schemas enforce identical payload models.
