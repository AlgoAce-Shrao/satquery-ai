/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Multimodal Optical + SAR Synchronized Viewer
 * Displays side-by-side Optical Multispectral and Sentinel-1 SAR C-Band Radar backscatter
 * with synchronized crosshair telemetry and joint multi-sensor analytical synthesis.
 */

import React, { useState } from 'react';
import { AnalysisResult, MultimodalComparisonData } from '../../types/geospatial';
import { SatelliteImageService } from '../../services/satelliteImageService';
import {
  X,
  Maximize2,
  Minimize2,
  Compass,
  Layers,
  Radio,
  Eye,
  Bot,
  Zap,
  CheckCircle2,
  Cpu,
  Activity,
  Sparkles,
} from 'lucide-react';

interface MultimodalViewerProps {
  isOpen: boolean;
  activeResult: AnalysisResult | null;
  onClose: () => void;
  onFocusOnMap?: () => void;
}

export const MultimodalViewer: React.FC<MultimodalViewerProps> = ({
  isOpen,
  activeResult,
  onClose,
  onFocusOnMap,
}) => {
  const [crosshairPos, setCrosshairPos] = useState<{ x: number; y: number } | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [opticalBand, setOpticalBand] = useState<'RGB' | 'NIR_SWIR'>('RGB');
  const [sarPol, setSarPol] = useState<'VV_VH' | 'SINGLE_VV'>('VV_VH');

  if (!isOpen || !activeResult) return null;

  const {
    category,
    regionName,
    country,
    siteCode,
    confidence,
    metric,
    observationPeriod,
    multimodalData,
    agentTrace,
  } = activeResult;

  // Default multimodal information if not specifically populated
  const mmData: MultimodalComparisonData = multimodalData || {
    opticalSensor: 'Sentinel-2 L2A (10m GSD)',
    opticalResolution: '10m GSD Multispectral (13 Bands)',
    opticalBands: ['B02 (Blue 490nm)', 'B03 (Green 560nm)', 'B04 (Red 665nm)', 'B08 (NIR 842nm)', 'B11 (SWIR 1610nm)'],
    opticalInterpretation: 'High optical sensitivity to canopy chlorophyll absorption (NDVI) and surface water spectral pigmentation. Susceptible to cloud contamination and atmospheric haze.',
    sarSensor: 'Sentinel-1A SAR C-Band (5.405 GHz)',
    sarBand: 'Interferometric Wide Swath (IW) VV + VH Polarizations',
    sarResolution: '20m x 22m Spatial Resolution',
    sarInterpretation: 'All-weather, day/night active radar sensor. Specular reflection causes calm water to appear black, while built-up urban corners create bright double-bounce backscatter (+12 dB).',
    jointInsight: 'Joint fusion of Optical + SAR eliminates cloud ambiguity and distinguishes true surface desiccation and urban expansion from temporary shadow or seasonal vegetation drying.',
    confidence: 0.95,
  };

  const opticalImageUrl = SatelliteImageService.generateImageryDataUrl({
    category,
    regionName,
    type: opticalBand === 'RGB' ? 'OPTICAL_AFTER' : 'FALSE_COLOR_AFTER',
    severity: metric.severity,
  });

  const sarImageUrl = SatelliteImageService.generateImageryDataUrl({
    category,
    regionName,
    type: 'SAR_RADAR',
    severity: metric.severity,
  });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));
    setCrosshairPos({ x: (x / rect.width) * 100, y: (y / rect.height) * 100 });
  };

  const handleMouseLeave = () => {
    setCrosshairPos(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-200 select-none">
      <div
        className={`relative w-full ${
          isExpanded ? 'max-w-[98vw] h-[96vh]' : 'max-w-6xl h-[88vh]'
        } bg-[#08080c] border border-white/20 shadow-[0_0_90px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden transition-all duration-300`}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/15 bg-black/60">
          <div className="flex items-center gap-3">
            <span className="p-1.5 bg-[#3df2ff]/20 text-[#3df2ff] border border-[#3df2ff]/40 text-[10px] font-mono-code font-bold uppercase flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              <span>MULTIMODAL SENSOR FUSION</span>
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <span>{regionName}</span>
                <span className="text-xs font-mono-code text-white/50">• {country}</span>
              </h2>
              <p className="text-[10px] font-mono-code text-[#3df2ff]">
                OPTICAL (Sentinel-2 MSI) + ACTIVE RADAR (Sentinel-1 SAR C-Band)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              title={isExpanded ? 'Restore View' : 'Fullscreen'}
              className="p-2 bg-white/10 hover:bg-white/20 border border-white/15 text-white/70 hover:text-white transition-all"
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 bg-white/10 hover:bg-white/20 border border-white/15 text-white/70 hover:text-white transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Central Dual Viewport + Joint Analysis Drawer */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
          {/* Synchronized Dual Images Container */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-1 bg-black p-1 relative overflow-hidden">
            {/* Viewport 1: OPTICAL */}
            <div
              className="relative w-full h-full bg-black/80 border border-white/10 overflow-hidden cursor-crosshair group"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              <img
                src={opticalImageUrl}
                alt="Optical Satellite Imagery"
                className="w-full h-full object-cover pointer-events-none"
              />

              {/* Optical Controls Badge */}
              <div className="absolute top-3 left-3 z-20 flex items-center gap-2 bg-black/85 backdrop-blur-md px-3 py-1.5 border border-white/15">
                <Eye className="w-3.5 h-3.5 text-[#3df2ff]" />
                <span className="text-[10px] font-mono-code font-bold text-white uppercase tracking-wider">
                  OPTICAL MULTISPECTRAL
                </span>
              </div>

              <div className="absolute top-3 right-3 z-20 flex items-center gap-1 bg-black/85 backdrop-blur-md p-1 border border-white/15 text-[9px] font-mono-code">
                <button
                  onClick={() => setOpticalBand('RGB')}
                  className={`px-2 py-0.5 uppercase ${
                    opticalBand === 'RGB' ? 'bg-[#3df2ff] text-black font-bold' : 'text-white/60 hover:text-white'
                  }`}
                >
                  RGB
                </button>
                <button
                  onClick={() => setOpticalBand('NIR_SWIR')}
                  className={`px-2 py-0.5 uppercase ${
                    opticalBand === 'NIR_SWIR' ? 'bg-[#f43f5e] text-white font-bold' : 'text-white/60 hover:text-white'
                  }`}
                >
                  NIR False-Color
                </button>
              </div>

              {/* Synchronized Crosshair Overlay */}
              {crosshairPos && (
                <div
                  className="absolute pointer-events-none z-30"
                  style={{
                    left: `${crosshairPos.x}%`,
                    top: `${crosshairPos.y}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  <div className="w-6 h-6 border border-[#3df2ff] rounded-full relative flex items-center justify-center animate-pulse">
                    <div className="w-1 h-1 bg-[#3df2ff] rounded-full"></div>
                  </div>
                </div>
              )}

              {/* Bottom Sensor Spec */}
              <div className="absolute bottom-3 left-3 z-20 bg-black/85 backdrop-blur-md px-2.5 py-1 border border-white/10 text-[9px] font-mono-code text-white/70">
                {mmData.opticalSensor} • 10m GSD
              </div>
            </div>

            {/* Viewport 2: SAR RADAR */}
            <div
              className="relative w-full h-full bg-black/80 border border-white/10 overflow-hidden cursor-crosshair group"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              <img
                src={sarImageUrl}
                alt="SAR Radar Imagery"
                className="w-full h-full object-cover pointer-events-none"
              />

              {/* SAR Controls Badge */}
              <div className="absolute top-3 left-3 z-20 flex items-center gap-2 bg-black/85 backdrop-blur-md px-3 py-1.5 border border-[#3df2ff]/40">
                <Radio className="w-3.5 h-3.5 text-[#3df2ff] animate-pulse" />
                <span className="text-[10px] font-mono-code font-bold text-white uppercase tracking-wider">
                  SENTINEL-1 SAR C-BAND
                </span>
              </div>

              <div className="absolute top-3 right-3 z-20 flex items-center gap-1 bg-black/85 backdrop-blur-md p-1 border border-white/15 text-[9px] font-mono-code">
                <button
                  onClick={() => setSarPol('VV_VH')}
                  className={`px-2 py-0.5 uppercase ${
                    sarPol === 'VV_VH' ? 'bg-[#0284c7] text-white font-bold' : 'text-white/60 hover:text-white'
                  }`}
                >
                  Dual-Pol (VV+VH)
                </button>
                <button
                  onClick={() => setSarPol('SINGLE_VV')}
                  className={`px-2 py-0.5 uppercase ${
                    sarPol === 'SINGLE_VV' ? 'bg-white/20 text-white font-bold' : 'text-white/60 hover:text-white'
                  }`}
                >
                  VV Backscatter
                </button>
              </div>

              {/* Synchronized Crosshair Overlay */}
              {crosshairPos && (
                <div
                  className="absolute pointer-events-none z-30"
                  style={{
                    left: `${crosshairPos.x}%`,
                    top: `${crosshairPos.y}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  <div className="w-6 h-6 border border-[#3df2ff] rounded-full relative flex items-center justify-center animate-pulse">
                    <div className="w-1 h-1 bg-[#3df2ff] rounded-full"></div>
                  </div>
                </div>
              )}

              {/* Bottom Sensor Spec */}
              <div className="absolute bottom-3 left-3 z-20 bg-black/85 backdrop-blur-md px-2.5 py-1 border border-white/10 text-[9px] font-mono-code text-white/70">
                {mmData.sarSensor} • Active Microwave
              </div>
            </div>
          </div>

          {/* Right Side: Joint Analysis Synthesis Panel */}
          <aside className="w-full lg:w-96 bg-[#0c0c10] border-t lg:border-t-0 lg:border-l border-white/15 p-5 flex flex-col justify-between overflow-y-auto space-y-5 shrink-0 select-none">
            <div className="space-y-4">
              {/* Header */}
              <div>
                <p className="text-[10px] tracking-[0.2em] text-white/40 uppercase font-bold">Joint Multi-Sensor Synthesis</p>
                <h3 className="text-lg font-bold text-white tracking-tight mt-1 font-sans">
                  Optical + SAR Joint Grounding
                </h3>
              </div>

              {/* Joint Insight Callout */}
              <div className="p-3.5 bg-[#3df2ff]/10 border border-[#3df2ff]/40 space-y-2">
                <div className="flex items-center gap-2 text-[#3df2ff] text-xs font-bold font-mono-code uppercase">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Joint Sensor Advantage</span>
                </div>
                <p className="text-xs text-white/90 font-serif-editorial italic leading-relaxed">
                  &ldquo;{mmData.jointInsight}&rdquo;
                </p>
                <div className="flex items-center justify-between text-[10px] font-mono-code text-white/60 pt-2 border-t border-[#3df2ff]/20">
                  <span>Fusion Calibration: OPT + SAR</span>
                  <span className="text-[#3df2ff] font-bold">Confidence: {Math.round(mmData.confidence * 100)}%</span>
                </div>
              </div>

              {/* Sensor Roles Comparison */}
              <div className="space-y-3 font-mono-code text-xs">
                {/* Optical Role */}
                <div className="p-3 bg-white/5 border border-white/10 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-[#3df2ff] font-bold uppercase">1. Optical Spectral Role</span>
                    <span className="text-white/40">Visible + SWIR</span>
                  </div>
                  <p className="text-[10px] text-white/70 font-sans leading-snug">
                    {mmData.opticalInterpretation}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {mmData.opticalBands.slice(0, 3).map((b, i) => (
                      <span key={i} className="text-[8px] px-1.5 py-0.5 bg-white/10 text-white/60 border border-white/10">
                        {b.split(' ')[0]}
                      </span>
                    ))}
                  </div>
                </div>

                {/* SAR Role */}
                <div className="p-3 bg-white/5 border border-white/10 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-[#0284c7] font-bold uppercase">2. Active SAR Microwave Role</span>
                    <span className="text-white/40">C-Band Radar</span>
                  </div>
                  <p className="text-[10px] text-white/70 font-sans leading-snug">
                    {mmData.sarInterpretation}
                  </p>
                  <div className="text-[9px] text-white/50">
                    Polarization: {mmData.sarBand}
                  </div>
                </div>
              </div>

              {/* Agent Execution Trace */}
              {agentTrace && (
                <div className="p-3 bg-black/60 border border-white/10 space-y-1.5 text-[10px] font-mono-code">
                  <div className="flex items-center justify-between text-[#3df2ff]">
                    <span className="flex items-center gap-1">
                      <Bot className="w-3 h-3" />
                      <span>{agentTrace.agent}</span>
                    </span>
                    <span>{Math.round(agentTrace.confidence * 100)}%</span>
                  </div>
                  <p className="text-white/60 text-[9px]">
                    Pipeline: {agentTrace.models.join(' → ')}
                  </p>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-white/10">
              <button
                onClick={() => {
                  if (onFocusOnMap) onFocusOnMap();
                  onClose();
                }}
                className="w-full py-2.5 bg-[#3df2ff] hover:bg-[#3df2ff]/90 text-black font-mono-code text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                <Compass className="w-4 h-4" />
                <span>Locate Fusion on 3D Earth</span>
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};
