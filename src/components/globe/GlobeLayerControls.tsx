import React, { useState } from 'react';
import { Layers, ChevronDown, ChevronUp, Sliders, Check } from 'lucide-react';
import { VisualizationMode } from './CesiumGlobeViewer';

interface GlobeLayerControlsProps {
  mode: VisualizationMode;
  opacity: number;
  showSatelliteImagery: boolean;
  showTerrain: boolean;
  showBorders: boolean;
  showMarkers: boolean;
  onModeChange: (mode: VisualizationMode) => void;
  onOpacityChange: (opacity: number) => void;
  onToggleSatelliteImagery: () => void;
  onToggleTerrain: () => void;
  onToggleBorders: () => void;
  onToggleMarkers: () => void;
}

export const GlobeLayerControls: React.FC<GlobeLayerControlsProps> = ({
  mode,
  opacity,
  showSatelliteImagery,
  showTerrain,
  showBorders,
  showMarkers,
  onModeChange,
  onOpacityChange,
  onToggleSatelliteImagery,
  onToggleTerrain,
  onToggleBorders,
  onToggleMarkers,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="absolute bottom-6 left-6 z-20 w-64 bg-black/85 backdrop-blur-xl border border-white/15 shadow-2xl select-none hidden md:block">
      {/* Header */}
      <div
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="flex items-center justify-between px-3.5 py-2 border-b border-white/10 bg-white/5 cursor-pointer hover:bg-white/10 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-[#3df2ff]" />
          <span className="text-[10px] font-mono-code font-bold text-white uppercase tracking-wider">
            Layer Controls
          </span>
        </div>
        <button className="text-white/60 hover:text-white transition-colors">
          {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
        </button>
      </div>

      {!isCollapsed && (
        <div className="p-3 space-y-3">
          {/* Analysis Overlay Opacity Slider */}
          <div>
            <div className="flex items-center justify-between text-[9px] font-mono-code text-white/60 uppercase mb-1">
              <span>Analysis Overlay</span>
              <span className="text-[#3df2ff] font-bold">{Math.round(opacity * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={opacity}
              onChange={(e) => onOpacityChange(parseFloat(e.target.value))}
              className="w-full h-1 bg-white/20 rounded-none accent-[#3df2ff] cursor-pointer"
            />
          </div>

          {/* Before / Difference / After Segmented Buttons */}
          <div>
            <div className="text-[9px] font-mono-code text-white/50 uppercase mb-1.5">
              Comparison Mode
            </div>
            <div className="grid grid-cols-3 gap-1 p-0.5 bg-white/10 border border-white/10 text-[9px] font-mono-code uppercase font-bold">
              <button
                onClick={() => onModeChange('BEFORE')}
                className={`py-1 transition-all ${
                  mode === 'BEFORE'
                    ? 'bg-[#10b981] text-black shadow'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                Before
              </button>
              <button
                onClick={() => onModeChange('DIFFERENCE')}
                className={`py-1 transition-all ${
                  mode === 'DIFFERENCE'
                    ? 'bg-[#ff4e00] text-black shadow-[0_0_10px_rgba(255,78,0,0.4)]'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                Diff
              </button>
              <button
                onClick={() => onModeChange('AFTER')}
                className={`py-1 transition-all ${
                  mode === 'AFTER'
                    ? 'bg-[#d97706] text-black shadow'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                After
              </button>
            </div>
          </div>

          {/* Layer Switches */}
          <div className="space-y-1.5 pt-2 border-t border-white/10 text-[10px] font-mono-code">
            {/* Satellite Imagery */}
            <label
              onClick={onToggleSatelliteImagery}
              className="flex items-center justify-between cursor-pointer text-white/70 hover:text-white py-0.5"
            >
              <span>Satellite Imagery</span>
              <div
                className={`w-3.5 h-3.5 border flex items-center justify-center transition-colors ${
                  showSatelliteImagery
                    ? 'bg-[#3df2ff] border-[#3df2ff] text-black'
                    : 'border-white/30'
                }`}
              >
                {showSatelliteImagery && <Check className="w-2.5 h-2.5 stroke-[3]" />}
              </div>
            </label>

            {/* Terrain */}
            <label
              onClick={onToggleTerrain}
              className="flex items-center justify-between cursor-pointer text-white/70 hover:text-white py-0.5"
            >
              <span>3D Terrain & Relief</span>
              <div
                className={`w-3.5 h-3.5 border flex items-center justify-center transition-colors ${
                  showTerrain
                    ? 'bg-[#3df2ff] border-[#3df2ff] text-black'
                    : 'border-white/30'
                }`}
              >
                {showTerrain && <Check className="w-2.5 h-2.5 stroke-[3]" />}
              </div>
            </label>

            {/* Country Borders */}
            <label
              onClick={onToggleBorders}
              className="flex items-center justify-between cursor-pointer text-white/70 hover:text-white py-0.5"
            >
              <span>Country Borders</span>
              <div
                className={`w-3.5 h-3.5 border flex items-center justify-center transition-colors ${
                  showBorders
                    ? 'bg-[#3df2ff] border-[#3df2ff] text-black'
                    : 'border-white/30'
                }`}
              >
                {showBorders && <Check className="w-2.5 h-2.5 stroke-[3]" />}
              </div>
            </label>

            {/* Region Markers */}
            <label
              onClick={onToggleMarkers}
              className="flex items-center justify-between cursor-pointer text-white/70 hover:text-white py-0.5"
            >
              <span>Region Markers</span>
              <div
                className={`w-3.5 h-3.5 border flex items-center justify-center transition-colors ${
                  showMarkers
                    ? 'bg-[#3df2ff] border-[#3df2ff] text-black'
                    : 'border-white/30'
                }`}
              >
                {showMarkers && <Check className="w-2.5 h-2.5 stroke-[3]" />}
              </div>
            </label>
          </div>
        </div>
      )}
    </div>
  );
};
