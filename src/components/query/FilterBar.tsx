/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ObservationFilter, ObservationCategory, ObservationSeverity, ModalityType, ObservationDataStatus } from '../../types/observation';
import { Filter, X, SlidersHorizontal, Check } from 'lucide-react';

interface FilterBarProps {
  currentFilter: ObservationFilter;
  onFilterChange: (newFilter: ObservationFilter) => void;
  totalRegistryCount: number;
  filteredCount: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  currentFilter,
  onFilterChange,
  totalRegistryCount,
  filteredCount,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const categories: { label: string; value: ObservationCategory | 'ALL' }[] = [
    { label: 'All Domains', value: 'ALL' },
    { label: 'Deforestation', value: 'DEFORESTATION' },
    { label: 'Flood & Inundation', value: 'FLOOD' },
    { label: 'Wildfire Burn', value: 'WILDFIRE' },
    { label: 'Water Dynamics', value: 'WATER_CHANGE' },
    { label: 'Urban Growth', value: 'URBAN_EXPANSION' },
    { label: 'Agriculture', value: 'AGRICULTURE' },
    { label: 'Coastal Dynamics', value: 'COASTAL_CHANGE' },
  ];

  const severities: { label: string; value: ObservationSeverity | 'ALL' }[] = [
    { label: 'All Severities', value: 'ALL' },
    { label: 'Critical', value: 'CRITICAL' },
    { label: 'High', value: 'HIGH' },
    { label: 'Moderate', value: 'MODERATE' },
    { label: 'Low', value: 'LOW' },
  ];

  const modalities: { label: string; value: ModalityType | 'ALL' }[] = [
    { label: 'All Modalities', value: 'ALL' },
    { label: 'Optical (MSI/OLI)', value: 'OPTICAL' },
    { label: 'Radar (SAR C-Band)', value: 'SAR' },
  ];

  const dataStatuses: { label: string; value: ObservationDataStatus | 'ALL' }[] = [
    { label: 'All Data Status', value: 'ALL' },
    { label: 'Public Benchmark', value: 'PUBLIC_DATA' },
    { label: 'Demo Synthesized', value: 'DEMO_DATA' },
  ];

  const activeFilterCount = [
    currentFilter.category && currentFilter.category !== 'ALL',
    currentFilter.severity && currentFilter.severity !== 'ALL',
    currentFilter.modality && currentFilter.modality !== 'ALL',
    currentFilter.dataStatus && currentFilter.dataStatus !== 'ALL',
  ].filter(Boolean).length;

  const handleReset = () => {
    onFilterChange({
      category: 'ALL',
      severity: 'ALL',
      modality: 'ALL',
      dataStatus: 'ALL',
    });
  };

  return (
    <div className="relative">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`px-3 py-2 border text-xs font-mono-code flex items-center gap-2 transition-all select-none ${
          isOpen || activeFilterCount > 0
            ? 'bg-[#3df2ff]/20 border-[#3df2ff] text-white shadow-[0_0_15px_rgba(61,242,255,0.25)]'
            : 'bg-black/75 backdrop-blur-md border-white/20 text-white/70 hover:text-white hover:border-white/40'
        }`}
      >
        <SlidersHorizontal className="w-3.5 h-3.5 text-[#3df2ff]" />
        <span>REGISTRY FILTER</span>
        {activeFilterCount > 0 && (
          <span className="w-4 h-4 rounded-full bg-[#3df2ff] text-black font-bold text-[10px] flex items-center justify-center">
            {activeFilterCount}
          </span>
        )}
      </button>

      {/* Dropdown / Modal Overlay */}
      {isOpen && (
        <div className="absolute top-11 right-0 sm:left-0 sm:right-auto z-40 w-72 sm:w-88 bg-black/95 backdrop-blur-xl border border-white/20 p-4 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-[#3df2ff]" />
              <span className="text-xs font-mono-code font-bold text-white uppercase tracking-wider">
                Filter Observations ({filteredCount}/{totalRegistryCount})
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/40 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Category Filter */}
          <div className="space-y-1.5 font-mono-code">
            <label className="text-[9px] text-white/40 uppercase tracking-widest block">
              Domain / Category
            </label>
            <select
              value={currentFilter.category || 'ALL'}
              onChange={(e) =>
                onFilterChange({
                  ...currentFilter,
                  category: e.target.value as ObservationCategory | 'ALL',
                })
              }
              className="w-full bg-white/5 border border-white/15 text-xs text-white p-2 outline-none focus:border-[#3df2ff]"
            >
              {categories.map((c) => (
                <option key={c.value} value={c.value} className="bg-neutral-900 text-white">
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Severity Filter */}
          <div className="space-y-1.5 font-mono-code">
            <label className="text-[9px] text-white/40 uppercase tracking-widest block">
              Severity Level
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {severities.map((s) => {
                const isSelected = (currentFilter.severity || 'ALL') === s.value;
                return (
                  <button
                    key={s.value}
                    onClick={() =>
                      onFilterChange({
                        ...currentFilter,
                        severity: s.value,
                      })
                    }
                    className={`py-1.5 px-2 text-[10px] uppercase border transition-all text-left flex items-center justify-between ${
                      isSelected
                        ? 'bg-white/20 border-[#3df2ff] text-white font-bold'
                        : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                    }`}
                  >
                    <span>{s.label}</span>
                    {isSelected && <Check className="w-2.5 h-2.5 text-[#3df2ff]" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Modality Filter */}
          <div className="space-y-1.5 font-mono-code">
            <label className="text-[9px] text-white/40 uppercase tracking-widest block">
              Sensor Modality
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {modalities.map((m) => {
                const isSelected = (currentFilter.modality || 'ALL') === m.value;
                return (
                  <button
                    key={m.value}
                    onClick={() =>
                      onFilterChange({
                        ...currentFilter,
                        modality: m.value,
                      })
                    }
                    className={`py-1.5 px-2 text-[10px] uppercase border transition-all text-left flex items-center justify-between ${
                      isSelected
                        ? 'bg-white/20 border-[#3df2ff] text-white font-bold'
                        : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                    }`}
                  >
                    <span>{m.label.split(' ')[0]}</span>
                    {isSelected && <Check className="w-2.5 h-2.5 text-[#3df2ff]" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Data Status Filter */}
          <div className="space-y-1.5 font-mono-code">
            <label className="text-[9px] text-white/40 uppercase tracking-widest block">
              Data Provenance Status
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {dataStatuses.map((d) => {
                const isSelected = (currentFilter.dataStatus || 'ALL') === d.value;
                return (
                  <button
                    key={d.value}
                    onClick={() =>
                      onFilterChange({
                        ...currentFilter,
                        dataStatus: d.value,
                      })
                    }
                    className={`py-1.5 px-2 text-[10px] uppercase border transition-all text-left flex items-center justify-between ${
                      isSelected
                        ? 'bg-white/20 border-[#3df2ff] text-white font-bold'
                        : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                    }`}
                  >
                    <span>{d.label.split(' ')[0]}</span>
                    {isSelected && <Check className="w-2.5 h-2.5 text-[#3df2ff]" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reset & Apply Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-white/10 font-mono-code">
            <button
              onClick={handleReset}
              className="text-[10px] text-white/50 hover:text-white underline uppercase"
            >
              Reset Filters
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="px-3 py-1 bg-[#3df2ff] text-black text-xs font-bold uppercase hover:bg-white transition-all"
            >
              Apply Filter
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
