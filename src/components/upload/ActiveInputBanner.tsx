/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Active Analysis Input Banner
 * Provides persistent visual context showing currently ingested satellite imagery,
 * sensor modalities, acquisition timestamps, and fast inspection tools.
 */

import React from 'react';
import {
  Layers,
  Satellite,
  Radio,
  Eye,
  Maximize2,
  Edit3,
  X,
  MapPin,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { AnalysisInput } from '../../types/upload';

interface ActiveInputBannerProps {
  activeInput: AnalysisInput | null;
  onOpenWizard: () => void;
  onOpenPixelInspector: () => void;
  onClearInput: () => void;
}

export const ActiveInputBanner: React.FC<ActiveInputBannerProps> = ({
  activeInput,
  onOpenWizard,
  onOpenPixelInspector,
  onClearInput,
}) => {
  if (!activeInput) return null;

  const primary = activeInput.images.primary;
  const secondary = activeInput.images.secondary;
  const mode = activeInput.mode;

  return (
    <div className="w-full bg-[#0d0e14]/95 border-b border-white/15 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs font-mono-code backdrop-blur-md z-30 select-none shadow-md">
      {/* Left: Input Identification */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-white/5 border border-white/10 text-[10px] text-white/70 uppercase font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-[#3df2ff] animate-pulse" />
          <span>Active Ingest Context</span>
        </div>

        {/* Mode Tag */}
        <span
          className={`px-2 py-0.5 text-[10px] font-bold uppercase border ${
            mode === 'BI_TEMPORAL'
              ? 'bg-[#ff4e00]/15 text-[#ff4e00] border-[#ff4e00]/30'
              : mode === 'OPTICAL_SAR'
              ? 'bg-[#3df2ff]/15 text-[#3df2ff] border-[#3df2ff]/30'
              : 'bg-[#10b981]/15 text-[#10b981] border-[#10b981]/30'
          }`}
        >
          {mode.replace(/_/g, ' ')}
        </span>

        {/* Image Thumbnails & Names */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-black/60 border border-white/10 px-2 py-1">
            <img
              src={primary.previewUrl}
              alt="Primary"
              className="w-5 h-5 object-cover rounded-sm border border-white/10"
            />
            <div className="text-[10px] text-white">
              <span className="font-bold text-[#3df2ff]">{primary.label || 'T0'}: </span>
              <span className="text-white/60 truncate max-w-[120px] inline-block align-bottom">
                {primary.fileName}
              </span>
            </div>
          </div>

          {secondary && (
            <div className="flex items-center gap-1.5 bg-black/60 border border-white/10 px-2 py-1">
              <img
                src={secondary.previewUrl}
                alt="Secondary"
                className="w-5 h-5 object-cover rounded-sm border border-white/10"
              />
              <div className="text-[10px] text-white">
                <span className="font-bold text-[#ff4e00]">{secondary.label || 'T1'}: </span>
                <span className="text-white/60 truncate max-w-[120px] inline-block align-bottom">
                  {secondary.fileName}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Spatial / Location Indicator */}
        <div className="hidden lg:flex items-center gap-1 text-[10px] text-white/50">
          <MapPin className="w-3 h-3 text-[#3df2ff]" />
          <span>
            {activeInput.spatialContext?.locationName ||
              (primary.geospatialInfo.hasGeospatial ? 'Georeferenced WGS-84' : 'Pixel Raster Space')}
          </span>
        </div>
      </div>

      {/* Right: Quick Action Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenPixelInspector}
          title="Inspect High-Resolution Image Canvas"
          className="px-2.5 py-1 bg-white/5 hover:bg-white/15 text-white/80 border border-white/10 flex items-center gap-1.5 text-[10px] uppercase font-bold transition-colors"
        >
          <Maximize2 className="w-3 h-3 text-[#3df2ff]" />
          <span>Inspect Canvas</span>
        </button>

        <button
          onClick={onOpenWizard}
          title="Change or reconfigure uploaded imagery"
          className="px-2.5 py-1 bg-white/5 hover:bg-white/15 text-white/80 border border-white/10 flex items-center gap-1.5 text-[10px] uppercase font-bold transition-colors"
        >
          <Edit3 className="w-3 h-3 text-[#ff4e00]" />
          <span>Change Input</span>
        </button>

        <button
          onClick={onClearInput}
          title="Unload custom ingested imagery and return to global registry mode"
          className="p-1 text-white/40 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
