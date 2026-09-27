/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Small building blocks for the console landing page. Styling mirrors the
 * console's own controls (Header "Investigate" button, result HUD panels).
 */

import React from 'react';
import { cn } from '../../lib/utils';

type ButtonVariant = 'primary' | 'secondary';

interface ConsoleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: 'sm' | 'md';
}

/** Rectangular action button — cyan fill like the console's "Investigate" action. */
export const ConsoleButton: React.FC<ConsoleButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className,
  children,
  type = 'button',
  ...rest
}) => (
  <button
    type={type}
    className={cn(
      'inline-flex items-center justify-center gap-2 font-sans font-bold uppercase tracking-wider transition-colors cursor-pointer',
      size === 'md' ? 'px-5 py-3 text-xs' : 'px-3 py-1.5 text-[11px]',
      variant === 'primary'
        ? 'bg-sq-accent text-black hover:bg-sq-accent-hover'
        : 'border border-white/20 text-sq-text hover:border-sq-accent/60 hover:text-sq-accent bg-black/40',
      className
    )}
    {...rest}
  >
    {children}
  </button>
);

/** Small monospace readout label (the console's 8–10px uppercase metadata). */
export const Readout: React.FC<{ className?: string; children: React.ReactNode; tone?: 'muted' | 'cyan' | 'text' }> = ({
  className,
  children,
  tone = 'muted',
}) => (
  <span
    className={cn(
      'font-mono-code text-[10px] uppercase tracking-[0.18em]',
      tone === 'muted' && 'text-white/45',
      tone === 'cyan' && 'text-sq-accent',
      tone === 'text' && 'text-sq-text',
      className
    )}
  >
    {children}
  </span>
);

/** Status light: cyan = live, orange = investigating, green = confirmed. */
export const StatusDot: React.FC<{ tone?: 'cyan' | 'orange' | 'green' | 'idle'; pulse?: boolean }> = ({
  tone = 'cyan',
  pulse,
}) => (
  <span className="relative inline-flex h-1.5 w-1.5 shrink-0">
    {pulse && (
      <span
        className={cn(
          'absolute inset-0 rounded-full opacity-60 motion-safe:animate-ping',
          tone === 'orange' ? 'bg-sq-amber' : 'bg-sq-accent'
        )}
      />
    )}
    <span
      className={cn(
        'relative h-1.5 w-1.5 rounded-full',
        tone === 'cyan' && 'bg-sq-accent',
        tone === 'orange' && 'bg-sq-amber',
        tone === 'green' && 'bg-sq-positive',
        tone === 'idle' && 'bg-white/25'
      )}
    />
  </span>
);

/** Instrument panel: thin border, header strip, square corners. */
export const Panel: React.FC<{
  title?: React.ReactNode;
  meta?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
}> = ({ title, meta, className, bodyClassName, children }) => (
  <div className={cn('border border-white/12 bg-sq-elevated/90', className)}>
    {(title || meta) && (
      <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-white/[0.03] px-3 py-2">
        {title && <Readout tone="text" className="font-bold">{title}</Readout>}
        {meta && <Readout>{meta}</Readout>}
      </div>
    )}
    <div className={cn('p-3', bodyClassName)}>{children}</div>
  </div>
);

/** Section shell: full-width hairline on top, content inside the page frame rails. */
export const Section: React.FC<{
  id: string;
  label: string;
  index: string;
  className?: string;
  children: React.ReactNode;
}> = ({ id, label, index, className, children }) => (
  <section id={id} aria-labelledby={`${id}-title`} className={cn('relative border-t border-white/10 scroll-mt-14', className)}>
    <div className="mx-auto max-w-[1440px] border-x border-sq-border">
      <div className="flex items-center justify-between border-b border-white/5 px-4 py-2 sm:px-8">
        <Readout tone="cyan">{label}</Readout>
        <Readout>{index}</Readout>
      </div>
      <div className="px-4 py-16 sm:px-8 sm:py-24">{children}</div>
    </div>
  </section>
);

export const SectionTitle: React.FC<{ id: string; children: React.ReactNode; lead?: React.ReactNode }> = ({
  id,
  children,
  lead,
}) => (
  <div className="max-w-3xl space-y-4">
    <h2 id={id} className="text-3xl font-extrabold uppercase leading-[0.95] tracking-tight text-white sm:text-5xl">
      {children}
    </h2>
    {lead && <p className="max-w-2xl text-sm leading-relaxed text-sq-secondary sm:text-base">{lead}</p>}
  </div>
);
