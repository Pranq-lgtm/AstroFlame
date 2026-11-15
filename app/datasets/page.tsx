'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  GitCompare,
  MessageSquarePlus,
  Trash2,
  X,
  Check,
  Database,
  ShieldCheck,
  Bookmark,
  ArrowRight,
} from 'lucide-react';
import {
  PSI_DATASETS,
  EXPERIMENTAL_FAMILIES,
  getDatasetFamily,
  getDatasetTelemetryProfile,
  computeWeightedScore,
  type SafetyPillar,
  type IssFacility,
  type ExperimentalFamilyId,
} from '@/backend/psi-datasets';
import { useAstroFlame } from '@/frontend/context/astroflame-context';

function truncateWords(text: string, maxWords = 14): string {
  const words = text.trim().split(/\s+/);
  if (words.length <= maxWords) return text;
  return `${words.slice(0, maxWords).join(' ')}...`;
}

export default function PsiDatasetsExplorerPage() {
  const {
    siWeights,
    activeDatasetId,
    setActiveDatasetId,
    setInspectedDatasetId,
    bookmarkedDatasetIds,
    toggleBookmarkDataset,
    annotations,
    addAnnotation,
    deleteAnnotation,
    user,
    isAdmin,
    triggerToast,
  } = useAstroFlame();

  // Default to Core 8 Anchor Datasets per Judge Whitespace Optimization
  const [catalogMode, setCatalogMode] = useState<'core8' | 'all26'>('core8');
  const [onlyBookmarked, setOnlyBookmarked] = useState<boolean>(false);
  const [pillarFilter, setPillarFilter] = useState<'All' | SafetyPillar>('All');
  const [facilityFilter, setFacilityFilter] = useState<'All' | IssFacility>('All');
  const [familyLock, setFamilyLock] = useState<ExperimentalFamilyId>('SOLID_FLOW');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [comparedIds, setComparedIds] = useState<string[]>([
    'bass-ii-psi-25',
    'saffire-i-ii-psi-98-99',
    'saffire-iv-vi-psi-135',
  ]);
  const [showCompareDrawer, setShowCompareDrawer] = useState<boolean>(false);

  const [annotDatasetId, setAnnotDatasetId] = useState<string>('bass-ii-psi-25');
  const [annotNote, setAnnotNote] = useState<string>('');

  const activeFamilyMeta =
    EXPERIMENTAL_FAMILIES.find((f) => f.id === familyLock) || EXPERIMENTAL_FAMILIES[0];

  const filteredDatasets = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return PSI_DATASETS.filter((d) => {
      if (onlyBookmarked && !bookmarkedDatasetIds.includes(d.id)) return false;
      if (!onlyBookmarked && catalogMode === 'core8' && !d.isCoreAnchor) return false;
      if (pillarFilter !== 'All' && d.pillar !== pillarFilter) return false;
      if (facilityFilter !== 'All' && d.facility !== facilityFilter) return false;
      if (!q) return true;
      return (
        d.title.toLowerCase().includes(q) ||
        d.psiId.toLowerCase().includes(q) ||
        d.doi.toLowerCase().includes(q) ||
        d.actionableSafetyRule.toLowerCase().includes(q) ||
        d.fuelsTested.some((f) => f.toLowerCase().includes(q))
      );
    }).sort(
      (a, b) => computeWeightedScore(b, siWeights) - computeWeightedScore(a, siWeights)
    );
  }, [
    onlyBookmarked,
    bookmarkedDatasetIds,
    catalogMode,
    pillarFilter,
    facilityFilter,
    searchQuery,
    siWeights,
  ]);

  const comparedDatasets = useMemo(
    () => PSI_DATASETS.filter((d) => comparedIds.includes(d.id)),
    [comparedIds]
  );

  const handleSelectFamilyLock = (newFamily: ExperimentalFamilyId) => {
    setFamilyLock(newFamily);
    const matchingDatasets = PSI_DATASETS.filter(
      (d) => getDatasetFamily(d) === newFamily
    ).slice(0, 3);
    setComparedIds(matchingDatasets.map((d) => d.id));
    setShowCompareDrawer(true);
  };

  const toggleCompareDataset = (id: string) => {
    const targetDs = PSI_DATASETS.find((d) => d.id === id) || PSI_DATASETS[0];
    const targetFamily = getDatasetFamily(targetDs);
    if (targetFamily !== familyLock) {
      setFamilyLock(targetFamily);
      const famMeta = EXPERIMENTAL_FAMILIES.find((f) => f.id === targetFamily);
      const compatiblePeers = PSI_DATASETS.filter(
        (d) => getDatasetFamily(d) === targetFamily && d.id !== id
      ).slice(0, 2);
      setComparedIds([id, ...compatiblePeers.map((p) => p.id)]);
      setShowCompareDrawer(true);
      triggerToast(
        `Switched Comparison Matrix to "${famMeta?.label}" so only scientifically compatible experiments are compared.`
      );
      return;
    }

    setComparedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      if (prev.length >= 3) {
        return [...prev.slice(1), id];
      }
      return [...prev, id];
    });
    setShowCompareDrawer(true);
  };

  const handlePublishAnnotation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annotNote.trim()) return;
    const ds = PSI_DATASETS.find((d) => d.id === annotDatasetId) || PSI_DATASETS[0];
    await addAnnotation({
      datasetId: ds.id,
      datasetTitle: ds.shortTitle,
      pillarTag: ds.pillar,
      hypothesisNote: annotNote.trim(),
    });
    setAnnotNote('');
  };

  return (
    <div className="space-y-12">
      {/* Header & 3-Element Pillar KPI Summary Strip */}
      <section className="space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-5 border-b border-slate-200 dark:border-slate-800">
          <div className="space-y-2 max-w-2xl">
            <div className="text-xs font-mono tracking-wider uppercase text-sky-600 dark:text-sky-400">
              NASA PHYSICAL SCIENCES INFORMATICS (PSI) REPOSITORY
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              PSI Microgravity Combustion Catalog
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Showing 8 Core Fire-Safety Anchor investigations by default. Click &ldquo;Inspect Telemetry &rarr;&rdquo; on any card for full methodology, fuels, and annotations.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setOnlyBookmarked((prev) => !prev)}
              className={`px-3.5 py-2 text-xs font-mono rounded-xl border transition-colors flex items-center gap-1.5 cursor-pointer ${
                onlyBookmarked
                  ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                  : 'bg-white dark:bg-[#0b1124] text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-800'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5 fill-current" />
              <span>Bookmarked ({bookmarkedDatasetIds.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setOnlyBookmarked(false);
                setCatalogMode((prev) => (prev === 'core8' ? 'all26' : 'core8'));
              }}
              className="px-4 py-2 text-xs font-mono font-semibold rounded-xl bg-sky-600 hover:bg-sky-500 text-white dark:bg-sky-400 dark:text-slate-950 transition-colors cursor-pointer"
            >
              {catalogMode === 'core8'
                ? 'Show All 24 PSI Datasets'
                : 'Show Core 8 Anchor Datasets'}
            </button>
          </div>
        </div>

        {/* 3-Element KPI Pillar Cards (Max 3 Visual Elements per Card) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          <div className="rounded-2xl bg-white dark:bg-[#090e21] border border-amber-500/30 p-6 space-y-2 shadow-sm">
            <div className="text-xs font-mono tracking-wider uppercase text-slate-400">
              PILLAR 01 · PREVENTION &amp; SPREAD
            </div>
            <div className="text-2xl md:text-3xl font-mono font-bold text-amber-400">
              14.8% O₂ LOC
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              BASS-II, SAFFIRE I–VI, BRE &amp; Lunar 0.16g flammability limits.
            </div>
          </div>

          <div className="rounded-2xl bg-white dark:bg-[#090e21] border border-sky-500/30 p-6 space-y-2 shadow-sm">
            <div className="text-xs font-mono tracking-wider uppercase text-slate-400">
              PILLAR 02 · SMOKE DETECTION
            </div>
            <div className="text-2xl md:text-3xl font-mono font-bold text-sky-400">
              0.35–1.20 μm CMD
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              SAME &amp; DAFT-2 zero-buoyancy smoke coagulation droplet shift.
            </div>
          </div>

          <div className="rounded-2xl bg-white dark:bg-[#090e21] border border-emerald-500/30 p-6 space-y-2 shadow-sm">
            <div className="text-xs font-mono tracking-wider uppercase text-slate-400">
              PILLAR 03 · SUPPRESSION &amp; NTC
            </div>
            <div className="text-2xl md:text-3xl font-mono font-bold text-emerald-400">
              500–1000 K Cool
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              FLEX, CFI-G (up to 85% O₂) &amp; ±10 kV E-FIELD blowoff.
            </div>
          </div>
        </div>
      </section>

      {/* Filter & Search Bar */}
      <section className="rounded-2xl bg-white dark:bg-[#090e21] border border-slate-200 dark:border-slate-800 p-5 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search PSI ID, fuel (PMMA, SIBAL, n-heptane, Kapton), or DOI..."
            className="w-full pl-10 pr-4 py-2.5 text-xs font-mono bg-slate-50 dark:bg-[#050814] border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center p-1 bg-slate-100 dark:bg-[#050814] border border-slate-300 dark:border-slate-800 rounded-xl">
            {(['All', 'Prevention', 'Detection', 'Suppression'] as const).map((pillar) => (
              <button
                key={pillar}
                type="button"
                onClick={() => setPillarFilter(pillar)}
                className={`px-3 py-1.5 text-xs font-mono rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  pillarFilter === pillar
                    ? 'bg-sky-600 text-white dark:bg-sky-400 dark:text-slate-950 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {pillar}
              </button>
            ))}
          </div>

          <div className="flex items-center p-1 bg-slate-100 dark:bg-[#050814] border border-slate-300 dark:border-slate-800 rounded-xl">
            {(['All', 'CIR', 'MSG', 'Cygnus', 'Lunar CLPS'] as const).map((fac) => (
              <button
                key={fac}
                type="button"
                onClick={() => setFacilityFilter(fac)}
                className={`px-3 py-1.5 text-xs font-mono rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  facilityFilter === fac
                    ? 'bg-emerald-600 text-white dark:bg-emerald-400 dark:text-slate-950 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {fac}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setShowCompareDrawer((prev) => !prev)}
            className="px-3.5 py-2 text-xs font-mono rounded-xl bg-slate-100 dark:bg-[#050814] border border-sky-500/40 text-sky-700 dark:text-sky-300 flex items-center gap-1.5 cursor-pointer"
          >
            <GitCompare className="w-3.5 h-3.5" />
            <span>Compare Matrix ({comparedDatasets.length}/3)</span>
          </button>
        </div>
      </section>

      {/* Collapsible Scientifically Valid Regime-Locked Comparison Matrix */}
      {showCompareDrawer && (
        <section className="rounded-2xl bg-sky-50/70 dark:bg-[#090e21] border border-sky-300 dark:border-sky-500/35 p-6 space-y-5 shadow-md">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <GitCompare className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Regime-Locked Comparison Matrix ({activeFamilyMeta.label})
              </h2>
              <span className="px-2.5 py-0.5 text-[10px] font-mono rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                {activeFamilyMeta.comparisonUnit}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowCompareDrawer(false)}
              className="text-xs font-mono text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
            >
              Hide Matrix
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {EXPERIMENTAL_FAMILIES.map((fam) => {
              const isSelected = fam.id === familyLock;
              return (
                <button
                  key={fam.id}
                  type="button"
                  onClick={() => handleSelectFamilyLock(fam.id)}
                  className={`text-left rounded-xl p-3.5 border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white dark:bg-[#050814] border-sky-500 shadow-xs'
                      : 'bg-white/60 dark:bg-[#050814]/50 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="text-xs font-mono font-bold text-sky-600 dark:text-sky-400">
                    {fam.label}
                  </div>
                  <div className="text-[11px] font-mono text-amber-600 dark:text-amber-300 mt-0.5">
                    {fam.comparisonUnit}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {comparedDatasets.map((ds) => {
              const profile = getDatasetTelemetryProfile(ds);
              const score = computeWeightedScore(ds, siWeights);
              return (
                <div
                  key={ds.id}
                  className="rounded-xl bg-white dark:bg-[#050814] border border-slate-200 dark:border-slate-800 p-5 space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-xs font-mono text-sky-600 dark:text-sky-400">
                          {ds.psiId} · {ds.facility}
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                          {ds.shortTitle}
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleCompareDataset(ds.id)}
                        className="p-1 text-slate-400 hover:text-white cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <svg viewBox="0 0 220 56" className="w-full h-14 bg-slate-950 rounded-lg p-1.5 border border-slate-800">
                      <polyline
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth="2"
                        points={profile.curves.series1Values
                          .map((v, i) => `${14 + i * 38},${48 - (v / 300) * 38}`)
                          .join(' ')}
                      />
                      <polyline
                        fill="none"
                        stroke="#38bdf8"
                        strokeWidth="2"
                        points={profile.curves.series2Values
                          .map((v, i) => `${14 + i * 38},${48 - (v / 300) * 38}`)
                          .join(' ')}
                      />
                    </svg>

                    <div className="text-xs font-mono text-slate-600 dark:text-slate-300 space-y-1">
                      <div>O₂: {ds.oxygenRange}</div>
                      <div>Flow: {ds.airflowRange}</div>
                      <div className="text-amber-600 dark:text-amber-300">
                        LOI: {ds.extinctionLimitLOI}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-mono">
                    <span className="text-emerald-500 font-bold">SI {score.toFixed(1)}</span>
                    <button
                      type="button"
                      onClick={() => setInspectedDatasetId(ds.id)}
                      className="text-sky-400 hover:underline cursor-pointer"
                    >
                      Inspect Telemetry &rarr;
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Decluttered Dataset Cards Grid (Progressive Disclosure with 1-Line Takeaway + Slide-Over Drawer) */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
        {filteredDatasets.map((ds, index) => {
          const isSelectedForCompare = comparedIds.includes(ds.id);
          const isFoundation = ds.id === activeDatasetId;
          const isBookmarked = bookmarkedDatasetIds.includes(ds.id);
          const score = computeWeightedScore(ds, siWeights);
          const pillColor =
            ds.pillar === 'Prevention'
              ? 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/30'
              : ds.pillar === 'Detection'
              ? 'bg-sky-500/15 text-sky-600 dark:text-sky-300 border-sky-500/30'
              : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30';

          return (
            <div
              key={ds.id}
              className={`rounded-2xl bg-white dark:bg-[#090e21] border transition-all p-6 flex flex-col justify-between space-y-5 shadow-md ${
                isFoundation
                  ? 'border-emerald-500 dark:border-emerald-400 ring-1 ring-emerald-500/30'
                  : 'border-slate-200 dark:border-slate-800 hover:border-sky-500/50'
              }`}
            >
              <div className="space-y-4">
                {/* Row 1: Rank Badge, PSI ID, Pillar Pill, Facility Tag & Bookmark */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#050814] border border-slate-300 dark:border-slate-700 font-bold text-slate-900 dark:text-white">
                      #{String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="font-bold text-sky-600 dark:text-sky-400">
                      {ds.psiId}
                    </span>
                    <span className={`px-2 py-0.5 rounded-md border text-[11px] ${pillColor}`}>
                      {ds.pillar}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#050814] border border-slate-300 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400">
                      {ds.facility}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleBookmarkDataset(ds.id)}
                    aria-label={isBookmarked ? 'Remove Bookmark' : 'Bookmark Dataset'}
                    className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                      isBookmarked
                        ? 'bg-amber-500/20 border-amber-400 text-amber-500 dark:text-amber-300'
                        : 'bg-slate-100 dark:bg-[#050814] border-slate-300 dark:border-slate-800 text-slate-400 hover:text-amber-400'
                    }`}
                  >
                    <Bookmark className="w-3.5 h-3.5 fill-current" />
                  </button>
                </div>

                {/* Row 2: Dataset Title */}
                <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
                  {ds.shortTitle}
                </h3>

                {/* Row 3: Composite SI Score Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-500 dark:text-slate-400">
                      COMPOSITE SI SCORE
                    </span>
                    <span className="font-bold text-sky-600 dark:text-sky-400 tabular-nums">
                      {score.toFixed(1)} / 100
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-[#050814] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-sky-500 to-amber-400"
                      style={{ width: `${Math.min(100, Math.max(12, score))}%` }}
                    />
                  </div>
                </div>

                {/* Row 4: 1-Line Takeaway Capped at 14 Words */}
                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-1 font-mono">
                  {truncateWords(ds.actionableSafetyRule, 14)}
                </p>
              </div>

              {/* Row 5: Progressive Disclosure Action Bar */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setInspectedDatasetId(ds.id)}
                  className="px-3.5 py-2 text-xs font-mono font-semibold rounded-xl bg-sky-600 hover:bg-sky-500 text-white dark:bg-sky-400 dark:text-slate-950 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Inspect Telemetry</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveDatasetId(ds.id)}
                    className={`px-3 py-1.5 text-xs font-mono rounded-xl border transition-colors flex items-center gap-1 cursor-pointer ${
                      isFoundation
                        ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40 font-semibold'
                        : 'bg-slate-100 dark:bg-[#050814] text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-800 hover:border-sky-400'
                    }`}
                  >
                    <Database className="w-3 h-3" />
                    <span>{isFoundation ? 'Foundation' : 'Set Active'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleCompareDataset(ds.id)}
                    className={`px-3 py-1.5 text-xs font-mono rounded-xl border transition-colors flex items-center gap-1 cursor-pointer ${
                      isSelectedForCompare
                        ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40 font-semibold'
                        : 'bg-slate-100 dark:bg-[#050814] text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-800'
                    }`}
                  >
                    {isSelectedForCompare ? (
                      <>
                        <Check className="w-3 h-3" />
                        <span>Compared</span>
                      </>
                    ) : (
                      <>
                        <GitCompare className="w-3 h-3" />
                        <span>Compare</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* Researcher Annotation Publisher & Firestore Stream */}
      <section
        id="annotation-publisher"
        className="rounded-2xl bg-white dark:bg-[#090e21] border border-slate-200 dark:border-slate-800 p-6 md:p-8 space-y-6 shadow-sm"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <MessageSquarePlus className="w-5 h-5 text-sky-600 dark:text-sky-400" />
              <span>Cloud Firestore Researcher Annotations (`psi_annotations`)</span>
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Signed-in users and judges can post attributed notes and delete their own records.
            </p>
          </div>
          <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400">
            ● {annotations.length} Saved Notes
          </span>
        </div>

        <form onSubmit={handlePublishAnnotation} className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-4">
            <select
              aria-label="Target PSI Investigation"
              value={annotDatasetId}
              onChange={(e) => setAnnotDatasetId(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs font-mono bg-slate-50 dark:bg-[#050814] border border-slate-300 dark:border-slate-800 rounded-xl text-sky-700 dark:text-sky-300 focus:outline-none focus:border-sky-500"
            >
              {PSI_DATASETS.map((d) => (
                <option key={d.id} value={d.id}>
                  [{d.psiId}] {d.shortTitle}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-6">
            <input
              type="text"
              required
              maxLength={2000}
              value={annotNote}
              onChange={(e) => setAnnotNote(e.target.value)}
              placeholder="Enter quantitative observation, extinction hypothesis, or spacecraft design rule..."
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-[#050814] border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              className="w-full px-4 py-2.5 text-xs font-mono font-semibold bg-sky-600 hover:bg-sky-500 dark:bg-sky-400 dark:hover:bg-sky-300 text-white dark:text-slate-950 rounded-xl transition-colors cursor-pointer"
            >
              Post Note
            </button>
          </div>
        </form>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {annotations.map((ann) => {
            const canDelete = isAdmin || (user && ann.authorUid === user.uid);
            return (
              <div
                key={ann.id}
                className="rounded-xl bg-slate-50 dark:bg-[#050814] border border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-sky-600 dark:text-sky-400 font-semibold">
                      {ann.datasetTitle}
                    </span>
                    <span className="text-slate-500">{ann.pillarTag}</span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-3 leading-relaxed">
                    {ann.hypothesisNote}
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-500">
                  <span className="truncate">{ann.authorName}</span>
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
      </section>
    </div>
  );
}
