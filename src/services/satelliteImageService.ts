/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Satellite Image & Visual Evidence Generator
 * Produces crisp multi-spectral optical, infrared false-color (SWIR/NIR),
 * and Sentinel-1 SAR C-Band radar backscatter imagery representations for each observation.
 */

import { ObservationCategory } from '../types/observation';
import { GLOBAL_OBSERVATIONS } from '../data/observations';

export interface VisualTileOptions {
  category: ObservationCategory;
  regionName: string;
  type: 'OPTICAL_BEFORE' | 'OPTICAL_AFTER' | 'FALSE_COLOR_BEFORE' | 'FALSE_COLOR_AFTER' | 'SAR_RADAR' | 'DIFFERENCE_HEATMAP';
  severity?: string;
  width?: number;
  height?: number;
}

export class SatelliteImageService {
  /**
   * Generates a high-fidelity SVG/Data-URL representing satellite imagery
   * conditioned on the category, temporal stage, and geographic terrain context.
   */
  public static generateImageryDataUrl(options: VisualTileOptions): string {
    const { category, type, regionName, severity = 'HIGH' } = options;
    const w = options.width || 800;
    const h = options.height || 500;

    let bgGrad = '';
    let landElements = '';
    let gridOverlay = '';
    let annotations = '';
    let sensorLabel = 'Sentinel-2 MSI Level-2A (BOA)';
    let channelLabel = 'RGB True Color (B04-B03-B02)';

    const isAfter = type.includes('AFTER');
    const isFalseColor = type.includes('FALSE_COLOR');
    const isSAR = type === 'SAR_RADAR';
    const isDiff = type === 'DIFFERENCE_HEATMAP';

    // Color definitions
    if (isSAR) {
      sensorLabel = 'Sentinel-1A SAR C-Band';
      channelLabel = 'Dual-Pol Backscatter (VV + VH dB)';
      bgGrad = `
        <radialGradient id="sarBg" cx="50%" cy="50%" r="70%">
          <stop offset="0%" stop-color="#141923" />
          <stop offset="70%" stop-color="#080c12" />
          <stop offset="100%" stop-color="#030508" />
        </radialGradient>
      `;
    } else if (isFalseColor) {
      sensorLabel = 'Sentinel-2 MultiSpectral Instrument';
      channelLabel = 'Color Infrared False-Color (B08-NIR / B04-Red / B03-Green)';
      bgGrad = `
        <linearGradient id="fcBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${isAfter ? '#2b1016' : '#450a1b'}" />
          <stop offset="60%" stop-color="${isAfter ? '#1c151b' : '#330816'}" />
          <stop offset="100%" stop-color="#0e0d14" />
        </linearGradient>
      `;
    } else if (isDiff) {
      sensorLabel = 'Bi-Temporal Difference Processor';
      channelLabel = 'Radiometric Delta / Anomaly Index';
      bgGrad = `
        <linearGradient id="diffBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0a0a0f" />
          <stop offset="100%" stop-color="#040406" />
        </linearGradient>
      `;
    } else {
      // Optical true color
      bgGrad = `
        <linearGradient id="optBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${isAfter ? '#151d18' : '#142a1b'}" />
          <stop offset="50%" stop-color="${isAfter ? '#1a221a' : '#1a3824'}" />
          <stop offset="100%" stop-color="${isAfter ? '#0f1712' : '#0d2114'}" />
        </linearGradient>
      `;
    }

    // Category-specific visual structures
    if (category === 'DEFORESTATION' || category === 'VEGETATION_CHANGE') {
      if (isSAR) {
        landElements = `
          <!-- SAR Radar Texture with Volume vs Roughness Scattering -->
          <pattern id="sarSpeckle" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="3" r="1.2" fill="#3df2ff" opacity="0.35"/>
            <circle cx="12" cy="14" r="0.8" fill="#ffffff" opacity="0.4"/>
            <circle cx="17" cy="6" r="1.5" fill="#3df2ff" opacity="0.25"/>
            <circle cx="7" cy="18" r="0.6" fill="#ffffff" opacity="0.6"/>
          </pattern>
          <rect width="${w}" height="${h}" fill="url(#sarSpeckle)"/>
          <!-- River Meander (Specular reflection - Dark in SAR) -->
          <path d="M 0,220 Q 200,180 380,260 T 800,240" fill="none" stroke="#040810" stroke-width="45" stroke-linecap="round" opacity="0.95"/>
          <path d="M 0,220 Q 200,180 380,260 T 800,240" fill="none" stroke="#102538" stroke-width="50" stroke-linecap="round" opacity="0.3"/>
          ${isAfter ? `
            <!-- Exposed ground patches (Rough surface backscatter) -->
            <polygon points="180,120 340,110 360,200 200,210" fill="#2d3b48" stroke="#3df2ff" stroke-width="1.5" opacity="0.75"/>
            <polygon points="460,80 680,95 650,220 440,190" fill="#324152" stroke="#3df2ff" stroke-width="1.5" opacity="0.8"/>
            <polygon points="320,310 540,290 560,420 310,430" fill="#2d3b48" stroke="#3df2ff" stroke-width="1.5" opacity="0.7"/>
          ` : `
            <!-- Continuous Canopy Volume Scattering -->
            <rect x="150" y="80" width="550" height="350" fill="#1b2a38" opacity="0.4"/>
          `}
        `;
      } else if (isFalseColor) {
        landElements = `
          <!-- Healthy vegetation shows vibrant crimson/magenta in NIR False Color -->
          <rect width="${w}" height="${h}" fill="${isAfter ? '#3d1222' : '#881337'}" opacity="${isAfter ? '0.7' : '0.9'}"/>
          <!-- River corridor (Cyan/Black in SWIR/NIR) -->
          <path d="M 0,220 Q 200,180 380,260 T 800,240" fill="none" stroke="#030712" stroke-width="40" opacity="0.95"/>
          ${isAfter ? `
            <!-- Clearings appear cyan/grey (soil reflection) -->
            <polygon points="180,120 340,110 360,200 200,210" fill="#1e293b" stroke="#f43f5e" stroke-width="2"/>
            <polygon points="460,80 680,95 650,220 440,190" fill="#334155" stroke="#f43f5e" stroke-width="2"/>
            <polygon points="320,310 540,290 560,420 310,430" fill="#1e293b" stroke="#f43f5e" stroke-width="2"/>
            <line x1="180" y1="160" x2="350" y2="155" stroke="#f43f5e" stroke-dasharray="4,4" stroke-width="1.5"/>
            <line x1="460" y1="150" x2="660" y2="160" stroke="#f43f5e" stroke-dasharray="4,4" stroke-width="1.5"/>
          ` : `
            <!-- Dense undisturbed canopy -->
            <circle cx="280" cy="180" r="140" fill="#9f1239" opacity="0.6"/>
            <circle cx="560" cy="220" r="160" fill="#be123c" opacity="0.6"/>
          `}
        `;
      } else if (isDiff) {
        landElements = `
          <!-- Difference Heatmap: Lost Canopy in Orange/Red -->
          <polygon points="180,120 340,110 360,200 200,210" fill="#ff4e00" opacity="0.75" filter="drop-shadow(0 0 15px #ff4e00)"/>
          <polygon points="460,80 680,95 650,220 440,190" fill="#ff4e00" opacity="0.85" filter="drop-shadow(0 0 20px #ff4e00)"/>
          <polygon points="320,310 540,290 560,420 310,430" fill="#f59e0b" opacity="0.7" filter="drop-shadow(0 0 15px #f59e0b)"/>
          <!-- River Meander (Unchanged - Neutral) -->
          <path d="M 0,220 Q 200,180 380,260 T 800,240" fill="none" stroke="#1e293b" stroke-width="40" opacity="0.6"/>
        `;
      } else {
        // Optical True Color
        landElements = `
          <!-- Forest Floor & Primary Canopy -->
          <rect width="${w}" height="${h}" fill="${isAfter ? '#1e3323' : '#14532d'}"/>
          <!-- River -->
          <path d="M 0,220 Q 200,180 380,260 T 800,240" fill="none" stroke="#0f172a" stroke-width="40"/>
          ${isAfter ? `
            <!-- Exposed Fishbone clearings / Pasture Soil -->
            <polygon points="180,120 340,110 360,200 200,210" fill="#78350f" stroke="#b45309" stroke-width="2"/>
            <polygon points="460,80 680,95 650,220 440,190" fill="#854d0e" stroke="#ca8a04" stroke-width="2"/>
            <polygon points="320,310 540,290 560,420 310,430" fill="#713f12" stroke="#a16207" stroke-width="2"/>
            <!-- Logging access roads -->
            <line x1="50" y1="160" x2="750" y2="155" stroke="#ca8a04" stroke-width="3" opacity="0.8"/>
            <line x1="560" y1="90" x2="550" y2="450" stroke="#ca8a04" stroke-width="3" opacity="0.8"/>
          ` : `
            <!-- Pristine continuous rainforest -->
            <path d="M 50,50 Q 200,80 400,60 T 750,70" fill="none" stroke="#166534" stroke-width="20" opacity="0.7"/>
            <path d="M 100,380 Q 300,420 600,390 T 750,410" fill="none" stroke="#15803d" stroke-width="25" opacity="0.6"/>
          `}
        `;
      }
    } else if (category === 'FLOOD' || category === 'WATER_CHANGE') {
      if (isSAR) {
        landElements = `
          <!-- Land Surface (Diffuse radar return) -->
          <rect width="${w}" height="${h}" fill="#1e293b"/>
          <!-- Inundated Water (Specular reflection = Pitch black in SAR) -->
          ${isAfter ? `
            <path d="M 40,80 Q 200,50 450,110 T 760,90 L 780,410 Q 500,450 300,390 T 20,380 Z" fill="#020617" stroke="#3df2ff" stroke-width="2" filter="drop-shadow(0 0 10px #3df2ff)"/>
            <circle cx="220" cy="240" r="45" fill="#020617" stroke="#3df2ff" stroke-width="1.5"/>
            <circle cx="580" cy="270" r="55" fill="#020617" stroke="#3df2ff" stroke-width="1.5"/>
          ` : `
            <!-- Normal narrow channel -->
            <path d="M 0,240 Q 300,210 500,260 T 800,240" fill="none" stroke="#020617" stroke-width="35"/>
          `}
        `;
      } else if (isDiff) {
        landElements = `
          <!-- Difference: Water expansion highlighted in cyan/blue -->
          <path d="M 40,80 Q 200,50 450,110 T 760,90 L 780,410 Q 500,450 300,390 T 20,380 Z" fill="#0284c7" opacity="0.8" filter="drop-shadow(0 0 20px #38bdf8)"/>
          <path d="M 0,240 Q 300,210 500,260 T 800,240" fill="none" stroke="#082f49" stroke-width="35" opacity="0.4"/>
        `;
      } else {
        // Optical
        landElements = `
          <!-- Agricultural / Floodplain fields -->
          <rect width="${w}" height="${h}" fill="${isAfter ? '#1e293b' : '#365314'}"/>
          ${isAfter ? `
            <!-- Inundated sediment-rich floodwater -->
            <path d="M 40,80 Q 200,50 450,110 T 760,90 L 780,410 Q 500,450 300,390 T 20,380 Z" fill="#0369a1" opacity="0.85"/>
            <path d="M 100,120 Q 300,90 550,150 T 700,130" fill="none" stroke="#38bdf8" stroke-width="15" opacity="0.8"/>
          ` : `
            <!-- Normal river bed -->
            <path d="M 0,240 Q 300,210 500,260 T 800,240" fill="none" stroke="#0284c7" stroke-width="35"/>
            <!-- Dry agricultural parcels -->
            <rect x="80" y="60" width="160" height="120" fill="#4d7c0f" opacity="0.4" stroke="#65a30d"/>
            <rect x="280" y="80" width="180" height="100" fill="#3f6212" opacity="0.4" stroke="#65a30d"/>
            <rect x="520" y="60" width="200" height="140" fill="#4d7c0f" opacity="0.4" stroke="#65a30d"/>
          `}
        `;
      }
    } else if (category === 'URBAN_EXPANSION' || category === 'INFRASTRUCTURE') {
      if (isSAR) {
        landElements = `
          <!-- Background natural terrain -->
          <rect width="${w}" height="${h}" fill="#0f172a"/>
          <!-- Urban structures create extreme double-bounce radar return (Bright white/cyan in SAR) -->
          <rect x="100" y="80" width="220" height="340" fill="#e2e8f0" stroke="#3df2ff" stroke-width="2" opacity="0.9" filter="drop-shadow(0 0 10px #3df2ff)"/>
          ${isAfter ? `
            <!-- Newly expanded urban sectors with high dielectric backscatter -->
            <rect x="360" y="80" width="360" height="340" fill="#f8fafc" stroke="#3df2ff" stroke-width="2.5" opacity="0.95" filter="drop-shadow(0 0 15px #3df2ff)"/>
            <!-- Road network -->
            <line x1="100" y1="200" x2="720" y2="200" stroke="#ffffff" stroke-width="4"/>
            <line x1="100" y1="300" x2="720" y2="300" stroke="#ffffff" stroke-width="4"/>
            <line x1="360" y1="80" x2="360" y2="420" stroke="#ffffff" stroke-width="4"/>
            <line x1="540" y1="80" x2="540" y2="420" stroke="#ffffff" stroke-width="4"/>
          ` : `
            <!-- Semi-arid surrounding area with low backscatter -->
            <rect x="360" y="80" width="360" height="340" fill="#1e293b" stroke="#334155" stroke-width="1" opacity="0.5"/>
          `}
        `;
      } else if (isDiff) {
        landElements = `
          <!-- Difference: Urban Growth in Magenta/Purple -->
          <rect x="360" y="80" width="360" height="340" fill="#c026d3" opacity="0.8" filter="drop-shadow(0 0 20px #e879f9)"/>
          <rect x="100" y="80" width="220" height="340" fill="#334155" opacity="0.3"/>
          <line x1="360" y1="80" x2="360" y2="420" stroke="#ffffff" stroke-width="3"/>
          <line x1="540" y1="80" x2="540" y2="420" stroke="#ffffff" stroke-width="3"/>
        `;
      } else {
        // Optical
        landElements = `
          <rect width="${w}" height="${h}" fill="${isAfter ? '#1c1917' : '#292524'}"/>
          <!-- Pre-existing urban core -->
          <rect x="100" y="80" width="220" height="340" fill="#78716c" stroke="#a8a29e" stroke-width="1.5"/>
          ${isAfter ? `
            <!-- Massive new built-up expansion grid (Impervious concrete/asphalt) -->
            <rect x="360" y="80" width="360" height="340" fill="#e7e5e4" stroke="#f5f5f4" stroke-width="2"/>
            <!-- Grid Roads -->
            <line x1="100" y1="160" x2="720" y2="160" stroke="#44403c" stroke-width="3"/>
            <line x1="100" y1="240" x2="720" y2="240" stroke="#44403c" stroke-width="3"/>
            <line x1="100" y1="320" x2="720" y2="320" stroke="#44403c" stroke-width="3"/>
            <line x1="360" y1="80" x2="360" y2="420" stroke="#44403c" stroke-width="3"/>
            <line x1="480" y1="80" x2="480" y2="420" stroke="#44403c" stroke-width="3"/>
            <line x1="600" y1="80" x2="600" y2="420" stroke="#44403c" stroke-width="3"/>
          ` : `
            <!-- Desert / Agricultural soil prior to development -->
            <rect x="360" y="80" width="360" height="340" fill="#78350f" opacity="0.6" stroke="#92400e" stroke-width="1"/>
            <line x1="100" y1="240" x2="360" y2="240" stroke="#44403c" stroke-width="3"/>
          `}
        `;
      }
    } else {
      // Wildfire / Generic Anomaly
      if (isDiff) {
        landElements = `
          <!-- High-severity burn scar highlighted in crimson -->
          <polygon points="140,90 320,60 520,110 680,80 740,240 680,410 460,440 220,380 120,260" fill="#dc2626" opacity="0.8" filter="drop-shadow(0 0 25px #ef4444)"/>
        `;
      } else {
        landElements = `
          <rect width="${w}" height="${h}" fill="${isAfter ? '#1c1917' : '#14532d'}"/>
          ${isAfter ? `
            <!-- Severe Ash and Charred Canopy Perimeter -->
            <polygon points="140,90 320,60 520,110 680,80 740,240 680,410 460,440 220,380 120,260" fill="#0f0f10" stroke="#ea580c" stroke-width="3"/>
            <path d="M 220,160 Q 400,120 600,180 T 660,340" fill="none" stroke="#f97316" stroke-width="4" stroke-dasharray="6,4"/>
          ` : `
            <!-- Dense green Mediterranean / Boreal pine canopy -->
            <rect width="${w}" height="${h}" fill="#15803d"/>
            <circle cx="340" cy="220" r="180" fill="#166534" opacity="0.7"/>
          `}
        `;
      }
    }

    // Grid coordinates & HUD overlay on the image
    gridOverlay = `
      <!-- Coordinate Graticule -->
      <g stroke="#ffffff" stroke-width="0.5" stroke-dasharray="3,6" opacity="0.25">
        <line x1="${w * 0.25}" y1="0" x2="${w * 0.25}" y2="${h}"/>
        <line x1="${w * 0.5}" y1="0" x2="${w * 0.5}" y2="${h}"/>
        <line x1="${w * 0.75}" y1="0" x2="${w * 0.75}" y2="${h}"/>
        <line x1="0" y1="${h * 0.33}" x2="${w}" y2="${h * 0.33}"/>
        <line x1="0" y1="${h * 0.66}" x2="${w}" y2="${h * 0.66}"/>
      </g>
      <!-- Corner Crosshairs -->
      <g stroke="#3df2ff" stroke-width="1.5" opacity="0.8">
        <path d="M 20,40 L 20,20 L 40,20"/>
        <path d="M ${w - 40},20 L ${w - 20},20 L ${w - 20},40"/>
        <path d="M 20,${h - 40} L 20,${h - 20} L 40,${h - 20}"/>
        <path d="M ${w - 40},${h - 20} L ${w - 20},${h - 20} L ${w - 20},${h - 40}"/>
      </g>
    `;

    // High-resolution metadata badge overlay inside the image
    annotations = `
      <g font-family="Plus Jakarta Sans, monospace, sans-serif">
        <!-- Top Left Sensor & Channel Badge -->
        <rect x="25" y="25" width="310" height="42" fill="#050508" fill-opacity="0.85" stroke="#ffffff" stroke-opacity="0.2" rx="0"/>
        <text x="35" y="42" fill="#3df2ff" font-size="10" font-weight="bold" letter-spacing="1.5">${sensorLabel.toUpperCase()}</text>
        <text x="35" y="57" fill="#ffffff" fill-opacity="0.75" font-size="9">${channelLabel}</text>

        <!-- Top Right Geographic Stamp -->
        <rect x="${w - 245}" y="25" width="220" height="42" fill="#050508" fill-opacity="0.85" stroke="#ffffff" stroke-opacity="0.2" rx="0"/>
        <text x="${w - 235}" y="42" fill="#ffffff" font-size="10" font-weight="bold">${regionName.slice(0, 24)}</text>
        <text x="${w - 235}" y="57" fill="${isAfter ? '#ff4e00' : '#10b981'}" font-size="9" font-weight="bold">
          ${isAfter ? 'TARGET EPOCH (T1)' : isDiff ? 'DIFFERENCE ANOMALY' : 'BASELINE EPOCH (T0)'}
        </text>

        <!-- Bottom Left Ground Scale & Radiometric Calibration -->
        <rect x="25" y="${h - 45}" width="200" height="25" fill="#050508" fill-opacity="0.8" stroke="#ffffff" stroke-opacity="0.15"/>
        <line x1="35" y1="${h - 32}" x2="95" y2="${h - 32}" stroke="#ffffff" stroke-width="2"/>
        <text x="105" y="${h - 28}" fill="#ffffff" font-size="9" font-mono="true">5.0 KM (GSD 10M)</text>
      </g>
    `;

    const svgContent = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
        <defs>
          ${bgGrad}
        </defs>
        <!-- Background Layer -->
        <rect width="${w}" height="${h}" fill="url(#${isSAR ? 'sarBg' : isFalseColor ? 'fcBg' : isDiff ? 'diffBg' : 'optBg'})"/>
        <!-- Land cover and spectral features -->
        ${landElements}
        <!-- Grid & Crosshairs -->
        ${gridOverlay}
        <!-- Annotations & Header HUD -->
        ${annotations}
      </svg>
    `;

    return `data:image/svg+xml;utf8,${encodeURIComponent(svgContent)}`;
  }

  /**
   * Retrieves a generated satellite visual texture data URL for a given observation ID / site code and stage.
   */
  public static getObservationImage(
    siteCodeOrId: string,
    stage: 'BEFORE' | 'AFTER' | 'DIFFERENCE' | 'SAR' | 'FALSE_COLOR' | string = 'AFTER'
  ): string {
    const normalizedKey = (siteCodeOrId || '').toLowerCase().trim();
    
    // Find matching observation from registry
    const obs = GLOBAL_OBSERVATIONS.find((o, idx) => {
      const siteCode = `site_${String(idx + 1).padStart(3, '0')}`.toLowerCase();
      const siteCodeNum = `site_${idx + 1}`.toLowerCase();
      const cleanId = o.id.toLowerCase();
      return (
        cleanId === normalizedKey ||
        cleanId.includes(normalizedKey) ||
        normalizedKey.includes(cleanId) ||
        siteCode === normalizedKey ||
        siteCodeNum === normalizedKey ||
        normalizedKey.includes(`00${idx + 1}`) ||
        normalizedKey.includes(`0${idx + 1}`)
      );
    }) || GLOBAL_OBSERVATIONS[0];

    let type: 'OPTICAL_BEFORE' | 'OPTICAL_AFTER' | 'FALSE_COLOR_BEFORE' | 'FALSE_COLOR_AFTER' | 'SAR_RADAR' | 'DIFFERENCE_HEATMAP' = 'OPTICAL_AFTER';

    const s = (stage || 'AFTER').toUpperCase();
    if (s === 'BEFORE' || s === 'OPTICAL_BEFORE') {
      type = 'OPTICAL_BEFORE';
    } else if (s === 'DIFFERENCE' || s === 'DIFFERENCE_HEATMAP') {
      type = 'DIFFERENCE_HEATMAP';
    } else if (s === 'SAR' || s === 'SAR_RADAR') {
      type = 'SAR_RADAR';
    } else if (s === 'FALSE_COLOR' || s === 'FALSE_COLOR_BEFORE') {
      type = 'FALSE_COLOR_BEFORE';
    } else if (s === 'FALSE_COLOR_AFTER') {
      type = 'FALSE_COLOR_AFTER';
    } else {
      type = 'OPTICAL_AFTER';
    }

    return SatelliteImageService.generateImageryDataUrl({
      category: obs?.category || 'DEFORESTATION',
      regionName: obs?.region || 'Global Observation Site',
      type,
      severity: obs?.severity || 'HIGH',
      width: 800,
      height: 500,
    });
  }
}
