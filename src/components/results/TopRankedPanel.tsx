/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AnalysisResult } from '../../types/geospatial';
import { ChevronDown, ChevronUp, BarChart2, Radio, Filter } from 'lucide-react';

interface TopRankedPanelProps {
  results: AnalysisResult[];
  currentIndex: number;
  onSelectIndex: (index: number) => void;
}

export const TopRankedPanel: React.FC<TopRankedPanelProps> = ({
  results,
  currentIndex,
  onSelectIndex,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (results.length === 0) return null;

  return (
    <div className="absolute top-16 sm:top-20 right-6 z-20 w-72 sm:w-88 bg-black/85 backdrop-blur-xl border border-white/15 shadow-2xl transition-all select-none">
      {/* Header Bar */}
      <div
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="flex items-center justify-between px-3.5 py-2.5 border-b border-white/10 bg-white/5 cursor-pointer hover:bg-white/10 transition-colors"
      >
        <div className="flex items-center gap-2">
          <BarChart2 className="w-3.5 h-3.5 text-[#3df2ff]" />
          <h4 className="text-[11px] font-mono-code font-bold text-white uppercase tracking-wider">
            Ranked Observations ({results.length})
          </h4>
        </div>
        <button className="text-white/60 hover:text-white transition-colors">
          {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Ranked Item List */}
      {!isCollapsed && (
        <div className="max-h-72 sm:max-h-80 overflow-y-auto divide-y divide-white/5 custom-scrollbar">
          {results.map((res, idx) => {
            const isActive = idx === currentIndex;
            const isNegative = res.metric.percentageChange < 0;

            return (
              <div
                key={res.id}
                onClick={() => onSelectIndex(idx)}
                className={`flex items-center justify-between px-3.5 py-2 cursor-pointer transition-all ${
                  isActive
                    ? 'bg-[#3df2ff]/15 border-l-4 border-l-[#3df2ff] text-white'
                    : 'hover:bg-white/5 text-white/70 hover:text-white'
                }`}
              >
                {/* Left: Rank + Name + Category */}
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <span
                    className={`text-[10px] font-mono-code font-bold w-4 text-center shrink-0 ${
                      isActive ? 'text-[#3df2ff]' : 'text-white/40'
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-sans font-medium truncate">{res.regionName}</p>
                    <div className="flex items-center gap-1.5 text-[9px] text-white/50 font-mono-code truncate">
                      <span>{res.country}</span>
                      <span>•</span>
                      <span className="text-[#3df2ff] uppercase">{res.category.slice(0, 12)}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Metric Delta */}
                <div className="text-right shrink-0">
                  <span
                    className={`text-xs font-mono-code font-bold ${
                      isNegative ? 'text-[#ff4e00]' : 'text-[#22c55e]'
                    }`}
                  >
                    {isNegative ? '' : '+'}
                    {res.metric.percentageChange}%
                  </span>
                  <p className="text-[8px] font-mono-code text-white/40 uppercase">
                    {res.metric.severity}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
