/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Search,
  ArrowRight,
  SlidersHorizontal,
  Compass,
  Database,
  Upload,
} from 'lucide-react';
import { ObservationFilter } from '../../types/observation';
import { FilterBar } from '../query/FilterBar';

interface HeaderProps {
  observationId: string;
  currentQuery: string;
  isProcessing: boolean;
  onOpenQueryModal: () => void;
  onOpenImageUpload?: () => void;
  onNavigateToLanding?: () => void;
  onSubmitQuery: (query: string) => void;
  currentFilter?: ObservationFilter;
  onFilterChange?: (newFilter: ObservationFilter) => void;
  totalRegistryCount?: number;
  filteredCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  observationId,
  currentQuery,
  isProcessing,
  onOpenQueryModal,
  onOpenImageUpload,
  onNavigateToLanding,
  onSubmitQuery,
  currentFilter,
  onFilterChange,
  totalRegistryCount = 38,
  filteredCount = 38,
}) => {
  const [inputValue, setInputValue] = useState(currentQuery);

  useEffect(() => {
    setInputValue(currentQuery);
  }, [currentQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isProcessing) return;
    onSubmitQuery(inputValue.trim());
  };

  return (
    <header className="flex items-center justify-between px-4 sm:px-6 py-2.5 border-b border-white/10 bg-sq-base shrink-0 select-none z-30 gap-3 sm:gap-4">
      {/* Brand / Title */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onNavigateToLanding}
          title="Return to SatQuery Overview"
          className="text-left space-y-0.5 group cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black tracking-tighter leading-none text-white uppercase font-sans group-hover:text-sq-accent transition-colors">
              SatQuery <span className="text-sq-accent">AI</span>
            </h1>
            <span className="hidden xl:inline-block text-[8px] font-mono-code px-1.5 py-0.5 border border-sq-accent/30 text-sq-accent bg-sq-accent/10 uppercase font-bold tracking-widest">
              Live
            </span>
          </div>
          <p className="text-[8px] tracking-[0.25em] font-bold text-white/40 uppercase font-mono-code hidden sm:block group-hover:text-white/60 transition-colors">
            Earth Observation Intelligence
          </p>
        </button>
      </div>

      {/* Center: Integrated Top Natural-Language Search Command Bar + Registry Filter */}
      <div className="flex-1 max-w-3xl flex items-center gap-2">
        <form
          onSubmit={handleSubmit}
          className="flex-1 bg-black/70 hover:bg-black/90 border border-white/20 hover:border-sq-accent/50 focus-within:border-sq-accent px-3 py-1.5 shadow-lg transition-all flex items-center gap-2"
        >
          <Search className="w-4 h-4 text-white/40 shrink-0" />
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask SatQuery... (e.g. Find top regions where vegetation decreased, or show flood in Assam)"
            disabled={isProcessing}
            className="flex-1 bg-transparent text-xs sm:text-sm text-white placeholder-white/40 focus:outline-none font-sans font-medium"
          />
          <button
            type="submit"
            disabled={isProcessing || !inputValue.trim()}
            className={`px-3 py-1 font-sans text-[11px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 shrink-0 ${
              isProcessing
                ? 'bg-white/10 text-white/40 cursor-wait'
                : 'bg-sq-accent text-black hover:bg-sq-accent-hover'
            }`}
          >
            <span>{isProcessing ? 'Analyzing...' : 'Investigate'}</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </form>

        {/* Registry Filter Dropdown Control */}
        {currentFilter && onFilterChange && (
          <FilterBar
            currentFilter={currentFilter}
            onFilterChange={onFilterChange}
            totalRegistryCount={totalRegistryCount}
            filteredCount={filteredCount}
          />
        )}
      </div>

      {/* Right Controls & Current Observation */}
      <div className="flex items-center gap-3 sm:gap-4 shrink-0">
        <div className="text-right hidden lg:block">
          <p className="text-[8px] tracking-widest text-white/40 uppercase font-mono-code">
            Current Observation
          </p>
          <p className="text-xs font-mono-code text-sq-accent font-bold tracking-wider">
            {observationId}
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-white/60">
          {onOpenImageUpload && (
            <button
              onClick={onOpenImageUpload}
              title="Upload an image to analyze"
              aria-label="Upload an image to analyze"
              className="px-2 py-1.5 bg-sq-accent/10 hover:bg-sq-accent/20 text-sq-accent border border-sq-accent/40 hover:border-sq-accent transition-colors flex items-center gap-1.5 text-[10px] font-sans uppercase font-bold"
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Upload image</span>
            </button>
          )}
          <button
            onClick={onOpenQueryModal}
            title="Explore Query Prompts (⌘K)"
            className="p-1.5 hover:bg-white/10 text-white/70 hover:text-white transition-colors border border-white/10"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
          <button
            title="User Profile"
            className="w-7 h-7 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white/80 hover:text-white hover:border-sq-accent transition-all text-xs font-sans font-bold ml-1"
          >
            AI
          </button>
        </div>
      </div>
    </header>
  );
};
