from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .schemas.spatial import SpatialQueryRequest, SpatialQueryResponse
from .repositories.spatial_repository import SpatialRepository

app = FastAPI(
    title="SatQuery AI - PostGIS Data & Spatial Service",
    description="Provides geospatial data access, observation records, and bounding-box queries.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

repo = SpatialRepository()

@app.get("/health")
def health_check():
    return {
        "status": "HEALTHY",
        "service": "data-service",
        "spatial_backend": "PostGIS / In-Memory Catalog"
    }

@app.post("/api/v1/spatial/search", response_model=SpatialQueryResponse)
async def search_spatial_observations(request: SpatialQueryRequest):
    records = await repo.search_observations(
        intent=request.intent,
        metric=request.metric,
        spatial_scope_name=request.spatial_scope_name
    )
    return SpatialQueryResponse(
        total_matched=len(records),
        records=records
    )
