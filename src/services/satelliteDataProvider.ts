/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Satellite Data Provider
 * Interfaces with the centralized Observation Intelligence Registry and Query Interpreter.
 */

import { AnalysisResult } from '../types/geospatial';
import { ObservationFilter } from '../types/observation';
import { observationRegistry, observationToAnalysisResult } from './observationRegistry';
import { queryInterpreter } from './queryInterpreter';

export interface SatelliteDataProvider {
  getResultsByIntent(intent: string, scope?: string, rawQuery?: string): Promise<AnalysisResult[]>;
  getAllResults(): Promise<AnalysisResult[]>;
  getResultById(id: string): Promise<AnalysisResult | undefined>;
  filterResults(filter: ObservationFilter): Promise<AnalysisResult[]>;
}

export class RegistrySatelliteDataProvider implements SatelliteDataProvider {
  async getAllResults(): Promise<AnalysisResult[]> {
    const all = observationRegistry.getAllObservations();
    return all.map((obs, idx) => observationToAnalysisResult(obs, idx + 1));
  }

  async getResultsByIntent(intent: string, scope?: string, rawQuery?: string): Promise<AnalysisResult[]> {
    if (rawQuery) {
      const { results } = queryInterpreter.execute(rawQuery);
      return results;
    }

    // Fallback if rawQuery not provided: use intent and scope
    const queryConstruct = `${intent.replace(/_/g, ' ')} ${scope || ''}`.trim();
    const { results } = queryInterpreter.execute(queryConstruct);
    return results;
  }

  async getResultById(id: string): Promise<AnalysisResult | undefined> {
    const obs = observationRegistry.getObservationById(id);
    if (!obs) return undefined;
    return observationToAnalysisResult(obs, 1);
  }

  async filterResults(filter: ObservationFilter): Promise<AnalysisResult[]> {
    const filtered = observationRegistry.filterObservations(filter);
    return filtered.map((obs, idx) => observationToAnalysisResult(obs, idx + 1));
  }
}

export const satelliteDataProvider = new RegistrySatelliteDataProvider();
