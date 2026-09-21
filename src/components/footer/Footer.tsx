import React from 'react';

interface FooterProps {
  queryId?: string;
  systemMessage?: string;
  status?: 'IDLE' | 'PROCESSING' | 'COMPLETED' | 'ERROR';
}

export const Footer: React.FC<FooterProps> = ({ queryId = '0xFF92', systemMessage, status }) => {
  const isError = status === 'ERROR';

  return (
    <footer className="h-12 bg-black border-t border-white/10 flex items-center justify-between px-6 sm:px-8 text-[10px] font-mono-code text-white/40 uppercase tracking-[0.2em] shrink-0 select-none z-20 overflow-x-auto">
      <div className="flex items-center gap-3 shrink-0 min-w-0">
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isError ? 'bg-red-500' : 'bg-[#3df2ff]'}`}></span>
        <span className={`truncate normal-case tracking-normal ${isError ? 'text-red-400' : 'text-white/60'}`}>
          {systemMessage || 'Spatial Engine: CesiumJS / PostGIS Core'}
        </span>
      </div>

      <div className="flex items-center gap-6 sm:gap-8 shrink-0">
        <span className="hidden md:inline text-white/50">Spectral Index: NDVI / L2A</span>
        <span>ML: Fast-AI-V4</span>
        <span className={isError ? 'text-red-400' : 'text-[#3df2ff]'}>{isError ? 'Status: Error' : 'Latency: 42ms'}</span>
        <span className="text-white/60">Session: {queryId}</span>
      </div>
    </footer>
  );
};
