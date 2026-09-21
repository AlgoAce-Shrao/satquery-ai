import { DataStatus } from '../types/observation';

export interface DataStatusBadge {
  shortLabel: string;
  mediumLabel: string;
  longLabel: string;
  colorClass: string;
}

/** Shared, honest labeling for the three DataStatus values (see types/observation.ts). */
export function getDataStatusBadge(dataStatus: DataStatus): DataStatusBadge {
  switch (dataStatus) {
    case 'PUBLIC_DATA':
      return {
        shortLabel: 'PUB DATA',
        mediumLabel: 'PUBLIC SATELLITE DATA',
        longLabel: 'Public Satellite Benchmark Observation',
        colorClass: 'bg-[#3df2ff]/10 text-[#3df2ff] border-[#3df2ff]/40',
      };
    case 'USER_RASTER_ANALYSIS':
      return {
        shortLabel: 'REAL ANALYSIS',
        mediumLabel: 'REAL PIXEL ANALYSIS',
        longLabel: 'Real rule-based pixel analysis computed from your uploaded image',
        colorClass: 'bg-emerald-400/10 text-emerald-300 border-emerald-400/40',
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
