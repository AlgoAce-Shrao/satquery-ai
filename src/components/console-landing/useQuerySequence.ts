/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Drives the hero's simulated investigation: type a query, parse it, fly to the
 * region, analyze, show evidence, then move on to the next scenario. The HUD
 * text and the globe both read from this one state so they stay in lockstep.
 */

import { useEffect, useState } from 'react';
import { QueryScenario } from './landingData';

export type QueryPhase = 'BOOT' | 'TYPING' | 'PARSED' | 'REGION' | 'ANALYZING' | 'READY';

const PHASE_ORDER: QueryPhase[] = ['BOOT', 'TYPING', 'PARSED', 'REGION', 'ANALYZING', 'READY'];

export function phaseAtLeast(phase: QueryPhase, min: QueryPhase) {
  return PHASE_ORDER.indexOf(phase) >= PHASE_ORDER.indexOf(min);
}

const HOLD_MS: Record<Exclude<QueryPhase, 'TYPING'>, number> = {
  BOOT: 1100,
  PARSED: 1500,
  REGION: 2100,
  ANALYZING: 2600,
  READY: 6500,
};

const TYPE_MS = 34;

interface Options {
  reducedMotion: boolean;
  /** Freeze the sequence (e.g. while the hero is scrolled out of view) */
  paused: boolean;
}

export function useQuerySequence(scenarios: QueryScenario[], { reducedMotion, paused }: Options) {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<QueryPhase>(reducedMotion ? 'READY' : 'BOOT');
  const [typed, setTyped] = useState(reducedMotion ? scenarios[0].query.length : 0);

  const scenario = scenarios[index];

  useEffect(() => {
    // Reduced motion: show the finished investigation for the first scenario, no cycling.
    if (reducedMotion) {
      setIndex(0);
      setPhase('READY');
      setTyped(scenarios[0].query.length);
      return;
    }
    if (paused) return;

    let timer: ReturnType<typeof setTimeout>;
    switch (phase) {
      case 'TYPING':
        timer =
          typed < scenario.query.length
            ? setTimeout(() => setTyped((n) => n + 1), TYPE_MS)
            : setTimeout(() => setPhase('PARSED'), 450);
        break;
      case 'READY':
        timer = setTimeout(() => {
          setIndex((i) => (i + 1) % scenarios.length);
          setTyped(0);
          setPhase('BOOT');
        }, HOLD_MS.READY);
        break;
      default: {
        const next = PHASE_ORDER[PHASE_ORDER.indexOf(phase) + 1];
        timer = setTimeout(() => setPhase(next), HOLD_MS[phase]);
      }
    }
    return () => clearTimeout(timer);
  }, [phase, typed, scenario, scenarios, reducedMotion, paused]);

  return { scenario, index, phase, typedQuery: scenario.query.slice(0, typed) };
}
