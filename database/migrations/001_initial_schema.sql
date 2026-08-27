-- PostGIS Spatial Schema for SatQuery AI
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. Regions Reference Table
CREATE TABLE IF NOT EXISTS regions (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    country VARCHAR(100) NOT NULL,
    continent VARCHAR(100),
    area_sqkm DOUBLE PRECISION NOT NULL,
    geom GEOMETRY(MultiPolygon, 4326),
    centroid GEOMETRY(Point, 4326),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_regions_geom ON regions USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_regions_centroid ON regions USING GIST (centroid);

-- 2. Earth Observations Catalog Table
CREATE TABLE IF NOT EXISTS observations (
    id VARCHAR(64) PRIMARY KEY,
    region_id VARCHAR(64) REFERENCES regions(id) ON DELETE CASCADE,
    satellite VARCHAR(64) NOT NULL,
    sensor VARCHAR(64) NOT NULL,
    acquisition_date DATE NOT NULL,
    cloud_cover_percent REAL NOT NULL,
    resolution_meters REAL NOT NULL,
    spectral_bands JSONB NOT NULL,
    footprint GEOMETRY(Polygon, 4326),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_observations_region_date ON observations (region_id, acquisition_date);
CREATE INDEX IF NOT EXISTS idx_observations_footprint ON observations USING GIST (footprint);

-- 3. Analysis Jobs Log
CREATE TABLE IF NOT EXISTS analysis_jobs (
    id VARCHAR(64) PRIMARY KEY,
    query_raw TEXT NOT NULL,
    query_structured JSONB NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- 4. Analysis Results (Synthesized Findings & Spectral Deltas)
CREATE TABLE IF NOT EXISTS analysis_results (
    id VARCHAR(64) PRIMARY KEY,
    job_id VARCHAR(64) REFERENCES analysis_jobs(id) ON DELETE CASCADE,
    region_id VARCHAR(64) REFERENCES regions(id) ON DELETE CASCADE,
    site_code VARCHAR(32) NOT NULL,
    metric_name VARCHAR(64) NOT NULL,
    before_value REAL NOT NULL,
    after_value REAL NOT NULL,
    percentage_change REAL NOT NULL,
    confidence REAL NOT NULL,
    severity VARCHAR(32) NOT NULL,
    headline TEXT NOT NULL,
    evidence_narrative TEXT NOT NULL,
    primary_drivers TEXT[] NOT NULL,
    before_date DATE NOT NULL,
    after_date DATE NOT NULL,
    affected_geom GEOMETRY(MultiPolygon, 4326),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_analysis_results_job ON analysis_results (job_id);
CREATE INDEX IF NOT EXISTS idx_analysis_results_affected_geom ON analysis_results USING GIST (affected_geom);
