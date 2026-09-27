/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * The hero's investigation readout — same structure as the console's
 * InvestigationStatusHUD, fed by the landing query sequence.
 */

import React from 'react';
import { CheckCircle2, Circle, Loader2, ArrowUpRight } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { QueryScenario, formatDelta } from '../landingData';
import { QueryPhase, phaseAtLeast } from '../useQuerySequence';
import { Readout } from '../primitives';

interface Step {
  label: string;
  detail: string;
  runningFrom: QueryPhase;
  doneFrom: QueryPhase;
}

function buildSteps({ parsed, observation }: QueryScenario): Step[] {
  return [
    { label: 'Query received', detail: 'Natural language', runningFrom: 'TYPING', doneFrom: 'PARSED' },
    {
      label: 'Query parsed',
      detail: `${parsed.intent.replace(/_/g, ' ')} / ${parsed.direction.toLowerCase()}`,
      runningFrom: 'PARSED',
      doneFrom: 'REGION',
    },
    { label: 'Region identified', detail: observation.region, runningFrom: 'REGION', doneFrom: 'ANALYZING' },
    {
      label: 'Multimodal analysis',
      detail: `${observation.sensor} / ${observation.metricName.split(' ')[0]}`,
      runningFrom: 'ANALYZING',
      doneFrom: 'READY',
    },
    {
      label: 'Spatial evidence ready',
      detail: `${formatDelta(observation.percentageChange)} across ${observation.areaAffectedSqKm?.toLocaleString('en-US')} km²`,
      runningFrom: 'READY',
      doneFrom: 'READY',
    },
  ];
}

interface QueryTraceProps {
  scenario: QueryScenario;
  scenarioIndex: number;
  scenarioCount: number;
  phase: QueryPhase;
  typedQuery: string;
  onRunInConsole: (query: string) => void;
}

export const QueryTrace: React.FC<QueryTraceProps> = ({
  scenario,
  scenarioIndex,
  scenarioCount,
  phase,
  typedQuery,
  onRunInConsole,
}) => {
  const steps = buildSteps(scenario);
  const typing = phase === 'BOOT' || phase === 'TYPING';

  return (
    <div className="w-full border border-sq-accent/35 bg-black/85 backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
        <Readout tone="cyan" className="font-bold">Investigation</Readout>
        <Readout>
          Query {scenarioIndex + 1}/{scenarioCount}
        </Readout>
      </div>

      <div className="border-b border-white/10 px-3 py-3" aria-live="polite">
        <p className="min-h-[2.5rem] font-mono-code text-[13px] leading-5 text-white">
          <span className="text-sq-accent">&gt; </span>
          {typedQuery}
          {typing && <span className="sq-caret ml-px inline-block h-3.5 w-[7px] translate-y-0.5 bg-sq-accent" />}
        </p>
      </div>

      <ol className="space-y-0.5 px-1.5 py-2 font-mono-code">
        {steps.map((step) => {
          const done = step.doneFrom === step.runningFrom ? phase === step.doneFrom : phaseAtLeast(phase, step.doneFrom);
          const running = !done && phaseAtLeast(phase, step.runningFrom);
          return (
            <li
              key={step.label}
              className={cn(
                'flex items-center justify-between gap-3 px-2 py-1 text-[11px] transition-colors',
                running && 'border-l-2 border-l-sq-accent bg-sq-accent/10 text-white',
                done && 'text-white/85',
                !done && !running && 'text-white/30'
              )}
            >
              <span className="flex min-w-0 items-center gap-2">
                {done ? (
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-sq-accent" aria-hidden="true" />
                ) : running ? (
                  <Loader2 className="h-3.5 w-3.5 shrink-0 text-sq-amber motion-safe:animate-spin" aria-hidden="true" />
                ) : (
                  <Circle className="h-3.5 w-3.5 shrink-0 text-white/20" aria-hidden="true" />
                )}
                <span className="font-semibold uppercase tracking-wide">{step.label}</span>
              </span>
              <span className={cn('truncate text-right text-[10px]', done ? 'text-white/50' : 'text-transparent')}>
                {step.detail}
              </span>
            </li>
          );
        })}
      </ol>

      <div className="flex items-center justify-between gap-3 border-t border-white/10 px-3 py-2">
        <Readout className="truncate">
          {scenario.observation.dataStatus === 'PUBLIC_DATA' ? 'Public satellite data' : 'Demo observation'}
        </Readout>
        <button
          type="button"
          onClick={() => onRunInConsole(scenario.query)}
          className="inline-flex shrink-0 cursor-pointer items-center gap-1 font-sans text-[10px] font-bold uppercase tracking-wider text-sq-accent hover:text-white"
        >
          Run this query in the console
          <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};
