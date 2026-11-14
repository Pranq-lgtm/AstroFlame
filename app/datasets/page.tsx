'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  ExternalLink,
  GitCompare,
  MessageSquarePlus,
  Trash2,
  X,
  Check,
  Database,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import {
  PSI_DATASETS,
  PERSONA_LENSES,
  EXPERIMENTAL_FAMILIES,
  getDatasetFamily,
  getDatasetTelemetryProfile,
  computeWeightedScore,
  type SafetyPillar,
  type IssFacility,
  type ExperimentalFamilyId,
} from '@/backend/psi-datasets';
import { useAstroFlame } from '@/frontend/context/astroflame-context';

export default function PsiDatasetsExplorerPage() {
  const {
    personaRole,
    siWeights,
    activeDatasetId,
    setActiveDatasetId,
    annotations,
    addAnnotation,
    deleteAnnotation,
    triggerToast,
  } = useAstroFlame();

  const currentLens =
    PERSONA_LENSES.find((p) => p.id === personaRole) || PERSONA_LENSES[0];

  const [catalogMode, setCatalogMode] = useState<'core8' | 'all26'>('all26');
  const [pillarFilter, setPillarFilter] = useState<'All' | SafetyPillar>('All');
  const [facilityFilter, setFacilityFilter] = useState<'All' | IssFacility>('All');
  const [familyLock, setFamilyLock] = useState<ExperimentalFamilyId>('SOLID_FLOW');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [comparedIds, setComparedIds] = useState<string[]>([
    'bass-ii-psi-25',
    'saffire-i-ii-psi-98-99',
    'saffire-iv-vi-psi-135',
  ]);
  const [showCompareDrawer, setShowCompareDrawer] = useState<boolean>(true);

  const [annotDatasetId, setAnnotDatasetId] = useState<string>('bass-ii-psi-25');
  const [annotNote, setAnnotNote] = useState<string>('');

  const activeFamilyMeta =
    EXPERIMENTAL_FAMILIES.find((f) => f.id === familyLock) || EXPERIMENTAL_FAMILIES[0];

  const filteredDatasets = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return PSI_DATASETS.filter((d) => {
      if (catalogMode === 'core8' && !d.isCoreAnchor) return false;
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
  }, [catalogMode, pillarFilter, facilityFilter, searchQuery, siWeights]);

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
      // Automatically switch the comparison family to match so unrelated experiments are never mixed
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
    <div className="space-y-8">
      {/* Header & Three Pillars Summary Strip */}
      <section className="space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="space-y-1.5 max-w-3xl">
            <div className="text-xs font-mono text-sky-700 dark:text-sky-400">
              NASA PHYSICAL SCIENCES INFORMATICS (PSI) REPOSITORY · PLATFORM FOUNDATION
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white [text-wrap:balance]">
              PSI Combustion Science Catalog (8 Core Anchors + 16 Extended + 2 Lunar Benchmarks)
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Select any NASA PSI dataset to serve as the active platform foundation, compare scientifically compatible investigations within locked experimental families, and publish researcher annotations to Cloud Firestore.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <div className="flex items-center p-1 bg-slate-200/80 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg">
              <button
                type="button"
                onClick={() => setCatalogMode('core8')}
                className={`px-3 py-1.5 text-xs font-mono rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  catalogMode === 'core8'
                    ? 'bg-amber-600 text-white dark:bg-amber-500 dark:text-slate-950 font-semibold'
                    : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                8 Core Fire-Safety Anchors
              </button>
              <button
                type="button"
                onClick={() => setCatalogMode('all26')}
                className={`px-3 py-1.5 text-xs font-mono rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  catalogMode === 'all26'
                    ? 'bg-sky-600 text-white dark:bg-sky-500 dark:text-slate-950 font-semibold'
                    : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                All 24 PSI + 2 Lunar ({PSI_DATASETS.length})
              </button>
            </div>
          </div>
        </div>

        {/* Three Pillars Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl bg-white dark:bg-[#0f172a]/80 border border-amber-300 dark:border-amber-500/25 p-4 space-y-1.5 shadow-sm">
            <div className="text-xs font-mono text-amber-700 dark:text-amber-400">
              PILLAR 1 · PREVENTION (MATERIAL FLAMMABILITY &amp; SPREAD)
            </div>
            <div className="text-base font-bold text-slate-900 dark:text-white">
              BASS-II, SAFFIRE I–VI, ACME BRE, SPICE, FM2 &amp; LUCI
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Quantifies Limiting Oxygen Concentration (LOC), ≥30%–34% O₂ lunar cabin flammability margins, and laminar smoke-point soot radiation.
            </p>
          </div>

          <div className="rounded-xl bg-white dark:bg-[#0f172a]/80 border border-sky-300 dark:border-sky-400/25 p-4 space-y-1.5 shadow-sm">
            <div className="text-xs font-mono text-sky-700 dark:text-sky-400">
              PILLAR 2 · DETECTION (AEROSOL COAGULATION &amp; SENSORS)
            </div>
            <div className="text-base font-bold text-slate-900 dark:text-white">
              SAME (PSI-102), SAME-R (PSI-101), DAFT &amp; DAFT-2
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Reveals how zero buoyancy causes pyrolysis smoke to linger and coagulate into 0.35–1.2 μm liquid droplets—requiring laser nephelometry over 1g ionization alarms.
            </p>
          </div>

          <div className="rounded-xl bg-white dark:bg-[#0f172a]/80 border border-emerald-300 dark:border-emerald-500/25 p-4 space-y-1.5 shadow-sm">
            <div className="text-xs font-mono text-emerald-700 dark:text-emerald-400">
              PILLAR 3 · SUPPRESSION &amp; COOL-FLAME EXTINCTION
            </div>
            <div className="text-base font-bold text-slate-900 dark:text-white">
              FLEX (PSI-69), ACME CFI-G (85% O₂), E-FIELD (±10 kV) &amp; PSI-142
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Maps CO₂/He/N₂ dilution extinction, electrostatic ±10 kV ion-wind blowoff, and 500–1000 K cool flames that oscillate back into hot ignition.
            </p>
          </div>
        </div>
      </section>

      {/* Scientifically Valid Regime-Locked Comparison Matrix */}
      <section className="rounded-xl bg-sky-50/70 dark:bg-[#0b1124] border border-sky-300 dark:border-sky-400/35 p-5 space-y-4 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <GitCompare className="w-4 h-4 text-sky-700 dark:text-sky-400" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Scientifically Valid Regime-Locked Comparison Matrix ({comparedDatasets.length}/3 Selected)
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                Regime-Locked Comparison
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              To ensure scientific validity, AstroFlame locks side-by-side comparisons within compatible experimental families rather than mixing unrelated physical observables (e.g., droplet <code className="font-mono">d²</code> burn constants vs. aerosol nephelometry).
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowCompareDrawer((prev) => !prev)}
            className="text-xs font-mono text-sky-700 dark:text-sky-400 hover:underline self-start lg:self-auto"
          >
            {showCompareDrawer ? 'Collapse Matrix' : 'Expand Matrix'}
          </button>
        </div>

        {/* Experimental Family Selector Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {EXPERIMENTAL_FAMILIES.map((fam) => {
            const isSelected = fam.id === familyLock;
            return (
              <button
                key={fam.id}
                type="button"
                onClick={() => handleSelectFamilyLock(fam.id)}
                className={`text-left rounded-lg p-3 border transition-all ${
                  isSelected
                    ? 'bg-white dark:bg-slate-900 border-sky-600 dark:border-sky-400 shadow-sm'
                    : 'bg-white/60 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="text-[11px] font-mono font-bold text-sky-700 dark:text-sky-400">
                  {fam.label}
                </div>
                <div className="text-[10px] font-mono text-amber-700 dark:text-amber-300 mt-0.5">
                  Shared Metric: {fam.comparisonUnit}
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
                  {fam.scientificValidityNote}
                </div>
              </button>
            );
          })}
        </div>

        {showCompareDrawer && comparedDatasets.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            {comparedDatasets.map((ds) => {
              const profile = getDatasetTelemetryProfile(ds);
              const isFoundation = ds.id === activeDatasetId;
              return (
                <div
                  key={ds.id}
                  className="rounded-lg bg-white dark:bg-slate-950/90 border border-slate-200 dark:border-slate-800 p-4 space-y-3 flex flex-col justify-between shadow-sm"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-xs font-mono text-sky-700 dark:text-sky-400">
                          {ds.psiId} · {ds.pillar} · {ds.facility}
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                          {ds.shortTitle}
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleCompareDataset(ds.id)}
                        className="p-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                        title="Remove from comparison"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Empirical Measurement Mini-Chart Grounded in Dataset */}
                    <div className="rounded-md bg-slate-900 dark:bg-[#050814] border border-slate-800 p-2.5">
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-300 mb-1">
                        <span className="truncate">{profile.curves.xAxisLabel}</span>
                        <span className="text-amber-400 shrink-0 ml-1">{activeFamilyMeta.comparisonUnit}</span>
                      </div>
                      <svg viewBox="0 0 220 65" className="w-full h-14">
                        <line x1="15" y1="52" x2="210" y2="52" stroke="#1e293b" strokeWidth="1" />
                        <polyline
                          fill="none"
                          stroke="#f59e0b"
                          strokeWidth="1.8"
                          points={profile.curves.series1Values
                            .map((v, i) => `${18 + i * 36},${52 - (v / 300) * 44}`)
                            .join(' ')}
                        />
                        <polyline
                          fill="none"
                          stroke="#38bdf8"
                          strokeWidth="1.8"
                          points={profile.curves.series2Values
                            .map((v, i) => `${18 + i * 36},${52 - (v / 300) * 44}`)
                            .join(' ')}
                        />
                      </svg>
                    </div>

                    <div className="text-xs font-mono space-y-1 text-slate-700 dark:text-slate-300 pt-1 border-t border-slate-200 dark:border-slate-800/80">
                      <div>
                        <span className="text-slate-500">O₂ Range:</span> {ds.oxygenRange}
                      </div>
                      <div>
                        <span className="text-slate-500">Pressure:</span> {ds.pressureRange}
                      </div>
                      <div>
                        <span className="text-slate-500">Airflow:</span> {ds.airflowRange}
                      </div>
                      <div>
                        <span className="text-slate-500">LOI / Extinction:</span>{' '}
                        <span className="text-amber-700 dark:text-amber-300">{ds.extinctionLimitLOI}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Fuels:</span> {ds.fuelsTested.join(', ')}
                      </div>
                      <div>
                        <span className="text-slate-500">DOI:</span> {ds.doi}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between gap-2">
                    <span className="text-xs text-emerald-700 dark:text-emerald-300 font-mono">
                      SI Score: {computeWeightedScore(ds, siWeights).toFixed(1)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveDatasetId(ds.id)}
                      className={`px-2.5 py-1 text-[11px] font-mono rounded transition-colors ${
                        isFoundation
                          ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 font-semibold'
                          : 'bg-sky-600 hover:bg-sky-500 text-white'
                      }`}
                    >
                      {isFoundation ? '● Active Foundation' : 'Set as Foundation'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Filter Bar */}
      <section className="rounded-xl bg-white dark:bg-[#0f172a]/85 border border-slate-200 dark:border-slate-800 p-4 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by PSI ID, fuel (PMMA, SIBAL, n-heptane, Kapton), DOI, or safety rule..."
            className="w-full pl-9 pr-4 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg">
            {(['All', 'Prevention', 'Detection', 'Suppression'] as const).map((pillar) => (
              <button
                key={pillar}
                type="button"
                onClick={() => setPillarFilter(pillar)}
                className={`px-2.5 py-1 text-xs font-mono rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  pillarFilter === pillar
                    ? 'bg-sky-600 text-white dark:bg-sky-500 dark:text-slate-950 font-semibold'
                    : 'text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {pillar}
              </button>
            ))}
          </div>

          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg">
            {(['All', 'CIR', 'MSG', 'Cygnus', 'Lunar CLPS'] as const).map((fac) => (
              <button
                key={fac}
                type="button"
                onClick={() => setFacilityFilter(fac)}
                className={`px-2.5 py-1 text-xs font-mono rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  facilityFilter === fac
                    ? 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-slate-950 font-semibold'
                    : 'text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {fac}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Dataset Cards Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredDatasets.map((ds) => {
          const isSelectedForCompare = comparedIds.includes(ds.id);
          const isFoundation = ds.id === activeDatasetId;
          const dsFamily = getDatasetFamily(ds);
          const dsFamilyMeta = EXPERIMENTAL_FAMILIES.find((f) => f.id === dsFamily);
          const score = computeWeightedScore(ds, siWeights);
          return (
            <div
              key={ds.id}
              className={`rounded-xl bg-white dark:bg-[#0f172a]/80 border transition-colors p-5 flex flex-col justify-between space-y-4 shadow-sm ${
                isFoundation
                  ? 'border-emerald-500 dark:border-emerald-400 ring-1 ring-emerald-500/30'
                  : 'border-slate-200 dark:border-slate-800 hover:border-sky-400/50'
              }`}
            >
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-slate-500 dark:text-slate-400">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-sky-700 dark:text-sky-400 font-semibold">{ds.psiId}</span>
                    <span aria-hidden="true">·</span>
                    <span
                      className={
                        ds.pillar === 'Prevention'
                          ? 'text-amber-700 dark:text-amber-400'
                          : ds.pillar === 'Detection'
                          ? 'text-sky-700 dark:text-sky-300'
                          : 'text-emerald-700 dark:text-emerald-400'
                      }
                    >
                      {ds.pillar}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{ds.facilityDetail}</span>
                  </div>
                  <div className="font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                    SI {score.toFixed(1)}
                  </div>
                </div>

                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{ds.title}</h3>
                  <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700 shrink-0">
                    {dsFamilyMeta?.label.split('&')[0].trim()}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800/80 rounded-lg p-3">
                  <div>
                    <span className="text-slate-500 block">OXYGEN &amp; PRESSURE</span>
                    <span className="text-amber-700 dark:text-amber-300">{ds.oxygenRange}</span>
                    <span className="block text-slate-600 dark:text-slate-400 text-[11px]">
                      {ds.pressureRange}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">VENTILATION / STRAIN</span>
                    <span className="text-emerald-700 dark:text-emerald-300">{ds.airflowRange}</span>
                    <span className="block text-slate-600 dark:text-slate-400 text-[11px]">
                      Peak T: {ds.peakTempK} · {ds.sampleCount} runs
                    </span>
                  </div>
                </div>

                <div className="text-xs text-slate-700 dark:text-slate-300">
                  <strong className="text-slate-900 dark:text-white">Tested Fuels:</strong>{' '}
                  {ds.fuelsTested.join(' · ')}
                </div>

                <div className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-lg p-3">
                  <div className="font-mono text-[11px] text-amber-700 dark:text-amber-400 mb-1">
                    ACTIONABLE SI FIRE SAFETY RULE
                  </div>
                  {ds.actionableSafetyRule}
                </div>

                <div className="text-xs font-mono text-sky-700 dark:text-sky-300/90">
                  [{currentLens.shortLabel} Lens]: {ds.personaInsights[personaRole]}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
                  <a
                    href={ds.officialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sky-700 dark:text-sky-400 hover:underline inline-flex items-center gap-1"
                  >
                    Official PSI Link
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  {ds.secondaryUrl && (
                    <a
                      href={ds.secondaryUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber-700 dark:text-amber-400 hover:underline inline-flex items-center gap-1"
                    >
                      {ds.secondaryLabel}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setActiveDatasetId(ds.id)}
                    className={`px-2.5 py-1.5 text-xs font-mono rounded-lg transition-colors flex items-center gap-1 whitespace-nowrap shrink-0 ${
                      isFoundation
                        ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 font-semibold'
                        : 'bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    <Database className="w-3.5 h-3.5" />
                    {isFoundation ? 'Foundation Active' : 'Set Foundation'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAnnotDatasetId(ds.id);
                      const el = document.getElementById('annotation-publisher');
                      el?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="px-2.5 py-1.5 text-xs font-mono bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
                  >
                    Annotate
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleCompareDataset(ds.id)}
                    className={`px-3 py-1.5 text-xs font-mono rounded-lg transition-colors flex items-center gap-1 whitespace-nowrap shrink-0 ${
                      isSelectedForCompare
                        ? 'bg-sky-600 text-white dark:bg-sky-500 dark:text-slate-950 font-semibold'
                        : 'bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {isSelectedForCompare ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        Comparing
                      </>
                    ) : (
                      <>
                        <GitCompare className="w-3.5 h-3.5" />
                        Compare
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
        className="rounded-xl bg-white dark:bg-[#0f172a]/90 border border-slate-200 dark:border-sky-400/25 p-5 sm:p-6 space-y-5 shadow-sm"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <MessageSquarePlus className="w-5 h-5 text-sky-600 dark:text-sky-400" />
              <span>Cloud Firestore Researcher Annotations (`psi_annotations`)</span>
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Attach timestamped hypotheses and safety observations to any NASA PSI dataset.
            </p>
          </div>
          <span className="text-xs font-mono text-emerald-700 dark:text-emerald-400">
            ● {annotations.length} Active Annotations
          </span>
        </div>

        <form onSubmit={handlePublishAnnotation} className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-4">
            <label className="block text-xs font-mono text-slate-600 dark:text-slate-400 mb-1">
              Target PSI Investigation
            </label>
            <select
              value={annotDatasetId}
              onChange={(e) => setAnnotDatasetId(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-sky-700 dark:text-sky-300 focus:outline-none focus:border-sky-500"
            >
              {PSI_DATASETS.map((d) => (
                <option key={d.id} value={d.id}>
                  [{d.psiId}] {d.shortTitle}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-6">
            <label className="block text-xs font-mono text-slate-600 dark:text-slate-400 mb-1">
              Researcher Hypothesis / Fire Safety Observation
            </label>
            <input
              type="text"
              required
              maxLength={2000}
              value={annotNote}
              onChange={(e) => setAnnotNote(e.target.value)}
              placeholder="Enter quantitative observation, extinction hypothesis, or spacecraft design rule..."
              className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="md:col-span-2 flex items-end">
            <button
              type="submit"
              className="w-full px-4 py-2 text-xs font-semibold bg-sky-600 hover:bg-sky-500 dark:bg-sky-400 dark:hover:bg-sky-300 text-white dark:text-slate-950 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              Post to Firestore
            </button>
          </div>
        </form>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {annotations.map((ann) => (
            <div
              key={ann.id}
              className="rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4 flex flex-col justify-between space-y-3"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-sky-700 dark:text-sky-400 font-semibold">
                    {ann.datasetTitle}
                  </span>
                  <span className="text-slate-500">{ann.pillarTag}</span>
                </div>
                <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed">
                  {ann.hypothesisNote}
                </p>
              </div>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400">
                <span>
                  {ann.authorName} · {ann.personaRole}
                </span>
                <button
                  type="button"
                  onClick={() => void deleteAnnotation(ann.id)}
                  className="text-rose-600 dark:text-rose-400 hover:text-rose-500 p-1"
                  title="Delete annotation"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
