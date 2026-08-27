/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Intelligent Image Upload Wizard
 * Guides operators through selecting input modes (Single Image, Bi-Temporal, Optical+SAR),
 * inspects uploaded rasters, evaluates compatibility, allows modality overrides, and launches
 * orchestrated AI analysis.
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
  AlertTriangle,
  HelpCircle,
  Clock,
  Eye,
  MapPin,
  Compass,
  ArrowRight,
  Database,
} from 'lucide-react';
import {
  InputMode,
  UploadedImage,
  ValidationReport,
  AnalysisInput,
} from '../../types/upload';
import { ModalityType, SensorType } from '../../types/observation';
import { ImageInspector } from '../../services/imageInspector';
import { SatelliteImageService } from '../../services/satelliteImageService';
import { ManualLocationModal } from './ManualLocationModal';

interface UploadWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunchAnalysis: (input: AnalysisInput, prompt: string) => void;
}

export const UploadWizardModal: React.FC<UploadWizardModalProps> = ({
  isOpen,
  onClose,
  onLaunchAnalysis,
}) => {
  const [mode, setMode] = useState<InputMode>('BI_TEMPORAL');
  const [primaryImage, setPrimaryImage] = useState<UploadedImage | null>(null);
  const [secondaryImage, setSecondaryImage] = useState<UploadedImage | null>(null);
  const [userPrompt, setUserPrompt] = useState('What changed between these two dates?');
  const [isInspecting, setIsInspecting] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [manualLocation, setManualLocation] = useState<{
    name: string;
    country: string;
    lat: number;
    lon: number;
  } | null>(null);

  // Initialize with high-quality default benchmark imagery based on mode
  React.useEffect(() => {
    if (isOpen && !primaryImage) {
      loadBenchmarkPreset(mode, 3);
    }
  }, [isOpen, mode]);

  if (!isOpen) return null;

  // Validation report computed dynamically
  const validationReport: ValidationReport = primaryImage
    ? ImageInspector.validateInputPair(mode, primaryImage, secondaryImage || undefined)
    : {
        overallStatus: 'NOT_COMPATIBLE',
        canExecuteAnalysis: false,
        summary: 'Awaiting image upload to validate format and compatibility.',
        checks: [],
      };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    slot: 'primary' | 'secondary'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsInspecting(true);
    try {
      const defaultModality: ModalityType =
        slot === 'secondary' && mode === 'OPTICAL_SAR' ? 'SAR' : 'OPTICAL';
      const label =
        mode === 'BI_TEMPORAL'
          ? slot === 'primary'
            ? 'Baseline Epoch (T0)'
            : 'Target Epoch (T1)'
          : mode === 'OPTICAL_SAR'
          ? slot === 'primary'
            ? 'Optical RGB/MSI'
            : 'SAR VV/VH Radar'
          : 'Single Observation';

      const inspected = await ImageInspector.inspectFile(file, defaultModality, label);
      if (slot === 'primary') {
        setPrimaryImage(inspected);
      } else {
        setSecondaryImage(inspected);
      }
    } finally {
      setIsInspecting(false);
    }
  };

  const loadBenchmarkPreset = (targetMode: InputMode, scenarioIndex: number) => {
    setMode(targetMode);

    if (scenarioIndex === 1) {
      // Scenario 1: Single Optical Image — Land-Cover Classification
      const img = ImageInspector.createPresetImage({
        fileName: 'sentinel2_l2a_20240518_agriculture_matrix.tif',
        format: 'GEOTIFF',
        previewUrl: SatelliteImageService.getObservationImage('SITE_006', 'AFTER'),
        width: 1024,
        height: 1024,
        modality: 'OPTICAL',
        sensorType: 'Sentinel-2',
        acquisitionDate: '2024-05-18',
        center: { lat: 31.23, lon: 121.47 },
        label: 'Optical Multispectral Scene (10m)',
      });
      setPrimaryImage(img);
      setSecondaryImage(null);
      setUserPrompt('Describe the major land-cover types visible in this image.');
    } else if (scenarioIndex === 2) {
      // Scenario 2: Single Scene Grounding — Highlight Water Body
      const img = ImageInspector.createPresetImage({
        fileName: 'sentinel2_hydro_basin_b03_b08.tif',
        format: 'GEOTIFF',
        previewUrl: SatelliteImageService.getObservationImage('SITE_002', 'AFTER'),
        width: 1024,
        height: 1024,
        modality: 'OPTICAL',
        sensorType: 'Sentinel-2',
        acquisitionDate: '2024-05-12',
        center: { lat: 27.95, lon: 86.92 },
        label: 'Multispectral Water Basin Scene',
      });
      setPrimaryImage(img);
      setSecondaryImage(null);
      setUserPrompt('Highlight the water body.');
    } else if (scenarioIndex === 3) {
      // Scenario 3: Bi-Temporal Urban Expansion
      const img1 = ImageInspector.createPresetImage({
        fileName: 'sentinel2_20210418_t0_baseline.tif',
        format: 'GEOTIFF',
        previewUrl: SatelliteImageService.getObservationImage('SITE_006', 'BEFORE'),
        width: 1024,
        height: 1024,
        modality: 'OPTICAL',
        sensorType: 'Sentinel-2',
        acquisitionDate: '2021-04-18',
        center: { lat: 31.23, lon: 121.47 },
        label: 'Baseline Epoch (T0: 2021)',
      });
      const img2 = ImageInspector.createPresetImage({
        fileName: 'sentinel2_20260620_t1_target.tif',
        format: 'GEOTIFF',
        previewUrl: SatelliteImageService.getObservationImage('SITE_006', 'AFTER'),
        width: 1024,
        height: 1024,
        modality: 'OPTICAL',
        sensorType: 'Sentinel-2',
        acquisitionDate: '2026-06-20',
        center: { lat: 31.23, lon: 121.47 },
        label: 'Target Epoch (T1: 2026)',
      });
      setPrimaryImage(img1);
      setSecondaryImage(img2);
      setUserPrompt('What changed between these two dates?');
    } else if (scenarioIndex === 4) {
      // Scenario 4: Bi-Temporal Vegetation Loss
      const img1 = ImageInspector.createPresetImage({
        fileName: 'landsat9_20200815_t0_amazon_canopy.tif',
        format: 'GEOTIFF',
        previewUrl: SatelliteImageService.getObservationImage('SITE_001', 'BEFORE'),
        width: 1024,
        height: 1024,
        modality: 'OPTICAL',
        sensorType: 'Landsat-8',
        acquisitionDate: '2020-08-15',
        center: { lat: -10.83, lon: -61.95 },
        label: 'Baseline Canopy (T0: 2020)',
      });
      const img2 = ImageInspector.createPresetImage({
        fileName: 'landsat9_20260710_t1_amazon_cleared.tif',
        format: 'GEOTIFF',
        previewUrl: SatelliteImageService.getObservationImage('SITE_001', 'AFTER'),
        width: 1024,
        height: 1024,
        modality: 'OPTICAL',
        sensorType: 'Landsat-9',
        acquisitionDate: '2026-07-10',
        center: { lat: -10.83, lon: -61.95 },
        label: 'Target Epoch (T1: 2026)',
      });
      setPrimaryImage(img1);
      setSecondaryImage(img2);
      setUserPrompt('Has vegetation decreased?');
    } else if (scenarioIndex === 5) {
      // Scenario 5: Optical + SAR Multimodal Fusion
      const img1 = ImageInspector.createPresetImage({
        fileName: 'sentinel2_rgb_optical_10m.tif',
        format: 'GEOTIFF',
        previewUrl: SatelliteImageService.getObservationImage('SITE_006', 'AFTER'),
        width: 1024,
        height: 1024,
        modality: 'OPTICAL',
        sensorType: 'Sentinel-2',
        acquisitionDate: '2025-06-12',
        center: { lat: 3.139, lon: 101.686 },
        label: 'Optical Multispectral Scene (10m)',
      });
      const img2 = ImageInspector.createPresetImage({
        fileName: 'sentinel1_iw_grdh_sar_cband_vv_vh.tif',
        format: 'GEOTIFF',
        previewUrl: SatelliteImageService.getObservationImage('SITE_002', 'DIFFERENCE'),
        width: 1024,
        height: 1024,
        modality: 'SAR',
        sensorType: 'Sentinel-1',
        acquisitionDate: '2025-06-14',
        center: { lat: 3.139, lon: 101.686 },
        label: 'Sentinel-1 SAR C-Band Radar Pass',
      });
      setPrimaryImage(img1);
      setSecondaryImage(img2);
      setUserPrompt('Identify built-up and water-covered regions using both optical and SAR.');
    }
  };

  const handleLaunch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!primaryImage) return;

    const analysisInput: AnalysisInput = {
      id: `INP_${Date.now()}`,
      mode,
      title: `${mode.replace(/_/g, ' ')} Analysis (${primaryImage.fileName})`,
      userPrompt,
      images: {
        primary: primaryImage,
        secondary: secondaryImage || undefined,
      },
      validationReport,
      spatialContext: manualLocation
        ? {
            locationName: manualLocation.name,
            country: manualLocation.country,
            coordinates: { lat: manualLocation.lat, lon: manualLocation.lon },
            isManuallyAssigned: true,
          }
        : primaryImage.geospatialInfo.center
        ? {
            locationName: 'Georeferenced Target Scene',
            country: 'Earth Observation',
            coordinates: primaryImage.geospatialInfo.center,
            isManuallyAssigned: false,
          }
        : undefined,
      temporalContext: {
        beforeDate: primaryImage.acquisitionDate,
        afterDate: secondaryImage?.acquisitionDate,
      },
      createdAt: new Date().toISOString(),
    };

    onLaunchAnalysis(analysisInput, userPrompt);
    onClose();
  };

  const suggestedPrompts =
    mode === 'SINGLE_IMAGE'
      ? [
          'Describe the major land-cover types.',
          'Highlight the water body.',
          'Identify roads and built-up structures.',
          'Is there evidence of agricultural cultivation?',
        ]
      : mode === 'BI_TEMPORAL'
      ? [
          'What changed between these two dates?',
          'Has built-up area increased?',
          'Has vegetation decreased?',
          'Detect floodwater expansion extent.',
        ]
      : [
          'Identify built-up and water-covered regions.',
          'Compare SAR surface roughness with optical vegetation reflectance.',
          'Identify flood extents through cloud cover.',
        ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in select-none">
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col bg-[#0b0c10] border border-white/20 shadow-[0_0_80px_rgba(0,0,0,0.95)]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#3df2ff]/10 border border-[#3df2ff]/30 text-[#3df2ff]">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white uppercase tracking-wider font-mono-code flex items-center gap-2">
                <span>Satellite Image Ingestion & Workflow Routing</span>
              </h2>
              <p className="text-[11px] text-white/50 font-mono-code">
                Upload raw GeoTIFF, COG, or raster pairs for agentic remote-sensing intelligence
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/50 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto p-6 space-y-6 flex-1 text-xs font-mono-code">
          {/* Step 1: Mode Selection Cards */}
          <div>
            <div className="text-[10px] text-white/50 uppercase tracking-wider font-bold mb-2">
              Step 1 — Select Analysis Workflow Mode
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Single Image Card */}
              <button
                type="button"
                onClick={() => {
                  setMode('SINGLE_IMAGE');
                  loadBenchmarkPreset('SINGLE_IMAGE', 1);
                }}
                className={`p-3.5 text-left border transition-all ${
                  mode === 'SINGLE_IMAGE'
                    ? 'border-[#10b981] bg-[#10b981]/10 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
                    : 'border-white/10 bg-white/5 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5 text-[#10b981] font-bold text-xs uppercase">
                    <Eye className="w-3.5 h-3.5" />
                    <span>Single Scene</span>
                  </div>
                  {mode === 'SINGLE_IMAGE' && (
                    <span className="w-2 h-2 rounded-full bg-[#10b981]" />
                  )}
                </div>
                <p className="text-[10px] text-white/70 leading-relaxed">
                  Analyze land cover, objects, segmented regions, and answer visual questions on one observation.
                </p>
              </button>

              {/* Temporal Comparison Card */}
              <button
                type="button"
                onClick={() => {
                  setMode('BI_TEMPORAL');
                  loadBenchmarkPreset('BI_TEMPORAL', 3);
                }}
                className={`p-3.5 text-left border transition-all ${
                  mode === 'BI_TEMPORAL'
                    ? 'border-[#ff4e00] bg-[#ff4e00]/10 shadow-[0_0_20px_rgba(255,78,0,0.15)]'
                    : 'border-white/10 bg-white/5 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5 text-[#ff4e00] font-bold text-xs uppercase">
                    <Layers className="w-3.5 h-3.5" />
                    <span>Temporal Comparison</span>
                  </div>
                  {mode === 'BI_TEMPORAL' && (
                    <span className="w-2 h-2 rounded-full bg-[#ff4e00]" />
                  )}
                </div>
                <p className="text-[10px] text-white/70 leading-relaxed">
                  Upload two observations of the same region at different times. Detect urban expansion, canopy loss & flood deltas.
                </p>
              </button>

              {/* Multimodal Card */}
              <button
                type="button"
                onClick={() => {
                  setMode('OPTICAL_SAR');
                  loadBenchmarkPreset('OPTICAL_SAR', 5);
                }}
                className={`p-3.5 text-left border transition-all ${
                  mode === 'OPTICAL_SAR'
                    ? 'border-[#3df2ff] bg-[#3df2ff]/10 shadow-[0_0_20px_rgba(61,242,255,0.15)]'
                    : 'border-white/10 bg-white/5 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5 text-[#3df2ff] font-bold text-xs uppercase">
                    <Radio className="w-3.5 h-3.5" />
                    <span>Optical + SAR</span>
                  </div>
                  {mode === 'OPTICAL_SAR' && (
                    <span className="w-2 h-2 rounded-full bg-[#3df2ff]" />
                  )}
                </div>
                <p className="text-[10px] text-white/70 leading-relaxed">
                  Upload co-registered Optical + SAR radar imagery. Fuse spectral reflectance with physical surface roughness.
                </p>
              </button>
            </div>
          </div>

          {/* Quick Demo Scenarios Bar */}
          <div className="p-3 bg-white/[0.03] border border-white/10 flex flex-wrap items-center gap-2">
            <span className="text-[10px] text-white/50 uppercase font-bold flex items-center gap-1">
              <Database className="w-3 h-3 text-[#3df2ff]" />
              Quick Presets:
            </span>
            <button
              type="button"
              onClick={() => loadBenchmarkPreset('SINGLE_IMAGE', 1)}
              className="px-2 py-1 bg-white/5 hover:bg-white/15 text-white/80 border border-white/10 text-[10px]"
            >
              1. Land-Cover Scene
            </button>
            <button
              type="button"
              onClick={() => loadBenchmarkPreset('SINGLE_IMAGE', 2)}
              className="px-2 py-1 bg-white/5 hover:bg-white/15 text-white/80 border border-white/10 text-[10px]"
            >
              2. Water Grounding
            </button>
            <button
              type="button"
              onClick={() => loadBenchmarkPreset('BI_TEMPORAL', 3)}
              className="px-2 py-1 bg-white/5 hover:bg-white/15 text-white/80 border border-white/10 text-[10px]"
            >
              3. Urban Expansion
            </button>
            <button
              type="button"
              onClick={() => loadBenchmarkPreset('BI_TEMPORAL', 4)}
              className="px-2 py-1 bg-white/5 hover:bg-white/15 text-white/80 border border-white/10 text-[10px]"
            >
              4. Canopy Loss
            </button>
            <button
              type="button"
              onClick={() => loadBenchmarkPreset('OPTICAL_SAR', 5)}
              className="px-2 py-1 bg-white/5 hover:bg-white/15 text-white/80 border border-white/10 text-[10px]"
            >
              5. Optical+SAR Fusion
            </button>
          </div>

          {/* Step 2: Upload Dropzones & Inspection Cards */}
          <div>
            <div className="text-[10px] text-white/50 uppercase tracking-wider font-bold mb-2">
              Step 2 — Input Raster Inspection & Upload Slots
            </div>

            <div className={`grid ${mode === 'SINGLE_IMAGE' ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'} gap-4`}>
              {/* Primary Slot */}
              <div className="border border-white/15 bg-white/[0.02] p-4 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-white border-b border-white/10 pb-2">
                  <span className="flex items-center gap-1.5 text-[#3df2ff]">
                    <Satellite className="w-3.5 h-3.5" />
                    {mode === 'BI_TEMPORAL' ? 'Baseline Epoch (T0)' : mode === 'OPTICAL_SAR' ? 'Optical Imagery Layer' : 'Primary Observation Scene'}
                  </span>
                  {primaryImage && (
                    <span className="text-[9px] px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      Loaded
                    </span>
                  )}
                </div>

                {primaryImage ? (
                  <div className="space-y-2">
                    <div className="relative aspect-video bg-black/60 border border-white/10 overflow-hidden flex items-center justify-center">
                      <img
                        src={primaryImage.previewUrl}
                        alt="Primary Preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/80 text-[9px] text-white/70 font-mono-code">
                        {primaryImage.width}x{primaryImage.height} px
                      </div>
                    </div>

                    <div className="space-y-1 text-[10px] text-white/70">
                      <div className="truncate font-bold text-white">{primaryImage.fileName}</div>
                      <div className="flex justify-between text-white/50">
                        <span>Format: {primaryImage.format}</span>
                        <span>Date: {primaryImage.acquisitionDate || 'N/A'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] text-white/50">Modality:</span>
                        <select
                          value={primaryImage.modality}
                          onChange={(e) =>
                            setPrimaryImage({
                              ...primaryImage,
                              modality: e.target.value as ModalityType,
                              isUserSpecifiedModality: true,
                            })
                          }
                          className="bg-black border border-white/20 px-1.5 py-0.5 text-[10px] text-white"
                        >
                          <option value="OPTICAL">Optical / Multispectral</option>
                          <option value="SAR">SAR Radar (C-Band / L-Band)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-white/20 p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-white/5 transition-colors">
                    <UploadCloud className="w-8 h-8 text-[#3df2ff] mb-2" />
                    <span className="text-xs text-white font-bold mb-1">Upload Primary Raster</span>
                    <span className="text-[10px] text-white/40">Supports GeoTIFF, COG, NetCDF, PNG</span>
                    <input
                      type="file"
                      accept=".tif,.tiff,.nc,.png,.jpg,.jpeg"
                      onChange={(e) => handleFileUpload(e, 'primary')}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Secondary Slot (for Bi-Temporal or Optical+SAR) */}
              {mode !== 'SINGLE_IMAGE' && (
                <div className="border border-white/15 bg-white/[0.02] p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-white border-b border-white/10 pb-2">
                    <span className="flex items-center gap-1.5 text-[#ff4e00]">
                      <Layers className="w-3.5 h-3.5" />
                      {mode === 'BI_TEMPORAL' ? 'Target Epoch (T1)' : 'SAR Radar Layer (Sentinel-1)'}
                    </span>
                    {secondaryImage && (
                      <span className="text-[9px] px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        Loaded
                      </span>
                    )}
                  </div>

                  {secondaryImage ? (
                    <div className="space-y-2">
                      <div className="relative aspect-video bg-black/60 border border-white/10 overflow-hidden flex items-center justify-center">
                        <img
                          src={secondaryImage.previewUrl}
                          alt="Secondary Preview"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/80 text-[9px] text-white/70 font-mono-code">
                          {secondaryImage.width}x{secondaryImage.height} px
                        </div>
                      </div>

                      <div className="space-y-1 text-[10px] text-white/70">
                        <div className="truncate font-bold text-white">{secondaryImage.fileName}</div>
                        <div className="flex justify-between text-white/50">
                          <span>Format: {secondaryImage.format}</span>
                          <span>Date: {secondaryImage.acquisitionDate || 'N/A'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] text-white/50">Modality:</span>
                          <select
                            value={secondaryImage.modality}
                            onChange={(e) =>
                              setSecondaryImage({
                                ...secondaryImage,
                                modality: e.target.value as ModalityType,
                                isUserSpecifiedModality: true,
                              })
                            }
                            className="bg-black border border-white/20 px-1.5 py-0.5 text-[10px] text-white"
                          >
                            <option value="OPTICAL">Optical / Multispectral</option>
                            <option value="SAR">SAR Radar (C-Band / L-Band)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <label className="border-2 border-dashed border-white/20 p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-white/5 transition-colors">
                      <UploadCloud className="w-8 h-8 text-[#ff4e00] mb-2" />
                      <span className="text-xs text-white font-bold mb-1">
                        Upload {mode === 'BI_TEMPORAL' ? 'Target T1 Raster' : 'SAR Radar Scene'}
                      </span>
                      <span className="text-[10px] text-white/40">Supports GeoTIFF, COG, SAFE</span>
                      <input
                        type="file"
                        accept=".tif,.tiff,.nc,.png,.jpg,.jpeg"
                        onChange={(e) => handleFileUpload(e, 'secondary')}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Step 3: Input Compatibility & Location Validation */}
          <div className="border border-white/15 bg-white/[0.02] p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="text-[10px] text-white/50 uppercase font-bold tracking-wider">
                Step 3 — Input Validation & Compatibility
              </span>
              <span
                className={`text-[9px] font-bold px-2 py-0.5 border ${
                  validationReport.overallStatus === 'COMPATIBLE'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : validationReport.overallStatus === 'LIKELY_COMPATIBLE'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : validationReport.overallStatus === 'COMPATIBILITY_UNKNOWN'
                    ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                    : 'bg-red-500/20 text-red-300 border-red-500/40'
                }`}
              >
                {validationReport.overallStatus.replace(/_/g, ' ')}
              </span>
            </div>

            <p className="text-[11px] text-white/80">{validationReport.summary}</p>

            {validationReport.checks.length > 0 && (
              <div className="space-y-1.5 pt-1">
                {validationReport.checks.map((chk) => (
                  <div
                    key={chk.id}
                    className="flex items-start gap-2 text-[10px] text-white/70"
                  >
                    {chk.status === 'PASS' && (
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    )}
                    {chk.status === 'WARNING' && (
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    )}
                    {chk.status === 'UNKNOWN' && (
                      <HelpCircle className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                    )}
                    {chk.status === 'FAIL' && (
                      <X className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <span className="font-bold text-white">{chk.title}: </span>
                      <span>{chk.message}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Manual Location Override */}
            <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[10px]">
              <span className="text-white/50 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#3df2ff]" />
                {manualLocation
                  ? `Manual Coordinates: ${manualLocation.lat.toFixed(2)}°N, ${manualLocation.lon.toFixed(2)}°E (${manualLocation.name})`
                  : primaryImage?.geospatialInfo.hasGeospatial
                  ? `Georeferenced: ${primaryImage.geospatialInfo.crs || 'WGS-84'}`
                  : 'Geospatial coordinates unavailable (Local raster coordinates)'}
              </span>
              <button
                type="button"
                onClick={() => setIsLocationModalOpen(true)}
                className="px-2 py-1 bg-white/5 hover:bg-white/15 text-white/80 border border-white/10 text-[9px] uppercase font-bold"
              >
                {manualLocation ? 'Edit Coordinates' : 'Set Manual Location'}
              </button>
            </div>
          </div>

          {/* Step 4: Objective / Natural Language Prompt */}
          <div className="space-y-2">
            <label className="text-[10px] text-white/50 uppercase font-bold block">
              Step 4 — Natural Language Analysis Objective / Query
            </label>
            <input
              type="text"
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              placeholder="e.g. Detect surface water extent and verify against SAR backscatter"
              className="w-full bg-black/80 border border-white/20 px-3.5 py-2.5 text-xs text-white placeholder-white/40 font-mono-code"
            />

            {/* Suggested Prompt Pills */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {suggestedPrompts.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setUserPrompt(p)}
                  className="px-2 py-0.5 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/10 text-[10px] transition-colors"
                >
                  "{p}"
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-white/10 bg-white/[0.02] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-mono-code uppercase font-bold"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={!primaryImage || !validationReport.canExecuteAnalysis}
            onClick={handleLaunch}
            className={`px-6 py-2.5 text-xs font-mono-code uppercase font-bold flex items-center gap-2 shadow-lg transition-all ${
              primaryImage && validationReport.canExecuteAnalysis
                ? 'bg-[#3df2ff] hover:bg-[#3df2ff]/90 text-black cursor-pointer'
                : 'bg-white/10 text-white/30 cursor-not-allowed border border-white/10'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Launch Agentic Analysis Workflow</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Location Modal */}
      <ManualLocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        initialLocation={
          manualLocation
            ? manualLocation
            : primaryImage?.geospatialInfo.center
            ? {
                lat: primaryImage.geospatialInfo.center.lat,
                lon: primaryImage.geospatialInfo.center.lon,
              }
            : undefined
        }
        onSaveLocation={(loc) => setManualLocation(loc)}
      />
    </div>
  );
};
