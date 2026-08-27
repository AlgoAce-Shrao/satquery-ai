/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Search, X, Sparkles, Globe2, Compass, ArrowRight, CornerDownLeft, Filter } from 'lucide-react';

interface QueryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitQuery: (query: string) => void;
  currentQuery: string;
}

export const QueryModal: React.FC<QueryModalProps> = ({
  isOpen,
  onClose,
  onSubmitQuery,
  currentQuery,
}) => {
  const [inputVal, setInputVal] = useState(currentQuery);

  if (!isOpen) return null;

  const PRESETS = [
    {
      category: 'Phase 2 Core Demonstration Scenarios',
      queries: [
        'Describe the major land-cover types visible in this image.',
        'Highlight the water body referred to in the query.',
        'What changed between these two dates?',
        'Has the built-up area increased?',
        'Use the optical and SAR images together to identify built-up and water-covered regions.',
      ],
    },
    {
      category: 'Deforestation & Canopy Loss',
      queries: [
        'Globally, find the 10 regions that experienced the largest decrease in vegetation over the last year.',
        'Detect rapid deforestation in Mato Grosso and the Amazon arc of deforestation.',
        'Show canopy loss and peatland clearing in Central Kalimantan and Sumatra.',
        'Track commercial logging in the Congo Basin (Salonga National Park).',
      ],
    },
    {
      category: 'Flooding & SAR Radar Mapping',
      queries: [
        'Show major flood inundation events detected with Sentinel-1 SAR.',
        'Detect monsoon river swelling and wetland inundation in Assam Brahmaputra Valley.',
        'Show catastrophic flash flooding in Valencia, Spain and Emilia-Romagna, Italy.',
        'Find Indus Basin monsoon inundation in Sindh, Pakistan.',
      ],
    },
    {
      category: 'Water Body Desiccation & Shrinkage',
      queries: [
        'Which inland water bodies experienced extreme desiccation and shoreline retreat?',
        'Detect lake surface shrinkage in Lake Urmia and the Aral Sea.',
        'Show reservoir depletion and bathtub rings at Lake Mead, Nevada.',
        'Track wetland desiccation in Lake Chad and the Sistan Basin.',
      ],
    },
    {
      category: 'Wildfire Burn Scars & Severity',
      queries: [
        'Analyze high-severity wildfire burn scars and crown damage in the Mediterranean.',
        'Show mega-fire burn perimeter and carbon release in Attica & Rhodes, Greece.',
        'Detect boreal forest wildfires in Jasper, Alberta and Yellowknife, Canada.',
        'Find Blue Mountains eucalyptus bushfire burn scars in Australia.',
      ],
    },
    {
      category: 'Urban Growth & Built-Up Expansion',
      queries: [
        'Find regions where urban impervious surfaces expanded rapidly.',
        'Show desert metropolis expansion in New Administrative Capital, Egypt.',
        'Track technology corridor urbanization in Bengaluru East, India.',
      ],
    },
    {
      category: 'Agriculture & Crop Stress',
      queries: [
        'Show agricultural post-harvest residue clearing in Punjab, India.',
        'Detect center-pivot irrigation expansion in the Nile Delta.',
      ],
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputVal.trim()) {
      onSubmitQuery(inputVal.trim());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-[#0a0a0c] border border-white/20 p-6 sm:p-8 shadow-[0_0_80px_rgba(0,0,0,0.9)] flex flex-col gap-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="space-y-1">
            <h3 className="text-xl font-bold uppercase tracking-tight text-white flex items-center gap-2">
              <Globe2 className="w-5 h-5 text-[#3df2ff]" />
              <span>Geospatial Intelligence Query</span>
            </h3>
            <p className="text-[10px] font-mono-code text-white/40 uppercase tracking-widest">
              Natural Language Remote Sensing Engine (38 Global Observations Registry)
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/40 hover:text-white border border-transparent hover:border-white/20 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="text-[10px] font-bold tracking-[0.2em] text-[#ff4e00] uppercase font-mono-code">
            Natural Language Command
          </label>
          <div className="relative flex items-center">
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="e.g. Find areas where vegetation decreased, or show flood events in Assam..."
              className="w-full bg-black/60 border border-white/20 focus:border-[#3df2ff] px-4 py-3.5 text-sm sm:text-base font-serif-editorial italic text-white placeholder:text-white/30 focus:outline-none transition-all shadow-inner pr-28"
              autoFocus
            />
            <button
              type="submit"
              className="absolute right-2 px-4 py-2 bg-[#3df2ff] hover:bg-white text-black font-black text-[10px] font-mono-code uppercase tracking-widest transition-all flex items-center gap-1.5 shadow-lg"
            >
              <span>Execute</span>
              <CornerDownLeft className="w-3 h-3" />
            </button>
          </div>
        </form>

        {/* Presets List */}
        <div className="space-y-4">
          <p className="text-[10px] font-bold tracking-widest text-white/40 uppercase font-mono-code">
            Curated Scientific Investigation Prompts
          </p>
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {PRESETS.map((group, gIdx) => (
              <div key={gIdx} className="space-y-1.5">
                <span className="text-[9px] font-mono-code text-[#3df2ff] uppercase tracking-wider font-bold">
                  // {group.category}
                </span>
                <div className="space-y-1">
                  {group.queries.map((q, qIdx) => (
                    <button
                      key={qIdx}
                      type="button"
                      onClick={() => {
                        setInputVal(q);
                        onSubmitQuery(q);
                        onClose();
                      }}
                      className="w-full text-left p-2.5 bg-white/[0.02] hover:bg-white/10 border border-white/10 text-xs text-white/80 hover:text-white transition-all font-serif-editorial italic flex items-center justify-between group"
                    >
                      <span>&ldquo;{q}&rdquo;</span>
                      <ArrowRight className="w-3.5 h-3.5 text-white/20 group-hover:text-[#3df2ff] transition-colors shrink-0 ml-2" />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
