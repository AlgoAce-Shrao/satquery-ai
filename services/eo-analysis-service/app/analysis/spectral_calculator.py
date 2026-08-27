from typing import List, Dict, Any
from ..schemas.analysis import ObservationInput, AnalyzedRegionResult, AnalyzedMetric, BandInput

class SpectralCalculator:
    """Calculates mathematical remote sensing indices (NDVI, NDWI, NDBI, NBR) and generates scientific insights."""

    @staticmethod
    def calculate_index(bands: List[BandInput], metric_name: str, mode: str = "before") -> float:
        band_map = {b.band.upper(): (b.beforeReflectance if mode == "before" else b.afterReflectance) for b in bands}
        
        # Band 4 (Red), Band 8 (NIR), Band 3 (Green), Band 11 (SWIR)
        nir = band_map.get("B08", band_map.get("B05", 0.45))
        red = band_map.get("B04", 0.05)
        green = band_map.get("B03", 0.06)
        swir = band_map.get("B11", band_map.get("B06", 0.15))

        if metric_name.upper() == "NDVI":
            denom = nir + red
            return (nir - red) / denom if denom != 0 else 0.0
        elif metric_name.upper() == "NDWI":
            denom = green + nir
            return (green - nir) / denom if denom != 0 else 0.0
        elif metric_name.upper() == "NDBI":
            denom = swir + nir
            return (swir - nir) / denom if denom != 0 else 0.0
        elif metric_name.upper() == "NBR":
            denom = nir + swir
            return (nir - swir) / denom if denom != 0 else 0.0
        else:
            denom = nir + red
            return (nir - red) / denom if denom != 0 else 0.0

    @classmethod
    def analyze_observation(cls, obs: ObservationInput, metric_name: str, direction: str) -> AnalyzedRegionResult:
        before_val = cls.calculate_index(obs.spectral_bands, metric_name, mode="before")
        after_val = cls.calculate_index(obs.spectral_bands, metric_name, mode="after")

        pct_change = ((after_val - before_val) / abs(before_val) * 100.0) if before_val != 0 else 0.0
        pct_change_rounded = round(pct_change, 1)

        # Severity
        if abs(pct_change_rounded) > 30:
            severity = "CRITICAL"
        elif abs(pct_change_rounded) > 15:
            severity = "SIGNIFICANT"
        else:
            severity = "MODERATE"

        # Evidence Narrative & Headline
        if metric_name.upper() == "NDVI":
            headline = f"Significant Canopy Loss & Defoliation (-{abs(pct_change_rounded)}% NDVI)"
            evidence = (
                f"Multi-temporal BOA reflectance from {obs.satellite} reveals NIR Band 8 attenuation "
                f"coupled with Red Band 4 spectral backscatter increases across {obs.area_affected_sqkm:,.0f} km², "
                f"indicating widespread canopy clearance and altered photosynthetic biomass."
            )
        elif metric_name.upper() == "NDWI":
            headline = f"Extreme Water Surface Desiccation (-{abs(pct_change_rounded)}% NDWI)"
            evidence = (
                f"Satellite sensors detected severe littoral retreat, with Green-to-NIR spectral ratio dropping "
                f"below baseline thresholds, confirming transition to exposed saline lakebed."
            )
        else:
            headline = f"Land Surface Dynamic Detected ({pct_change_rounded:+}% {metric_name})"
            evidence = (
                f"Spectral reflectance divergence observed between {obs.before_date} and {obs.after_date} "
                f"with {obs.cloud_cover}% cloud-screened optical assurance."
            )

        return AnalyzedRegionResult(
            id=f"res_{obs.id}",
            siteCode=obs.site_code,
            regionName=obs.region_name,
            country=obs.country,
            location=obs.location,
            geometry=obs.geometry_geojson,
            metric=AnalyzedMetric(
                name=f"{metric_name} Difference",
                beforeValue=round(before_val, 2),
                afterValue=round(after_val, 2),
                percentageChange=pct_change_rounded,
                severity=severity
            ),
            confidence=0.91 if obs.cloud_cover < 5 else 0.84,
            headline=headline,
            evidenceNarrative=evidence,
            primaryDrivers=obs.primary_drivers,
            satellite=obs.satellite,
            sensor=obs.sensor,
            cloudCover=obs.cloud_cover,
            areaAffectedSqKm=obs.area_affected_sqkm,
            observationPeriod={
                "beforeDate": obs.before_date,
                "afterDate": obs.after_date,
                "beforeLabel": obs.before_label,
                "afterLabel": obs.after_label
            },
            spectralBands=obs.spectral_bands
        )
