/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Product preview built from the console's real components (Header,
 * TopRankedPanel, WorldMinimap, Footer) fed with registry results, over the
 * same Esri World Imagery the console globe renders. The frame is inert —
 * it is a picture of the console, and the CTA below it opens the real one.
 */

import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Header } from '../../header/Header';
import { Footer } from '../../footer/Footer';
import { TopRankedPanel } from '../../results/TopRankedPanel';
import { WorldMinimap } from '../../results/WorldMinimap';
import { Section, SectionTitle, ConsoleButton, Readout } from '../primitives';
import { RANKED_PREVIEW_RESULTS } from '../landingData';

const PREVIEW_QUERY =
  'Globally, find the 10 regions that experienced the largest decrease in vegetation over the last year.';

// Imagery and markers share one SVG viewBox so they crop together at any aspect ratio.
const WORLD = { w: -180, e: 180, s: -60, n: 75 };
const MAP_W = 1800;
const MAP_H = 675;
const WORLD_IMAGERY_URL =
  'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export' +
  `?bbox=${WORLD.w},${WORLD.s},${WORLD.e},${WORLD.n}&bboxSR=4326&imageSR=4326&size=${MAP_W},${MAP_H}&format=jpg&f=image`;

const px = (lon: number) => ((lon - WORLD.w) / (WORLD.e - WORLD.w)) * MAP_W;
const py = (lat: number) => ((WORLD.n - lat) / (WORLD.n - WORLD.s)) * MAP_H;

const WORKFLOW = ['Query', 'Reason', 'Analyze', 'Visualize'];

const noop = () => undefined;

export const ConsolePreviewSection: React.FC<{ onOpenConsole: (query?: string) => void }> = ({ onOpenConsole }) => {
  const active = RANKED_PREVIEW_RESULTS[0];
  const observationId = `${active.siteCode.replace('SITE_', '')}-${active.observationPeriod.afterDate}`;

  return (
    <Section id="product" label="Product" index="Mission control">
      <SectionTitle
        id="product-title"
        lead="The console is where questions become map layers: ranked regions, a guided tour between them, and the evidence for each."
      >
        From question to spatial intelligence
      </SectionTitle>

      <div className="mt-12">
        <p className="sr-only">
          Preview of the SatQuery console showing a ranked list of regions with the largest vegetation decrease, a
          world overview map, and the query bar.
        </p>

        {/* Console replica — same outer frame as the app shell */}
        <div inert aria-hidden="true" className="relative overflow-hidden border-2 border-sq-border bg-sq-base select-none">
          <Header
            observationId={observationId}
            currentQuery={PREVIEW_QUERY}
            isProcessing={false}
            onOpenQueryModal={noop}
            onSubmitQuery={noop}
          />

          <div className="relative h-[460px] overflow-hidden bg-black sm:h-[560px] lg:h-[620px]">
            <svg viewBox={`0 0 ${MAP_W} ${MAP_H}`} preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
              <image
                href={WORLD_IMAGERY_URL}
                width={MAP_W}
                height={MAP_H}
                preserveAspectRatio="none"
                style={{ filter: 'saturate(0.6) brightness(0.5)' }}
              />
              {/* Result markers */}
              {RANKED_PREVIEW_RESULTS.map((r, i) => {
                const mx = px(r.location.lon);
                const my = py(r.location.lat);
                const color = i === 0 ? '#D3A64A' : '#A6B86A';
                return (
                  <g key={r.id}>
                    <rect x={mx - 7} y={my - 7} width="14" height="14" fill={color} fillOpacity="0.3" stroke={color} strokeWidth="2" />
                    <text x={mx + 13} y={my + 5} fill="rgba(230,226,214,0.75)" fontSize="15" fontFamily="IBM Plex Mono, monospace">
                      #{i + 1}
                    </text>
                  </g>
                );
              })}
            </svg>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(17,18,15,0.75))]" />

            <div className="hidden md:block">
              <TopRankedPanel results={RANKED_PREVIEW_RESULTS} currentIndex={0} onSelectIndex={noop} />
            </div>
            <WorldMinimap
              results={RANKED_PREVIEW_RESULTS}
              activeResult={active}
              telemetry={{ lat: active.location.lat, lon: active.location.lon, altitudeKm: 1650, heading: 0, pitch: -55 }}
              onSelectIndex={noop}
            />

            {/* Workflow strip */}
            <ol className="absolute bottom-4 left-4 flex flex-wrap items-center gap-2 border border-white/15 bg-black/85 px-3 py-2 font-mono-code text-[10px] font-bold uppercase tracking-wider sm:bottom-6 sm:left-6">
              {WORKFLOW.map((step, i) => (
                <li key={step} className="flex items-center gap-2">
                  {i > 0 && <span className="text-white/30">→</span>}
                  <span className={i === WORKFLOW.length - 1 ? 'text-sq-accent' : 'text-white/70'}>{step}</span>
                </li>
              ))}
            </ol>
          </div>

          <Footer
            status="COMPLETED"
            systemMessage={`Identified ${RANKED_PREVIEW_RESULTS.length} matching observations. Flying to ${active.regionName}.`}
          />
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <Readout>Preview rendered from the console’s own components and registry data</Readout>
          <ConsoleButton onClick={() => onOpenConsole(PREVIEW_QUERY)}>
            Enter the console
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </ConsoleButton>
        </div>
      </div>
    </Section>
  );
};
