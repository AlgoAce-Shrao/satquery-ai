/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Analysis Timeline Scrubber
 * Allows the analyst to step through baseline (T0), intermediate passes, and target (T1) epochs,
 * synchronizing the 3D globe visualization layer.
 */

import React from 'react';
import { AnalysisResult } from '../../types/geospatial';
import { VisualizationMode } from '../globe/CesiumGlobeViewer';
import { Calendar, Clock, Play, ArrowRight } from 'lucide-react';

interface AnalysisTimelineProps {
  activeResult: AnalysisResult | null;
  currentMode: VisualizationMode;
  onModeChange: (mode: VisualizationMode) => void;
}

export const AnalysisTimeline: React.FC<AnalysisTimelineProps> = ({
  activeResult,
  currentMode,
  onModeChange,
}) => {
  if (!activeResult) return null;

  const { observationPeriod, metric } = activeResult;

  const epochs = [
    {
      id: 'BEFORE' as VisualizationMode,
      label: 'Baseline (T0)',
      date: observationPeriod.beforeDate,
      desc: observationPeriod.beforeLabel,
      color: '#10b981',
    },
    {
      id: 'DIFFERENCE' as VisualizationMode,
      label: 'Radiometric Delta',
      date: 'Bi-Temporal Diff',
      desc: `${metric.percentageChange > 0 ? '+' : ''}${metric.percentageChange}% Anomaly`,
      color: '#ff4e00',
    },
    {
      id: 'AFTER' as VisualizationMode,
      label: 'Target Epoch (T1)',
      date: observationPeriod.afterDate,
      desc: observationPeriod.afterLabel,
      color: '#d97706',
    },
  ];

  return (
    <div className="bg-[#08080c] border border-white/15 p-3 font-mono-code text-xs select-none space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-white/50 text-[10px] uppercase tracking-wider font-bold">
          <Clock className="w-3 h-3 text-[#3df2ff]" />
          <span>Observation Timeline</span>
        </div>
        <span className="text-[9px] text-[#3df2ff]">
          Active: {currentMode}
        </span>
      </div>

      {/* Timeline Steps Grid */}
      <div className="grid grid-cols-3 gap-1.5">
        {epochs.map((epoch) => {
          const isActive = currentMode === epoch.id;
          return (
            <button
              key={epoch.id}
              onClick={() => onModeChange(epoch.id)}
              className={`p-2 text-left border transition-all ${
                isActive
                  ? 'bg-white/10 border-[#3df2ff] shadow-[0_0_12px_rgba(61,242,255,0.25)]'
                  : 'bg-white/5 hover:bg-white/10 border-white/10 opacity-70 hover:opacity-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className="text-[9px] font-bold uppercase"
                  style={{ color: epoch.color }}
                >
                  {epoch.label}
                </span>
                {isActive && <div className="w-1.5 h-1.5 rounded-full bg-[#3df2ff] animate-ping" />}
              </div>
              <p className="text-[10px] font-bold text-white mt-0.5 truncate">{epoch.date}</p>
              <p className="text-[8px] text-white/40 truncate">{epoch.desc}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
