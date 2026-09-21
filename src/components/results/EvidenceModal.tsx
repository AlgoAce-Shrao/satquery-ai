/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AnalysisResult } from '../../types/geospatial';
import { getDataStatusBadge } from '../../lib/dataStatusLabels';
import { X, Database, ShieldCheck, BarChart2, Layers, Download, FileText, Check, Bot } from 'lucide-react';

function downloadBlob(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

function buildTextReport(result: AnalysisResult): string {
  const lines = [
    `SATQUERY AI — EVIDENCE REPORT`,
    `Generated: ${new Date().toISOString()}`,
    ``,
    `Site: ${result.siteCode} | ${result.regionName}, ${result.country}`,
    `Data status: ${getDataStatusBadge(result.dataStatus).longLabel}`,
    ``,
    `HEADLINE: ${result.headline}`,
    result.evidenceNarrative,
    ``,
    `METRIC: ${result.metric.name}`,
    `  Before (${result.observationPeriod.beforeLabel}, ${result.observationPeriod.beforeDate}): ${result.metric.beforeValue}`,
    `  After (${result.observationPeriod.afterLabel}, ${result.observationPeriod.afterDate}): ${result.metric.afterValue}`,
    `  Change: ${result.metric.percentageChange}% (${result.metric.severity})`,
    `  Confidence: ${Math.round(result.confidence * 100)}%`,
    ``,
    `SENSOR: ${result.satellite} / ${result.sensor} (${result.modality})`,
    `Cloud cover: ${result.cloudCover}% | Affected area: ${result.areaAffectedSqKm} km²`,
    ``,
    `SPECTRAL BANDS:`,
    ...result.spectralBands.map(
      (b) => `  ${b.band} (${b.name}, ${b.wavelength}): before=${b.beforeReflectance} after=${b.afterReflectance}`
    ),
    ``,
    `PRIMARY DRIVERS: ${result.primaryDrivers.join(', ')}`,
  ];
  if (result.executionPipeline && result.executionPipeline.length > 0) {
    lines.push('', 'EXECUTION TRACE:');
    for (const stage of result.executionPipeline) {
      lines.push(`  [${stage.stage}] ${stage.title} — ${stage.description}`);
    }
  }
  return lines.join('\n');
}

interface EvidenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: AnalysisResult | null;
}

export const EvidenceModal: React.FC<EvidenceModalProps> = ({
  isOpen,
  onClose,
  result,
}) => {
  const [downloaded, setDownloaded] = React.useState<'JSON' | 'TXT' | null>(null);

  if (!isOpen || !result) return null;

  const handleDownloadJson = () => {
    downloadBlob(`${result.siteCode}_evidence.json`, JSON.stringify(result, null, 2), 'application/json');
    setDownloaded('JSON');
    setTimeout(() => setDownloaded(null), 2000);
  };

  const handleDownloadReport = () => {
    downloadBlob(`${result.siteCode}_report.txt`, buildTextReport(result), 'text/plain');
    setDownloaded('TXT');
    setTimeout(() => setDownloaded(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-[#0a0a0c] border border-white/20 p-6 sm:p-8 shadow-[0_0_80px_rgba(0,0,0,0.9)] flex flex-col gap-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-[#ff4e00]/20 text-[#ff4e00] border border-[#ff4e00]/40 text-[9px] font-mono-code uppercase font-bold">
                {result.siteCode}
              </span>
              <span
                className={`text-[9px] font-mono-code px-2 py-0.5 uppercase font-bold border ${
                  getDataStatusBadge(result.dataStatus).colorClass
                }`}
                title={getDataStatusBadge(result.dataStatus).longLabel}
              >
                {getDataStatusBadge(result.dataStatus).mediumLabel}
              </span>
              <h3 className="text-xl font-bold uppercase tracking-tight text-white">
                Spectral Evidence & Agent Trace
              </h3>
            </div>
            <p className="text-[10px] font-mono-code text-white/40 uppercase tracking-widest">
              {result.regionName} • {result.country}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/40 hover:text-white border border-transparent hover:border-white/20 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Agent Execution Trace Card if present */}
        {result.agentTrace && (
          <div className="p-4 bg-white/5 border border-white/15 space-y-3 font-mono-code text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#3df2ff] uppercase font-bold flex items-center gap-1.5">
                <Bot className="w-4 h-4 text-[#3df2ff]" />
                <span>Multi-Agent Execution Pipeline Trace</span>
              </span>
              <span className="text-[10px] text-white/60">
                Agent Confidence: {Math.round(result.agentTrace.confidence * 100)}%
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] pt-1">
              <div className="bg-black/50 p-2.5 border border-white/10 space-y-1">
                <p className="text-[9px] text-white/40 uppercase">Task & Router</p>
                <p className="text-white font-bold">{result.agentTrace.task}</p>
                <p className="text-[10px] text-[#3df2ff]">{result.agentTrace.agent}</p>
              </div>
              <div className="bg-black/50 p-2.5 border border-white/10 space-y-1">
                <p className="text-[9px] text-white/40 uppercase">Vision Models Invoked</p>
                <p className="text-white font-bold">{result.agentTrace.models.join(' + ')}</p>
              </div>
            </div>
            <div className="bg-black/50 p-2.5 border border-white/10 text-[10px] space-y-1">
              <p className="text-[9px] text-white/40 uppercase">Tools & Analysis Modules</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {result.agentTrace.tools.map((t, i) => (
                  <span key={i} className="px-2 py-0.5 bg-white/10 text-white/90 border border-white/15 text-[9px]">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Scientific Index Computation Card */}
        <div className="p-4 bg-white/5 border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono-code uppercase text-[#3df2ff] font-bold">
              Deterministic Mathematical Model
            </span>
            <span className="text-[10px] font-mono-code text-white/60">
              Metric: {result.metric.name}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono-code text-xs pt-2">
            <div className="bg-black/40 p-3 border border-white/10">
              <p className="text-[10px] text-white/40 uppercase">T0 ({result.observationPeriod.beforeLabel})</p>
              <p className="text-xl font-bold text-white mt-1">{result.metric.beforeValue.toFixed(4)}</p>
              <p className="text-[9px] text-white/30 mt-0.5">Date: {result.observationPeriod.beforeDate}</p>
            </div>
            <div className="bg-black/40 p-3 border border-white/10">
              <p className="text-[10px] text-white/40 uppercase">T1 ({result.observationPeriod.afterLabel})</p>
              <p className="text-xl font-bold text-[#ff4e00] mt-1">{result.metric.afterValue.toFixed(4)}</p>
              <p className="text-[9px] text-white/30 mt-0.5">Date: {result.observationPeriod.afterDate}</p>
            </div>
            <div className="bg-black/40 p-3 border border-white/10">
              <p className="text-[10px] text-white/40 uppercase">Delta Difference</p>
              <p className="text-xl font-bold text-[#ff4e00] mt-1">{result.metric.percentageChange}%</p>
              <p className="text-[9px] text-[#3df2ff] mt-0.5">Confidence: {Math.round(result.confidence * 100)}%</p>
            </div>
          </div>
        </div>

        {/* Multi-Band Spectral Reflectance Table */}
        <div className="space-y-3">
          <p className="text-[10px] font-mono-code font-bold uppercase tracking-widest text-white/60">
            Multi-Spectral Reflectance Profile (Bottom-of-Atmosphere L2A BOA)
          </p>
          <div className="border border-white/10 overflow-x-auto">
            <table className="w-full text-left font-mono-code text-xs">
              <thead className="bg-white/5 text-white/40 text-[10px] uppercase border-b border-white/10">
                <tr>
                  <th className="p-3">Band</th>
                  <th className="p-3">Wavelength</th>
                  <th className="p-3">Spectral Channel</th>
                  <th className="p-3">Before Reflectance</th>
                  <th className="p-3">After Reflectance</th>
                  <th className="p-3">Variance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {result.spectralBands.map((band, idx) => {
                  const variance = ((band.afterReflectance - band.beforeReflectance) / (band.beforeReflectance || 0.001)) * 100;
                  return (
                    <tr key={idx} className="hover:bg-white/[0.02]">
                      <td className="p-3 font-bold text-[#3df2ff]">{band.band}</td>
                      <td className="p-3 text-white/60">{band.wavelength}</td>
                      <td className="p-3 text-white/90">{band.name}</td>
                      <td className="p-3">{band.beforeReflectance.toFixed(3)}</td>
                      <td className="p-3 text-[#ff4e00]">{band.afterReflectance.toFixed(3)}</td>
                      <td className="p-3 font-bold">
                        <span className={variance < 0 ? 'text-[#ff4e00]' : 'text-[#3df2ff]'}>
                          {variance > 0 ? '+' : ''}{variance.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sensor Metadata & Grounding Details */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono-code text-xs">
          <div className="p-3 bg-white/5 border border-white/10">
            <p className="text-[9px] text-white/40 uppercase">Satellite Platform</p>
            <p className="text-white font-bold mt-1">{result.satellite}</p>
          </div>
          <div className="p-3 bg-white/5 border border-white/10">
            <p className="text-[9px] text-white/40 uppercase">Sensor Payload</p>
            <p className="text-white font-bold mt-1">{result.sensor}</p>
          </div>
          <div className="p-3 bg-white/5 border border-white/10">
            <p className="text-[9px] text-white/40 uppercase">Sensor Modality</p>
            <p className="text-[#3df2ff] font-bold mt-1">{result.modality}</p>
          </div>
          <div className="p-3 bg-white/5 border border-white/10">
            <p className="text-[9px] text-white/40 uppercase">Affected Footprint</p>
            <p className="text-white font-bold mt-1">{result.areaAffectedSqKm} km²</p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-white/10 pt-4 font-mono-code">
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadReport}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold uppercase tracking-widest text-white transition-all flex items-center gap-2"
            >
              {downloaded === 'TXT' ? <Check className="w-3.5 h-3.5 text-[#3df2ff]" /> : <FileText className="w-3.5 h-3.5" />}
              <span>{downloaded === 'TXT' ? 'Downloaded' : 'Download Report (.txt)'}</span>
            </button>
            <button
              onClick={handleDownloadJson}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold uppercase tracking-widest text-white transition-all flex items-center gap-2"
            >
              {downloaded === 'JSON' ? <Check className="w-3.5 h-3.5 text-[#3df2ff]" /> : <Download className="w-3.5 h-3.5" />}
              <span>{downloaded === 'JSON' ? 'Downloaded' : 'Download Evidence (.json)'}</span>
            </button>
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-[#3df2ff] text-black font-black text-xs uppercase tracking-widest hover:bg-white transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
