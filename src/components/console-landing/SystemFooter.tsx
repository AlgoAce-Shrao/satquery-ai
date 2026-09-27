/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Readout, StatusDot } from './primitives';
import { REGISTRY_SIZE } from './landingData';

interface SystemFooterProps {
  onOpenConsole: () => void;
  onOpenClassicLanding: () => void;
  onNavigate: (id: string) => void;
}

export const SystemFooter: React.FC<SystemFooterProps> = ({ onOpenConsole, onOpenClassicLanding, onNavigate }) => {
  const links: { label: string; onClick: () => void; href: string }[] = [
    { label: 'Open console', onClick: onOpenConsole, href: '/console' },
    { label: 'How it works', onClick: () => onNavigate('how-it-works'), href: '#how-it-works' },
    { label: 'Capabilities', onClick: () => onNavigate('capabilities'), href: '#capabilities' },
    { label: 'Use cases', onClick: () => onNavigate('use-cases'), href: '#use-cases' },
    { label: 'Classic overview', onClick: onOpenClassicLanding, href: '/classic' },
  ];

  return (
    <footer id="about" aria-labelledby="about-title" className="border-t border-white/10 bg-black scroll-mt-14">
      <div className="mx-auto max-w-[1440px] border-x border-sq-border">
        <div className="grid gap-10 px-4 py-12 sm:px-8 md:grid-cols-[minmax(0,1fr)_auto]">
          <div className="max-w-xl space-y-3">
            <h2 id="about-title" className="text-2xl font-black uppercase leading-none tracking-tighter text-white">
              SatQuery <span className="text-sq-accent">AI</span>
            </h2>
            <Readout className="block">Earth observation intelligence system</Readout>
            <p className="pt-2 text-sm leading-relaxed text-sq-secondary">
              An Earth-observation analyst you can talk to. It combines natural-language understanding, satellite
              image ingestion, spectral index analysis and optical + SAR fusion, and shows its answers on a 3D globe.
              The public registry holds {REGISTRY_SIZE} observations, each labelled as public satellite data or demo data.
            </p>
          </div>

          <nav aria-label="Footer">
            <ul className="grid grid-cols-2 gap-x-8 gap-y-2 md:grid-cols-1">
              {links.map((l) => (
                <li key={l.label}>
                  <a
                    href={l.href}
                    onClick={(e) => {
                      e.preventDefault();
                      l.onClick();
                    }}
                    className="font-sans text-[11px] font-semibold uppercase tracking-wider text-white/55 hover:text-sq-accent"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-4 py-3 sm:px-8">
          <span className="flex items-center gap-2">
            <StatusDot tone="cyan" />
            <Readout tone="text">System status: operational</Readout>
          </span>
          <Readout>Data / Analysis / Evidence</Readout>
          <Readout>© {new Date().getFullYear()} SatQuery AI</Readout>
        </div>
      </div>
    </footer>
  );
};
