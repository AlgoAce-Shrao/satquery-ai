import React from 'react';
import { AnalysisResult } from '../../types/geospatial';
import { TelemetryData } from '../globe/CesiumGlobeViewer';
import { Globe2 } from 'lucide-react';

interface WorldMinimapProps {
  results: AnalysisResult[];
  activeResult: AnalysisResult | null;
  telemetry: TelemetryData;
  onSelectIndex: (index: number) => void;
}

export const WorldMinimap: React.FC<WorldMinimapProps> = ({
  results,
  activeResult,
  telemetry,
  onSelectIndex,
}) => {
  // Convert lat/lon [-180..180, -90..90] to SVG coords [0..220, 0..110]
  const projectPoint = (lat: number, lon: number) => {
    const x = ((lon + 180) / 360) * 220;
    const y = ((90 - lat) / 180) * 110;
    return { x, y };
  };

  const camPos = projectPoint(telemetry.lat, telemetry.lon);

  return (
    <div className="absolute bottom-6 right-6 z-20 w-60 bg-black/85 backdrop-blur-xl border border-white/15 p-2.5 shadow-2xl select-none hidden lg:block">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-1.5 mb-2">
        <div className="flex items-center gap-1.5">
          <Globe2 className="w-3 h-3 text-[#3df2ff]" />
          <span className="text-[9px] font-mono-code font-bold text-white/80 uppercase tracking-widest">
            World Overview
          </span>
        </div>
        <span className="text-[8px] font-mono-code text-white/40">1000 KM</span>
      </div>

      {/* SVG Map Canvas */}
      <div className="relative w-full h-[110px] bg-[#070e17] border border-white/10 overflow-hidden">
        <svg viewBox="0 0 220 110" className="w-full h-full">
          {/* Subtle Lat/Lon Grid lines */}
          <line x1="0" y1="55" x2="220" y2="55" stroke="rgba(255,255,255,0.08)" strokeDasharray="2,2" />
          <line x1="110" y1="0" x2="110" y2="110" stroke="rgba(255,255,255,0.08)" strokeDasharray="2,2" />

          {/* World Continents Rough Shapes */}
          {/* North America */}
          <path
            d="M20 20 Q45 15 65 25 Q75 45 60 55 Q40 50 25 40 Z"
            fill="#0f2238"
            stroke="rgba(61,242,255,0.25)"
            strokeWidth="0.5"
          />
          {/* South America */}
          <path
            d="M55 58 Q75 62 70 85 Q60 100 50 85 Q45 70 55 58 Z"
            fill="#0f2238"
            stroke="rgba(61,242,255,0.25)"
            strokeWidth="0.5"
          />
          {/* Europe */}
          <path
            d="M100 20 Q125 18 130 35 Q115 45 105 38 Z"
            fill="#0f2238"
            stroke="rgba(61,242,255,0.25)"
            strokeWidth="0.5"
          />
          {/* Africa */}
          <path
            d="M105 40 Q130 42 125 75 Q115 85 105 70 Q95 55 105 40 Z"
            fill="#0f2238"
            stroke="rgba(61,242,255,0.25)"
            strokeWidth="0.5"
          />
          {/* Asia */}
          <path
            d="M130 18 Q185 15 195 45 Q165 60 135 45 Z"
            fill="#0f2238"
            stroke="rgba(61,242,255,0.25)"
            strokeWidth="0.5"
          />
          {/* Australia */}
          <path
            d="M165 70 Q190 68 185 90 Q165 92 165 70 Z"
            fill="#0f2238"
            stroke="rgba(61,242,255,0.25)"
            strokeWidth="0.5"
          />

          {/* Results Pins */}
          {results.map((res, idx) => {
            const pt = projectPoint(res.location.lat, res.location.lon);
            const isActive = activeResult?.id === res.id;
            return (
              <g
                key={res.id}
                onClick={() => onSelectIndex(idx)}
                className="cursor-pointer hover:opacity-100"
              >
                {isActive && (
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="5"
                    fill="none"
                    stroke="#3df2ff"
                    strokeWidth="0.75"
                    className="animate-ping"
                  />
                )}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isActive ? 3 : 1.8}
                  fill={isActive ? '#3df2ff' : '#ff4e00'}
                  stroke="#ffffff"
                  strokeWidth="0.4"
                />
              </g>
            );
          })}

          {/* Camera Nadir FOV Footprint */}
          <g>
            <circle
              cx={camPos.x}
              cy={camPos.y}
              r="7"
              fill="rgba(61,242,255,0.12)"
              stroke="#3df2ff"
              strokeWidth="0.6"
              strokeDasharray="1.5,1.5"
            />
            <circle cx={camPos.x} cy={camPos.y} r="1" fill="#3df2ff" />
          </g>
        </svg>
      </div>

      {/* Scale & Coord footer */}
      <div className="flex items-center justify-between text-[8px] font-mono-code text-white/40 mt-1.5">
        <span>CAM: {Math.abs(telemetry.lat).toFixed(1)}°, {Math.abs(telemetry.lon).toFixed(1)}°</span>
        <div className="flex items-center gap-1">
          <div className="w-6 h-0.5 bg-white/40"></div>
          <span>1,000 KM</span>
        </div>
      </div>
    </div>
  );
};
