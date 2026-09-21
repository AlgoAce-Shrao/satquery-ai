/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Observable 8-Stage Execution Pipeline Trace Component
 * Displays the transparent step-by-step reasoning, specialist tool selection,
 * spatial extraction, and result validation performed by the remote sensing agent.
 */

import React, { useState } from 'react';
import { AnalysisResult, ExecutionPipelineStage } from '../../types/geospatial';
import {
  Activity,
  CheckCircle2,
  Cpu,
  Database,
  Layers,
  Sparkles,
  Zap,
  ChevronDown,
  ChevronUp,
  Bot,
  Compass,
} from 'lucide-react';

interface ExecutionTracePipelineProps {
  activeResult: AnalysisResult | null;
}

export const ExecutionTracePipeline: React.FC<ExecutionTracePipelineProps> = ({
  activeResult,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!activeResult) return null;

  const {
    category,
    regionName,
    satellite,
    sensor,
    confidence,
    metric,
    agentTrace,
    executionPipeline,
  } = activeResult;

  // Honest fallback for results with no attached real trace (the catalog/demo query path):
  // this describes what actually happened — rule-based catalog lookup — not a fabricated
  // list of tools (GDAL/OpenCV/SentinelHub/etc.) that never ran for this result.
  const stages: ExecutionPipelineStage[] = executionPipeline || [
    {
      id: 'stg_1',
      stage: 'QUERY_RECEIVED',
      title: 'Query Matched Against Observation Catalog',
      description: `Keyword/rule-based matching against the pre-catalogued ${category} observation registry (no live model or raster processing).`,
      toolsUsed: ['Rule-based keyword matcher'],
      durationMs: 120,
    },
    {
      id: 'stg_2',
      stage: 'TASK_IDENTIFIED',
      title: 'Catalog Entry Selected',
      description: `Resolved to a pre-recorded ${category} entry for ${regionName}.`,
      durationMs: 90,
    },
    {
      id: 'stg_3',
      stage: 'INSIGHT_GENERATED',
      title: 'Stored Metrics Retrieved',
      description: `Retrieved pre-recorded ${metric.name} values (${metric.percentageChange > 0 ? '+' : ''}${metric.percentageChange}%) and ${satellite} (${sensor}) metadata from the catalog entry — not computed from live pixel data in this step.`,
      confidence,
      durationMs: 60,
    },
  ];

  return (
    <div className="bg-[#08080c] border border-white/15 p-4 space-y-3 font-mono-code text-xs select-none">
      {/* Header */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between cursor-pointer hover:text-white text-white/80 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-[#3df2ff]" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-white">
            Observable Execution Pipeline ({stages.length} Stages)
          </span>
        </div>
        <div className="flex items-center gap-2 text-white/50 text-[10px]">
          <span>{Math.round(confidence * 100)}% Confidence</span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </div>
      </div>

      {/* Progress Bar Ribbon */}
      <div className="grid gap-1 h-1.5 bg-white/5" style={{ gridTemplateColumns: `repeat(${stages.length}, minmax(0, 1fr))` }}>
        {stages.map((stg, idx) => (
          <div
            key={idx}
            className="h-full bg-[#3df2ff] shadow-[0_0_8px_rgba(61,242,255,0.8)] transition-all"
            title={`${idx + 1}. ${stg.stage}`}
          />
        ))}
      </div>

      {/* Expandable Stage Details */}
      {isExpanded && (
        <div className="space-y-2 pt-2 border-t border-white/10 max-h-72 overflow-y-auto pr-1">
          {stages.map((stg, index) => (
            <div
              key={stg.id}
              className="p-2 bg-white/5 border border-white/10 text-[10px] space-y-1"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-[#3df2ff]/20 text-[#3df2ff] border border-[#3df2ff]/40 flex items-center justify-center font-bold text-[9px]">
                    {index + 1}
                  </span>
                  <span className="text-white font-bold">{stg.title}</span>
                </div>
                {stg.durationMs && (
                  <span className="text-white/40">{stg.durationMs}ms</span>
                )}
              </div>
              <p className="text-white/70 font-sans pl-5 leading-snug">
                {stg.description}
              </p>
              {stg.toolsUsed && (
                <div className="flex flex-wrap gap-1 pl-5 pt-0.5">
                  {stg.toolsUsed.map((t, i) => (
                    <span
                      key={i}
                      className="text-[8px] px-1.5 py-0.2 bg-white/10 text-white/60 border border-white/10"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
