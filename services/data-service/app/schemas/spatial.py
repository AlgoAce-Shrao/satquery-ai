from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class Coordinates(BaseModel):
    lat: float
    lon: float

class SpectralBandData(BaseModel):
    band: str
    name: str
    wavelength: str
    beforeReflectance: float
    afterReflectance: float

class ObservationRecord(BaseModel):
    id: str
    region_id: str
    region_name: str
    country: str
    site_code: str
    location: Coordinates
    satellite: str
    sensor: str
    cloud_cover: float
    resolution_meters: float
    before_date: str
    after_date: str
    before_label: str
    after_label: str
    spectral_bands: List[SpectralBandData]
    area_affected_sqkm: float
    geometry_geojson: Dict[str, Any]
    primary_drivers: List[str]

class SpatialQueryRequest(BaseModel):
    intent: str
    metric: str
    spatial_scope_name: Optional[str] = None
    max_cloud_cover: Optional[float] = 20.0
    limit: Optional[int] = 10

class SpatialQueryResponse(BaseModel):
    total_matched: int
    records: List[ObservationRecord]
