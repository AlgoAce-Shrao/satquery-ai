from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from enum import Enum

class IntentType(str, Enum):
    VEGETATION_CHANGE = "vegetation_change"
    WATER_BODY_DYNAMICS = "water_body_dynamics"
    URBAN_EXPANSION = "urban_expansion"
    WILDFIRE_BURN_SEVERITY = "wildfire_burn_severity"
    DROUGHT_IMPACT = "drought_impact"
    GENERAL_GEOSPATIAL = "general_geospatial"

class ChangeDirection(str, Enum):
    DECREASE = "decrease"
    INCREASE = "increase"
    ANY = "any"

class SpectralIndex(str, Enum):
    NDVI = "NDVI"
    NDWI = "NDWI"
    NDBI = "NDBI"
    NBR = "NBR"
    EVI = "EVI"

class SpatialScope(BaseModel):
    type: str = Field(..., description="global, continent, country, or custom_polygon")
    name: Optional[str] = None
    country_code: Optional[str] = None
    bbox: Optional[List[float]] = Field(None, description="[min_lon, min_lat, max_lon, max_lat]")

class TemporalScope(BaseModel):
    start_date: str = Field(..., description="YYYY-MM-DD")
    end_date: str = Field(..., description="YYYY-MM-DD")
    baseline_year: Optional[int] = None
    target_year: Optional[int] = None

class Threshold(BaseModel):
    operator: str = Field("<=", description="<=, >=, <, >, ==")
    value: float = Field(-15.0, description="Numerical threshold")
    unit: str = Field("percent", description="percent, raw_index, or sq_km")

class ParseQueryRequest(BaseModel):
    raw_query: str

class StructuredQueryResponse(BaseModel):
    query_id: str
    raw_query: str
    intent: IntentType
    metric: SpectralIndex
    direction: ChangeDirection
    spatial_scope: SpatialScope
    temporal_scope: TemporalScope
    threshold: Threshold
    satellite_preference: List[str] = ["Sentinel-2", "Landsat-8/9"]
    max_cloud_cover_percent: float = 20.0
    confidence_score: float = 0.95
    model_provider_used: str = "RuleBasedProvider"
