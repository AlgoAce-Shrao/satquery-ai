# SatQuery AI — Local Development Guide

This guide provides setup, execution, testing, and contribution instructions for developers working on the SatQuery AI codebase.

---

## 1. Prerequisites

Ensure you have the following installed on your development machine:

- **Node.js**: `v20.x` or `v22.x` (with `npm` or `bun`)
- **Python**: `3.11+` (with `pip` and `venv`)
- **Java JDK**: `21+` (with Apache Maven `3.9+`)
- **Docker & Docker Compose**: (Optional, for running full containerized stack)

---

## 2. Quickstart with Docker Compose (Recommended)

The fastest way to spin up the entire 5-tier microservice architecture:

```bash
# 1. Clone repository
git clone https://github.com/your-org/satquery-ai.git
cd satquery-ai

# 2. Setup environment variables
cp .env.example .env

# 3. Start all services
docker compose up --build
```

Access points:
- **Frontend SPA**: [http://localhost:3000](http://localhost:3000)
- **Spring Boot API Gateway**: [http://localhost:8080](http://localhost:8080)
- **NLP Service**: [http://localhost:8001/docs](http://localhost:8001/docs)
- **Data Service**: [http://localhost:8002/docs](http://localhost:8002/docs)
- **EO Analysis Service**: [http://localhost:8003/docs](http://localhost:8003/docs)
- **PostGIS Database**: `localhost:5432`

---

## 3. Running Services Individually (Native Development)

### 3.1 Frontend (React / Vite)
```bash
# Install frontend dependencies
npm install

# Start Vite dev server on port 3000
npm run dev
```

### 3.2 Python Microservices
You can run each Python FastAPI service in its own virtual environment or a shared one:

```bash
# Set up Python virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Service 1: NLP Service
pip install -r services/nlp-service/requirements.txt
cd services/nlp-service
uvicorn app.main:app --port 8001 --reload

# Service 2: Data Service (in separate terminal)
pip install -r services/data-service/requirements.txt
cd services/data-service
uvicorn app.main:app --port 8002 --reload

# Service 3: EO Analysis Service (in separate terminal)
pip install -r services/eo-analysis-service/requirements.txt
cd services/eo-analysis-service
uvicorn app.main:app --port 8003 --reload
```

### 3.3 Spring Boot Gateway
```bash
cd backend/spring-boot
mvn spring-boot:run
```

---

## 4. Verification & Testing Commands

### Frontend Typecheck & Build
```bash
# Run TypeScript compilation check
npm run lint

# Build production bundle into /dist
npm run build
```

### Python Syntax & Compilation Verification
```bash
python -m py_compile services/nlp-service/app/main.py
python -m py_compile services/data-service/app/main.py
python -m py_compile services/eo-analysis-service/app/main.py
```

### Spring Boot Compilation & Test Suite
```bash
cd backend/spring-boot
mvn clean test
```

---

## 5. Code Style & Standards

- **TypeScript**: Strict typing enabled in `tsconfig.json`. Explicit interfaces for geospatial types in `src/types/`.
- **Python**: Pydantic v2 schemas for all API payloads; clean modular structure in `app/`.
- **Java**: Java 21 record classes for lightweight DTOs; Spring Boot standard service-controller layering.
