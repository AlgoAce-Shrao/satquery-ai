/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AnalysisResult } from '../../types/geospatial';
import { getDataStatusBadge } from '../../lib/dataStatusLabels';
import {
  ChevronLeft,
  ChevronRight,
  X,
  ExternalLink,
  Satellite,
  ShieldCheck,
  Bot,
  Activity,
} from 'lucide-react';

interface SpatialResultHUDProps {
  activeResult: AnalysisResult;
  currentIndex: number;
  totalCount: number;
  onOpenEvidence: () => void;
  onOpenTemporalComparison?: () => void;
  onOpenMultimodalViewer?: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  onClose?: () => void;
}

export const SpatialResultHUD: React.FC<SpatialResultHUDProps> = ({
  activeResult,
  currentIndex,
  totalCount,
  onOpenEvidence,
  onOpenTemporalComparison,
  onOpenMultimodalViewer,
  onPrevious,
  onNext,
  onClose,
}) => {
  const {
    regionName,
    country,
    biome,
    category,
    metric,
    confidence,
    satellite,
    sensor,
    modality,
    dataStatus,
    observationPeriod,
    primaryDrivers,
    siteCode,
    location,
    agentTrace,
  } = activeResult;

  const isPositive = metric.percentageChange > 0;
  const latStr = `${Math.abs(location.lat).toFixed(2)}°${location.lat >= 0 ? 'N' : 'S'}`;
  const lonStr = `${Math.abs(location.lon).toFixed(2)}°${location.lon >= 0 ? 'E' : 'W'}`;

  // Sparkline data calculation
  const sparkPoints = [
    { label: 'T0', val: metric.beforeValue },
    { label: 'T1', val: metric.beforeValue * 0.94 },
    { label: 'T2', val: metric.beforeValue * 0.86 },
    { label: 'T3', val: metric.beforeValue * 0.80 },
    { label: 'T4', val: metric.beforeValue * 0.74 },
    { label: 'T5', val: metric.afterValue },
  ];

  const minVal = Math.min(metric.beforeValue, metric.afterValue) * 0.8;
  const maxVal = Math.max(metric.beforeValue, metric.afterValue) * 1.2 || 1.0;
  const getSvgY = (v: number) => {
    const range = maxVal - minVal || 1;
    return 38 - ((v - minVal) / range) * 32;
  };

  const pathD = sparkPoints
    .map((pt, i) => {
      const x = 10 + i * 36;
      const y = getSvgY(pt.val);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  return (
    <div className="absolute top-16 sm:top-20 left-6 z-20 w-80 sm:w-96 bg-black/85 backdrop-blur-xl border border-white/15 p-4 sm:p-5 shadow-2xl animate-in fade-in slide-in-from-left duration-300 select-none">
      {/* Top Header Controls Bar */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2.5 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono-code font-bold text-white/80 uppercase tracking-widest">
            RESULT {currentIndex + 1} OF {totalCount}
          </span>
          {onPrevious && onNext && (
            <div className="flex items-center gap-1 ml-1">
              <button
                onClick={onPrevious}
                className="p-1 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                title="Previous Result"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onNext}
                className="p-1 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                title="Next Result"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {/* Data Status Badge */}
          <span
            className={`text-[8px] font-mono-code px-1.5 py-0.5 uppercase font-bold tracking-wider border ${
              getDataStatusBadge(dataStatus).colorClass
            }`}
            title={getDataStatusBadge(dataStatus).longLabel}
          >
            {getDataStatusBadge(dataStatus).shortLabel}
          </span>

          {/* Severity Badge */}
          <span
            className={`text-[8px] font-mono-code px-1.5 py-0.5 uppercase font-bold tracking-wider border ${
              metric.severity === 'CRITICAL'
                ? 'bg-[#ff4e00]/20 text-[#ff4e00] border-[#ff4e00]/50'
                : metric.severity === 'HIGH'
                ? 'bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/50'
                : 'bg-white/10 text-white/80 border-white/20'
            }`}
          >
            {metric.severity}
          </span>

          {onClose && (
            <button
              onClick={onClose}
              className="text-white/40 hover:text-white transition-colors p-0.5 ml-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Region Title, Category & Coordinates */}
      <div className="space-y-1 mb-3">
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-mono-code text-[#3df2ff] font-bold uppercase tracking-wider">
            {category.replace(/_/g, ' ')}
          </span>
          <span className="text-[9px] font-mono-code text-white/40">
            {modality} • {satellite}
          </span>
        </div>
        <h3 className="text-lg font-bold text-white tracking-tight font-sans leading-tight">
          {regionName}, {country}
        </h3>
        <p className="text-[10px] text-white/50 font-mono-code">
          {latStr}, {lonStr}
        </p>
      </div>

      {/* Big Metric Delta & Baseline */}
      <div className="bg-white/5 border border-white/10 p-3 mb-3">
        <div className="flex items-baseline justify-between">
          <div>
            <p className="text-[9px] font-mono-code text-white/50 uppercase tracking-widest">
              {metric.name}
            </p>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span
                className={`text-3xl sm:text-4xl font-black font-mono-code tracking-tighter ${
                  isPositive ? 'text-[#22c55e]' : 'text-[#ff4e00]'
                }`}
              >
                {isPositive ? '+' : ''}
                {metric.percentageChange}%
              </span>
            </div>
          </div>

          <div className="text-right">
            <p className="text-[9px] font-mono-code text-white/40 uppercase">Baseline → Target</p>
            <p className="text-sm font-mono-code font-bold text-white mt-0.5">
              {metric.beforeValue.toFixed(2)}{' '}
              <span className="text-white/40 font-normal">→</span>{' '}
              <span className={isPositive ? 'text-[#22c55e]' : 'text-[#ff4e00]'}>
                {metric.afterValue.toFixed(2)}
              </span>
            </p>
          </div>
        </div>

        {/* Mini Sparkline Timeline Trend SVG */}
        <div className="mt-2.5 pt-2 border-t border-white/10">
          <div className="flex items-center justify-between text-[8px] font-mono-code text-white/40 mb-1">
            <span>{observationPeriod.beforeDate}</span>
            <span>SPECTRAL DELTA CURVE</span>
            <span>{observationPeriod.afterDate}</span>
          </div>
          <svg viewBox="0 0 200 42" className="w-full h-9 overflow-visible">
            <defs>
              <linearGradient id="metricGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ff4e00" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#ff4e00" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            <line x1="0" y1="20" x2="200" y2="20" stroke="rgba(255,255,255,0.08)" strokeDasharray="2,2" />
            <path d={pathD} fill="none" stroke="#ff4e00" strokeWidth="2" strokeLinecap="round" />
            {sparkPoints.map((pt, i) => (
              <circle
                key={i}
                cx={10 + i * 36}
                cy={getSvgY(pt.val)}
                r="2.5"
                fill="#ffffff"
                stroke="#ff4e00"
                strokeWidth="1.5"
              />
            ))}
          </svg>
        </div>
      </div>

      {/* Detailed Metadata Grid */}
      <div className="space-y-1.5 mb-3 text-[10px] font-mono-code bg-black/40 p-2.5 border border-white/10">
        <div className="flex justify-between">
          <span className="text-white/40 uppercase">Date Range</span>
          <span className="text-white/90">
            {observationPeriod.beforeDate} → {observationPeriod.afterDate}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/40 uppercase">Sensor & Platform</span>
          <span className="text-white/90">{sensor.length > 24 ? sensor.slice(0, 24) + '…' : sensor}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/40 uppercase">Model Confidence</span>
          <span className="text-[#3df2ff] font-bold">{Math.round(confidence * 100)}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/40 uppercase">Land Cover</span>
          <span className="text-white/90">{biome}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/40 uppercase">Primary Driver</span>
          <span className="text-[#ff4e00] font-bold">{primaryDrivers[0]}</span>
        </div>
      </div>

      {/* Agent Trace Preview if available */}
      {agentTrace && (
        <div className="mb-3 p-2 bg-white/5 border border-white/10 font-mono-code text-[9px]">
          <div className="flex items-center justify-between text-white/50 mb-1">
            <span className="flex items-center gap-1 text-[#3df2ff]">
              <Bot className="w-2.5 h-2.5" />
              <span>AGENT TRACE</span>
            </span>
            <span>{agentTrace.agent}</span>
          </div>
          <p className="text-white/80 line-clamp-1">
            Models: {agentTrace.models.join(', ')}
          </p>
        </div>
      )}

      {/* Action Footer: View Evidence & Interactive Comparison */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <button
          onClick={onOpenEvidence}
          className="py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-mono-code text-[11px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 active:scale-95"
        >
          <span>Evidence</span>
          <ExternalLink className="w-3 h-3 text-[#3df2ff]" />
        </button>

        <button
          onClick={onOpenTemporalComparison || onOpenEvidence}
          className="py-2 bg-[#ff4e00] hover:bg-[#ff4e00]/90 text-black font-mono-code text-[11px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 active:scale-95 shadow-[0_0_15px_rgba(255,78,0,0.4)]"
        >
          <span>Split Diff</span>
          <Satellite className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
