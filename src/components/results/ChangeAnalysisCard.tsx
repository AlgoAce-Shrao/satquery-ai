/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Reusable Change Analysis Result Card
 * Formats structured change detections with explicit distinction between
 * Raw Evidence, AI Inferences, and Temporal Metadata, with direct 3D Globe camera synchronization.
 */

import React from 'react';
import { AnalysisResult } from '../../types/geospatial';
import {
  TrendingUp,
  TrendingDown,
  Compass,
  Layers,
  Sparkles,
  Bot,
  Calendar,
  Eye,
  SlidersHorizontal,
  Zap,
} from 'lucide-react';

interface ChangeAnalysisCardProps {
  result: AnalysisResult;
  onViewOnMap: (result: AnalysisResult) => void;
  onOpenComparison: (result: AnalysisResult) => void;
  onOpenMultimodal?: (result: AnalysisResult) => void;
  isSelected?: boolean;
}

export const ChangeAnalysisCard: React.FC<ChangeAnalysisCardProps> = ({
  result,
  onViewOnMap,
  onOpenComparison,
  onOpenMultimodal,
  isSelected = false,
}) => {
  const {
    siteCode,
    regionName,
    country,
    category,
    metric,
    confidence,
    observationPeriod,
    headline,
    evidenceNarrative,
    areaAffectedSqKm,
    primaryDrivers,
    modality,
    agentTrace,
  } = result;

  const isPositive = metric.percentageChange > 0;
  const isIncrease = metric.percentageChange > 0;

  let changeStatusLabel = isIncrease ? 'Increased' : 'Decreased';
  if (category === 'WILDFIRE') changeStatusLabel = 'Burned / Charred';
  if (category === 'FLOOD') changeStatusLabel = 'Inundated';

  return (
    <div
      className={`p-4 border transition-all select-none space-y-3 ${
        isSelected
          ? 'bg-[#0f1118] border-[#3df2ff] shadow-[0_0_25px_rgba(61,242,255,0.2)]'
          : 'bg-[#08080c]/90 hover:bg-[#0c0d14] border-white/15 hover:border-white/30'
      }`}
    >
      {/* Top Tag & Status Headline */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="p-1 bg-[#ff4e00]/20 text-[#ff4e00] border border-[#ff4e00]/40 text-[9px] font-mono-code font-bold uppercase">
            CHANGE DETECTED
          </span>
          <span className="text-[10px] font-mono-code text-white/50 font-bold">{siteCode}</span>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`text-[9px] font-mono-code px-2 py-0.5 uppercase font-bold border ${
              isIncrease
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                : 'bg-[#ff4e00]/20 text-[#ff4e00] border-[#ff4e00]/40'
            }`}
          >
            {changeStatusLabel}
          </span>
          <span className="text-[9px] font-mono-code text-[#3df2ff] font-bold">
            {Math.round(confidence * 100)}% Conf
          </span>
        </div>
      </div>

      {/* Feature & Time Range Grid */}
      <div className="grid grid-cols-2 gap-3 text-xs font-mono-code pt-0.5">
        <div>
          <span className="text-[9px] text-white/40 uppercase block">Feature</span>
          <span className="text-white font-bold font-sans text-xs">{category.replace(/_/g, ' ')}</span>
        </div>
        <div>
          <span className="text-[9px] text-white/40 uppercase block">Temporal Range</span>
          <span className="text-[#3df2ff] font-bold text-[10px]">
            {observationPeriod.beforeDate.slice(0, 7)} → {observationPeriod.afterDate.slice(0, 7)}
          </span>
        </div>
      </div>

      {/* Primary Change Headline */}
      <div className="space-y-1">
        <h4 className="text-sm font-bold text-white tracking-tight font-sans flex items-center gap-1.5">
          {isPositive ? (
            <TrendingUp className="w-4 h-4 text-cyan-400 shrink-0" />
          ) : (
            <TrendingDown className="w-4 h-4 text-[#ff4e00] shrink-0" />
          )}
          <span>{regionName} ({metric.percentageChange > 0 ? '+' : ''}{metric.percentageChange}%)</span>
        </h4>
        <p className="text-[11px] text-white/50 font-serif-editorial italic">
          Estimated affected area: <strong className="text-white/80 font-mono-code">{areaAffectedSqKm.toLocaleString()} km²</strong>
        </p>
      </div>

      {/* AI Inference Layer */}
      <div className="bg-white/5 p-2.5 border border-white/10 space-y-1">
        <div className="flex items-center gap-1 text-[9px] font-mono-code text-[#3df2ff] font-bold uppercase">
          <Bot className="w-3 h-3" />
          <span>AI Inference</span>
        </div>
        <p className="text-[11px] text-white/80 font-serif-editorial italic leading-relaxed">
          &ldquo;{evidenceNarrative}&rdquo;
        </p>
      </div>

      {/* Raw Evidence Indicators */}
      {primaryDrivers && primaryDrivers.length > 0 && (
        <div className="space-y-1">
          <span className="text-[9px] font-mono-code text-white/40 uppercase tracking-wider block">
            Observed Indicators
          </span>
          <div className="flex flex-wrap gap-1">
            {primaryDrivers.map((driver, i) => (
              <span
                key={i}
                className="text-[9px] font-mono-code px-1.5 py-0.5 bg-white/5 text-white/70 border border-white/10"
              >
                • {driver}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons: [ View on Map ] + [ Before/After Comparison ] */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10 font-mono-code text-[10px]">
        <button
          onClick={() => onViewOnMap(result)}
          className="py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all active:scale-95"
        >
          <Compass className="w-3.5 h-3.5 text-[#3df2ff]" />
          <span>View on Map</span>
        </button>

        <button
          onClick={() => onOpenComparison(result)}
          className="py-2 bg-[#ff4e00] hover:bg-[#ff4e00]/90 text-black font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Compare Split</span>
        </button>
      </div>
    </div>
  );
};
