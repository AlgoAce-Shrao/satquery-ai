from typing import List, Literal, Optional

from pydantic import BaseModel, Field


class RasterImageInput(BaseModel):
    filename: str
    content_base64: str = Field(..., description="Raw uploaded image bytes, base64-encoded.")
    timestamp: Optional[str] = Field(None, description="Caller-supplied label for this image, e.g. 'T0'/'T1'.")


class RasterAnalysisRequest(BaseModel):
    mode: Literal["SINGLE", "BI_TEMPORAL"]
    modality: Literal["OPTICAL", "SAR"] = "OPTICAL"
    query: Optional[str] = None
    images: List[RasterImageInput]


class IndexResult(BaseModel):
    name: str
    formula: str
    mean: float
    min: float
    max: float
    interpretation: str
    caveat: Optional[str] = None


class SarStats(BaseModel):
    meanIntensity: float
    stdIntensity: float
    method: str
    caveat: str


class SingleImageAnalysis(BaseModel):
    width: int
    height: int
    bandCount: int
    validPixelFraction: float
    indices: List[IndexResult]
    sarStats: Optional[SarStats] = None


class NdviDelta(BaseModel):
    meanDelta: float
    interpretation: str


class BiTemporalAnalysis(BaseModel):
    alignment: str
    width: int
    height: int
    meanAbsoluteDifference: float
    percentChangedPixels: float
    changeThreshold: float
    changeMaskPngBase64: str
    ndviDelta: Optional[NdviDelta] = None


class ExecutionStep(BaseModel):
    step: str
    tool: str
    detail: str
    durationMs: float


class ConfidenceResult(BaseModel):
    value: float
    method: str


class RasterAnalysisResponse(BaseModel):
    mode: str
    modality: str
    analysisType: str
    decoder: str
    single: Optional[SingleImageAnalysis] = None
    biTemporal: Optional[BiTemporalAnalysis] = None
    confidence: ConfidenceResult
    executionTrace: List[ExecutionStep]
    narrative: str
