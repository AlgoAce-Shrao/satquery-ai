/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Intelligent Image Upload Wizard
 * Guides operators through selecting input modes (Single Image, Bi-Temporal, Optical+SAR),
 * inspects uploaded rasters, evaluates compatibility, allows modality overrides, and launches
 * orchestrated AI analysis.
 */

import React, { useEffect, useRef, useState } from 'react';
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
  RefreshCw,
  Trash2,
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
  /** A file dropped onto the console before the wizard opened; loaded into the first slot. */
  initialFile?: File | null;
  onInitialFileConsumed?: () => void;
}

const ACCEPTED_FILES = 'image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp,.tif,.tiff,.nc';

function isSupportedFile(file: File) {
  return file.type.startsWith('image/') || /\.(tiff?|nc|png|jpe?g|webp)$/i.test(file.name);
}

const DEFAULT_PROMPTS: Record<InputMode, string> = {
  SINGLE_IMAGE: 'Describe this area and anything notable, such as vegetation, water or built-up land.',
  BI_TEMPORAL: 'What changed between these two dates?',
  OPTICAL_SAR: 'Identify built-up and water-covered regions using both optical and SAR.',
};

/** Click / drag-and-drop / keyboard file target for one upload slot. */
const Dropzone: React.FC<{
  title: string;
  tone: 'accent' | 'amber';
  busy: boolean;
  onFile: (file: File) => void;
}> = ({ title, tone, busy, onFile }) => {
  const [isOver, setIsOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const toneText = tone === 'amber' ? 'text-sq-amber' : 'text-sq-accent';
  const toneActive = tone === 'amber' ? 'border-sq-amber bg-sq-amber/10' : 'border-sq-accent bg-sq-accent/10';

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${title}: click to browse or drop an image file`}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setIsOver(true);
      }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) onFile(file);
      }}
      className={`border-2 border-dashed p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors focus-visible:outline focus-visible:outline-1 focus-visible:outline-sq-accent ${
        isOver ? toneActive : 'border-white/20 hover:bg-white/5 hover:border-white/35'
      }`}
    >
      <UploadCloud className={`w-8 h-8 mb-2 ${toneText}`} />
      <span className="text-xs text-white font-bold mb-1">{busy ? 'Reading image…' : title}</span>
      <span className="text-[10px] text-white/55">Drop a file here, click to browse, or paste with Ctrl+V</span>
      <span className="mt-1 text-[10px] text-white/35">PNG, JPEG or WebP work best for AI analysis</span>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_FILES}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          e.target.value = '';
        }}
      />
    </div>
  );
};

/** Replace / Remove controls shown under a loaded image. */
const SlotActions: React.FC<{ onFile: (file: File) => void; onRemove: () => void }> = ({ onFile, onRemove }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="flex items-center gap-1.5 pt-1">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex items-center gap-1 px-2 py-1 bg-white/5 hover:bg-white/15 text-white/80 border border-white/10 text-[10px] font-sans font-semibold uppercase"
      >
        <RefreshCw className="w-3 h-3" />
        Replace
      </button>
      <button
        type="button"
        onClick={onRemove}
        className="flex items-center gap-1 px-2 py-1 bg-white/5 hover:bg-sq-critical/20 text-white/70 hover:text-sq-critical border border-white/10 text-[10px] font-sans font-semibold uppercase"
      >
        <Trash2 className="w-3 h-3" />
        Remove
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_FILES}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          e.target.value = '';
        }}
      />
    </div>
  );
};

export const UploadWizardModal: React.FC<UploadWizardModalProps> = ({
  isOpen,
  onClose,
  onLaunchAnalysis,
  initialFile,
  onInitialFileConsumed,
}) => {
  const [mode, setMode] = useState<InputMode>('SINGLE_IMAGE');
  const [primaryImage, setPrimaryImage] = useState<UploadedImage | null>(null);
  const [secondaryImage, setSecondaryImage] = useState<UploadedImage | null>(null);
  const [userPrompt, setUserPrompt] = useState(DEFAULT_PROMPTS.SINGLE_IMAGE);
  const [promptEdited, setPromptEdited] = useState(false);
  const [isInspecting, setIsInspecting] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [manualLocation, setManualLocation] = useState<{
    name: string;
    country: string;
    lat: number;
    lon: number;
  } | null>(null);

  const loadFile = async (file: File, slot: 'primary' | 'secondary') => {
    if (!isSupportedFile(file)) {
      setUploadError(`${file.name} isn't an image file. Choose a PNG, JPEG, WebP or GeoTIFF image.`);
      return;
    }
    setUploadError(null);
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
    } catch (err) {
      setUploadError(`${file.name} couldn't be opened. Try exporting it as PNG or JPEG.`);
    } finally {
      setIsInspecting(false);
    }
  };

  const removeImage = (slot: 'primary' | 'secondary') => {
    const img = slot === 'primary' ? primaryImage : secondaryImage;
    if (img?.source === 'USER_UPLOAD') URL.revokeObjectURL(img.previewUrl);
    if (slot === 'primary') setPrimaryImage(null);
    else setSecondaryImage(null);
  };

  const switchMode = (next: InputMode) => {
    setMode(next);
    if (next === 'SINGLE_IMAGE') setSecondaryImage(null);
    if (!promptEdited) setUserPrompt(DEFAULT_PROMPTS[next]);
  };

  // A file dropped onto the console opens the wizard with it already loaded.
  useEffect(() => {
    if (!isOpen || !initialFile) return;
    switchMode('SINGLE_IMAGE');
    loadFile(initialFile, 'primary');
    onInitialFileConsumed?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialFile]);

  // Paste an image from the clipboard into the next empty slot.
  useEffect(() => {
    if (!isOpen) return;
    const onPaste = (e: ClipboardEvent) => {
      const file = Array.from(e.clipboardData?.files ?? []).find((f) => f.type.startsWith('image/'));
      if (!file) return;
      e.preventDefault();
      loadFile(file, mode !== 'SINGLE_IMAGE' && primaryImage && !secondaryImage ? 'secondary' : 'primary');
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, mode, primaryImage, secondaryImage]);

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

  const loadBenchmarkPreset = (targetMode: InputMode, scenarioIndex: number) => {
    setMode(targetMode);
    setPromptEdited(false);
    setUploadError(null);

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
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col bg-sq-surface border border-white/20 shadow-[0_0_80px_rgba(17,18,15,0.95)]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sq-accent/10 border border-sq-accent/30 text-sq-accent">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white uppercase tracking-wider font-mono-code flex items-center gap-2">
                <span>Upload & Analyze Imagery</span>
              </h2>
              <p className="text-[11px] text-white/50 font-mono-code">
                Upload a satellite or aerial image (or a pair) and ask a question about the area
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
                onClick={() => switchMode('SINGLE_IMAGE')}
                className={`p-3.5 text-left border transition-all ${
                  mode === 'SINGLE_IMAGE'
                    ? 'border-sq-positive bg-sq-positive/10 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
                    : 'border-white/10 bg-white/5 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5 text-sq-positive font-bold text-xs uppercase">
                    <Eye className="w-3.5 h-3.5" />
                    <span>Single Scene</span>
                  </div>
                  {mode === 'SINGLE_IMAGE' && (
                    <span className="w-2 h-2 rounded-full bg-sq-positive" />
                  )}
                </div>
                <p className="text-[10px] text-white/70 leading-relaxed">
                  Analyze land cover, objects, segmented regions, and answer visual questions on one observation.
                </p>
              </button>

              {/* Temporal Comparison Card */}
              <button
                type="button"
                onClick={() => switchMode('BI_TEMPORAL')}
                className={`p-3.5 text-left border transition-all ${
                  mode === 'BI_TEMPORAL'
                    ? 'border-sq-amber bg-sq-amber/10 shadow-[0_0_20px_rgba(211,166,74,0.15)]'
                    : 'border-white/10 bg-white/5 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5 text-sq-amber font-bold text-xs uppercase">
                    <Layers className="w-3.5 h-3.5" />
                    <span>Temporal Comparison</span>
                  </div>
                  {mode === 'BI_TEMPORAL' && (
                    <span className="w-2 h-2 rounded-full bg-sq-amber" />
                  )}
                </div>
                <p className="text-[10px] text-white/70 leading-relaxed">
                  Upload two observations of the same region at different times. Detect urban expansion, canopy loss & flood deltas.
                </p>
              </button>

              {/* Multimodal Card */}
              <button
                type="button"
                onClick={() => switchMode('OPTICAL_SAR')}
                className={`p-3.5 text-left border transition-all ${
                  mode === 'OPTICAL_SAR'
                    ? 'border-sq-accent bg-sq-accent/10 shadow-[0_0_20px_rgba(166,184,106,0.15)]'
                    : 'border-white/10 bg-white/5 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5 text-sq-accent font-bold text-xs uppercase">
                    <Radio className="w-3.5 h-3.5" />
                    <span>Optical + SAR</span>
                  </div>
                  {mode === 'OPTICAL_SAR' && (
                    <span className="w-2 h-2 rounded-full bg-sq-accent" />
                  )}
                </div>
                <p className="text-[10px] text-white/70 leading-relaxed">
                  Upload co-registered Optical + SAR radar imagery. Fuse spectral reflectance with physical surface roughness.
                </p>
              </button>
            </div>
          </div>

          {/* Step 2: Upload Dropzones & Inspection Cards */}
          <div>
            <div className="text-[10px] text-white/50 uppercase tracking-wider font-bold mb-2">
              Step 2 — Upload your image{mode === 'SINGLE_IMAGE' ? '' : 's'}
            </div>

            <div className={`grid ${mode === 'SINGLE_IMAGE' ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'} gap-4`}>
              {/* Primary Slot */}
              <div className="border border-white/15 bg-white/[0.02] p-4 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-white border-b border-white/10 pb-2">
                  <span className="flex items-center gap-1.5 text-sq-accent">
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
                      {primaryImage.format === 'GEOTIFF' && primaryImage.source === 'USER_UPLOAD' && (
                        <p className="text-[10px] text-white/50">
                          Tip: GeoTIFF files can't be displayed in the browser. Export as PNG or JPEG for the most detailed results.
                        </p>
                      )}
                      <SlotActions onFile={(file) => loadFile(file, 'primary')} onRemove={() => removeImage('primary')} />
                    </div>
                  </div>
                ) : (
                  <Dropzone
                    title={mode === 'BI_TEMPORAL' ? 'Upload the earlier image' : mode === 'OPTICAL_SAR' ? 'Upload the optical image' : 'Upload an image'}
                    tone="accent"
                    busy={isInspecting}
                    onFile={(file) => loadFile(file, 'primary')}
                  />
                )}
              </div>

              {/* Secondary Slot (for Bi-Temporal or Optical+SAR) */}
              {mode !== 'SINGLE_IMAGE' && (
                <div className="border border-white/15 bg-white/[0.02] p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-white border-b border-white/10 pb-2">
                    <span className="flex items-center gap-1.5 text-sq-amber">
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
                        <SlotActions onFile={(file) => loadFile(file, 'secondary')} onRemove={() => removeImage('secondary')} />
                      </div>
                    </div>
                  ) : (
                    <Dropzone
                      title={mode === 'BI_TEMPORAL' ? 'Upload the later image' : 'Upload the SAR image'}
                      tone="amber"
                      busy={isInspecting}
                      onFile={(file) => loadFile(file, 'secondary')}
                    />
                  )}
                </div>
              )}
            </div>

            {uploadError && (
              <p role="status" className="mt-3 border border-white/15 bg-white/[0.03] px-3 py-2 text-[11px] text-white/70">
                {uploadError}
              </p>
            )}

            {/* Optional sample imagery */}
          <div className="mt-3 p-3 bg-white/[0.03] border border-white/10 flex flex-wrap items-center gap-2">
            <span className="text-[10px] text-white/50 uppercase font-bold flex items-center gap-1">
              <Database className="w-3 h-3 text-sq-accent" />
              No image handy? Try a sample:
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
                <MapPin className="w-3.5 h-3.5 text-sq-accent" />
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
              onChange={(e) => {
                setUserPrompt(e.target.value);
                setPromptEdited(true);
              }}
              placeholder="e.g. Detect surface water extent and verify against SAR backscatter"
              className="w-full bg-black/80 border border-white/20 px-3.5 py-2.5 text-xs text-white placeholder-white/40 font-mono-code"
            />

            {/* Suggested Prompt Pills */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {suggestedPrompts.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    setUserPrompt(p);
                    setPromptEdited(true);
                  }}
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
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-sans uppercase font-bold"
          >
            Cancel
          </button>


          <button
            type="button"
            disabled={!primaryImage || !validationReport.canExecuteAnalysis}
            onClick={handleLaunch}
            className={`px-6 py-2.5 text-xs font-sans uppercase font-bold flex items-center gap-2 shadow-lg transition-all ${
              primaryImage && validationReport.canExecuteAnalysis
                ? 'bg-sq-accent hover:bg-sq-accent/90 text-black cursor-pointer'
                : 'bg-white/10 text-white/30 cursor-not-allowed border border-white/10'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Analyze image{mode === 'SINGLE_IMAGE' ? '' : 's'}</span>
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
