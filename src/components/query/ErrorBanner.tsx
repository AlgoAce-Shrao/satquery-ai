import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ErrorBannerProps {
  message: string;
  onDismiss: () => void;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({ message, onDismiss }) => {
  return (
    <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40 w-[90%] max-w-md bg-black/90 backdrop-blur-xl border border-red-500/50 p-5 shadow-[0_0_50px_rgba(239,68,68,0.15)] animate-in fade-in duration-300">
      <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400" />
          <span className="text-xs font-mono-code font-bold text-red-400 uppercase tracking-widest">
            Analysis Failed
          </span>
        </div>
        <button
          onClick={onDismiss}
          aria-label="Dismiss error"
          className="text-white/40 hover:text-white/80 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <p className="text-sm text-white/90 px-1">{message}</p>
    </div>
  );
};
