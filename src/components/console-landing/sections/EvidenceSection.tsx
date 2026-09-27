/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * "See the evidence": the Punjab result as the console presents it. The map is
 * Esri World Imagery (the same provider the console's Cesium globe uses),
 * requested in EPSG:4326 so the registry polygon overlays it with a simple
 * linear projection. The side panel is the console's own SpatialResultHUD.
 */

import React, { useMemo, useState } from 'react';
import { SpatialResultHUD } from '../../results/SpatialResultHUD';
import { Section, SectionTitle, Readout } from '../primitives';
import { PRIMARY_RESULT, PRIMARY_SCENARIO, formatLat, formatLon } from '../landingData';

const { observation, query } = PRIMARY_SCENARIO;

// Map extent: registry bounding box padded on each side (degrees).
const [minLon, minLat, maxLon, maxLat] = PRIMARY_RESULT.boundingBox!;
const EXTENT = { w: minLon - 1.3, e: maxLon + 1.3, s: minLat - 1.0, n: maxLat + 1.0 };
const VIEW_W = 1200;
const VIEW_H = Math.round((VIEW_W * (EXTENT.n - EXTENT.s)) / (EXTENT.e - EXTENT.w));

const IMAGERY_URL =
  'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export' +
  `?bbox=${EXTENT.w},${EXTENT.s},${EXTENT.e},${EXTENT.n}&bboxSR=4326&imageSR=4326` +
  `&size=${VIEW_W},${VIEW_H}&format=jpg&f=image`;

const x = (lon: number) => ((lon - EXTENT.w) / (EXTENT.e - EXTENT.w)) * VIEW_W;
const y = (lat: number) => ((EXTENT.n - lat) / (EXTENT.n - EXTENT.s)) * VIEW_H;

function gridSteps(from: number, to: number, step: number) {
  const out: number[] = [];
  for (let v = Math.ceil(from / step) * step; v <= to; v += step) out.push(Number(v.toFixed(2)));
  return out;
}

const EvidenceMap: React.FC = () => {
  const [imageryFailed, setImageryFailed] = useState(false);

  const polygon = PRIMARY_RESULT.polygon;
  const points = useMemo(() => polygon.map((p) => `${x(p.lon)},${y(p.lat)}`).join(' '), [polygon]);
  const cx = x(observation.longitude);
  const cy = y(observation.latitude);
  const bx0 = x(minLon), bx1 = x(maxLon), by0 = y(maxLat), by1 = y(minLat);
  const tick = 22;

  return (
    <figure className="relative overflow-hidden border border-white/15 bg-sq-surface">
      <div className="flex items-center justify-between border-b border-white/10 bg-black/60 px-3 py-2">
        <Readout tone="text" className="font-bold">
          {observation.id} / {observation.sensor}
        </Readout>
        <Readout className="hidden sm:inline">
          {observation.baselineDate} → {observation.targetDate}
        </Readout>
      </div>

      <div className="relative" style={{ aspectRatio: `${VIEW_W} / ${VIEW_H}` }}>
        {!imageryFailed && (
          <img
            src={IMAGERY_URL}
            alt={`Satellite imagery of ${observation.region}, ${observation.country}`}
            loading="lazy"
            decoding="async"
            onError={() => setImageryFailed(true)}
            className="absolute inset-0 h-full w-full object-cover [filter:saturate(0.55)_brightness(0.55)_contrast(1.1)]"
          />
        )}
        {imageryFailed && (
          <div className="sq-grid absolute inset-0 flex items-end p-4">
            <Readout>Imagery unavailable. Showing vector evidence only.</Readout>
          </div>
        )}

        <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} className="absolute inset-0 h-full w-full" aria-hidden="true">
          {/* Graticule, 0.5° */}
          {gridSteps(EXTENT.w, EXTENT.e, 0.5).filter((lon) => x(lon) > 90 && x(lon) < VIEW_W - 70).map((lon) => (
            <g key={`lon${lon}`}>
              <line x1={x(lon)} x2={x(lon)} y1={0} y2={VIEW_H} stroke="rgba(230,226,214,0.1)" strokeDasharray="2 6" />
              <text className="max-sm:hidden" x={x(lon) + 4} y={VIEW_H - 8} fill="rgba(230,226,214,0.45)" fontSize="13" fontFamily="IBM Plex Mono, monospace">
                {lon.toFixed(1)}°E
              </text>
            </g>
          ))}
          {gridSteps(EXTENT.s, EXTENT.n, 0.5).filter((lat) => y(lat) > 30 && y(lat) < VIEW_H - 40).map((lat) => (
            <g key={`lat${lat}`}>
              <line x1={0} x2={VIEW_W} y1={y(lat)} y2={y(lat)} stroke="rgba(230,226,214,0.1)" strokeDasharray="2 6" />
              <text className="max-sm:hidden" x={8} y={y(lat) - 5} fill="rgba(230,226,214,0.45)" fontSize="13" fontFamily="IBM Plex Mono, monospace">
                {lat.toFixed(1)}°N
              </text>
            </g>
          ))}

          {/* Bounding box corner brackets */}
          <g stroke="#A6B86A" strokeWidth="1.5" fill="none">
            <path d={`M${bx0} ${by0 + tick} V${by0} H${bx0 + tick}`} />
            <path d={`M${bx1 - tick} ${by0} H${bx1} V${by0 + tick}`} />
            <path d={`M${bx0} ${by1 - tick} V${by1} H${bx0 + tick}`} />
            <path d={`M${bx1 - tick} ${by1} H${bx1} V${by1 - tick}`} />
          </g>

          {/* Change region */}
          <polygon points={points} fill="rgba(184,92,74,0.14)" stroke="#B85C4A" strokeWidth="2" />
          {polygon.slice(0, -1).map((p, i) => (
            <rect key={i} x={x(p.lon) - 4} y={y(p.lat) - 4} width="8" height="8" fill="#11120F" stroke="#B85C4A" strokeWidth="1.5" />
          ))}

          {/* Site reticle */}
          <g stroke="#A6B86A" strokeWidth="1.5">
            <circle cx={cx} cy={cy} r="16" fill="none" />
            <line x1={cx - 30} x2={cx - 20} y1={cy} y2={cy} />
            <line x1={cx + 20} x2={cx + 30} y1={cy} y2={cy} />
            <line x1={cx} x2={cx} y1={cy - 30} y2={cy - 20} />
            <line x1={cx} x2={cx} y1={cy + 20} y2={cy + 30} />
          </g>
        </svg>

        {/* Floating readout next to the site */}
        <div
          className="pointer-events-none absolute hidden -translate-y-1/2 border border-sq-accent/40 bg-black/80 px-2 py-1 font-mono-code text-[10px] leading-4 sm:block"
          style={{ left: `${((cx + 40) / VIEW_W) * 100}%`, top: `${(cy / VIEW_H) * 100}%` }}
        >
          <div className="text-sq-accent">{formatLat(observation.latitude)} {formatLon(observation.longitude)}</div>
          <div className="text-white/60">{observation.areaAffectedSqKm?.toLocaleString('en-US')} km² affected</div>
        </div>
      </div>

      <figcaption className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-white/10 bg-black/60 px-3 py-1.5">
        <Readout className="hidden truncate sm:inline">Region polygon from the SatQuery registry</Readout>
        <span className="font-mono-code text-[9px] text-white/35">Imagery: Esri, Maxar, Earthstar Geographics, GIS User Community</span>
      </figcaption>
    </figure>
  );
};

interface EvidenceSectionProps {
  onOpenConsole: (query?: string) => void;
}

export const EvidenceSection: React.FC<EvidenceSectionProps> = ({ onOpenConsole }) => {
  const openInConsole = () => onOpenConsole(query);

  return (
    <Section id="evidence" label="See the evidence" index={`${observation.region}`}>
      <SectionTitle
        id="evidence-title"
        lead={
          <>
            Every answer is pinned to the ground. For <span className="font-mono-code text-sq-text">&ldquo;{query}&rdquo;</span>,
            SatQuery returns the region, the change measured inside it, and the notes that support it.
          </>
        }
      >
        An answer you can locate
      </SectionTitle>

      <div className="mt-12 grid gap-4 lg:grid-cols-[minmax(0,8fr)_minmax(0,4fr)]">
        <EvidenceMap />

        {/* The console's own result panel, placed in flow instead of floating over the globe */}
        <div className="[&>div]:static [&>div]:w-full">
          <SpatialResultHUD
            activeResult={PRIMARY_RESULT}
            currentIndex={0}
            totalCount={1}
            onOpenEvidence={openInConsole}
            onOpenTemporalComparison={openInConsole}
          />
        </div>
      </div>

      {/* Answer → Location → Evidence */}
      <dl className="mt-4 grid border border-white/10 md:grid-cols-3">
        <div className="border-b border-white/10 p-4 md:border-b-0 md:border-r">
          <dt><Readout tone="cyan">Answer</Readout></dt>
          <dd className="mt-2 text-sm leading-relaxed text-sq-text">{observation.inference}</dd>
        </div>
        <div className="border-b border-white/10 p-4 md:border-b-0 md:border-r">
          <dt><Readout tone="cyan">Location</Readout></dt>
          <dd className="mt-2 space-y-1 font-mono-code text-xs text-white/80">
            <div>{observation.region}, {observation.country}</div>
            <div className="text-white/50">
              BBOX {minLon.toFixed(1)}, {minLat.toFixed(1)} → {maxLon.toFixed(1)}, {maxLat.toFixed(1)}
            </div>
          </dd>
        </div>
        <div className="p-4">
          <dt><Readout tone="cyan">Evidence</Readout></dt>
          <dd className="mt-2">
            <ul className="space-y-1.5 text-sm leading-relaxed text-sq-text">
              {observation.evidence.map((e) => (
                <li key={e} className="flex gap-2">
                  <span className="mt-2 h-1 w-1 shrink-0 bg-sq-amber" aria-hidden="true" />
                  {e}
                </li>
              ))}
            </ul>
          </dd>
        </div>
      </dl>
    </Section>
  );
};
