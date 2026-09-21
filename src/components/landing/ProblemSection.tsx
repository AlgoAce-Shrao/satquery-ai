/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Layers, Wrench, UserCheck, Clock } from 'lucide-react';

export const ProblemSection: React.FC = () => {
  const problemCards = [
    {
      icon: Layers,
      title: 'Massive Data Volume',
      desc: 'Raw multispectral rasters captured continuously across fragmented satellite constellations.',
    },
    {
      icon: Wrench,
      title: 'Fragmented Tooling',
      desc: 'Desktop GIS software, manual radiometric calibration, reprojection, and disparate scripts.',
    },
    {
      icon: UserCheck,
      title: 'Specialized Expertise',
      desc: 'Domain skills in band algebra, SAR polarimetry, and remote sensing for even basic queries.',
    },
    {
      icon: Clock,
      title: 'Slow Validation',
      desc: 'Downloading tiles, correcting for atmosphere, and manually delineating polygons by hand.',
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
            Orbital sensors collect enormous volumes of spectral data. Turning raw raster pixels into
            an actionable answer still means specialist knowledge, disparate tools, and slow manual
            interpretation &mdash; SatQuery is built to make that interaction direct.
          </p>
        </div>

        {/* Content: problem cards + restrained fragment collage */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {problemCards.map((card, idx) => {
              const Icon = card.icon;
              return (
                <div
                  key={idx}
                  className="p-6 bg-[#0f110d]/80 border border-white/10 hover:border-[#C88A45]/40 transition-all space-y-3 rounded-sm"
                >
                  <div className="w-9 h-9 rounded-sm bg-white/[0.03] border border-white/10 flex items-center justify-center text-[#C88A45]">
                    <Icon className="w-4.5 h-4.5" />
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

          {/* Restrained visual fragments — not a fake dashboard, just torn scraps of the
              workflow: a raster tile, a region outline, a query string. */}
          <div className="lg:col-span-5 relative h-80 select-none">
            <div className="absolute top-0 left-4 w-48 h-32 bg-gradient-to-br from-[#122418] via-[#0d1612] to-black border border-white/10 rounded-xs rotate-[-3deg] shadow-lg flex items-center justify-center">
              <span className="font-mono-code text-[9px] text-[#96978D]/60 uppercase tracking-wider">Raster Tile</span>
            </div>
            <div className="absolute top-16 right-2 w-44 h-44 border border-[#C88A45]/25 rounded-xs rotate-[4deg] bg-[#0a0c08]/90 p-3 flex items-end">
              <svg className="w-full h-24" viewBox="0 0 120 60" fill="none">
                <path d="M5 45 Q30 10 55 30 T115 20" stroke="#C88A45" strokeOpacity="0.4" strokeWidth="1.5" />
              </svg>
            </div>
            <div className="absolute bottom-2 left-10 max-w-xs px-4 py-3 bg-[#0a0c08] border border-white/10 rounded-xs rotate-[2deg] shadow-xl">
              <p className="font-mono-code text-[11px] text-[#96978D] italic">
                "...decreasing NDVI over the eastern basin..."
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
