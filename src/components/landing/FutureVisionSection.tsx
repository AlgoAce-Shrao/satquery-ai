/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Mic, Volume2 } from 'lucide-react';

export const FutureVisionSection: React.FC = () => {
  const [waveHeights, setWaveHeights] = useState<number[]>([
    6, 12, 22, 38, 48, 28, 40, 56, 34, 18, 38, 60, 44, 22, 32, 50, 28, 14, 8, 16, 34, 54, 30, 16, 8,
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setWaveHeights((prev) =>
        prev.map((h) => Math.max(4, Math.min(58, h + (Math.random() - 0.5) * 16)))
      );
    }, 120);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative py-28 sm:py-36 px-6 sm:px-12 lg:px-20 text-[#E8E4D8] z-10 border-t border-white/10 bg-gradient-to-b from-black/20 via-[#080907]/80 to-black/30 backdrop-blur-[2px]">
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#121410] border border-white/10 text-[#96978D] text-[10px] font-mono-code rounded-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-[#C88A45]" />
          <span className="uppercase tracking-[0.18em] text-[#C88A45] font-medium">
            Next-Generation Interfaces
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Headline */}
          <div className="lg:col-span-5 space-y-3">
            <h2 className="text-3xl sm:text-5xl font-bold uppercase tracking-tight text-[#E8E4D8] font-sans leading-tight">
              Soon, you won't even need to type.
              <br />
              <span className="text-[#C88A45]">You'll just talk.</span>
            </h2>
            <p className="text-sm sm:text-base text-[#96978D] font-sans leading-relaxed font-light pt-1">
              Conversational voice intelligence is coming to orbital analytics. Ask questions in natural spoken dialogue while flying through real-time 3D planetary observations.
            </p>
          </div>

          {/* Center: Live Waveform Visualizer Console */}
          <div className="lg:col-span-4 p-6 bg-[#0a0c08] border border-white/15 rounded-xs space-y-4 shadow-xl flex flex-col items-center justify-center">
            {/* Audio visualization bar display (Muted Amber) */}
            <div className="flex items-center justify-center gap-1 sm:gap-1.5 h-18 w-full px-2">
              {waveHeights.map((height, idx) => (
                <div
                  key={idx}
                  className="w-1 sm:w-1.5 bg-[#C88A45]/80 rounded-full transition-all duration-100"
                  style={{ height: `${height}px` }}
                />
              ))}
            </div>

            {/* Status indicators */}
            <div className="flex items-center justify-between w-full font-mono-code text-xs text-[#96978D] border-t border-white/10 pt-3">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C88A45]" />
                <span className="text-[#E8E4D8] text-[11px] font-medium">&bull; Spoken Spatial Query</span>
              </div>
              <span className="text-[#96978D] text-[10px]">24 kHz PCM</span>
            </div>
          </div>

          {/* Right Transcription & Intent Pipeline */}
          <div className="lg:col-span-3 space-y-3 font-mono-code text-xs">
            <div className="p-4 bg-[#0a0c08] border border-white/10 rounded-xs space-y-1">
              <span className="text-[10px] text-[#C88A45] uppercase block font-medium">LIVE TRANSCRIPTION</span>
              <p className="text-[#E8E4D8] font-sans italic text-xs">
                "Show me lake surface shrinkage across East Africa over the last decade..."
              </p>
            </div>

            <div className="p-4 bg-[#0a0c08] border border-white/10 rounded-xs space-y-1">
              <span className="text-[10px] text-[#96978D] uppercase block">RESOLVED SPATIAL BOUNDS</span>
              <p className="text-[#B8A06A] text-xs">
                Target: Lake Victoria Basin [0.5°S, 33.0°E]
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
