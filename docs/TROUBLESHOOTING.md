# SatQuery AI — Troubleshooting & Incident Resolution Guide

This guide documents common issues, debugging workflows, and resolutions for operating and deploying SatQuery AI.

---

## 1. Frontend & Visualization Issues

### 1.1 CesiumJS Globe Fails to Render / Black Canvas
- **Symptom**: The 3D globe displays a black sphere or WebGL error in console.
- **Root Cause**: WebGL 2.0 acceleration disabled or Cesium Ion token invalid.
- **Resolution**:
  1. SatQuery AI is configured by default to fall back gracefully to **ESRI World Imagery** (`ArcGisMapServerImageryProvider`) which requires zero token.
  2. If using Cesium Ion photogrammetry, ensure `VITE_CESIUM_ION_ACCESS_TOKEN` is set in `.env`.
  3. Ensure hardware acceleration is enabled in browser settings (`chrome://settings/system`).

### 1.2 "Backend API unavailable, using in-memory engine fallback" Warning
- **Symptom**: Browser console logs warning that Spring Boot is unreachable.
- **Root Cause**: Gateway on port 8080 is not running or CORS is misconfigured.
- **Resolution**:
  1. This is an intentional feature: SatQuery AI includes a resilient **in-memory query engine fallback** that guarantees full interactive capabilities even when the backend is offline.
  2. To connect to the live backend, verify `docker ps` shows `satquery-spring-boot` running on port 8080.
  3. Ensure `VITE_SPRING_BOOT_API_URL` points to `http://localhost:8080`.

---

## 2. Spring Boot Gateway Issues

### 2.1 Downstream Microservice Connection Refusal
- **Symptom**: Spring Boot logs `ResourceAccessException: I/O error on POST request to http://localhost:8001/api/v1/nlp/parse: Connect to localhost:8001 failed: Connection refused`.
- **Root Cause**: When running inside Docker, `localhost` refers to the container itself rather than neighboring containers.
- **Resolution**:
  - In Docker Compose, ensure Spring Boot environment variables use container network names:
    - `NLP_SERVICE_URL=http://nlp-service:8001`
    - `DATA_SERVICE_URL=http://data-service:8002`
    - `EO_SERVICE_URL=http://eo-analysis-service:8003`

### 2.2 Compilation Error: Class is public, should be declared in a file named...
- **Symptom**: `javac` errors regarding public records in `QueryDto.java`.
- **Resolution**:
  - Each public Java record is separated into its own file (`QueryRequest.java` and `QueryResponse.java` under `backend/spring-boot/src/main/java/com/satquery/dto/`).

---

## 3. Python Microservices & PostGIS Issues

### 3.1 Port Already In Use (`8001`, `8002`, `8003`, `8080`, `5432`)
- **Symptom**: `OSError: [Errno 48] Address already in use`.
- **Resolution**:
  - Check conflicting processes:
    ```bash
    # On Windows PowerShell
    netstat -ano | findstr :8080
    # On Linux/macOS
    lsof -i :8080
    ```
  - Terminate the conflicting process or change port bindings in `.env`.

### 3.2 PostGIS Spatial Extension Missing
- **Symptom**: `ERROR: function st_makepoint(numeric, numeric) does not exist`.
- **Resolution**:
  - Ensure using the official PostGIS image `postgis/postgis:16-3.4` (standard `postgres:16` does not include PostGIS extensions).
  - Connect to database and execute:
    ```sql
    CREATE EXTENSION IF NOT EXISTS postgis;
    ```

---

## 4. Docker Build & Deployment Issues

### 4.1 Vite Build Out of Memory in Docker
- **Symptom**: `npm run build` fails during Docker build stage.
- **Resolution**:
  - Increase Docker daemon memory allocation to $\ge 4\text{ GB}$.
  - Ensure `.dockerignore` excludes `node_modules` so local host dependencies do not pollute the container build.
