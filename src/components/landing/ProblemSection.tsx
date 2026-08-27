/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Layers, Wrench, UserCheck, Clock, Activity, AlertTriangle } from 'lucide-react';

export const ProblemSection: React.FC = () => {
  const problemCards = [
    {
      icon: Layers,
      title: 'Massive Data Volume',
      desc: 'Terabytes of raw multispectral rasters captured daily across fragmented satellite constellations.',
      stat: '50+ TB / Day',
    },
    {
      icon: Wrench,
      title: 'Fragmented Tooling',
      desc: 'Complex desktop GIS software, manual radiometric calibrations, reprojections, and disparate scripts.',
      stat: '12+ Software Tools',
    },
    {
      icon: UserCheck,
      title: 'Specialized Expertise',
      desc: 'Deep domain skills in band algebra, SAR polarimetry, and remote-sensing required for basic queries.',
      stat: 'Years of Training',
    },
    {
      icon: Clock,
      title: 'Slow Validation',
      desc: 'Hours or days spent downloading tiles, atmospheric correction, and manual polygon delineation.',
      stat: '4 to 18 Hours',
    },
  ];

  return (
    <section className="relative py-28 sm:py-36 px-6 sm:px-12 lg:px-20 text-[#E8E4D8] z-10 border-t border-white/10 bg-gradient-to-b from-black/20 via-[#080907]/80 to-black/30 backdrop-blur-[2px]">
      <div className="max-w-7xl mx-auto space-y-16">
        {/* Section Header */}
        <div className="space-y-3 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#121410] border border-white/10 text-[#96978D] text-[10px] font-mono-code rounded-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#B85C43]" />
            <span className="uppercase tracking-[0.18em] text-[#B85C43] font-medium">
              The Analytical Bottleneck
            </span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold uppercase tracking-tight text-[#E8E4D8] font-sans leading-tight">
            Satellite data is powerful.
            <br />
            <span className="text-[#C88A45]">But understanding it is hard.</span>
          </h2>
          <p className="text-sm sm:text-base text-[#96978D] font-sans leading-relaxed max-w-2xl font-light">
            Every day, orbital sensors collect millions of spectral bands. But turning raw raster pixels into actionable planetary decisions remains locked behind steep technical barriers.
          </p>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left: 4 Metric Problem Cards */}
          <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {problemCards.map((card, idx) => {
              const Icon = card.icon;
              return (
                <div
                  key={idx}
                  className="p-6 bg-[#0f110d]/80 border border-white/10 hover:border-[#C88A45]/40 transition-all space-y-3 rounded-sm group"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 rounded-sm bg-white/[0.03] border border-white/10 flex items-center justify-center text-[#C88A45]">
                      <Icon className="w-4.5 h-4.5" />
                    </div>
                    <span className="font-mono-code text-[10px] text-[#96978D]">
                      {card.stat}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold uppercase text-[#E8E4D8] font-sans tracking-wide">
                    {card.title}
                  </h3>
                  <p className="text-xs text-[#96978D] font-sans leading-relaxed">
                    {card.desc}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Right: Remote Sensing Analyst Workstation Visual */}
          <div className="lg:col-span-6">
            <div className="relative rounded-sm border border-white/15 bg-[#0a0c09]/95 overflow-hidden p-5 sm:p-6 space-y-4 shadow-xl">
              {/* Header telemetry bar */}
              <div className="flex items-center justify-between font-mono-code text-[10px] text-[#96978D] border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#B85C43]" />
                  <span className="text-[#E8E4D8] font-medium uppercase tracking-wider">LEGACY ANALYST WORKFLOW</span>
                </div>
                <span className="text-[#96978D]">CALIBRATION: UNRESOLVED</span>
              </div>

              {/* Multi-screen analyst grid simulation */}
              <div className="grid grid-cols-3 gap-3">
                {/* Screen 1: Raw Multispectral Band Matrix */}
                <div className="p-3 bg-white/[0.02] border border-white/10 space-y-2 font-mono-code text-[9px] rounded-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[#C88A45] font-medium">B02/B04/B08</span>
                    <span className="text-[#96978D] text-[8px]">10m GSD</span>
                  </div>
                  <div className="h-16 bg-gradient-to-br from-[#122418] via-[#0d1612] to-black rounded-xs border border-white/5 relative overflow-hidden flex items-center justify-center">
                    <span className="text-[#96978D] text-[8px] font-mono-code text-center px-1">RAW RASTER (1.4 GB)</span>
                  </div>
                  <span className="text-[#96978D] block text-[8px]">Tile: T21LXL Sentinel-2</span>
                </div>

                {/* Screen 2: Histogram & Band Algebra */}
                <div className="p-3 bg-white/[0.02] border border-white/10 space-y-2 font-mono-code text-[9px] rounded-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[#7F8C63] font-medium">NDVI DELTA</span>
                    <span className="text-[#96978D] text-[8px]">NIR/Red</span>
                  </div>
                  <div className="h-16 bg-[#080907] rounded-xs border border-white/5 p-1.5 flex items-end justify-between gap-1">
                    <div className="w-2 bg-[#7F8C63]/70 h-7" />
                    <div className="w-2 bg-[#7F8C63]/90 h-11" />
                    <div className="w-2 bg-[#7F8C63]/50 h-4" />
                    <div className="w-2 bg-[#C88A45]/80 h-9" />
                    <div className="w-2 bg-[#B85C43]/90 h-13" />
                    <div className="w-2 bg-[#B85C43]/60 h-6" />
                  </div>
                  <span className="text-[#96978D] block text-[8px]">Manual Thresholding</span>
                </div>

                {/* Screen 3: Orbital Pass Track */}
                <div className="p-3 bg-white/[0.02] border border-white/10 space-y-2 font-mono-code text-[9px] rounded-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[#B8A06A] font-medium">ORBITAL PASS</span>
                    <span className="text-[#96978D] text-[8px]">Sun-Sync</span>
                  </div>
                  <div className="h-16 bg-black rounded-xs border border-white/5 relative overflow-hidden flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full border border-[#C88A45]/30 border-dashed animate-[spin_20s_linear_infinite]" />
                    <Activity className="w-3.5 h-3.5 text-[#C88A45] absolute" />
                  </div>
                  <span className="text-[#96978D] block text-[8px]">Revisit Cycle: +5 Days</span>
                </div>
              </div>

              {/* Status Note */}
              <div className="p-3 bg-white/[0.02] border border-white/10 rounded-xs flex items-center justify-between font-mono-code text-[11px]">
                <span className="text-[#96978D] flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-[#B85C43]" />
                  Turnaround time:
                </span>
                <span className="text-[#B85C43] font-medium">4 to 18 Hours per Investigation</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
