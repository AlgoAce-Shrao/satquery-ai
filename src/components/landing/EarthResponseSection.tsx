/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CheckCircle2, MapPin, ShieldCheck } from 'lucide-react';

export const EarthResponseSection: React.FC = () => {
  const bullets = [
    'Sub-pixel bi-temporal change detection',
    'Interactive historical baseline comparison',
    'Delineated bounding polygons & geometric metrics',
    'Heuristic confidence, computed from real signal',
  ];

  return (
    <section className="relative py-28 sm:py-36 px-6 sm:px-12 lg:px-20 text-[#E8E4D8] z-10 border-t border-white/10 bg-gradient-to-b from-black/20 via-[#080907]/80 to-black/30 backdrop-blur-[2px]">
      <div className="max-w-7xl mx-auto space-y-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Column: Story & Benefits */}
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#121410] border border-white/10 text-[#96978D] text-[10px] font-mono-code rounded-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C88A45]" />
              <span className="uppercase tracking-[0.18em] text-[#C88A45] font-medium">
                Visual Evidence
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold uppercase tracking-tight text-[#E8E4D8] font-sans leading-tight">
              The answer stays connected
              <br />
              <span className="text-[#C88A45]">to what was observed.</span>
            </h2>
            <p className="text-sm sm:text-base text-[#96978D] font-sans leading-relaxed font-light">
              SatQuery does not just deliver a text summary. It grounds every insight with the
              satellite raster, region outline, and baseline it was actually derived from.
            </p>

            <div className="space-y-2.5 pt-2 font-sans text-sm text-[#E8E4D8]/90">
              {bullets.map((b, idx) => (
                <div key={idx} className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#7F8C63] shrink-0" />
                  <span className="text-xs sm:text-sm text-[#96978D]">{b}</span>
                </div>
              ))}
            </div>

            <div className="p-4 bg-[#0a0c08] border border-white/10 rounded-xs space-y-1 font-mono-code text-xs">
              <div className="flex items-center gap-2 text-[#C88A45] font-semibold">
                <ShieldCheck className="w-4 h-4" />
                <span>EPHEMERIS GROUND TRUTH</span>
              </div>
              <p className="text-[#96978D] text-[11px] font-sans">
                Every calculation is reproducible against open Copernicus Sentinel-2 Level-2A and
                USGS Landsat surface reflectance rasters.
              </p>
            </div>
          </div>

          {/* Right Column: Illustrative evidence composition (not a live result) */}
          <div className="lg:col-span-7 space-y-3">
            <div className="relative rounded-xs border border-white/15 bg-[#0a0c08] overflow-hidden shadow-2xl">
              <div className="relative h-96 sm:h-[28rem] w-full overflow-hidden select-none">
                {/* Illustrative terrain render */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#0c2014] via-[#142e1b] to-[#0a180e]" />
                <div className="absolute inset-0 bg-[radial-gradient(#ffffff_0.6px,transparent_0.6px)] opacity-10 [background-size:16px_16px]" />
                <svg className="absolute inset-0 w-full h-full opacity-40 pointer-events-none" viewBox="0 0 600 480" preserveAspectRatio="none">
                  <path d="M 0 220 Q 160 180 320 250 T 600 230" stroke="#1b4229" strokeWidth="5" fill="none" />
                  <path d="M 250 0 Q 280 190 370 300 T 460 420" stroke="#122c42" strokeWidth="6" fill="none" />
                  <path d="M 60 60 Q 220 110 300 70" stroke="#1f3624" strokeWidth="3" fill="none" />
                  <path d="M 400 340 Q 480 300 560 350" stroke="#1f3624" strokeWidth="2" fill="none" />
                </svg>

                {/* Restrained evidence overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-56 h-40 sm:w-64 sm:h-44 border-2 border-[#C88A45]/70 rounded-xs relative">
                    <div className="absolute -top-7 left-0 px-2 py-0.5 bg-[#C88A45] text-black text-[9.5px] font-mono-code font-semibold uppercase tracking-wider rounded-xs">
                      Evidence Region
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-[#C88A45]/80" />
                    </div>
                  </div>
                </div>

                <div className="absolute top-3 left-3 font-mono-code text-[9.5px] text-[#7F8C63] bg-black/70 px-2 py-1 border border-white/10 rounded-xs">
                  OBSERVATION &bull; SENTINEL-2 MSI
                </div>
                <div className="absolute bottom-3 right-3 font-mono-code text-[9px] text-[#96978D]/70 bg-black/60 px-2 py-1 border border-white/10 rounded-xs">
                  Illustrative render &mdash; not a live analysis result
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
