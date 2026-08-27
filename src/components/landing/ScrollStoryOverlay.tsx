/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ArrowDown, Radio, Activity, Compass, CheckCircle2 } from 'lucide-react';

interface ScrollStoryOverlayProps {
  scrollProgress: number; // 0.0 to 1.0
  onLaunchApp: () => void;
}

export const ScrollStoryOverlay: React.FC<ScrollStoryOverlayProps> = ({
  scrollProgress,
  onLaunchApp,
}) => {
  // Helper to calculate smooth cosine cross-fade opacity for each scroll stage
  const getStageOpacity = (center: number, width: number) => {
    const dist = Math.abs(scrollProgress - center);
    if (dist > width) return 0;
    return Math.cos((dist / width) * (Math.PI / 2));
  };

  // Section 0: Hero / Space (0% - 18%)
  // Full 1.0 opacity on initial page load, fades out smoothly as user begins scroll
  const op0 =
    scrollProgress < 0.08
      ? 1.0
      : scrollProgress < 0.20
        ? Math.cos(((scrollProgress - 0.08) / 0.12) * (Math.PI / 2))
        : 0;

  // Section 1: Orbit & Global Observation (16% - 38%)
  const op1 = getStageOpacity(0.28, 0.14);

  // Section 2: Satellite Remote Sensing (36% - 58%)
  const op2 = getStageOpacity(0.48, 0.14);

  // Section 3: Focus Region: Amazon Basin (56% - 78%)
  const op3 = getStageOpacity(0.68, 0.14);

  // Section 4: Bi-Temporal Change & Intelligence Synthesis (76% - 98%)
  // Fades in starting at 0.76, peaks at 0.88-0.92, fades out gently as user reaches ProblemSolutionStory
  const op4 =
    scrollProgress < 0.76
      ? 0
      : scrollProgress < 0.92
        ? Math.sin(((scrollProgress - 0.76) / 0.16) * (Math.PI / 2))
        : scrollProgress <= 0.99
          ? Math.cos(((scrollProgress - 0.92) / 0.07) * (Math.PI / 2))
          : 0;

  return (
    <div className="relative w-full text-white pointer-events-none select-none">
      {/* ============================================================ */}
      {/* STAGE 0: SPACE — CINEMATIC HERO (0% - 15%) */}
      {/* ============================================================ */}
      <section
        className="fixed inset-0 flex flex-col justify-between p-6 sm:p-12 lg:p-16 transition-opacity duration-300 pointer-events-none"
        style={{
          opacity: op0,
          visibility: op0 > 0.01 ? 'visible' : 'hidden',
        }}
      >
        {/* Top Eyebrow / Classification */}
        <div className="pt-16 sm:pt-20">
          <div className="inline-flex items-center gap-2.5 px-3 py-1 bg-white/[0.04] border border-white/10 text-white/80 text-[11px] font-mono-code">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3df2ff] animate-pulse" />
            <span className="uppercase tracking-[0.25em] text-[#3df2ff] font-bold">
              Autonomous Remote-Sensing Agent
            </span>
          </div>
        </div>

        {/* Hero Central Typography Reveal */}
        <div className="max-w-3xl space-y-4">
          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black uppercase tracking-tight text-white font-sans leading-[0.92]">
            SatQuery <span className="text-[#3df2ff]">AI</span>
          </h1>
          <p className="text-xl sm:text-2xl lg:text-3xl text-white/80 font-sans font-light tracking-tight max-w-xl">
            Turn satellite imagery into answers.
          </p>
          <p className="text-sm text-white/50 font-sans max-w-md leading-relaxed pt-1">
            Ask complex questions about planetary change in plain language.
          </p>
        </div>

        {/* Bottom Scroll Cue */}
        <div className="flex items-center justify-between font-mono-code text-[10px] text-white/40 border-t border-white/10 pt-4">
          <div className="flex items-center gap-2">
            <ArrowDown className="w-3.5 h-3.5 text-[#3df2ff] animate-bounce" />
            <span className="uppercase tracking-widest text-white/60">
              Scroll to observe Earth
            </span>
          </div>
          <div className="hidden sm:block">
            <span>EPHEMERIS: SENTINEL-1/2 • LANDSAT-9</span>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* STAGE 1: GLOBAL OBSERVATION (20% - 35%) */}
      {/* ============================================================ */}
      <section
        className="fixed inset-0 flex items-center justify-start p-6 sm:p-12 lg:p-20 transition-opacity duration-300 pointer-events-none"
        style={{
          opacity: op1,
          visibility: op1 > 0.01 ? 'visible' : 'hidden',
        }}
      >
        <div className="max-w-xl space-y-4 bg-black/60 backdrop-blur-sm p-6 sm:p-8 border-l-2 border-[#3df2ff] pointer-events-auto">
          <div className="flex items-center gap-2 text-[10px] font-mono-code text-[#3df2ff] uppercase tracking-widest font-bold">
            <Radio className="w-3.5 h-3.5" />
            <span>01 / Global Observation</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-bold uppercase tracking-tight text-white font-sans">
            A Planet in Constant Motion
          </h2>

          <p className="text-sm sm:text-base text-white/70 leading-relaxed font-sans">
            Every 24 hours, constellations of Earth-observing satellites capture petabytes of multispectral, optical, and radar telemetry across every biome on Earth.
          </p>

          <div className="pt-2 flex items-center gap-6 font-mono-code text-[11px] text-white/50 border-t border-white/10">
            <div>
              <span className="block text-white font-bold text-sm">700+</span>
              <span>Active Satellites</span>
            </div>
            <div>
              <span className="block text-[#3df2ff] font-bold text-sm">10m / px</span>
              <span>Optical Resolution</span>
            </div>
            <div>
              <span className="block text-[#10b981] font-bold text-sm">5-Day</span>
              <span>Revisit Frequency</span>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* STAGE 2: MULTI-SPECTRAL & SAR REMOTE SENSING (40% - 55%) */}
      {/* ============================================================ */}
      <section
        className="fixed inset-0 flex items-center justify-end p-6 sm:p-12 lg:p-20 transition-opacity duration-300 pointer-events-none"
        style={{
          opacity: op2,
          visibility: op2 > 0.01 ? 'visible' : 'hidden',
        }}
      >
        <div className="max-w-xl space-y-4 bg-black/60 backdrop-blur-sm p-6 sm:p-8 border-r-2 border-[#3df2ff] text-right pointer-events-auto">
          <div className="flex items-center justify-end gap-2 text-[10px] font-mono-code text-[#3df2ff] uppercase tracking-widest font-bold">
            <span>02 / Sensor Modality Fusion</span>
            <Activity className="w-3.5 h-3.5" />
          </div>

          <h2 className="text-3xl sm:text-4xl font-bold uppercase tracking-tight text-white font-sans">
            Optical + SAR Radar Fusion
          </h2>

          <p className="text-sm sm:text-base text-white/70 leading-relaxed font-sans">
            SatQuery synchronizes Sentinel-2 multispectral vegetation reflectance (NDVI) with Sentinel-1 Synthetic Aperture Radar (SAR) backscatter, penetrating dense cloud cover.
          </p>

          <div className="pt-2 flex items-center justify-end gap-6 font-mono-code text-[11px] text-white/50 border-t border-white/10">
            <div>
              <span className="block text-[#3df2ff] font-bold text-sm">Sentinel-2 MSI</span>
              <span>13 Spectral Bands</span>
            </div>
            <div>
              <span className="block text-white font-bold text-sm">Sentinel-1 SAR</span>
              <span>C-Band Radar</span>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* STAGE 3: REGIONAL FOCUS — AMAZON BASIN (60% - 74%) */}
      {/* ============================================================ */}
      <section
        className="fixed inset-0 flex items-end justify-start p-6 sm:p-12 lg:p-20 transition-opacity duration-300 pointer-events-none"
        style={{
          opacity: op3,
          visibility: op3 > 0.01 ? 'visible' : 'hidden',
        }}
      >
        <div className="max-w-lg space-y-3 bg-black/70 backdrop-blur-sm p-6 border border-white/15 pointer-events-auto">
          <div className="flex items-center justify-between font-mono-code text-[10px]">
            <span className="text-[#3df2ff] uppercase font-bold tracking-wider">
              03 / Regional Observation Lock
            </span>
            <span className="text-white/40">LAT: -10.83° S | LON: -55.86° W</span>
          </div>

          <h3 className="text-2xl sm:text-3xl font-bold uppercase text-white tracking-tight font-sans">
            Mato Grosso, Amazon Basin
          </h3>

          <p className="text-xs sm:text-sm text-white/70 leading-relaxed font-sans">
            Targeting spatial coordinates to track bi-temporal forest canopy dynamics and identify subtle logging road encroachment across 12 months.
          </p>

          <div className="pt-2 font-mono-code text-[10px] text-white/50 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#ff4e00] animate-ping" />
            <span>Scanning radiometric difference footprint...</span>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* STAGE 4: BI-TEMPORAL CHANGE & AI INTELLIGENCE (80% - 100%) */}
      {/* ============================================================ */}
      <section
        className="fixed inset-0 flex items-center justify-center p-6 sm:p-10 transition-opacity duration-300 pointer-events-none"
        style={{
          opacity: op4,
          visibility: op4 > 0.01 ? 'visible' : 'hidden',
        }}
      >
        <div className="max-w-2xl w-full bg-black/85 backdrop-blur-md border border-white/20 p-6 sm:p-8 space-y-6 shadow-2xl pointer-events-auto">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-3 font-mono-code">
            <div className="flex items-center gap-2 text-xs">
              <span className="w-2 h-2 rounded-full bg-[#10b981]" />
              <span className="text-[#3df2ff] uppercase font-bold tracking-wider">
                04 / Intelligence Generated
              </span>
            </div>
            <span className="text-[10px] text-white/40 uppercase">Verified Finding</span>
          </div>

          {/* Core Finding Headline */}
          <div className="space-y-1">
            <h3 className="text-2xl sm:text-3xl font-black uppercase text-white tracking-tight font-sans">
              Vegetation Change Detected
            </h3>
            <p className="text-xs sm:text-sm text-white/70 font-sans leading-relaxed">
              Automated multi-spectral band difference isolates high-severity canopy loss in the southern Amazon agricultural transition zone.
            </p>
          </div>

          {/* Quantitative Telemetry Matrix */}
          <div className="grid grid-cols-3 gap-3 font-mono-code text-center">
            <div className="p-3 bg-white/[0.03] border border-white/10 space-y-0.5">
              <span className="text-[10px] text-white/40 uppercase">Vegetation Delta</span>
              <p className="text-2xl sm:text-3xl font-black text-[#ff4e00] tracking-tight">−18.4%</p>
              <span className="text-[9px] text-white/50">Normalized NDVI</span>
            </div>

            <div className="p-3 bg-white/[0.03] border border-white/10 space-y-0.5">
              <span className="text-[10px] text-white/40 uppercase">Affected Area</span>
              <p className="text-2xl sm:text-3xl font-black text-white tracking-tight">1,248 ha</p>
              <span className="text-[9px] text-white/50">Delineated Bounds</span>
            </div>

            <div className="p-3 bg-white/[0.03] border border-white/10 space-y-0.5">
              <span className="text-[10px] text-white/40 uppercase">Agent Confidence</span>
              <p className="text-2xl sm:text-3xl font-black text-[#10b981] tracking-tight">94%</p>
              <span className="text-[9px] text-white/50">Cross-Validated</span>
            </div>
          </div>

          {/* Value Message & Launch CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-white/10">
            <div className="font-mono-code text-xs text-white/60">
              <p className="text-white font-bold">Satellite data. Natural language. Real-world insight.</p>
              <p className="text-[10px] text-white/40">Ready to explore globally in 3D Mission Control.</p>
            </div>

            <button
              onClick={onLaunchApp}
              className="w-full sm:w-auto px-6 py-3 bg-[#3df2ff] hover:bg-white text-black font-mono-code text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(61,242,255,0.3)]"
            >
              <span>Launch Mission Control</span>
              <Compass className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
