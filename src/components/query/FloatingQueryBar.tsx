import React, { useState } from 'react';
import { ArrowRight, Sparkles, Compass, Search } from 'lucide-react';

interface FloatingQueryBarProps {
  currentQuery: string;
  isProcessing: boolean;
  onSubmitQuery: (query: string) => void;
}

const SUGGESTIONS = [
  'Show me areas where vegetation decreased.',
  'Show me areas where vegetation decreased in India.',
  'Show me areas where water bodies expanded.',
  'Analyze wildfire burn scars in the Mediterranean.',
  'Find areas of rapid urban expansion.',
];

export const FloatingQueryBar: React.FC<FloatingQueryBarProps> = ({
  currentQuery,
  isProcessing,
  onSubmitQuery,
}) => {
  const [inputValue, setInputValue] = useState(currentQuery);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isProcessing) return;
    onSubmitQuery(inputValue.trim());
    setShowSuggestions(false);
  };

  const handleSelectSuggestion = (suggestion: string) => {
    setInputValue(suggestion);
    onSubmitQuery(suggestion);
    setShowSuggestions(false);
  };

  return (
    <div className="absolute bottom-16 sm:bottom-20 left-1/2 -translate-x-1/2 w-[92%] max-w-2xl z-30 flex flex-col items-center gap-2">
      {/* Floating Query Command Bar */}
      <form
        onSubmit={handleSubmit}
        className="w-full bg-black/85 backdrop-blur-xl border border-white/20 hover:border-[#3df2ff]/50 focus-within:border-[#3df2ff] p-2 sm:p-2.5 shadow-2xl transition-all flex items-center gap-3 relative group"
      >
        <div className="pl-2 flex items-center gap-2 text-white/50 group-focus-within:text-[#3df2ff] transition-colors">
          <Search className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
        </div>

        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          placeholder="Ask SatQuery about Earth... (e.g. Show me areas where vegetation decreased)"
          disabled={isProcessing}
          className="flex-1 bg-transparent text-sm sm:text-base text-white placeholder-white/40 focus:outline-none font-sans font-medium"
        />

        <button
          type="submit"
          disabled={isProcessing || !inputValue.trim()}
          className={`px-4 sm:px-5 py-2 sm:py-2.5 font-mono-code text-xs sm:text-sm font-bold uppercase tracking-wider transition-all flex items-center gap-2 active:scale-95 shrink-0 ${
            isProcessing
              ? 'bg-white/10 text-white/40 cursor-wait'
              : 'bg-[#3df2ff] text-black hover:bg-white shadow-[0_0_20px_rgba(61,242,255,0.4)]'
          }`}
        >
          <span>{isProcessing ? 'Analyzing...' : 'Investigate'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      {/* Suggested Natural Language Queries Pills */}
      <div className="flex flex-wrap items-center justify-center gap-1.5 max-w-2xl px-2">
        <span className="text-[10px] font-mono-code text-white/40 uppercase tracking-widest mr-1 hidden sm:inline">
          Suggestions:
        </span>
        {SUGGESTIONS.map((sug, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSelectSuggestion(sug)}
            className="text-[10px] sm:text-[11px] font-mono-code px-2.5 py-1 bg-black/60 hover:bg-white/15 border border-white/10 text-white/70 hover:text-white transition-all backdrop-blur-md rounded-none active:scale-95"
          >
            {sug}
          </button>
        ))}
      </div>
    </div>
  );
};
