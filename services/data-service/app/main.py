from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from .schemas.spatial import SpatialQueryRequest, SpatialQueryResponse
from .repositories.spatial_repository import SpatialRepository

repo = SpatialRepository()

@asynccontextmanager
async def lifespan(_: FastAPI):
    await repo.connect()
    yield
    await repo.close()

app = FastAPI(
    title="SatQuery AI - PostGIS Data & Spatial Service",
    description="Provides geospatial data access, observation records, and bounding-box queries.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    if not repo.is_ready:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={"status": "UNHEALTHY", "service": "data-service", "reason": repo.database_error},
        )
    return {
        "status": "HEALTHY",
        "service": "data-service",
        "spatial_backend": repo.backend_name,
    }

@app.post("/api/v1/spatial/search", response_model=SpatialQueryResponse)
async def search_spatial_observations(request: SpatialQueryRequest):
    try:
        records = await repo.search_observations(
            intent=request.intent,
            metric=request.metric,
            spatial_scope_name=request.spatial_scope_name,
            max_cloud_cover=request.max_cloud_cover or 20.0,
            limit=request.limit or 10,
        )
    except RuntimeError as error:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(error)) from error
    return SpatialQueryResponse(
        total_matched=len(records),
        records=records
    )
