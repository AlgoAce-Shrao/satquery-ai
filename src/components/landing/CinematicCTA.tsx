/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ArrowRight } from 'lucide-react';

interface CinematicCTAProps {
  onLaunchApp: () => void;
}

export const CinematicCTA: React.FC<CinematicCTAProps> = ({ onLaunchApp }) => {
  return (
    <footer className="relative bg-gradient-to-b from-transparent via-[#080907]/90 to-[#080907] text-[#E8E4D8] py-36 px-6 sm:px-12 lg:px-20 border-t border-white/10 z-10 select-none overflow-hidden">
      {/* Subtle orbital sunrise glow arc in background */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[850px] h-[300px] bg-[radial-gradient(ellipse_at_center,rgba(200,138,69,0.15)_0%,rgba(184,92,67,0.06)_40%,transparent_75%)] pointer-events-none" />

      <div className="max-w-4xl mx-auto space-y-12 text-center relative z-10">
        {/* Central Headline */}
        <div className="space-y-3 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#121410] border border-white/10 text-[#96978D] text-[10px] font-mono-code mb-2 rounded-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C88A45]" />
            <span className="uppercase tracking-[0.18em] text-[#C88A45] font-medium">
              Mission Control Readiness
            </span>
          </div>

          <h2 className="text-4xl sm:text-6xl font-bold uppercase tracking-tight text-[#E8E4D8] font-sans leading-tight">
            The Earth is changing.
            <br />
            The answers are already there.
            <br />
            <span className="text-[#C88A45]">You just need to ask.</span>
          </h2>

          <p className="text-sm sm:text-base text-[#96978D] font-sans max-w-lg mx-auto pt-2 font-light">
            Ask natural questions about our planet and explore evidence-backed answers in real-time 3D planetary space.
          </p>
        </div>

        {/* Action Button */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={onLaunchApp}
            className="w-full sm:w-auto px-9 py-4 bg-[#121410] hover:bg-[#C88A45] border border-[#C88A45]/70 text-[#E8E4D8] hover:text-black font-mono-code text-xs sm:text-sm font-semibold uppercase tracking-wider transition-all flex items-center justify-center gap-3 cursor-pointer rounded-xs shadow-sm"
          >
            <span>Explore SatQuery</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Footer Technical Metadata & NASA/ESA Citations */}
        <div className="pt-20 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono-code text-[11px] text-[#96978D]">
          <div className="flex items-center gap-3">
            <span className="text-[#E8E4D8] font-semibold tracking-wider">SATQUERY AI</span>
            <span>&bull;</span>
            <span>COPERNICUS SENTINEL & NASA LANDSAT</span>
          </div>

          <div className="flex items-center gap-3">
            <span>WGS-84 / EPSG:4326</span>
            <span>&bull;</span>
            <span>AUTONOMOUS REMOTE-SENSING SYSTEM</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
