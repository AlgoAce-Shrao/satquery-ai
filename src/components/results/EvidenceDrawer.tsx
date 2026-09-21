/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AnalysisResult } from '../../types/geospatial';
import { getDataStatusBadge } from '../../lib/dataStatusLabels';
import { X, ExternalLink, Satellite, ShieldCheck, Database, Layers, Bot, Cpu, CheckCircle2 } from 'lucide-react';

interface EvidenceDrawerProps {
  isOpen: boolean;
  activeResult: AnalysisResult | null;
  onClose: () => void;
  onOpenEvidenceModal: () => void;
}

export const EvidenceDrawer: React.FC<EvidenceDrawerProps> = ({
  isOpen,
  activeResult,
  onClose,
  onOpenEvidenceModal,
}) => {
  if (!isOpen || !activeResult) return null;

  const {
    metric,
    headline,
    evidenceNarrative,
    satellite,
    sensor,
    modality,
    dataStatus,
    confidence,
    observationPeriod,
    siteCode,
    regionName,
    country,
    biome,
    areaAffectedSqKm,
    primaryDrivers,
    spectralBands,
    cloudCover,
    agentTrace,
  } = activeResult;

  const isPositive = metric.percentageChange > 0;

  return (
    <aside className="fixed top-12 bottom-8 right-0 w-full sm:w-[420px] lg:w-[460px] bg-black/90 backdrop-blur-2xl border-l border-white/15 p-6 z-40 overflow-y-auto shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col justify-between">
      <div className="space-y-5">
        {/* Header & Close Button */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <p className="text-[10px] tracking-[0.3em] text-white/40 uppercase font-bold">Spectral & AI Evidence</p>
            <p className="text-xs font-mono-code text-[#3df2ff] font-bold">
              {siteCode} • {country}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`text-[8px] font-mono-code px-2 py-0.5 uppercase font-bold border ${
                getDataStatusBadge(dataStatus).colorClass
              }`}
              title={getDataStatusBadge(dataStatus).longLabel}
            >
              {getDataStatusBadge(dataStatus).mediumLabel}
            </span>
            <button
              onClick={onClose}
              className="p-1.5 bg-white/10 hover:bg-white/20 border border-white/15 text-white/70 hover:text-white transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Region & Headline */}
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono-code px-2 py-0.5 bg-[#ff4e00]/20 text-[#ff4e00] border border-[#ff4e00]/30 uppercase font-bold tracking-wider">
              {metric.severity} SEVERITY
            </span>
            <span className="text-[9px] font-mono-code px-2 py-0.5 bg-white/10 text-white/80 border border-white/15 uppercase">
              {modality}
            </span>
          </div>
          <h3 className="text-xl font-bold text-white tracking-tight mt-2 font-sans">{regionName}</h3>
          <p className="text-xs text-white/60 font-serif-editorial italic mt-0.5">{biome}</p>
        </div>

        {/* Big Delta Box */}
        <div className="bg-white/5 border border-white/10 p-4 space-y-2">
          <div className="flex items-baseline justify-between">
            <span className="text-4xl font-black font-mono-code text-white">
              {isPositive ? '+' : ''}
              {metric.percentageChange}%
            </span>
            <span className="text-xs font-mono-code text-white/50">{metric.name.split(' ')[0]}</span>
          </div>
          <p className="text-xs text-[#ff4e00] font-serif-editorial italic leading-tight">&ldquo;{headline}&rdquo;</p>
          <p className="text-[10px] font-mono-code text-white/40">Area footprint: {areaAffectedSqKm.toLocaleString()} km²</p>
        </div>

        {/* Before / After Spectral Comparison */}
        <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-4 font-mono-code">
          <div className="space-y-1">
            <p className="text-[10px] text-white/40 uppercase tracking-wider">Before Baseline</p>
            <p className="text-2xl font-bold text-white">{metric.beforeValue.toFixed(2)}</p>
            <p className="text-[10px] text-white/40">{observationPeriod.beforeLabel}</p>
          </div>
          <div className="space-y-1 border-l border-white/10 pl-4">
            <p className="text-[10px] text-white/40 uppercase tracking-wider">Post-Event</p>
            <p className="text-2xl font-bold text-[#ff4e00]">{metric.afterValue.toFixed(2)}</p>
            <p className="text-[10px] text-white/40">{observationPeriod.afterLabel}</p>
          </div>
        </div>

        {/* Agent Execution Trace Section */}
        {agentTrace && (
          <div className="border-t border-white/10 pt-4 space-y-2 font-mono-code">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-white/40 uppercase font-bold flex items-center gap-1.5">
                <Bot className="w-3.5 h-3.5 text-[#3df2ff]" />
                <span>Agent Execution Trace</span>
              </span>
              <span className="text-[9px] text-[#3df2ff]">
                Confidence: {Math.round(agentTrace.confidence * 100)}%
              </span>
            </div>
            <div className="bg-white/5 p-3 border border-white/10 space-y-2 text-xs">
              <div className="flex justify-between text-[10px]">
                <span className="text-white/50">Task:</span>
                <span className="text-white font-bold">{agentTrace.task}</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-white/50">Specialist Agent:</span>
                <span className="text-[#3df2ff]">{agentTrace.agent}</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-white/50">Vision Models:</span>
                <span className="text-white/80">{agentTrace.models.join(', ')}</span>
              </div>
              <div className="space-y-1 pt-1 border-t border-white/5 text-[10px]">
                <span className="text-white/50">Tools Executed:</span>
                <div className="flex flex-wrap gap-1 mt-0.5">
                  {agentTrace.tools.map((tool, i) => (
                    <span key={i} className="px-1.5 py-0.5 bg-white/10 text-white/70 text-[9px] border border-white/10">
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
              {agentTrace.reasoning && (
                <p className="text-[10px] text-white/70 italic border-t border-white/5 pt-1.5 font-serif-editorial">
                  &ldquo;{agentTrace.reasoning}&rdquo;
                </p>
              )}
            </div>
          </div>
        )}

        {/* Spectral Band Reflectance Comparison */}
        {spectralBands && spectralBands.length > 0 && (
          <div className="space-y-3 border-t border-white/10 pt-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono-code text-white/50 uppercase tracking-widest">
                Band Reflectance Deltas
              </span>
              <button
                onClick={onOpenEvidenceModal}
                className="text-[9px] font-mono-code text-[#3df2ff] hover:underline flex items-center gap-1 uppercase"
              >
                <span>Full Chart</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </button>
            </div>

            <div className="space-y-2 font-mono-code text-xs">
              {spectralBands.slice(0, 4).map((band) => (
                <div key={band.band} className="space-y-1 bg-white/5 p-2 border border-white/5">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-white font-bold">{band.band} ({band.name})</span>
                    <span className="text-white/60">{band.wavelength}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px]">
                    <span className="text-white/50 w-10">B: {band.beforeReflectance.toFixed(3)}</span>
                    <div className="flex-1 bg-white/10 h-1.5 rounded-none overflow-hidden flex">
                      <div
                        className="bg-white/40 h-full"
                        style={{ width: `${Math.min(100, band.beforeReflectance * 180)}%` }}
                      ></div>
                    </div>
                    <span className="text-[#ff4e00] w-10">A: {band.afterReflectance.toFixed(3)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Evidence Narrative */}
        <div className="space-y-2 border-t border-white/10 pt-4">
          <p className="text-[10px] tracking-widest text-white/40 uppercase font-bold font-mono-code">Scientific Assessment</p>
          <p className="text-xs leading-relaxed text-white/80 font-serif-editorial italic">
            &ldquo;{evidenceNarrative}&rdquo;
          </p>
        </div>

        {/* Primary Drivers */}
        <div className="space-y-2 border-t border-white/10 pt-4">
          <p className="text-[10px] tracking-widest text-white/40 uppercase font-bold font-mono-code">Identified Drivers</p>
          <div className="flex flex-wrap gap-1.5">
            {primaryDrivers.map((driver, idx) => (
              <span
                key={idx}
                className="text-[10px] font-mono-code px-2 py-1 bg-white/10 border border-white/15 text-white/80"
              >
                {driver}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Sensor Calibration Provenance */}
      <div className="mt-6 pt-4 border-t border-white/10 font-mono-code text-[10px] text-white/40 flex items-center justify-between">
        <span>{satellite} • {sensor}</span>
        <span>Cloud: {cloudCover}%</span>
      </div>
    </aside>
  );
};
