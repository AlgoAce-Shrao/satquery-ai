# SatQuery AI — API Reference Manual

This document provides the complete API contracts for all services across the SatQuery AI platform.

---

## 1. Spring Boot Orchestrator Gateway (Port 8080)

Base URL: `http://localhost:8080` (or `https://<gateway-domain>`)

### 1.1 Health Check

- **Method**: `GET`
- **Route**: `/api/v1/health`
- **Authentication**: None
- **Description**: Returns the runtime status and version of the Spring Boot orchestrator.

#### Response (200 OK)
```json
{
  "status": "UP",
  "service": "spring-boot-orchestrator",
  "version": "1.0.0"
}
```

---

### 1.2 Query Pipeline Execution

- **Method**: `POST`
- **Route**: `/api/v1/query`
- **Headers**: `Content-Type: application/json`
- **Authentication**: None (Configurable in production)
- **Description**: Accepts natural language queries, coordinates NLP parsing, spatial data retrieval, and multi-spectral EO analytics.

#### Request Body
```json
{
  "query": "Identify major canopy loss and deforestation across the Amazon arc exceeding 15%"
}
```

#### Response (200 OK)
```json
{
  "queryId": "Q_A89F3B21",
  "rawQuery": "Identify major canopy loss and deforestation across the Amazon arc exceeding 15%",
  "structuredQuery": {
    "query_id": "Q_A89F3B21",
    "raw_query": "Identify major canopy loss and deforestation across the Amazon arc exceeding 15%",
    "intent": "vegetation_change",
    "metric": "NDVI",
    "direction": "decrease",
    "spatial_scope": {
      "type": "region",
      "name": "Brazil",
      "bbox": [-74.0, -34.0, -34.0, 5.0]
    },
    "temporal_scope": {
      "start_date": "2025-06-01",
      "end_date": "2026-06-30",
      "baseline_year": 2025,
      "target_year": 2026
    },
    "threshold": {
      "operator": "<=",
      "value": -15.0,
      "unit": "percent"
    },
    "satellite_preference": ["Sentinel-2 MSI", "Landsat-8/9 OLI"],
    "max_cloud_cover_percent": 15.0,
    "confidence_score": 0.96,
    "model_provider_used": "RuleBasedProvider"
  },
  "results": [
    {
      "id": "res_obs_amazon_001",
      "siteCode": "SITE_ALPHA",
      "regionName": "Amazon Deforestation Arc (Mato Grosso)",
      "country": "Brazil",
      "location": {
        "lat": -10.83,
        "lon": -55.86
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [-56.2, -11.1],
          [-55.5, -11.1],
          [-55.4, -10.5],
          [-56.1, -10.5],
          [-56.2, -11.1]
        ]]
      },
      "metric": {
        "name": "NDVI Difference",
        "beforeValue": 0.88,
        "afterValue": 0.19,
        "percentageChange": -78.4,
        "unit": "index_unit",
        "severity": "CRITICAL"
      },
      "confidence": 0.91,
      "headline": "Significant Canopy Loss & Defoliation (-78.4% NDVI)",
      "evidenceNarrative": "Multi-temporal BOA reflectance from Sentinel-2 MSI L2A reveals NIR Band 8 attenuation coupled with Red Band 4 spectral backscatter increases across 1,421 km², indicating widespread canopy clearance and altered photosynthetic biomass.",
      "primaryDrivers": [
        "Industrial Soy Expansion",
        "Selective Timber Extraction",
        "Pasture Conversion"
      ],
      "satellite": "Sentinel-2 MSI L2A",
      "sensor": "Multispectral Instrument (MSI)",
      "cloudCover": 2.4,
      "areaAffectedSqKm": 1420.5,
      "observationPeriod": {
        "beforeDate": "2025-06-15",
        "afterDate": "2026-06-20",
        "beforeLabel": "Jun 2025 Baseline",
        "afterLabel": "Jun 2026 Resurvey"
      },
      "spectralBands": [
        { "band": "B02", "name": "Blue", "wavelength": "490 nm", "beforeReflectance": 0.038, "afterReflectance": 0.072 },
        { "band": "B03", "name": "Green", "wavelength": "560 nm", "beforeReflectance": 0.052, "afterReflectance": 0.091 },
        { "band": "B04", "name": "Red", "wavelength": "665 nm", "beforeReflectance": 0.031, "afterReflectance": 0.158 },
        { "band": "B08", "name": "NIR", "wavelength": "842 nm", "beforeReflectance": 0.485, "afterReflectance": 0.231 },
        { "band": "B11", "name": "SWIR-1", "wavelength": "1610 nm", "beforeReflectance": 0.125, "afterReflectance": 0.284 },
        { "band": "B12", "name": "SWIR-2", "wavelength": "2190 nm", "beforeReflectance": 0.062, "afterReflectance": 0.215 }
      ]
    }
  ],
  "visualization": {
    "mode": "tour",
    "autoNavigate": true,
    "cameraAltitudeMeters": 1500000
  },
  "status": "COMPLETED"
}
```

#### Error Response (400 Bad Request)
```json
{
  "error": "Query string cannot be empty."
}
```

---

## 2. NLP & Query Intelligence Service (Port 8001)

Base URL: `http://localhost:8001` (or `http://nlp-service:8001`)

### 2.1 Health Check
- **Method**: `GET`
- **Route**: `/health`
- **Response**: `{"status": "HEALTHY", "service": "nlp-service", "version": "1.0.0"}`

### 2.2 Parse Natural Language Query
- **Method**: `POST`
- **Route**: `/api/v1/nlp/parse`
- **Request Body**:
```json
{
  "raw_query": "Water contraction in Aral sea basin"
}
```
- **Response**: Structured JSON object matching `StructuredQueryResponse` schema.

---

## 3. PostGIS Spatial Data Service (Port 8002)

Base URL: `http://localhost:8002` (or `http://data-service:8002`)

### 3.1 Health Check
- **Method**: `GET`
- **Route**: `/health`
- **Response**: `{"status": "HEALTHY", "service": "data-service", "spatial_backend": "PostGIS / In-Memory Catalog"}`

### 3.2 Spatial Observation Search
- **Method**: `POST`
- **Route**: `/api/v1/spatial/search`
- **Request Body**:
```json
{
  "intent": "water_body_dynamics",
  "metric": "NDWI",
  "spatial_scope_name": "Central Asia",
  "max_cloud_cover": 20.0,
  "limit": 10
}
```
- **Response**:
```json
{
  "total_matched": 1,
  "records": [
    {
      "id": "obs_aral_003",
      "region_id": "reg_aral_sea",
      "region_name": "South Aral Sea Desiccated Basin",
      "country": "Uzbekistan",
      "site_code": "SITE_GAMMA",
      "location": { "lat": 45.00, "lon": 59.25 },
      "satellite": "Landsat-9 OLI-2",
      "sensor": "Operational Land Imager (OLI-2)",
      "cloud_cover": 0.5,
      "resolution_meters": 30.0,
      "before_date": "2025-07-01",
      "after_date": "2026-07-05",
      "before_label": "Jul 2025 Waterline",
      "after_label": "Jul 2026 Salt Bed",
      "spectral_bands": [ ... ],
      "area_affected_sqkm": 2450.0,
      "geometry_geojson": { "type": "Polygon", "coordinates": [...] },
      "primary_drivers": ["Upstream River Diversion", "Evaporative Salinization"]
    }
  ]
}
```

---

## 4. Earth Observation Analysis Service (Port 8003)

Base URL: `http://localhost:8003` (or `http://eo-analysis-service:8003`)

### 4.1 Health Check
- **Method**: `GET`
- **Route**: `/health`
- **Response**: `{"status": "HEALTHY", "service": "eo-analysis-service", "supported_indices": ["NDVI", "NDWI", "NDBI", "NBR", "EVI"]}`

### 4.2 Multi-Spectral Analysis & Delta Computation
- **Method**: `POST`
- **Route**: `/api/v1/eo/analyze`
- **Request Body**:
```json
{
  "metric": "NDVI",
  "intent": "vegetation_change",
  "direction": "decrease",
  "observations": [ ... ]
}
```
- **Response**:
```json
{
  "total_analyzed": 1,
  "results": [ ... ]
}
```

---

## 5. Colab ML / GPU Inference Server Interface (Optional Backend)

Endpoint configured via `VITE_COLAB_INFERENCE_URL` in frontend.

### 5.1 Health Check
- **Method**: `GET`
- **Route**: `/health`
- **Response**: `{"status": "healthy", "gpu_available": true, "model_loaded": "satquery-v1-multimodal"}`

### 5.2 Deep Learning Vision Analysis
- **Method**: `POST`
- **Route**: `/api/v1/analyze`
- **Payload**: Multi-part form or JSON with base64 raster tensors, tool identifier, and parameters.
