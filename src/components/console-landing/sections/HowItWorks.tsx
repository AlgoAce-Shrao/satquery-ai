/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Four-stage instrumentation pipeline. Every readout is the real output for the
 * Punjab query: the interpreter's parse and the registry's agent trace.
 */

import React, { useRef } from 'react';
import { motion, useInView } from 'motion/react';
import { Section, SectionTitle, Readout } from '../primitives';
import { PRIMARY_SCENARIO, PRIMARY_RESULT, formatDelta } from '../landingData';

const { query, parsed, observation } = PRIMARY_SCENARIO;

type Row = [string, string];

const STAGES: { code: string; title: string; summary: string; rows?: Row[]; quote?: string }[] = [
  {
    code: '01',
    title: 'Ask',
    summary: 'Type the question the way you would ask an analyst.',
    quote: query,
  },
  {
    code: '02',
    title: 'Understand',
    summary: 'The query is interpreted into place, time, phenomenon and operation.',
    rows: [
      ['Location', parsed.countryFilter ? `${parsed.countryFilter} / ${parsed.spatialScope}` : parsed.spatialScope],
      ['Time range', parsed.timeRange],
      ['Phenomenon', parsed.intent.replace(/_/g, ' ')],
      ['Metric', parsed.targetMetric],
      ['Operation', `${parsed.direction} ${parsed.threshold ?? ''}`.trim()],
    ],
  },
  {
    code: '03',
    title: 'Analyze',
    summary: 'Imagery and geographic context are processed together for the matched region.',
    rows: [
      ['Imagery', observation.platform],
      ['Context', observation.biome ?? observation.country],
      ['Agent', observation.agentTrace?.agent ?? '—'],
      ['Tools', observation.agentTrace?.tools.slice(0, 2).join(', ') ?? '—'],
    ],
  },
  {
    code: '04',
    title: 'Show evidence',
    summary: 'The answer comes back as a region on the map, with numbers you can check.',
    rows: [
      ['Region', `${PRIMARY_RESULT.polygon.length - 1}-vertex polygon`],
      ['Change', `${formatDelta(observation.percentageChange)} ${observation.metricName.split(' ')[0]}`],
      ['Area', `${observation.areaAffectedSqKm?.toLocaleString('en-US')} km²`],
      ['Window', `${observation.baselineDate} → ${observation.targetDate}`],
    ],
  },
];

export const HowItWorks: React.FC<{ reducedMotion: boolean }> = ({ reducedMotion }) => {
  const busRef = useRef<HTMLDivElement>(null);
  const inView = useInView(busRef, { once: true, amount: 0.3 });
  const drawn = reducedMotion || inView;

  return (
    <Section id="how-it-works" label="How it works" index="Pipeline / 4 stages">
      <SectionTitle
        id="how-it-works-title"
        lead="One question moves through four stages. Below is the actual trace for a single query against the observation registry."
      >
        From question to evidence
      </SectionTitle>

      <div ref={busRef} className="relative mt-14">
        {/* Connector bus (desktop: horizontal, mobile: vertical rail) */}
        <div aria-hidden="true" className="absolute left-0 right-0 top-0 hidden h-px bg-white/10 lg:block">
          <motion.div
            className="h-full origin-left bg-sq-accent"
            initial={false}
            animate={{ scaleX: drawn ? 1 : 0 }}
            transition={{ duration: reducedMotion ? 0 : 1.8, ease: [0.3, 0.6, 0.2, 1] }}
          />
        </div>
        <div aria-hidden="true" className="absolute bottom-0 left-[5px] top-0 w-px bg-white/10 lg:hidden">
          <motion.div
            className="h-full w-full origin-top bg-sq-accent"
            initial={false}
            animate={{ scaleY: drawn ? 1 : 0 }}
            transition={{ duration: reducedMotion ? 0 : 1.8, ease: [0.3, 0.6, 0.2, 1] }}
          />
        </div>

        <ol className="grid gap-10 lg:grid-cols-4 lg:gap-0">
          {STAGES.map((stage, i) => (
            <li key={stage.code} className="relative pl-8 lg:pl-0 lg:pr-6 lg:pt-8 lg:not-first:border-l lg:not-first:border-white/5 lg:not-first:pl-6">
              {/* Node */}
              <motion.span
                aria-hidden="true"
                className="absolute left-0 top-1 h-[11px] w-[11px] border border-sq-accent bg-sq-base lg:-top-[5px] lg:left-auto"
                initial={false}
                animate={{ backgroundColor: drawn ? '#A6B86A' : '#11120F' }}
                transition={{ delay: reducedMotion ? 0 : 0.35 + i * 0.4, duration: 0.3 }}
              />
              <div className="flex items-baseline gap-3">
                <span className="font-mono-code text-xs font-bold text-sq-accent">{stage.code}</span>
                <h3 className="text-xl font-extrabold uppercase tracking-tight text-white">{stage.title}</h3>
              </div>
              <p className="mt-2 max-w-xs text-sm leading-relaxed text-sq-secondary">{stage.summary}</p>

              <div className="mt-5 border border-white/10 bg-black/40 p-3 font-mono-code text-[11px]">
                {stage.quote && <p className="leading-5 text-white">&ldquo;{stage.quote}&rdquo;</p>}
                {stage.rows && (
                  <dl className="space-y-1.5">
                    {stage.rows.map(([k, v]) => (
                      <div key={k} className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-2">
                        <dt className="uppercase text-white/40">{k}</dt>
                        <dd className="break-words text-white/85">{v}</dd>
                      </div>
                    ))}
                  </dl>
                )}
              </div>
            </li>
          ))}
        </ol>

        <Readout className="mt-8 block">
          Stages 02–04 show the SatQuery interpreter and registry output for this query.
        </Readout>
      </div>
    </Section>
  );
};
