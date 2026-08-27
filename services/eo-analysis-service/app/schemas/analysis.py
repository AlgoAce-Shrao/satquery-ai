from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class BandInput(BaseModel):
    band: str
    name: str
    wavelength: str
    beforeReflectance: float
    afterReflectance: float

class ObservationInput(BaseModel):
    id: str
    region_id: str
    region_name: str
    country: str
    site_code: str
    location: Dict[str, float]
    satellite: str
    sensor: str
    cloud_cover: float
    resolution_meters: float
    before_date: str
    after_date: str
    before_label: str
    after_label: str
    spectral_bands: List[BandInput]
    area_affected_sqkm: float
    geometry_geojson: Dict[str, Any]
    primary_drivers: List[str]

class PerformAnalysisRequest(BaseModel):
    metric: str
    intent: str
    direction: str
    observations: List[ObservationInput]

class AnalyzedMetric(BaseModel):
    name: str
    beforeValue: float
    afterValue: float
    percentageChange: float
    unit: str = "index_unit"
    severity: str

class AnalyzedRegionResult(BaseModel):
    id: str
    siteCode: str
    regionName: str
    country: str
    location: Dict[str, float]
    geometry: Dict[str, Any]
    metric: AnalyzedMetric
    confidence: float
    headline: str
    evidenceNarrative: str
    primaryDrivers: List[str]
    satellite: str
    sensor: str
    cloudCover: float
    areaAffectedSqKm: float
    observationPeriod: Dict[str, str]
    spectralBands: List[BandInput]

class AnalysisResponse(BaseModel):
    total_analyzed: int
    results: List[AnalyzedRegionResult]
