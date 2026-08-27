import json
import logging
import os
from datetime import date
from typing import Any, List, Optional

import asyncpg

from ..schemas.spatial import Coordinates, ObservationRecord, SpectralBandData

logger = logging.getLogger(__name__)


class SpatialRepository:
    """Reads the observation catalog from PostGIS with an explicit development-only seed fallback."""

    def __init__(self) -> None:
        self._database_url = os.getenv("DATABASE_URL", "")
        self._allow_seed_fallback = os.getenv("DATA_SERVICE_ALLOW_SEED_FALLBACK", "false").lower() == "true"
        self._pool: Optional[asyncpg.Pool] = None
        self._database_error: Optional[str] = None
        self._seed_catalog = self._create_seed_catalog()

    async def connect(self) -> None:
        if not self._database_url:
            self._database_error = "DATABASE_URL is not configured."
            if self._allow_seed_fallback:
                logger.warning("%s Using the explicit seed fallback.", self._database_error)
            else:
                logger.error(self._database_error)
            return

        try:
            self._pool = await asyncpg.create_pool(
                dsn=self._database_url,
                min_size=1,
                max_size=5,
                command_timeout=10,
            )
            async with self._pool.acquire() as connection:
                await connection.fetchval("SELECT 1")
            self._database_error = None
            logger.info("Connected to the PostGIS observation catalog.")
        except Exception as error:
            self._pool = None
            self._database_error = str(error)
            if self._allow_seed_fallback:
                logger.warning("PostGIS connection failed; using the explicit seed fallback: %s", error)
            else:
                logger.error("PostGIS connection failed: %s", error)

    async def close(self) -> None:
        if self._pool:
            await self._pool.close()
            self._pool = None

    @property
    def is_ready(self) -> bool:
        return self._pool is not None or self._allow_seed_fallback

    @property
    def backend_name(self) -> str:
        return "PostGIS" if self._pool else "Seed fallback"

    @property
    def database_error(self) -> Optional[str]:
        return self._database_error

    async def search_observations(
        self,
        intent: str,
        metric: str,
        spatial_scope_name: Optional[str] = None,
        max_cloud_cover: float = 20.0,
        limit: int = 10,
    ) -> List[ObservationRecord]:
        if self._pool:
            return await self._search_postgis(spatial_scope_name, max_cloud_cover, limit)

        if self._allow_seed_fallback:
            return self._search_seed_catalog(spatial_scope_name, max_cloud_cover, limit)

        raise RuntimeError(self._database_error or "PostGIS is unavailable.")

    async def _search_postgis(
        self,
        spatial_scope_name: Optional[str],
        max_cloud_cover: float,
        limit: int,
    ) -> List[ObservationRecord]:
        if not self._pool:
            raise RuntimeError("PostGIS is unavailable.")

        normalized_scope = (spatial_scope_name or "").strip().lower()
        use_scope = normalized_scope not in {"", "global", "global critical sites"}
        query = """
            SELECT
                o.id,
                o.region_id,
                r.name AS region_name,
                r.country,
                'SITE_' || upper(replace(o.id, 'obs_', '')) AS site_code,
                ST_Y(r.centroid) AS lat,
                ST_X(r.centroid) AS lon,
                o.satellite,
                o.sensor,
                o.cloud_cover_percent AS cloud_cover,
                o.resolution_meters,
                o.acquisition_date AS after_date,
                o.acquisition_date - INTERVAL '1 year' AS before_date,
                o.spectral_bands,
                r.area_sqkm AS area_affected_sqkm,
                ST_AsGeoJSON(COALESCE(o.footprint, ST_GeometryN(r.geom, 1)))::json AS geometry_geojson
            FROM observations o
            INNER JOIN regions r ON r.id = o.region_id
            WHERE o.cloud_cover_percent <= $1
              AND (
                NOT $2::boolean
                OR lower(r.name) LIKE '%' || $3 || '%'
                OR lower(r.country) LIKE '%' || $3 || '%'
                OR lower(COALESCE(r.continent, '')) LIKE '%' || $3 || '%'
              )
            ORDER BY o.acquisition_date DESC, o.cloud_cover_percent ASC
            LIMIT $4
        """
        async with self._pool.acquire() as connection:
            rows = await connection.fetch(query, max_cloud_cover, use_scope, normalized_scope, limit)
            # A parser label may be broader than the catalog terminology; return global results in that case.
            if use_scope and not rows:
                rows = await connection.fetch(query, max_cloud_cover, False, "", limit)

        return [self._record_from_row(row) for row in rows]

    def _record_from_row(self, row: asyncpg.Record) -> ObservationRecord:
        spectral_bands = row["spectral_bands"]
        if isinstance(spectral_bands, str):
            spectral_bands = json.loads(spectral_bands)
        geometry = row["geometry_geojson"]
        if isinstance(geometry, str):
            geometry = json.loads(geometry)

        before_date = row["before_date"]
        after_date = row["after_date"]
        return ObservationRecord(
            id=row["id"],
            region_id=row["region_id"],
            region_name=row["region_name"],
            country=row["country"],
            site_code=row["site_code"],
            location=Coordinates(lat=float(row["lat"]), lon=float(row["lon"])),
            satellite=row["satellite"],
            sensor=row["sensor"],
            cloud_cover=float(row["cloud_cover"]),
            resolution_meters=float(row["resolution_meters"]),
            before_date=self._date_string(before_date),
            after_date=self._date_string(after_date),
            before_label=f"{self._date_string(before_date)} baseline",
            after_label=f"{self._date_string(after_date)} observation",
            spectral_bands=[SpectralBandData(**band) for band in spectral_bands],
            area_affected_sqkm=float(row["area_affected_sqkm"]),
            geometry_geojson=geometry,
            primary_drivers=["Catalogued PostGIS observation"],
        )

    @staticmethod
    def _date_string(value: Any) -> str:
        return value.isoformat() if isinstance(value, date) else str(value)

    def _search_seed_catalog(
        self,
        spatial_scope_name: Optional[str],
        max_cloud_cover: float,
        limit: int,
    ) -> List[ObservationRecord]:
        records = [record for record in self._seed_catalog if record.cloud_cover <= max_cloud_cover]
        normalized_scope = (spatial_scope_name or "").strip().lower()
        if normalized_scope not in {"", "global", "global critical sites"}:
            matching_records = [
                record
                for record in records
                if normalized_scope in record.country.lower() or normalized_scope in record.region_name.lower()
            ]
            if matching_records:
                records = matching_records
        return records[:limit]

    @staticmethod
    def _create_seed_catalog() -> List[ObservationRecord]:
        return [
            ObservationRecord(
                id="obs_amazon_001", region_id="reg_amazon_arc", region_name="Amazon Deforestation Arc (Mato Grosso)",
                country="Brazil", site_code="SITE_ALPHA", location=Coordinates(lat=-10.83, lon=-55.86),
                satellite="Sentinel-2 MSI L2A", sensor="Multispectral Instrument (MSI)", cloud_cover=2.4,
                resolution_meters=10.0, before_date="2025-06-15", after_date="2026-06-20",
                before_label="Jun 2025 Baseline", after_label="Jun 2026 Resurvey",
                spectral_bands=[
                    SpectralBandData(band="B02", name="Blue", wavelength="490 nm", beforeReflectance=0.038, afterReflectance=0.072),
                    SpectralBandData(band="B03", name="Green", wavelength="560 nm", beforeReflectance=0.052, afterReflectance=0.091),
                    SpectralBandData(band="B04", name="Red", wavelength="665 nm", beforeReflectance=0.031, afterReflectance=0.158),
                    SpectralBandData(band="B08", name="NIR", wavelength="842 nm", beforeReflectance=0.485, afterReflectance=0.231),
                    SpectralBandData(band="B11", name="SWIR-1", wavelength="1610 nm", beforeReflectance=0.125, afterReflectance=0.284),
                ], area_affected_sqkm=1420.5,
                geometry_geojson={"type": "Polygon", "coordinates": [[[-56.2, -11.1], [-55.5, -11.1], [-55.4, -10.5], [-56.1, -10.5], [-56.2, -11.1]]]},
                primary_drivers=["Industrial Soy Expansion", "Selective Timber Extraction", "Pasture Conversion"],
            ),
            ObservationRecord(
                id="obs_punjab_002", region_id="reg_punjab_basin", region_name="Punjab Agricultural Intensive Belt",
                country="India", site_code="SITE_BETA", location=Coordinates(lat=30.90, lon=75.85),
                satellite="Sentinel-2 MSI L2A", sensor="Multispectral Instrument (MSI)", cloud_cover=1.1,
                resolution_meters=10.0, before_date="2025-05-10", after_date="2026-05-12",
                before_label="May 2025 Crop Peak", after_label="May 2026 Heatwave Phase",
                spectral_bands=[
                    SpectralBandData(band="B03", name="Green", wavelength="560 nm", beforeReflectance=0.062, afterReflectance=0.088),
                    SpectralBandData(band="B04", name="Red", wavelength="665 nm", beforeReflectance=0.042, afterReflectance=0.135),
                    SpectralBandData(band="B08", name="NIR", wavelength="842 nm", beforeReflectance=0.460, afterReflectance=0.285),
                    SpectralBandData(band="B11", name="SWIR-1", wavelength="1610 nm", beforeReflectance=0.140, afterReflectance=0.245),
                ], area_affected_sqkm=890.0,
                geometry_geojson={"type": "Polygon", "coordinates": [[[75.4, 30.5], [76.3, 30.5], [76.3, 31.3], [75.4, 31.3], [75.4, 30.5]]]},
                primary_drivers=["Pre-Monsoon Thermal Stress", "Aquifer Depletion", "Fallow Stubble Transitions"],
            ),
            ObservationRecord(
                id="obs_aral_003", region_id="reg_aral_sea", region_name="South Aral Sea Desiccated Basin",
                country="Uzbekistan", site_code="SITE_GAMMA", location=Coordinates(lat=45.00, lon=59.25),
                satellite="Landsat-9 OLI-2", sensor="Operational Land Imager (OLI)", cloud_cover=0.5,
                resolution_meters=30.0, before_date="2025-07-01", after_date="2026-07-05",
                before_label="Jul 2025 Waterline", after_label="Jul 2026 Salt Bed",
                spectral_bands=[
                    SpectralBandData(band="B03", name="Green", wavelength="561 nm", beforeReflectance=0.110, afterReflectance=0.240),
                    SpectralBandData(band="B04", name="Red", wavelength="655 nm", beforeReflectance=0.070, afterReflectance=0.290),
                    SpectralBandData(band="B05", name="NIR", wavelength="865 nm", beforeReflectance=0.025, afterReflectance=0.310),
                    SpectralBandData(band="B06", name="SWIR-1", wavelength="1609 nm", beforeReflectance=0.015, afterReflectance=0.380),
                ], area_affected_sqkm=2450.0,
                geometry_geojson={"type": "Polygon", "coordinates": [[[58.8, 44.5], [59.7, 44.5], [59.7, 45.5], [58.8, 45.5], [58.8, 44.5]]]},
                primary_drivers=["Upstream River Diversion", "Evaporative Salinization", "Dust Storm Expansion"],
            ),
            ObservationRecord(
                id="obs_sundarbans_004", region_id="reg_sundarbans", region_name="Sundarbans Mangrove Tidal Frontier",
                country="Bangladesh", site_code="SITE_DELTA", location=Coordinates(lat=21.95, lon=89.20),
                satellite="Sentinel-2 MSI L2A", sensor="Multispectral Instrument (MSI)", cloud_cover=3.8,
                resolution_meters=10.0, before_date="2025-03-01", after_date="2026-03-05",
                before_label="Mar 2025 Canopy", after_label="Mar 2026 Tidal Loss",
                spectral_bands=[
                    SpectralBandData(band="B03", name="Green", wavelength="560 nm", beforeReflectance=0.058, afterReflectance=0.075),
                    SpectralBandData(band="B04", name="Red", wavelength="665 nm", beforeReflectance=0.034, afterReflectance=0.105),
                    SpectralBandData(band="B08", name="NIR", wavelength="842 nm", beforeReflectance=0.440, afterReflectance=0.295),
                    SpectralBandData(band="B11", name="SWIR-1", wavelength="1610 nm", beforeReflectance=0.095, afterReflectance=0.185),
                ], area_affected_sqkm=430.0,
                geometry_geojson={"type": "Polygon", "coordinates": [[[88.8, 21.6], [89.6, 21.6], [89.6, 22.3], [88.8, 22.3], [88.8, 21.6]]]},
                primary_drivers=["Salinity Intrusion", "Cyclone Wave Erosion", "Estuarine Channel Siltation"],
            ),
        ]
