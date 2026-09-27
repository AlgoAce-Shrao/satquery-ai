/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Anchored "what changed here" callout for the active region on the globe.
 * The globe calls `place()` every frame with the region's screen position;
 * positioning is written straight to the DOM so camera motion never triggers
 * React re-renders.
 */

import { forwardRef, useImperativeHandle, useRef } from 'react';
import { TrendingDown, TrendingUp, Minus, ScanSearch } from 'lucide-react';
import { RegionInsight, TONE_HEX } from '../../lib/geo/regionInsight';

export interface RegionCalloutHandle {
  /** x/y in container pixels; visible=false hides the callout (e.g. region behind the globe) */
  place: (x: number, y: number, visible: boolean, containerWidth: number, containerHeight: number) => void;
}

interface RegionCalloutProps {
  insight: RegionInsight;
  regionName: string;
}

const CARD_WIDTH = 272;
const OFFSET = 56;
const EDGE = 16;
const TOP_RESERVED = 64; // telemetry badges and globe controls

const TONE_TEXT: Record<RegionInsight['tone'], string> = {
  critical: 'text-sq-critical',
  positive: 'text-sq-positive',
  warning: 'text-sq-warning',
  neutral: 'text-sq-secondary',
};

export const RegionCallout = forwardRef<RegionCalloutHandle, RegionCalloutProps>(({ insight, regionName }, ref) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<SVGPolylineElement>(null);
  const dotRef = useRef<SVGRectElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const pulseRef = useRef<SVGGElement>(null);

  useImperativeHandle(ref, () => ({
    place(x, y, visible, width, height) {
      const card = cardRef.current;
      const line = lineRef.current;
      const dot = dotRef.current;
      const svg = svgRef.current;
      const pulse = pulseRef.current;
      if (!card || !line || !dot || !svg || !pulse) return;

      const onScreen = visible && x > 0 && y > 0 && x < width && y < height;
      card.style.opacity = onScreen ? '1' : '0';
      svg.style.opacity = onScreen ? '1' : '0';
      if (!onScreen) return;

      const h = card.offsetHeight || 180;
      // Prefer up-right of the anchor; flip horizontally / vertically near edges.
      let left = x + OFFSET;
      const toLeft = left + CARD_WIDTH > width - EDGE;
      if (toLeft) left = x - OFFSET - CARD_WIDTH;
      let top = y - OFFSET - h;
      const below = top < TOP_RESERVED;
      if (below) top = y + OFFSET;
      left = Math.max(EDGE, Math.min(width - CARD_WIDTH - EDGE, left));
      top = Math.max(TOP_RESERVED, Math.min(height - h - EDGE, top));

      card.style.transform = `translate(${Math.round(left)}px, ${Math.round(top)}px)`;

      // Elbow leader: anchor → diagonal → horizontal into the card's near edge.
      const cardEdgeX = toLeft ? left + CARD_WIDTH : left;
      const cardEdgeY = below ? top + 18 : top + h - 18;
      const elbowX = cardEdgeX + (toLeft ? 18 : -18);
      line.setAttribute('points', `${x},${y} ${elbowX},${cardEdgeY} ${cardEdgeX},${cardEdgeY}`);
      dot.setAttribute('x', String(x - 3));
      dot.setAttribute('y', String(y - 3));
      pulse.setAttribute('transform', `translate(${x} ${y})`);
    },
  }));

  const toneHex = TONE_HEX[insight.tone];
  const DirectionIcon = insight.direction === 'Decrease' ? TrendingDown : insight.direction === 'Increase' ? TrendingUp : Minus;

  return (
    <>
      <svg ref={svgRef} aria-hidden="true" className="pointer-events-none absolute inset-0 z-10 h-full w-full transition-opacity duration-300" style={{ opacity: 0 }}>
        {/* Highlight on the region: steady target ring + expanding pulse */}
        <g ref={pulseRef}>
          <circle r="30" fill="none" stroke={toneHex} strokeWidth="1.5" className="sq-pulse-ring" />
          <circle r="14" fill="none" stroke={toneHex} strokeWidth="1.5" strokeOpacity="0.95" />
          <circle r="14" fill={toneHex} fillOpacity="0.12" />
        </g>
        <polyline ref={lineRef} fill="none" stroke={toneHex} strokeWidth="1.25" strokeOpacity="0.9" />
        <rect ref={dotRef} width="6" height="6" fill={toneHex} />
      </svg>

      <div
        ref={cardRef}
        role="note"
        aria-label={`${insight.headline} at ${regionName}`}
        className="pointer-events-none absolute left-0 top-0 z-20 border bg-black/90 shadow-2xl backdrop-blur-md transition-opacity duration-300"
        style={{ width: CARD_WIDTH, opacity: 0, borderColor: `${toneHex}99` }}
      >
        <div className="flex items-center justify-between gap-2 border-b border-white/10 px-3 py-1.5">
          <span className="flex items-center gap-1.5 font-mono-code text-[9px] font-bold uppercase tracking-widest text-white/60">
            <ScanSearch className="h-3 w-3" style={{ color: toneHex }} />
            {insight.theme} · {insight.direction}
          </span>
          <span className="font-mono-code text-[8px] uppercase tracking-wider text-white/40">{insight.source}</span>
        </div>

        <div className="space-y-2 px-3 py-2.5">
          <div>
            <p className="text-sm font-bold leading-tight text-white">{insight.headline}</p>
            <p className="mt-0.5 truncate text-[10px] text-white/50">{regionName}</p>
          </div>

          <div className="flex items-baseline justify-between gap-2">
            <span className={`flex items-center gap-1 font-mono-code text-lg font-bold tracking-tight ${TONE_TEXT[insight.tone]}`}>
              <DirectionIcon className="h-4 w-4" />
              {insight.deltaText}
            </span>
            {insight.beforeAfter && <span className="font-mono-code text-[10px] text-white/60">{insight.beforeAfter}</span>}
          </div>

          <dl className="space-y-0.5 border-t border-white/10 pt-1.5 font-mono-code text-[9px]">
            {insight.area && (
              <div className="flex justify-between gap-2">
                <dt className="uppercase text-white/40">Area</dt>
                <dd className="text-white/85">{insight.area}</dd>
              </div>
            )}
            {insight.period && (
              <div className="flex justify-between gap-2">
                <dt className="uppercase text-white/40">Period</dt>
                <dd className="text-right text-white/85">{insight.period}</dd>
              </div>
            )}
            {insight.driver && (
              <div className="flex justify-between gap-2">
                <dt className="shrink-0 uppercase text-white/40">Driver</dt>
                <dd className="truncate text-right text-sq-amber">{insight.driver}</dd>
              </div>
            )}
          </dl>

          {insight.evidence && (
            <p className="line-clamp-2 border-l-2 pl-2 text-[10px] leading-snug text-white/70" style={{ borderColor: toneHex }}>
              {insight.evidence}
            </p>
          )}
        </div>
      </div>
    </>
  );
});

RegionCallout.displayName = 'RegionCallout';
