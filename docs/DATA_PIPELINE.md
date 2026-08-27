# SatQuery AI — Scientific Data Pipeline

## 1. Remote Sensing Index Computations

### A. Normalized Difference Vegetation Index (NDVI)
Used for vegetation density, forest cover, deforestation, and crop vitality:
$$\text{NDVI} = \frac{\text{NIR (Band 8)} - \text{Red (Band 4)}}{\text{NIR (Band 8)} + \text{Red (Band 4)}}$$
- **Healthy dense forest**: $0.6 \text{ to } 0.9$
- **Shrub / Grass / Stressed crop**: $0.2 \text{ to } 0.5$
- **Bare soil / Urban**: $0.0 \text{ to } 0.2$
- **Water bodies / Clouds**: $< 0.0$

### B. Normalized Difference Water Index (NDWI)
Used for open water body delineation, flood detection, and lake evaporation:
$$\text{NDWI} = \frac{\text{Green (Band 3)} - \text{NIR (Band 8)}}{\text{Green (Band 3)} + \text{NIR (Band 8)}}$$

### C. Normalized Difference Built-Up Index (NDBI)
Used for urban expansion, impervious surface mapping, and infrastructure growth:
$$\text{NDBI} = \frac{\text{SWIR (Band 11)} - \text{NIR (Band 8)}}{\text{SWIR (Band 11)} + \text{NIR (Band 8)}}$$

---

## 2. Multi-Temporal Pixel-Level Change Detection Algorithm

```text
Input:
  Raster_T0 (e.g. 2025-01-15, Bands: Red, NIR)
  Raster_T1 (e.g. 2026-01-15, Bands: Red, NIR)
  CloudMask_T0, CloudMask_T1

Process:
  1. Compute NDVI_T0 = (NIR_T0 - Red_T0) / (NIR_T0 + Red_T0)
  2. Compute NDVI_T1 = (NIR_T1 - Red_T1) / (NIR_T1 + Red_T1)
  3. Filter invalid pixels (CloudMask_T0 == 1 OR CloudMask_T1 == 1)
  4. Compute Difference Matrix: ΔNDVI = NDVI_T1 - NDVI_T0
  5. Compute Relative Percentage: %Δ = (ΔNDVI / NDVI_T0) * 100
  6. Thresholding: Identify connected components where %Δ < threshold
  7. Vectorization: Convert raster change clusters to GeoJSON Polygons (Rasterio / Shapely)
  8. Compute centroid, bounding box, affected area (sq km), and confidence.
```

---

## 3. Data Ingestion Architecture

```text
[Satellite Constellations]
  - Sentinel-2 MSI (10m - 20m)
  - Landsat 8/9 OLI (30m)
         ↓
[STAC Catalog / SpatioTemporal Asset Catalog API]
  - Query by BBox, Date Range, Max Cloud Cover (< 15%)
         ↓
[COG (Cloud Optimized GeoTIFF) Tile Streaming]
  - Read windowed bounding boxes via HTTP Range Requests
         ↓
[Scientific In-Memory Processing (FastAPI / NumPy / GDAL)]
         ↓
[Vector Results & GeoJSON Payload to Cesium]
```
