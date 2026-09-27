/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Search, Sparkles, Send, ArrowRight, MapPin, Calendar, Layers, CheckCircle2 } from 'lucide-react';

interface SolutionSectionProps {
  onLaunchWithQuery?: (query: string) => void;
  onLaunchApp: () => void;
}

export const SolutionSection: React.FC<SolutionSectionProps> = ({
  onLaunchWithQuery,
  onLaunchApp,
}) => {
  const [queryInput, setQueryInput] = useState(
    'Find the 10 regions that experienced the largest decrease in vegetation over the last year and rank them by severity.'
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onLaunchWithQuery) {
      onLaunchWithQuery(queryInput);
    } else {
      onLaunchApp();
    }
  };

  const benchmarkQueries = [
    'Find the 10 regions that experienced the largest decrease in vegetation over the last year',
    'Show flood-affected regions and delineate inundation zones using SAR radar',
    'Compare urban expansion from 2022 to 2026',
    'Find regions where surface water bodies decreased',
    'Detect new infrastructure and transportation changes',
  ];

  const pipelineStages = [
    { title: 'UNDERSTAND', desc: 'Extract spatiotemporal intent & band indices' },
    { title: 'FIND DATA', desc: 'Discover Sentinel-1/2 & Landsat rasters' },
    { title: 'ANALYZE', desc: 'Compute bi-temporal difference matrices' },
    { title: 'VALIDATE', desc: 'Cross-constellation confidence verification' },
    { title: 'ANSWER', desc: 'Deliver grounded visual evidence & metrics' },
  ];

  return (
    <section className="relative py-28 sm:py-36 px-6 sm:px-12 lg:px-20 text-sq-text z-10 border-t border-white/10 bg-gradient-to-b from-black/20 via-sq-base/80 to-black/30 backdrop-blur-[2px]">
      <div className="max-w-5xl mx-auto space-y-12">
        {/* Subtitle & Title */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-sq-surface border border-white/10 text-sq-secondary text-[10px] font-mono-code rounded-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-sq-amber" />
            <span className="uppercase tracking-[0.18em] text-sq-amber font-medium">
              Natural Language Geospatial Query
            </span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold uppercase tracking-tight text-sq-text font-sans">
            What if you could <span className="text-sq-amber">Just Ask?</span>
          </h2>
          <p className="text-sm sm:text-base text-sq-secondary font-sans max-w-xl mx-auto leading-relaxed font-light">
            Ask any Earth-observation question in plain language. SatQuery translates your prompt into verifiable multi-sensor analysis workflows.
          </p>
        </div>

        {/* Natural Language Query Bar */}
        <div className="max-w-3xl mx-auto space-y-4">
          <form
            onSubmit={handleSubmit}
            className="relative flex items-center bg-[#0d0f0b] border border-white/20 hover:border-sq-amber/60 focus-within:border-sq-amber rounded-sm p-2 transition-all shadow-md"
          >
            <div className="pl-3 pr-2 text-sq-amber">
              <Search className="w-4.5 h-4.5" />
            </div>
            <input
              type="text"
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              placeholder="Ask any question about Earth observation..."
              className="w-full bg-transparent px-2 py-2.5 text-sm sm:text-base text-sq-text placeholder-sq-secondary/50 font-sans focus:outline-none"
            />
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#171b12] hover:bg-sq-amber border border-sq-amber/50 text-sq-text hover:text-black font-sans text-xs font-semibold uppercase tracking-wider rounded-xs transition-all flex items-center gap-2 cursor-pointer shrink-0"
            >
              <span>INVESTIGATE</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Real-Time Parsed Semantic Intent Tags */}
          <div className="flex flex-wrap items-center gap-2 font-mono-code text-[11px] px-1">
            <span className="text-sq-secondary uppercase tracking-wider text-[10px]">Parsed Parameters:</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-xs bg-sq-accent/10 border border-sq-accent/30 text-sq-accent">
              <Layers className="w-3 h-3" />
              <span>Index: NDVI Delta</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-xs bg-sq-amber/10 border border-sq-amber/30 text-sq-amber">
              <Calendar className="w-3 h-3" />
              <span>Temporal: 12-Month Baseline</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-xs bg-[#B8A06A]/10 border border-[#B8A06A]/30 text-[#B8A06A]">
              <MapPin className="w-3 h-3" />
              <span>Target: Global Ranked Top 10</span>
            </span>
          </div>

          {/* Benchmark Query Chips */}
          <div className="pt-4 space-y-2">
            <div className="font-mono-code text-[10px] text-sq-secondary uppercase tracking-wider text-center">
              Sample Remote-Sensing Inquiries:
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 font-mono-code text-xs">
              {benchmarkQueries.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setQueryInput(q)}
                  className="px-3 py-1.5 bg-white/[0.02] hover:bg-white/[0.06] border border-white/10 hover:border-sq-amber/40 text-sq-secondary hover:text-sq-text text-[11px] rounded-xs transition-all cursor-pointer text-left"
                >
                  "{q.length > 55 ? q.slice(0, 52) + '...' : q}"
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 5-Stage System Execution Pipeline */}
        <div className="pt-6 border-t border-white/10">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {pipelineStages.map((stage, idx) => (
              <div
                key={idx}
                className="p-3 bg-[#0c0e0a]/80 border border-white/10 rounded-xs space-y-1 font-mono-code"
              >
                <div className="flex items-center justify-between text-[10px] text-sq-amber font-semibold">
                  <span>0{idx + 1}. {stage.title}</span>
                  <CheckCircle2 className="w-3 h-3 text-sq-accent" />
                </div>
                <p className="text-[10px] text-sq-secondary font-sans leading-tight">
                  {stage.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
