# SatQuery AI — Database Schema (PostgreSQL + PostGIS)

```sql
-- Enable PostGIS extension for spatial queries and geometry indexing
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. Regions of Interest Catalog
CREATE TABLE regions (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    country VARCHAR(100) NOT NULL,
    biome_type VARCHAR(100),
    centroid GEOMETRY(Point, 4326) NOT NULL,
    bounding_box GEOMETRY(Polygon, 4326) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_regions_centroid ON regions USING GIST (centroid);
CREATE INDEX idx_regions_bbox ON regions USING GIST (bounding_box);

-- 2. Satellite Observations Catalog
CREATE TABLE observations (
    id VARCHAR(64) PRIMARY KEY,
    satellite VARCHAR(64) NOT NULL,            -- e.g. 'Sentinel-2A', 'Landsat-8'
    sensor VARCHAR(64) NOT NULL,               -- e.g. 'MSI', 'OLI'
    observation_date DATE NOT NULL,
    cloud_cover_percentage NUMERIC(5, 2),
    footprint GEOMETRY(Polygon, 4326) NOT NULL,
    tile_id VARCHAR(64),
    raster_nir_url TEXT,
    raster_red_url TEXT,
    raster_green_url TEXT,
    raster_swir_url TEXT,
    rgb_preview_url TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_observations_footprint ON observations USING GIST (footprint);
CREATE INDEX idx_observations_date ON observations (observation_date);

-- 3. Analysis Results & Change Detections
CREATE TABLE analysis_results (
    id VARCHAR(64) PRIMARY KEY,
    query_id VARCHAR(64),
    region_id VARCHAR(64) REFERENCES regions(id),
    analysis_type VARCHAR(64) NOT NULL,        -- 'VEGETATION_CHANGE', 'WATER_EXPANSION', 'URBAN_GROWTH'
    observation_before_id VARCHAR(64) REFERENCES observations(id),
    observation_after_id VARCHAR(64) REFERENCES observations(id),
    metric_name VARCHAR(32) NOT NULL,          -- 'NDVI', 'NDWI', 'NDBI'
    metric_before NUMERIC(6, 4) NOT NULL,
    metric_after NUMERIC(6, 4) NOT NULL,
    percentage_change NUMERIC(6, 2) NOT NULL,
    confidence_score NUMERIC(4, 3) NOT NULL,
    affected_area_sq_km NUMERIC(10, 2),
    affected_geometry GEOMETRY(MultiPolygon, 4326),
    evidence_payload JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_analysis_geometry ON analysis_results USING GIST (affected_geometry);
CREATE INDEX idx_analysis_type ON analysis_results (analysis_type);

-- 4. Natural Language Queries & Session Audit
CREATE TABLE query_logs (
    id VARCHAR(64) PRIMARY KEY,
    session_id VARCHAR(64),
    raw_query TEXT NOT NULL,
    interpreted_intent JSONB NOT NULL,
    execution_time_ms INTEGER,
    status VARCHAR(32) NOT NULL,               -- 'COMPLETED', 'FAILED', 'TIMEOUT'
    total_regions_found INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_query_created_at ON query_logs (created_at);
```
