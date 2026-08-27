/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Layers,
  Terminal,
  Cpu,
  Globe2,
  Scan,
  Sparkles,
  ArrowRight,
  Database,
  CheckCircle2,
  AlertTriangle,
  ArrowDown,
  Search,
} from 'lucide-react';

interface ProblemSolutionStoryProps {
  onLaunchWithQuery?: (query: string) => void;
  onLaunchApp: () => void;
}

export const ProblemSolutionStory: React.FC<ProblemSolutionStoryProps> = ({
  onLaunchWithQuery,
  onLaunchApp,
}) => {
  const [activeTab, setActiveTab] = useState<'PROBLEM' | 'SOLUTION'>('SOLUTION');
  const [queryInput, setQueryInput] = useState('Show me regions in the Amazon where vegetation decreased over the last 12 months');

  const handleQuerySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onLaunchWithQuery) {
      onLaunchWithQuery(queryInput);
    } else {
      onLaunchApp();
    }
  };

  const sampleQueries = [
    'Detect forest canopy loss in Mato Grosso since 2024',
    'Assess flood inundation in Assam Valley using SAR radar',
    'Analyze urban expansion in Dubai coastal developments',
  ];

  return (
    <div className="relative bg-[#080b11] text-white py-24 sm:py-32 px-6 sm:px-12 lg:px-20 border-t border-white/10 z-10">
      <div className="max-w-6xl mx-auto space-y-24">
        {/* Section Header */}
        <div className="space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/[0.04] border border-white/10 text-[#3df2ff] text-[11px] font-mono-code uppercase tracking-widest font-bold">
            <span>NASA-Grade Geospatial AI</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white font-sans">
            Earth Observation Has A Usability Bottleneck
          </h2>
          <p className="text-base sm:text-lg text-white/70 font-sans leading-relaxed">
            Every day, orbital sensors collect terabytes of multispectral data. But turning raw pixels into actionable planetary decisions remains locked behind steep technical barriers.
          </p>
        </div>

        {/* ============================================================ */}
        {/* THE PROBLEM vs THE SOLUTION (Side-by-Side Architectural Contrast) */}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Legacy Remote Sensing Pipeline */}
          <div className="bg-white/[0.02] border border-white/10 p-8 space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-mono-code text-[11px] text-[#ff4e00] uppercase font-bold tracking-widest flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  The Legacy Pipeline
                </span>
                <span className="font-mono-code text-[10px] text-white/40">Hours to Weeks</span>
              </div>

              <h3 className="text-2xl font-bold uppercase text-white font-sans">
                Fragmented GIS Workflows
              </h3>

              <p className="text-sm text-white/60 font-sans leading-relaxed">
                Analysts must manually discover tiles, download gigabytes of raw GeoTIFF/NetCDF rasters, calibrate radiometric bands, calibrate atmospheric interference, and write custom scripts.
              </p>
            </div>

            <div className="space-y-3 font-mono-code text-xs text-white/70 border-t border-white/10 pt-6">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded bg-white/5 border border-white/10 flex items-center justify-center text-white/40">1</span>
                <span>Manual Scene Search across separate portals</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded bg-white/5 border border-white/10 flex items-center justify-center text-white/40">2</span>
                <span>Gigabyte raster downloads and reprojection</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded bg-white/5 border border-white/10 flex items-center justify-center text-white/40">3</span>
                <span>Manual band algebra (NDVI, NDWI, SAR ratios)</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded bg-white/5 border border-white/10 flex items-center justify-center text-white/40">4</span>
                <span>Fragmented, slow stakeholder reporting</span>
              </div>
            </div>
          </div>

          {/* SatQuery AI Orchestrated Pipeline */}
          <div className="bg-[#0b1726]/80 border border-[#3df2ff]/40 p-8 space-y-6 flex flex-col justify-between relative shadow-[0_0_40px_rgba(61,242,255,0.06)]">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-mono-code text-[11px] text-[#3df2ff] uppercase font-bold tracking-widest flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  The SatQuery Solution
                </span>
                <span className="font-mono-code text-[10px] text-[#10b981] font-bold">Sub-Second Execution</span>
              </div>

              <h3 className="text-2xl font-bold uppercase text-white font-sans">
                Natural Language to Spatial Answers
              </h3>

              <p className="text-sm text-white/70 font-sans leading-relaxed">
                Ask questions naturally. An orchestrated multi-agent system parses intent, queries global satellite catalog indexes, executes server-side raster math, and renders findings directly onto a 3D Earth globe.
              </p>
            </div>

            <div className="space-y-3 font-mono-code text-xs text-white/90 border-t border-[#3df2ff]/20 pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#3df2ff] shrink-0" />
                <span>Plain-language query decomposition (Gemini 2.5)</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#3df2ff] shrink-0" />
                <span>Specialist agents (Vision, Change, Geospatial)</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#3df2ff] shrink-0" />
                <span>Automated bi-temporal change delineation</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#3df2ff] shrink-0" />
                <span>Interactive Cesium 3D visual verification</span>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* THE 4-STEP AGENT DISPATCH BREAKDOWN */}
        {/* ============================================================ */}
        <div className="space-y-8">
          <div className="border-b border-white/10 pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="font-mono-code text-xs text-[#3df2ff] uppercase font-bold tracking-widest block">
                Execution Workflow
              </span>
              <h3 className="text-2xl sm:text-3xl font-black uppercase text-white tracking-tight font-sans">
                How SatQuery Answers Questions
              </h3>
            </div>
            <span className="font-mono-code text-xs text-white/40">
              Autonomous 4-Tier Pipeline
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 font-mono-code">
            {/* Step 1 */}
            <div className="p-5 bg-white/[0.02] border border-white/10 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#3df2ff] font-bold">01 / PARSE</span>
                <Terminal className="w-4 h-4 text-white/40" />
              </div>
              <p className="text-white text-sm font-sans font-bold uppercase">Natural Language Intent</p>
              <p className="text-[11px] text-white/60 font-sans leading-relaxed">
                Extracts location coordinates, temporal window, and physical phenomenon (canopy, flood, urban).
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-5 bg-white/[0.02] border border-white/10 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#3df2ff] font-bold">02 / DISPATCH</span>
                <Cpu className="w-4 h-4 text-white/40" />
              </div>
              <p className="text-white text-sm font-sans font-bold uppercase">Specialist Agents</p>
              <p className="text-[11px] text-white/60 font-sans leading-relaxed">
                Spawns parallel workers for optical reflectance, SAR radar coherence, and spatial indexing.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-5 bg-white/[0.02] border border-white/10 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#3df2ff] font-bold">03 / NAVIGATE</span>
                <Globe2 className="w-4 h-4 text-white/40" />
              </div>
              <p className="text-white text-sm font-sans font-bold uppercase">3D Globe Fly-To</p>
              <p className="text-[11px] text-white/60 font-sans leading-relaxed">
                Cesium 3D camera smoothly glides to the target coordinates and streams real-time satellite tiles.
              </p>
            </div>

            {/* Step 4 */}
            <div className="p-5 bg-white/[0.02] border border-white/10 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#3df2ff] font-bold">04 / QUANTIFY</span>
                <Scan className="w-4 h-4 text-white/40" />
              </div>
              <p className="text-white text-sm font-sans font-bold uppercase">Synthesized Insight</p>
              <p className="text-[11px] text-white/60 font-sans leading-relaxed">
                Outputs verified area metrics, percentage deltas, spectral histograms, and geo-evidence cards.
              </p>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* INTERACTIVE QUERY TRY-IT-NOW BOX */}
        {/* ============================================================ */}
        <div className="p-8 sm:p-10 bg-black/80 border border-white/20 space-y-6">
          <div className="space-y-2">
            <span className="font-mono-code text-xs text-[#3df2ff] uppercase font-bold tracking-widest block">
              Ask The Earth
            </span>
            <h3 className="text-2xl sm:text-3xl font-black uppercase text-white font-sans tracking-tight">
              Test A Planetary Query
            </h3>
            <p className="text-sm text-white/70 font-sans">
              Enter any environmental or geographic question to initialize 3D Mission Control:
            </p>
          </div>

          <form onSubmit={handleQuerySubmit} className="space-y-4">
            <div className="relative flex items-center">
              <Search className="absolute left-4 w-5 h-5 text-[#3df2ff]" />
              <input
                type="text"
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                placeholder="Ask about deforestation, flooding, wildfire scars, or urban growth..."
                className="w-full bg-white/[0.04] border border-white/20 pl-12 pr-36 py-4 text-sm sm:text-base text-white placeholder-white/40 font-sans focus:outline-none focus:border-[#3df2ff] transition-all"
              />
              <button
                type="submit"
                className="absolute right-2 px-5 py-2.5 bg-[#3df2ff] hover:bg-white text-black font-mono-code text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(61,242,255,0.25)]"
              >
                <span>Execute</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Benchmark Sample Chips */}
            <div className="flex flex-wrap items-center gap-2 pt-1 font-mono-code text-xs">
              <span className="text-white/40 text-[11px]">BENCHMARKS:</span>
              {sampleQueries.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setQueryInput(q)}
                  className="px-3 py-1 bg-white/[0.04] hover:bg-white/10 border border-white/10 text-white/70 hover:text-white text-[11px] transition-all cursor-pointer text-left"
                >
                  {q}
                </button>
              ))}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
