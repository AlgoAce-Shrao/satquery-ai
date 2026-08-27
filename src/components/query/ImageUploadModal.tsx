/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Image Upload & Ingestion Modal
 * Prepares user-supplied satellite imagery (single image, optical+SAR pair, or bi-temporal pair)
 * for analysis with acquisition metadata and sensor type specification.
 */

import React, { useState } from 'react';
import {
  UploadCloud,
  X,
  Layers,
  Calendar,
  Satellite,
  Radio,
  FileText,
  Sparkles,
  Check,
} from 'lucide-react';
import { ModalityType, SensorType } from '../../types/observation';

interface ImageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRunUploadedAnalysis: (payload: {
    title: string;
    modality: ModalityType;
    sensor: SensorType;
    beforeDate: string;
    afterDate: string;
    prompt: string;
  }) => void;
}

export const ImageUploadModal: React.FC<ImageUploadModalProps> = ({
  isOpen,
  onClose,
  onRunUploadedAnalysis,
}) => {
  const [uploadType, setUploadType] = useState<'BI_TEMPORAL' | 'SINGLE' | 'OPTICAL_SAR'>('BI_TEMPORAL');
  const [sensor, setSensor] = useState<SensorType>('SENTINEL_2');
  const [beforeDate, setBeforeDate] = useState('2023-06-15');
  const [afterDate, setAfterDate] = useState('2026-06-20');
  const [customPrompt, setCustomPrompt] = useState('Analyze change in canopy density and detect new clearings.');
  const [uploadedFiles, setUploadedFiles] = useState<{ before?: string; after?: string; sar?: string }>({
    before: 'sentinel2_t0_baseline.tiff',
    after: 'sentinel2_t1_target.tiff',
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onRunUploadedAnalysis({
      title: `Uploaded Imagery Analysis (${sensor})`,
      modality: uploadType === 'OPTICAL_SAR' ? 'MULTIMODAL' : 'OPTICAL_MULTISPECTRAL',
      sensor,
      beforeDate,
      afterDate,
      prompt: customPrompt,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-lg bg-[#0c0c10] border border-white/20 shadow-[0_0_60px_rgba(0,0,0,0.9)] p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <UploadCloud className="w-5 h-5 text-[#3df2ff]" />
            <div>
              <h3 className="text-base font-bold text-white uppercase tracking-wider">
                Ingest Satellite Imagery
              </h3>
              <p className="text-[10px] font-mono-code text-white/50">
                Upload GeoTIFF / NetCDF / PNG pairs for AI remote-sensing analysis
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/60 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Upload Mode Selector */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-white/5 border border-white/10 text-[10px] font-mono-code uppercase font-bold">
          <button
            type="button"
            onClick={() => setUploadType('BI_TEMPORAL')}
            className={`py-2 px-1 text-center transition-all ${
              uploadType === 'BI_TEMPORAL'
                ? 'bg-[#ff4e00] text-black shadow'
                : 'text-white/70 hover:text-white'
            }`}
          >
            Bi-Temporal Pair
          </button>
          <button
            type="button"
            onClick={() => setUploadType('OPTICAL_SAR')}
            className={`py-2 px-1 text-center transition-all ${
              uploadType === 'OPTICAL_SAR'
                ? 'bg-[#3df2ff] text-black shadow'
                : 'text-white/70 hover:text-white'
            }`}
          >
            Optical + SAR
          </button>
          <button
            type="button"
            onClick={() => setUploadType('SINGLE')}
            className={`py-2 px-1 text-center transition-all ${
              uploadType === 'SINGLE'
                ? 'bg-[#10b981] text-black shadow'
                : 'text-white/70 hover:text-white'
            }`}
          >
            Single Scene
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* File Upload Drop Area */}
          <div className="border-2 border-dashed border-white/20 p-5 text-center space-y-2 bg-white/5 hover:bg-white/10 transition-colors cursor-pointer">
            <UploadCloud className="w-8 h-8 text-[#3df2ff] mx-auto animate-bounce" />
            <p className="text-xs font-mono-code text-white font-bold">
              Drop Satellite GeoTIFFs or click to browse
            </p>
            <p className="text-[10px] text-white/50">
              Supports Cloud-Optimized GeoTIFF (COG), Sentinel-2 L2A SAFE, and SAFE SAR packages
            </p>
            <div className="flex justify-center gap-2 pt-2">
              <span className="text-[9px] font-mono-code px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                <Check className="w-3 h-3" /> Baseline T0 Loaded
              </span>
              <span className="text-[9px] font-mono-code px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                <Check className="w-3 h-3" /> Target T1 Loaded
              </span>
            </div>
          </div>

          {/* Sensor & Satellite Selection */}
          <div className="grid grid-cols-2 gap-3 text-xs font-mono-code">
            <div>
              <label className="text-[10px] text-white/50 uppercase block mb-1">
                Primary Sensor
              </label>
              <select
                value={sensor}
                onChange={(e) => setSensor(e.target.value as SensorType)}
                className="w-full bg-black/80 border border-white/20 px-2.5 py-1.5 text-white text-xs"
              >
                <option value="SENTINEL_2">Sentinel-2 (MSI 10m)</option>
                <option value="LANDSAT_8_9">Landsat 8/9 (OLI 30m)</option>
                <option value="SENTINEL_1">Sentinel-1 (SAR C-Band)</option>
                <option value="PLANETSCOPE">PlanetScope (SuperDove 3m)</option>
                <option value="MODIS">MODIS Terra/Aqua (250m)</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] text-white/50 uppercase block mb-1">
                Baseline Acquisition Date
              </label>
              <input
                type="date"
                value={beforeDate}
                onChange={(e) => setBeforeDate(e.target.value)}
                className="w-full bg-black/80 border border-white/20 px-2.5 py-1.5 text-white text-xs"
              />
            </div>
          </div>

          {/* Analysis Query / Prompt */}
          <div>
            <label className="text-[10px] text-white/50 uppercase block mb-1 font-mono-code">
              Analysis Objective / Prompt
            </label>
            <input
              type="text"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="e.g. Detect surface water extent and verify against SAR backscatter"
              className="w-full bg-black/80 border border-white/20 px-3 py-2 text-xs text-white placeholder-white/40 font-mono-code"
            />
          </div>

          {/* Submit */}
          <div className="pt-2 border-t border-white/10 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-mono-code uppercase font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#3df2ff] hover:bg-[#3df2ff]/90 text-black text-xs font-mono-code uppercase font-bold flex items-center gap-1.5 shadow-lg"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Launch Ingest & Analysis</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
