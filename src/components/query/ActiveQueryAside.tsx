import React from 'react';
import { QueryExecutionState, StructuredQuery } from '../../types/geospatial';
import { Sparkles, Terminal, Activity, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';

interface ActiveQueryAsideProps {
  executionState: QueryExecutionState;
  onOpenQueryModal: () => void;
  onSelectSuggestedQuery: (query: string) => void;
}

export const ActiveQueryAside: React.FC<ActiveQueryAsideProps> = ({
  executionState,
  onOpenQueryModal,
  onSelectSuggestedQuery,
}) => {
  const { rawQuery, structuredQuery, status, steps, systemMessage } = executionState;

  const SUGGESTED_QUERIES = [
    'Show me areas where vegetation decreased significantly during the last year.',
    'Identify regions with extreme lake or water body desiccation.',
    'Find areas experiencing rapid urban impervious surface expansion.',
    'Analyze high-severity wildfire burn scars in the Mediterranean.',
  ];

  return (
    <aside className="w-full lg:w-[300px] xl:w-[320px] border-r border-white/10 p-6 sm:p-8 flex flex-col justify-between bg-black/40 backdrop-blur-md overflow-y-auto shrink-0 z-10">
      <div className="space-y-7">
        {/* Active Query Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold tracking-[0.2em] text-[#ff4e00] uppercase flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ff4e00] animate-ping"></span>
              Active Query
            </label>
            <button
              onClick={onOpenQueryModal}
              className="text-[9px] font-mono-code uppercase tracking-widest text-[#3df2ff] hover:underline"
            >
              [Change]
            </button>
          </div>
          <p className="text-xl sm:text-2xl font-light italic leading-tight text-white/90 font-serif-editorial">
            &ldquo;{rawQuery}&rdquo;
          </p>
        </div>

        {/* Process Stream & Telemetry Steps */}
        <div className="space-y-3">
          <div className="flex justify-between items-center text-[10px] font-bold text-white/40 border-b border-white/10 pb-1.5 uppercase tracking-wider">
            <span>Process Stream</span>
            <span>Status</span>
          </div>

          <div className="space-y-2.5 mt-3 font-mono-code">
            {/* 1. Query Intent */}
            <div className="flex items-center justify-between text-xs py-1">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-2 h-2 rounded-full transition-all ${
                    status === 'PROCESSING' || status === 'COMPLETED'
                      ? 'bg-[#3df2ff] shadow-[0_0_8px_#3df2ff]'
                      : 'bg-white/20'
                  }`}
                ></div>
                <span className="text-white/80 text-[11px]">
                  Intent: <span className="text-white font-semibold">{structuredQuery.intent}</span>
                </span>
              </div>
              <span className="text-[10px] text-[#3df2ff]/90 uppercase font-bold">
                {status === 'IDLE' ? 'Ready' : 'OK'}
              </span>
            </div>

            {/* 2. Spatial Search */}
            <div className="flex items-center justify-between text-xs py-1">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-2 h-2 rounded-full transition-all ${
                    steps[1]?.status === 'COMPLETED'
                      ? 'bg-[#3df2ff] shadow-[0_0_8px_#3df2ff]'
                      : steps[1]?.status === 'RUNNING'
                      ? 'bg-[#ff4e00] animate-ping'
                      : 'bg-white/20'
                  }`}
                ></div>
                <span className={`text-[11px] ${steps[1]?.status === 'COMPLETED' ? 'text-white/80' : 'text-white/40'}`}>
                  Spatial: <span className="text-white font-semibold">{structuredQuery.spatialScope}</span>
                </span>
              </div>
              <span className="text-[10px] text-white/40 uppercase">
                {steps[1]?.status === 'COMPLETED' ? 'Active' : steps[1]?.status === 'RUNNING' ? 'Searching' : 'Queued'}
              </span>
            </div>

            {/* 3. NDVI/Spectral Analysis */}
            <div className="flex items-center justify-between text-xs py-1">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-2 h-2 rounded-full transition-all ${
                    steps[2]?.status === 'COMPLETED'
                      ? 'bg-[#3df2ff] shadow-[0_0_8px_#3df2ff]'
                      : steps[2]?.status === 'RUNNING'
                      ? 'bg-[#ff4e00] animate-ping'
                      : 'bg-white/20'
                  }`}
                ></div>
                <span className={`text-[11px] ${steps[2]?.status === 'COMPLETED' ? 'text-white/80' : 'text-white/40'}`}>
                  Analysis: <span className="text-white font-semibold">{structuredQuery.targetMetric.split(' ')[0]}</span>
                </span>
              </div>
              <span className="text-[10px] text-white/40 uppercase">
                {steps[2]?.status === 'COMPLETED' ? 'Done' : steps[2]?.status === 'RUNNING' ? 'Diffing' : 'Queued'}
              </span>
            </div>

            {/* 4. Evidence Validation */}
            <div className="flex items-center justify-between text-xs py-1">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-2 h-2 rounded-full transition-all ${
                    steps[3]?.status === 'COMPLETED'
                      ? 'bg-[#3df2ff] shadow-[0_0_8px_#3df2ff]'
                      : 'bg-white/20'
                  }`}
                ></div>
                <span className={`text-[11px] ${steps[3]?.status === 'COMPLETED' ? 'text-white/80' : 'text-white/40'}`}>
                  Evidence: <span className="text-white font-semibold">91% Conf</span>
                </span>
              </div>
              <span className="text-[10px] text-white/40 uppercase">
                {steps[3]?.status === 'COMPLETED' ? 'Valid' : 'Pending'}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Query Selector Chips */}
        <div className="space-y-2 pt-2">
          <p className="text-[10px] font-bold tracking-widest text-white/40 uppercase">Quick Query Presets</p>
          <div className="space-y-1.5">
            {SUGGESTED_QUERIES.map((q, idx) => (
              <button
                key={idx}
                onClick={() => onSelectSuggestedQuery(q)}
                className={`w-full text-left p-2 border transition-all text-[11px] leading-snug font-serif-editorial italic ${
                  rawQuery === q
                    ? 'bg-[#ff4e00]/10 border-[#ff4e00]/50 text-[#ff4e00]'
                    : 'bg-white/[0.02] border-white/10 text-white/60 hover:text-white hover:border-white/25 hover:bg-white/5'
                }`}
              >
                &ldquo;{q}&rdquo;
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* System Message Container */}
      <div className="mt-6 p-4 bg-white/5 rounded-none border border-white/10 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-[10px] text-white/40 uppercase tracking-widest font-mono-code font-bold">System Message</p>
          <span className="text-[9px] font-mono-code text-[#3df2ff]">EO-ANALYSIS-V1</span>
        </div>
        <p className="text-xs leading-relaxed text-white/70 font-sans">
          {systemMessage}
        </p>
      </div>
    </aside>
  );
};
