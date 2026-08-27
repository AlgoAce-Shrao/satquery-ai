/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Eye, Clock, MapPin, ShieldCheck, ArrowDown, Cpu, CheckCircle2, Terminal } from 'lucide-react';

export const AgentWorkflowSection: React.FC = () => {
  const [activeAgentId, setActiveAgentId] = useState<string>('vision');

  const agents = [
    {
      id: 'vision',
      icon: Eye,
      name: 'VISION AGENT',
      role: 'Understands Multispectral Imagery',
      details: 'Processes Sentinel-2 and Landsat-9 spectral bands (RGB, NIR, SWIR1/2), performs land cover classification, and isolates sub-pixel canopy signatures.',
      badge: 'Multispectral Segmentation',
      accent: '#7F8C63', // Muted olive
      telemetry: 'SENTINEL-2 MSI • 10m GSD • 99.2% CLASSIFICATION CONFIDENCE',
    },
    {
      id: 'change',
      icon: Clock,
      name: 'CHANGE AGENT',
      role: 'Detects Temporal Deltas Over Time',
      details: 'Computes bi-temporal differences across historical baselines (NDVI, NDWI, SAR coherence) to isolate significant planetary shifts while eliminating seasonal noise.',
      badge: 'Temporal Delta Engine',
      accent: '#B85C43', // Muted terracotta
      telemetry: 'DELTA: -18.4% CANOPY LOSS • 12-MONTH HISTORICAL BASELINE',
    },
    {
      id: 'geo',
      icon: MapPin,
      name: 'GEO-REASONING AGENT',
      role: 'Spatial Indexing & Topography',
      details: 'Resolves ambiguous place names into precise WGS-84 bounding boxes, analyzes spatial proximity to protected reserves, and cross-references elevation models.',
      badge: 'Spatial Indexing & Topography',
      accent: '#B8A06A', // Earth gold
      telemetry: 'BOUNDS: [-10.83°, -55.86°] • SRTM DEM 30m ELEVATION',
    },
    {
      id: 'evidence',
      icon: ShieldCheck,
      name: 'EVIDENCE AGENT',
      role: 'Grounding & Statistical Verification',
      details: 'Cross-validates findings across independent optical and SAR radar constellations, calculates geometric polygon area (42.7 km²), and assigns confidence scores.',
      badge: 'Statistical Verification',
      accent: '#E8E4D8', // Warm ivory
      telemetry: 'CONFIDENCE: 94.2% • DUAL-CONSTELLATION HARMONIZED',
    },
  ];

  const activeAgent = agents.find((a) => a.id === activeAgentId) || agents[0];

  return (
    <section className="relative py-28 sm:py-36 px-6 sm:px-12 lg:px-20 text-[#E8E4D8] z-10 border-t border-white/10 bg-gradient-to-b from-black/20 via-[#080907]/80 to-black/30 backdrop-blur-[2px]">
      <div className="max-w-6xl mx-auto space-y-16">
        {/* Section Header */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#121410] border border-white/10 text-[#96978D] text-[10px] font-mono-code rounded-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C88A45]" />
            <span className="uppercase tracking-[0.18em] text-[#C88A45] font-medium">
              Multi-Agent Architecture
            </span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold uppercase tracking-tight text-[#E8E4D8] font-sans leading-tight">
            One question. Multiple specialized agents.
            <br />
            <span className="text-[#C88A45]">One verified answer.</span>
          </h2>
          <p className="text-sm sm:text-base text-[#96978D] font-sans leading-relaxed font-light">
            No single model can solve remote sensing alone. SatQuery deploys a coordinated team of domain-specific agents that analyze, cross-verify, and ground every conclusion.
          </p>
        </div>

        {/* Multi-Agent Orchestration Architecture Graph */}
        <div className="space-y-4 max-w-5xl mx-auto font-mono-code">
          {/* 1. Orchestrator Node */}
          <div className="flex flex-col items-center">
            <div className="w-full max-w-lg p-4 bg-[#0d0f0a] border border-[#C88A45]/40 rounded-xs text-center space-y-1 shadow-sm">
              <div className="flex items-center justify-center gap-2 text-xs text-[#C88A45] font-bold">
                <Cpu className="w-4 h-4" />
                <span className="tracking-widest uppercase">ORCHESTRATOR AGENT</span>
              </div>
              <p className="text-xs text-[#96978D] font-sans">
                Understands intent &bull; Extracts spatiotemporal parameters &bull; Dispatches specialist agents
              </p>
            </div>

            {/* Connecting branching lines */}
            <div className="w-full max-w-3xl h-7 flex flex-col items-center justify-start my-1 relative">
              <div className="w-0.5 h-3 bg-[#C88A45]/50" />
              <div className="w-4/5 h-0.5 bg-[#C88A45]/30" />
              <div className="w-4/5 flex justify-between">
                <div className="w-0.5 h-3 bg-[#C88A45]/30" />
                <div className="w-0.5 h-3 bg-[#C88A45]/30" />
                <div className="w-0.5 h-3 bg-[#C88A45]/30" />
              </div>
            </div>
          </div>

          {/* 2. Three Parallel Specialist Agents */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {agents.slice(0, 3).map((agent) => {
              const Icon = agent.icon;
              const isSelected = activeAgentId === agent.id;
              return (
                <div
                  key={agent.id}
                  onClick={() => setActiveAgentId(agent.id)}
                  className={`p-5 rounded-xs border transition-all cursor-pointer space-y-3 ${
                    isSelected
                      ? 'bg-[#121510] border-[#C88A45] shadow-sm'
                      : 'bg-[#0a0c08] border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-7 h-7 rounded-xs bg-white/[0.03] border border-white/10 flex items-center justify-center"
                        style={{ color: agent.accent }}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-semibold text-[#E8E4D8] tracking-wide">{agent.name}</span>
                    </div>
                    {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#C88A45]" />}
                  </div>

                  <p className="text-xs text-[#96978D] font-sans leading-relaxed">
                    {agent.role}
                  </p>

                  <div className="pt-2 border-t border-white/10 text-[10px]" style={{ color: agent.accent }}>
                    <span>{agent.badge}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 3. Convergence Line to Evidence Agent */}
          <div className="flex flex-col items-center my-2">
            <div className="w-4/5 flex justify-between">
              <div className="w-0.5 h-3 bg-[#C88A45]/30" />
              <div className="w-0.5 h-3 bg-[#C88A45]/30" />
              <div className="w-0.5 h-3 bg-[#C88A45]/30" />
            </div>
            <div className="w-4/5 h-0.5 bg-[#C88A45]/30" />
            <div className="w-0.5 h-3 bg-[#C88A45]/50" />

            {/* Evidence Agent Card */}
            <div
              onClick={() => setActiveAgentId('evidence')}
              className={`w-full max-w-xl p-4.5 rounded-xs border transition-all cursor-pointer space-y-1.5 text-center ${
                activeAgentId === 'evidence'
                  ? 'bg-[#121510] border-[#C88A45] shadow-sm'
                  : 'bg-[#0a0c08] border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-center gap-2 text-xs font-bold text-[#E8E4D8]">
                <ShieldCheck className="w-4 h-4 text-[#7F8C63]" />
                <span className="tracking-wider">EVIDENCE AGENT</span>
              </div>
              <p className="text-xs text-[#96978D] font-sans max-w-md mx-auto">
                Cross-validates observations, calculates polygon metrics & assigns statistical confidence
              </p>
            </div>

            {/* Final Output Cue */}
            <div className="w-0.5 h-5 bg-[#C88A45]/40 my-1" />
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-xs bg-[#121410] border border-[#7F8C63]/50 text-[#E8E4D8] text-xs font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#7F8C63]" />
              <span>VERIFIED PLANETARY INSIGHT</span>
            </div>
          </div>

          {/* Active Agent Telemetry Inspector Box */}
          <div className="p-4 bg-[#0a0c08] border border-white/15 rounded-xs space-y-1.5 mt-6">
            <div className="flex items-center justify-between text-[11px] text-[#96978D] border-b border-white/10 pb-2">
              <div className="flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-[#C88A45]" />
                <span className="text-[#E8E4D8] font-medium">ACTIVE AGENT LOG: {activeAgent.name}</span>
              </div>
              <span className="text-[10px] text-[#96978D]">{activeAgent.telemetry}</span>
            </div>
            <p className="text-xs font-sans text-[#E8E4D8]/80 leading-relaxed pt-1">
              {activeAgent.details}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
