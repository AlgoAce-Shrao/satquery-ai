/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Central Observation Intelligence Registry
 * Contains 40 globally distributed remote sensing observations.
 * Explicitly tagged with dataStatus: 'PUBLIC_DATA' or 'DEMO_DATA'.
 */

import { Observation } from '../types/observation';

export const GLOBAL_OBSERVATIONS: Observation[] = [
  // 1. Amazon Basin - Brazil (Deforestation)
  {
    id: 'OBS_AMZ_001',
    title: 'Amazon Basin Frontier Canopy Loss',
    region: 'Amazon Basin, Mato Grosso / Pará',
    country: 'Brazil',
    latitude: -10.8281,
    longitude: -55.8594,
    category: 'DEFORESTATION',
    severity: 'CRITICAL',
    baselineDate: '2025-01-14',
    targetDate: '2026-07-22',
    metricName: 'NDVI (Canopy Vitality)',
    baselineValue: 0.71,
    targetValue: 0.47,
    percentageChange: -34.2,
    confidence: 0.94,
    sensor: 'Sentinel-2',
    modality: 'OPTICAL',
    platform: 'Sentinel-2 L2A MultiSpectral Instrument (MSI)',
    description: 'Severe loss of primary rainforest canopy along agricultural expansion frontiers.',
    inference: 'Bi-temporal NDVI delta and SWIR reflectance verify high-intensity clear-cutting followed by pasture preparation.',
    evidence: [
      'NDVI decreased from 0.71 to 0.47 across 2,450 km²',
      'Shortwave infrared (SWIR-2) reflectance increased by 253% indicating dry soil exposure',
      'High-resolution spatial clustering matches typical fishbone deforestation grid geometry'
    ],
    dataStatus: 'PUBLIC_DATA',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [-59.5, -7.5], [-54.0, -6.8], [-51.2, -8.5], [-52.0, -13.2],
        [-57.5, -14.6], [-60.8, -12.8], [-61.2, -9.5], [-59.5, -7.5]
      ]]
    },
    boundingBox: [-61.2, -14.6, -51.2, -6.8],
    polygonCoordinates: [
      { lat: -7.5, lon: -59.5 }, { lat: -6.8, lon: -54.0 }, { lat: -8.5, lon: -51.2 },
      { lat: -13.2, lon: -52.0 }, { lat: -14.6, lon: -57.5 }, { lat: -12.8, lon: -60.8 },
      { lat: -9.5, lon: -61.2 }, { lat: -7.5, lon: -59.5 }
    ],
    biome: 'Tropical Evergreen Rainforest',
    areaAffectedSqKm: 2450.5,
    cloudCover: 1.8,
    primaryDrivers: ['Frontier Deforestation', 'Agribusiness expansion', 'Microclimate dry-down'],
    spectralBands: [
      { band: 'B02', wavelength: '490 nm', name: 'Blue', beforeReflectance: 0.038, afterReflectance: 0.062 },
      { band: 'B03', wavelength: '560 nm', name: 'Green', beforeReflectance: 0.052, afterReflectance: 0.089 },
      { band: 'B04', wavelength: '665 nm', name: 'Red', beforeReflectance: 0.041, afterReflectance: 0.145 },
      { band: 'B08', wavelength: '842 nm', name: 'NIR', beforeReflectance: 0.428, afterReflectance: 0.231 },
      { band: 'B11', wavelength: '1610 nm', name: 'SWIR-1', beforeReflectance: 0.118, afterReflectance: 0.285 },
      { band: 'B12', wavelength: '2190 nm', name: 'SWIR-2', beforeReflectance: 0.056, afterReflectance: 0.198 }
    ],
    agentTrace: {
      task: 'Bi-Temporal Deforestation Detection',
      agent: 'Optical Change & Grounding Specialist',
      models: ['GeoVLM-Remote-Large', 'BiTemporal-DiffNet-v2'],
      tools: ['Sentinel-2 L2A Ingestion', 'Atmospheric Correction BOA', 'NDVI Delta Calculator', 'Canopy Mask Tool'],
      confidence: 0.94,
      reasoning: 'Red band absorption dropped significantly while SWIR reflection doubled, indicating complete canopy removal and exposed ground.'
    }
  },

  // 2. Mato Grosso Southern Arc - Brazil (Agriculture)
  {
    id: 'OBS_MT_002',
    title: 'Mato Grosso Intensive Cropland Conversion',
    region: 'Mato Grosso Southern Arc',
    country: 'Brazil',
    latitude: -13.2500,
    longitude: -56.5000,
    category: 'AGRICULTURE',
    severity: 'HIGH',
    baselineDate: '2025-02-10',
    targetDate: '2026-06-15',
    metricName: 'EVI (Enhanced Vegetation Index)',
    baselineValue: 0.62,
    targetValue: 0.38,
    percentageChange: -38.7,
    confidence: 0.91,
    sensor: 'Landsat-9',
    modality: 'OPTICAL',
    platform: 'Landsat-9 OLI-2 / TIRS-2',
    description: 'Conversion of transitional savanna-forest into double-crop soybean acreage.',
    inference: 'Large contiguous center-pivot and grid field clearing observed with sharp spectral transitions between wet and dry seasons.',
    evidence: [
      'EVI shift of -38.7% across 1,820 km²',
      'Thermal Infrared Sensor (TIRS-2) shows 3.2K surface temperature increase following moisture-retaining cover loss'
    ],
    dataStatus: 'DEMO_DATA',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [-57.8, -12.2], [-55.2, -12.0], [-55.0, -14.5], [-57.6, -14.6], [-57.8, -12.2]
      ]]
    },
    polygonCoordinates: [
      { lat: -12.2, lon: -57.8 }, { lat: -12.0, lon: -55.2 }, { lat: -14.5, lon: -55.0 },
      { lat: -14.6, lon: -57.6 }, { lat: -12.2, lon: -57.8 }
    ],
    biome: 'Cerrado-Amazon Transition',
    areaAffectedSqKm: 1820.0,
    cloudCover: 2.4,
    primaryDrivers: ['Soybean agribusiness expansion', 'Center-pivot installation', 'Seasonal fallow'],
    agentTrace: {
      task: 'Agricultural Expansion Tracking',
      agent: 'Land Cover Classification Agent',
      models: ['CropSeg-Transformer-v1', 'SpectralIndex-Matcher'],
      tools: ['Landsat-9 Surface Reflectance', 'Temporal Curve Fitting', 'EVI Calculator'],
      confidence: 0.91
    }
  },

  // 3. Kerala Central - India (Flood)
  {
    id: 'OBS_KER_003',
    title: 'Kerala Central Flood Plain Inundation',
    region: 'Kuttanad & Ernakulam Basins, Kerala',
    country: 'India',
    latitude: 9.6000,
    longitude: 76.5000,
    category: 'FLOOD',
    severity: 'CRITICAL',
    baselineDate: '2025-05-10',
    targetDate: '2026-08-04',
    metricName: 'SAR Water Backscatter Delta',
    baselineValue: -11.2,
    targetValue: -21.8,
    percentageChange: +94.6,
    confidence: 0.96,
    sensor: 'Sentinel-1',
    modality: 'SAR',
    platform: 'Sentinel-1 C-SAR (Interferometric Wide Swath)',
    description: 'Extensive monsoon flood inundation across coastal and wetland agricultural lowlands.',
    inference: 'C-band synthetic aperture radar VH/VV backscatter drop of >10 dB confirms specular reflection over waterlogged residential and paddy sectors.',
    evidence: [
      'Sentinel-1 C-SAR backscatter attenuation over 680 km²',
      'Permanent cloud penetration enabled by active radar sensor during peak monsoon storm event',
      'Co-polarized VV and cross-polarized VH ratios confirm flooded vegetation signatures'
    ],
    dataStatus: 'PUBLIC_DATA',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [76.1, 10.2], [76.9, 10.1], [76.8, 9.1], [76.0, 9.2], [76.1, 10.2]
      ]]
    },
    polygonCoordinates: [
      { lat: 10.2, lon: 76.1 }, { lat: 10.1, lon: 76.9 }, { lat: 9.1, lon: 76.8 },
      { lat: 9.2, lon: 76.0 }, { lat: 10.2, lon: 76.1 }
    ],
    biome: 'Tropical Wet Lowland & Backwaters',
    areaAffectedSqKm: 680.0,
    cloudCover: 92.0,
    primaryDrivers: ['Extreme monsoon precipitation pulse', 'Dam spillway discharge', 'Backwater drainage congestion'],
    agentTrace: {
      task: 'All-Weather SAR Inundation Mapping',
      agent: 'SAR / Multi-Modal Fusion Agent',
      models: ['SAR-WaterNet-v3', 'Otsu-Threshold-Engine'],
      tools: ['Sentinel-1 GRD Processing', 'Speckle Filter Refined Lee', 'Terrain Shadow Mask'],
      confidence: 0.96,
      reasoning: 'Optical imagery was unusable due to 92% monsoon cloud cover; SAR dual-polarization successfully mapped open standing water.'
    }
  },

  // 4. Assam Brahmaputra - India (Flood)
  {
    id: 'OBS_ASM_004',
    title: 'Brahmaputra Basin Monsoonal Inundation',
    region: 'Kaziranga & Majuli Corridor, Assam',
    country: 'India',
    latitude: 26.7500,
    longitude: 93.8000,
    category: 'FLOOD',
    severity: 'HIGH',
    baselineDate: '2025-04-12',
    targetDate: '2026-07-18',
    metricName: 'NDWI (Water Inundation Index)',
    baselineValue: 0.28,
    targetValue: 0.69,
    percentageChange: +146.4,
    confidence: 0.93,
    sensor: 'Sentinel-1',
    modality: 'MULTIMODAL',
    platform: 'Sentinel-1 SAR + Sentinel-2 MSI Multi-Sensor Fusion',
    description: 'Severe seasonal river overflow inundating riverine islands and national park floodplains.',
    inference: 'Synergistic SAR backscatter and optical NDWI delineate 1,240 km² of submerged riverbank buffers.',
    evidence: [
      'Water surface index increased by 146.4%',
      'Kaziranga wildlife corridor submerged up to 78% of total geographic expanse'
    ],
    dataStatus: 'PUBLIC_DATA',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [92.8, 27.2], [94.8, 27.1], [94.7, 26.2], [92.7, 26.3], [92.8, 27.2]
      ]]
    },
    polygonCoordinates: [
      { lat: 27.2, lon: 92.8 }, { lat: 27.1, lon: 94.8 }, { lat: 26.2, lon: 94.7 },
      { lat: 26.3, lon: 92.7 }, { lat: 27.2, lon: 92.8 }
    ],
    biome: 'Riverine Floodplain Grassland',
    areaAffectedSqKm: 1240.0,
    cloudCover: 65.0,
    primaryDrivers: ['Himalayan snowmelt + monsoon surge', 'Channel siltation', 'Embankment breach'],
    agentTrace: {
      task: 'Multimodal Flood Extent Extraction',
      agent: 'Multi-Sensor Fusion Specialist',
      models: ['CrossModal-FloodSegmenter', 'HydroDynamic-Aligner'],
      tools: ['SAR Calibration', 'Optical Cloud-Hole Patching', 'Hydrological Dem Flow Map'],
      confidence: 0.93
    }
  },

  // 5. Punjab - India (Agriculture)
  {
    id: 'OBS_PNB_005',
    title: 'Punjab Intensive Crop Cycle & Post-Harvest Burn Scar',
    region: 'Ludhiana / Sangrur Agri-Belt, Punjab',
    country: 'India',
    latitude: 30.9000,
    longitude: 75.8500,
    category: 'AGRICULTURE',
    severity: 'HIGH',
    baselineDate: '2025-09-20',
    targetDate: '2025-11-05',
    metricName: 'NBR (Normalized Burn Ratio) / NDVI',
    baselineValue: 0.68,
    targetValue: 0.24,
    percentageChange: -64.7,
    confidence: 0.95,
    sensor: 'Sentinel-2',
    modality: 'OPTICAL',
    platform: 'Sentinel-2 L2A MSI',
    description: 'Rapid post-monsoon paddy harvest followed by extensive crop residue thermal anomalies.',
    inference: 'Sharp drop in NDVI accompanied by shortwave thermal spikes indicates rapid field clearing in transition to Rabi wheat sowing.',
    evidence: [
      'NDVI dropped from 0.68 to 0.24 in 45 days over 3,100 km²',
      'SWIR anomaly clusters confirmed over 14,000 localized farm parcels'
    ],
    dataStatus: 'PUBLIC_DATA',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [74.8, 31.6], [76.8, 31.5], [76.6, 30.0], [74.6, 30.1], [74.8, 31.6]
      ]]
    },
    polygonCoordinates: [
      { lat: 31.6, lon: 74.8 }, { lat: 31.5, lon: 76.8 }, { lat: 30.0, lon: 76.6 },
      { lat: 30.1, lon: 74.6 }, { lat: 31.6, lon: 74.8 }
    ],
    biome: 'Indo-Gangetic Alluvial Plain',
    areaAffectedSqKm: 3100.0,
    cloudCover: 1.2,
    primaryDrivers: ['Paddy-wheat crop rotation', 'Stubble management timing', 'Intensive mechanized harvesting'],
    agentTrace: {
      task: 'Phenological Change & Residue Thermal Mapping',
      agent: 'Agriculture & Thermal Analyst',
      models: ['AgriPheno-Net-v2', 'Thermal-Hotspot-Detector'],
      tools: ['SWIR Band Difference', 'NBR Anomaly Engine', 'Cadastral Parcel Overlay'],
      confidence: 0.95
    }
  },

  // 6. Delhi NCR - India (Urban Expansion)
  {
    id: 'OBS_DL_006',
    title: 'Delhi National Capital Region Urban Frontier',
    region: 'Gurugram / Noida / Greater Noida Peripheral Belt',
    country: 'India',
    latitude: 28.5500,
    longitude: 77.2500,
    category: 'URBAN_EXPANSION',
    severity: 'HIGH',
    baselineDate: '2024-12-01',
    targetDate: '2026-05-15',
    metricName: 'NDBI (Built-Up Index)',
    baselineValue: 0.18,
    targetValue: 0.31,
    percentageChange: +72.2,
    confidence: 0.92,
    sensor: 'Sentinel-2',
    modality: 'OPTICAL',
    platform: 'Sentinel-2 MSI',
    description: 'Rapid transformation of peri-urban agricultural fringe into high-density commercial and residential developments.',
    inference: 'Continuous expansion of impervious concrete and asphalt surfaces along expressways (Dwarka, Yamuna, KMP).',
    evidence: [
      'NDBI increase of +72.2% across 460 km²',
      'Surface albedo and nighttime radiant energy correlation verify dense urban infrastructure'
    ],
    dataStatus: 'DEMO_DATA',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [76.8, 28.9], [77.7, 28.8], [77.6, 28.2], [76.7, 28.3], [76.8, 28.9]
      ]]
    },
    polygonCoordinates: [
      { lat: 28.9, lon: 76.8 }, { lat: 28.8, lon: 77.7 }, { lat: 28.2, lon: 77.6 },
      { lat: 28.3, lon: 76.7 }, { lat: 28.9, lon: 76.8 }
    ],
    biome: 'Semi-Arid Alluvial Urban Transition',
    areaAffectedSqKm: 460.0,
    cloudCover: 3.1,
    primaryDrivers: ['Expressway infrastructure corridors', 'Commercial logistics hubs', 'High-density residential development'],
    agentTrace: {
      task: 'Urban Expansion Segmentation',
      agent: 'Built Environment Agent',
      models: ['UrbanMask-Transformer', 'ImperviousSurface-Net'],
      tools: ['NDBI Calculator', 'Morphological Building Filter', 'Road Vector Ingestion'],
      confidence: 0.92
    }
  },

  // 7. Mumbai - India (Infrastructure & Coastal Reclamation)
  {
    id: 'OBS_MUM_007',
    title: 'Mumbai Coastal Road & Port Infrastructure',
    region: 'South Mumbai & Navi Mumbai Coastal Belt',
    country: 'India',
    latitude: 18.9800,
    longitude: 72.8200,
    category: 'INFRASTRUCTURE',
    severity: 'MODERATE',
    baselineDate: '2024-10-10',
    targetDate: '2026-04-20',
    metricName: 'SAR Coherence & Optical Land Reclamation Delta',
    baselineValue: 0.12,
    targetValue: 0.35,
    percentageChange: +191.6,
    confidence: 0.94,
    sensor: 'Sentinel-1',
    modality: 'MULTIMODAL',
    platform: 'Sentinel-1 SAR + Sentinel-2 MSI',
    description: 'Major offshore reclamation and bridge corridor construction along the Arabian Sea shoreline.',
    inference: 'Interferometric coherence and multi-spectral edge detection delineate 42 km² of newly created engineered land surface.',
    evidence: [
      'Direct shoreline shift of up to 450m seaward',
      'Stable SAR persistent scatterer signatures established over newly settled marine piles'
    ],
    dataStatus: 'DEMO_DATA',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [72.75, 19.15], [73.05, 19.14], [73.02, 18.88], [72.72, 18.90], [72.75, 19.15]
      ]]
    },
    polygonCoordinates: [
      { lat: 19.15, lon: 72.75 }, { lat: 19.14, lon: 73.05 }, { lat: 18.88, lon: 73.02 },
      { lat: 18.90, lon: 72.72 }, { lat: 19.15, lon: 72.75 }
    ],
    biome: 'Coastal Marine Estuary',
    areaAffectedSqKm: 42.5,
    cloudCover: 5.2,
    primaryDrivers: ['Coastal Road transport corridor', 'Navi Mumbai Airport reclamation', 'Port terminal expansion'],
    agentTrace: {
      task: 'Coastal Infrastructure Extraction',
      agent: 'SAR Interferometry & Marine Agent',
      models: ['InSAR-CoherenceNet', 'MarineShoreline-Tracker'],
      tools: ['Sentinel-1 SLC Interferometry', 'Tidal Level Calibration', 'Edge Detection Filter'],
      confidence: 0.94
    }
  },

  // 8. Sundarbans - India / Bangladesh (Coastal & Mangrove)
  {
    id: 'OBS_SUN_008',
    title: 'Sundarbans Biosphere Mangrove Stress & Tidal Erosion',
    region: 'Sundarbans Delta, West Bengal',
    country: 'India',
    latitude: 21.9497,
    longitude: 89.1833,
    category: 'COASTAL_CHANGE',
    severity: 'CRITICAL',
    baselineDate: '2025-02-10',
    targetDate: '2026-06-18',
    metricName: 'NDVI (Mangrove Canopy Continuity)',
    baselineValue: 0.69,
    targetValue: 0.51,
    percentageChange: -26.1,
    confidence: 0.92,
    sensor: 'Sentinel-2',
    modality: 'OPTICAL',
    platform: 'Sentinel-2 L2A MSI',
    description: 'Progressive dieback of halophytic mangrove stands and island erosion along exposed outer delta channels.',
    inference: 'Cyclonic storm surge salinization combined with upstream freshwater reduction has led to sustained vegetative stress.',
    evidence: [
      'Canopy greenness index dropped 26.1% over 1,120 km²',
      'Outer barrier island mudflat edge retreat measured at average 18m/year'
    ],
    dataStatus: 'PUBLIC_DATA',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [88.4, 22.6], [89.9, 22.7], [90.0, 21.3], [88.5, 21.2], [88.4, 22.6]
      ]]
    },
    polygonCoordinates: [
      { lat: 22.6, lon: 88.4 }, { lat: 22.7, lon: 89.9 }, { lat: 21.3, lon: 90.0 },
      { lat: 21.2, lon: 88.5 }, { lat: 22.6, lon: 88.4 }
    ],
    biome: 'Tidal Mangrove Wetland',
    areaAffectedSqKm: 1120.4,
    cloudCover: 3.2,
    primaryDrivers: ['Salinity intrusion', 'Cyclonic tidal surge damage', 'Mudflat coastal erosion'],
    agentTrace: {
      task: 'Mangrove Health & Coastal Boundary Analysis',
      agent: 'Wetland & Coastal Ecology Agent',
      models: ['MangroveVigour-SegNet', 'TidalChannel-Profiler'],
      tools: ['Tide-Synchronized Composite', 'NDVI Red-Edge Ratio', 'Mudflat Morphometry'],
      confidence: 0.92
    }
  },

  // 9. Attica - Greece (Wildfire)
  {
    id: 'OBS_GRC_009',
    title: 'Attica Peninsula Crown Wildfire Burn Scar',
    region: 'Mount Parnitha / Penteli Corridor, Attica',
    country: 'Greece',
    latitude: 38.1167,
    longitude: 23.8667,
    category: 'WILDFIRE',
    severity: 'CRITICAL',
    baselineDate: '2025-06-01',
    targetDate: '2026-08-10',
    metricName: 'dNBR (Burn Severity Index)',
    baselineValue: 0.58,
    targetValue: 0.34,
    percentageChange: -41.4,
    confidence: 0.96,
    sensor: 'Sentinel-2',
    modality: 'OPTICAL',
    platform: 'Sentinel-2 MSI',
    description: 'Catastrophic pine woodland canopy destruction caused by high-intensity crown wildfire propagation.',
    inference: 'Post-fire shortwave infrared (SWIR-2) reflection and deep NIR absorption confirm high-severity charcoal and ash deposition.',
    evidence: [
      'dNBR score of >0.66 classifying severe crown mortality across 420 km²',
      'Thermal anomaly records recorded 1,200+ active fire pixels during 72-hour propagation window'
    ],
    dataStatus: 'PUBLIC_DATA',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [23.6, 38.35], [24.1, 38.32], [24.0, 37.95], [23.65, 37.98], [23.6, 38.35]
      ]]
    },
    polygonCoordinates: [
      { lat: 38.35, lon: 23.6 }, { lat: 38.32, lon: 24.1 }, { lat: 37.95, lon: 24.0 },
      { lat: 37.98, lon: 23.65 }, { lat: 38.35, lon: 23.6 }
    ],
    biome: 'Mediterranean Coniferous / Scrub Forest',
    areaAffectedSqKm: 420.6,
    cloudCover: 0.9,
    primaryDrivers: ['Extreme heatwave triggering', 'Gale-force dry winds (Meltemi)', 'Dense pine fuel accumulation'],
    agentTrace: {
      task: 'Wildfire Burn Severity Assessment',
      agent: 'Wildfire & Thermal Analytics Agent',
      models: ['BurnSeverity-UNet', 'NBR-SpectralProfiler'],
      tools: ['Sentinel-2 SWIR/NIR Ingestion', 'dNBR Classification Scale (USGS)', 'Ash Mask Generator'],
      confidence: 0.96
    }
  },

  // 10. New South Wales - Australia (Wildfire)
  {
    id: 'OBS_AUS_010',
    title: 'Blue Mountains Eucalyptus Bushfire Impact',
    region: 'New South Wales High Country',
    country: 'Australia',
    latitude: -33.7150,
    longitude: 150.3120,
    category: 'WILDFIRE',
    severity: 'HIGH',
    baselineDate: '2025-01-05',
    targetDate: '2025-03-20',
    metricName: 'dNBR (Differenced Normalized Burn Ratio)',
    baselineValue: 0.61,
    targetValue: 0.22,
    percentageChange: -63.9,
    confidence: 0.94,
    sensor: 'Landsat-8',
    modality: 'OPTICAL',
    platform: 'Landsat-8 OLI/TIRS',
    description: 'High-intensity wildfire burn scar across mountainous sclerophyll eucalyptus forests.',
    inference: 'Complete loss of mid-story and canopy foliage over rugged canyon topography.',
    evidence: [
      'NBR dropped from 0.61 to 0.22 over 1,480 km²',
      'Topographic shadow correction confirmed severe combustion across steep southern slopes'
    ],
    dataStatus: 'PUBLIC_DATA',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [149.8, -32.9], [151.2, -33.1], [151.0, -34.4], [149.6, -34.2], [149.8, -32.9]
      ]]
    },
    polygonCoordinates: [
      { lat: -32.9, lon: 149.8 }, { lat: -33.1, lon: 151.2 }, { lat: -34.4, lon: 151.0 },
      { lat: -34.2, lon: 149.6 }, { lat: -32.9, lon: 149.8 }
    ],
    biome: 'Temperate Eucalyptus Woodland',
    areaAffectedSqKm: 1480.0,
    cloudCover: 0.5,
    primaryDrivers: ['Multi-year drought drying', 'High vapor pressure deficit', 'Lightning ignition'],
    agentTrace: {
      task: 'Bushfire Scar Grounding',
      agent: 'Wildfire & Thermal Analytics Agent',
      models: ['GeoVLM-Remote-Large', 'TopographicBurn-Net'],
      tools: ['DEM Hillshade Correction', 'Landsat-8 Surface Reflectance', 'Burn Ratio Difference'],
      confidence: 0.94
    }
  },

  // 11. California Sierra Nevada - USA (Wildfire)
  {
    id: 'OBS_USA_011',
    title: 'Sierra Nevada Mixed-Conifer Burn Perimeter',
    region: 'Butte / Plumas National Forest, California',
    country: 'United States',
    latitude: 39.9500,
    longitude: -121.3500,
    category: 'WILDFIRE',
    severity: 'CRITICAL',
    baselineDate: '2025-07-01',
    targetDate: '2025-09-30',
    metricName: 'dNBR (Differenced Burn Ratio)',
    baselineValue: 0.64,
    targetValue: 0.21,
    percentageChange: -67.2,
    confidence: 0.97,
    sensor: 'Sentinel-2',
    modality: 'OPTICAL',
    platform: 'Sentinel-2 L2A MSI',
    description: 'High-severity wildfire propagation across drought-stressed mixed conifer timberlands.',
    inference: 'SWIR reflectance elevated by 310% over 890 km² indicating total loss of canopy moisture and ground carbonization.',
    evidence: [
      'dNBR metric indicates 74% high-severity burn proportion',
      'Post-fire vegetation index drop corresponds to over 4.5 million metric tons estimated biomass carbon release'
    ],
    dataStatus: 'PUBLIC_DATA',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [-121.8, 40.3], [-120.8, 40.2], [-120.9, 39.5], [-121.9, 39.6], [-121.8, 40.3]
      ]]
    },
    polygonCoordinates: [
      { lat: 40.3, lon: -121.8 }, { lat: 40.2, lon: -120.8 }, { lat: 39.5, lon: -120.9 },
      { lat: 39.6, lon: -121.9 }, { lat: 40.3, lon: -121.8 }
    ],
    biome: 'Montane Mixed Conifer Forest',
    areaAffectedSqKm: 890.0,
    cloudCover: 0.8,
    primaryDrivers: ['Bark beetle mortalities fuel load', 'Extended seasonal drought', 'Steep terrain wind chimney effect'],
    agentTrace: {
      task: 'Wildfire Severity & Biomass Loss Estimation',
      agent: 'Wildfire & Thermal Analytics Agent',
      models: ['BiomassLoss-Estimator-v1', 'dNBR-UNet'],
      tools: ['Sentinel-2 Spectral Engine', 'USGS MTBS Benchmark Baseline', 'Topographic Normalization'],
      confidence: 0.97
    }
  },

  // 12. Nile Delta - Egypt (Agriculture & Urban)
  {
    id: 'OBS_EGY_012',
    title: 'Nile Delta Salinization & Peri-Urban Loss',
    region: 'Kafr El Sheikh / Damietta Belt, Nile Delta',
    country: 'Egypt',
    latitude: 31.1000,
    longitude: 30.9500,
    category: 'AGRICULTURE',
    severity: 'HIGH',
    baselineDate: '2025-01-15',
    targetDate: '2026-05-10',
    metricName: 'NDVI / Salinity Index Delta',
    baselineValue: 0.54,
    targetValue: 0.36,
    percentageChange: -33.3,
    confidence: 0.89,
    sensor: 'Sentinel-2',
    modality: 'OPTICAL',
    platform: 'Sentinel-2 MSI',
    description: 'Loss of fertile agricultural plots due to seawater intrusion and unplanned brick infrastructure expansion.',
    inference: 'Combined spectral indicators reveal soil salinization along northern lakes and building encroachment on arable soils.',
    evidence: [
      'Photosynthetic productivity dropped 33.3% across 620 km²',
      'Soil salinity index (NDSI) increased by +41% in northern irrigation sectors'
    ],
    dataStatus: 'DEMO_DATA',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [30.2, 31.6], [31.8, 31.5], [31.7, 30.6], [30.1, 30.7], [30.2, 31.6]
      ]]
    },
    polygonCoordinates: [
      { lat: 31.6, lon: 30.2 }, { lat: 31.5, lon: 31.8 }, { lat: 30.6, lon: 31.7 },
      { lat: 30.7, lon: 30.1 }, { lat: 31.6, lon: 30.2 }
    ],
    biome: 'Alluvial Delta Cropland',
    areaAffectedSqKm: 620.0,
    cloudCover: 1.1,
    primaryDrivers: ['Sea-level rise saltwater seepage', 'Dam water regulation', 'Peri-urban construction encroachment'],
    agentTrace: {
      task: 'Soil Salinity & Cropland Stress Grounding',
      agent: 'Agriculture & Soil Agent',
      models: ['SalineSoil-Net', 'CropVigour-SegNet'],
      tools: ['Multi-Index Fusion (NDVI + NDSI)', 'Canal Water Vector Layer', 'Landsat Thermal Profiling'],
      confidence: 0.89
    }
  },

  // 13. Dubai - UAE (Urban Expansion)
  {
    id: 'OBS_DXB_013',
    title: 'Dubai Desert Frontier & Coastal Island Urbanization',
    region: 'Dubai South & Jebel Ali Corridor',
    country: 'United Arab Emirates',
    latitude: 24.9500,
    longitude: 55.1500,
    category: 'URBAN_EXPANSION',
    severity: 'HIGH',
    baselineDate: '2024-11-01',
    targetDate: '2026-06-01',
    metricName: 'NDBI (Built-Up Index)',
    baselineValue: 0.15,
    targetValue: 0.38,
    percentageChange: +153.3,
    confidence: 0.95,
    sensor: 'Landsat-9',
    modality: 'OPTICAL',
    platform: 'Landsat-9 OLI-2',
    description: 'Extensive grading of desert sand dunes into logistics zones, residential megaprojects, and transport networks.',
    inference: 'Spectral separation between hyper-arid quartz sand and structural concrete/asphalt highlights 310 km² of newly built footprint.',
    evidence: [
      'Built-up index increased 153.3% in southern development quadrant',
      'High-resolution SAR backscatter increase confirms massive vertical construction'
    ],
    dataStatus: 'PUBLIC_DATA',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [54.8, 25.2], [55.5, 25.1], [55.4, 24.6], [54.7, 24.7], [54.8, 25.2]
      ]]
    },
    polygonCoordinates: [
      { lat: 25.2, lon: 54.8 }, { lat: 25.1, lon: 55.5 }, { lat: 24.6, lon: 55.4 },
      { lat: 24.7, lon: 54.7 }, { lat: 25.2, lon: 54.8 }
    ],
    biome: 'Hyper-Arid Coastal Desert',
    areaAffectedSqKm: 310.0,
    cloudCover: 0.2,
    primaryDrivers: ['Expo city logistics development', 'Airport expansion', 'Artificial lagoon excavation'],
    agentTrace: {
      task: 'Desert Urban Footprint Detection',
      agent: 'Built Environment Agent',
      models: ['AridUrban-Classifier', 'EdgeSegmentation-Net'],
      tools: ['Landsat-9 OLI Processing', 'NDBI/SAVI Combined Mask', 'SAR Coherence Verification'],
      confidence: 0.95
    }
  },

  // 14. Netherlands Coastal - Netherlands (Coastal & Infrastructure)
  {
    id: 'OBS_NLD_014',
    title: 'IJsselmeer & Zeeland Coastal Sea Defense Reinforcement',
    region: 'Zeeland & Afsluitdijk Coastal Corridors',
    country: 'Netherlands',
    latitude: 52.8000,
    longitude: 5.3000,
    category: 'COASTAL_CHANGE',
    severity: 'LOW',
    baselineDate: '2024-09-01',
    targetDate: '2026-04-15',
    metricName: 'SAR InSAR Subsidence & Dyke Height Profile',
    baselineValue: 0.02,
    targetValue: 0.04,
    percentageChange: +100.0,
    confidence: 0.96,
    sensor: 'Sentinel-1',
    modality: 'SAR',
    platform: 'Sentinel-1 C-SAR InSAR Time-Series',
    description: 'Sub-centimeter radar interferometry monitoring of primary coastal dyke reinforcement and tidal flats.',
    inference: 'Stable barrier elevation confirmed with localized sand nourishment deposition detected along Wadden Sea coastline.',
    evidence: [
      'Over 98.4% of dyke vectors demonstrate stable structure with <1.5mm/year displacement',
      'Sand replenishment visible in multi-temporal SAR backscatter texture'
    ],
    dataStatus: 'PUBLIC_DATA',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [4.6, 53.3], [5.9, 53.2], [5.8, 51.5], [4.5, 51.6], [4.6, 53.3]
      ]]
    },
    polygonCoordinates: [
      { lat: 53.3, lon: 4.6 }, { lat: 53.2, lon: 5.9 }, { lat: 51.5, lon: 5.8 },
      { lat: 51.6, lon: 4.5 }, { lat: 53.3, lon: 4.6 }
    ],
    biome: 'Temperate Coastal Polder & Estuary',
    areaAffectedSqKm: 850.0,
    cloudCover: 48.0,
    primaryDrivers: ['Climate adaptation barrier elevation', 'Sand motor coastal nourishment', 'Polder water management'],
    agentTrace: {
      task: 'Precision Coastal Infrastructure Monitoring',
      agent: 'SAR / Multi-Modal Fusion Agent',
      models: ['PS-InSAR-DisplacementEngine', 'CoastalDyke-Tracker'],
      tools: ['Sentinel-1 Persistent Scatterer Processing', 'Tidal Gauge Synchronization'],
      confidence: 0.96
    }
  },

  // 15. Beauce - France (Agriculture Drought Stress)
  {
    id: 'OBS_FRA_015',
    title: 'Beauce Agricultural Grain Belt Moisture Stress',
    region: 'Centre-Val de Loire Plain, France',
    country: 'France',
    latitude: 48.2000,
    longitude: 1.7000,
    category: 'AGRICULTURE',
    severity: 'MODERATE',
    baselineDate: '2025-04-01',
    targetDate: '2026-06-25',
    metricName: 'NDMI (Normalized Difference Moisture Index)',
    baselineValue: 0.42,
    targetValue: 0.28,
    percentageChange: -33.3,
    confidence: 0.90,
    sensor: 'Sentinel-2',
    modality: 'OPTICAL',
    platform: 'Sentinel-2 MSI',
    description: 'Sustained canopy water deficit across intensive cereal farming parcels during early summer heat spells.',
    inference: 'SWIR band water-absorption deficit indicates premature yellowing and reduced biomass yield potential.',
    evidence: [
      'NDMI moisture index dropped 33.3% across 1,650 km²',
      'Surface temperature anomalies recorded +2.8°C above 10-year climatological average'
    ],
    dataStatus: 'DEMO_DATA',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [1.0, 48.7], [2.4, 48.6], [2.3, 47.8], [0.9, 47.9], [1.0, 48.7]
      ]]
    },
    polygonCoordinates: [
      { lat: 48.7, lon: 1.0 }, { lat: 48.6, lon: 2.4 }, { lat: 47.8, lon: 2.3 },
      { lat: 47.9, lon: 0.9 }, { lat: 48.7, lon: 1.0 }
    ],
    biome: 'Temperate Agricultural Plain',
    areaAffectedSqKm: 1650.0,
    cloudCover: 4.2,
    primaryDrivers: ['Precipitation deficit', 'Aquifer extraction limits', 'Early summer heat dome'],
    agentTrace: {
      task: 'Canopy Water Deficit Profiling',
      agent: 'Agriculture & Soil Agent',
      models: ['NDMI-MoistureNet', 'YieldLoss-Predictor'],
      tools: ['Sentinel-2 L2A Ingestion', 'Crop Calendar Overlay', 'Thermal Difference Module'],
      confidence: 0.90
    }
  },

  // 16. Dnipro Basin - Ukraine (Agriculture)
  {
    id: 'OBS_UKR_016',
    title: 'Dnipro Basin Cropland Fallow & Canal Disruption',
    region: 'Kherson / Zaporizhzhia Steppe, Ukraine',
    country: 'Ukraine',
    latitude: 46.8500,
    longitude: 34.5000,
    category: 'AGRICULTURE',
    severity: 'HIGH',
    baselineDate: '2024-05-15',
    targetDate: '2026-06-10',
    metricName: 'NDVI (Cultivated Acreage Vitality)',
    baselineValue: 0.65,
    targetValue: 0.39,
    percentageChange: -40.0,
    confidence: 0.93,
    sensor: 'Sentinel-2',
    modality: 'OPTICAL',
    platform: 'Sentinel-2 MSI + PlanetScope',
    description: 'Widespread reversion of irrigated agricultural parcels to unmanaged fallow vegetation.',
    inference: 'Drainage and shutdown of major irrigation trunk canals led to severe decline in high-intensity grain and oilseed cultivation.',
    evidence: [
      'Over 2,100 km² of previously irrigated fields show lack of crop emergence signatures',
      'NDWI confirms complete dewatering of secondary distribution canals'
    ],
    dataStatus: 'DEMO_DATA',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [33.2, 47.6], [35.8, 47.4], [35.7, 46.2], [33.1, 46.4], [33.2, 47.6]
      ]]
    },
    polygonCoordinates: [
      { lat: 47.6, lon: 33.2 }, { lat: 47.4, lon: 35.8 }, { lat: 46.2, lon: 35.7 },
      { lat: 46.4, lon: 33.1 }, { lat: 47.6, lon: 33.2 }
    ],
    biome: 'Pontic Steppe / Irrigated Arable',
    areaAffectedSqKm: 2100.0,
    cloudCover: 1.8,
    primaryDrivers: ['Canal irrigation cutoff', 'Unmanaged field weed succession', 'Conflict-zone abandonment'],
    agentTrace: {
      task: 'Cropland Fallow & Irrigation Cessation Analysis',
      agent: 'Land Cover Classification Agent',
      models: ['GeoVLM-Remote-Large', 'CropPhenology-Tracker'],
      tools: ['Canal Water Spectral Tracing', 'Multi-Year NDVI Time Series', 'Field Parcel Boundary Engine'],
      confidence: 0.93
    }
  },

  // 17. Gran Chaco - Argentina (Deforestation)
  {
    id: 'OBS_ARG_017',
    title: 'Gran Chaco Dry Forest Geometric Clearing',
    region: 'Santiago del Estero / Chaco Province',
    country: 'Argentina',
    latitude: -26.7853,
    longitude: -62.6845,
    category: 'DEFORESTATION',
    severity: 'HIGH',
    baselineDate: '2025-02-18',
    targetDate: '2026-06-30',
    metricName: 'NDVI (Native Dry Forest Density)',
    baselineValue: 0.58,
    targetValue: 0.45,
    percentageChange: -23.1,
    confidence: 0.93,
    sensor: 'Landsat-8',
    modality: 'OPTICAL',
    platform: 'Landsat-8/9 OLI',
    description: 'Industrial-scale bulldozing of native quebracho woodlands for cattle pasture and soy parcels.',
    inference: 'Regular geometric grid boundaries with windbreak corridors typical of corporate agribusiness transformation.',
    evidence: [
      'NDVI dropped 23.1% over 2,150 km²',
      'Thermal inertia reduction confirms moisture loss from clear-cut soil surfaces'
    ],
    dataStatus: 'PUBLIC_DATA',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [-64.5, -25.0], [-60.8, -24.8], [-60.5, -28.8], [-64.2, -29.0], [-64.5, -25.0]
      ]]
    },
    polygonCoordinates: [
      { lat: -25.0, lon: -64.5 }, { lat: -24.8, lon: -60.8 }, { lat: -28.8, lon: -60.5 },
      { lat: -29.0, lon: -64.2 }, { lat: -25.0, lon: -64.5 }
    ],
    biome: 'Gran Chaco Dry Woodland',
    areaAffectedSqKm: 2150.0,
    cloudCover: 0.6,
    primaryDrivers: ['Soy agribusiness expansion', 'Cattle pasture establishment', 'Woodland fragmentation'],
    agentTrace: {
      task: 'Dry Forest Deforestation Mapping',
      agent: 'Optical Change & Grounding Specialist',
      models: ['ForestLoss-Classifier-v2', 'EdgeDetection-Net'],
      tools: ['Landsat-8 Surface Reflectance', 'Geometric Grid Segmenter', 'NDVI Delta Calculator'],
      confidence: 0.93
    }
  },

  // 18. Cerrado MATOPIBA - Brazil (Vegetation Change)
  {
    id: 'OBS_CER_018',
    title: 'MATOPIBA Savanna Plateaus Vegetation Clearance',
    region: 'Western Bahia / Maranhão Belt, Cerrado',
    country: 'Brazil',
    latitude: -12.1500,
    longitude: -45.5000,
    category: 'VEGETATION_CHANGE',
    severity: 'HIGH',
    baselineDate: '2025-01-22',
    targetDate: '2026-05-30',
    metricName: 'NDVI (Savanna Biomass)',
    baselineValue: 0.60,
    targetValue: 0.47,
    percentageChange: -21.6,
    confidence: 0.92,
    sensor: 'Sentinel-2',
    modality: 'OPTICAL',
    platform: 'Sentinel-2 MSI',
    description: 'Rapid transformation of wooded savanna (cerradão) on high plateau formations into grain cropland.',
    inference: 'Intensive center-pivot irrigation development detected with severe native biodiversity corridor narrowing.',
    evidence: [
      'Savanna biomass index down 21.6% across 1,720 km²',
      'Shortwave infrared bands highlight newly plowed red oxisol soil'
    ],
    dataStatus: 'PUBLIC_DATA',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [-47.0, -10.5], [-43.8, -10.2], [-44.0, -14.0], [-47.2, -14.2], [-47.0, -10.5]
      ]]
    },
    polygonCoordinates: [
      { lat: -10.5, lon: -47.0 }, { lat: -10.2, lon: -43.8 }, { lat: -14.0, lon: -44.0 },
      { lat: -14.2, lon: -47.2 }, { lat: -10.5, lon: -47.0 }
    ],
    biome: 'Cerrado Wooded Savanna',
    areaAffectedSqKm: 1720.0,
    cloudCover: 1.2,
    primaryDrivers: ['Center-pivot grain farming', 'Native scrub clearing', 'Pasture intensification'],
    agentTrace: {
      task: 'Savanna Land Cover Transition',
      agent: 'Land Cover Classification Agent',
      models: ['SavannaSeg-Net', 'ChangeDetection-Transformer'],
      tools: ['Sentinel-2 Time Series', 'Plateau Topographic Mask', 'NDVI Differencing'],
      confidence: 0.92
    }
  },

  // 19. Kalimantan Peatlands - Indonesia (Deforestation)
  {
    id: 'OBS_IDN_019',
    title: 'Central Kalimantan Peat Dome Drainage & Clearing',
    region: 'Kahayan / Kapuas Basin, Central Kalimantan',
    country: 'Indonesia',
    latitude: -1.2692,
    longitude: 113.8168,
    category: 'DEFORESTATION',
    severity: 'CRITICAL',
    baselineDate: '2025-01-18',
    targetDate: '2026-06-25',
    metricName: 'NDVI (Peat Swamp Forest Density)',
    baselineValue: 0.76,
    targetValue: 0.56,
    percentageChange: -26.3,
    confidence: 0.93,
    sensor: 'Sentinel-2',
    modality: 'MULTIMODAL',
    platform: 'Sentinel-2 MSI + Sentinel-1 SAR',
    description: 'Industrial drainage canal excavation and clear-cutting across carbon-rich tropical peat swamp domes.',
    inference: 'Linear canal networks detected in SAR coherence and optical imagery accompanied by severe canopy loss.',
    evidence: [
      'NDVI dropped 26.3% over 2,150 km²',
      'Linear drainage canal features detected at 200m regular intervals feeding plantation concessions'
    ],
    dataStatus: 'PUBLIC_DATA',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [111.8, 0.5], [115.5, 0.8], [115.8, -2.8], [112.2, -3.2], [111.8, 0.5]
      ]]
    },
    polygonCoordinates: [
      { lat: 0.5, lon: 111.8 }, { lat: 0.8, lon: 115.5 }, { lat: -2.8, lon: 115.8 },
      { lat: -3.2, lon: 112.2 }, { lat: 0.5, lon: 111.8 }
    ],
    biome: 'Tropical Peat Swamp Rainforest',
    areaAffectedSqKm: 2150.0,
    cloudCover: 3.5,
    primaryDrivers: ['Palm oil concession development', 'Peat canal drainage', 'Subsidence fire hazard'],
    agentTrace: {
      task: 'Peatland Drainage & Forest Loss Detection',
      agent: 'Multi-Sensor Fusion Specialist',
      models: ['PeatForest-LossNet', 'CanalLinear-Detector'],
      tools: ['SAR Multi-Look Processing', 'Optical Moisture Index', 'Canopy Density Filter'],
      confidence: 0.93
    }
  },

  // 20. Sumatra Riau - Indonesia (Deforestation)
  {
    id: 'OBS_IDN_020',
    title: 'Riau Province Pulp & Oil Palm Concession Encroachment',
    region: 'Kampar Peninsula, Riau, Sumatra',
    country: 'Indonesia',
    latitude: 0.5000,
    longitude: 102.5000,
    category: 'DEFORESTATION',
    severity: 'HIGH',
    baselineDate: '2025-02-15',
    targetDate: '2026-06-20',
    metricName: 'NDVI (Canopy Integrity)',
    baselineValue: 0.74,
    targetValue: 0.52,
    percentageChange: -29.7,
    confidence: 0.91,
    sensor: 'Sentinel-2',
    modality: 'OPTICAL',
    platform: 'Sentinel-2 MSI',
    description: 'Perforation and buffer encroachment in designated peat forest conservation zones.',
    inference: 'Rapid replacement of biodiverse peat swamp timber stands with uniform monoculture acacia and oil palm grids.',
    evidence: [
      'Canopy loss of 29.7% over 1,420 km²',
      'Regular spectral signature shift to uniform row-crop reflectance'
    ],
    dataStatus: 'DEMO_DATA',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [101.5, 1.5], [103.5, 1.4], [103.4, -0.4], [101.4, -0.3], [101.5, 1.5]
      ]]
    },
    polygonCoordinates: [
      { lat: 1.5, lon: 101.5 }, { lat: 1.4, lon: 103.5 }, { lat: -0.4, lon: 103.4 },
      { lat: -0.3, lon: 101.4 }, { lat: 1.5, lon: 101.5 }
    ],
    biome: 'Lowland Peat Forest',
    areaAffectedSqKm: 1420.0,
    cloudCover: 4.8,
    primaryDrivers: ['Pulpwood plantation expansion', 'Canal drainage', 'Selective timber logging'],
    agentTrace: {
      task: 'Concession Encroachment Grounding',
      agent: 'Optical Change & Grounding Specialist',
      models: ['GeoVLM-Remote-Large', 'ConcessionBoundary-Aligner'],
      tools: ['Sentinel-2 Cloud Masking', 'NDVI Difference Engine'],
      confidence: 0.91
    }
  },

  // 21. Congo Basin - DRC (Deforestation)
  {
    id: 'OBS_COG_021',
    title: 'Congo Basin Artisanal Logging & Shifting Cultivation',
    region: 'Équateur / Tshuapa Province, DR Congo',
    country: 'Democratic Republic of the Congo',
    latitude: 0.2280,
    longitude: 21.5472,
    category: 'DEFORESTATION',
    severity: 'HIGH',
    baselineDate: '2025-02-12',
    targetDate: '2026-06-10',
    metricName: 'NDVI (Canopy Continuity)',
    baselineValue: 0.77,
    targetValue: 0.58,
    percentageChange: -24.8,
    confidence: 0.89,
    sensor: 'Sentinel-2',
    modality: 'OPTICAL',
    platform: 'Sentinel-2 MSI',
    description: 'Perforations along river transportation axes caused by artisanal logging and slash-and-burn farming.',
    inference: 'Smallholder agricultural expansion along navigable waterways leading to dendritic forest fragmentation.',
    evidence: [
      'NDVI dropped 24.8% over 1,950 km²',
      'High forest fragmentation index along Congo River tributaries'
    ],
    dataStatus: 'DEMO_DATA',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [19.5, 2.2], [24.2, 2.5], [23.8, -1.8], [19.8, -1.5], [19.5, 2.2]
      ]]
    },
    polygonCoordinates: [
      { lat: 2.2, lon: 19.5 }, { lat: 2.5, lon: 24.2 }, { lat: -1.8, lon: 23.8 },
      { lat: -1.5, lon: 19.8 }, { lat: 2.2, lon: 19.5 }
    ],
    biome: 'Equatorial Moist Rainforest',
    areaAffectedSqKm: 1950.0,
    cloudCover: 4.2,
    primaryDrivers: ['Artisanal logging', 'Charcoal production', 'Slash-and-burn farming'],
    agentTrace: {
      task: 'Dendritic Forest Fragmentation Tracking',
      agent: 'Optical Change & Grounding Specialist',
      models: ['TropicalForest-LossNet', 'RoadFragment-Analyzer'],
      tools: ['Sentinel-2 Cloud Penetration Composite', 'Forest Continuity Metrics'],
      confidence: 0.89
    }
  },

  // 22. Lake Chad - Chad / Cameroon / Nigeria (Water Change)
  {
    id: 'OBS_CHD_022',
    title: 'Lake Chad Basin Southern Pool Hydrological Pulsing',
    region: 'Lake Chad Southern Arch',
    country: 'Chad',
    latitude: 13.0000,
    longitude: 14.5000,
    category: 'WATER_CHANGE',
    severity: 'HIGH',
    baselineDate: '2025-03-01',
    targetDate: '2026-06-15',
    metricName: 'NDWI (Open Surface Water)',
    baselineValue: 0.35,
    targetValue: 0.52,
    percentageChange: +48.6,
    confidence: 0.91,
    sensor: 'Sentinel-2',
    modality: 'OPTICAL',
    platform: 'Sentinel-2 MSI',
    description: 'Heavy seasonal monsoon runoff causing extensive open water expansion in the southern pool.',
    inference: 'Chari-Logone river discharge pulse submerged seasonal marshes, expanding open water surface by 1,890 km².',
    evidence: [
      'NDWI water index increased by +48.6%',
      'Vegetative marsh islands inundated by 1.2m average water level rise'
    ],
    dataStatus: 'PUBLIC_DATA',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [13.5, 14.2], [15.5, 14.3], [15.4, 12.0], [13.6, 11.9], [13.5, 14.2]
      ]]
    },
    polygonCoordinates: [
      { lat: 14.2, lon: 13.5 }, { lat: 14.3, lon: 15.5 }, { lat: 12.0, lon: 15.4 },
      { lat: 11.9, lon: 13.6 }, { lat: 14.2, lon: 13.5 }
    ],
    biome: 'Sahelian Wetland Depression',
    areaAffectedSqKm: 1890.0,
    cloudCover: 1.5,
    primaryDrivers: ['Intense Sahelian monsoon rainfall', 'Chari river flood pulse', 'Wetland vegetation submersion'],
    agentTrace: {
      task: 'Inland Waterbody Hydrological Dynamics',
      agent: 'Hydrological & Water Change Agent',
      models: ['WaterBody-Segmenter-v2', 'Otsu-NDWI-Net'],
      tools: ['Sentinel-2 Water Index Module', 'Elevation Basin Contour'],
      confidence: 0.91
    }
  },

  // 23. South Aral Sea - Uzbekistan / Kazakhstan (Water Change)
  {
    id: 'OBS_ARL_023',
    title: 'South Aral Sea Basin Desiccation & Salt-Bed Expansion',
    region: 'Karakalpakstan Desert Basin',
    country: 'Uzbekistan',
    latitude: 44.9833,
    longitude: 59.8167,
    category: 'WATER_CHANGE',
    severity: 'CRITICAL',
    baselineDate: '2024-08-15',
    targetDate: '2026-07-10',
    metricName: 'NDWI (Water Surface Index)',
    baselineValue: 0.48,
    targetValue: 0.20,
    percentageChange: -58.3,
    confidence: 0.97,
    sensor: 'Landsat-8',
    modality: 'OPTICAL',
    platform: 'Landsat-8/9 OLI / TIRS',
    description: 'Catastrophic shrinkage of the eastern Aral Sea basin with massive toxic salt flat exposure.',
    inference: 'NDWI calculations verify retreat of shallow water surface, exposing over 3,120 km² of hypersaline bed.',
    evidence: [
      'NDWI water index collapsed by 58.3%',
      'Exposed salt dust plumes detected traversing over 250km in thermal infrared channels'
    ],
    dataStatus: 'PUBLIC_DATA',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [58.0, 46.5], [61.8, 46.2], [61.9, 43.5], [58.2, 43.6], [58.0, 46.5]
      ]]
    },
    polygonCoordinates: [
      { lat: 46.5, lon: 58.0 }, { lat: 46.2, lon: 61.8 }, { lat: 43.5, lon: 61.9 },
      { lat: 43.6, lon: 58.2 }, { lat: 46.5, lon: 58.0 }
    ],
    biome: 'Inland Hypersaline Terminal Lake',
    areaAffectedSqKm: 3120.0,
    cloudCover: 0.4,
    primaryDrivers: ['Amu Darya irrigation diversions', 'Extreme evaporation deficit', 'Aquifer disconnection'],
    agentTrace: {
      task: 'Terminal Lake Desiccation Tracking',
      agent: 'Hydrological & Water Change Agent',
      models: ['InlandLake-ShrinkageNet', 'SalinePlume-Tracker'],
      tools: ['Landsat-8/9 Surface Water Ingestion', 'Salt-Bed Spectral Index'],
      confidence: 0.97
    }
  },

  // 24. Sahel - Burkina Faso / Niger (Vegetation Change)
  {
    id: 'OBS_SHL_024',
    title: 'Sahelian Pastoral Zone Biomass Dieback',
    region: 'Sahel Semi-Arid Belt, Burkina Faso / Niger',
    country: 'Burkina Faso',
    latitude: 14.2000,
    longitude: -0.5000,
    category: 'VEGETATION_CHANGE',
    severity: 'MODERATE',
    baselineDate: '2025-03-01',
    targetDate: '2026-06-20',
    metricName: 'NDVI (Shrub & Grass Cover)',
    baselineValue: 0.37,
    targetValue: 0.30,
    percentageChange: -18.9,
    confidence: 0.88,
    sensor: 'Sentinel-2',
    modality: 'OPTICAL',
    platform: 'Sentinel-2 MSI',
    description: 'Delayed monsoon onset triggering early dry-season biomass dieback along pastoral corridors.',
    inference: 'Soil exposure increased across dry savannas with accelerated surface crusting.',
    evidence: [
      'Biomass greenness declined 18.9% over 1,650 km²',
      'Grazing pressure hotspots concentrated around surviving boreholes'
    ],
    dataStatus: 'DEMO_DATA',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [-2.2, 15.5], [1.5, 15.4], [1.4, 13.0], [-2.0, 12.8], [-2.2, 15.5]
      ]]
    },
    polygonCoordinates: [
      { lat: 15.5, lon: -2.2 }, { lat: 15.4, lon: 1.5 }, { lat: 13.0, lon: 1.4 },
      { lat: 12.8, lon: -2.0 }, { lat: 15.5, lon: -2.2 }
    ],
    biome: 'Semi-Arid Acacia Savanna',
    areaAffectedSqKm: 1650.0,
    cloudCover: 1.1,
    primaryDrivers: ['Monsoon onset delay', 'Pastoral overgrazing', 'Soil crusting'],
    agentTrace: {
      task: 'Dryland Vegetation Degradation Assessment',
      agent: 'Land Cover Classification Agent',
      models: ['DrylandBiomass-Net', 'PastoralStress-Model'],
      tools: ['Sentinel-2 Time-Series Profiling', 'Soil Background Correction (SAVI)'],
      confidence: 0.88
    }
  },

  // 25. Madagascar Atsinanana - Madagascar (Vegetation Change)
  {
    id: 'OBS_MAD_025',
    title: 'Atsinanana Rainforest Corridor Shifting Cultivation',
    region: 'Eastern Escarpment, Madagascar',
    country: 'Madagascar',
    latitude: -18.7669,
    longitude: 48.4500,
    category: 'VEGETATION_CHANGE',
    severity: 'MODERATE',
    baselineDate: '2025-01-10',
    targetDate: '2026-05-28',
    metricName: 'NDVI (Canopy Continuity)',
    baselineValue: 0.74,
    targetValue: 0.59,
    percentageChange: -19.8,
    confidence: 0.90,
    sensor: 'Sentinel-2',
    modality: 'OPTICAL',
    platform: 'Sentinel-2 MSI',
    description: 'Slash-and-burn tavy agriculture perforating biodiversity-rich rainforest corridors.',
    inference: 'Smallholder clearing clusters along ridge slopes leading to soil erosion and loss of primary canopy.',
    evidence: [
      'Canopy vitality dropped 19.8% across 980 km²',
      'Active burn scars detected at slope crests'
    ],
    dataStatus: 'PUBLIC_DATA',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [47.8, -17.2], [49.2, -17.0], [48.8, -20.2], [47.5, -20.0], [47.8, -17.2]
      ]]
    },
    polygonCoordinates: [
      { lat: -17.2, lon: 47.8 }, { lat: -17.0, lon: 49.2 }, { lat: -20.2, lon: 48.8 },
      { lat: -20.0, lon: 47.5 }, { lat: -17.2, lon: 47.8 }
    ],
    biome: 'Tropical Montane Rainforest',
    areaAffectedSqKm: 980.2,
    cloudCover: 3.8,
    primaryDrivers: ['Tavy slash-and-burn farming', 'Charcoal production', 'Selective logging'],
    agentTrace: {
      task: 'Montane Forest Disturbance Profiling',
      agent: 'Optical Change & Grounding Specialist',
      models: ['GeoVLM-Remote-Large', 'MontaneSlope-Corrector'],
      tools: ['Sentinel-2 Atmospheric Correction', 'NDVI Threshold Mask'],
      confidence: 0.90
    }
  },

  // 26. Yucatan - Mexico (Deforestation)
  {
    id: 'OBS_MEX_026',
    title: 'Yucatan Maya Forest Infrastructure & Ranch Clearance',
    region: 'Southern Campeche / Calakmul Buffer, Mexico',
    country: 'Mexico',
    latitude: 19.5000,
    longitude: -89.2000,
    category: 'DEFORESTATION',
    severity: 'MODERATE',
    baselineDate: '2025-02-15',
    targetDate: '2026-05-20',
    metricName: 'NDVI (Canopy Greenness)',
    baselineValue: 0.68,
    targetValue: 0.56,
    percentageChange: -17.6,
    confidence: 0.91,
    sensor: 'Sentinel-2',
    modality: 'OPTICAL',
    platform: 'Sentinel-2 MSI',
    description: 'Deforestation clusters detected in southern Campeche along new transportation corridors and seasonal agricultural conversions.',
    inference: 'Linear rights-of-way triggering secondary feeder road expansion and cattle ranch clearings.',
    evidence: [
      'NDVI dropped 17.6% over 1,350 km²',
      'Linear infrastructure footprint expanded by 180 km'
    ],
    dataStatus: 'DEMO_DATA',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [-90.5, 21.0], [-87.8, 20.8], [-88.0, 18.2], [-90.8, 18.4], [-90.5, 21.0]
      ]]
    },
    polygonCoordinates: [
      { lat: 21.0, lon: -90.5 }, { lat: 20.8, lon: -87.8 }, { lat: 18.2, lon: -88.0 },
      { lat: 18.4, lon: -90.8 }, { lat: 21.0, lon: -90.5 }
    ],
    biome: 'Maya Tropical Semi-Evergreen Forest',
    areaAffectedSqKm: 1350.0,
    cloudCover: 1.5,
    primaryDrivers: ['Transport corridor development', 'Cattle pasture conversion', 'Selective timber extraction'],
    agentTrace: {
      task: 'Corridor Deforestation Extraction',
      agent: 'Built Environment & Forest Agent',
      models: ['LinearCorridor-Segmenter', 'ForestCanopy-Net'],
      tools: ['Sentinel-2 MSI Ingestion', 'NDVI Delta Calculator'],
      confidence: 0.91
    }
  },

  // 27. Pearl River Delta - China (Urban Expansion)
  {
    id: 'OBS_CHN_027',
    title: 'Pearl River Delta Industrial & Logistics Expansion',
    region: 'Shenzhen / Dongguan / Guangzhou Corridor',
    country: 'China',
    latitude: 22.5431,
    longitude: 114.0579,
    category: 'URBAN_EXPANSION',
    severity: 'HIGH',
    baselineDate: '2024-11-10',
    targetDate: '2026-03-25',
    metricName: 'NDBI (Built-Up Index)',
    baselineValue: 0.22,
    targetValue: 0.29,
    percentageChange: +31.8,
    confidence: 0.92,
    sensor: 'Sentinel-2',
    modality: 'OPTICAL',
    platform: 'Sentinel-2 MSI',
    description: 'Conversion of peri-urban wetlands and agricultural plots into high-density industrial logistics hubs and rail depots.',
    inference: 'Reflectance signature shift from shallow water/vegetation to high-albedo roof and concrete structures.',
    evidence: [
      'NDBI built-up index increased by 31.8% across 740 km²',
      'High-speed rail corridor links fully completed and active in SAR imagery'
    ],
    dataStatus: 'PUBLIC_DATA',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [113.1, 23.2], [114.5, 23.1], [114.4, 22.1], [113.0, 22.2], [113.1, 23.2]
      ]]
    },
    polygonCoordinates: [
      { lat: 23.2, lon: 113.1 }, { lat: 23.1, lon: 114.5 }, { lat: 22.1, lon: 114.4 },
      { lat: 22.2, lon: 113.0 }, { lat: 23.2, lon: 113.1 }
    ],
    biome: 'Subtropical Estuary Mega-City',
    areaAffectedSqKm: 740.4,
    cloudCover: 4.5,
    primaryDrivers: ['Logistics hub development', 'High-speed rail corridor', 'Reclaimed peri-urban land'],
    agentTrace: {
      task: 'Mega-City Urban Expansion Mapping',
      agent: 'Built Environment Agent',
      models: ['UrbanMask-Transformer', 'ImperviousSurface-Net'],
      tools: ['Sentinel-2 MSI Ingestion', 'NDBI Differencing'],
      confidence: 0.92
    }
  },

  // 28. Tokyo Bay - Japan (Infrastructure)
  {
    id: 'OBS_JPN_028',
    title: 'Tokyo Bay Reclaimed Island Logistics Infrastructure',
    region: 'Tokyo Bay Maritime Zone',
    country: 'Japan',
    latitude: 35.6000,
    longitude: 139.8000,
    category: 'INFRASTRUCTURE',
    severity: 'LOW',
    baselineDate: '2024-10-01',
    targetDate: '2026-05-15',
    metricName: 'SAR Structural Coherence',
    baselineValue: 0.82,
    targetValue: 0.94,
    percentageChange: +14.6,
    confidence: 0.97,
    sensor: 'Sentinel-1',
    modality: 'SAR',
    platform: 'Sentinel-1 C-SAR',
    description: 'Stabilization and completion of automated container port terminals on artificial islands.',
    inference: 'High radar coherence indicates finished concrete pavement and dense gantry crane installations.',
    evidence: [
      'SAR backscatter intensity stabilized across 38 km² of reclaimed port parcels',
      'Zero millimeter anomalous land settlement detected via InSAR'
    ],
    dataStatus: 'DEMO_DATA',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [139.6, 35.7], [140.1, 35.6], [140.0, 35.3], [139.5, 35.4], [139.6, 35.7]
      ]]
    },
    polygonCoordinates: [
      { lat: 35.7, lon: 139.6 }, { lat: 35.6, lon: 140.1 }, { lat: 35.3, lon: 140.0 },
      { lat: 35.4, lon: 139.5 }, { lat: 35.7, lon: 139.6 }
    ],
    biome: 'Engineered Maritime Bay',
    areaAffectedSqKm: 38.0,
    cloudCover: 12.0,
    primaryDrivers: ['Automated container terminal expansion', 'Seismic reinforcement', 'Offshore logistics'],
    agentTrace: {
      task: 'Port Infrastructure InSAR Verification',
      agent: 'SAR / Multi-Modal Fusion Agent',
      models: ['InSAR-CoherenceNet', 'PortAsset-Tracker'],
      tools: ['Sentinel-1 SLC Time-Series Ingestion', 'Coherence Matrix Engine'],
      confidence: 0.97
    }
  },

  // 29. North Jakarta - Indonesia (Coastal & Subsidence)
  {
    id: 'OBS_IDN_029',
    title: 'North Jakarta Rapid Subsidence & Coastal Inundation Risk',
    region: 'North Jakarta Coastal Embankment',
    country: 'Indonesia',
    latitude: -6.1200,
    longitude: 106.8300,
    category: 'COASTAL_CHANGE',
    severity: 'CRITICAL',
    baselineDate: '2024-06-01',
    targetDate: '2026-06-01',
    metricName: 'InSAR Ground Subsidence Velocity',
    baselineValue: -4.2,
    targetValue: -11.8,
    percentageChange: +180.9,
    confidence: 0.98,
    sensor: 'Sentinel-1',
    modality: 'SAR',
    platform: 'Sentinel-1 InSAR Time-Series (VV Polarization)',
    description: 'Severe ground subsidence up to 12 cm/year leading to persistent seawater overtopping behind seawalls.',
    inference: 'Excessive deep groundwater extraction combined with heavy building load causing rapid alluvial compaction.',
    evidence: [
      'InSAR phase unwrapping measures -11.8 cm/year subsidence rate across Muara Baru sector',
      'Tidal flooding events observed breaching secondary canal retaining walls in optical composites'
    ],
    dataStatus: 'PUBLIC_DATA',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [106.7, -6.08], [107.0, -6.09], [106.95, -6.22], [106.68, -6.20], [106.7, -6.08]
      ]]
    },
    polygonCoordinates: [
      { lat: -6.08, lon: 106.7 }, { lat: -6.09, lon: 107.0 }, { lat: -6.22, lon: 106.95 },
      { lat: -6.20, lon: 106.68 }, { lat: -6.08, lon: 106.7 }
    ],
    biome: 'Lowland Delta Urban Coastal',
    areaAffectedSqKm: 145.0,
    cloudCover: 22.0,
    primaryDrivers: ['Deep aquifer groundwater extraction', 'Alluvial sediment compaction', 'High-density urban surcharge'],
    agentTrace: {
      task: 'Urban Ground Subsidence InSAR Measurement',
      agent: 'SAR Interferometry Specialist',
      models: ['InSAR-PhaseUnwrapper-v3', 'SubsidenceVelocity-Estimator'],
      tools: ['Sentinel-1 PS-InSAR Pipeline', 'Tidal Gauge Correlator'],
      confidence: 0.98
    }
  },

  // 30. Dead Sea - Jordan / Israel (Water Change)
  {
    id: 'OBS_JOR_030',
    title: 'Dead Sea Basin Shoreline Retreat & Sinkhole Dynamics',
    region: 'Dead Sea Rift Valley',
    country: 'Jordan',
    latitude: 31.5000,
    longitude: 35.5000,
    category: 'WATER_CHANGE',
    severity: 'CRITICAL',
    baselineDate: '2024-07-01',
    targetDate: '2026-07-01',
    metricName: 'NDWI (Water Surface Area)',
    baselineValue: 0.52,
    targetValue: 0.38,
    percentageChange: -26.9,
    confidence: 0.96,
    sensor: 'Sentinel-2',
    modality: 'MULTIMODAL',
    platform: 'Sentinel-2 MSI + Sentinel-1 SAR',
    description: 'Rapid drop in surface water level (over 1.1m/year) exposing massive new salt flats and sinkhole collapse zones.',
    inference: 'Upstream diversion of the Jordan River and industrial mineral evaporation ponds accelerate water volume deficit.',
    evidence: [
      'Water surface area dropped 26.9% across southern basin',
      'Over 400 new sinkhole collapse pits detected in high-resolution optical and SAR imagery'
    ],
    dataStatus: 'PUBLIC_DATA',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [35.3, 31.8], [35.6, 31.7], [35.5, 31.1], [35.2, 31.2], [35.3, 31.8]
      ]]
    },
    polygonCoordinates: [
      { lat: 31.8, lon: 35.3 }, { lat: 31.7, lon: 35.6 }, { lat: 31.1, lon: 35.5 },
      { lat: 31.2, lon: 35.2 }, { lat: 31.8, lon: 35.3 }
    ],
    biome: 'Hyper-Saline Rift Valley Terminal Lake',
    areaAffectedSqKm: 280.0,
    cloudCover: 0.2,
    primaryDrivers: ['Jordan River inflow diversion', 'Potash mineral evaporation extraction', 'Arid evaporation deficit'],
    agentTrace: {
      task: 'Terminal Lake Shrinkage & Sinkhole Mapping',
      agent: 'Hydrological & Water Change Agent',
      models: ['WaterBody-Segmenter-v2', 'SinkholeMorphology-Net'],
      tools: ['Sentinel-2 NDWI Engine', 'InSAR Coherence Loss Filter'],
      confidence: 0.96
    }
  },

  // 31. Lake Mead - USA (Water Change)
  {
    id: 'OBS_USA_031',
    title: 'Lake Mead Reservoir Water Level Elevation & Bathtub Ring',
    region: 'Nevada / Arizona Border, Colorado River Basin',
    country: 'United States',
    latitude: 36.1500,
    longitude: -114.4000,
    category: 'WATER_CHANGE',
    severity: 'HIGH',
    baselineDate: '2024-08-01',
    targetDate: '2026-06-15',
    metricName: 'NDWI (Water Surface Extent)',
    baselineValue: 0.44,
    targetValue: 0.31,
    percentageChange: -29.5,
    confidence: 0.95,
    sensor: 'Landsat-9',
    modality: 'OPTICAL',
    platform: 'Landsat-9 OLI-2',
    description: 'Multi-year reservoir storage depletion exposing prominent white mineral bathtub rings along canyon shorelines.',
    inference: 'Sustained structural water demand and Colorado River basin drought cycle reflected in shoreline retreat.',
    evidence: [
      'Water surface area dropped 29.5% relative to historical benchmark',
      'Over 95 km² of formerly submerged canyon slopes now exposed as dry mineralized bedrock'
    ],
    dataStatus: 'PUBLIC_DATA',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [-114.8, 36.4], [-114.1, 36.3], [-114.2, 35.9], [-114.9, 36.0], [-114.8, 36.4]
      ]]
    },
    polygonCoordinates: [
      { lat: 36.4, lon: -114.8 }, { lat: 36.3, lon: -114.1 }, { lat: 35.9, lon: -114.2 },
      { lat: 36.0, lon: -114.9 }, { lat: 36.4, lon: -114.8 }
    ],
    biome: 'Colorado River Canyon Reservoir',
    areaAffectedSqKm: 190.0,
    cloudCover: 0.1,
    primaryDrivers: ['Multi-decade Colorado River drought', 'Downstream agricultural deliveries', 'Hydropower pool level adjustments'],
    agentTrace: {
      task: 'Reservoir Storage Extent Mapping',
      agent: 'Hydrological & Water Change Agent',
      models: ['ReservoirBoundary-Net', 'NDWI-OtsuSegmenter'],
      tools: ['Landsat-9 OLI-2 Ingestion', 'DEM Water Elevation Curve'],
      confidence: 0.95
    }
  },

  // 32. California Central Valley - USA (Agriculture Subsidence)
  {
    id: 'OBS_USA_032',
    title: 'San Joaquin Valley Groundwater Depletion Subsidence',
    region: 'Tulare / Fresno Basin, California',
    country: 'United States',
    latitude: 36.3500,
    longitude: -119.8000,
    category: 'AGRICULTURE',
    severity: 'HIGH',
    baselineDate: '2024-05-01',
    targetDate: '2026-05-01',
    metricName: 'InSAR Groundwater Land Subsidence',
    baselineValue: -3.1,
    targetValue: -8.9,
    percentageChange: +187.1,
    confidence: 0.96,
    sensor: 'Sentinel-1',
    modality: 'SAR',
    platform: 'Sentinel-1 InSAR (C-band)',
    description: 'Extensive land subsidence up to 9 cm/year caused by severe agricultural deep-well irrigation pumping.',
    inference: 'Compaction of clay aquitards in the Corcoran Clay layer detected in multi-year InSAR time-series.',
    evidence: [
      'InSAR deformation map measures -8.9 cm/year peak subsidence along agricultural canals',
      'Canal gradient shifts recorded impacting gravity-fed water delivery infrastructure'
    ],
    dataStatus: 'PUBLIC_DATA',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [-120.5, 37.0], [-119.2, 36.9], [-119.1, 35.8], [-120.4, 35.9], [-120.5, 37.0]
      ]]
    },
    polygonCoordinates: [
      { lat: 37.0, lon: -120.5 }, { lat: 36.9, lon: -119.2 }, { lat: 35.8, lon: -119.1 },
      { lat: 35.9, lon: -120.4 }, { lat: 37.0, lon: -120.5 }
    ],
    biome: 'Intensive Semi-Arid Agricultural Valley',
    areaAffectedSqKm: 2850.0,
    cloudCover: 0.4,
    primaryDrivers: ['Agricultural groundwater pumping', 'Aquitard clay compaction', 'Surface water allocation cuts'],
    agentTrace: {
      task: 'Aquifer Compaction & Subsidence InSAR Tracking',
      agent: 'SAR Interferometry Specialist',
      models: ['PS-InSAR-VelocityEngine', 'AquitardCompaction-Net'],
      tools: ['Sentinel-1 Time-Series GRD/SLC Ingestion', 'Atmospheric Phase Screen Correction'],
      confidence: 0.96
    }
  },

  // 33. Great Barrier Reef - Australia (Coastal Change)
  {
    id: 'OBS_AUS_033',
    title: 'Burdekin Catchment Sediment Plume & Coral Lagoon Runoff',
    region: 'Great Barrier Reef Inshore Lagoon, Queensland',
    country: 'Australia',
    latitude: -19.2500,
    longitude: 147.5000,
    category: 'COASTAL_CHANGE',
    severity: 'HIGH',
    baselineDate: '2025-02-01',
    targetDate: '2026-03-15',
    metricName: 'Turbidity / Suspended Particulate Matter (SPM)',
    baselineValue: 2.1,
    targetValue: 8.7,
    percentageChange: +314.3,
    confidence: 0.89,
    sensor: 'Sentinel-2',
    modality: 'OPTICAL',
    platform: 'Sentinel-2 MSI + MODIS Ocean Color',
    description: 'Post-flood terrestrial fine sediment plumes extending into protected inshore coral reef ecosystems.',
    inference: 'Elevated red/green reflectance and water turbidity signatures correlate with high agricultural topsoil discharge.',
    evidence: [
      'Turbidity index increased 314% across 1,850 km² marine lagoon sector',
      'Photosynthetically available radiation (PAR) penetration at 5m depth reduced by 62%'
    ],
    dataStatus: 'DEMO_DATA',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [146.5, -18.5], [148.5, -18.4], [148.4, -20.2], [146.4, -20.1], [146.5, -18.5]
      ]]
    },
    polygonCoordinates: [
      { lat: -18.5, lon: 146.5 }, { lat: -18.4, lon: 148.5 }, { lat: -20.2, lon: 148.4 },
      { lat: -20.1, lon: 146.4 }, { lat: -18.5, lon: 146.5 }
    ],
    biome: 'Marine Coral Lagoon & Estuary',
    areaAffectedSqKm: 1850.0,
    cloudCover: 8.5,
    primaryDrivers: ['Grazing catchment soil erosion', 'Tropical cyclone flood plume', 'Fine sediment transport'],
    agentTrace: {
      task: 'Marine Turbidity & Sediment Plume Grounding',
      agent: 'Wetland & Coastal Ecology Agent',
      models: ['OceanColor-TurbidityNet', 'ReefExposure-Model'],
      tools: ['Sentinel-2 Marine Atmospheric Correction (ACOLITE)', 'MODIS Turbidity Alignment'],
      confidence: 0.89
    }
  },

  // 34. Okavango Delta - Botswana (Water Change)
  {
    id: 'OBS_BWA_034',
    title: 'Okavango Delta Seasonal Inundation Pulse',
    region: 'Ngamiland Basin, Botswana',
    country: 'Botswana',
    latitude: -19.3000,
    longitude: 22.9000,
    category: 'WATER_CHANGE',
    severity: 'MODERATE',
    baselineDate: '2025-01-20',
    targetDate: '2026-07-15',
    metricName: 'NDWI / Water Surface Area',
    baselineValue: 0.28,
    targetValue: 0.58,
    percentageChange: +107.1,
    confidence: 0.94,
    sensor: 'Sentinel-2',
    modality: 'OPTICAL',
    platform: 'Sentinel-2 MSI',
    description: 'Arrival of the annual flood wave from Angolan highlands transforming dry Kalahari floodplains into wetlands.',
    inference: 'NDWI time-series accurately tracks channel filling, hippo-path flow routing, and terminal sump filling.',
    evidence: [
      'Inundated wetland surface increased 107.1% over 4,200 km²',
      'Vegetation vigor along delta distributary channels peaked following flood recession'
    ],
    dataStatus: 'PUBLIC_DATA',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [22.0, -18.5], [23.8, -18.6], [23.7, -20.2], [21.9, -20.0], [22.0, -18.5]
      ]]
    },
    polygonCoordinates: [
      { lat: -18.5, lon: 22.0 }, { lat: -18.6, lon: 23.8 }, { lat: -20.2, lon: 23.7 },
      { lat: -20.0, lon: 21.9 }, { lat: -18.5, lon: 22.0 }
    ],
    biome: 'Inland Alluvial Fan Wetland / Kalahari',
    areaAffectedSqKm: 4200.0,
    cloudCover: 0.5,
    primaryDrivers: ['Angolan highland seasonal rainfall', 'Slow-gradient alluvial pulse', 'Termite mound channel braiding'],
    agentTrace: {
      task: 'Alluvial Wetland Hydrological Tracking',
      agent: 'Hydrological & Water Change Agent',
      models: ['WetlandPulse-Tracker', 'NDWI-SegmentationEngine'],
      tools: ['Sentinel-2 MSI Surface Ingestion', 'Hydrological Basin Flow Mask'],
      confidence: 0.94
    }
  },

  // 35. Pantanal - Brazil (Wildfire)
  {
    id: 'OBS_BRA_035',
    title: 'Pantanal Wetland Fire Scarring & Habitat Loss',
    region: 'Mato Grosso do Sul / Pantanal Biosphere',
    country: 'Brazil',
    latitude: -17.5000,
    longitude: -56.8000,
    category: 'WILDFIRE',
    severity: 'CRITICAL',
    baselineDate: '2024-09-01',
    targetDate: '2025-10-30',
    metricName: 'dNBR (Burn Severity Index)',
    baselineValue: 0.62,
    targetValue: 0.18,
    percentageChange: -71.0,
    confidence: 0.95,
    sensor: 'Sentinel-2',
    modality: 'MULTIMODAL',
    platform: 'Sentinel-2 MSI + Sentinel-1 SAR',
    description: 'Catastrophic peat and grassland wildfire spread across drought-depleted wetland channels.',
    inference: 'Unprecedented dry-season low water levels enabled surface fires to combust subterranean peat and gallery forests.',
    evidence: [
      'Burn severity score dNBR indicates severe canopy combustion over 3,450 km²',
      'Thermal anomaly sensors registered over 8,000 active fire fronts during 30-day peak dry window'
    ],
    dataStatus: 'PUBLIC_DATA',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [-58.2, -16.5], [-55.5, -16.6], [-55.6, -18.8], [-58.4, -18.7], [-58.2, -16.5]
      ]]
    },
    polygonCoordinates: [
      { lat: -16.5, lon: -58.2 }, { lat: -16.6, lon: -55.5 }, { lat: -18.8, lon: -55.6 },
      { lat: -18.7, lon: -58.4 }, { lat: -16.5, lon: -58.2 }
    ],
    biome: 'Tropical Wetland Savanna',
    areaAffectedSqKm: 3450.0,
    cloudCover: 1.0,
    primaryDrivers: ['Paraguay River historic drought', 'Pasture management fire escape', 'Peat horizon combustion'],
    agentTrace: {
      task: 'Wetland Wildfire Severity Assessment',
      agent: 'Wildfire & Thermal Analytics Agent',
      models: ['BurnSeverity-UNet', 'PeatBurn-Classifier'],
      tools: ['Sentinel-2 MSI SWIR Engine', 'Sentinel-1 SAR Soil Moisture Correlator'],
      confidence: 0.95
    }
  },

  // 36. Godavari Delta - India (Agriculture & Aquaculture)
  {
    id: 'OBS_IND_036',
    title: 'Godavari Delta Brackish Aquaculture Expansion',
    region: 'East Godavari Coastal Plain, Andhra Pradesh',
    country: 'India',
    latitude: 16.7500,
    longitude: 82.1000,
    category: 'AGRICULTURE',
    severity: 'HIGH',
    baselineDate: '2024-11-15',
    targetDate: '2026-04-10',
    metricName: 'NDWI / Aquaculture Pond Spectral Density',
    baselineValue: 0.22,
    targetValue: 0.49,
    percentageChange: +122.7,
    confidence: 0.93,
    sensor: 'Sentinel-2',
    modality: 'OPTICAL',
    platform: 'Sentinel-2 MSI',
    description: 'Rapid conversion of traditional paddy fields into commercial brackish water shrimp aquaculture ponds.',
    inference: 'Regular rectangular waterbody signatures with high aerator radar backscatter replace seasonal crop cycles.',
    evidence: [
      'Aquaculture water surface expanded by 122.7% over 480 km²',
      'Soil salinity monitoring shows permanent salinization of surrounding agricultural aquifers'
    ],
    dataStatus: 'DEMO_DATA',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [81.6, 17.1], [82.5, 17.0], [82.4, 16.4], [81.5, 16.5], [81.6, 17.1]
      ]]
    },
    polygonCoordinates: [
      { lat: 17.1, lon: 81.6 }, { lat: 17.0, lon: 82.5 }, { lat: 16.4, lon: 82.4 },
      { lat: 16.5, lon: 81.5 }, { lat: 17.1, lon: 81.6 }
    ],
    biome: 'Coastal Alluvial Delta',
    areaAffectedSqKm: 480.0,
    cloudCover: 2.8,
    primaryDrivers: ['Commercial shrimp export economics', 'Canal brackish diversion', 'Paddy land conversion'],
    agentTrace: {
      task: 'Aquaculture Pond Conversion Mapping',
      agent: 'Land Cover Classification Agent',
      models: ['AquaculturePond-Extractor', 'CropToPond-TransitionNet'],
      tools: ['Sentinel-2 Water Index Processing', 'Rectangular Feature Geometry Filter'],
      confidence: 0.93
    }
  },

  // 37. Rhine River - Germany (Water Change)
  {
    id: 'OBS_DEU_037',
    title: 'Rhine Gorge Low-Water Transportation Corridor Bottleneck',
    region: 'Kaub / Middle Rhine Valley, Germany',
    country: 'Germany',
    latitude: 50.0833,
    longitude: 7.7667,
    category: 'WATER_CHANGE',
    severity: 'HIGH',
    baselineDate: '2025-05-01',
    targetDate: '2025-08-30',
    metricName: 'Channel Water Surface Width & Backscatter Delta',
    baselineValue: 180.0,
    targetValue: 112.0,
    percentageChange: -37.8,
    confidence: 0.96,
    sensor: 'Sentinel-2',
    modality: 'MULTIMODAL',
    platform: 'Sentinel-2 MSI + Sentinel-1 SAR',
    description: 'Severe summer low flow exposing navigation channel gravel bars and halting commercial barge draft.',
    inference: 'Exposed rocky riverbed and gravel shoals detected in optical and high-resolution radar imagery.',
    evidence: [
      'Effective navigable channel width contracted by 37.8% at Kaub benchmark bottleneck',
      'Over 28 km of exposed riverbanks classified via multi-temporal NDWI difference'
    ],
    dataStatus: 'PUBLIC_DATA',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [7.5, 50.4], [8.1, 50.3], [8.0, 49.8], [7.4, 49.9], [7.5, 50.4]
      ]]
    },
    polygonCoordinates: [
      { lat: 50.4, lon: 7.5 }, { lat: 50.3, lon: 8.1 }, { lat: 49.8, lon: 8.0 },
      { lat: 49.9, lon: 7.4 }, { lat: 50.4, lon: 7.5 }
    ],
    biome: 'Temperate European River Corridor',
    areaAffectedSqKm: 120.0,
    cloudCover: 3.1,
    primaryDrivers: ['Alpine snowpack deficit', 'Summer heatwave drought', 'Inland navigation restriction'],
    agentTrace: {
      task: 'Inland River Channel Width Extraction',
      agent: 'Hydrological & Water Change Agent',
      models: ['RiverChannel-Extractor-v2', 'SAR-WaterBoundaryNet'],
      tools: ['Sentinel-2 MSI Ingestion', 'Gauge Level Synchronization', 'High-Res SAR Coherence'],
      confidence: 0.96
    }
  },

  // 38. Riyadh - Saudi Arabia (Urban Expansion)
  {
    id: 'OBS_SAU_038',
    title: 'Riyadh Ring-Road Desert Masterplan Urbanization',
    region: 'North & East Riyadh Expansion Corridors',
    country: 'Saudi Arabia',
    latitude: 24.8500,
    longitude: 46.7500,
    category: 'URBAN_EXPANSION',
    severity: 'MODERATE',
    baselineDate: '2024-10-01',
    targetDate: '2026-05-20',
    metricName: 'NDBI (Built-Up Surface Index)',
    baselineValue: 0.16,
    targetValue: 0.32,
    percentageChange: +100.0,
    confidence: 0.93,
    sensor: 'Landsat-9',
    modality: 'OPTICAL',
    platform: 'Landsat-9 OLI-2',
    description: 'Rapid transformation of open limestone plateau and gravel desert into mega-scale infrastructure and residential districts.',
    inference: 'Paved grid network and structural steel/concrete reflectance replacing native desert reg desert pavement.',
    evidence: [
      'Built-up index doubled (+100%) across 520 km²',
      'Linear road vector length increased by 460 km'
    ],
    dataStatus: 'DEMO_DATA',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [46.4, 25.1], [47.2, 25.0], [47.1, 24.5], [46.3, 24.6], [46.4, 25.1]
      ]]
    },
    polygonCoordinates: [
      { lat: 25.1, lon: 46.4 }, { lat: 25.0, lon: 47.2 }, { lat: 24.5, lon: 47.1 },
      { lat: 24.6, lon: 46.3 }, { lat: 25.1, lon: 46.4 }
    ],
    biome: 'Hyper-Arid Plateau Desert',
    areaAffectedSqKm: 520.0,
    cloudCover: 0.1,
    primaryDrivers: ['National mega-development masterplan', 'Ring road corridor expansion', 'Commercial logistics parks'],
    agentTrace: {
      task: 'Desert Urbanization Tracking',
      agent: 'Built Environment Agent',
      models: ['AridUrban-Classifier', 'RoadVector-Extractor'],
      tools: ['Landsat-9 OLI Processing', 'NDBI Differencing'],
      confidence: 0.93
    }
  }
];
