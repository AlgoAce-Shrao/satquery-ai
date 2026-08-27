# SatQuery AI — Production Deployment Guide

This guide provides concrete, step-by-step deployment instructions for every layer of SatQuery AI based strictly on the verified multi-service architecture.

---

## 1. Deployable Architecture Overview

SatQuery AI consists of 5 deployable services:

```text
┌────────────────────────┐      ┌────────────────────────┐      ┌────────────────────────┐
│  1. PostGIS Database   │ ──►  │ 2. Python Services     │ ──►  │ 3. Spring Boot Gateway │
│  PostgreSQL 16 + 3.4   │      │ NLP, Data, EO Analysis │      │ Java 21 / Port 8080    │
└────────────────────────┘      └────────────────────────┘      └────────────────────────┘
                                                                             │
                                                                             ▼
                                                                ┌────────────────────────┐
                                                                │ 4. Frontend SPA        │
                                                                │ React 19 + Nginx :3000 │
                                                                └────────────────────────┘
```

---

## 2. Platform Recommendations

| Component | Recommended Platform | Alternative Platform | Rationale |
|-----------|----------------------|----------------------|-----------|
| **Database** | Managed PostGIS (AWS RDS / Supabase / Neon) | Containerized PostGIS on Fly.io | High-performance PostGIS 3.4 spatial indices and managed automated backups. |
| **Microservices (NLP, Data, EO)** | Google Cloud Run / Fly.io / AWS ECS | Railway / Render | Stateless, lightweight Python containers with instant auto-scaling and zero-idle cost. |
| **API Gateway (Spring Boot)** | Google Cloud Run / AWS App Runner / Fly.io | Render | High throughput, Java 21 runtime container. |
| **Frontend** | Vercel / Netlify / Cloudflare Pages / AWS S3+CloudFront | Docker Nginx container | Ultra-fast global edge CDN distribution for static assets and Cesium WebGL 3D tiles. |

---

## 3. Detailed Service Deployment Specifications

### Service 1: PostgreSQL 16 with PostGIS 3.4

- **Recommended Platform**: AWS RDS PostgreSQL or Supabase
- **Build Command**: N/A (Managed) / `docker-compose up postgres`
- **Port**: `5432`
- **Environment Variables**:
  - `POSTGRES_USER=satquery`
  - `POSTGRES_PASSWORD=<strong-secret-password>`
  - `POSTGRES_DB=satquery_db`
- **Initialization Commands**:
  ```bash
  psql -h <db-host> -U satquery -d satquery_db -f database/migrations/001_initial_schema.sql
  psql -h <db-host> -U satquery -d satquery_db -f database/migrations/002_seed_regions.sql
  ```

---

### Service 2: Python NLP Service

- **Recommended Platform**: Google Cloud Run / Docker Container
- **Port**: `8001`
- **Build Context**: `./services/nlp-service`
- **Dockerfile**: `docker/Dockerfile.nlp`
- **Build Command**: `docker build -t satquery-nlp -f docker/Dockerfile.nlp services/nlp-service`
- **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port 8001`
- **Environment Variables**:
  - `PORT=8001`
  - `LLM_PROVIDER=rule_based` (or `gemini` / `openai`)
  - `GEMINI_API_KEY=<optional-api-key>`
- **Health Check**: `GET http://<host>:8001/health`

---

### Service 3: Python Data Service

- **Recommended Platform**: Google Cloud Run / Docker Container
- **Port**: `8002`
- **Build Context**: `./services/data-service`
- **Dockerfile**: `docker/Dockerfile.data-service`
- **Build Command**: `docker build -t satquery-data -f docker/Dockerfile.data-service services/data-service`
- **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port 8002`
- **Environment Variables**:
  - `PORT=8002`
  - `DATABASE_URL=postgresql://satquery:<password>@<db-host>:5432/satquery_db`
- **Health Check**: `GET http://<host>:8002/health`

---

### Service 4: Python EO Analysis Service

- **Recommended Platform**: Google Cloud Run / Docker Container
- **Port**: `8003`
- **Build Context**: `./services/eo-analysis-service`
- **Dockerfile**: `docker/Dockerfile.eo-analysis`
- **Build Command**: `docker build -t satquery-eo -f docker/Dockerfile.eo-analysis services/eo-analysis-service`
- **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port 8003`
- **Environment Variables**:
  - `PORT=8003`
- **Health Check**: `GET http://<host>:8003/health`

---

### Service 5: Spring Boot Gateway

- **Recommended Platform**: Google Cloud Run / AWS App Runner / Fly.io
- **Port**: `8080`
- **Build Context**: `./backend/spring-boot`
- **Dockerfile**: `docker/Dockerfile.spring-boot`
- **Build Command**: `mvn clean package -DskipTests`
- **Start Command**: `java -jar target/satquery-backend-1.0.0-SNAPSHOT.jar`
- **Environment Variables**:
  - `SERVER_PORT=8080`
  - `NLP_SERVICE_URL=http://<nlp-service-host>:8001`
  - `DATA_SERVICE_URL=http://<data-service-host>:8002`
  - `EO_SERVICE_URL=http://<eo-service-host>:8003`
- **Health Check**: `GET http://<host>:8080/api/v1/health`

---

### Service 6: React Frontend (SPA)

- **Recommended Platform**: Vercel / Cloudflare Pages / Nginx Container
- **Port**: `3000` (or `443` HTTPS on CDN)
- **Build Command**: `npm install && npm run build`
- **Output Directory**: `dist`
- **Environment Variables**:
  - `VITE_SPRING_BOOT_API_URL=https://api.yourdomain.com`
  - `VITE_CESIUM_ION_ACCESS_TOKEN=<optional-token>`
  - `VITE_GEMINI_API_KEY=<optional-token>`

---

## 4. Exact Deployment Order

Execute deployments strictly in this order to satisfy service dependencies:

1. **Step 1: Database Provisioning**
   - Provision PostgreSQL 16 + PostGIS 3.4.
   - Run SQL migrations `001_initial_schema.sql` and `002_seed_regions.sql`.
2. **Step 2: Microservices Deployment**
   - Deploy `data-service` (connected to Database).
   - Deploy `nlp-service`.
   - Deploy `eo-analysis-service`.
   - Verify health check on each service (`/health`).
3. **Step 3: Spring Boot Gateway Deployment**
   - Configure downstream URLs (`NLP_SERVICE_URL`, `DATA_SERVICE_URL`, `EO_SERVICE_URL`).
   - Deploy `spring-boot-backend`.
   - Verify health check (`/api/v1/health`).
4. **Step 4: Frontend Deployment**
   - Inject `VITE_SPRING_BOOT_API_URL` pointing to the public Gateway URL.
   - Deploy to Vercel, Cloudflare, or Docker Nginx container.
5. **Step 5: DNS & SSL / TLS Configuration**
   - Bind custom domains (e.g., `app.satquery.ai` and `api.satquery.ai`).
   - Enforce HTTPS across all traffic.
6. **Step 6: Production Smoke Test**
   - Run full end-to-end user query and raster inspection smoke tests.

---

## 5. Single-Host Docker Compose Production Deployment

To run the entire verified stack on a single Linux / VPS server:

```bash
# 1. Clone repository
git clone https://github.com/your-org/satquery-ai.git
cd satquery-ai

# 2. Configure environment
cp .env.example .env
# Edit .env with your production credentials

# 3. Build and launch all 6 services
docker compose up -d --build

# 4. Verify running containers
docker compose ps

# 5. Check health
curl http://localhost:8080/api/v1/health
```
