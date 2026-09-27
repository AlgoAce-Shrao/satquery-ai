/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Full-screen report for an uploaded image: analysis progress, then the answer,
 * land-cover breakdown, located features (drawn on the image), changes for
 * image pairs, insights and a follow-up question box. The globe is left alone
 * unless the user chooses "Show on globe".
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Circle,
  Globe2,
  ImagePlus,
  Loader2,
  TrendingDown,
  TrendingUp,
  X,
  Eye,
  EyeOff,
} from 'lucide-react';
import { AnalysisInput } from '../../types/upload';
import { AnalysisResult, VisionRegion } from '../../types/geospatial';
import { LAND_COVER_COLOR, LAND_COVER_LABEL } from '../../lib/geo/landCover';

export interface ImageInsightReportProps {
  input: AnalysisInput;
  prompt: string;
  status: 'ANALYZING' | 'READY';
  result?: AnalysisResult;
  onClose: () => void;
  onAskFollowUp: (prompt: string) => void;
  onNewUpload: () => void;
  /** Present only when the image has a real location */
  onShowOnGlobe?: () => void;
}

const STAGES = ['Reading the image', 'Identifying land cover', 'Locating key features', 'Writing insights'];
const STAGE_MS = 1400;

function regionTone(r: VisionRegion) {
  if (r.changeStatus === 'DECREASED') return '#B85C4A';
  if (r.changeStatus === 'INCREASED') return '#A6B86A';
  return LAND_COVER_COLOR[r.category];
}

function confidenceLabel(c: number) {
  if (c >= 0.7) return { text: 'High confidence', cls: 'border-sq-positive/50 text-sq-positive' };
  if (c >= 0.45) return { text: 'Medium confidence', cls: 'border-sq-warning/50 text-sq-warning' };
  return { text: 'Low confidence', cls: 'border-white/25 text-white/60' };
}

const SectionHeading: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h3 className="mb-2 font-mono-code text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">{children}</h3>
);

export const ImageInsightReport: React.FC<ImageInsightReportProps> = ({
  input,
  prompt,
  status,
  result,
  onClose,
  onAskFollowUp,
  onNewUpload,
  onShowOnGlobe,
}) => {
  const isPair = input.mode !== 'SINGLE_IMAGE' && Boolean(input.images.secondary);
  const [view, setView] = useState<'primary' | 'secondary'>(isPair ? 'secondary' : 'primary');
  const [showFeatures, setShowFeatures] = useState(true);
  const [hovered, setHovered] = useState<number | null>(null);
  const [stage, setStage] = useState(0);
  const [followUp, setFollowUp] = useState('');
  const backRef = useRef<HTMLButtonElement>(null);

  const analysis = result?.visionAnalysis;
  const analyzing = status === 'ANALYZING';

  // Paced progress while the analysis runs (the last stage holds until the result arrives).
  useEffect(() => {
    if (!analyzing) return;
    setStage(0);
    const id = setInterval(() => setStage((s) => Math.min(STAGES.length - 1, s + 1)), STAGE_MS);
    return () => clearInterval(id);
  }, [analyzing, prompt]);

  // Focus the page once when it opens. (Depending on onClose here re-ran this on every
  // parent render and pulled focus out of the question box while typing.)
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  useEffect(() => {
    backRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCloseRef.current();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    setView(isPair ? 'secondary' : 'primary');
  }, [input.id, isPair]);

  const image = view === 'secondary' && input.images.secondary ? input.images.secondary : input.images.primary;
  // Features are located on the later / first-listed image of a pair — only draw them there.
  const featuresOnThisView = !isPair || view === 'secondary';
  const regions = analysis?.regions ?? [];

  const coverTotal = useMemo(
    () => (analysis?.landCover ?? []).reduce((sum, l) => sum + l.percent, 0),
    [analysis]
  );

  const submitFollowUp = (e: React.FormEvent) => {
    e.preventDefault();
    const q = followUp.trim();
    if (!q) return;
    setFollowUp('');
    onAskFollowUp(q);
  };

  const conf = analysis ? confidenceLabel(analysis.overallConfidence) : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="image-report-title"
      className="fixed inset-0 z-50 flex flex-col bg-sq-base text-white select-text"
    >
      {/* Top bar */}
      <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-white/10 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            ref={backRef}
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 border border-white/15 px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/75 hover:border-white/35 hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Back to console</span>
          </button>
          <div className="min-w-0">
            <h2 id="image-report-title" className="text-sm font-bold uppercase tracking-wide text-white">
              Image analysis
            </h2>
            <p className="truncate font-mono-code text-[10px] text-white/45">
              {input.images.primary.fileName}
              {input.images.secondary ? ` + ${input.images.secondary.fileName}` : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onNewUpload}
            className="flex items-center gap-1.5 border border-white/15 px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/75 hover:border-sq-accent/60 hover:text-sq-accent"
          >
            <ImagePlus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">New upload</span>
          </button>
          <button type="button" onClick={onClose} aria-label="Close report" className="border border-white/15 p-1.5 text-white/60 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-rows-[minmax(0,45vh)_minmax(0,1fr)] lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:grid-rows-1">
        {/* Image stage */}
        <section aria-label="Image" className="relative flex min-h-0 flex-col border-b border-white/10 bg-black lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between gap-2 border-b border-white/10 px-4 py-2">
            {isPair ? (
              <div className="flex border border-white/15 p-0.5 text-[10px] font-semibold uppercase tracking-wider">
                {(['primary', 'secondary'] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setView(v)}
                    className={`px-2.5 py-1 ${view === v ? 'bg-white/15 text-white' : 'text-white/50 hover:text-white'}`}
                  >
                    {input.mode === 'OPTICAL_SAR' ? (v === 'primary' ? 'Optical' : 'Radar') : v === 'primary' ? 'Earlier' : 'Later'}
                  </button>
                ))}
              </div>
            ) : (
              <span className="font-mono-code text-[10px] uppercase tracking-wider text-white/45">
                {image.width}×{image.height}px
              </span>
            )}
            {regions.length > 0 && featuresOnThisView && !analyzing && (
              <button
                type="button"
                onClick={() => setShowFeatures((s) => !s)}
                className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/60 hover:text-white"
              >
                {showFeatures ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                {showFeatures ? 'Hide features' : 'Show features'}
              </button>
            )}
          </div>

          <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden p-4">
            <div className="relative inline-block max-h-full max-w-full">
              <img
                src={image.previewUrl}
                alt={image.fileName}
                className={`block max-h-[calc(45vh-80px)] max-w-full object-contain lg:max-h-[calc(100vh-150px)] ${analyzing ? 'opacity-70' : ''}`}
                draggable={false}
              />
              {analyzing && (
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                  <div className="sq-scanline absolute inset-x-0 top-0 h-full bg-gradient-to-b from-transparent via-sq-accent/20 to-transparent" />
                </div>
              )}
              {!analyzing && showFeatures && featuresOnThisView &&
                regions.map((r, i) => {
                  const [y0, x0, y1, x1] = r.box;
                  const color = regionTone(r);
                  const active = hovered === i;
                  return (
                    <div
                      key={`${r.label}-${i}`}
                      className="absolute border-2 transition-[background-color,box-shadow]"
                      onMouseEnter={() => setHovered(i)}
                      onMouseLeave={() => setHovered(null)}
                      style={{
                        top: `${y0 * 100}%`,
                        left: `${x0 * 100}%`,
                        height: `${(y1 - y0) * 100}%`,
                        width: `${(x1 - x0) * 100}%`,
                        borderColor: color,
                        backgroundColor: active ? `${color}33` : `${color}12`,
                        boxShadow: active ? `0 0 0 2px ${color}` : undefined,
                      }}
                    >
                      {/* Number only, so labels of neighbouring boxes never collide; the name shows on hover */}
                      <span
                        className={`absolute left-0 top-0 whitespace-nowrap px-1 py-0.5 text-[10px] font-bold text-black ${active ? 'z-10' : ''}`}
                        style={{ backgroundColor: color }}
                      >
                        {active ? `${i + 1}. ${r.label}` : i + 1}
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>
        </section>

        {/* Findings */}
        <section aria-label="Findings" aria-live="polite" className="min-h-0 overflow-y-auto">
          <div className="space-y-6 p-5 sm:p-6">
            <div>
              <SectionHeading>Your question</SectionHeading>
              <p className="text-sm text-white/80">“{prompt}”</p>
            </div>

            {analyzing || !analysis ? (
              <div>
                <SectionHeading>Analyzing</SectionHeading>
                <ol className="space-y-2">
                  {STAGES.map((label, i) => {
                    const done = i < stage;
                    const running = i === stage;
                    return (
                      <li
                        key={label}
                        className={`flex items-center gap-2.5 px-2 py-1.5 text-sm ${
                          running ? 'border-l-2 border-sq-accent bg-sq-accent/10 text-white' : done ? 'text-white/80' : 'text-white/35'
                        }`}
                      >
                        {done ? (
                          <CheckCircle2 className="h-4 w-4 text-sq-accent" />
                        ) : running ? (
                          <Loader2 className="h-4 w-4 text-sq-amber motion-safe:animate-spin" />
                        ) : (
                          <Circle className="h-4 w-4 text-white/20" />
                        )}
                        {label}
                      </li>
                    );
                  })}
                </ol>
                <p className="mt-3 text-xs text-white/45">This usually takes a few seconds.</p>
              </div>
            ) : (
              <>
                {/* Answer */}
                <div>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <SectionHeading>Answer</SectionHeading>
                    {conf && (
                      <span className={`mb-2 border px-1.5 py-0.5 font-mono-code text-[9px] font-bold uppercase tracking-wider ${conf.cls}`}>
                        {conf.text}
                      </span>
                    )}
                  </div>
                  <p className="text-lg font-medium leading-snug text-white">{analysis.answer}</p>
                  {analysis.sceneSummary && analysis.level !== 'BASIC' && (
                    <p className="mt-2 text-sm leading-relaxed text-sq-secondary">{analysis.sceneSummary}</p>
                  )}
                  {analysis.level === 'BASIC' && (
                    <p className="mt-2 text-xs leading-relaxed text-white/45">
                      Quick interpretation from the image's colours. Detailed analysis wasn't available for this image, so
                      features are approximate.
                    </p>
                  )}
                </div>

                {/* Land cover */}
                {analysis.landCover.length > 0 && (
                  <div>
                    <SectionHeading>Land cover{isPair ? ' (later image)' : ''}</SectionHeading>
                    <div className="flex h-3 w-full overflow-hidden bg-white/5" role="img" aria-label="Land cover breakdown">
                      {analysis.landCover.map((l) => (
                        <div
                          key={l.category}
                          style={{ width: `${(l.percent / Math.max(100, coverTotal)) * 100}%`, backgroundColor: LAND_COVER_COLOR[l.category] }}
                        />
                      ))}
                    </div>
                    <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                      {analysis.landCover.map((l) => (
                        <li key={l.category} className="flex items-center justify-between gap-2">
                          <span className="flex items-center gap-1.5 text-white/80">
                            <span className="h-2 w-2" style={{ backgroundColor: LAND_COVER_COLOR[l.category] }} />
                            {LAND_COVER_LABEL[l.category]}
                          </span>
                          <span className="font-mono-code text-white/55">{Math.round(l.percent)}%</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Changes (pairs) */}
                {analysis.changes.length > 0 && (
                  <div>
                    <SectionHeading>What changed</SectionHeading>
                    <ul className="space-y-2">
                      {analysis.changes.map((c) => (
                        <li key={c.description} className="flex gap-2 text-sm text-white/85">
                          {c.direction === 'DECREASE' ? (
                            <TrendingDown className="mt-0.5 h-4 w-4 shrink-0 text-sq-critical" />
                          ) : (
                            <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-sq-accent" />
                          )}
                          <span>
                            {c.description}
                            <span className="ml-1.5 font-mono-code text-[10px] uppercase text-white/40">{c.magnitude.toLowerCase()}</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Features */}
                {regions.length > 0 && (
                  <div>
                    <SectionHeading>Features found</SectionHeading>
                    <ul className="space-y-1.5">
                      {regions.map((r, i) => (
                        <li
                          key={`${r.label}-${i}`}
                          onMouseEnter={() => {
                            setHovered(i);
                            if (isPair) setView('secondary');
                          }}
                          onMouseLeave={() => setHovered(null)}
                          className={`border p-2.5 transition-colors ${hovered === i ? 'border-white/30 bg-white/[0.06]' : 'border-white/10'}`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="flex items-center gap-2 text-sm font-semibold text-white">
                              <span className="h-2.5 w-2.5 shrink-0" style={{ backgroundColor: regionTone(r) }} />
                              {i + 1}. {r.label}
                            </span>
                            {(r.changeStatus === 'INCREASED' || r.changeStatus === 'DECREASED') && (
                              <span
                                className={`font-mono-code text-[9px] font-bold uppercase ${
                                  r.changeStatus === 'DECREASED' ? 'text-sq-critical' : 'text-sq-accent'
                                }`}
                              >
                                {r.changeStatus.toLowerCase()}
                              </span>
                            )}
                          </div>
                          {r.observation && <p className="mt-1 text-xs leading-relaxed text-white/65">{r.observation}</p>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Insights */}
                {analysis.insights.length > 0 && (
                  <div>
                    <SectionHeading>Key insights</SectionHeading>
                    <ul className="space-y-1.5">
                      {analysis.insights.map((insight) => (
                        <li key={insight} className="flex gap-2 text-sm leading-relaxed text-white/80">
                          <span className="mt-2 h-1 w-1 shrink-0 bg-sq-amber" />
                          {insight}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Notes */}
                {(analysis.caveats.length > 0 || analysis.imageQuality.notes) && (
                  <div>
                    <SectionHeading>Notes</SectionHeading>
                    <ul className="space-y-1 text-xs leading-relaxed text-white/50">
                      {analysis.imageQuality.notes && <li>{analysis.imageQuality.notes}</li>}
                      {analysis.caveats.map((c) => (
                        <li key={c}>{c}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Follow-up */}
                <form onSubmit={submitFollowUp} className="border-t border-white/10 pt-5">
                  <label htmlFor="report-followup" className="mb-2 block font-mono-code text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">
                    Ask something else about this image
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="report-followup"
                      value={followUp}
                      onChange={(e) => setFollowUp(e.target.value)}
                      placeholder="e.g. Is there any water in this area?"
                      className="min-w-0 flex-1 border border-white/20 bg-black/60 px-3 py-2 text-sm text-white placeholder-white/35 focus:border-sq-accent focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={!followUp.trim()}
                      className="flex items-center gap-1.5 bg-sq-accent px-3 py-2 text-xs font-bold uppercase tracking-wider text-black hover:bg-sq-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Ask
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </form>

                {onShowOnGlobe ? (
                  <button
                    type="button"
                    onClick={onShowOnGlobe}
                    className="flex w-full items-center justify-center gap-2 border border-sq-accent/50 py-2.5 text-xs font-bold uppercase tracking-wider text-sq-accent hover:bg-sq-accent/10"
                  >
                    <Globe2 className="h-4 w-4" />
                    Show on globe
                  </button>
                ) : (
                  <p className="text-xs text-white/40">
                    Add a location in the upload window to place this image on the globe.
                  </p>
                )}
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
