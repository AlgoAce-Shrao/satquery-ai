from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from .schemas.analysis import PerformAnalysisRequest, AnalysisResponse
from .schemas.raster_analysis import RasterAnalysisRequest, RasterAnalysisResponse
from .analysis.spectral_calculator import SpectralCalculator
from .analysis import raster_processor

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


@app.post("/api/v1/eo/analyze-raster", response_model=RasterAnalysisResponse)
async def analyze_raster(request: RasterAnalysisRequest):
    """Real pixel-level analysis of uploaded imagery (see raster_processor.py docstring for
    exactly what is and isn't computed from real data vs. honestly-labelled heuristics)."""
    tracer = raster_processor.ExecutionTracer()

    if request.mode == "SINGLE":
        if not request.images:
            raise HTTPException(status_code=400, detail="SINGLE mode requires exactly one image.")
        arr, decoder = raster_processor.decode_image(
            request.images[0].content_base64, request.images[0].filename, tracer
        )
        arr = raster_processor.downsample_if_needed(arr, tracer)
        single = raster_processor.analyze_single_image(arr, request.modality, decoder, tracer)
        confidence = raster_processor.compute_confidence(single["validPixelFraction"], single["bandCount"], decoder)
        index_names = ", ".join(i["name"] for i in single["indices"])
        narrative = (
            f"Decoded {request.images[0].filename} ({single['width']}x{single['height']}px, "
            f"{single['bandCount']} band(s), via {decoder}) and computed {index_names} directly "
            f"from its pixel values."
        )
        return RasterAnalysisResponse(
            mode=request.mode,
            modality=request.modality,
            analysisType="RULE_BASED_RASTER_STATISTICS",
            decoder=decoder,
            single=single,
            biTemporal=None,
            confidence=confidence,
            executionTrace=tracer.steps,
            narrative=narrative,
        )

    if len(request.images) < 2:
        raise HTTPException(status_code=400, detail="BI_TEMPORAL mode requires exactly two images.")

    arr_a, decoder_a = raster_processor.decode_image(request.images[0].content_base64, request.images[0].filename, tracer)
    arr_b, decoder_b = raster_processor.decode_image(request.images[1].content_base64, request.images[1].filename, tracer)
    arr_a = raster_processor.downsample_if_needed(arr_a, tracer)
    arr_b = raster_processor.downsample_if_needed(arr_b, tracer)

    bi_temporal = raster_processor.analyze_bi_temporal(arr_a, arr_b, tracer)
    valid_fraction = min(
        raster_processor.valid_pixel_fraction(arr_a), raster_processor.valid_pixel_fraction(arr_b)
    )
    band_count = min(arr_a.shape[2], arr_b.shape[2])
    decoder = decoder_a if decoder_a == decoder_b else f"{decoder_a}+{decoder_b}"
    confidence = raster_processor.compute_confidence(valid_fraction, band_count, decoder_a)
    narrative = (
        f"Aligned {request.images[0].filename} and {request.images[1].filename} to a common "
        f"{bi_temporal['width']}x{bi_temporal['height']}px grid and computed a real per-pixel "
        f"difference: {bi_temporal['percentChangedPixels']:.1f}% of pixels exceed the change threshold."
    )
    return RasterAnalysisResponse(
        mode=request.mode,
        modality=request.modality,
        analysisType="RULE_BASED_RASTER_STATISTICS",
        decoder=decoder,
        single=None,
        biTemporal=bi_temporal,
        confidence=confidence,
        executionTrace=tracer.steps,
        narrative=narrative,
    )
