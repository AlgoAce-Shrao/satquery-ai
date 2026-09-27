/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Hosts the lazily-loaded SatQuery globe with a static fallback, a WebGL
 * error boundary, and a restrained set of HUD readouts around it.
 */

import React, { Suspense, lazy, useEffect, useState } from 'react';
import { StatusDot, Readout } from '../primitives';
import { QueryScenario, REGISTRY_SIZE, formatLat, formatLon } from '../landingData';
import { QueryPhase, phaseAtLeast } from '../useQuerySequence';

const SatQueryGlobe = lazy(() => import('../globe/SatQueryGlobe'));

function hasWebGL() {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

class GlobeErrorBoundary extends React.Component<{ fallback: React.ReactNode; children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    console.warn('SatQuery globe failed to render; showing static fallback.', error);
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

/** Static globe silhouette shown while three.js loads, or if WebGL is unavailable. */
const GlobeFallback: React.FC = () => (
  <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
    <svg viewBox="0 0 200 200" className="h-[62%] w-auto max-w-full opacity-60">
      <circle cx="100" cy="100" r="78" fill="#191A16" stroke="rgba(157,155,143,0.35)" strokeWidth="0.6" />
      {[-60, -30, 0, 30, 60].map((lat) => {
        const ry = 78 * Math.cos((lat * Math.PI) / 180);
        const cy = 100 - 78 * Math.sin((lat * Math.PI) / 180);
        return <ellipse key={lat} cx="100" cy={cy} rx={ry} ry={ry * 0.12} fill="none" stroke="rgba(157,155,143,0.14)" strokeWidth="0.5" />;
      })}
      {[20, 45, 70].map((rx) => (
        <ellipse key={rx} cx="100" cy="100" rx={rx} ry="78" fill="none" stroke="rgba(157,155,143,0.14)" strokeWidth="0.5" />
      ))}
    </svg>
    <Readout className="absolute bottom-[14%]">Initializing globe</Readout>
  </div>
);

interface GlobeStageProps {
  scenario: QueryScenario;
  phase: QueryPhase;
  reducedMotion: boolean;
  compact: boolean;
  active: boolean;
}

export const GlobeStage: React.FC<GlobeStageProps> = ({ scenario, phase, reducedMotion, compact, active }) => {
  const [mountGlobe, setMountGlobe] = useState(false);
  const [webgl, setWebgl] = useState(true);

  // Defer the WebGL chunk until after first paint so the hero text renders immediately.
  useEffect(() => {
    if (!hasWebGL()) {
      setWebgl(false);
      return;
    }
    const idle = (window as any).requestIdleCallback as ((cb: () => void, o?: { timeout: number }) => number) | undefined;
    if (idle) {
      const id = idle(() => setMountGlobe(true), { timeout: 900 });
      return () => (window as any).cancelIdleCallback?.(id);
    }
    const t = setTimeout(() => setMountGlobe(true), 300);
    return () => clearTimeout(t);
  }, []);

  const { observation } = scenario;
  const focused = phaseAtLeast(phase, 'REGION');
  const ready = phase === 'READY';

  return (
    <div className="relative h-full w-full">
      {/* Frame corner ticks */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-3 sm:inset-6">
        {['left-0 top-0 border-l border-t', 'right-0 top-0 border-r border-t', 'left-0 bottom-0 border-l border-b', 'right-0 bottom-0 border-r border-b'].map((c) => (
          <span key={c} className={`absolute h-3 w-3 border-sq-accent/50 ${c}`} />
        ))}
      </div>

      <div className="absolute inset-0">
        <GlobeFallback />
        {webgl && mountGlobe && (
          <GlobeErrorBoundary fallback={null}>
            <Suspense fallback={null}>
              <div className="absolute inset-0 bg-sq-base">
                <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(230,226,214,0.06)_0%,rgba(166,184,106,0.025)_38%,transparent_62%)]" />
                <SatQueryGlobe
                  scenario={scenario}
                  phase={phase}
                  reducedMotion={reducedMotion}
                  compact={compact}
                  active={active}
                />
              </div>
            </Suspense>
          </GlobeErrorBoundary>
        )}
      </div>

      {/* HUD: top-left coverage readout */}
      <div className="pointer-events-none absolute left-5 top-5 space-y-1 sm:left-9 sm:top-9">
        <div className="flex items-center gap-2">
          <StatusDot tone="cyan" pulse={!reducedMotion} />
          <Readout tone="text">Live Earth observation</Readout>
        </div>
        <div className="h-px w-40 bg-white/15" />
        <Readout>{REGISTRY_SIZE} registry observation sites</Readout>
      </div>

      {/* HUD: top-right coordinates of the active target */}
      <div className="pointer-events-none absolute right-5 top-5 hidden text-right sm:right-9 sm:top-9 sm:block">
        <Readout className="block">Target</Readout>
        <div className="mt-1 font-mono-code text-xs leading-5 text-sq-text">
          <div>
            <span className="text-white/40">LAT </span>
            {focused ? formatLat(observation.latitude) : '——.————'}
          </div>
          <div>
            <span className="text-white/40">LON </span>
            {focused ? formatLon(observation.longitude) : '——.————'}
          </div>
        </div>
      </div>

      {/* HUD: bottom-right analysis status */}
      <div className="pointer-events-none absolute bottom-5 right-5 hidden text-right md:block sm:bottom-9 sm:right-9">
        <Readout className="block">Analysis status</Readout>
        <div className="mt-1 flex items-center justify-end gap-2 font-mono-code text-xs font-bold uppercase tracking-wider">
          <StatusDot tone={ready ? 'green' : focused ? 'orange' : 'idle'} pulse={focused && !ready && !reducedMotion} />
          <span className={ready ? 'text-sq-positive' : focused ? 'text-sq-amber' : 'text-white/50'}>
            {ready ? 'Evidence ready' : focused ? 'Investigating' : 'Standby'}
          </span>
        </div>
        <Readout className="mt-2 block">Text + EO + Geo</Readout>
      </div>
    </div>
  );
};
