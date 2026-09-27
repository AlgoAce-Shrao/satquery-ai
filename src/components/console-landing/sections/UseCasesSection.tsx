/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Six Earth-observation scenarios. Counts and example regions come from the
 * registry; each query is one of the console's own preset prompts.
 */

import React from 'react';
import { Trees, Waves, Wheat, Flame, Building2, Globe2, ArrowUpRight } from 'lucide-react';
import { ObservationCategory } from '../../../types/observation';
import { GLOBAL_OBSERVATIONS } from '../../../data/observations';
import { Section, SectionTitle, Readout } from '../primitives';
import { countCategories, firstInCategories } from '../landingData';

const ALL_CATEGORIES = Array.from(new Set(GLOBAL_OBSERVATIONS.map((o) => o.category)));

const USE_CASES: {
  title: string;
  body: string;
  icon: React.ComponentType<{ className?: string }>;
  categories: ObservationCategory[];
  query: string;
}[] = [
  {
    title: 'Environment',
    body: 'Vegetation change, deforestation and land degradation.',
    icon: Trees,
    categories: ['DEFORESTATION', 'VEGETATION_CHANGE'],
    query: 'Show canopy loss and peatland clearing in Central Kalimantan and Sumatra.',
  },
  {
    title: 'Water',
    body: 'Water-body change, coastal and wetland monitoring.',
    icon: Waves,
    categories: ['WATER_CHANGE', 'COASTAL_CHANGE'],
    query: 'Which inland water bodies experienced extreme desiccation and shoreline retreat?',
  },
  {
    title: 'Agriculture',
    body: 'Crop cycles, irrigation and vegetation condition.',
    icon: Wheat,
    categories: ['AGRICULTURE'],
    query: 'Detect center-pivot irrigation expansion in the Nile Delta.',
  },
  {
    title: 'Disaster response',
    body: 'Flood and burn-scar change detection, affected-area mapping.',
    icon: Flame,
    categories: ['FLOOD', 'WILDFIRE'],
    query: 'Show major flood inundation events detected with Sentinel-1 SAR.',
  },
  {
    title: 'Infrastructure',
    body: 'Urban expansion and land-use change.',
    icon: Building2,
    categories: ['URBAN_EXPANSION', 'INFRASTRUCTURE'],
    query: 'Find regions where urban impervious surfaces expanded rapidly.',
  },
  {
    title: 'Strategic monitoring',
    body: 'Large-scale change ranked across the whole registry.',
    icon: Globe2,
    categories: ALL_CATEGORIES,
    query: 'Globally, find the 10 regions that experienced the largest decrease in vegetation over the last year.',
  },
];

export const UseCasesSection: React.FC<{ onOpenConsole: (query?: string) => void }> = ({ onOpenConsole }) => (
  <Section id="use-cases" label="Use cases" index={`${USE_CASES.length} domains`}>
    <SectionTitle id="use-cases-title" lead="Pick a domain to open the console with a starting question already running.">
      Where it’s used
    </SectionTitle>

    <ul className="mt-12 grid border-l border-t border-white/10 sm:grid-cols-2 lg:grid-cols-3">
      {USE_CASES.map(({ title, body, icon: Icon, categories, query }) => {
        const example = firstInCategories(categories);
        return (
          <li key={title} className="border-b border-r border-white/10">
            <button
              type="button"
              onClick={() => onOpenConsole(query)}
              className="group flex h-full w-full cursor-pointer flex-col gap-3 p-5 text-left transition-colors hover:bg-sq-accent/[0.04]"
            >
              <div className="flex w-full items-center justify-between">
                <span className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-sq-accent" />
                  <span className="font-sans text-xs font-bold uppercase tracking-wider text-white">{title}</span>
                </span>
                <Readout>{countCategories(categories)} obs</Readout>
              </div>
              <p className="text-sm leading-relaxed text-sq-secondary">{body}</p>
              {example && (
                <p className="font-mono-code text-[10px] text-white/45">
                  e.g. {example.region}
                </p>
              )}
              <span className="mt-auto flex items-center gap-1 pt-2 font-sans text-[10px] font-bold uppercase tracking-wider text-white/50 group-hover:text-sq-accent">
                Ask in the console
                <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  </Section>
);
