# SatQuery AI — Security & Hardening Policy

This document outlines the security architecture, risk mitigation measures, and deployment hardening standards for SatQuery AI.

---

## 1. Secrets Management & Zero-Credentials Policy

- **No Hardcoded Credentials**: Source code contains zero hardcoded API keys, tokens, or production passwords. All secrets are configured strictly through environment variables.
- **Git Hygiene**: `.gitignore` comprehensively excludes `.env`, `.env.*`, and temporary build artifacts.
- **Client-Side Secret Isolation**: Variables exposed to the browser build must strictly use the `VITE_` prefix and never include backend database passwords or privileged service keys.

---

## 2. Network Segmentation & Port Exposure

In a hardened production deployment:

```text
INTERNET
   │ (HTTPS 443 only)
   ▼
[ Frontend CDN / Nginx Proxy ]
   │
   ▼
[ Spring Boot Gateway (8080) ]
   │  (Internal Private Subnet Only — Non-Exposed)
   ├───► NLP Service (8001)
   ├───► Data Service (8002)
   ├───► EO Analysis Service (8003)
   └───► PostGIS Database (5432)
```

- **Only the Frontend (Port 3000 / 443) and Spring Boot Gateway (Port 8080) should ever receive incoming public ingress.**
- **Downstream Python microservices (`nlp-service`, `data-service`, `eo-analysis-service`) and the PostgreSQL database (`5432`) MUST remain isolated within a private Docker network or VPC subnet.**

---

## 3. Input Validation & Injection Prevention

- **Spring Boot Gateway**: Incoming query payloads are strictly checked against null/empty strings and validated via typed DTO records (`QueryRequest`).
- **Python FastAPI Services**: All endpoints use Pydantic models with strict type enforcement (`ParseQueryRequest`, `SpatialQueryRequest`, `PerformAnalysisRequest`).
- **SQL / PostGIS Injection Prevention**: Spatial queries utilize parameterized queries and Shapely/PostGIS geometry functions rather than raw concatenated SQL strings.

---

## 4. File & Imagery Ingestion Security

SatQuery AI's `UploadWizardModal` and `ImageInspector` implement defense-in-depth raster validation:

- **Client-Side Format Validation**: Images are inspected before processing to ensure supported raster encodings (GeoTIFF, PNG, JPEG, WebP).
- **Dimension and Memory Limits**: Raster dimensions are checked to prevent browser memory exhaustion (OOM) or decompression bomb attacks.
- **No Unsafe Execution**: Uploaded rasters are decoded purely as mathematical pixel arrays and textures without executing server-side shell scripts.

---

## 5. CORS & Production Headers

- **Gateway CORS Policy**: In development, CORS is open (`*`) to allow seamless multi-host testing. In production, configure Spring Boot `WebMvcConfigurer` to restrict allowed origins to your production frontend domain (e.g. `https://app.satquery.ai`).
- **Nginx Security Headers**: In production Nginx deployments, apply:
  ```nginx
  add_header X-Frame-Options "SAMEORIGIN" always;
  add_header X-Content-Type-Options "nosniff" always;
  add_header X-XSS-Protection "1; mode=block" always;
  add_header Referrer-Policy "strict-origin-when-cross-origin" always;
  ```

---

## 6. Secret Rotation Procedure

If credentials or API keys must be rotated:
1. Generate new keys in the respective provider console (e.g., Google AI Studio, Cesium Ion).
2. Update the environment variables in your hosting orchestrator (e.g., Cloud Run / AWS ECS / `.env`).
3. Trigger a rolling restart of the affected containers (`docker compose up -d` or platform deploy).
4. Verify service health via `/api/v1/health`.
