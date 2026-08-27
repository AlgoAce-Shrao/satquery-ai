/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Interactive Before vs After Temporal Comparison Viewer
 * Provides a responsive draggable vertical swipe divider, multi-spectral false-color,
 * SAR backscatter inspection, and interactive change-region bounding box overlays.
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { AnalysisResult, SpatialEvidenceItem } from '../../types/geospatial';
import { SatelliteImageService } from '../../services/satelliteImageService';
import {
  SlidersHorizontal,
  Layers,
  Sparkles,
  Maximize2,
  Minimize2,
  X,
  Compass,
  Satellite,
  Bot,
  MapPin,
  Calendar,
  Eye,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

interface TemporalComparisonViewerProps {
  isOpen: boolean;
  activeResult: AnalysisResult | null;
  onClose: () => void;
  onSelectChangeRegion?: (region: SpatialEvidenceItem) => void;
  onFocusOnMap?: () => void;
}

export type ImagerySpectralLayer = 'OPTICAL_RGB' | 'FALSE_COLOR_NIR' | 'SAR_RADAR' | 'DIFFERENCE_HEATMAP';

export const TemporalComparisonViewer: React.FC<TemporalComparisonViewerProps> = ({
  isOpen,
  activeResult,
  onClose,
  onSelectChangeRegion,
  onFocusOnMap,
}) => {
  const [sliderPosition, setSliderPosition] = useState<number>(50); // percentage 0 - 100
  const [activeLayer, setActiveLayer] = useState<ImagerySpectralLayer>('OPTICAL_RGB');
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);
  const [isHoveringSlider, setIsHoveringSlider] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !activeResult) return null;

  const {
    category,
    regionName,
    country,
    siteCode,
    observationPeriod,
    metric,
    confidence,
    headline,
    evidenceNarrative,
    primaryDrivers,
    spatialEvidence = [],
    temporalComparison,
    agentTrace,
  } = activeResult;

  // Generate dynamic before/after satellite image textures based on the selected spectral layer
  const beforeType =
    activeLayer === 'FALSE_COLOR_NIR'
      ? 'FALSE_COLOR_BEFORE'
      : activeLayer === 'SAR_RADAR'
      ? 'SAR_RADAR'
      : 'OPTICAL_BEFORE';

  const afterType =
    activeLayer === 'FALSE_COLOR_NIR'
      ? 'FALSE_COLOR_AFTER'
      : activeLayer === 'DIFFERENCE_HEATMAP'
      ? 'DIFFERENCE_HEATMAP'
      : activeLayer === 'SAR_RADAR'
      ? 'SAR_RADAR'
      : 'OPTICAL_AFTER';

  const beforeImageUrl =
    temporalComparison?.beforeImageUrl ||
    SatelliteImageService.generateImageryDataUrl({
      category,
      regionName,
      type: beforeType,
      severity: metric.severity,
    });

  const afterImageUrl =
    temporalComparison?.afterImageUrl ||
    SatelliteImageService.generateImageryDataUrl({
      category,
      regionName,
      type: afterType,
      severity: metric.severity,
    });

  // Drag interaction handlers for the vertical comparison slider
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      const percentage = (x / rect.width) * 100;
      setSliderPosition(Math.max(5, Math.min(95, percentage)));
    },
    [isDragging]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isDragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const touch = e.touches[0];
      const x = Math.max(0, Math.min(touch.clientX - rect.left, rect.width));
      const percentage = (x / rect.width) * 100;
      setSliderPosition(Math.max(5, Math.min(95, percentage)));
    },
    [isDragging]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove]);

  // Default change regions if none specified
  const changeRegions: SpatialEvidenceItem[] =
    spatialEvidence.length > 0
      ? spatialEvidence
      : [
          {
            id: 'CR_01',
            type: 'CHANGE_REGION',
            label: `${category.replace(/_/g, ' ')} Main Sector`,
            category,
            confidence,
            changeStatus: metric.percentageChange < 0 ? 'REMOVED_DECREASED' : 'NEW_INCREASED',
            areaSqKm: activeResult.areaAffectedSqKm,
            coordinates: activeResult.polygon,
            description: activeResult.headline,
            metricDelta: `${metric.percentageChange > 0 ? '+' : ''}${metric.percentageChange}%`,
          },
          {
            id: 'CR_02',
            type: 'CHANGE_REGION',
            label: 'Stable Natural Buffer Perimeter',
            category,
            confidence: 0.96,
            changeStatus: 'UNCHANGED',
            areaSqKm: Math.round(activeResult.areaAffectedSqKm * 0.45),
            coordinates: [],
            description: 'Topographically sheltered buffer showing stable baseline radiometry.',
            metricDelta: '±0.8%',
          },
        ];

  const selectedRegion = changeRegions.find((r) => r.id === selectedRegionId) || changeRegions[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-200 select-none">
      <div
        className={`relative w-full ${
          isExpanded ? 'max-w-[98vw] h-[96vh]' : 'max-w-6xl h-[88vh]'
        } bg-[#08080c] border border-white/20 shadow-[0_0_90px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden transition-all duration-300`}
      >
        {/* Top Mission-Control Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/15 bg-black/60">
          <div className="flex items-center gap-3">
            <span className="p-1.5 bg-[#ff4e00]/20 text-[#ff4e00] border border-[#ff4e00]/40 text-[10px] font-mono-code font-bold uppercase">
              TEMPORAL COMPARISON
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <span>{regionName}</span>
                <span className="text-xs font-mono-code text-white/50">• {country}</span>
              </h2>
              <p className="text-[10px] font-mono-code text-[#3df2ff]">
                BASELINE: {observationPeriod.beforeDate} → TARGET: {observationPeriod.afterDate}
              </p>
            </div>
          </div>

          {/* Spectral Channel Toggles */}
          <div className="hidden md:flex items-center gap-1 bg-white/5 p-1 border border-white/10 text-[10px] font-mono-code">
            <button
              onClick={() => setActiveLayer('OPTICAL_RGB')}
              className={`px-3 py-1 uppercase font-bold transition-all ${
                activeLayer === 'OPTICAL_RGB'
                  ? 'bg-[#3df2ff] text-black shadow'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              Optical (RGB)
            </button>
            <button
              onClick={() => setActiveLayer('FALSE_COLOR_NIR')}
              className={`px-3 py-1 uppercase font-bold transition-all ${
                activeLayer === 'FALSE_COLOR_NIR'
                  ? 'bg-[#f43f5e] text-white shadow'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              False-Color NIR
            </button>
            <button
              onClick={() => setActiveLayer('SAR_RADAR')}
              className={`px-3 py-1 uppercase font-bold transition-all ${
                activeLayer === 'SAR_RADAR'
                  ? 'bg-[#0284c7] text-white shadow'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              Sentinel-1 SAR
            </button>
            <button
              onClick={() => setActiveLayer('DIFFERENCE_HEATMAP')}
              className={`px-3 py-1 uppercase font-bold transition-all ${
                activeLayer === 'DIFFERENCE_HEATMAP'
                  ? 'bg-[#ff4e00] text-black shadow'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              Diff Anomaly
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              title={isExpanded ? 'Restore View' : 'Expand Fullscreen'}
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

        {/* Main Central Layout: Split Comparison Image (Left/Center) + Evidence / Region Inspector (Right) */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
          {/* Draggable Vertical Split Viewer Container */}
          <div className="flex-1 flex flex-col bg-black relative overflow-hidden">
            {/* Split Canvas Frame */}
            <div
              ref={containerRef}
              className="flex-1 relative w-full h-full cursor-ew-resize select-none overflow-hidden"
              onMouseDown={handleMouseDown}
              onTouchStart={handleTouchStart}
            >
              {/* Layer 1: AFTER Image (Full background) */}
              <div className="absolute inset-0 w-full h-full">
                <img
                  src={afterImageUrl}
                  alt="Target Observation (After)"
                  className="w-full h-full object-cover pointer-events-none"
                />
                {/* After Epoch Floating Label (Top Right) */}
                <div className="absolute top-4 right-4 z-10 bg-black/80 backdrop-blur-md px-3 py-1.5 border border-[#ff4e00]/60 shadow-xl">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#ff4e00] animate-pulse"></span>
                    <span className="text-[10px] font-mono-code font-bold text-white uppercase tracking-wider">
                      AFTER • {observationPeriod.afterDate}
                    </span>
                  </div>
                  <p className="text-[9px] font-mono-code text-[#ff4e00] mt-0.5">
                    {metric.name.split(' ')[0]}: {metric.afterValue.toFixed(2)} ({metric.percentageChange > 0 ? '+' : ''}
                    {metric.percentageChange}%)
                  </p>
                </div>
              </div>

              {/* Layer 2: BEFORE Image (Clipped by draggable slider position) */}
              <div
                className="absolute inset-0 h-full overflow-hidden"
                style={{ width: `${sliderPosition}%` }}
              >
                <div
                  className="relative h-full"
                  style={{
                    width: containerRef.current ? `${containerRef.current.clientWidth}px` : '100%',
                    maxWidth: 'none',
                  }}
                >
                  <img
                    src={beforeImageUrl}
                    alt="Baseline Observation (Before)"
                    className="w-full h-full object-cover pointer-events-none"
                  />
                  {/* Before Epoch Floating Label (Top Left) */}
                  <div className="absolute top-4 left-4 z-10 bg-black/80 backdrop-blur-md px-3 py-1.5 border border-[#10b981]/60 shadow-xl">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#10b981]"></span>
                      <span className="text-[10px] font-mono-code font-bold text-white uppercase tracking-wider">
                        BEFORE • {observationPeriod.beforeDate}
                      </span>
                    </div>
                    <p className="text-[9px] font-mono-code text-[#10b981] mt-0.5">
                      Baseline {metric.name.split(' ')[0]}: {metric.beforeValue.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Vertical Draggable Divider Bar */}
              <div
                className="absolute top-0 bottom-0 z-20 w-1 bg-white cursor-ew-resize shadow-[0_0_15px_rgba(255,255,255,0.8)] flex items-center justify-center pointer-events-none"
                style={{ left: `${sliderPosition}%` }}
              >
                {/* Center Drag Handle Badge */}
                <div
                  className="w-9 h-9 rounded-full bg-black/95 border-2 border-white text-white flex items-center justify-center shadow-2xl pointer-events-auto"
                  onMouseEnter={() => setIsHoveringSlider(true)}
                  onMouseLeave={() => setIsHoveringSlider(false)}
                >
                  <SlidersHorizontal className="w-4 h-4 text-[#3df2ff] rotate-90" />
                </div>
              </div>

              {/* Bottom Instructions Banner */}
              <div className="absolute bottom-4 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
                <div className="bg-black/80 backdrop-blur-md px-3 py-1 border border-white/15 text-[9px] font-mono-code text-white/70 uppercase tracking-widest pointer-events-auto">
                  Drag slider horizontally to scrub temporal diff • {Math.round(sliderPosition)}% SPLIT
                </div>
                {onFocusOnMap && (
                  <button
                    onClick={() => {
                      onFocusOnMap();
                      onClose();
                    }}
                    className="bg-[#3df2ff] hover:bg-[#3df2ff]/80 text-black px-3.5 py-1.5 text-[10px] font-mono-code font-bold uppercase tracking-wider border border-[#3df2ff] shadow-xl flex items-center gap-1.5 pointer-events-auto transition-all active:scale-95"
                  >
                    <Compass className="w-3.5 h-3.5" />
                    <span>View on 3D Globe</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right Side Inspector & Change Region Breakdown */}
          <aside className="w-full lg:w-96 bg-[#0c0c10] border-t lg:border-t-0 lg:border-l border-white/15 p-5 flex flex-col justify-between overflow-y-auto space-y-5 shrink-0 select-none">
            <div className="space-y-4">
              {/* Header */}
              <div>
                <p className="text-[10px] tracking-[0.2em] text-white/40 uppercase font-bold">Change Breakdown</p>
                <h3 className="text-lg font-bold text-white tracking-tight mt-1 font-sans">
                  {headline}
                </h3>
              </div>

              {/* Metric Delta Stat Box */}
              <div className="p-3.5 bg-white/5 border border-white/10 space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-3xl font-black font-mono-code text-white">
                    {metric.percentageChange > 0 ? '+' : ''}
                    {metric.percentageChange}%
                  </span>
                  <span className="text-xs font-mono-code text-[#ff4e00] uppercase font-bold">
                    {metric.severity} IMPACT
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono-code border-t border-white/10 pt-2 text-white/70">
                  <div>
                    <span className="text-white/40 block">T0 BASELINE</span>
                    <span className="font-bold text-white">{metric.beforeValue.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-white/40 block">T1 TARGET</span>
                    <span className="font-bold text-[#ff4e00]">{metric.afterValue.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Change Regions / Features List */}
              <div className="space-y-2">
                <p className="text-[10px] font-mono-code text-white/50 uppercase font-bold tracking-wider">
                  Identified Change Regions
                </p>
                <div className="space-y-1.5">
                  {changeRegions.map((region) => {
                    const isSelected = region.id === selectedRegion.id;
                    return (
                      <div
                        key={region.id}
                        onClick={() => {
                          setSelectedRegionId(region.id);
                          if (onSelectChangeRegion) onSelectChangeRegion(region);
                        }}
                        className={`p-2.5 border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#3df2ff]/10 border-[#3df2ff] text-white shadow'
                            : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/70'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold font-sans">{region.label}</span>
                          <span
                            className={`text-[8px] font-mono-code px-1.5 py-0.5 uppercase font-bold border ${
                              region.changeStatus === 'NEW_INCREASED'
                                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                                : region.changeStatus === 'REMOVED_DECREASED'
                                ? 'bg-[#ff4e00]/20 text-[#ff4e00] border-[#ff4e00]/40'
                                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            }`}
                          >
                            {region.changeStatus === 'NEW_INCREASED'
                              ? 'INCREASED'
                              : region.changeStatus === 'REMOVED_DECREASED'
                              ? 'DECREASED'
                              : 'UNCHANGED'}
                          </span>
                        </div>
                        <p className="text-[10px] text-white/50 font-serif-editorial italic mt-1 leading-snug">
                          {region.description}
                        </p>
                        <div className="flex items-center justify-between text-[9px] font-mono-code text-white/40 mt-1.5 pt-1 border-t border-white/5">
                          <span>Footprint: {region.areaSqKm?.toLocaleString()} km²</span>
                          <span className="text-[#3df2ff]">Confidence: {Math.round(region.confidence * 100)}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* AI Inference vs Raw Evidence */}
              <div className="space-y-2 pt-2 border-t border-white/10">
                <p className="text-[10px] font-mono-code text-white/50 uppercase font-bold tracking-wider flex items-center gap-1.5">
                  <Bot className="w-3.5 h-3.5 text-[#3df2ff]" />
                  <span>AI Remote Sensing Inference</span>
                </p>
                <div className="p-3 bg-black/60 border border-white/10 space-y-2 text-xs">
                  <p className="text-white/80 font-serif-editorial italic text-xs leading-relaxed">
                    &ldquo;{activeResult.evidenceNarrative}&rdquo;
                  </p>
                  {primaryDrivers && primaryDrivers.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {primaryDrivers.map((d, i) => (
                        <span key={i} className="text-[9px] font-mono-code px-1.5 py-0.5 bg-white/10 text-white/70 border border-white/10">
                          {d}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-white/10">
              <button
                onClick={() => {
                  if (onFocusOnMap) onFocusOnMap();
                  onClose();
                }}
                className="w-full py-2.5 bg-[#ff4e00] hover:bg-[#ff4e00]/90 text-black font-mono-code text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                <Compass className="w-4 h-4" />
                <span>Locate on 3D Earth</span>
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};
