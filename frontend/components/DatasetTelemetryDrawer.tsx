'use client';

import React, { useState, useMemo } from 'react';
import {
  X,
  Database,
  ExternalLink,
  Bookmark,
  MessageSquarePlus,
  Trash2,
  Activity,
  Flame,
  ShieldCheck,
} from 'lucide-react';
import {
  PSI_DATASETS,
  PERSONA_LENSES,
  EXPERIMENTAL_FAMILIES,
  getDatasetFamily,
  getDatasetTelemetryProfile,
  computeWeightedScore,
} from '@/backend/psi-datasets';
import { useAstroFlame } from '@/frontend/context/astroflame-context';

export default function DatasetTelemetryDrawer() {
  const {
    inspectedDatasetId,
    setInspectedDatasetId,
    activeDatasetId,
    setActiveDatasetId,
    personaRole,
    siWeights,
    bookmarkedDatasetIds,
    toggleBookmarkDataset,
    annotations,
    addAnnotation,
    deleteAnnotation,
    user,
    isAdmin,
  } = useAstroFlame();

  const [noteInput, setNoteInput] = useState('');

  const dataset = useMemo(
    () => PSI_DATASETS.find((d) => d.id === inspectedDatasetId) || null,
    [inspectedDatasetId]
  );

  if (!dataset) return null;

  const currentLens =
    PERSONA_LENSES.find((p) => p.id === personaRole) || PERSONA_LENSES[0];
  const familyId = getDatasetFamily(dataset);
  const familyMeta =
    EXPERIMENTAL_FAMILIES.find((f) => f.id === familyId) || EXPERIMENTAL_FAMILIES[0];
  const profile = getDatasetTelemetryProfile(dataset);
  const score = computeWeightedScore(dataset, siWeights);
  const isFoundation = dataset.id === activeDatasetId;
  const isBookmarked = bookmarkedDatasetIds.includes(dataset.id);

  const datasetAnnotations = annotations.filter((a) => a.datasetId === dataset.id);

  const handlePostNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteInput.trim()) return;
    await addAnnotation({
      datasetId: dataset.id,
      datasetTitle: dataset.shortTitle,
      pillarTag: dataset.pillar,
      hypothesisNote: noteInput.trim(),
    });
    setNoteInput('');
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end pointer-events-none">
      {/* Backdrop */}
      <div
        onClick={() => setInspectedDatasetId(null)}
        className="fixed inset-0 bg-black/55 backdrop-blur-xs pointer-events-auto transition-opacity"
      />

      <aside
        aria-label={`Inspect Telemetry: ${dataset.title}`}
        className="relative z-10 w-full max-w-xl h-full bg-white dark:bg-[#070b18] border-l border-slate-300 dark:border-slate-800 shadow-2xl flex flex-col pointer-events-auto"
      >
        {/* Top Drawer Header */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-[#0a1024] border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
              <span className="px-2 py-0.5 rounded bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/30 font-bold">
                {dataset.psiId}
              </span>
              <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                {dataset.pillar}
              </span>
              <span className="text-slate-500 dark:text-slate-400">
                {dataset.facilityDetail}
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
              {dataset.title}
            </h2>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => toggleBookmarkDataset(dataset.id)}
              title={isBookmarked ? 'Remove Bookmark' : 'Bookmark Dataset'}
              className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                isBookmarked
                  ? 'bg-amber-500/20 border-amber-400 text-amber-600 dark:text-amber-300'
                  : 'bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400'
              }`}
            >
              <Bookmark className="w-4 h-4 fill-current" />
            </button>
            <button
              type="button"
              onClick={() => setInspectedDatasetId(null)}
              aria-label="Close Telemetry Drawer"
              className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Telemetry & Methodology Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Quick Action Strip */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-slate-100/80 dark:bg-[#0b1124] border border-slate-200 dark:border-slate-800">
            <div>
              <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
                COMPOSITE SI SCORE ({currentLens.shortLabel})
              </div>
              <div className="text-2xl font-mono font-bold text-sky-600 dark:text-sky-400 tabular-nums">
                {score.toFixed(1)}{' '}
                <span className="text-xs font-normal text-slate-500">/ 100.0</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveDatasetId(dataset.id)}
                className={`px-3.5 py-2 text-xs font-mono font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                  isFoundation
                    ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40'
                    : 'bg-sky-600 hover:bg-sky-500 text-white dark:bg-sky-400 dark:text-slate-950'
                }`}
              >
                <Database className="w-3.5 h-3.5" />
                {isFoundation ? '● Active Platform Foundation' : 'Load into Telemetry Cockpit'}
              </button>
            </div>
          </div>

          {/* 3-Element KPI Telemetry Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl bg-slate-50 dark:bg-[#0b1124] border border-slate-200 dark:border-slate-800 p-4 space-y-1">
              <div className="text-xs font-mono tracking-wider uppercase text-slate-400">
                OXYGEN ENVELOPE
              </div>
              <div className="text-xl font-mono font-bold text-amber-600 dark:text-amber-400">
                {dataset.oxygenRange}
              </div>
              <div className="text-[11px] font-mono text-slate-500 truncate">
                {dataset.pressureRange}
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 dark:bg-[#0b1124] border border-slate-200 dark:border-slate-800 p-4 space-y-1">
              <div className="text-xs font-mono tracking-wider uppercase text-slate-400">
                DUCT FLOW / STRAIN
              </div>
              <div className="text-xl font-mono font-bold text-emerald-600 dark:text-emerald-400">
                {dataset.airflowRange}
              </div>
              <div className="text-[11px] font-mono text-slate-500 truncate">
                LOI: {dataset.extinctionLimitLOI}
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 dark:bg-[#0b1124] border border-slate-200 dark:border-slate-800 p-4 space-y-1">
              <div className="text-xs font-mono tracking-wider uppercase text-slate-400">
                PEAK FLAME TEMP
              </div>
              <div className="text-xl font-mono font-bold text-sky-600 dark:text-sky-400">
                {dataset.peakTempK}
              </div>
              <div className="text-[11px] font-mono text-slate-500 truncate">
                {dataset.sampleCount} PSI Runs · DOI {dataset.doi}
              </div>
            </div>
          </div>

          {/* Empirical Telemetry Waveform Preview */}
          <div className="rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
              <span className="text-amber-700 dark:text-amber-400 flex items-center gap-1.5 font-semibold">
                <Activity className="w-3.5 h-3.5" />
                {profile.primaryChannelName} ({profile.primaryChannelUnit})
              </span>
              <span className="text-sky-700 dark:text-sky-400">{familyMeta.label}</span>
            </div>
            <svg viewBox="0 0 360 80" className="w-full h-20">
              <line x1="16" y1="18" x2="344" y2="18" className="stroke-slate-200 dark:stroke-slate-800" strokeWidth="1" />
              <line x1="16" y1="44" x2="344" y2="44" className="stroke-slate-200 dark:stroke-slate-800" strokeWidth="1" />
              <line x1="16" y1="68" x2="344" y2="68" className="stroke-slate-200 dark:stroke-slate-800" strokeWidth="1" />
              <polyline
                fill="none"
                stroke="#d97706"
                strokeWidth="2.2"
                points={profile.curves.series1Values
                  .map((v, i) => `${24 + i * 62},${68 - Math.min(1, v / 300) * 50}`)
                  .join(' ')}
              />
              <polyline
                fill="none"
                stroke="#0284c7"
                strokeWidth="2.2"
                points={profile.curves.series2Values
                  .map((v, i) => `${24 + i * 62},${68 - Math.min(1, v / 300) * 50}`)
                  .join(' ')}
              />
            </svg>
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-600 dark:text-slate-400">
              <span className="text-amber-700 dark:text-amber-400">● {profile.curves.series1Label}</span>
              <span className="text-sky-700 dark:text-sky-400">● {profile.curves.series2Label}</span>
              <span>
                {profile.characteristicLengthLabel}: {profile.characteristicLengthValue}
              </span>
            </div>
          </div>

          {/* Actionable Safety Rule & Role Insight */}
          <div className="rounded-xl bg-slate-50 dark:bg-[#0b1124] border border-slate-200 dark:border-slate-800 p-4 space-y-3">
            <div>
              <div className="text-xs font-mono uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5 mb-1">
                <Flame className="w-3.5 h-3.5" />
                Actionable SI Fire Safety Rule
              </div>
              <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                {dataset.actionableSafetyRule}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
              <div className="text-xs font-mono uppercase tracking-wider text-sky-600 dark:text-sky-400 mb-1">
                [{currentLens.label} Lens Takeaway]
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                {dataset.personaInsights[personaRole]}
              </p>
            </div>
          </div>

          {/* Tested Fuels & Official Citations */}
          <div className="rounded-xl bg-slate-50 dark:bg-[#0b1124] border border-slate-200 dark:border-slate-800 p-4 space-y-3">
            <div className="text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
              TESTED FUELS &amp; SAMPLE INVENTORY
            </div>
            <div className="flex flex-wrap gap-1.5">
              {dataset.fuelsTested.map((fuel) => (
                <span
                  key={fuel}
                  className="px-2.5 py-1 text-xs font-mono rounded-md bg-white dark:bg-[#050814] border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                >
                  {fuel}
                </span>
              ))}
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-mono">
              <a
                href={dataset.officialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sky-600 dark:text-sky-400 hover:underline inline-flex items-center gap-1"
              >
                <span>Official NASA PSI Archive ({dataset.psiId})</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              {dataset.secondaryUrl && (
                <a
                  href={dataset.secondaryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-600 dark:text-amber-400 hover:underline inline-flex items-center gap-1"
                >
                  <span>{dataset.secondaryLabel}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>

          {/* Researcher Annotations for this Dataset */}
          <div className="rounded-xl bg-slate-50 dark:bg-[#0b1124] border border-slate-200 dark:border-slate-800 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-xs font-mono uppercase tracking-wider text-sky-600 dark:text-sky-400 flex items-center gap-1.5">
                <MessageSquarePlus className="w-4 h-4" />
                <span>Researcher Annotations ({datasetAnnotations.length})</span>
              </div>
              <span className="text-[11px] font-mono text-slate-500">
                Posting as: {user?.displayName.split('(')[0].trim() || 'Researcher'}
              </span>
            </div>

            <form onSubmit={handlePostNote} className="space-y-2.5">
              <textarea
                rows={2}
                required
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                placeholder={`Add a quantitative observation or fire safety note for ${dataset.shortTitle}...`}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-[#050814] border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
              />
              <button
                type="submit"
                className="px-4 py-2 text-xs font-mono font-semibold rounded-lg bg-sky-600 hover:bg-sky-500 text-white dark:bg-sky-400 dark:text-slate-950 transition-colors cursor-pointer"
              >
                Save Annotation to Cloud Firestore
              </button>
            </form>

            {datasetAnnotations.length > 0 && (
              <div className="space-y-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
                {datasetAnnotations.map((ann) => {
                  const canDelete = isAdmin || (user && ann.authorUid === user.uid);
                  return (
                    <div
                      key={ann.id}
                      className="rounded-lg bg-white dark:bg-[#050814] border border-slate-200 dark:border-slate-800 p-3 space-y-1.5"
                    >
                      <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed">
                        {ann.hypothesisNote}
                      </p>
                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                        <span>
                          {ann.authorName} · {ann.personaRole}
                        </span>
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => void deleteAnnotation(ann.id)}
                            className="text-rose-500 hover:text-rose-400 p-1 cursor-pointer"
                            title="Delete annotation"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
