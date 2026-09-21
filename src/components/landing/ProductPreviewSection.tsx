/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Placeholder product-showcase frame. Intentionally does not embed any screen
 * recording — real product footage will be dropped into this same frame later.
 * Keep this component's contract simple (just a dark viewport + label) so that
 * swap-in is a one-line change when real assets arrive.
 */

import React from 'react';
import { Compass, ArrowRight } from 'lucide-react';

interface ProductPreviewSectionProps {
  onLaunchApp: () => void;
}

export const ProductPreviewSection: React.FC<ProductPreviewSectionProps> = ({ onLaunchApp }) => {
  return (
    <section className="relative py-28 sm:py-36 px-6 sm:px-12 lg:px-20 text-[#E8E4D8] z-10 border-t border-white/10 bg-gradient-to-b from-black/20 via-[#080907]/80 to-black/30 backdrop-blur-[2px]">
      <div className="max-w-5xl mx-auto space-y-10 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#121410] border border-white/10 text-[#96978D] text-[10px] font-mono-code rounded-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-[#C88A45]" />
          <span className="uppercase tracking-[0.18em] text-[#C88A45] font-medium">The Product</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-bold uppercase tracking-tight text-[#E8E4D8] font-sans">
          One console. The whole planet.
        </h2>

        <div className="relative rounded-xs border border-white/15 bg-[#0a0c08] overflow-hidden shadow-2xl mx-auto">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10 font-mono-code text-[10px]">
            <span className="text-[#96978D] uppercase tracking-wider">Mission Control</span>
            <span className="text-[#C88A45] uppercase tracking-wider">Product Preview</span>
          </div>
          <div className="relative aspect-video w-full bg-[#070806] flex items-center justify-center">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(200,138,69,0.08),transparent_60%)]" />
            <div className="flex flex-col items-center gap-3 text-[#96978D]">
              <Compass className="w-10 h-10 text-[#C88A45]/60" />
              <span className="font-mono-code text-xs uppercase tracking-widest">Interface capture coming soon</span>
            </div>
          </div>
        </div>

        <button
          onClick={onLaunchApp}
          className="px-6 py-3.5 bg-[#121410] hover:bg-[#C88A45] border border-[#C88A45]/60 text-[#E8E4D8] hover:text-black font-mono-code text-xs font-semibold uppercase tracking-wider transition-all inline-flex items-center gap-3 cursor-pointer rounded-sm"
        >
          <span>Explore SatQuery</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </section>
  );
};
