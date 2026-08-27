import React from 'react';
import { AnalysisResult } from '../../types/geospatial';
import { Play, Pause, ChevronLeft, ChevronRight, Compass } from 'lucide-react';

interface TourControlsProps {
  results: AnalysisResult[];
  currentIndex: number;
  isTourActive: boolean;
  onSelectIndex: (index: number) => void;
  onToggleTour: () => void;
  onPrevious: () => void;
  onNext: () => void;
}

export const TourControls: React.FC<TourControlsProps> = ({
  results,
  currentIndex,
  isTourActive,
  onSelectIndex,
  onToggleTour,
  onPrevious,
  onNext,
}) => {
  if (results.length === 0) return null;

  const currentResult = results[currentIndex];

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2 select-none">
      {/* Tour Progress Indicators */}
      <div className="flex items-center gap-2 bg-black/85 backdrop-blur-md px-4 py-1.5 border border-white/15 shadow-2xl">
        <span className="text-[10px] font-mono-code font-bold text-white/70 uppercase tracking-widest">
          RESULT {currentIndex + 1} OF {results.length}
        </span>
        <span className="text-white/30">•</span>
        <span className="text-[10px] font-mono-code text-[#3df2ff] font-bold">
          {currentResult?.siteCode || `SITE_${currentIndex + 1}`}
        </span>

        <div className="flex items-center gap-1.5 ml-2.5">
          {results.map((r, idx) => (
            <button
              key={r.id}
              onClick={() => onSelectIndex(idx)}
              title={`${idx + 1}. ${r.regionName}`}
              className={`h-1.5 transition-all ${
                idx === currentIndex
                  ? 'w-6 bg-[#ff4e00]'
                  : 'w-1.5 bg-white/25 hover:bg-white/60'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Main Tour Buttons */}
      <div className="flex items-center gap-2 font-mono-code">
        <button
          onClick={onPrevious}
          className="px-4 py-2 bg-black/80 hover:bg-white/15 border border-white/20 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-white transition-all flex items-center gap-1.5 active:scale-95 shadow-xl"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Previous</span>
        </button>

        <button
          onClick={onToggleTour}
          className={`px-6 py-2 font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 active:scale-95 shadow-2xl ${
            isTourActive
              ? 'bg-[#ff4e00] text-black shadow-[0_0_25px_rgba(255,78,0,0.5)]'
              : 'bg-[#3df2ff] text-black hover:bg-white shadow-[0_0_20px_rgba(61,242,255,0.4)]'
          }`}
        >
          {isTourActive ? (
            <>
              <Pause className="w-3.5 h-3.5 fill-current" />
              <span>Pause Tour</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Resume Tour</span>
            </>
          )}
        </button>

        <button
          onClick={onNext}
          className="px-4 py-2 bg-black/80 hover:bg-white/15 border border-white/20 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-white transition-all flex items-center gap-1.5 active:scale-95 shadow-xl"
        >
          <span>Next</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
