# SatQuery AI — API Contracts

## 1. Natural Language Query & Execution

### `POST /api/query`
Initiates an investigation from user natural language.

**Request:**
```json
{
  "query": "Show me areas where vegetation decreased significantly during the last year.",
  "sessionId": "sess_982341",
  "clientContext": {
    "currentCamera": {
      "lat": 0.0,
      "lon": 0.0,
      "altitude": 20000000
    }
  }
}
```

**Response (200 OK / 202 Accepted):**
```json
{
  "queryId": "qry_883192",
  "status": "COMPLETED",
  "interpretedQuery": {
    "intent": "vegetation_change",
    "direction": "decrease",
    "scope": {
      "type": "global",
      "regionName": "Global Candidate Hotspots"
    },
    "timeRange": {
      "start": "2025-01-01T00:00:00Z",
      "end": "2026-01-01T00:00:00Z"
    },
    "threshold": {
      "operator": "<",
      "value": -15.0,
      "unit": "percent"
    },
    "metric": "NDVI"
  },
  "summary": {
    "totalRegionsFound": 4,
    "primaryDriver": "Drought conditions and agricultural clear-cutting",
    "aiOverview": "Identified 4 primary regions exhibiting severe vegetation decline over the 12-month observation window. Largest localized drop (-34.2%) detected in the Southern Amazon basin."
  },
  "results": [
    {
      "id": "res_amz_01",
      "rank": 1,
      "regionName": "Southern Amazon Basin, Brazil",
      "country": "Brazil",
      "location": {
        "lat": -9.8719,
        "lon": -56.0984,
        "altitude": 750000
      },
      "camera": {
        "lat": -9.8719,
        "lon": -56.0984,
        "altitude": 850000,
        "heading": 0.0,
        "pitch": -60.0
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [[-57.2, -9.1], [-55.1, -9.1], [-55.0, -10.5], [-57.1, -10.4], [-57.2, -9.1]]
        ]
      },
      "metric": {
        "name": "NDVI",
        "beforeValue": 0.72,
        "afterValue": 0.47,
        "percentageChange": -34.72,
        "unit": "index (-1.0 to +1.0)"
      },
      "confidence": 0.94,
      "satellite": "Sentinel-2 MSI",
      "observationPeriod": {
        "before": "2025-01-14",
        "after": "2026-01-18"
      },
      "explanation": "Severe canopy defoliation and clear-cutting boundary expansion along agricultural frontiers in Mato Grosso."
    }
  ],
  "tourConfig": {
    "autoPlay": true,
    "dwellTimeSeconds": 8,
    "transitionDurationSeconds": 3.5
  }
}
```

---

## 2. Query Status / Streaming Telemetry

### `GET /api/query/{id}/status`
Polls or streams execution stages for real-time telemetry.

**Response:**
```json
{
  "queryId": "qry_883192",
  "status": "PROCESSING",
  "currentStep": "RUNNING_VEGETATION_ANALYSIS",
  "stepProgress": 0.65,
  "steps": [
    { "name": "UNDERSTANDING_QUERY", "status": "COMPLETED", "durationMs": 120 },
    { "name": "RETRIEVING_OBSERVATIONS", "status": "COMPLETED", "durationMs": 340 },
    { "name": "RUNNING_VEGETATION_ANALYSIS", "status": "IN_PROGRESS", "durationMs": 410 },
    { "name": "DETECTING_CHANGES", "status": "PENDING" },
    { "name": "PREPARING_VISUALIZATION", "status": "PENDING" }
  ]
}
```

---

## 3. Python AI/ML Service Endpoints

### `POST /ai/analysis/vegetation`
**Request:**
```json
{
  "scope": { "type": "bbox", "coordinates": [-60.0, -15.0, -50.0, -5.0] },
  "beforeTimestamp": "2025-01-01",
  "afterTimestamp": "2026-01-01",
  "thresholdChange": -0.15
}
```
**Response:**
```json
{
  "status": "SUCCESS",
  "metric": "NDVI",
  "candidateRegions": [ ... ]
}
```
