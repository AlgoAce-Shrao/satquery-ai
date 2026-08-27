/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Sprout, Flame, Building2, Trees, Droplets, HardHat, ArrowUpRight } from 'lucide-react';

interface ApplicationsSectionProps {
  onSelectApplication?: (query: string) => void;
}

export const ApplicationsSection: React.FC<ApplicationsSectionProps> = ({
  onSelectApplication,
}) => {
  const domains = [
    {
      icon: Sprout,
      title: 'AGRICULTURE',
      desc: 'Crop vigor, drought stress & yield forecasts',
      query: 'Assess crop NDVI vigor and drought stress in San Joaquin Valley',
      accent: '#7F8C63', // Muted olive
      indices: 'NDVI • NDRE • EVI',
    },
    {
      icon: Flame,
      title: 'DISASTER MANAGEMENT',
      desc: 'Flood extent, wildfire scars & emergency response',
      query: 'Delineate flood inundation in Assam Valley using SAR radar',
      accent: '#B85C43', // Muted terracotta
      indices: 'SAR Backscatter • NBR',
    },
    {
      icon: Building2,
      title: 'URBAN PLANNING',
      desc: 'Sprawl velocity, impervious surface & heat islands',
      query: 'Analyze urban expansion and coastal reclamation in Dubai',
      accent: '#B8A06A', // Earth gold
      indices: 'NDBI • Surface Temp',
    },
    {
      icon: Trees,
      title: 'ENVIRONMENTAL MONITORING',
      desc: 'Illegal deforestation, carbon sinks & habitats',
      query: 'Detect forest canopy loss in Mato Grosso since 2024',
      accent: '#688A58', // Forest sage
      indices: 'Forest Loss • Biomass',
    },
    {
      icon: Droplets,
      title: 'WATER INTELLIGENCE',
      desc: 'Reservoir levels, algal blooms & wetland drying',
      query: 'Analyze surface water area decrease in Lake Mead',
      accent: '#5A7D9A', // Muted slate blue
      indices: 'MNDWI • Chlorophyll-a',
    },
    {
      icon: HardHat,
      title: 'INFRASTRUCTURE',
      desc: 'Construction milestones, road corridors & mining',
      query: 'Track transport infrastructure construction progress in NEOM',
      accent: '#C88A45', // Satellite amber
      indices: 'Coherence • Optical GSD',
    },
  ];

  return (
    <section className="relative py-28 sm:py-36 px-6 sm:px-12 lg:px-20 text-[#E8E4D8] z-10 border-t border-white/10 bg-gradient-to-b from-black/20 via-[#080907]/80 to-black/30 backdrop-blur-[2px]">
      <div className="max-w-7xl mx-auto space-y-16">
        {/* Section Header */}
        <div className="space-y-3 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#121410] border border-white/10 text-[#96978D] text-[10px] font-mono-code rounded-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C88A45]" />
            <span className="uppercase tracking-[0.18em] text-[#C88A45] font-medium">
              Geospatial Problem Domains
            </span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold uppercase tracking-tight text-[#E8E4D8] font-sans">
            Built for the questions that <span className="text-[#C88A45]">matter.</span>
          </h2>
          <p className="text-sm sm:text-base text-[#96978D] font-sans leading-relaxed font-light max-w-2xl">
            From climate resilience to global supply chains, SatQuery unifies optical, SAR, and thermal satellite intelligence into a single natural query engine.
          </p>
        </div>

        {/* 6 Application Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {domains.map((dom, idx) => {
            const Icon = dom.icon;
            return (
              <div
                key={idx}
                onClick={() => onSelectApplication?.(dom.query)}
                className="group relative p-6 rounded-xs border border-white/10 hover:border-white/25 bg-[#0a0c08] transition-all cursor-pointer overflow-hidden space-y-4 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div
                    className="w-9 h-9 rounded-xs bg-white/[0.02] border border-white/10 flex items-center justify-center"
                    style={{ color: dom.accent }}
                  >
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                  <span className="font-mono-code text-[10px] text-[#96978D] group-hover:text-[#E8E4D8] transition-colors flex items-center gap-1">
                    <span>{dom.indices}</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="text-xs font-mono-code font-semibold uppercase tracking-wider text-[#E8E4D8]">
                    {dom.title}
                  </h3>
                  <p className="text-sm text-[#96978D] font-sans">
                    {dom.desc}
                  </p>
                </div>

                <div className="pt-3 border-t border-white/10 text-[11px] font-mono-code text-[#96978D] group-hover:text-[#C88A45] transition-colors">
                  <span>&rarr; Try: "{dom.query.slice(0, 36)}..."</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
