/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Query Interpreter & Result Ranker
 * Translates natural-language satellite queries into structured search criteria,
 * ranks matching observations by relevance, severity, and confidence, and returns ranked results.
 */

import { Observation, ObservationCategory, ObservationSeverity, ModalityType } from '../types/observation';
import { AnalysisResult, StructuredQuery } from '../types/geospatial';
import { observationRegistry, observationToAnalysisResult } from './observationRegistry';

export interface QueryInterpretationResult {
  structuredQuery: StructuredQuery;
  results: AnalysisResult[];
  matchedCount: number;
  totalCount: number;
}

export class QueryInterpreter {
  /**
   * Parses natural-language text into structured geospatial intent and filters
   */
  interpret(rawQuery: string): StructuredQuery {
    const q = rawQuery.toLowerCase();

    let intent = 'Vegetation_Change';
    let direction: 'DECREASE' | 'INCREASE' | 'ANOMALY' | 'COMPARISON' = 'DECREASE';
    let spatialScope = 'Global Terrestrial Biomes';
    let timeRange = 'Observation Window (2024–2026)';
    let targetMetric = 'NDVI (Normalized Difference Vegetation Index)';
    let threshold = 'Δ > 15%';
    let categoryFilter: ObservationCategory | undefined;
    let countryFilter: string | undefined;
    let sensorFilter: string | undefined;
    let modalityFilter: ModalityType | undefined;
    let severityFilter: ObservationSeverity | undefined;

    // 1. Geographic Scope Extraction
    if (q.includes('india') || q.includes('kerala') || q.includes('assam') || q.includes('punjab') || q.includes('delhi') || q.includes('mumbai') || q.includes('sundarbans') || q.includes('godavari')) {
      spatialScope = 'India & Subcontinent';
      countryFilter = 'India';
    } else if (q.includes('brazil') || q.includes('amazon') || q.includes('mato grosso') || q.includes('cerrado') || q.includes('pantanal')) {
      spatialScope = 'Brazil & Amazon Basin';
      countryFilter = 'Brazil';
    } else if (q.includes('usa') || q.includes('united states') || q.includes('california') || q.includes('lake mead') || q.includes('central valley')) {
      spatialScope = 'United States';
      countryFilter = 'United States';
    } else if (q.includes('australia') || q.includes('blue mountains') || q.includes('barrier reef')) {
      spatialScope = 'Australia';
      countryFilter = 'Australia';
    } else if (q.includes('greece') || q.includes('mediterranean') || q.includes('attica')) {
      spatialScope = 'Mediterranean Basin';
      countryFilter = 'Greece';
    } else if (q.includes('indonesia') || q.includes('kalimantan') || q.includes('sumatra') || q.includes('jakarta')) {
      spatialScope = 'Indonesia';
      countryFilter = 'Indonesia';
    } else if (q.includes('europe') || q.includes('france') || q.includes('germany') || q.includes('ukraine') || q.includes('netherlands')) {
      spatialScope = 'European Continent';
    } else if (q.includes('africa') || q.includes('congo') || q.includes('chad') || q.includes('sahel') || q.includes('madagascar') || q.includes('botswana') || q.includes('egypt')) {
      spatialScope = 'African Continent';
    }

    // 2. Sensor & Modality Extraction
    if (q.includes('sentinel-1') || q.includes('sar') || q.includes('radar') || q.includes('insar')) {
      sensorFilter = 'Sentinel-1';
      modalityFilter = 'SAR';
    } else if (q.includes('sentinel-2')) {
      sensorFilter = 'Sentinel-2';
      modalityFilter = 'OPTICAL';
    } else if (q.includes('landsat') || q.includes('landsat-8') || q.includes('landsat-9')) {
      sensorFilter = 'Landsat';
      modalityFilter = 'OPTICAL';
    }

    // 3. Severity Extraction
    if (q.includes('critical')) {
      severityFilter = 'CRITICAL';
    } else if (q.includes('high severity') || q.includes('high impact')) {
      severityFilter = 'HIGH';
    }

    // 4. Intent & Category Classification
    if (q.includes('optical and sar') || q.includes('sar images together') || (q.includes('sar') && q.includes('optical'))) {
      intent = 'Multimodal_Optical_SAR_Fusion';
      targetMetric = 'Optical Reflectance + SAR Backscatter Fusion';
      sensorFilter = 'Sentinel-1';
      modalityFilter = 'MULTIMODAL';
    } else if (q.includes('what changed') || q.includes('between these two dates') || q.includes('change between')) {
      intent = 'Bi_Temporal_Change_Detection';
      targetMetric = 'Radiometric Surface Change Delta';
      direction = 'COMPARISON';
    } else if (q.includes('land-cover') || q.includes('land cover') || q.includes('types visible')) {
      intent = 'Land_Cover_Classification';
      targetMetric = 'Multispectral Land Cover & Biome Partition';
    } else if (q.includes('highlight the water body') || q.includes('water body referred')) {
      intent = 'Spatial_Grounding_Water_Body';
      categoryFilter = 'WATER_CHANGE';
      targetMetric = 'NDWI Water Body Delineation';
    } else if (q.includes('flood') || q.includes('inundation') || q.includes('waterlog')) {
      intent = 'Flood_Inundation_Analysis';
      categoryFilter = 'FLOOD';
      targetMetric = 'NDWI / SAR Water Backscatter';
      direction = 'INCREASE';
    } else if (q.includes('water') || q.includes('lake') || q.includes('sea') || q.includes('desiccation') || q.includes('reservoir') || q.includes('river')) {
      intent = 'Water_Body_Dynamics';
      categoryFilter = 'WATER_CHANGE';
      targetMetric = 'NDWI (Normalized Difference Water Index)';
    } else if (q.includes('fire') || q.includes('wildfire') || q.includes('burn') || q.includes('bushfire') || q.includes('scar')) {
      intent = 'Wildfire_Burn_Severity';
      categoryFilter = 'WILDFIRE';
      targetMetric = 'dNBR (Differenced Normalized Burn Ratio)';
    } else if (q.includes('deforestation') || q.includes('forest loss') || q.includes('clearing') || q.includes('canopy loss')) {
      intent = 'Deforestation_Tracking';
      categoryFilter = 'DEFORESTATION';
      targetMetric = 'NDVI (Canopy Vitality)';
    } else if (q.includes('urban') || q.includes('city') || q.includes('built') || q.includes('expansion') || q.includes('development')) {
      intent = 'Urban_Expansion';
      categoryFilter = 'URBAN_EXPANSION';
      targetMetric = 'NDBI (Normalized Difference Built-Up Index)';
      direction = 'INCREASE';
    } else if (q.includes('coastal') || q.includes('mangrove') || q.includes('subsidence') || q.includes('shoreline') || q.includes('reef')) {
      intent = 'Coastal_Dynamics';
      categoryFilter = 'COASTAL_CHANGE';
      targetMetric = 'Coastal Inundation / InSAR Velocity';
    } else if (q.includes('crop') || q.includes('agriculture') || q.includes('harvest') || q.includes('farming') || q.includes('paddy') || q.includes('aquaculture')) {
      intent = 'Agricultural_Change';
      categoryFilter = 'AGRICULTURE';
      targetMetric = 'NDVI / Crop Moisture / EVI';
    } else if (q.includes('vegetation') || q.includes('greenness') || q.includes('biomass') || q.includes('tree') || q.includes('savanna')) {
      intent = 'Vegetation_Change';
      categoryFilter = 'VEGETATION_CHANGE';
      targetMetric = 'NDVI (Normalized Difference Vegetation Index)';
    }

    if (q.includes('increase') || q.includes('growth') || q.includes('expanded') || q.includes('expansion')) {
      direction = 'INCREASE';
    }

    return {
      rawQuery,
      intent,
      direction,
      spatialScope,
      timeRange,
      targetMetric,
      threshold,
      categoryFilter,
      countryFilter,
      sensorFilter,
      modalityFilter,
      severityFilter,
    };
  }

  /**
   * Executes query interpretation, ranks observations, and returns results
   */
  execute(rawQuery: string): QueryInterpretationResult {
    const structuredQuery = this.interpret(rawQuery);
    const allObs = observationRegistry.getAllObservations();
    const qTokens = rawQuery.toLowerCase().split(/\s+/).filter((w) => w.length > 2);

    // Target categories
    const targetCategories: ObservationCategory[] = [];
    if (structuredQuery.categoryFilter) {
      targetCategories.push(structuredQuery.categoryFilter);
    } else if (structuredQuery.intent === 'Vegetation_Change') {
      targetCategories.push('VEGETATION_CHANGE', 'DEFORESTATION', 'AGRICULTURE');
    } else if (structuredQuery.intent === 'Water_Body_Dynamics' || structuredQuery.intent === 'Flood_Inundation_Analysis') {
      targetCategories.push('FLOOD', 'WATER_CHANGE', 'COASTAL_CHANGE');
    }

    // Score and rank all observations
    const scoredList = allObs.map((obs) => {
      let score = observationRegistry.calculateRelevanceScore(
        obs,
        qTokens,
        targetCategories,
        structuredQuery.countryFilter,
        structuredQuery.sensorFilter
      );

      // Explicit severity filter
      if (structuredQuery.severityFilter && obs.severity === structuredQuery.severityFilter) {
        score += 80;
      }

      // Modality filter bonus
      if (structuredQuery.modalityFilter && obs.modality === structuredQuery.modalityFilter) {
        score += 35;
      }

      return { obs, score };
    });

    // Sort by descending score
    scoredList.sort((a, b) => b.score - a.score);

    // Filter to relevant results (score threshold or top matches)
    const topScored = scoredList.filter((item) => item.score > 35);
    const resultsPool = topScored.length > 0 ? topScored : scoredList.slice(0, 10);

    const formattedResults: AnalysisResult[] = resultsPool.map((item, idx) =>
      observationToAnalysisResult(item.obs, idx + 1)
    );

    return {
      structuredQuery,
      results: formattedResults,
      matchedCount: formattedResults.length,
      totalCount: allObs.length,
    };
  }
}

export const queryInterpreter = new QueryInterpreter();
