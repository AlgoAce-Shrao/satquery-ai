"""
Pydantic mirrors of the frontend's ColabAnalyzeRequest/ColabAnalyzeResponse contract
(src/types/upload.ts, src/types/geospatial.ts). Field names are literal camelCase to
match the frontend's JSON verbatim - no aliasing - following the convention already
used for outbound-facing models in services/eo-analysis-service/app/schemas/analysis.py.

Do NOT change field names/shapes here without updating the TypeScript source of truth
first: this file is a consumer of that contract, not an independent definition of it.
"""
from __future__ import annotations

from typing import List, Literal, Optional

from pydantic import BaseModel, model_validator

InputMode = Literal["SINGLE_IMAGE", "BI_TEMPORAL", "OPTICAL_SAR"]

AnalysisType = Literal[
    "VEGETATION_CHANGE",
    "WATER_EXPANSION",
    "URBAN_GROWTH",
    "WILDFIRE_BURN",
    "TEMPORAL_COMPARISON",
    "GROUNDING",
    "MULTIMODAL_ANALYSIS",
    "LAND_COVER",
]

AnalysisVisualizationType = Literal[
    "SINGLE_IMAGE", "GROUNDING", "CHANGE_DETECTION", "MULTIMODAL", "REGION_ANALYSIS"
]

SpatialAnnotationType = Literal["POINT", "BOUNDING_BOX", "POLYGON", "CHANGE_REGION"]

ChangeStatus = Literal["UNCHANGED", "NEW_INCREASED", "REMOVED_DECREASED"]

DataStatus = Literal["PUBLIC_DATA", "DEMO_DATA"]


class GeospatialMetadata(BaseModel):
    hasGeospatial: bool
    crs: Optional[str] = None
    epsg: Optional[int] = None
    bounds: Optional[List[float]] = None  # [minLon, minLat, maxLon, maxLat]
    center: Optional[dict] = None  # {"lat": float, "lon": float}
    pixelSizeMeters: Optional[float] = None
    acquisitionDate: Optional[str] = None
    satellitePlatform: Optional[str] = None
    sensorType: Optional[str] = None
    cloudCoverPercentage: Optional[float] = None
    sunElevationAngle: Optional[float] = None
    bandNames: Optional[List[str]] = None


class ImagePayload(BaseModel):
    fileName: str
    modality: str
    dataBase64: Optional[str] = None
    url: Optional[str] = None
    metadata: Optional[GeospatialMetadata] = None

    @model_validator(mode="after")
    def _exactly_one_source(self) -> "ImagePayload":
        if bool(self.dataBase64) == bool(self.url):
            raise ValueError("Exactly one of dataBase64 or url must be set.")
        return self


class ImagesPayload(BaseModel):
    primary: ImagePayload
    secondary: Optional[ImagePayload] = None


class AnalyzeOptions(BaseModel):
    confidenceThreshold: Optional[float] = None
    returnHeatmaps: Optional[bool] = None
    delineateMasks: Optional[bool] = None


class AnalyzeRequest(BaseModel):
    query: str
    task: str
    inputMode: InputMode
    images: ImagesPayload
    options: Optional[AnalyzeOptions] = None


class SpatialEvidenceItem(BaseModel):
    id: str
    type: SpatialAnnotationType
    label: str
    category: str
    confidence: float
    coordinates: List[dict]  # [{"lat": float, "lon": float}, ...]
    boundingBox: Optional[List[float]] = None
    changeStatus: Optional[ChangeStatus] = None
    areaSqKm: Optional[float] = None
    description: Optional[str] = None
    sourceSensor: Optional[str] = None
    metricDelta: Optional[str] = None


class ExecutionPipelineStage(BaseModel):
    id: str
    stage: Literal[
        "QUERY_RECEIVED",
        "TASK_IDENTIFIED",
        "INPUT_VALIDATED",
        "SPECIALIST_TOOL_SELECTED",
        "REMOTE_SENSING_ANALYSIS",
        "SPATIAL_EVIDENCE_EXTRACTED",
        "RESULT_VALIDATED",
        "INSIGHT_GENERATED",
    ]
    title: str
    description: str
    toolsUsed: Optional[List[str]] = None
    modelsUsed: Optional[List[str]] = None
    outputSummary: Optional[str] = None
    durationMs: Optional[float] = None
    confidence: Optional[float] = None


class AnalysisMetric(BaseModel):
    name: str
    beforeValue: float
    afterValue: float
    percentageChange: float
    unit: str
    severity: str


class AnalysisResult(BaseModel):
    id: str
    rank: int
    siteCode: str
    regionName: str
    country: str
    biome: str
    analysisType: AnalysisType
    visualizationType: Optional[AnalysisVisualizationType] = None
    category: str
    location: dict  # {"lat": float, "lon": float, "altitude"?: float}
    camera: dict  # {"lat", "lon", "altitude", "heading"?, "pitch"?}
    polygon: List[dict]  # [{"lat": float, "lon": float}, ...]
    boundingBox: Optional[List[float]] = None
    metric: AnalysisMetric
    confidence: float
    satellite: str
    sensor: str
    modality: str
    dataStatus: DataStatus
    cloudCover: float
    observationPeriod: dict  # {beforeDate, afterDate, beforeLabel, afterLabel}
    headline: str
    evidenceNarrative: str
    primaryDrivers: List[str]
    spectralBands: List[dict] = []
    areaAffectedSqKm: float
    spatialEvidence: Optional[List[SpatialEvidenceItem]] = None
    executionPipeline: Optional[List[ExecutionPipelineStage]] = None


class ModelProvenance(BaseModel):
    modelName: str
    backendRuntime: str
    modelVersion: str


class AnalyzeResponse(BaseModel):
    taskId: str
    query: str
    status: Literal["SUCCESS", "ERROR"]
    analysisResult: AnalysisResult
    processingTimeMs: float
    modelProvenance: ModelProvenance
