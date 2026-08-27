/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ArrowRight, ChevronDown } from 'lucide-react';

interface HeroSectionProps {
  onLaunchApp: () => void;
  onScrollDown?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onLaunchApp,
  onScrollDown,
}) => {
  return (
    <section className="relative min-h-screen w-full flex flex-col justify-between px-6 sm:px-12 lg:px-20 pt-32 pb-12 text-[#E8E4D8] z-10 select-none">
      {/* Top Mission Classification Label */}
      <div className="pt-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#121410]/80 border border-white/10 text-[#96978D] text-[10px] sm:text-[11px] font-mono-code backdrop-blur-sm rounded-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-[#C88A45]" />
          <span className="uppercase tracking-[0.18em] text-[#C88A45] font-medium">
            Autonomous Remote-Sensing Agent
          </span>
        </div>
      </div>

      {/* Main Hero Headline */}
      <div className="max-w-2xl space-y-6 my-auto">
        <div className="space-y-3">
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold uppercase tracking-tight text-[#E8E4D8] font-sans leading-[1.0]">
            SATQUERY <span className="text-[#C88A45] font-light">AI</span>
          </h1>
          <div className="text-2xl sm:text-4xl lg:text-5xl font-sans font-light tracking-tight text-[#E8E4D8]/90 leading-[1.15]">
            <p>Ask the Earth.</p>
            <p className="font-normal text-[#E8E4D8]">Find the Answer.</p>
          </div>
        </div>

        <p className="text-sm sm:text-base text-[#96978D] font-sans max-w-lg leading-relaxed font-light">
          A natural-language intelligence layer for multi-constellation satellite observation, bi-temporal change detection, and verified planetary evidence.
        </p>

        <div className="pt-2">
          <button
            onClick={onLaunchApp}
            className="px-6 py-3.5 bg-[#121410] hover:bg-[#1a1e16] border border-[#C88A45]/60 hover:border-[#C88A45] text-[#E8E4D8] font-mono-code text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-3 cursor-pointer rounded-sm shadow-sm"
          >
            <span>Start Exploring</span>
            <ArrowRight className="w-4 h-4 text-[#C88A45]" />
          </button>
        </div>
      </div>

      {/* Bottom Scroll Cue */}
      <div className="flex flex-col items-center justify-center pt-8 border-t border-white/10">
        <button
          onClick={onScrollDown}
          className="flex flex-col items-center gap-2 font-mono-code text-[10px] text-[#96978D] hover:text-[#E8E4D8] transition-colors cursor-pointer"
        >
          <span className="uppercase tracking-[0.2em]">Scroll to observe</span>
          <div className="w-4 h-7 rounded-full border border-white/20 flex items-start justify-center p-1">
            <span className="w-1 h-1.5 rounded-full bg-[#C88A45] animate-bounce" />
          </div>
        </button>
      </div>
    </section>
  );
};
