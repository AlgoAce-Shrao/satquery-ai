/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { MessageSquare, Database, Calculator, Radio, Cpu, CheckCircle2 } from 'lucide-react';

export const AgentWorkflowSection: React.FC = () => {
  const [activeId, setActiveId] = useState<string>('nlp');

  const specialists = [
    {
      id: 'nlp',
      icon: MessageSquare,
      name: 'Query Understanding',
      role: 'Extracts intent, target index, region, and time range from plain language.',
      accent: '#7F8C63',
      status: 'live' as const,
    },
    {
      id: 'data',
      icon: Database,
      name: 'Spatial Data Retrieval',
      role: 'Looks up catalogued satellite observations for the resolved region via PostGIS.',
      accent: '#B85C43',
      status: 'live' as const,
    },
    {
      id: 'eo',
      icon: Calculator,
      name: 'Spectral & Raster Analysis',
      role: 'Computes NDVI/NDWI/NDBI band math; for uploaded imagery, decodes real pixels for single-scene and bi-temporal comparison.',
      accent: '#B8A06A',
      status: 'live' as const,
    },
    {
      id: 'fusion',
      icon: Radio,
      name: 'Optical + SAR Fusion',
      role: 'Joint interpretation across radar and optical modalities in a single analysis.',
      accent: '#5A7D9A',
      status: 'planned' as const,
    },
  ];

  const active = specialists.find((s) => s.id === activeId) || specialists[0];

  return (
    <section className="relative py-28 sm:py-36 px-6 sm:px-12 lg:px-20 text-[#E8E4D8] z-10 border-t border-white/10 bg-gradient-to-b from-black/20 via-[#080907]/80 to-black/30 backdrop-blur-[2px]">
      <div className="max-w-5xl mx-auto space-y-16">
        {/* Section Header */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#121410] border border-white/10 text-[#96978D] text-[10px] font-mono-code rounded-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C88A45]" />
            <span className="uppercase tracking-[0.18em] text-[#C88A45] font-medium">
              Specialized Analysis
            </span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold uppercase tracking-tight text-[#E8E4D8] font-sans leading-tight">
            One question, routed to the
            <br />
            <span className="text-[#C88A45]">specialist that can answer it.</span>
          </h2>
          <p className="text-sm sm:text-base text-[#96978D] font-sans leading-relaxed font-light">
            A gateway sequences deterministic, independently-testable services instead of routing
            everything through one opaque model.
          </p>
        </div>

        {/* Central query -> radiating specialist nodes */}
        <div className="space-y-6 font-mono-code">
          <div className="flex flex-col items-center">
            <div className="w-full max-w-md p-4 bg-[#0d0f0a] border border-[#C88A45]/40 rounded-xs text-center space-y-1 shadow-sm">
              <div className="flex items-center justify-center gap-2 text-xs text-[#C88A45] font-bold">
                <Cpu className="w-4 h-4" />
                <span className="tracking-widest uppercase">Orchestrator</span>
              </div>
              <p className="text-xs text-[#96978D] font-sans">
                Sequences the specialists below &bull; falls back gracefully if one is unreachable
              </p>
            </div>
            <div className="w-0.5 h-6 bg-[#C88A45]/40 my-1" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {specialists.map((s) => {
              const Icon = s.icon;
              const isActive = activeId === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveId(s.id)}
                  className={`text-left p-5 rounded-xs border transition-all space-y-3 cursor-pointer ${
                    isActive ? 'bg-[#121510] border-[#C88A45] shadow-sm' : 'bg-[#0a0c08] border-white/10 hover:border-white/20'
                  } ${s.status === 'planned' ? 'opacity-70' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-xs bg-white/[0.03] border border-white/10 flex items-center justify-center" style={{ color: s.accent }}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-semibold text-[#E8E4D8] tracking-wide">{s.name}</span>
                    </div>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded-xs uppercase tracking-wider ${
                        s.status === 'live'
                          ? 'bg-[#7F8C63]/15 text-[#7F8C63] border border-[#7F8C63]/30'
                          : 'bg-white/[0.03] text-[#96978D] border border-white/10'
                      }`}
                    >
                      {s.status === 'live' ? 'Live' : 'Planned'}
                    </span>
                  </div>
                  <p className="text-xs text-[#96978D] font-sans leading-relaxed">{s.role}</p>
                </button>
              );
            })}
          </div>

          <div className="flex flex-col items-center pt-2">
            <div className="w-0.5 h-6 bg-[#C88A45]/40" />
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-xs bg-[#121410] border border-[#7F8C63]/50 text-[#E8E4D8] text-xs font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#7F8C63]" />
              <span>Structured Result + Heuristic Confidence</span>
            </div>
          </div>

          <div className="p-4 bg-[#0a0c08] border border-white/15 rounded-xs space-y-1.5 mt-4">
            <div className="text-[11px] text-[#96978D] border-b border-white/10 pb-2">
              <span className="text-[#E8E4D8] font-medium">{active.name}</span>
            </div>
            <p className="text-xs font-sans text-[#E8E4D8]/80 leading-relaxed pt-1">{active.role}</p>
          </div>
        </div>
      </div>
    </section>
  );
};
