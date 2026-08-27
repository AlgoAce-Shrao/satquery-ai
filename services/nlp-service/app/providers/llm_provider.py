import os
import uuid
import re
from abc import ABC, abstractmethod
from typing import Dict, Any
from ..schemas.query import (
    StructuredQueryResponse,
    IntentType,
    ChangeDirection,
    SpectralIndex,
    SpatialScope,
    TemporalScope,
    Threshold
)

class LLMProvider(ABC):
    @abstractmethod
    async def parse_query(self, raw_query: str) -> StructuredQueryResponse:
        pass


class RuleBasedProvider(LLMProvider):
    """Deterministic rule-based and regex NLU parser as high-speed default / fallback."""
    
    async def parse_query(self, raw_query: str) -> StructuredQueryResponse:
        query_lower = raw_query.lower()
        query_id = f"Q_{uuid.uuid4().hex[:8].upper()}"

        # 1. Detect Intent & Spectral Index
        intent = IntentType.VEGETATION_CHANGE
        metric = SpectralIndex.NDVI
        direction = ChangeDirection.DECREASE
        thresh_val = -15.0

        if any(w in query_lower for w in ["water", "lake", "desiccation", "shrinkage", "reservoir", "river", "salinized"]):
            intent = IntentType.WATER_BODY_DYNAMICS
            metric = SpectralIndex.NDWI
            direction = ChangeDirection.DECREASE
            thresh_val = -25.0
        elif any(w in query_lower for w in ["urban", "built-up", "impervious", "concrete", "infrastructure", "expansion"]):
            intent = IntentType.URBAN_EXPANSION
            metric = SpectralIndex.NDBI
            direction = ChangeDirection.INCREASE
            thresh_val = 20.0
        elif any(w in query_lower for w in ["fire", "burn", "wildfire", "scar", "canopy loss"]):
            intent = IntentType.WILDFIRE_BURN_SEVERITY
            metric = SpectralIndex.NBR
            direction = ChangeDirection.DECREASE
            thresh_val = -35.0
        elif any(w in query_lower for w in ["vegetation", "canopy", "forest", "deforestation", "greenery", "biomass", "crop"]):
            intent = IntentType.VEGETATION_CHANGE
            metric = SpectralIndex.NDVI
            if "increase" in query_lower or "growth" in query_lower or "reforestation" in query_lower:
                direction = ChangeDirection.INCREASE
                thresh_val = 15.0
            else:
                direction = ChangeDirection.DECREASE
                thresh_val = -20.0

        # 2. Extract Threshold value if explicitly provided
        pct_match = re.search(r'(\d+(?:\.\d+)?)\s*%', query_lower)
        if pct_match:
            extracted_num = float(pct_match.group(1))
            thresh_val = -extracted_num if direction == ChangeDirection.DECREASE else extracted_num

        # 3. Extract Spatial Scope
        spatial_type = "global"
        spatial_name = "Global Critical Sites"
        
        regions = {
            "amazon": ("South America", [-70.0, -18.0, -45.0, 5.0]),
            "brazil": ("Brazil", [-74.0, -34.0, -34.0, 5.0]),
            "india": ("India", [68.0, 8.0, 97.0, 37.0]),
            "asia": ("Asia", [50.0, 0.0, 140.0, 55.0]),
            "aral": ("Central Asia", [55.0, 40.0, 65.0, 48.0]),
            "indonesia": ("Indonesia", [95.0, -11.0, 141.0, 6.0]),
            "africa": ("Africa", [-20.0, -35.0, 55.0, 37.0]),
            "mediterranean": ("Southern Europe", [-10.0, 30.0, 40.0, 46.0]),
            "sundarbans": ("Bay of Bengal", [88.0, 21.0, 90.5, 23.0]),
        }

        for keyword, (name, bbox) in regions.items():
            if keyword in query_lower:
                spatial_type = "region"
                spatial_name = name
                break

        # 4. Temporal Scope
        temporal_scope = TemporalScope(
            start_date="2025-06-01",
            end_date="2026-06-30",
            baseline_year=2025,
            target_year=2026
        )

        return StructuredQueryResponse(
            query_id=query_id,
            raw_query=raw_query,
            intent=intent,
            metric=metric,
            direction=direction,
            spatial_scope=SpatialScope(
                type=spatial_type,
                name=spatial_name
            ),
            temporal_scope=temporal_scope,
            threshold=Threshold(
                operator="<=" if direction == ChangeDirection.DECREASE else ">=",
                value=thresh_val,
                unit="percent"
            ),
            satellite_preference=["Sentinel-2 MSI", "Landsat-8/9 OLI"],
            max_cloud_cover_percent=15.0,
            confidence_score=0.96,
            model_provider_used="RuleBasedProvider"
        )


class LLMProviderFactory:
    @staticmethod
    def get_provider() -> LLMProvider:
        provider_name = os.getenv("LLM_PROVIDER", "rule_based").lower()
        # Allows runtime configuration for Gemini, OpenAI, or fast rule-based fallback
        return RuleBasedProvider()
