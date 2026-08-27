/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { CheckCircle2, MapPin, Activity, ShieldCheck } from 'lucide-react';

export const EarthResponseSection: React.FC = () => {
  const [selectedYear, setSelectedYear] = useState('2026');

  const years = ['2022', '2023', '2024', '2025', '2026'];

  const bullets = [
    'Sub-pixel bi-temporal change detection',
    'Interactive historical baseline comparison',
    'Delineated bounding polygons & geometric metrics',
    'Multi-constellation statistical confidence scoring',
  ];

  return (
    <section className="relative py-28 sm:py-36 px-6 sm:px-12 lg:px-20 text-[#E8E4D8] z-10 border-t border-white/10 bg-gradient-to-b from-black/20 via-[#080907]/80 to-black/30 backdrop-blur-[2px]">
      <div className="max-w-7xl mx-auto space-y-16">
        {/* Section Header & Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Story & Benefits */}
          <div className="lg:col-span-4 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#121410] border border-white/10 text-[#96978D] text-[10px] font-mono-code rounded-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C88A45]" />
              <span className="uppercase tracking-[0.18em] text-[#C88A45] font-medium">
                Visual Evidence
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold uppercase tracking-tight text-[#E8E4D8] font-sans leading-tight">
              Visual answers.
              <br />
              <span className="text-[#C88A45]">Backed by evidence.</span>
            </h2>
            <p className="text-sm sm:text-base text-[#96978D] font-sans leading-relaxed font-light">
              SatQuery does not just deliver a text summary. It grounds every insight with verifiable satellite rasters, delineated change polygons, and historical baselines.
            </p>

            {/* Checkmark List */}
            <div className="space-y-2.5 pt-2 font-sans text-sm text-[#E8E4D8]/90">
              {bullets.map((b, idx) => (
                <div key={idx} className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#7F8C63] shrink-0" />
                  <span className="text-xs sm:text-sm text-[#96978D]">{b}</span>
                </div>
              ))}
            </div>

            {/* Grounding Callout */}
            <div className="p-4 bg-[#0a0c08] border border-white/10 rounded-xs space-y-1 font-mono-code text-xs">
              <div className="flex items-center gap-2 text-[#C88A45] font-semibold">
                <ShieldCheck className="w-4 h-4" />
                <span>EPHEMERIS GROUND TRUTH</span>
              </div>
              <p className="text-[#96978D] text-[11px] font-sans">
                Every calculation is reproducible against open Copernicus Sentinel-2 Level-2A and USGS Landsat-9 surface reflectance rasters.
              </p>
            </div>
          </div>

          {/* Center Column: Satellite Viewport with Change Polygon */}
          <div className="lg:col-span-5 space-y-4">
            <div className="relative rounded-xs border border-white/15 bg-[#0a0c08] overflow-hidden shadow-xl">
              {/* Satellite Imagery Viewport */}
              <div className="relative h-72 sm:h-80 w-full bg-[#070e0a] overflow-hidden flex items-center justify-center select-none">
                {/* Synthetic realistic satellite terrain layer */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#0c2014] via-[#142e1b] to-[#0a180e] opacity-95" />
                <div className="absolute inset-0 bg-[radial-gradient(#ffffff_0.6px,transparent_0.6px)] opacity-10 [background-size:14px_14px]" />

                {/* River and terrain contours */}
                <svg className="absolute inset-0 w-full h-full opacity-35 pointer-events-none">
                  <path d="M 0 160 Q 140 130 240 190 T 480 170" stroke="#1b4229" strokeWidth="4" fill="none" />
                  <path d="M 190 0 Q 210 140 280 230 T 340 320" stroke="#122c42" strokeWidth="5" fill="none" />
                  <path d="M 50 40 Q 160 80 220 50" stroke="#1f3624" strokeWidth="2" fill="none" />
                </svg>

                {/* Highlighted Change Polygon (Muted Terracotta) */}
                <div className="relative z-10 flex flex-col items-center justify-center">
                  <div className="w-44 h-32 sm:w-50 sm:h-34 rounded-xs bg-[#B85C43]/15 border border-[#B85C43] relative flex items-center justify-center shadow-md">
                    <div className="absolute -top-2.5 left-2 px-2 py-0.5 bg-[#B85C43] text-[#E8E4D8] text-[9.5px] font-mono-code font-semibold uppercase tracking-wider rounded-xs">
                      Loss Detected: -18.4%
                    </div>
                    <div className="flex flex-col items-center gap-1 text-center">
                      <MapPin className="w-5 h-5 text-[#B85C43]" />
                      <span className="font-mono-code text-[10px] text-[#E8E4D8] bg-black/60 px-2 py-0.5 rounded-xs">
                        Mato Grosso Sector 4
                      </span>
                    </div>
                  </div>
                </div>

                {/* Coordinates & Band Overlay */}
                <div className="absolute top-3 right-3 font-mono-code text-[9.5px] text-[#96978D] bg-black/70 px-2 py-1 border border-white/10 rounded-xs">
                  LAT: -10.83° | LON: -55.86°
                </div>

                <div className="absolute top-3 left-3 flex items-center gap-1.5 font-mono-code text-[9.5px] text-[#7F8C63] bg-black/70 px-2 py-1 border border-white/10 rounded-xs">
                  <Activity className="w-3 h-3 text-[#7F8C63]" />
                  <span>SENTINEL-2 MSI</span>
                </div>
              </div>

              {/* Bottom Timeline Scrubber */}
              <div className="p-3 bg-[#080907] border-t border-white/10 flex items-center justify-between font-mono-code text-xs">
                <span className="text-[#96978D] text-[10px] uppercase tracking-wider">BASELINE:</span>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  {years.map((yr) => (
                    <button
                      key={yr}
                      onClick={() => setSelectedYear(yr)}
                      className={`px-2.5 py-1 text-xs rounded-xs transition-all cursor-pointer ${
                        selectedYear === yr
                          ? 'bg-[#C88A45] text-black font-bold'
                          : 'bg-white/[0.03] text-[#96978D] hover:text-[#E8E4D8] border border-white/10'
                      }`}
                    >
                      {yr}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Quantitative Telemetry Cards */}
          <div className="lg:col-span-3 space-y-3 font-mono-code">
            {/* Metric 1: Vegetation Delta */}
            <div className="p-4 bg-[#0a0c08] border border-white/10 rounded-xs space-y-1">
              <span className="text-[10px] text-[#96978D] uppercase block">VEGETATION DELTA</span>
              <div className="text-2xl font-semibold text-[#B85C43]">-18.4%</div>
              <span className="text-[10px] text-[#96978D] block font-sans">Relative to 12-mo baseline</span>
            </div>

            {/* Metric 2: Surface Area */}
            <div className="p-4 bg-[#0a0c08] border border-white/10 rounded-xs space-y-1">
              <span className="text-[10px] text-[#96978D] uppercase block">DELINEATED AREA</span>
              <div className="text-2xl font-semibold text-[#E8E4D8]">42.7 km²</div>
              <span className="text-[10px] text-[#96978D] block font-sans">WGS-84 Polygon Perimeter</span>
            </div>

            {/* Metric 3: Confidence Score */}
            <div className="p-4 bg-[#0a0c08] border border-white/10 rounded-xs space-y-1">
              <span className="text-[10px] text-[#96978D] uppercase block">STATISTICAL CONFIDENCE</span>
              <div className="text-2xl font-semibold text-[#B8A06A]">94.2%</div>
              <span className="text-[10px] text-[#96978D] block font-sans">Dual-sensor validated</span>
            </div>

            {/* Metric 4: Primary Driver */}
            <div className="p-4 bg-[#0a0c08] border border-white/10 rounded-xs space-y-1">
              <span className="text-[10px] text-[#96978D] uppercase block">PRIMARY DRIVER</span>
              <div className="text-sm font-semibold text-[#7F8C63]">Agro-Industrial Canopy Loss</div>
              <span className="text-[10px] text-[#96978D] block font-sans">Resolved by Change Agent</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
