from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .schemas.analysis import PerformAnalysisRequest, AnalysisResponse
from .analysis.spectral_calculator import SpectralCalculator

app = FastAPI(
    title="SatQuery AI - Earth Observation Analysis Service",
    description="Performs multi-spectral mathematical band operations, vegetation indices, and change detection.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {
        "status": "HEALTHY",
        "service": "eo-analysis-service",
        "supported_indices": ["NDVI", "NDWI", "NDBI", "NBR", "EVI"]
    }

@app.post("/api/v1/eo/analyze", response_model=AnalysisResponse)
async def analyze_earth_observations(request: PerformAnalysisRequest):
    results = []
    for obs in request.observations:
        result = SpectralCalculator.analyze_observation(
            obs=obs,
            metric_name=request.metric,
            direction=request.direction
        )
        results.append(result)

    # Sort results by absolute magnitude of change descending (most critical first)
    results.sort(key=lambda r: abs(r.metric.percentageChange), reverse=True)

    return AnalysisResponse(
        total_analyzed=len(results),
        results=results
    )
