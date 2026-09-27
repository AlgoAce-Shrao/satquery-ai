/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Menu, X, ArrowUpRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { ConsoleButton } from './primitives';

export const NAV_LINKS = [
  { id: 'product', label: 'Product' },
  { id: 'capabilities', label: 'Capabilities' },
  { id: 'how-it-works', label: 'How it works' },
  { id: 'about', label: 'About' },
] as const;

interface LandingNavProps {
  activeId: string | null;
  onNavigate: (id: string) => void;
  onOpenConsole: () => void;
}

export const LandingNav: React.FC<LandingNavProps> = ({ activeId, onNavigate, onOpenConsole }) => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const go = (id: string) => {
    setMenuOpen(false);
    onNavigate(id);
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-50 border-b transition-colors duration-300',
        scrolled || menuOpen ? 'border-white/10 bg-sq-base/95 backdrop-blur-md' : 'border-white/5 bg-sq-base/60'
      )}
    >
      <nav aria-label="Primary" className="mx-auto flex h-14 max-w-[1440px] items-center justify-between gap-4 border-x border-sq-border px-4 sm:px-8">
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="group shrink-0 space-y-0.5"
        >
          <span className="block text-lg font-black uppercase leading-none tracking-tighter text-white sm:text-xl">
            SatQuery <span className="text-sq-accent">AI</span>
          </span>
          <span className="hidden font-mono-code text-[8px] font-bold uppercase tracking-[0.25em] text-white/40 sm:block">
            Earth Observation Intelligence
          </span>
        </a>

        <div className="hidden items-center gap-7 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.id}
              href={`#${link.id}`}
              onClick={(e) => {
                e.preventDefault();
                go(link.id);
              }}
              aria-current={activeId === link.id ? 'true' : undefined}
              className={cn(
                'relative py-1 font-sans text-[11px] font-semibold uppercase tracking-wider transition-colors',
                activeId === link.id ? 'text-sq-accent' : 'text-white/55 hover:text-white'
              )}
            >
              {link.label}
              {activeId === link.id && <span className="absolute -bottom-[17px] left-0 right-0 h-px bg-sq-accent" />}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <ConsoleButton size="sm" onClick={onOpenConsole}>
            Open console
            <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
          </ConsoleButton>
          <button
            type="button"
            className="border border-white/15 p-1.5 text-white/70 hover:text-white md:hidden"
            aria-expanded={menuOpen}
            aria-controls="landing-mobile-menu"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMenuOpen((o) => !o)}
          >
            {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div id="landing-mobile-menu" className="border-t border-white/10 md:hidden">
          <ul className="mx-auto max-w-[1440px] divide-y divide-white/5 border-x border-sq-border">
            {NAV_LINKS.map((link) => (
              <li key={link.id}>
                <a
                  href={`#${link.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    go(link.id);
                  }}
                  className={cn(
                    'block px-4 py-3 font-sans text-xs font-semibold uppercase tracking-wider',
                    activeId === link.id ? 'text-sq-accent' : 'text-white/70'
                  )}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
};
