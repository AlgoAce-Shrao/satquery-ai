import { AnalysisResult, AnalysisType, QueryExecutionState } from '../../types/geospatial';
import { ModalityType, ObservationCategory, ObservationSeverity, SpectralBandData } from '../../types/observation';
import { queryEngine } from '../queryEngine';

export interface QueryApiResponse {
  queryId: string;
  rawQuery: string;
  structuredQuery: any;
  results: AnalysisResult[];
  visualization: {
    mode: string;
    autoNavigate: boolean;
    cameraAltitudeMeters?: number;
  };
  status: string;
}

interface GatewayAnalysisResult {
  id?: string;
  siteCode?: string;
  regionName?: string;
  country?: string;
  location?: { lat?: number; lon?: number };
  geometry?: { type?: string; coordinates?: unknown };
  metric?: {
    name?: string;
    beforeValue?: number;
    afterValue?: number;
    percentageChange?: number;
    unit?: string;
    severity?: string;
  };
  confidence?: number;
  headline?: string;
  evidenceNarrative?: string;
  primaryDrivers?: string[];
  satellite?: string;
  sensor?: string;
  cloudCover?: number;
  areaAffectedSqKm?: number;
  observationPeriod?: {
    beforeDate?: string;
    afterDate?: string;
    beforeLabel?: string;
    afterLabel?: string;
  };
  spectralBands?: SpectralBandData[];
}

interface GatewayQueryResponse extends Omit<QueryApiResponse, 'results'> {
  results?: GatewayAnalysisResult[];
}

const toNumber = (value: unknown, fallback = 0): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

function getPolygon(geometry?: GatewayAnalysisResult['geometry']): Array<{ lat: number; lon: number }> {
  const coordinates = geometry?.coordinates;
  if (!Array.isArray(coordinates) || geometry?.type !== 'Polygon' || !Array.isArray(coordinates[0])) {
    return [];
  }

  return (coordinates[0] as unknown[]).flatMap((point) => {
    if (!Array.isArray(point) || point.length < 2) return [];
    const [lon, lat] = point;
    if (typeof lon !== 'number' || typeof lat !== 'number') return [];
    return [{ lat, lon }];
  });
}

function getBoundingBox(polygon: Array<{ lat: number; lon: number }>): [number, number, number, number] | undefined {
  if (polygon.length === 0) return undefined;
  return [
    Math.min(...polygon.map((point) => point.lon)),
    Math.min(...polygon.map((point) => point.lat)),
    Math.max(...polygon.map((point) => point.lon)),
    Math.max(...polygon.map((point) => point.lat)),
  ];
}

function getCategory(result: GatewayAnalysisResult, intent?: string): ObservationCategory {
  const source = `${intent || ''} ${result.metric?.name || ''} ${result.headline || ''}`.toLowerCase();
  if (source.includes('flood') || source.includes('inundation')) return 'FLOOD';
  if (source.includes('water') || source.includes('ndwi')) return 'WATER_CHANGE';
  if (source.includes('urban') || source.includes('ndbi')) return 'URBAN_EXPANSION';
  if (source.includes('fire') || source.includes('burn') || source.includes('nbr')) return 'WILDFIRE';
  if (source.includes('forest') || source.includes('deforest') || source.includes('canopy')) return 'DEFORESTATION';
  return 'VEGETATION_CHANGE';
}

function getAnalysisType(category: ObservationCategory): AnalysisType {
  switch (category) {
    case 'FLOOD':
    case 'WATER_CHANGE':
      return 'WATER_EXPANSION';
    case 'URBAN_EXPANSION':
      return 'URBAN_GROWTH';
    case 'WILDFIRE':
      return 'WILDFIRE_BURN';
    default:
      return 'VEGETATION_CHANGE';
  }
}

function getSeverity(severity?: string): ObservationSeverity {
  if (severity === 'CRITICAL' || severity === 'MODERATE' || severity === 'LOW') return severity;
  return 'HIGH';
}

function getModality(result: GatewayAnalysisResult): ModalityType {
  const source = `${result.satellite || ''} ${result.sensor || ''}`.toLowerCase();
  return source.includes('sar') || source.includes('sentinel-1') ? 'SAR' : 'OPTICAL';
}

function normalizeResult(result: GatewayAnalysisResult, index: number, intent?: string): AnalysisResult {
  const polygon = getPolygon(result.geometry);
  const lat = toNumber(result.location?.lat, polygon[0]?.lat ?? 0);
  const lon = toNumber(result.location?.lon, polygon[0]?.lon ?? 0);
  const category = getCategory(result, intent);

  return {
    id: result.id || `api-result-${index + 1}`,
    rank: index + 1,
    siteCode: result.siteCode || `SITE_${index + 1}`,
    regionName: result.regionName || 'Unnamed region',
    country: result.country || 'Unknown',
    biome: 'Unclassified',
    analysisType: getAnalysisType(category),
    visualizationType: 'CHANGE_DETECTION',
    category,
    location: { lat, lon },
    camera: { lat, lon, altitude: 1_400_000, heading: 0, pitch: -55 },
    polygon,
    boundingBox: getBoundingBox(polygon),
    metric: {
      name: result.metric?.name || 'Change index',
      beforeValue: toNumber(result.metric?.beforeValue),
      afterValue: toNumber(result.metric?.afterValue),
      percentageChange: toNumber(result.metric?.percentageChange),
      unit: result.metric?.unit || 'index_unit',
      severity: getSeverity(result.metric?.severity),
    },
    confidence: toNumber(result.confidence),
    satellite: result.satellite || 'Unknown satellite',
    sensor: result.sensor || 'Unknown sensor',
    modality: getModality(result),
    dataStatus: 'PUBLIC_DATA',
    cloudCover: toNumber(result.cloudCover),
    observationPeriod: {
      beforeDate: result.observationPeriod?.beforeDate || '',
      afterDate: result.observationPeriod?.afterDate || '',
      beforeLabel: result.observationPeriod?.beforeLabel || 'Before',
      afterLabel: result.observationPeriod?.afterLabel || 'After',
    },
    headline: result.headline || 'Analysis complete',
    evidenceNarrative: result.evidenceNarrative || 'No narrative was returned by the analysis service.',
    primaryDrivers: result.primaryDrivers || [],
    spectralBands: result.spectralBands || [],
    areaAffectedSqKm: toNumber(result.areaAffectedSqKm),
  };
}

export class QueryApiClient {
  private static BASE_URL = ((import.meta as any).env?.VITE_SPRING_BOOT_API_URL || '').replace(/\/$/, '');

  /**
   * Dispatches the natural language query to the backend orchestration service.
   * Always falls back to the client-side sample-data engine — in dev because the
   * gateway usually isn't running, in prod so a cold start, timeout, or CORS
   * misconfiguration degrades gracefully instead of failing the query outright.
   */
  public static async executeQuery(
    rawQuery: string,
    onProgressUpdate?: (update: Partial<QueryExecutionState>) => void
  ): Promise<QueryApiResponse> {
    const requestController = new AbortController();
    const timeoutId = window.setTimeout(() => requestController.abort(), 15_000);
    try {
      const endpoint = this.BASE_URL ? `${this.BASE_URL}/api/v1/query` : '/api/v1/query';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: rawQuery }),
        signal: requestController.signal,
      });

      if (!response.ok) {
        throw new Error(`Query API request failed with HTTP ${response.status}.`);
      }

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        // Render cold starts can return an HTML "service starting" page with a 200 OK.
        throw new Error('Query API returned a non-JSON response (the gateway may be waking from a cold start).');
      }

      const data = (await response.json()) as GatewayQueryResponse;
      if (!data || !Array.isArray(data.results)) {
        throw new Error('Query API returned an invalid response payload.');
      }

      return {
        ...data,
        results: data.results.map((result, index) =>
          normalizeResult(result, index, typeof data.structuredQuery?.intent === 'string' ? data.structuredQuery.intent : undefined)
        ),
      };
    } catch (err) {
      const error = requestController.signal.aborted
        ? new Error('The analysis service did not respond within 15 seconds.')
        : err;
      console.warn('Backend API unavailable, using in-memory engine fallback:', error);
    } finally {
      window.clearTimeout(timeoutId);
    }

    // Client-side queryEngine execution with progressive stage transitions
    return new Promise((resolve) => {
      queryEngine.executeQuery(rawQuery, (update) => {
        if (onProgressUpdate) onProgressUpdate(update);
        if (update.status === 'COMPLETED') {
          resolve({
            queryId: update.queryId || 'Q_FALLBACK',
            rawQuery: update.rawQuery || rawQuery,
            structuredQuery: update.structuredQuery,
            results: update.results || [],
            visualization: {
              mode: 'tour',
              autoNavigate: true,
            },
            status: 'COMPLETED',
          });
        }
      });
    });
  }
}
