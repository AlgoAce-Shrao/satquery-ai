/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Analysis Panel (Mission-Control Right Sidebar)
 * Hosts detailed radiometric change metrics, visual evidence previews,
 * timeline scrubber, and observable execution pipeline trace.
 */

import React from 'react';
import { AnalysisResult } from '../../types/geospatial';
import { VisualizationMode } from '../globe/CesiumGlobeViewer';
import { VisualEvidencePanel } from './VisualEvidencePanel';
import { AnalysisTimeline } from './AnalysisTimeline';
import { ExecutionTracePipeline } from './ExecutionTracePipeline';
import {
  ExternalLink,
  Database,
  Activity,
  MapPin,
  BarChart3,
  ShieldCheck,
  SlidersHorizontal,
  Zap,
} from 'lucide-react';

interface AnalysisPanelProps {
  activeResult: AnalysisResult | null;
  visualizationMode?: VisualizationMode;
  onModeChange?: (mode: VisualizationMode) => void;
  onOpenEvidenceModal: () => void;
  onOpenTemporalComparison?: () => void;
  onOpenMultimodalViewer?: () => void;
}

export const AnalysisPanel: React.FC<AnalysisPanelProps> = ({
  activeResult,
  visualizationMode = 'DIFFERENCE',
  onModeChange,
  onOpenEvidenceModal,
  onOpenTemporalComparison,
  onOpenMultimodalViewer,
}) => {
  if (!activeResult) {
    return (
      <aside className="w-full lg:w-[340px] xl:w-[380px] bg-[#0a0a0c] border-l border-white/10 p-6 sm:p-8 flex flex-col justify-center items-center text-center select-none">
        <p className="text-xs font-mono-code text-white/40 uppercase tracking-widest">No Active Region Selected</p>
      </aside>
    );
  }

  const {
    metric,
    headline,
    evidenceNarrative,
    satellite,
    sensor,
    confidence,
    observationPeriod,
    location,
    siteCode,
    regionName,
    country,
    areaAffectedSqKm,
    primaryDrivers,
  } = activeResult;

  const isPositive = metric.percentageChange > 0;

  return (
    <aside className="w-full lg:w-[340px] xl:w-[380px] bg-[#0a0a0c] border-l border-white/10 p-5 sm:p-6 flex flex-col justify-between overflow-y-auto shrink-0 z-10 select-none space-y-6">
      <div className="space-y-6">
        {/* Top Header & Site ID */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <p className="text-[10px] tracking-[0.3em] text-white/40 uppercase font-bold">Current Insight</p>
            <p className="text-xs font-mono-code text-[#3df2ff] font-bold">{siteCode} • {country}</p>
          </div>
          <span className="text-[9px] font-mono-code px-2 py-0.5 bg-[#ff4e00]/15 text-[#ff4e00] border border-[#ff4e00]/30 uppercase font-bold tracking-wider">
            {metric.severity}
          </span>
        </div>

        {/* Big Typographic Impact Delta */}
        <div className="space-y-1.5">
          <div className="flex items-baseline gap-2">
            <h2 className="text-4xl sm:text-5xl font-black tracking-tighter text-white uppercase font-sans">
              {isPositive ? '+' : ''}
              {metric.percentageChange}
              <span className="text-2xl font-light text-white/70 ml-1">%</span>
            </h2>
          </div>
          <p className="text-sm sm:text-base text-[#ff4e00] font-bold italic font-serif-editorial leading-tight">
            {headline}
          </p>
          <p className="text-[11px] text-white/50 font-mono-code mt-1">
            {regionName} ({areaAffectedSqKm.toLocaleString()} km² affected)
          </p>
        </div>

        {/* Observation Timeline Scrubber */}
        {onModeChange && (
          <AnalysisTimeline
            activeResult={activeResult}
            currentMode={visualizationMode}
            onModeChange={onModeChange}
          />
        )}

        {/* Visual Evidence Satellite Thumbnail Panel */}
        <VisualEvidencePanel
          activeResult={activeResult}
          onOpenTemporalComparison={onOpenTemporalComparison || onOpenEvidenceModal}
          onOpenMultimodalViewer={onOpenMultimodalViewer || onOpenEvidenceModal}
          onOpenSpectralModal={onOpenEvidenceModal}
        />

        {/* Before / After Spectral Comparison Grid */}
        <div className="grid grid-cols-2 gap-3 border-t border-white/10 pt-4">
          <div className="space-y-1">
            <p className="text-[9px] text-white/40 uppercase font-mono-code tracking-wider">Before ({metric.name.split(' ')[0]})</p>
            <p className="text-2xl font-mono-code text-white font-bold">{metric.beforeValue.toFixed(2)}</p>
            <p className="text-[9px] text-white/40 font-mono-code">{observationPeriod.beforeLabel}</p>
          </div>
          <div className="space-y-1 border-l border-white/10 pl-3">
            <p className="text-[9px] text-white/40 uppercase font-mono-code tracking-wider">After ({metric.name.split(' ')[0]})</p>
            <p className="text-2xl font-mono-code text-[#ff4e00] font-bold">{metric.afterValue.toFixed(2)}</p>
            <p className="text-[9px] text-white/40 font-mono-code">{observationPeriod.afterLabel}</p>
          </div>
        </div>

        {/* Evidence Narrative */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[10px] tracking-widest text-white/40 uppercase font-bold">Evidence Narrative</p>
            <button
              onClick={onOpenEvidenceModal}
              className="text-[9px] font-mono-code text-[#3df2ff] hover:underline flex items-center gap-1 uppercase"
            >
              <span>Inspect Bands</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </button>
          </div>
          <p className="text-xs leading-relaxed text-white/70 font-serif-editorial italic">
            &ldquo;{evidenceNarrative}&rdquo;
          </p>
        </div>

        {/* Observable 8-Stage Pipeline */}
        <ExecutionTracePipeline activeResult={activeResult} />

        {/* Sensor Provenance */}
        <div className="space-y-2">
          <p className="text-[10px] tracking-widest text-white/40 uppercase font-bold">Sensor Provenance</p>
          <div className="flex justify-between items-center bg-white/5 p-3 border border-white/10 font-mono-code">
            <div className="flex items-center gap-2">
              <Database className="w-3.5 h-3.5 text-[#3df2ff]" />
              <span className="text-[11px] font-bold uppercase text-white">{satellite}</span>
            </div>
            <span className="text-[10px] text-[#3df2ff] font-bold">{Math.round(confidence * 100)}% Confidence</span>
          </div>
        </div>
      </div>

      {/* Bottom Telemetry Coordinates with Radar Pulse */}
      <div className="pt-4 border-t border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] text-white/40 uppercase font-mono-code tracking-wider">Telemetry</span>
            <span className="text-xs font-mono-code tracking-tighter text-white font-semibold">
              {Math.abs(location.lat).toFixed(2)}°{location.lat >= 0 ? 'N' : 'S'} / {Math.abs(location.lon).toFixed(2)}°{location.lon >= 0 ? 'E' : 'W'}
            </span>
          </div>
          <div className="w-10 h-10 border border-white/20 rounded-full flex items-center justify-center relative">
            <div className="w-1.5 h-1.5 bg-[#3df2ff] rounded-full"></div>
            <div className="absolute inset-0 border border-[#3df2ff]/40 rounded-full animate-ping"></div>
          </div>
        </div>
      </div>
    </aside>
  );
};
