import React from 'react';
import { ProcessStep } from '../../types/geospatial';
import { Loader2, CheckCircle2, Circle, Compass, Sparkles, Activity } from 'lucide-react';

interface InvestigationStatusHUDProps {
  query: string;
  steps: ProcessStep[];
  currentStepIndex: number;
}

export const InvestigationStatusHUD: React.FC<InvestigationStatusHUDProps> = ({
  query,
  steps,
  currentStepIndex,
}) => {
  return (
    <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40 w-[90%] max-w-md bg-black/90 backdrop-blur-xl border border-[#3df2ff]/40 p-5 shadow-[0_0_50px_rgba(61,242,255,0.15)] animate-in fade-in duration-300">
      <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#3df2ff] animate-ping"></span>
          <span className="text-xs font-mono-code font-bold text-[#3df2ff] uppercase tracking-widest">
            SatQuery Autonomous Investigation
          </span>
        </div>
        <Loader2 className="w-4 h-4 text-[#3df2ff] animate-spin" />
      </div>

      <p className="text-sm font-serif-editorial italic text-white/90 mb-4 px-1">
        &ldquo;{query}&rdquo;
      </p>

      {/* Progressive Pipeline Steps */}
      <div className="space-y-2.5 font-mono-code">
        {steps.map((step, idx) => {
          const isDone = step.status === 'COMPLETED';
          const isRunning = step.status === 'RUNNING';

          return (
            <div
              key={step.id}
              className={`flex items-center justify-between text-xs px-2.5 py-1.5 transition-colors ${
                isRunning
                  ? 'bg-[#3df2ff]/10 border-l-2 border-l-[#3df2ff] text-white'
                  : isDone
                  ? 'text-white/80'
                  : 'text-white/30'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {isDone ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#3df2ff]" />
                ) : isRunning ? (
                  <Loader2 className="w-3.5 h-3.5 text-[#ff4e00] animate-spin" />
                ) : (
                  <Circle className="w-3.5 h-3.5 text-white/20" />
                )}
                <span className="text-[11px] font-semibold">{step.label}</span>
              </div>

              <span className="text-[10px] uppercase font-bold tracking-wider">
                {isDone ? (
                  <span className="text-[#3df2ff]">Complete</span>
                ) : isRunning ? (
                  <span className="text-[#ff4e00] animate-pulse">Running</span>
                ) : (
                  <span className="text-white/30">Queued</span>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
