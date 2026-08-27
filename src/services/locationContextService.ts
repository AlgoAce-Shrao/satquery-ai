/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Location Context Service
 * Resolves geographic context, bounding footprints, camera vectors, and manual coordinate overrides
 * for uploaded imagery and benchmark scenarios.
 */

import { GeospatialMetadata } from '../types/upload';
import { CameraPosition, GeoPoint } from '../types/geospatial';

export interface ResolvedLocationContext {
  hasCoordinates: boolean;
  locationName: string;
  country: string;
  point: GeoPoint;
  camera: CameraPosition;
  boundingBox?: [number, number, number, number];
  crs: string;
  source: 'METADATA_EXTRACTED' | 'MANUAL_USER_ASSIGNED' | 'BENCHMARK_LINKED' | 'UNSPECIFIED_LOCAL_GRID';
  description: string;
}

export class LocationContextService {
  /**
   * Resolves location context from uploaded image metadata, manual user input, or default state.
   */
  public static resolve(
    metadata?: GeospatialMetadata,
    manualLocation?: {
      name?: string;
      country?: string;
      lat?: number;
      lon?: number;
    }
  ): ResolvedLocationContext {
    // 1. Check if user manually supplied coordinates
    if (manualLocation && manualLocation.lat !== undefined && manualLocation.lon !== undefined) {
      const lat = manualLocation.lat;
      const lon = manualLocation.lon;
      return {
        hasCoordinates: true,
        locationName: manualLocation.name || 'User Specified Area',
        country: manualLocation.country || 'Global',
        point: { lat, lon },
        camera: { lat, lon, altitude: 250000, pitch: -60, heading: 0 },
        boundingBox: [lon - 0.2, lat - 0.2, lon + 0.2, lat + 0.2],
        crs: 'EPSG:4326 (WGS-84)',
        source: 'MANUAL_USER_ASSIGNED',
        description: `Coordinates manually mapped to ${lat.toFixed(3)}°, ${lon.toFixed(3)}°.`,
      };
    }

    // 2. Check if embedded metadata has coordinates
    if (metadata && metadata.hasGeospatial && metadata.center) {
      const { lat, lon } = metadata.center;
      return {
        hasCoordinates: true,
        locationName: 'Georeferenced Target Scene',
        country: 'Earth Observation Footprint',
        point: { lat, lon },
        camera: { lat, lon, altitude: 300000, pitch: -65, heading: 0 },
        boundingBox: metadata.bounds || [lon - 0.2, lat - 0.2, lon + 0.2, lat + 0.2],
        crs: metadata.crs || 'EPSG:4326 (WGS-84)',
        source: 'METADATA_EXTRACTED',
        description: `Geotagged coordinates extracted from raster header (${lat.toFixed(3)}°, ${lon.toFixed(3)}°).`,
      };
    }

    // 3. Fallback: No spatial metadata
    return {
      hasCoordinates: false,
      locationName: 'Unreferenced Raster Scene',
      country: 'Local Pixel Coordinates',
      point: { lat: 0, lon: 0 },
      camera: { lat: 0, lon: 0, altitude: 20000000, pitch: -90, heading: 0 },
      crs: 'Pixel Coordinate Space (Non-Geospatial)',
      source: 'UNSPECIFIED_LOCAL_GRID',
      description: 'Geospatial metadata unavailable in file header. Visual analysis executed in normalized raster space.',
    };
  }
}
