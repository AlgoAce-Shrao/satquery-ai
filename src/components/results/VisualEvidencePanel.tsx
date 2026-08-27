/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Visual Evidence Panel
 * Displays high-resolution satellite imagery crops, detected radiometric indicators,
 * sensor provenance, and direct launches to temporal comparison and multimodal viewers.
 */

import React, { useState } from 'react';
import { AnalysisResult } from '../../types/geospatial';
import { SatelliteImageService } from '../../services/satelliteImageService';
import {
  Layers,
  SlidersHorizontal,
  Zap,
  ExternalLink,
  Bot,
  Sparkles,
  Database,
  Radio,
  CheckCircle2,
  AlertTriangle,
  ZoomIn,
} from 'lucide-react';

interface VisualEvidencePanelProps {
  activeResult: AnalysisResult;
  onOpenTemporalComparison: () => void;
  onOpenMultimodalViewer: () => void;
  onOpenSpectralModal: () => void;
}

export const VisualEvidencePanel: React.FC<VisualEvidencePanelProps> = ({
  activeResult,
  onOpenTemporalComparison,
  onOpenMultimodalViewer,
  onOpenSpectralModal,
}) => {
  const [activeThumbnailLayer, setActiveThumbnailLayer] = useState<'OPTICAL' | 'SAR' | 'DIFF'>('OPTICAL');

  const {
    category,
    regionName,
    country,
    satellite,
    sensor,
    confidence,
    metric,
    observationPeriod,
    headline,
    evidenceNarrative,
    primaryDrivers,
    spectralBands,
  } = activeResult;

  const imageUrl = SatelliteImageService.generateImageryDataUrl({
    category,
    regionName,
    type:
      activeThumbnailLayer === 'SAR'
        ? 'SAR_RADAR'
        : activeThumbnailLayer === 'DIFF'
        ? 'DIFFERENCE_HEATMAP'
        : 'OPTICAL_AFTER',
    severity: metric.severity,
  });

  return (
    <div className="bg-[#08080c] border border-white/15 p-4 space-y-3.5 select-none font-mono-code text-xs">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
        <div className="flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-[#3df2ff]" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-white">
            Visual Evidence & Sensors
          </span>
        </div>
        <span className="text-[9px] text-[#3df2ff] font-bold">
          {Math.round(confidence * 100)}% Confidence
        </span>
      </div>

      {/* Interactive Satellite Imagery Preview Crop */}
      <div className="relative w-full h-44 bg-black border border-white/10 overflow-hidden group">
        <img
          src={imageUrl}
          alt="Satellite Observation Preview"
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {/* Thumbnail Layer Switcher */}
        <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/85 backdrop-blur-md p-0.5 border border-white/15 text-[8px]">
          <button
            onClick={() => setActiveThumbnailLayer('OPTICAL')}
            className={`px-1.5 py-0.5 uppercase ${
              activeThumbnailLayer === 'OPTICAL'
                ? 'bg-[#3df2ff] text-black font-bold'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Optical
          </button>
          <button
            onClick={() => setActiveThumbnailLayer('SAR')}
            className={`px-1.5 py-0.5 uppercase ${
              activeThumbnailLayer === 'SAR'
                ? 'bg-[#0284c7] text-white font-bold'
                : 'text-white/60 hover:text-white'
            }`}
          >
            SAR
          </button>
          <button
            onClick={() => setActiveThumbnailLayer('DIFF')}
            className={`px-1.5 py-0.5 uppercase ${
              activeThumbnailLayer === 'DIFF'
                ? 'bg-[#ff4e00] text-black font-bold'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Diff
          </button>
        </div>

        {/* Floating Quick Action Overlay */}
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between pointer-events-none">
          <span className="bg-black/80 backdrop-blur-md px-2 py-0.5 border border-white/10 text-[8px] text-white/80">
            {satellite} ({sensor})
          </span>
          <button
            onClick={onOpenTemporalComparison}
            className="bg-[#ff4e00] hover:bg-[#ff4e00]/90 text-black px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider border border-[#ff4e00] pointer-events-auto flex items-center gap-1 shadow"
          >
            <SlidersHorizontal className="w-2.5 h-2.5" />
            <span>Interactive Split</span>
          </button>
        </div>
      </div>

      {/* Observed Spatial Indicators */}
      {primaryDrivers && primaryDrivers.length > 0 && (
        <div className="space-y-1.5">
          <span className="text-[9px] text-white/40 uppercase tracking-wider block font-bold">
            Key Remote Sensing Indicators
          </span>
          <div className="space-y-1 text-[10px]">
            {primaryDrivers.map((driver, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 p-1.5 bg-white/5 border border-white/10 text-white/80"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-[#3df2ff]"></div>
                <span>{driver}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Multi-Tool Deep Dive Launchers */}
      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/10 text-[9px]">
        <button
          onClick={onOpenMultimodalViewer}
          className="p-2 bg-white/5 hover:bg-white/10 border border-white/15 text-white/90 hover:text-white flex items-center justify-center gap-1.5 font-bold uppercase transition-colors"
        >
          <Zap className="w-3 h-3 text-[#3df2ff]" />
          <span>Multimodal SAR</span>
        </button>
        <button
          onClick={onOpenSpectralModal}
          className="p-2 bg-white/5 hover:bg-white/10 border border-white/15 text-white/90 hover:text-white flex items-center justify-center gap-1.5 font-bold uppercase transition-colors"
        >
          <ExternalLink className="w-3 h-3 text-[#ff4e00]" />
          <span>Spectral Bands</span>
        </button>
      </div>
    </div>
  );
};
