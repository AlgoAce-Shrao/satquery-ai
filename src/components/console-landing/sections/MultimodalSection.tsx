/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * System-architecture view: three input modalities converge on the reasoning
 * layer, which emits spatial evidence. Sensor and modality lists are read from
 * the observation registry.
 */

import React from 'react';
import { MessageSquareText, Satellite, MapPinned, Cpu, ScanSearch } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Section, SectionTitle, Readout } from '../primitives';
import { REGISTRY_MODALITIES, REGISTRY_SENSORS, REGISTRY_SIZE, PRIMARY_SCENARIO } from '../landingData';

const INPUTS = [
  {
    icon: MessageSquareText,
    title: 'Natural language',
    body: 'Plain-language questions. Place names, dates and phenomena are extracted into a structured query.',
    tags: [PRIMARY_SCENARIO.parsed.intent.replace(/_/g, ' '), PRIMARY_SCENARIO.parsed.spatialScope],
  },
  {
    icon: Satellite,
    title: 'Satellite imagery',
    body: 'Optical and SAR radar observations, compared between two dates.',
    tags: [...REGISTRY_SENSORS.slice(0, 4), ...REGISTRY_MODALITIES],
  },
  {
    icon: MapPinned,
    title: 'Geospatial context',
    body: 'Country, biome, region polygon and bounding box attached to every observation.',
    tags: ['Polygon', 'Bounding box', 'Biome'],
  },
];

const InputModule: React.FC<(typeof INPUTS)[number]> = ({ icon: Icon, title, body, tags }) => (
  <div className="border border-white/12 bg-sq-elevated/80 p-4">
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-sq-accent" aria-hidden="true" />
      <h3 className="font-sans text-xs font-bold uppercase tracking-wider text-white">{title}</h3>
    </div>
    <p className="mt-2 text-sm leading-relaxed text-sq-secondary">{body}</p>
    <ul className="mt-3 flex flex-wrap gap-1.5">
      {tags.map((t) => (
        <li key={t} className="border border-white/10 px-1.5 py-0.5 font-mono-code text-[9px] uppercase tracking-wider text-white/60">
          {t}
        </li>
      ))}
    </ul>
  </div>
);

/** Converging connectors between the three inputs and the core (desktop only). */
const Convergence: React.FC<{ flowing: boolean; direction: 'in' | 'out' }> = ({ flowing, direction }) => (
  <svg aria-hidden="true" viewBox="0 0 100 300" preserveAspectRatio="none" className="hidden h-full w-full lg:block">
    {(direction === 'in' ? [50, 150, 250] : [150]).map((y) => (
      <path
        key={y}
        d={direction === 'in' ? `M0 ${y} C 55 ${y}, 45 150, 100 150` : 'M0 150 L100 150'}
        fill="none"
        stroke="#A6B86A"
        strokeOpacity={0.55}
        strokeWidth={1}
        vectorEffect="non-scaling-stroke"
        strokeDasharray={flowing ? '4 6' : undefined}
        className={cn(flowing && 'sq-flow')}
      />
    ))}
  </svg>
);

export const MultimodalSection: React.FC<{ reducedMotion: boolean }> = ({ reducedMotion }) => (
  <Section id="capabilities" label="Capabilities" index="Multimodal intelligence">
    <SectionTitle
      id="capabilities-title"
      lead="Language alone can’t locate change, and imagery alone can’t answer a question. SatQuery reads all three together."
    >
      Text + imagery + geo-context
    </SectionTitle>

    <div className="mt-14 grid items-stretch gap-3 lg:grid-cols-[minmax(0,4fr)_minmax(0,1fr)_minmax(0,3fr)_minmax(0,1fr)_minmax(0,3fr)] lg:gap-0">
      <div className="grid gap-3">
        {INPUTS.map((input, i) => (
          <React.Fragment key={input.title}>
            {i > 0 && (
              <span aria-hidden="true" className="-my-1 text-center font-mono-code text-sm text-sq-accent lg:hidden">
                +
              </span>
            )}
            <InputModule {...input} />
          </React.Fragment>
        ))}
      </div>

      <Convergence flowing={!reducedMotion} direction="in" />
      <div aria-hidden="true" className="mx-auto h-8 w-px bg-sq-accent/50 lg:hidden" />

      {/* Core */}
      <div className="flex flex-col justify-center">
        <div className="relative border border-sq-accent/60 bg-black p-5 shadow-[0_0_40px_rgba(166,184,106,0.08)]">
          <span className="absolute -left-px -top-px h-2 w-2 bg-sq-accent" aria-hidden="true" />
          <span className="absolute -bottom-px -right-px h-2 w-2 bg-sq-accent" aria-hidden="true" />
          <div className="flex items-center gap-2">
            <Cpu className="h-4 w-4 text-sq-accent" aria-hidden="true" />
            <Readout tone="cyan" className="font-bold">Reasoning layer</Readout>
          </div>
          <p className="mt-3 text-2xl font-black uppercase tracking-tighter text-white">
            SatQuery <span className="text-sq-accent">AI</span>
          </p>
          <ul className="mt-4 space-y-1.5 font-mono-code text-[11px] text-white/70">
            <li>Interprets the query</li>
            <li>Matches it against {REGISTRY_SIZE} registry observations</li>
            <li>Routes to an analysis agent</li>
            <li>Ranks matches by relevance</li>
          </ul>
        </div>
      </div>

      <Convergence flowing={!reducedMotion} direction="out" />
      <div aria-hidden="true" className="mx-auto h-8 w-px bg-sq-accent/50 lg:hidden" />

      {/* Output */}
      <div className="flex flex-col justify-center">
        <div className="border border-white/12 bg-sq-elevated/80 p-5">
          <div className="flex items-center gap-2">
            <ScanSearch className="h-4 w-4 text-sq-amber" aria-hidden="true" />
            <h3 className="font-sans text-xs font-bold uppercase tracking-wider text-white">Spatial evidence</h3>
          </div>
          <dl className="mt-4 space-y-2 font-mono-code text-[11px]">
            {[
              ['Where', 'Region polygon on the globe'],
              ['How much', 'Index change, before → after'],
              ['How sure', 'Model confidence'],
              ['Why', 'Evidence notes and drivers'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3 border-b border-white/5 pb-1.5 last:border-0">
                <dt className="uppercase text-white/40">{k}</dt>
                <dd className="text-right text-white/85">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  </Section>
);
