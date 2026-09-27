/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ArrowUpRight, Compass } from 'lucide-react';

interface MinimalHeaderProps {
  onLaunchApp: () => void;
  onCapabilitiesClick?: () => void;
  onApplicationsClick?: () => void;
}

export const MinimalHeader: React.FC<MinimalHeaderProps> = ({
  onLaunchApp,
  onCapabilitiesClick,
  onApplicationsClick,
}) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-6 sm:px-12 py-4.5 bg-gradient-to-b from-sq-base/90 via-sq-base/60 to-transparent backdrop-blur-[4px] transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-3 cursor-pointer select-none" onClick={onLaunchApp}>
          <div className="w-8 h-8 rounded bg-sq-surface border border-sq-amber/40 flex items-center justify-center text-sq-amber">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 font-sans font-bold text-base tracking-tight text-sq-text">
              <span>SATQUERY</span>
              <span className="text-sq-amber font-normal">AI</span>
            </div>
            <div className="font-mono-code text-[8.5px] text-sq-secondary uppercase tracking-[0.2em] -mt-0.5">
              Earth Observation Intelligence
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-6">
          <button
            onClick={onCapabilitiesClick}
            className="hidden sm:inline text-xs font-sans uppercase tracking-wider text-sq-secondary hover:text-sq-text transition-colors cursor-pointer"
          >
            Capabilities
          </button>

          <button
            onClick={onApplicationsClick}
            className="hidden sm:inline text-xs font-sans uppercase tracking-wider text-sq-secondary hover:text-sq-text transition-colors cursor-pointer"
          >
            Applications
          </button>

          <button
            onClick={onLaunchApp}
            className="px-4 py-1.5 bg-sq-surface hover:bg-sq-elevated border border-sq-amber/50 hover:border-sq-amber text-sq-text font-sans text-xs font-medium uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer rounded-sm"
          >
            <span>Launch Console</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-sq-amber" />
          </button>
        </div>
      </div>
    </header>
  );
};
