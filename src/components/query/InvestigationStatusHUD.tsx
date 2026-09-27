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
    <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40 w-[90%] max-w-md bg-black/90 backdrop-blur-xl border border-sq-accent/40 p-5 shadow-[0_0_50px_rgba(166,184,106,0.15)] animate-in fade-in duration-300">
      <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-sq-accent animate-ping"></span>
          <span className="text-xs font-mono-code font-bold text-sq-accent uppercase tracking-widest">
            SatQuery Autonomous Investigation
          </span>
        </div>
        <Loader2 className="w-4 h-4 text-sq-accent animate-spin" />
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
                  ? 'bg-sq-accent/10 border-l-2 border-l-sq-accent text-white'
                  : isDone
                  ? 'text-white/80'
                  : 'text-white/30'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {isDone ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-sq-accent" />
                ) : isRunning ? (
                  <Loader2 className="w-3.5 h-3.5 text-sq-amber animate-spin" />
                ) : (
                  <Circle className="w-3.5 h-3.5 text-white/20" />
                )}
                <span className="text-[11px] font-semibold">{step.label}</span>
              </div>

              <span className="text-[10px] uppercase font-bold tracking-wider">
                {isDone ? (
                  <span className="text-sq-accent">Complete</span>
                ) : isRunning ? (
                  <span className="text-sq-amber animate-pulse">Running</span>
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
