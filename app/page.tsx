'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Markdown from 'react-markdown';
import {
  Sliders,
  Sparkles,
  ExternalLink,
  Save,
  RotateCcw,
  Send,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Wind,
  Zap,
  Flame,
  Activity,
  Database,
} from 'lucide-react';
import {
  PSI_DATASETS,
  PERSONA_LENSES,
  computeWeightedScore,
  getDatasetTelemetryProfile,
  type SafetyPillar,
} from '@/backend/psi-datasets';
import { useAstroFlame } from '@/frontend/context/astroflame-context';
import ThreeFlameChamber from '@/frontend/components/ThreeFlameChamber';

const QUICK_QUERIES = [
  'Why do Moon bases at ≥30% O₂ face higher flammability risk?',
  'How do SAME smoke droplets differ from 1g smoke?',
  'Why can N₂ jets fail on thick BASS-II solids?',
  'How do FLEX and CFI-G 500–1000 K cool flames re-ignite in up to 85% O₂?',
];

export default function MissionControlPage() {
  const {
    personaRole,
    activeDataset,
    setActiveDatasetId,
    siWeights,
    setSiWeights,
    addRankingPreset,
    addSimulation,
    chamberParams,
    setChamberParams,
  } = useAstroFlame();

  const currentLens =
    PERSONA_LENSES.find((p) => p.id === personaRole) || PERSONA_LENSES[0];

  // Dataset-Grounded Telemetry Profile for the Active Foundation PSI Dataset
  const datasetProfile = useMemo(
    () => getDatasetTelemetryProfile(activeDataset),
    [activeDataset]
  );

  // Playback Scrubber State (0s to 300s)
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const playbackSec = chamberParams.playbackTimeSec ?? 150;

  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setInterval(() => {
      setChamberParams((prev) => {
        const cur = prev.playbackTimeSec ?? 0;
        const next = cur >= 300 ? 0 : cur + 10;
        return { ...prev, playbackTimeSec: next };
      });
    }, 650);
    return () => window.clearInterval(timer);
  }, [isPlaying, setChamberParams]);

  const currentTimePoint = useMemo(() => {
    const idx = Math.min(
      datasetProfile.timeSeries.length - 1,
      Math.max(0, Math.round(playbackSec / 10))
    );
    return datasetProfile.timeSeries[idx] || datasetProfile.timeSeries[0];
  }, [datasetProfile, playbackSec]);

  // SI Ranking Engine Filters
  const [pillarFilter, setPillarFilter] = useState<'All' | SafetyPillar>('All');
  const [catalogScope, setCatalogScope] = useState<'core8' | 'all26'>('core8');
  const [presetNameInput, setPresetNameInput] = useState<string>('');

  // SI Synthesis Console State
  const [queryInput, setQueryInput] = useState<string>(QUICK_QUERIES[0]);
  const [isSynthesizing, setIsSynthesizing] = useState<boolean>(false);
  const [synthesisOutput, setSynthesisOutput] = useState<{
    text: string;
    engineMode: string;
    thinkingLevel: string;
    citedDatasets: { id: string; psiId: string; title: string; doi: string; url: string }[];
  }>({
    text: `### SI Synthesis for **${currentLens.label}**: High-O₂ Lunar Habitat & Partial-Gravity Flammability (\`≥30%–34% O₂ at ≤10.2 psia\`)

1. **Why Exploration Cabins Use \`34% O₂ at 8.2 psia\` (>40% Relative O₂ Increase)**:
   - To allow astronauts on the Moon or Mars to step into \`4.3 psia (100% O₂)\` EVA spacesuits with minimal pre-breathe time and zero decompression sickness ("the bends"), NASA's exploration atmosphere lowers total cabin pressure to \`8.2 psia\` while raising oxygen concentration to **34% O₂**—representing a **>61% relative increase** over Earth's \`21% O₂\`.
   - Less nitrogen diluent means reduced gas-phase thermal heat capacity, raising flame temperature and accelerating solid pyrolysis rates (**SAFFIRE-II PSI-99**, **Saffire-VI**, **FM2**).

2. **The \`0.16g\` Lunar Buoyancy "Worst-Case Dip" (\`LUCI\` & \`BASS-II PSI-25\`)**:
   - At **Lunar gravity (\`0.16g\`)**, natural buoyant convection induces a \`10–14 cm/s\` upward draft that feeds fresh oxidizer to the flame base without cooling it down—causing materials to burn at **lower oxygen limits (LOC)** on the Moon than on Earth (\`1.00g\`).`,
    engineMode: 'Gemini 4 Hydrogen (gemini-4-hydrogen • ThinkingLevel.HIGH) + NASA PSI Grounding',
    thinkingLevel: 'ThinkingLevel.HIGH',
    citedDatasets: [
      {
        id: 'fm2-lunar-clps',
        psiId: 'CLPS-FM2',
        title: 'FM2: Flammability of Materials on the Moon (CLPS CP-21)',
        doi: '10.2514/6.2024-fm2-clps',
        url: 'https://www.nasa.gov/glenn/glenn-expertise-space-exploration/physical-sciences-program/combustion-science/flammability-of-materials-on-the-moon-fm2/',
      },
      {
        id: 'bass-ii-psi-25',
        psiId: 'PSI-25',
        title: 'BASS-II: Burning and Suppression of Solids - II',
        doi: '10.60555/4qc4-de67',
        url: 'https://psi.nasa.gov/physci/repo/data/investigations/PSI-25',
      },
      {
        id: 'saffire-i-ii-psi-98-99',
        psiId: 'PSI-98 / PSI-99',
        title: 'SAFFIRE-I & II: Spacecraft Fire Experiment in Cygnus',
        doi: '10.60555/saffire-98-99',
        url: 'https://psi.nasa.gov/physci/repo/data/investigations/PSI-98',
      },
    ],
  });

  // Compute Ranked Datasets
  const rankedDatasets = useMemo(() => {
    const pool =
      catalogScope === 'core8'
        ? PSI_DATASETS.filter((d) => d.isCoreAnchor)
        : PSI_DATASETS;

    const filtered =
      pillarFilter === 'All'
        ? pool
        : pool.filter((d) => d.pillar === pillarFilter);

    return filtered
      .map((dataset) => ({
        dataset,
        weightedScore: computeWeightedScore(dataset, siWeights, true),
      }))
      .sort((a, b) => b.weightedScore - a.weightedScore);
  }, [catalogScope, pillarFilter, siWeights]);

  const handleRunSynthesis = async (customPrompt?: string) => {
    const activePrompt = (customPrompt ?? queryInput).trim();
    if (!activePrompt) return;
    if (customPrompt) setQueryInput(customPrompt);
    setIsSynthesizing(true);
    try {
      const res = await fetch('/api/si-synthesis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: activePrompt,
          personaRole,
        }),
      });
      const data = await res.json();
      if (data.text) {
        setSynthesisOutput({
          text: data.text,
          engineMode: data.engineMode || 'Gemini 4 Hydrogen (gemini-4-hydrogen • ThinkingLevel.HIGH)',
          thinkingLevel: data.thinkingLevel || 'ThinkingLevel.HIGH',
          citedDatasets: data.citedDatasets || [],
        });
      }
    } catch {
      // keep existing synthesis
    } finally {
      setIsSynthesizing(false);
    }
  };

  // Slider fill percentages for Left & Bottom panels
  const o2Pct = Math.round(((chamberParams.oxygenPercent - 15) / (85 - 15)) * 100);
  const flowPct = Math.round((chamberParams.airflowCmPerSec / 20) * 100);
  const eFieldPct = Math.round(((chamberParams.eFieldKv + 10) / 20) * 100);
  const playbackPct = Math.round((playbackSec / 300) * 100);

  // Build SVG path for Top-Right Waveform Chart from active dataset timeSeries
  const waveformSvgPaths = useMemo(() => {
    const pts = datasetProfile.timeSeries;
    const maxP = Math.max(...pts.map((p) => p.primarySignal), 1);
    const minP = Math.min(...pts.map((p) => p.primarySignal), 0);
    const spanP = Math.max(1, maxP - minP);

    const primaryCoords = pts.map((p, idx) => {
      const x = 28 + (idx / (pts.length - 1)) * 244;
      const norm = (p.primarySignal - minP) / spanP;
      const y = 66 - norm * 52;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    return {
      primaryPolyline: primaryCoords.join(' '),
      maxP,
      minP,
    };
  }, [datasetProfile]);

  // Radar Chart Polygon Helper (5 Axes)
  const radarAxes = [
    { key: 'wCrewFlammability', label: 'CREW CABIN', val: siWeights.wCrewFlammability },
    { key: 'wHighO2Coverage', label: 'HIGH-O₂ (85%)', val: siWeights.wHighO2Coverage },
    { key: 'wDetectionSuppression', label: 'DETECT/SUPPRESS', val: siWeights.wDetectionSuppression },
    { key: 'wPartialGTransfer', label: 'PARTIAL-G / E-FIELD', val: siWeights.wPartialGTransfer },
    { key: 'wDatasetDepth', label: 'PSI DEPTH', val: siWeights.wDatasetDepth },
  ];

  const radarPoints = radarAxes
    .map((axis, idx) => {
      const angle = -Math.PI / 2 + (idx * 2 * Math.PI) / 5;
      const r = (axis.val / 100) * 78;
      const x = 110 + Math.cos(angle) * r;
      const y = 110 + Math.sin(angle) * r;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <div className="space-y-8">
      {/* ===================================================================== */}
      {/* COCKPIT ARCHITECTURE MATCHING Dashboard_UI (LEFT, CENTER, RIGHT, BOTTOM) */}
      {/* ===================================================================== */}
      <section className="space-y-3">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
          {/* ================================================================= */}
          {/* LEFT PANEL (3 Cols): Environment Configurations & Visible Sliders */}
          {/* ================================================================= */}
          <div className="lg:col-span-3 flex flex-col">
            <div className="text-[11px] font-mono tracking-wider uppercase text-slate-500 dark:text-slate-400 mb-1 px-1">
              LEFT · ENVIRONMENT &amp; FOUNDATION DATASET
            </div>
            <div className="flex-1 rounded-xl bg-white dark:bg-[#090e21] border border-slate-300 dark:border-slate-800 p-4 flex flex-col justify-between space-y-4 shadow-md">
              {/* Foundation Dataset Header */}
              <div className="space-y-3">
                <div className="pb-2.5 border-b border-slate-200 dark:border-slate-800">
                  <div className="text-sm font-bold text-slate-900 dark:text-white">
                    Environment Configurations
                  </div>
                  <div className="text-[11px] font-mono text-amber-700 dark:text-amber-300 mt-0.5 truncate">
                    Foundation: {activeDataset.shortTitle}
                  </div>
                </div>

                {/* Gravity Preset Row 1 */}
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { label: 'Moon 0.16g', g: 0.16 },
                    { label: 'Mars 0.38g', g: 0.38 },
                    { label: 'Earth 1.00g', g: 1.0 },
                  ].map((preset) => {
                    const isSelected = Math.abs(chamberParams.gravityG - preset.g) < 0.02;
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() =>
                          setChamberParams({ ...chamberParams, gravityG: preset.g })
                        }
                        className={`py-1.5 px-2 text-[11px] font-mono rounded-lg border transition-all text-center ${
                          isSelected
                            ? 'bg-sky-500/20 border-sky-400 text-sky-700 dark:text-sky-300 font-semibold shadow-sm'
                            : 'bg-slate-100 dark:bg-[#0d142b] border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-sky-400/50'
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>

                {/* Active Gravity Presets Sub-section */}
                <div className="pt-1 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-slate-200">
                    <span>Active Gravity Presets</span>
                    <button
                      type="button"
                      onClick={() =>
                        setChamberParams({ ...chamberParams, gravityG: 0.0 })
                      }
                      className={`px-2 py-0.5 text-[10px] font-mono rounded border ${
                        chamberParams.gravityG === 0
                          ? 'bg-cyan-500/25 border-cyan-400 text-cyan-700 dark:text-cyan-300 font-bold'
                          : 'bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      0.00g ISS Freefall
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { label: '0.00g ISS', g: 0.0 },
                      { label: 'Moon 0.16g', g: 0.16 },
                      { label: 'Mars 0.38g', g: 0.38 },
                    ].map((preset) => {
                      const isSelected = Math.abs(chamberParams.gravityG - preset.g) < 0.02;
                      return (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() =>
                            setChamberParams({ ...chamberParams, gravityG: preset.g })
                          }
                          className={`py-1.5 px-2 text-[11px] font-mono rounded-lg border transition-all text-center ${
                            isSelected
                              ? 'bg-cyan-500/20 border-cyan-400 text-cyan-700 dark:text-cyan-300 font-semibold'
                              : 'bg-slate-100 dark:bg-[#0d142b] border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {preset.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* High-Visibility Adjustment Bar 1: O2 Concentration (%) */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800/90 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-800 dark:text-slate-200 flex items-center gap-1.5 font-medium">
                      <Activity className="w-3.5 h-3.5 text-amber-500" />
                      O₂ Concentration ({chamberParams.oxygenPercent}%)
                    </span>
                    <span className="text-amber-600 dark:text-amber-400 font-bold tabular-nums">
                      {chamberParams.oxygenPercent}%
                    </span>
                  </div>
                  <input
                    type="range"
                    aria-label="O2 Concentration Percent"
                    min={15}
                    max={85}
                    step={1}
                    value={chamberParams.oxygenPercent}
                    onChange={(e) =>
                      setChamberParams({
                        ...chamberParams,
                        oxygenPercent: Number(e.target.value),
                      })
                    }
                    style={
                      {
                        '--thumb-color': '#f59e0b',
                        background: `linear-gradient(to right, #f59e0b 0%, #f59e0b ${o2Pct}%, rgba(51,65,85,0.65) ${o2Pct}%, rgba(51,65,85,0.65) 100%)`,
                      } as React.CSSProperties
                    }
                    className="w-full astro-range"
                  />
                </div>

                {/* High-Visibility Adjustment Bar 2: Duct Flow BASS-II (cm/s) */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800/90 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-800 dark:text-slate-200 flex items-center gap-1.5 font-medium">
                      <Wind className="w-3.5 h-3.5 text-emerald-500" />
                      Duct Flow BASS-II ({chamberParams.airflowCmPerSec.toFixed(1)} cm/s)
                    </span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold tabular-nums">
                      {chamberParams.airflowCmPerSec.toFixed(1)} cm/s
                    </span>
                  </div>
                  <input
                    type="range"
                    aria-label="Duct Flow BASS-II cm/s"
                    min={0}
                    max={20}
                    step={0.5}
                    value={chamberParams.airflowCmPerSec}
                    onChange={(e) =>
                      setChamberParams({
                        ...chamberParams,
                        airflowCmPerSec: Number(e.target.value),
                      })
                    }
                    style={
                      {
                        '--thumb-color': '#10b981',
                        background: `linear-gradient(to right, #10b981 0%, #10b981 ${flowPct}%, rgba(51,65,85,0.65) ${flowPct}%, rgba(51,65,85,0.65) 100%)`,
                      } as React.CSSProperties
                    }
                    className="w-full astro-range"
                  />
                </div>

                {/* High-Visibility Adjustment Bar 3: E-FIELD Mesh (kV) */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800/90 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-800 dark:text-slate-200 flex items-center gap-1.5 font-medium">
                      <Zap className="w-3.5 h-3.5 text-purple-500" />
                      E-FIELD Mesh ({chamberParams.eFieldKv >= 0 ? `+${chamberParams.eFieldKv.toFixed(1)}` : chamberParams.eFieldKv.toFixed(1)} kV)
                    </span>
                    <span className="text-purple-600 dark:text-purple-400 font-bold tabular-nums">
                      {chamberParams.eFieldKv >= 0
                        ? `+${chamberParams.eFieldKv.toFixed(1)}`
                        : chamberParams.eFieldKv.toFixed(1)}{' '}
                      kV
                    </span>
                  </div>
                  <input
                    type="range"
                    aria-label="E-FIELD Mesh kV"
                    min={-10}
                    max={10}
                    step={0.5}
                    value={chamberParams.eFieldKv}
                    onChange={(e) =>
                      setChamberParams({
                        ...chamberParams,
                        eFieldKv: Number(e.target.value),
                      })
                    }
                    style={
                      {
                        '--thumb-color': '#a855f7',
                        background: `linear-gradient(to right, #a855f7 0%, #a855f7 ${eFieldPct}%, rgba(51,65,85,0.65) ${eFieldPct}%, rgba(51,65,85,0.65) 100%)`,
                      } as React.CSSProperties
                    }
                    className="w-full astro-range"
                  />
                </div>

                {/* Characteristic Length / Dataset Scale Readout */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800/90 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-700 dark:text-slate-300">
                    {datasetProfile.characteristicLengthLabel}
                  </span>
                  <span className="text-sky-600 dark:text-sky-400 font-bold">
                    {datasetProfile.characteristicLengthValue}
                  </span>
                </div>
              </div>

              {/* Bottom Toggle inside Left Panel: Cool-Flame Mode & Regime Legend */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-purple-500" />
                    500–1000 K Cool-Flame Mode
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={chamberParams.coolFlameMode}
                    onClick={() =>
                      setChamberParams({
                        ...chamberParams,
                        coolFlameMode: !chamberParams.coolFlameMode,
                      })
                    }
                    className={`w-11 h-6 rounded-full transition-colors p-0.5 ${
                      chamberParams.coolFlameMode
                        ? 'bg-purple-600'
                        : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                        chamberParams.coolFlameMode ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-sky-600 dark:text-sky-400">● Moon 0.16g</span>
                  <span className="text-amber-600 dark:text-amber-400">· Mars 0.38g</span>
                  <span className="text-emerald-600 dark:text-emerald-400">· Earth 1.00g</span>
                </div>
              </div>
            </div>
          </div>

          {/* ================================================================= */}
          {/* CENTER PANEL (6 Cols): Provenance-Labeled Dual Flame Comparison   */}
          {/* ================================================================= */}
          <div className="lg:col-span-6 flex flex-col">
            <div className="text-[11px] font-mono tracking-wider uppercase text-slate-500 dark:text-slate-400 mb-1 px-1 flex items-center justify-between">
              <span>CENTER · DUAL OPTICAL CHAMBER &amp; PROVENANCE VERIFICATION</span>
              <span className="text-sky-600 dark:text-sky-400">
                Dataset: {activeDataset.psiId} ({activeDataset.facility})
              </span>
            </div>
            <div className="flex-1">
              <ThreeFlameChamber
                params={chamberParams}
                onChangeParams={setChamberParams}
                activeDataset={activeDataset}
                onSaveToSimulator={(p) => {
                  const ppO2 = Number(((p.oxygenPercent / 100) * 14.7).toFixed(2));
                  const risk = Math.min(
                    100,
                    Math.round(
                      (p.oxygenPercent - 15) * 1.3 +
                        (p.gravityG === 0.16 ? 22 : p.gravityG === 0 ? 15 : 8) +
                        (p.airflowCmPerSec > 0.5 && p.airflowCmPerSec <= 8 ? 14 : 4)
                    )
                  );
                  void addSimulation({
                    title: `${activeDataset.psiId} Run (${p.gravityG.toFixed(2)}g, ${p.oxygenPercent}% O₂, ${p.airflowCmPerSec} cm/s)`,
                    presetName: activeDataset.shortTitle,
                    gravityG: p.gravityG,
                    oxygenPercent: p.oxygenPercent,
                    pressurePsia: 14.7,
                    airflowCmPerSec: p.airflowCmPerSec,
                    eFieldKv: p.eFieldKv,
                    ppO2Psia: ppO2,
                    flammabilityRiskIndex: risk,
                    coolFlameWarning: p.coolFlameMode || p.oxygenPercent >= 30,
                  });
                }}
              />
            </div>
          </div>

          {/* ================================================================= */}
          {/* RIGHT PANEL (3 Cols): Dataset-Grounded Telemetry & Live Log       */}
          {/* ================================================================= */}
          <div className="lg:col-span-3 flex flex-col">
            <div className="text-[11px] font-mono tracking-wider uppercase text-slate-500 dark:text-slate-400 mb-1 px-1">
              RIGHT · EMPIRICAL TELEMETRY ({activeDataset.psiId})
            </div>
            <div className="flex-1 rounded-xl bg-white dark:bg-[#090e21] border border-slate-300 dark:border-slate-800 p-3.5 flex flex-col justify-between space-y-3 shadow-md">
              {/* Telemetry Header */}
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    Telemetry
                  </span>
                  <span className="ml-2 text-[10px] font-mono text-amber-600 dark:text-amber-400">
                    [{activeDataset.psiId}]
                  </span>
                </div>
                <span className="text-[10px] font-mono text-sky-600 dark:text-sky-400">
                  t = {playbackSec}s · {currentTimePoint.primarySignal} {datasetProfile.primaryChannelUnit}
                </span>
              </div>

              {/* Chart 1: Dual-Channel Empirical Waveform */}
              <div className="rounded-lg bg-slate-950 p-2 border border-slate-800">
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
                  <span className="text-amber-400">{datasetProfile.primaryChannelName}</span>
                  <span>
                    {waveformSvgPaths.minP}–{waveformSvgPaths.maxP} {datasetProfile.primaryChannelUnit}
                  </span>
                </div>
                <svg viewBox="0 0 280 74" className="w-full h-16">
                  <line x1="24" y1="14" x2="274" y2="14" stroke="#1e293b" strokeWidth="1" />
                  <line x1="24" y1="38" x2="274" y2="38" stroke="#1e293b" strokeWidth="1" />
                  <line x1="24" y1="64" x2="274" y2="64" stroke="#1e293b" strokeWidth="1" />
                  <polyline
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="2"
                    points={waveformSvgPaths.primaryPolyline}
                  />
                  {/* Active Playback Cursor */}
                  <line
                    x1={28 + (playbackSec / 300) * 244}
                    y1="6"
                    x2={28 + (playbackSec / 300) * 244}
                    y2="68"
                    stroke="#38bdf8"
                    strokeWidth="1.5"
                    strokeDasharray="2,2"
                  />
                </svg>
              </div>

              {/* Chart 2: Spectral / Soot / Radiometer Spike Chart */}
              <div className="rounded-lg bg-slate-950 p-2 border border-slate-800">
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
                  <span className="text-cyan-400">{datasetProfile.spikeChannelName}</span>
                  <span>
                    {currentTimePoint.sootOrIonSpike} {datasetProfile.spikeChannelUnit}
                  </span>
                </div>
                <svg viewBox="0 0 280 62" className="w-full h-14">
                  <line x1="24" y1="15" x2="274" y2="15" stroke="#1e293b" strokeWidth="1" />
                  <line x1="24" y1="36" x2="274" y2="36" stroke="#1e293b" strokeWidth="1" />
                  <line x1="24" y1="56" x2="274" y2="56" stroke="#1e293b" strokeWidth="1" />
                  {datasetProfile.timeSeries.map((pt, idx) => {
                    const x = 28 + (idx / 30) * 242;
                    const barH = Math.max(3, (pt.sootOrIonSpike / 100) * 46);
                    const isCursor = pt.timeSec === playbackSec;
                    return (
                      <rect
                        key={pt.timeSec}
                        x={x - 2}
                        y={56 - barH}
                        width="4"
                        height={barH}
                        fill={isCursor ? '#f59e0b' : '#22d3ee'}
                        opacity={isCursor ? 1 : 0.78}
                      />
                    );
                  })}
                </svg>
              </div>

              {/* 3 Circular Radial Gauges (Exact Dashboard_UI Match) */}
              <div className="grid grid-cols-3 gap-2 py-1">
                {datasetProfile.gauges.map((g) => {
                  const pct = Math.min(1, Math.max(0.08, g.value / g.max));
                  const strokeHex =
                    g.color === 'amber'
                      ? '#f59e0b'
                      : g.color === 'emerald'
                      ? '#10b981'
                      : g.color === 'purple'
                      ? '#a855f7'
                      : '#22d3ee';
                  const dash = (pct * 138).toFixed(1);
                  return (
                    <div
                      key={g.label}
                      className="rounded-lg bg-slate-50 dark:bg-slate-950/90 border border-slate-200 dark:border-slate-800 p-2 flex flex-col items-center text-center"
                    >
                      <svg viewBox="0 0 64 64" className="w-14 h-14">
                        <circle
                          cx="32"
                          cy="32"
                          r="22"
                          fill="none"
                          stroke="#1e293b"
                          strokeWidth="6"
                        />
                        <circle
                          cx="32"
                          cy="32"
                          r="22"
                          fill="none"
                          stroke={strokeHex}
                          strokeWidth="6"
                          strokeLinecap="round"
                          strokeDasharray={`${dash} 160`}
                          transform="rotate(-90 32 32)"
                        />
                        <text
                          x="32"
                          y="34"
                          textAnchor="middle"
                          className="fill-slate-900 dark:fill-white text-[11px] font-mono font-bold"
                        >
                          {g.value}
                        </text>
                      </svg>
                      <div className="text-[10px] font-mono font-semibold text-slate-800 dark:text-slate-200 truncate w-full">
                        {g.label}
                      </div>
                      <div className="text-[9px] font-mono text-slate-500 dark:text-slate-400 truncate w-full">
                        {g.unit}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Chart 3: Multi-Curve Parametric Comparison */}
              <div className="rounded-lg bg-slate-950 p-2 border border-slate-800">
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
                  <span>{datasetProfile.curves.xAxisLabel}</span>
                  <span className="text-emerald-400">3 Curves</span>
                </div>
                <svg viewBox="0 0 280 78" className="w-full h-18">
                  <line x1="20" y1="16" x2="270" y2="16" stroke="#1e293b" strokeWidth="1" />
                  <line x1="20" y1="42" x2="270" y2="42" stroke="#1e293b" strokeWidth="1" />
                  <line x1="20" y1="68" x2="270" y2="68" stroke="#1e293b" strokeWidth="1" />
                  {[
                    { vals: datasetProfile.curves.series1Values, color: '#f59e0b' },
                    { vals: datasetProfile.curves.series2Values, color: '#22d3ee' },
                    { vals: datasetProfile.curves.series3Values, color: '#10b981' },
                  ].map((s, sIdx) => {
                    const pts = s.vals
                      .map((v, i) => {
                        const x = 24 + (i / (s.vals.length - 1)) * 242;
                        const y = 68 - Math.min(1, v / 300) * 52;
                        return `${x.toFixed(1)},${y.toFixed(1)}`;
                      })
                      .join(' ');
                    return (
                      <polyline
                        key={sIdx}
                        fill="none"
                        stroke={s.color}
                        strokeWidth="2"
                        points={pts}
                      />
                    );
                  })}
                </svg>
                <div className="flex flex-wrap items-center justify-between gap-1 text-[9px] font-mono mt-1">
                  <span className="text-amber-400 truncate max-w-[85px]">
                    ● {datasetProfile.curves.series1Label}
                  </span>
                  <span className="text-cyan-400 truncate max-w-[85px]">
                    ● {datasetProfile.curves.series2Label}
                  </span>
                  <span className="text-emerald-400 truncate max-w-[85px]">
                    ● {datasetProfile.curves.series3Label}
                  </span>
                </div>
              </div>

              {/* Live Measurement Log (Grounded in Active PSI Dataset + Chamber Sliders) */}
              <div className="pt-1.5 border-t border-slate-200 dark:border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
                  <span>Live Log ({activeDataset.psiId})</span>
                  <span className="text-[10px] font-mono text-sky-600 dark:text-sky-400">
                    DOI: {activeDataset.doi}
                  </span>
                </div>
                <div className="space-y-1 text-[11px] font-mono max-h-[124px] overflow-y-auto pr-1">
                  <div className="flex items-center justify-between text-amber-700 dark:text-amber-300">
                    <span>t={playbackSec}s · O₂ Concentration</span>
                    <span className="font-bold">{chamberParams.oxygenPercent}.0 %</span>
                  </div>
                  <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-300">
                    <span>t={playbackSec}s · Duct Flow BASS-II</span>
                    <span className="font-bold">{chamberParams.airflowCmPerSec.toFixed(1)} cm/s</span>
                  </div>
                  <div className="flex items-center justify-between text-purple-700 dark:text-purple-300">
                    <span>t={playbackSec}s · E-FIELD Mesh</span>
                    <span className="font-bold">
                      {chamberParams.eFieldKv >= 0
                        ? `+${chamberParams.eFieldKv.toFixed(1)}`
                        : chamberParams.eFieldKv.toFixed(1)}{' '}
                      kV
                    </span>
                  </div>
                  {datasetProfile.liveLog.map((entry, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-slate-700 dark:text-slate-300 gap-2"
                    >
                      <span className="truncate">
                        {entry.timestamp} · {entry.channel}
                      </span>
                      <span className="text-sky-700 dark:text-sky-300 shrink-0">
                        {entry.measurement}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* =================================================================== */}
        {/* BOTTOM PANEL: History & Experimental Run Playback Timeline (0–300s) */}
        {/* =================================================================== */}
        <div className="space-y-1">
          <div className="text-[11px] font-mono tracking-wider uppercase text-slate-500 dark:text-slate-400 px-1">
            BOTTOM · EXPERIMENTAL RUN PLAYBACK &amp; PHASE TIMELINE ({activeDataset.shortTitle})
          </div>
          <div className="rounded-xl bg-white dark:bg-[#090e21] border border-slate-300 dark:border-slate-800 p-4 space-y-3 shadow-md">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  History &amp; Simulation Playback
                </span>
                <span className="px-2.5 py-0.5 text-xs font-mono rounded-md bg-sky-500/15 border border-sky-500/40 text-sky-700 dark:text-sky-300">
                  t = {playbackSec}s / 300s · {currentTimePoint.phaseLabel}
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs font-mono text-slate-600 dark:text-slate-300">
                <span>
                  {datasetProfile.primaryChannelName}:{' '}
                  <strong className="text-amber-600 dark:text-amber-400">
                    {currentTimePoint.primarySignal} {datasetProfile.primaryChannelUnit}
                  </strong>
                </span>
                <span>·</span>
                <span>
                  {datasetProfile.secondaryChannelName}:{' '}
                  <strong className="text-cyan-600 dark:text-cyan-400">
                    {currentTimePoint.secondarySignal} {datasetProfile.secondaryChannelUnit}
                  </strong>
                </span>
              </div>
            </div>

            {/* Full-Width Glowing Cyan Scrubber Slider */}
            <div className="py-1">
              <input
                type="range"
                aria-label="Experimental Run Playback Timeline Seconds"
                min={0}
                max={300}
                step={10}
                value={playbackSec}
                onChange={(e) =>
                  setChamberParams({
                    ...chamberParams,
                    playbackTimeSec: Number(e.target.value),
                  })
                }
                style={
                  {
                    '--thumb-color': '#38bdf8',
                    background: `linear-gradient(to right, #38bdf8 0%, #38bdf8 ${playbackPct}%, rgba(51,65,85,0.65) ${playbackPct}%, rgba(51,65,85,0.65) 100%)`,
                  } as React.CSSProperties
                }
                className="w-full astro-range"
              />
            </div>

            {/* Playback Transport Controls + Dual-Colored Area Waveform (0 to 300s) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
              <div className="lg:col-span-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setChamberParams({ ...chamberParams, playbackTimeSec: 0 })
                  }
                  className="p-2 rounded-lg bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                  title="Jump to 0s"
                >
                  <SkipBack className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setChamberParams({
                      ...chamberParams,
                      playbackTimeSec: Math.max(0, playbackSec - 10),
                    })
                  }
                  className="px-2.5 py-1.5 text-xs font-mono rounded-lg bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                >
                  -10s
                </button>
                <button
                  type="button"
                  onClick={() => setIsPlaying((prev) => !prev)}
                  className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 dark:bg-sky-500 dark:hover:bg-sky-400 text-white dark:text-slate-950 font-semibold text-xs font-mono flex items-center gap-1.5"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-3.5 h-3.5" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" />
                      Play
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setChamberParams({
                      ...chamberParams,
                      playbackTimeSec: Math.min(300, playbackSec + 10),
                    })
                  }
                  className="px-2.5 py-1.5 text-xs font-mono rounded-lg bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                >
                  +10s
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setChamberParams({ ...chamberParams, playbackTimeSec: 300 })
                  }
                  className="p-2 rounded-lg bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                  title="Jump to 300s"
                >
                  <SkipForward className="w-4 h-4" />
                </button>
              </div>

              {/* Area Timeline Chart (0s to 300s) */}
              <div className="lg:col-span-9">
                <svg viewBox="0 0 900 58" className="w-full h-14 bg-slate-950 rounded-lg border border-slate-800">
                  {/* Vertical Grid Markers */}
                  {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300].map((sec) => {
                    const x = 25 + (sec / 300) * 850;
                    return (
                      <g key={sec}>
                        <line x1={x} y1="4" x2={x} y2="42" stroke="#1e293b" strokeWidth="1" />
                        <text
                          x={x}
                          y="54"
                          textAnchor="middle"
                          className="fill-slate-400 text-[9px] font-mono"
                        >
                          {sec}s
                        </text>
                      </g>
                    );
                  })}

                  {/* Cyan Stage 1 Area (0..150s) & Amber Stage 2 Area (150..300s) */}
                  {(() => {
                    const pts = datasetProfile.timeSeries;
                    const maxP = Math.max(...pts.map((p) => p.primarySignal), 1);
                    const firstHalf = pts.filter((p) => p.timeSec <= 150);
                    const secondHalf = pts.filter((p) => p.timeSec >= 150);

                    const buildArea = (slice: typeof pts) => {
                      if (slice.length === 0) return '';
                      const startX = 25 + (slice[0].timeSec / 300) * 850;
                      const endX = 25 + (slice[slice.length - 1].timeSec / 300) * 850;
                      const topPts = slice
                        .map((p) => {
                          const x = 25 + (p.timeSec / 300) * 850;
                          const y = 42 - (p.primarySignal / maxP) * 34;
                          return `${x.toFixed(1)},${y.toFixed(1)}`;
                        })
                        .join(' ');
                      return `${startX.toFixed(1)},42 ${topPts} ${endX.toFixed(1)},42`;
                    };

                    const cursorX = 25 + (playbackSec / 300) * 850;

                    return (
                      <>
                        <polygon
                          points={buildArea(firstHalf)}
                          fill="rgba(34, 211, 238, 0.28)"
                          stroke="#22d3ee"
                          strokeWidth="1.5"
                        />
                        <polygon
                          points={buildArea(secondHalf)}
                          fill="rgba(245, 158, 11, 0.28)"
                          stroke="#f59e0b"
                          strokeWidth="1.5"
                        />
                        <line
                          x1={cursorX}
                          y1="2"
                          x2={cursorX}
                          y2="44"
                          stroke="#ffffff"
                          strokeWidth="2"
                        />
                      </>
                    );
                  })()}
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* SECTION 01: SI MULTI-ATTRIBUTE DATASET RANKING ENGINE (FOUNDATION)    */}
      {/* ===================================================================== */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              01. Super Intelligence (SI) Multi-Attribute Dataset Ranking Engine (Platform Foundation)
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
              Click <strong className="text-amber-600 dark:text-amber-400">&ldquo;Load into Telemetry Cockpit&rdquo;</strong> on any investigation to drive all Mission Control charts, radial gauges, and run playback from that NASA PSI dataset.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center p-1 bg-slate-200/80 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg">
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

            <div className="flex items-center p-1 bg-slate-200/80 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg">
              <button
                type="button"
                onClick={() => setCatalogScope('core8')}
                className={`px-2.5 py-1 text-xs font-mono rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  catalogScope === 'core8'
                    ? 'bg-amber-600 text-white dark:bg-amber-500 dark:text-slate-950 font-semibold'
                    : 'text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Core 8 Anchors
              </button>
              <button
                type="button"
                onClick={() => setCatalogScope('all26')}
                className={`px-2.5 py-1 text-xs font-mono rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  catalogScope === 'all26'
                    ? 'bg-amber-600 text-white dark:bg-amber-500 dark:text-slate-950 font-semibold'
                    : 'text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                All 24 PSI + 2 Lunar ({PSI_DATASETS.length})
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (4 cols): 5 High-Visibility Weight Sliders + Radar SVG */}
          <div className="lg:col-span-4 rounded-xl bg-white dark:bg-[#090e21] border border-slate-300 dark:border-slate-800 p-5 space-y-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                <Sliders className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                <span>SI Multi-Criteria Weights</span>
              </div>
              <button
                type="button"
                onClick={() => setSiWeights(currentLens.defaultWeights)}
                className="text-xs font-mono text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                Reset Lens Default
              </button>
            </div>

            <div className="space-y-4">
              {[
                {
                  key: 'wCrewFlammability' as const,
                  label: 'Crew Habitat Flammability Relevance',
                  fillHex: '#f59e0b',
                  textColor: 'text-amber-700 dark:text-amber-300',
                },
                {
                  key: 'wHighO2Coverage' as const,
                  label: 'High-O₂ Exploration Atmosphere (≥30%–85%)',
                  fillHex: '#f43f5e',
                  textColor: 'text-rose-700 dark:text-rose-300',
                },
                {
                  key: 'wDetectionSuppression' as const,
                  label: 'Detection & Suppression Actionability',
                  fillHex: '#10b981',
                  textColor: 'text-emerald-700 dark:text-emerald-300',
                },
                {
                  key: 'wPartialGTransfer' as const,
                  label: 'Partial-Gravity (0.16g) / E-FIELD Transfer',
                  fillHex: '#a855f7',
                  textColor: 'text-purple-700 dark:text-purple-300',
                },
                {
                  key: 'wDatasetDepth' as const,
                  label: 'PSI Dataset Telemetry & Optical Depth',
                  fillHex: '#38bdf8',
                  textColor: 'text-sky-700 dark:text-sky-300',
                },
              ].map((slider) => {
                const val = siWeights[slider.key];
                return (
                  <div
                    key={slider.key}
                    className="rounded-lg bg-slate-50 dark:bg-slate-900/75 border border-slate-200 dark:border-slate-800 p-2.5"
                  >
                    <div className="flex justify-between text-xs mb-2 gap-2">
                      <span className="text-slate-700 dark:text-slate-300 font-medium">
                        {slider.label}
                      </span>
                      <span className={`font-mono tabular-nums font-bold shrink-0 ${slider.textColor}`}>
                        {val}%
                      </span>
                    </div>
                    <input
                      type="range"
                      aria-label={slider.label}
                      min={0}
                      max={100}
                      step={1}
                      value={val}
                      onChange={(e) =>
                        setSiWeights((prev) => ({
                          ...prev,
                          [slider.key]: Number(e.target.value),
                        }))
                      }
                      style={
                        {
                          '--thumb-color': slider.fillHex,
                          background: `linear-gradient(to right, ${slider.fillHex} 0%, ${slider.fillHex} ${val}%, rgba(100,116,139,0.35) ${val}%, rgba(100,116,139,0.35) 100%)`,
                        } as React.CSSProperties
                      }
                      className="w-full astro-range"
                    />
                  </div>
                );
              })}
            </div>

            {/* Radar Parameter Calibration SVG Chart */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col items-center">
              <div className="text-xs font-mono text-slate-600 dark:text-slate-400 mb-1">
                RADAR PARAMETER CALIBRATION ENVELOPE
              </div>
              <svg viewBox="0 0 220 220" className="w-52 h-52">
                {[0.25, 0.5, 0.75, 1.0].map((ring) => {
                  const pts = [0, 1, 2, 3, 4]
                    .map((i) => {
                      const ang = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
                      const x = 110 + Math.cos(ang) * 78 * ring;
                      const y = 110 + Math.sin(ang) * 78 * ring;
                      return `${x.toFixed(1)},${y.toFixed(1)}`;
                    })
                    .join(' ');
                  return (
                    <polygon
                      key={ring}
                      points={pts}
                      fill="none"
                      className="stroke-slate-300 dark:stroke-slate-800"
                      strokeWidth="1"
                    />
                  );
                })}
                {radarAxes.map((axis, idx) => {
                  const ang = -Math.PI / 2 + (idx * 2 * Math.PI) / 5;
                  const x2 = 110 + Math.cos(ang) * 78;
                  const y2 = 110 + Math.sin(ang) * 78;
                  const lx = 110 + Math.cos(ang) * 98;
                  const ly = 110 + Math.sin(ang) * 98;
                  return (
                    <g key={axis.key}>
                      <line
                        x1="110"
                        y1="110"
                        x2={x2}
                        y2={y2}
                        className="stroke-slate-300 dark:stroke-slate-700"
                        strokeWidth="1"
                      />
                      <text
                        x={lx}
                        y={ly}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="fill-slate-600 dark:fill-slate-400 text-[8px] font-mono"
                      >
                        {axis.label}
                      </text>
                    </g>
                  );
                })}
                <polygon
                  points={radarPoints}
                  fill="rgba(56, 189, 248, 0.22)"
                  stroke="#0284c7"
                  strokeWidth="2"
                />
              </svg>
            </div>

            {/* Save Custom Ranking Preset */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
              <label className="block text-xs font-mono text-slate-600 dark:text-slate-400">
                SAVE PRESET TO CLOUD FIRESTORE (custom_rankings)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder={`${currentLens.shortLabel} Calibration`}
                  value={presetNameInput}
                  onChange={(e) => setPresetNameInput(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-200 focus:outline-none focus:border-sky-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    void addRankingPreset(
                      presetNameInput || `${currentLens.shortLabel} Calibration`
                    );
                    setPresetNameInput('');
                  }}
                  className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 rounded-lg transition-colors flex items-center gap-1 whitespace-nowrap shrink-0"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save Preset
                </button>
              </div>
            </div>
          </div>

          {/* Right Column (8 cols): Ranked PSI Dataset Table with Foundation Loader */}
          <div className="lg:col-span-8 space-y-4">
            <div className="rounded-xl bg-white dark:bg-[#090e21] border border-slate-300 dark:border-slate-800 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950/70 text-[11px] font-mono text-slate-600 dark:text-slate-400">
                      <th className="py-3 px-4">RANK / PSI ID</th>
                      <th className="py-3 px-4">INVESTIGATION &amp; COCKPIT BINDING</th>
                      <th className="py-3 px-4">TESTED ENVELOPE</th>
                      <th className="py-3 px-4">ACTIONABLE SI SAFETY RULE &amp; ROLE INSIGHT</th>
                      <th className="py-3 px-4 text-right">SI SCORE</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800/70 text-xs">
                    {rankedDatasets.map(({ dataset, weightedScore }, idx) => {
                      const isFoundationActive = dataset.id === activeDataset.id;
                      return (
                        <tr
                          key={dataset.id}
                          className={`transition-colors align-top ${
                            isFoundationActive
                              ? 'bg-sky-50/70 dark:bg-sky-950/25'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-900/60'
                          }`}
                        >
                          <td className="py-3.5 px-4 font-mono whitespace-nowrap">
                            <div className="font-bold text-slate-900 dark:text-white tabular-nums">
                              #{String(idx + 1).padStart(2, '0')}
                            </div>
                            <div className="text-sky-700 dark:text-sky-400 mt-0.5">{dataset.psiId}</div>
                            {dataset.coolFlameObserved && (
                              <div className="text-[10px] text-purple-700 dark:text-purple-400 mt-0.5">
                                500–1000 K Cool Flame
                              </div>
                            )}
                          </td>

                          <td className="py-3.5 px-4 space-y-1.5">
                            <div className="font-semibold text-slate-900 dark:text-white">
                              {dataset.shortTitle}
                            </div>
                            <div className="text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                              {dataset.pillar} · {dataset.facility} · DOI: {dataset.doi}
                            </div>
                            <div className="flex flex-wrap items-center gap-2 pt-0.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveDatasetId(dataset.id);
                                  window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                className={`px-2.5 py-1 text-[11px] font-mono rounded-md border transition-colors inline-flex items-center gap-1 ${
                                  isFoundationActive
                                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                                    : 'bg-slate-100 dark:bg-slate-900 text-sky-700 dark:text-sky-300 border-slate-300 dark:border-slate-700 hover:border-sky-400'
                                }`}
                              >
                                <Database className="w-3 h-3" />
                                {isFoundationActive
                                  ? 'Active in Telemetry Cockpit'
                                  : 'Load into Telemetry Cockpit'}
                              </button>
                              <a
                                href={dataset.officialUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[11px] font-mono text-sky-700 dark:text-sky-400 hover:underline inline-flex items-center gap-1"
                              >
                                NASA PSI
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 font-mono text-[11px] text-slate-700 dark:text-slate-300 space-y-0.5">
                            <div>{dataset.oxygenRange}</div>
                            <div className="text-slate-500 dark:text-slate-400">{dataset.pressureRange}</div>
                            <div className="text-emerald-700 dark:text-emerald-400">{dataset.airflowRange}</div>
                          </td>

                          <td className="py-3.5 px-4 max-w-md space-y-1.5">
                            <div className="text-slate-800 dark:text-slate-200 leading-relaxed">
                              {dataset.actionableSafetyRule}
                            </div>
                            <div className="text-[11px] text-sky-700 dark:text-sky-300/90 font-mono">
                              [{currentLens.shortLabel}]: {dataset.personaInsights[personaRole]}
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-right font-mono tabular-nums">
                            <span className="text-base font-bold text-sky-700 dark:text-sky-400">
                              {weightedScore.toFixed(1)}
                            </span>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400">/ 100.0</div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* SECTION 02: NATURAL-LANGUAGE SI COMBUSTION SYNTHESIS CONSOLE          */}
      {/* ===================================================================== */}
      <section className="rounded-xl bg-white dark:bg-[#090e21] border border-slate-300 dark:border-slate-800 p-5 sm:p-6 space-y-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-sky-600 dark:text-sky-400" />
              <span>02. Natural-Language Super Intelligence (SI) Combustion Synthesis Console</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
              Powered by server-side <code className="text-sky-700 dark:text-sky-300 font-mono">gemini-4-carbon</code> (<code className="text-purple-700 dark:text-purple-300 font-mono">ThinkingLevel.HIGH</code>) + Grounded 24-Dataset NASA PSI Knowledge Graph
            </p>
          </div>
          <div className="text-xs font-mono text-emerald-700 dark:text-emerald-400">
            ● {synthesisOutput.engineMode}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-mono text-slate-600 dark:text-slate-400">Quick-Tap Queries:</span>
          {QUICK_QUERIES.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => void handleRunSynthesis(q)}
              className="px-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-sky-800 dark:text-sky-300 border border-slate-300 dark:border-slate-700 rounded-lg transition-colors text-left"
            >
              {q}
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void handleRunSynthesis();
          }}
          className="flex flex-col sm:flex-row gap-2.5"
        >
          <input
            type="text"
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            placeholder="Ask a complex microgravity combustion, cool-flame, or lunar cabin fire safety question..."
            className="flex-1 px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
          />
          <button
            type="submit"
            disabled={isSynthesizing}
            className="px-5 py-2.5 text-xs font-semibold bg-sky-600 hover:bg-sky-500 dark:bg-sky-400 dark:hover:bg-sky-300 disabled:opacity-50 text-white dark:text-slate-950 rounded-lg transition-colors flex items-center justify-center gap-2 whitespace-nowrap shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            {isSynthesizing ? 'Synthesizing (High Thinking)...' : 'Run SI Synthesis'}
          </button>
        </form>

        <div className="rounded-lg bg-slate-50 dark:bg-[#050814] border border-slate-200 dark:border-slate-800 p-5 space-y-4">
          <div className="markdown-body prose prose-slate dark:prose-invert max-w-none text-sm text-slate-800 dark:text-slate-200 leading-relaxed space-y-2">
            <Markdown>{synthesisOutput.text}</Markdown>
          </div>

          {synthesisOutput.citedDatasets.length > 0 && (
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800/80 flex flex-wrap items-center gap-3">
              <span className="text-xs font-mono text-slate-600 dark:text-slate-400">
                SOURCE-CITED PSI ARCHIVES:
              </span>
              {synthesisOutput.citedDatasets.map((cite) => (
                <a
                  key={cite.id}
                  href={cite.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-mono text-sky-700 dark:text-sky-400 hover:underline inline-flex items-center gap-1"
                >
                  <span>
                    {cite.psiId} (DOI: {cite.doi})
                  </span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              ))}
              <Link
                href="/datasets"
                className="ml-auto text-xs font-mono text-amber-600 dark:text-amber-400 hover:underline"
              >
                Open Full 24-Dataset PSI Hub →
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
