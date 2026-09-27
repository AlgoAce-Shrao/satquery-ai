/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Content for the console landing page, derived from the real observation
 * registry and the real query interpreter — nothing on the page is invented.
 */

import { GLOBAL_OBSERVATIONS } from '../../data/observations';
import { queryInterpreter } from '../../services/queryInterpreter';
import { observationToAnalysisResult } from '../../services/observationRegistry';
import { Observation, ObservationCategory } from '../../types/observation';
import { StructuredQuery, AnalysisResult } from '../../types/geospatial';

export const REGISTRY_SIZE = GLOBAL_OBSERVATIONS.length;

function getObservation(id: string): Observation {
  const obs = GLOBAL_OBSERVATIONS.find((o) => o.id === id);
  if (!obs) throw new Error(`Landing scenario references unknown observation ${id}`);
  return obs;
}

export interface QueryScenario {
  query: string;
  observation: Observation;
  parsed: StructuredQuery;
  /** Other registry observations in the same category — drawn as match arcs on the globe */
  matches: Observation[];
}

function buildScenario(query: string, observationId: string): QueryScenario {
  const observation = getObservation(observationId);
  return {
    query,
    observation,
    parsed: queryInterpreter.interpret(query),
    matches: GLOBAL_OBSERVATIONS.filter(
      (o) => o.category === observation.category && o.id !== observation.id
    ).slice(0, 5),
  };
}

/** Hero demo queries. Each targets one registry observation. */
export const HERO_SCENARIOS: QueryScenario[] = [
  buildScenario('Show vegetation loss in Punjab after the 2025 paddy harvest', 'OBS_PNB_005'),
  buildScenario('Where did the Amazon frontier lose forest canopy?', 'OBS_AMZ_001'),
  buildScenario('Track surface water change around Lake Chad', 'OBS_CHD_022'),
];

/** Punjab is the worked example used throughout the page. */
export const PRIMARY_SCENARIO = HERO_SCENARIOS[0];
export const PRIMARY_RESULT: AnalysisResult = observationToAnalysisResult(PRIMARY_SCENARIO.observation, 1);

/** Top registry decreases, as the console's default global query would rank them. */
export const RANKED_PREVIEW_RESULTS: AnalysisResult[] = [...GLOBAL_OBSERVATIONS]
  .filter((o) => o.percentageChange < 0)
  .sort((a, b) => a.percentageChange - b.percentageChange)
  .slice(0, 6)
  .map((o, i) => observationToAnalysisResult(o, i + 1));

export function formatLat(lat: number) {
  return `${Math.abs(lat).toFixed(4)}°${lat >= 0 ? 'N' : 'S'}`;
}

export function formatLon(lon: number) {
  return `${Math.abs(lon).toFixed(4)}°${lon >= 0 ? 'E' : 'W'}`;
}

export function formatDelta(pct: number) {
  return `${pct > 0 ? '+' : ''}${pct}%`;
}

export function countCategories(categories: ObservationCategory[]) {
  return GLOBAL_OBSERVATIONS.filter((o) => categories.includes(o.category)).length;
}

export function firstInCategories(categories: ObservationCategory[]) {
  return GLOBAL_OBSERVATIONS.find((o) => categories.includes(o.category));
}

/** Distinct sensors and modalities actually present in the registry. */
export const REGISTRY_SENSORS = Array.from(new Set(GLOBAL_OBSERVATIONS.map((o) => o.sensor)));
export const REGISTRY_MODALITIES = Array.from(new Set(GLOBAL_OBSERVATIONS.map((o) => o.modality)));
