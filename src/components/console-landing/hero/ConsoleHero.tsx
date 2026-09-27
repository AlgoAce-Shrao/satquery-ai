/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from 'react';
import { motion, useInView } from 'motion/react';
import { ArrowRight, ImagePlus } from 'lucide-react';
import { ConsoleButton, Readout } from '../primitives';
import { HERO_SCENARIOS } from '../landingData';
import { useQuerySequence } from '../useQuerySequence';
import { useMediaQuery } from '../hooks';
import { GlobeStage } from './GlobeStage';
import { QueryTrace } from './QueryTrace';

interface ConsoleHeroProps {
  reducedMotion: boolean;
  onOpenConsole: (query?: string) => void;
  onUploadImage: () => void;
  onExploreCapabilities: () => void;
}

const EASE = [0.2, 0.7, 0.1, 1] as const;

export const ConsoleHero: React.FC<ConsoleHeroProps> = ({ reducedMotion, onOpenConsole, onUploadImage, onExploreCapabilities }) => {
  const heroRef = useRef<HTMLElement>(null);
  const inView = useInView(heroRef, { amount: 0.05 });
  const compact = useMediaQuery('(max-width: 767px)');

  const { scenario, index, phase, typedQuery } = useQuerySequence(HERO_SCENARIOS, {
    reducedMotion,
    paused: !inView,
  });

  const reveal = (delay: number) =>
    reducedMotion
      ? {}
      : {
          initial: { opacity: 0, y: 14 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.7, delay, ease: EASE },
        };

  return (
    <section id="overview" ref={heroRef} aria-labelledby="hero-title" className="relative overflow-hidden">
      <div className="sq-grid pointer-events-none absolute inset-0 opacity-60 [mask-image:linear-gradient(to_bottom,black,transparent)]" />

      <div className="relative mx-auto grid max-w-[1440px] border-x border-sq-border lg:min-h-[calc(100svh-3.5rem)] lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:grid-rows-[1fr_auto]">
        {/* Copy */}
        <div className="flex flex-col justify-center gap-7 px-4 pb-8 pt-14 sm:px-8 lg:pb-6 lg:pt-16">
          <motion.div {...reveal(0.05)}>
            <Readout tone="cyan">SatQuery AI / Earth observation intelligence</Readout>
          </motion.div>

          <h1 id="hero-title" className="text-[clamp(2.9rem,5.4vw,5.25rem)] font-extrabold uppercase leading-[0.86] tracking-[-0.035em] text-white">
            <motion.span className="block" {...reveal(0.15)}>
              Ask Earth.
            </motion.span>
            <motion.span className="block" {...reveal(0.3)}>
              Get evidence.
            </motion.span>
          </h1>

          <motion.p className="max-w-[34rem] text-[15px] leading-relaxed text-sq-secondary sm:text-base" {...reveal(0.45)}>
            SatQuery AI turns a plain-language question into geospatial analysis across satellite imagery and
            Earth-observation context — and answers with the place, the measurement, and the evidence behind it.
          </motion.p>

          <motion.div className="flex flex-wrap gap-3" {...reveal(0.55)}>
            <ConsoleButton onClick={() => onOpenConsole()}>
              Open SatQuery
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </ConsoleButton>
            <ConsoleButton variant="secondary" onClick={onUploadImage}>
              <ImagePlus className="h-3.5 w-3.5" aria-hidden="true" />
              Analyze your own image
            </ConsoleButton>
            <button
              type="button"
              onClick={onExploreCapabilities}
              className="px-2 py-3 text-xs font-semibold uppercase tracking-wider text-sq-secondary underline-offset-4 hover:text-white hover:underline cursor-pointer"
            >
              Explore capabilities
            </button>
          </motion.div>
        </div>

        {/* Globe */}
        <motion.div
          className="relative h-[min(92vw,520px)] border-t border-white/5 lg:row-span-2 lg:h-auto lg:min-h-[640px] lg:border-l lg:border-t-0 lg:border-white/5"
          {...(reducedMotion ? {} : { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 1.6, delay: 0.2 } })}
        >
          <GlobeStage scenario={scenario} phase={phase} reducedMotion={reducedMotion} compact={compact} active={inView} />
        </motion.div>

        {/* Investigation trace — sits under the copy on desktop, under the globe on mobile */}
        <motion.div className="px-4 pb-12 pt-2 sm:px-8 lg:pb-10" {...reveal(0.75)}>
          <QueryTrace
            scenario={scenario}
            scenarioIndex={index}
            scenarioCount={HERO_SCENARIOS.length}
            phase={phase}
            typedQuery={typedQuery}
            onRunInConsole={onOpenConsole}
          />
        </motion.div>
      </div>
    </section>
  );
};
