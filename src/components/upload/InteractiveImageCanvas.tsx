/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Interactive Image & Evidence Canvas
 * High-resolution canvas for zooming, panning, pixel inspection, and toggling
 * spatial evidence annotations on uploaded satellite scenes.
 */

import React, { useState, useRef } from 'react';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Layers,
  Eye,
  Crosshair,
  MapPin,
  Sparkles,
  Maximize2,
  Minimize2,
  CheckCircle2,
} from 'lucide-react';
import { UploadedImage } from '../../types/upload';
import { AnalysisResult, SpatialEvidenceItem } from '../../types/geospatial';

interface InteractiveImageCanvasProps {
  isOpen: boolean;
  onClose: () => void;
  image: UploadedImage;
  analysisResult?: AnalysisResult | null;
}

export const InteractiveImageCanvas: React.FC<InteractiveImageCanvasProps> = ({
  isOpen,
  onClose,
  image,
  analysisResult,
}) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [activeLayer, setActiveLayer] = useState<'ORIGINAL' | 'EVIDENCE' | 'MASK' | 'DIFF'>('EVIDENCE');
  const [selectedEvidenceId, setSelectedEvidenceId] = useState<string | null>(null);
  const [cursorPos, setCursorPos] = useState({ x: 512, y: 512 });

  if (!isOpen) return null;

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const relX = Math.round(((e.clientX - rect.left - pan.x) / (rect.width * zoom)) * image.width);
    const relY = Math.round(((e.clientY - rect.top - pan.y) / (rect.height * zoom)) * image.height);
    setCursorPos({ x: Math.max(0, Math.min(image.width, relX)), y: Math.max(0, Math.min(image.height, relY)) });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const resetTransform = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const evidenceItems = analysisResult?.spatialEvidence || [];
  const groundedItems = evidenceItems.filter((item) => item.imageBox);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-black/90 backdrop-blur-md animate-in fade-in select-none">
      <div className="relative w-full max-w-5xl h-[85vh] flex flex-col bg-sq-surface border border-white/20 shadow-[0_0_90px_rgba(17,18,15,0.95)]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-sq-accent/10 border border-sq-accent/30 text-sq-accent">
              <Eye className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono-code flex items-center gap-2">
                <span>Raster Canvas & Evidence Inspector</span>
                <span className="text-[10px] text-white/50">({image.fileName})</span>
              </h3>
            </div>
          </div>

          {/* Layer Switcher Controls */}
          <div className="flex items-center gap-1 bg-white/5 border border-white/10 p-0.5 text-[10px] font-mono-code uppercase font-bold">
            <button
              onClick={() => setActiveLayer('ORIGINAL')}
              className={`px-2 py-1 ${activeLayer === 'ORIGINAL' ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white'}`}
            >
              Original
            </button>
            <button
              onClick={() => setActiveLayer('EVIDENCE')}
              className={`px-2 py-1 ${activeLayer === 'EVIDENCE' ? 'bg-sq-accent text-black shadow' : 'text-white/50 hover:text-white'}`}
            >
              Spatial Evidence
            </button>
            <button
              onClick={() => setActiveLayer('MASK')}
              className={`px-2 py-1 ${activeLayer === 'MASK' ? 'bg-sq-amber text-black shadow' : 'text-white/50 hover:text-white'}`}
            >
              Class Mask
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-white/50 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Main Canvas + Side Evidence Panel */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Interactive Zoom/Pan Canvas */}
          <div
            className="flex-1 relative bg-black overflow-hidden flex items-center justify-center cursor-grab active:cursor-grabbing"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <div
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transition: isDragging ? 'none' : 'transform 0.1s ease-out',
              }}
              className="relative select-none max-w-full max-h-full"
            >
              <img
                src={image.previewUrl}
                alt="Scene"
                draggable={false}
                className="max-w-[700px] max-h-[500px] object-contain border border-white/20 shadow-2xl"
              />

              {/* Spatial Evidence Overlay — only regions the analysis actually located on this image */}
              {activeLayer === 'EVIDENCE' && groundedItems.length > 0 && (
                <div className="absolute inset-0 pointer-events-none">
                  {groundedItems.map((item) => {
                    const [y0, x0, y1, x1] = item.imageBox!;
                    const tone =
                      item.changeStatus === 'REMOVED_DECREASED'
                        ? 'border-sq-critical bg-sq-critical/15 text-sq-critical'
                        : item.changeStatus === 'NEW_INCREASED'
                        ? 'border-sq-accent bg-sq-accent/15 text-sq-accent'
                        : 'border-sq-amber bg-sq-amber/10 text-sq-amber';
                    const selected = selectedEvidenceId === item.id;
                    return (
                      <div
                        key={item.id}
                        className={`absolute border-2 ${tone} ${selected ? 'ring-2 ring-white/70' : ''}`}
                        style={{
                          top: `${y0 * 100}%`,
                          left: `${x0 * 100}%`,
                          height: `${(y1 - y0) * 100}%`,
                          width: `${(x1 - x0) * 100}%`,
                        }}
                      >
                        <span className="absolute -top-5 left-0 whitespace-nowrap bg-black/85 px-1 font-mono-code text-[9px] font-bold uppercase">
                          {item.label} · {Math.round(item.confidence * 100)}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Class Mask Overlay */}
              {activeLayer === 'MASK' && (
                <div className="absolute inset-0 bg-sq-amber/20 mix-blend-screen pointer-events-none flex items-center justify-center border-2 border-sq-amber">
                  <span className="text-xs font-mono-code font-bold text-sq-amber bg-black/80 px-2 py-1 border border-sq-amber/40">
                    Radiometric Anomaly Segmentation Mask
                  </span>
                </div>
              )}
            </div>

            {/* Bottom HUD: Coordinates & Navigation Controls */}
            <div className="absolute bottom-3 left-3 bg-black/80 border border-white/20 px-3 py-1.5 text-[10px] font-mono-code text-white/70 flex items-center gap-3 backdrop-blur-md">
              <span className="flex items-center gap-1 text-sq-accent">
                <Crosshair className="w-3 h-3" />
                Pixel: {cursorPos.x}, {cursorPos.y}
              </span>
              <span className="text-white/40">|</span>
              <span>Dimensions: {image.width}x{image.height}</span>
              <span className="text-white/40">|</span>
              <span>Zoom: {Math.round(zoom * 100)}%</span>
            </div>

            {/* Floating Zoom Controls */}
            <div className="absolute top-3 right-3 flex flex-col gap-1 bg-black/80 border border-white/20 p-1 backdrop-blur-md">
              <button
                onClick={() => setZoom((z) => Math.min(4, z + 0.25))}
                className="p-1 text-white/70 hover:text-white bg-white/5 hover:bg-white/10"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
                className="p-1 text-white/70 hover:text-white bg-white/5 hover:bg-white/10"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={resetTransform}
                className="p-1 text-white/70 hover:text-white bg-white/5 hover:bg-white/10"
                title="Reset View"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right: Spatial Evidence Sidebar */}
          <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-white/10 bg-sq-surface p-4 space-y-4 overflow-y-auto text-xs font-mono-code">
            <div className="border-b border-white/10 pb-2">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-sq-accent" />
                <span>Extracted Spatial Evidence</span>
              </h4>
              <p className="text-[10px] text-white/50">
                Segmented polygonal sectors and confidence scores
              </p>
            </div>

            <div className="space-y-2.5">
              {evidenceItems.length > 0 ? (
                evidenceItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedEvidenceId(item.id)}
                    className={`p-2.5 border transition-all cursor-pointer ${
                      selectedEvidenceId === item.id
                        ? 'border-sq-accent bg-sq-accent/10'
                        : 'border-white/10 bg-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-bold text-white mb-1">
                      <span className="text-sq-accent">{item.label}</span>
                      <span className="text-[10px] text-white/50">{Math.round(item.confidence * 100)}% Conf</span>
                    </div>
                    {item.description && (
                      <p className="text-[10px] text-white/70 leading-relaxed mb-1.5">
                        {item.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-[9px] text-white/50 border-t border-white/10 pt-1">
                      <span>Area: {item.areaSqKm ? `${item.areaSqKm} km²` : 'N/A'}</span>
                      <span className="text-emerald-400">{item.metricDelta || 'Classified'}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-3 text-center text-[10px] text-white/40 border border-white/10">
                  Execute query to extract polygonal spatial evidence annotations.
                </div>
              )}
            </div>

            {/* Technical Metadata */}
            <div className="border-t border-white/10 pt-3 space-y-1.5 text-[10px] text-white/60">
              <div className="text-white font-bold uppercase">Raster Specifications</div>
              <div className="flex justify-between">
                <span>Sensor:</span>
                <span className="text-white">{image.geospatialInfo.sensorType || 'Multispectral'}</span>
              </div>
              <div className="flex justify-between">
                <span>Modality:</span>
                <span className="text-white">{image.modality}</span>
              </div>
              <div className="flex justify-between">
                <span>Projection:</span>
                <span className="text-white">{image.geospatialInfo.crs || 'Pixel Raster Grid'}</span>
              </div>
              <div className="flex justify-between">
                <span>File Size:</span>
                <span className="text-white">{(image.fileSizeBytes / (1024 * 1024)).toFixed(2)} MB</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
