/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Console landing page — the front door to the SatQuery console, built in the
 * console's own visual language. The earlier cinematic landing page
 * (components/landing/LandingPage) is untouched and served at /classic.
 */

import React from 'react';
import { useReducedMotion } from 'motion/react';
import { LandingNav, NAV_LINKS } from './LandingNav';
import { ConsoleHero } from './hero/ConsoleHero';
import { HowItWorks } from './sections/HowItWorks';
import { MultimodalSection } from './sections/MultimodalSection';
import { EvidenceSection } from './sections/EvidenceSection';
import { UseCasesSection } from './sections/UseCasesSection';
import { ConsolePreviewSection } from './sections/ConsolePreviewSection';
import { SystemFooter } from './SystemFooter';
import { useActiveSection } from './hooks';

// Every top-level section is observed so the nav clears its highlight over
// sections that have no nav entry (hero, evidence, use cases).
const SECTION_IDS = ['overview', 'evidence', 'use-cases', ...NAV_LINKS.map((l) => l.id)];

interface ConsoleLandingPageProps {
  /** Opens the console, optionally running a query on arrival */
  onOpenConsole: (query?: string) => void;
  /** Opens the console with the image upload wizard */
  onUploadImage: () => void;
  onOpenClassicLanding: () => void;
}

export const ConsoleLandingPage: React.FC<ConsoleLandingPageProps> = ({ onOpenConsole, onUploadImage, onOpenClassicLanding }) => {
  const reducedMotion = Boolean(useReducedMotion());
  const activeId = useActiveSection(SECTION_IDS);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
  };

  return (
    <div className="sq-landing sq-noise relative min-h-screen overflow-x-clip font-sans selection:bg-sq-accent selection:text-black">
      <a
        href="#main"
        className="sr-only z-[70] bg-sq-accent px-3 py-2 font-mono-code text-xs font-bold uppercase text-black focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
      >
        Skip to content
      </a>

      <LandingNav activeId={activeId} onNavigate={scrollToSection} onOpenConsole={() => onOpenConsole()} />

      <main id="main">
        <ConsoleHero
          reducedMotion={reducedMotion}
          onOpenConsole={onOpenConsole}
          onUploadImage={onUploadImage}
          onExploreCapabilities={() => scrollToSection('capabilities')}
        />
        <HowItWorks reducedMotion={reducedMotion} />
        <MultimodalSection reducedMotion={reducedMotion} />
        <EvidenceSection onOpenConsole={onOpenConsole} />
        <UseCasesSection onOpenConsole={onOpenConsole} />
        <ConsolePreviewSection onOpenConsole={onOpenConsole} />
      </main>

      <SystemFooter
        onOpenConsole={() => onOpenConsole()}
        onOpenClassicLanding={onOpenClassicLanding}
        onNavigate={scrollToSection}
      />
    </div>
  );
};
