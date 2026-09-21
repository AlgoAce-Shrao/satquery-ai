/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { Sprout, Flame, Building2, Trees, Droplets, HardHat, ArrowUpRight } from 'lucide-react';

interface ApplicationsSectionProps {
  onSelectApplication?: (query: string) => void;
}

function useInView<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.25 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, inView };
}

interface DomainRowProps {
  dom: {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    desc: string;
    query: string;
    accent: string;
    indices: string;
  };
  flip: boolean;
  onSelect?: (query: string) => void;
}

const DomainRow: React.FC<DomainRowProps> = ({ dom, flip, onSelect }) => {
  const { ref, inView } = useInView<HTMLDivElement>();
  const Icon = dom.icon;
  return (
    <div
      ref={ref}
      onClick={() => onSelect?.(dom.query)}
      className={`grid grid-cols-1 md:grid-cols-12 gap-6 items-center cursor-pointer transition-all duration-700 ${
        inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
      }`}
    >
      <div className={`md:col-span-7 space-y-3 ${flip ? 'md:order-2' : ''}`}>
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xs bg-white/[0.02] border border-white/10 flex items-center justify-center"
            style={{ color: dom.accent }}
          >
            <Icon className="w-4.5 h-4.5" />
          </div>
          <h3 className="text-sm font-mono-code font-semibold uppercase tracking-wider text-[#E8E4D8]">
            {dom.title}
          </h3>
        </div>
        <p className="text-base text-[#96978D] font-sans max-w-md">{dom.desc}</p>
        <div className="pt-1 text-[11px] font-mono-code text-[#96978D] hover:text-[#C88A45] transition-colors flex items-center gap-1">
          <span>&rarr; Try: "{dom.query.slice(0, 46)}..."</span>
        </div>
      </div>

      <div className={`md:col-span-5 ${flip ? 'md:order-1' : ''}`}>
        <div
          className="h-28 rounded-xs border border-white/10 flex items-center justify-between px-5 font-mono-code text-[10px] text-[#96978D] uppercase tracking-wider"
          style={{ background: `linear-gradient(135deg, ${dom.accent}14, transparent)` }}
        >
          <span>{dom.indices}</span>
          <ArrowUpRight className="w-4 h-4" style={{ color: dom.accent }} />
        </div>
      </div>
    </div>
  );
};

export const ApplicationsSection: React.FC<ApplicationsSectionProps> = ({ onSelectApplication }) => {
  const domains = [
    {
      icon: Sprout,
      title: 'AGRICULTURE',
      desc: 'Observe crop canopy over a growing season to identify vigor and drought-stress patterns.',
      query: 'Assess crop NDVI vigor and drought stress in San Joaquin Valley',
      accent: '#7F8C63',
      indices: 'NDVI',
    },
    {
      icon: Flame,
      title: 'DISASTER RESPONSE',
      desc: 'Compare before/after passes to understand flood extent or wildfire scar boundaries.',
      query: 'Delineate flood inundation in Assam Valley using SAR radar',
      accent: '#B85C43',
      indices: 'SAR / NBR',
    },
    {
      icon: Building2,
      title: 'URBAN INTELLIGENCE',
      desc: 'Detect built-up growth patterns and impervious surface expansion across a city.',
      query: 'Analyze urban expansion and coastal reclamation in Dubai',
      accent: '#B8A06A',
      indices: 'NDBI',
    },
    {
      icon: Trees,
      title: 'ENVIRONMENTAL MONITORING',
      desc: 'Track canopy loss or gain across large, otherwise hard-to-patrol geographic areas.',
      query: 'Detect forest canopy loss in Mato Grosso since 2024',
      accent: '#688A58',
      indices: 'NDVI',
    },
    {
      icon: Droplets,
      title: 'WATER INTELLIGENCE',
      desc: 'Observe reservoir extent and surface-water change over successive passes.',
      query: 'Analyze surface water area decrease in Lake Mead',
      accent: '#5A7D9A',
      indices: 'NDWI',
    },
    {
      icon: HardHat,
      title: 'INFRASTRUCTURE',
      desc: 'Watch construction progress and road-corridor development between observations.',
      query: 'Track transport infrastructure construction progress in NEOM',
      accent: '#C88A45',
      indices: 'Optical',
    },
  ];

  return (
    <section className="relative py-28 sm:py-36 px-6 sm:px-12 lg:px-20 text-[#E8E4D8] z-10 border-t border-white/10 bg-gradient-to-b from-black/20 via-[#080907]/80 to-black/30 backdrop-blur-[2px]">
      <div className="max-w-5xl mx-auto space-y-20">
        <div className="space-y-3 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#121410] border border-white/10 text-[#96978D] text-[10px] font-mono-code rounded-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C88A45]" />
            <span className="uppercase tracking-[0.18em] text-[#C88A45] font-medium">
              Real-World Applications
            </span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold uppercase tracking-tight text-[#E8E4D8] font-sans">
            Built for the questions that <span className="text-[#C88A45]">matter.</span>
          </h2>
        </div>

        <div className="space-y-14">
          {domains.map((dom, idx) => (
            <DomainRow key={idx} dom={dom} flip={idx % 2 === 1} onSelect={onSelectApplication} />
          ))}
        </div>
      </div>
    </section>
  );
};
