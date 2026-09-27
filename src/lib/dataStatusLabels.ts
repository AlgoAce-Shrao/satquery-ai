import { DataStatus } from '../types/observation';

export interface DataStatusBadge {
  shortLabel: string;
  mediumLabel: string;
  longLabel: string;
  colorClass: string;
}

/** Shared, honest labeling for the DataStatus values (see types/observation.ts). */
export function getDataStatusBadge(dataStatus: DataStatus): DataStatusBadge {
  switch (dataStatus) {
    case 'PUBLIC_DATA':
      return {
        shortLabel: 'PUB DATA',
        mediumLabel: 'PUBLIC SATELLITE DATA',
        longLabel: 'Public Satellite Benchmark Observation',
        colorClass: 'bg-sq-accent/10 text-sq-accent border-sq-accent/40',
      };
    case 'USER_RASTER_ANALYSIS':
      return {
        shortLabel: 'REAL ANALYSIS',
        mediumLabel: 'REAL PIXEL ANALYSIS',
        longLabel: 'Real rule-based pixel analysis computed from your uploaded image',
        colorClass: 'bg-emerald-400/10 text-emerald-300 border-emerald-400/40',
      };
    case 'AI_VISION_ANALYSIS':
      return {
        shortLabel: 'AI VISION',
        mediumLabel: 'AI VISION ANALYSIS',
        longLabel: 'AI interpretation of your uploaded image (visual estimates, not pixel measurements)',
        colorClass: 'bg-sq-amber/10 text-sq-amber border-sq-amber/40',
      };
    default:
      return {
        shortLabel: 'DEMO',
        mediumLabel: 'DEMO OBSERVATION',
        longLabel: 'Simulated Demonstration Observation (no real computation)',
        colorClass: 'bg-amber-400/10 text-amber-300 border-amber-400/40',
      };
  }
}
