import { AnalysisResult, QueryExecutionState } from '../../types/geospatial';
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

export class QueryApiClient {
  private static BASE_URL = (import.meta as any).env?.VITE_SPRING_BOOT_API_URL || '';

  /**
   * Dispatches the natural language query to the backend orchestration service.
   * Seamlessly falls back to the in-memory query engine if the standalone Spring Boot container is not attached.
   */
  public static async executeQuery(
    rawQuery: string,
    onProgressUpdate?: (update: Partial<QueryExecutionState>) => void
  ): Promise<QueryApiResponse> {
    try {
      const endpoint = this.BASE_URL ? `${this.BASE_URL}/api/v1/query` : '/api/v1/query';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: rawQuery }),
      });

      if (response.ok) {
        const data = await response.json();
        return data as QueryApiResponse;
      }
    } catch (err) {
      console.warn('Backend API unavailable, using in-memory engine fallback:', err);
    }

    // Fallback: Use client-side queryEngine execution with simulated stage transitions
    return new Promise((resolve) => {
      queryEngine.executeQuery(rawQuery, (update) => {
        if (onProgressUpdate) onProgressUpdate(update);
        if (update.status === 'COMPLETED') {
          resolve({
            queryId: update.queryId || 'Q_FALLBACK',
            rawQuery,
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
