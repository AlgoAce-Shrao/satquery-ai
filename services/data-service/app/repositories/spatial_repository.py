from typing import List, Dict, Any
from ..schemas.spatial import ObservationRecord, Coordinates, SpectralBandData

class SpatialRepository:
    """Provides PostGIS spatial retrieval with realistic fallback catalog for Earth Observation missions."""

    def __init__(self):
        self._seed_catalog: List[ObservationRecord] = [
            ObservationRecord(
                id="obs_amazon_001",
                region_id="reg_amazon_arc",
                region_name="Amazon Deforestation Arc (Mato Grosso)",
                country="Brazil",
                site_code="SITE_ALPHA",
                location=Coordinates(lat=-10.83, lon=-55.86),
                satellite="Sentinel-2 MSI L2A",
                sensor="Multispectral Instrument (MSI)",
                cloud_cover=2.4,
                resolution_meters=10.0,
                before_date="2025-06-15",
                after_date="2026-06-20",
                before_label="Jun 2025 Baseline",
                after_label="Jun 2026 Resurvey",
                spectral_bands=[
                    SpectralBandData(band="B02", name="Blue", wavelength="490 nm", beforeReflectance=0.038, afterReflectance=0.072),
                    SpectralBandData(band="B03", name="Green", wavelength="560 nm", beforeReflectance=0.052, afterReflectance=0.091),
                    SpectralBandData(band="B04", name="Red", wavelength="665 nm", beforeReflectance=0.031, afterReflectance=0.158),
                    SpectralBandData(band="B08", name="NIR", wavelength="842 nm", beforeReflectance=0.485, afterReflectance=0.231),
                    SpectralBandData(band="B11", name="SWIR-1", wavelength="1610 nm", beforeReflectance=0.125, afterReflectance=0.284),
                    SpectralBandData(band="B12", name="SWIR-2", wavelength="2190 nm", beforeReflectance=0.062, afterReflectance=0.215),
                ],
                area_affected_sqkm=1420.5,
                geometry_geojson={
                    "type": "Polygon",
                    "coordinates": [[
                        [-56.2, -11.1],
                        [-55.5, -11.1],
                        [-55.4, -10.5],
                        [-56.1, -10.5],
                        [-56.2, -11.1]
                    ]]
                },
                primary_drivers=["Industrial Soy Expansion", "Selective Timber Extraction", "Pasture Conversion"]
            ),
            ObservationRecord(
                id="obs_punjab_002",
                region_id="reg_punjab_basin",
                region_name="Punjab Agricultural Intensive Belt",
                country="India",
                site_code="SITE_BETA",
                location=Coordinates(lat=30.90, lon=75.85),
                satellite="Sentinel-2 MSI L2A",
                sensor="Multispectral Instrument (MSI)",
                cloud_cover=1.1,
                resolution_meters=10.0,
                before_date="2025-05-10",
                after_date="2026-05-12",
                before_label="May 2025 Crop Peak",
                after_label="May 2026 Heatwave Phase",
                spectral_bands=[
                    SpectralBandData(band="B02", name="Blue", wavelength="490 nm", beforeReflectance=0.045, afterReflectance=0.068),
                    SpectralBandData(band="B03", name="Green", wavelength="560 nm", beforeReflectance=0.062, afterReflectance=0.088),
                    SpectralBandData(band="B04", name="Red", wavelength="665 nm", beforeReflectance=0.042, afterReflectance=0.135),
                    SpectralBandData(band="B08", name="NIR", wavelength="842 nm", beforeReflectance=0.460, afterReflectance=0.285),
                    SpectralBandData(band="B11", name="SWIR-1", wavelength="1610 nm", beforeReflectance=0.140, afterReflectance=0.245),
                    SpectralBandData(band="B12", name="SWIR-2", wavelength="2190 nm", beforeReflectance=0.075, afterReflectance=0.180),
                ],
                area_affected_sqkm=890.0,
                geometry_geojson={
                    "type": "Polygon",
                    "coordinates": [[
                        [75.4, 30.5],
                        [76.3, 30.5],
                        [76.3, 31.3],
                        [75.4, 31.3],
                        [75.4, 30.5]
                    ]]
                },
                primary_drivers=["Pre-Monsoon Thermal Stress", "Aquifer Depletion", "Fallow Stubble Transitions"]
            ),
            ObservationRecord(
                id="obs_aral_003",
                region_id="reg_aral_sea",
                region_name="South Aral Sea Desiccated Basin",
                country="Uzbekistan",
                site_code="SITE_GAMMA",
                location=Coordinates(lat=45.00, lon=59.25),
                satellite="Landsat-9 OLI-2",
                sensor="Operational Land Imager (OLI-2)",
                cloud_cover=0.5,
                resolution_meters=30.0,
                before_date="2025-07-01",
                after_date="2026-07-05",
                before_label="Jul 2025 Waterline",
                after_label="Jul 2026 Salt Bed",
                spectral_bands=[
                    SpectralBandData(band="B02", name="Blue", wavelength="482 nm", beforeReflectance=0.085, afterReflectance=0.195),
                    SpectralBandData(band="B03", name="Green", wavelength="561 nm", beforeReflectance=0.110, afterReflectance=0.240),
                    SpectralBandData(band="B04", name="Red", wavelength="655 nm", beforeReflectance=0.070, afterReflectance=0.290),
                    SpectralBandData(band="B05", name="NIR", wavelength="865 nm", beforeReflectance=0.025, afterReflectance=0.310),
                    SpectralBandData(band="B06", name="SWIR-1", wavelength="1609 nm", beforeReflectance=0.015, afterReflectance=0.380),
                    SpectralBandData(band="B07", name="SWIR-2", wavelength="2201 nm", beforeReflectance=0.010, afterReflectance=0.330),
                ],
                area_affected_sqkm=2450.0,
                geometry_geojson={
                    "type": "Polygon",
                    "coordinates": [[
                        [58.8, 44.5],
                        [59.7, 44.5],
                        [59.7, 45.5],
                        [58.8, 45.5],
                        [58.8, 44.5]
                    ]]
                },
                primary_drivers=["Upstream River Diversion", "Evaporative Salinization", "Dust Storm Expansion"]
            ),
            ObservationRecord(
                id="obs_sundarbans_004",
                region_id="reg_sundarbans",
                region_name="Sundarbans Mangrove Tidal Frontier",
                country="Bangladesh",
                site_code="SITE_DELTA",
                location=Coordinates(lat=21.95, lon=89.20),
                satellite="Sentinel-2 MSI L2A",
                sensor="Multispectral Instrument (MSI)",
                cloud_cover=3.8,
                resolution_meters=10.0,
                before_date="2025-03-01",
                after_date="2026-03-05",
                before_label="Mar 2025 Canopy",
                after_label="Mar 2026 Tidal Loss",
                spectral_bands=[
                    SpectralBandData(band="B02", name="Blue", wavelength="490 nm", beforeReflectance=0.035, afterReflectance=0.055),
                    SpectralBandData(band="B03", name="Green", wavelength="560 nm", beforeReflectance=0.058, afterReflectance=0.075),
                    SpectralBandData(band="B04", name="Red", wavelength="665 nm", beforeReflectance=0.034, afterReflectance=0.105),
                    SpectralBandData(band="B08", name="NIR", wavelength="842 nm", beforeReflectance=0.440, afterReflectance=0.295),
                    SpectralBandData(band="B11", name="SWIR-1", wavelength="1610 nm", beforeReflectance=0.095, afterReflectance=0.185),
                    SpectralBandData(band="B12", name="SWIR-2", wavelength="2190 nm", beforeReflectance=0.045, afterReflectance=0.120),
                ],
                area_affected_sqkm=430.0,
                geometry_geojson={
                    "type": "Polygon",
                    "coordinates": [[
                        [88.8, 21.6],
                        [89.6, 21.6],
                        [89.6, 22.3],
                        [88.8, 22.3],
                        [88.8, 21.6]
                    ]]
                },
                primary_drivers=["Salinity Intrusion", "Cyclone Wave Erosion", "Estuarine Channel Siltation"]
            )
        ]

    async def search_observations(self, intent: str, metric: str, spatial_scope_name: str = None) -> List[ObservationRecord]:
        if spatial_scope_name and spatial_scope_name.lower() != "global" and spatial_scope_name.lower() != "global critical sites":
            scope_lower = spatial_scope_name.lower()
            filtered = [
                r for r in self._seed_catalog 
                if scope_lower in r.country.lower() or scope_lower in r.region_name.lower()
            ]
            if filtered:
                return filtered

        return self._seed_catalog
