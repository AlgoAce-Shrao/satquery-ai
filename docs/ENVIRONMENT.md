# SatQuery AI — Environment Variables Reference

This document provides the complete, authoritative reference for all configuration options and environment variables used across the SatQuery AI system.

---

## Master Environment Variable Matrix

| Variable Name | Target Service | Required? | Example / Format | Secret? | Default Value | Description |
|---------------|----------------|-----------|------------------|---------|---------------|-------------|
| `VITE_SPRING_BOOT_API_URL` | Frontend | No | `https://api.satquery.ai` | No | `""` (Relative proxy) | Base URL for Spring Boot Gateway API. When empty, requests route via relative `/api` paths. |
| `VITE_CESIUM_ION_ACCESS_TOKEN` | Frontend | No | `eyJhbGciOi...` | Yes | None | Cesium Ion Default Access Token for global 3D photogrammetry. Falls back to free ESRI World Imagery if omitted. |
| `VITE_GEMINI_API_KEY` | Frontend | No | `AIzaSy...` | Yes | None | Google Gemini API Key for client-side multimodal reasoning. |
| `VITE_COLAB_INFERENCE_URL` | Frontend | No | `https://gpu-colab.ngrok.app` | No | None | Endpoint for external GPU PyTorch vision models. |
| `SERVER_PORT` | Spring Boot | No | `8080` | No | `8080` | HTTP listening port for Spring Boot application. |
| `NLP_SERVICE_URL` | Spring Boot | Yes | `http://nlp-service:8001` | No | `http://localhost:8001` | Downstream URL for Python NLP entity extractor service. |
| `DATA_SERVICE_URL` | Spring Boot | Yes | `http://data-service:8002` | No | `http://localhost:8002` | Downstream URL for PostGIS spatial data service. |
| `EO_SERVICE_URL` | Spring Boot | Yes | `http://eo-analysis-service:8003` | No | `http://localhost:8003` | Downstream URL for spectral math and change detection service. |
| `PORT` | Python Microservices | No | `8001` / `8002` / `8003` | No | Per-service default | Listening port for Uvicorn ASGI server. |
| `LLM_PROVIDER` | NLP Service | No | `rule_based` / `gemini` / `openai` | No | `rule_based` | Selection of NLU parsing engine. |
| `GEMINI_API_KEY` | NLP Service | Optional | `AIzaSy...` | Yes | None | Required only if `LLM_PROVIDER=gemini`. |
| `OPENAI_API_KEY` | NLP Service | Optional | `sk-...` | Yes | None | Required only if `LLM_PROVIDER=openai`. |
| `DATABASE_URL` | Data Service | Yes | `postgresql://user:pass@host:5432/db` | Yes | Containerized URL | PostgreSQL/PostGIS connection string. |
| `POSTGRES_USER` | PostgreSQL / PostGIS | Yes | `satquery` | No | `satquery` | Database root administrative user. |
| `POSTGRES_PASSWORD` | PostgreSQL / PostGIS | Yes | `earthpass` | Yes | `earthpass` | Database administrative password. |
| `POSTGRES_DB` | PostgreSQL / PostGIS | Yes | `satquery_db` | No | `satquery_db` | Target PostgreSQL database name. |
| `POSTGRES_PORT` | PostgreSQL / PostGIS | No | `5432` | No | `5432` | PostgreSQL wire protocol port. |

---

## Environment Separation

### 1. Development (`.env.local` / local process)
- Services connect to `localhost:8080`, `localhost:8001`, `localhost:8002`, `localhost:8003`.
- `LLM_PROVIDER` defaults to `rule_based` for ultra-fast local iteration without external API costs.
- Vite dev server automatically proxies `/api` to `http://localhost:8080`.

### 2. Docker Compose (`docker-compose.yml`)
- Services communicate over the internal Docker bridge network using container service names (`http://nlp-service:8001`, `http://data-service:8002`, `http://eo-analysis-service:8003`).
- Nginx frontend container proxies `/api/*` to `http://spring-boot-backend:8080/api/*`.

### 3. Production Multi-Cloud / Kubernetes
- Secrets (API keys, database credentials) are injected via secret managers (AWS Secrets Manager, GCP Secret Manager, or HashiCorp Vault).
- Frontend static assets are deployed to CDN edge nodes with `VITE_SPRING_BOOT_API_URL` pointing to the public HTTPS gateway endpoint.
