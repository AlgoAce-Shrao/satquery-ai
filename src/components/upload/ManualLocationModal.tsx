/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Manual Location Assignment Modal
 * Allows operators to specify geographic coordinates or place names when
 * an uploaded image lacks embedded GeoTIFF metadata.
 */

import React, { useState } from 'react';
import { MapPin, X, Check, Globe } from 'lucide-react';

interface ManualLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveLocation: (location: { name: string; country: string; lat: number; lon: number }) => void;
  initialLocation?: { name?: string; country?: string; lat?: number; lon?: number };
}

export const ManualLocationModal: React.FC<ManualLocationModalProps> = ({
  isOpen,
  onClose,
  onSaveLocation,
  initialLocation,
}) => {
  const [name, setName] = useState(initialLocation?.name || 'Assigned Area of Interest');
  const [country, setCountry] = useState(initialLocation?.country || 'Earth');
  const [lat, setLat] = useState<number>(initialLocation?.lat ?? 3.139);
  const [lon, setLon] = useState<number>(initialLocation?.lon ?? 101.686);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveLocation({ name, country, lat, lon });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in select-none">
      <div className="relative w-full max-w-md bg-[#0e0e14] border border-white/20 p-5 space-y-4 shadow-[0_0_50px_rgba(0,0,0,0.9)]">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#3df2ff]" />
            <h3 className="text-sm font-bold text-white font-mono-code uppercase tracking-wider">
              Geographic Reference Assignment
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-white/60 hover:text-white bg-white/5 hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs font-mono-code text-white/60">
          This image contains standard pixel raster space without embedded EPSG projection tags. Provide geographic coordinates to ground the scene on the 3D globe.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3 font-mono-code text-xs">
          <div>
            <label className="block text-[10px] text-white/50 uppercase mb-1">
              Location / Region Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-black/80 border border-white/20 px-3 py-1.5 text-white"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] text-white/50 uppercase mb-1">
              Country / Jurisdiction
            </label>
            <input
              type="text"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full bg-black/80 border border-white/20 px-3 py-1.5 text-white"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-white/50 uppercase mb-1">
                Latitude (°N/S)
              </label>
              <input
                type="number"
                step="0.0001"
                value={lat}
                onChange={(e) => setLat(parseFloat(e.target.value) || 0)}
                className="w-full bg-black/80 border border-white/20 px-3 py-1.5 text-white"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] text-white/50 uppercase mb-1">
                Longitude (°E/W)
              </label>
              <input
                type="number"
                step="0.0001"
                value={lon}
                onChange={(e) => setLon(parseFloat(e.target.value) || 0)}
                className="w-full bg-black/80 border border-white/20 px-3 py-1.5 text-white"
                required
              />
            </div>
          </div>

          <div className="pt-3 border-t border-white/10 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-[#3df2ff] hover:bg-[#3df2ff]/90 text-black text-xs font-bold flex items-center gap-1.5 shadow"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Link Coordinates</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
