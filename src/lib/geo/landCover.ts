/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Land-cover class labels and colours shared by the upload report and the
 * basic interpreter. Colours follow the palette tokens in src/index.css.
 */

import type { VisionRegion } from '../../types/geospatial';

export type LandCoverClass = VisionRegion['category'];

export const LAND_COVER_LABEL: Record<LandCoverClass, string> = {
  VEGETATION: 'Vegetation',
  FOREST: 'Forest',
  CROPLAND: 'Cropland',
  WATER: 'Water',
  WETLAND: 'Wetland',
  BUILT_UP: 'Built-up',
  BARE_SOIL: 'Bare soil',
  BURN_SCAR: 'Burn scar',
  FLOOD: 'Flood water',
  SNOW_ICE: 'Snow / ice',
  CLOUD: 'Cloud / bright surface',
  OTHER: 'Other',
};

export const LAND_COVER_COLOR: Record<LandCoverClass, string> = {
  VEGETATION: '#7FA66A',
  FOREST: '#5E8A55',
  CROPLAND: '#A6B86A',
  WATER: '#6F8C8E',
  WETLAND: '#8FA8A9',
  BUILT_UP: '#C4A484',
  BARE_SOIL: '#B58B5A',
  BURN_SCAR: '#B85C4A',
  FLOOD: '#5F7F86',
  SNOW_ICE: '#E6E2D6',
  CLOUD: '#9D9B8F',
  OTHER: '#6F7068',
};
