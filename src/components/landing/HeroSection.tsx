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
    <section className="relative min-h-screen w-full flex flex-col justify-between px-6 sm:px-12 lg:px-20 pt-32 pb-12 text-sq-text z-10 select-none">
      {/* Top Mission Classification Label */}
      <div className="pt-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-sq-surface/80 border border-white/10 text-sq-secondary text-[10px] sm:text-[11px] font-mono-code backdrop-blur-sm rounded-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-sq-amber" />
          <span className="uppercase tracking-[0.18em] text-sq-amber font-medium">
            Autonomous Remote-Sensing Agent
          </span>
        </div>
      </div>

      {/* Main Hero Headline */}
      <div className="max-w-2xl space-y-6 my-auto">
        <div className="space-y-3">
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold uppercase tracking-tight text-sq-text font-sans leading-[1.0]">
            SATQUERY <span className="text-sq-amber font-light">AI</span>
          </h1>
          <div className="text-2xl sm:text-4xl lg:text-5xl font-sans font-light tracking-tight text-sq-text/90 leading-[1.15]">
            <p>Ask the Earth.</p>
            <p className="font-normal text-sq-text">Find the Answer.</p>
          </div>
        </div>

        <p className="text-sm sm:text-base text-sq-secondary font-sans max-w-lg leading-relaxed font-light">
          Turn natural-language questions into remote-sensing analysis and evidence.
        </p>

        <div className="pt-2 flex flex-wrap items-center gap-4">
          <button
            onClick={onLaunchApp}
            className="px-6 py-3.5 bg-sq-surface hover:bg-sq-elevated border border-sq-amber/60 hover:border-sq-amber text-sq-text font-sans text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-3 cursor-pointer rounded-sm shadow-sm"
          >
            <span>Explore SatQuery</span>
            <ArrowRight className="w-4 h-4 text-sq-amber" />
          </button>
          <button
            onClick={onScrollDown}
            className="font-sans text-xs font-medium uppercase tracking-wider text-sq-secondary hover:text-sq-text transition-colors cursor-pointer"
          >
            See how it works
          </button>
        </div>
      </div>

      {/* Bottom Scroll Cue */}
      <div className="flex flex-col items-center justify-center pt-8 border-t border-white/10">
        <button
          onClick={onScrollDown}
          className="flex flex-col items-center gap-2 font-sans text-[10px] text-sq-secondary hover:text-sq-text transition-colors cursor-pointer"
        >
          <span className="uppercase tracking-[0.2em]">Scroll to observe</span>
          <div className="w-4 h-7 rounded-full border border-white/20 flex items-start justify-center p-1">
            <span className="w-1 h-1.5 rounded-full bg-sq-amber animate-bounce" />
          </div>
        </button>
      </div>
    </section>
  );
};
