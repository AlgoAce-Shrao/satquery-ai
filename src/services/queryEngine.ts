/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ProcessStep, QueryExecutionState } from '../types/geospatial';
import { queryInterpreter } from './queryInterpreter';
import { satelliteDataProvider } from './satelliteDataProvider';

export class QueryEngine {
  createInitialState(rawQuery: string): QueryExecutionState {
    const structured = queryInterpreter.interpret(rawQuery);
    const observationId = `SAT-${new Date().toISOString().slice(0, 10)}`;

    const steps: ProcessStep[] = [
      {
        id: 'step_intent',
        label: 'Understanding Query Intent',
        detail: `Classified as ${structured.intent.replace(/_/g, ' ')} (${structured.targetMetric.split(' ')[0]})`,
        status: 'PENDING',
        durationMs: 280,
      },
      {
        id: 'step_spatial',
        label: 'Resolving Geographic Scope & Sensor Modality',
        detail: `Filtering registry for ${structured.spatialScope} [${structured.sensorFilter || 'Multi-Sensor'}]`,
        status: 'PENDING',
        durationMs: 320,
      },
      {
        id: 'step_search',
        label: 'Searching Observation Registry',
        detail: 'Scanning global Sentinel-1 SAR, Sentinel-2 Optical & Landsat scenes',
        status: 'PENDING',
        durationMs: 380,
      },
      {
        id: 'step_analysis',
        label: 'Ranking Multi-Spectral Anomaly Relevance',
        detail: `Evaluating radiometric deltas [${structured.targetMetric.split(' ')[0]}]`,
        status: 'PENDING',
        durationMs: 400,
      },
      {
        id: 'step_nav',
        label: 'Preparing 3D Earth Navigation',
        detail: 'Generating camera flight vectors to highest-confidence cluster',
        status: 'PENDING',
        durationMs: 250,
      },
    ];

    return {
      queryId: `QRY-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      rawQuery,
      structuredQuery: structured,
      status: 'IDLE',
      currentStepIndex: 0,
      steps,
      results: [],
      activeResultIndex: 0,
      isTourActive: false,
      systemMessage: 'SatQuery observation intelligence registry ready.',
      observationId,
      filterCount: 0,
    };
  }

  async executeQuery(
    rawQuery: string,
    onProgress: (stateUpdate: Partial<QueryExecutionState>) => void
  ): Promise<QueryExecutionState> {
    const state = this.createInitialState(rawQuery);
    state.status = 'PROCESSING';
    onProgress({ status: 'PROCESSING', steps: [...state.steps], rawQuery, structuredQuery: state.structuredQuery });

    for (let i = 0; i < state.steps.length; i++) {
      state.currentStepIndex = i;
      state.steps[i].status = 'RUNNING';
      onProgress({ currentStepIndex: i, steps: [...state.steps] });

      await new Promise((r) => setTimeout(r, state.steps[i].durationMs || 300));

      state.steps[i].status = 'COMPLETED';
      onProgress({ steps: [...state.steps] });
    }

    const { results, matchedCount, totalCount } = queryInterpreter.execute(rawQuery);

    const observationId = results[0]
      ? `${results[0].siteCode.replace('SITE_', '')}-${results[0].observationPeriod.afterDate}`
      : `SAT-${new Date().toISOString().slice(0, 10)}`;

    state.results = results;
    state.activeResultIndex = 0;
    state.status = 'COMPLETED';
    state.isTourActive = true;
    state.observationId = observationId;
    state.filterCount = matchedCount;
    state.systemMessage = `Identified ${matchedCount} observations matching query across ${totalCount} global registry records. Flying to Result #1 (${results[0]?.regionName || 'Selected Location'}).`;

    onProgress(state);
    return state;
  }
}

export const queryEngine = new QueryEngine();
