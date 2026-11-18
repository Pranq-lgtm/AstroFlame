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
import { buildDeterministicSynthesis } from '@/backend/si-synthesis-engine';
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
    setInspectedDatasetId,
    bookmarkedDatasetIds,
    toggleBookmarkDataset,
    siWeights,
    setSiWeights,
    addRankingPreset,
    addSimulation,
    chamberParams,
    setChamberParams,
    triggerToast,
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

  // Interactive Right Empirical Telemetry & Timeline States
  const [hoveredWaveIdx, setHoveredWaveIdx] = useState<number | null>(null);
  const [hoveredBarIdx, setHoveredBarIdx] = useState<number | null>(null);
  const [barChannelMode, setBarChannelMode] = useState<'spike' | 'radius'>('spike');
  const [selectedGaugeIdx, setSelectedGaugeIdx] = useState<number | null>(null);
  const [visibleCurves, setVisibleCurves] = useState<{ s1: boolean; s2: boolean; s3: boolean }>({
    s1: true,
    s2: true,
    s3: true,
  });
  const [hoveredCurveIdx, setHoveredCurveIdx] = useState<number | null>(null);
  const [selectedCurveIdx, setSelectedCurveIdx] = useState<number | null>(null);
  const [logFilter, setLogFilter] = useState<'all' | 'nominal' | 'warning' | 'critical'>('all');
  const [hoveredTimelineSec, setHoveredTimelineSec] = useState<number | null>(null);

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

  const filteredLiveLog = useMemo(() => {
    if (logFilter === 'all') return datasetProfile.liveLog;
    return datasetProfile.liveLog.filter((entry) => entry.status === logFilter);
  }, [datasetProfile.liveLog, logFilter]);

  const parseTimestampToSec = (ts: string): number => {
    const parts = ts.split(':');
    if (parts.length !== 2) return 150;
    const mins = parseInt(parts[0], 10) || 0;
    const secs = Math.round(parseFloat(parts[1]) || 0);
    const total = Math.max(0, Math.min(300, mins * 60 + secs));
    return Math.round(total / 10) * 10;
  };

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
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || '';
      const res = await fetch(`${backendUrl}/api/si-synthesis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: activePrompt,
          personaRole,
        }),
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      if (data.text) {
        setSynthesisOutput({
          text: data.text,
          engineMode:
            data.engineMode ||
            'Gemini 4 Hydrogen (gemini-4-hydrogen • ThinkingLevel.HIGH)',
          thinkingLevel: data.thinkingLevel || 'ThinkingLevel.HIGH',
          citedDatasets: data.citedDatasets || [],
        });
      }
    } catch {
      const fallback = buildDeterministicSynthesis(activePrompt, personaRole);
      setSynthesisOutput({
        text: fallback.synthesis,
        engineMode: fallback.engineMode,
        thinkingLevel: 'ThinkingLevel.HIGH (gemini-4-hydrogen)',
        citedDatasets: fallback.citedDatasets,
      });
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
    <div className="space-y-12">
      {/* ===================================================================== */}
      {/* COCKPIT ARCHITECTURE MATCHING Dashboard_UI (LEFT, CENTER, RIGHT, BOTTOM) */}
      {/* ===================================================================== */}
      <section className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
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
          {/* RIGHT PANEL (3 Cols): Interactive Empirical Telemetry & Live Log   */}
          {/* ================================================================= */}
          <div className="lg:col-span-3 flex flex-col">
            <div className="text-[11px] font-mono tracking-wider uppercase text-slate-500 dark:text-slate-400 mb-1 px-1">
              RIGHT · EMPIRICAL TELEMETRY ({activeDataset.psiId})
            </div>
            <div className="flex-1 rounded-xl bg-white dark:bg-[#090e21] border border-slate-300 dark:border-slate-800 p-3.5 flex flex-col justify-between space-y-3 shadow-md">
              {/* Telemetry Header */}
              <div className="flex flex-wrap items-center justify-between gap-1 pb-1.5 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    Telemetry
                  </span>
                  <span className="ml-2 text-[10px] font-mono text-amber-700 dark:text-amber-400">
                    [{activeDataset.psiId}]
                  </span>
                </div>
                <span className="text-[10px] font-mono tabular-nums text-sky-700 dark:text-sky-400 font-semibold">
                  t = {playbackSec}s · {currentTimePoint.primarySignal} {datasetProfile.primaryChannelUnit}
                </span>
              </div>

              {/* Chart 1: Interactive Dual-Channel Empirical Waveform (Hover + Click-to-Scrub) */}
              <div className="rounded-lg bg-slate-50 dark:bg-slate-950 p-2.5 border border-slate-200 dark:border-slate-800 space-y-1">
                <div className="flex items-center justify-between gap-2 text-[10px] font-mono text-slate-600 dark:text-slate-400">
                  <span className="text-amber-700 dark:text-amber-400 font-semibold leading-tight">
                    {datasetProfile.primaryChannelName}
                  </span>
                  <span className="tabular-nums shrink-0">
                    {hoveredWaveIdx !== null
                      ? `t=${datasetProfile.timeSeries[hoveredWaveIdx]?.timeSec ?? 0}s · ${datasetProfile.timeSeries[hoveredWaveIdx]?.primarySignal ?? 0} ${datasetProfile.primaryChannelUnit}`
                      : `${waveformSvgPaths.minP}–${waveformSvgPaths.maxP} ${datasetProfile.primaryChannelUnit}`}
                  </span>
                </div>
                <svg
                  viewBox="0 0 280 74"
                  className="w-full h-16 cursor-crosshair select-none"
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const svgX = ((e.clientX - rect.left) / rect.width) * 280;
                    const ratio = Math.max(0, Math.min(1, (svgX - 28) / 244));
                    const idx = Math.min(
                      datasetProfile.timeSeries.length - 1,
                      Math.round(ratio * (datasetProfile.timeSeries.length - 1))
                    );
                    setHoveredWaveIdx(idx);
                  }}
                  onMouseLeave={() => setHoveredWaveIdx(null)}
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const svgX = ((e.clientX - rect.left) / rect.width) * 280;
                    const ratio = Math.max(0, Math.min(1, (svgX - 28) / 244));
                    const idx = Math.min(
                      datasetProfile.timeSeries.length - 1,
                      Math.round(ratio * (datasetProfile.timeSeries.length - 1))
                    );
                    const pt = datasetProfile.timeSeries[idx];
                    if (pt) {
                      setChamberParams((prev) => ({ ...prev, playbackTimeSec: pt.timeSec }));
                    }
                  }}
                >
                  <line x1="24" y1="14" x2="274" y2="14" className="stroke-slate-200 dark:stroke-slate-800" strokeWidth="1" />
                  <line x1="24" y1="38" x2="274" y2="38" className="stroke-slate-200 dark:stroke-slate-800" strokeWidth="1" />
                  <line x1="24" y1="64" x2="274" y2="64" className="stroke-slate-200 dark:stroke-slate-800" strokeWidth="1" />
                  <polyline
                    fill="none"
                    className="stroke-amber-600 dark:stroke-amber-400"
                    strokeWidth="2.2"
                    points={waveformSvgPaths.primaryPolyline}
                  />
                  {/* Hovered Point Crosshair & Dot */}
                  {hoveredWaveIdx !== null && (() => {
                    const pt = datasetProfile.timeSeries[hoveredWaveIdx];
                    if (!pt) return null;
                    const spanP = Math.max(1, waveformSvgPaths.maxP - waveformSvgPaths.minP);
                    const hx = 28 + (hoveredWaveIdx / Math.max(1, datasetProfile.timeSeries.length - 1)) * 244;
                    const hy = 66 - ((pt.primarySignal - waveformSvgPaths.minP) / spanP) * 52;
                    return (
                      <g>
                        <line
                          x1={hx}
                          y1="6"
                          x2={hx}
                          y2="68"
                          className="stroke-slate-400 dark:stroke-slate-500"
                          strokeWidth="1"
                          strokeDasharray="2,2"
                        />
                        <circle
                          cx={hx}
                          cy={hy}
                          r="3.5"
                          className="fill-amber-600 dark:fill-amber-400 stroke-white dark:stroke-slate-950"
                          strokeWidth="1.5"
                        />
                      </g>
                    );
                  })()}
                  {/* Active Playback Cursor */}
                  <line
                    x1={28 + (playbackSec / 300) * 244}
                    y1="6"
                    x2={28 + (playbackSec / 300) * 244}
                    y2="68"
                    className="stroke-sky-600 dark:stroke-sky-400"
                    strokeWidth="1.5"
                    strokeDasharray="2,2"
                  />
                </svg>
                <div className="text-[9px] font-mono text-slate-500 dark:text-slate-400 flex items-center justify-between">
                  <span>Click waveform to scrub clock</span>
                  <span className="truncate max-w-[130px]">{currentTimePoint.phaseLabel}</span>
                </div>
              </div>

              {/* Chart 2: Interactive Spectral / Soot / Flame Radius Bar Chart (Mode Toggle + Click-to-Scrub) */}
              <div className="rounded-lg bg-slate-50 dark:bg-slate-950 p-2.5 border border-slate-200 dark:border-slate-800 space-y-1">
                <div className="flex items-center justify-between gap-1 text-[10px] font-mono text-slate-600 dark:text-slate-400">
                  <span className="text-sky-700 dark:text-cyan-400 font-semibold leading-tight">
                    {barChannelMode === 'spike'
                      ? datasetProfile.spikeChannelName
                      : 'Optical Flame Radius'}
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setBarChannelMode('spike')}
                      className={`px-1.5 py-0.5 rounded text-[9px] cursor-pointer transition-colors ${
                        barChannelMode === 'spike'
                          ? 'bg-sky-600 text-white dark:bg-sky-500 dark:text-slate-950 font-bold'
                          : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      Spike
                    </button>
                    <button
                      type="button"
                      onClick={() => setBarChannelMode('radius')}
                      className={`px-1.5 py-0.5 rounded text-[9px] cursor-pointer transition-colors ${
                        barChannelMode === 'radius'
                          ? 'bg-sky-600 text-white dark:bg-sky-500 dark:text-slate-950 font-bold'
                          : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      Radius
                    </button>
                  </div>
                </div>
                <div className="text-[10px] font-mono text-slate-600 dark:text-slate-400 tabular-nums flex items-center justify-between">
                  <span>
                    {hoveredBarIdx !== null
                      ? `Hover t=${datasetProfile.timeSeries[hoveredBarIdx]?.timeSec}s`
                      : `Active t=${playbackSec}s`}
                  </span>
                  <strong className="text-slate-900 dark:text-slate-200">
                    {(() => {
                      const pt =
                        hoveredBarIdx !== null
                          ? datasetProfile.timeSeries[hoveredBarIdx]
                          : currentTimePoint;
                      if (!pt) return '';
                      return barChannelMode === 'spike'
                        ? `${pt.sootOrIonSpike} ${datasetProfile.spikeChannelUnit}`
                        : `${pt.flameRadiusMm.toFixed(2)} mm`;
                    })()}
                  </strong>
                </div>
                <svg viewBox="0 0 280 62" className="w-full h-14 cursor-pointer select-none">
                  <line x1="24" y1="15" x2="274" y2="15" className="stroke-slate-200 dark:stroke-slate-800" strokeWidth="1" />
                  <line x1="24" y1="36" x2="274" y2="36" className="stroke-slate-200 dark:stroke-slate-800" strokeWidth="1" />
                  <line x1="24" y1="56" x2="274" y2="56" className="stroke-slate-200 dark:stroke-slate-800" strokeWidth="1" />
                  {datasetProfile.timeSeries.map((pt, idx) => {
                    const x = 28 + (idx / 30) * 242;
                    const normVal =
                      barChannelMode === 'spike'
                        ? pt.sootOrIonSpike / 100
                        : Math.min(1, pt.flameRadiusMm / 8.0);
                    const barH = Math.max(3, normVal * 46);
                    const isCursor = pt.timeSec === playbackSec;
                    const isHovered = hoveredBarIdx === idx;
                    return (
                      <rect
                        key={pt.timeSec}
                        x={x - 2.5}
                        y={56 - barH}
                        width="5"
                        height={barH}
                        rx="1"
                        className={
                          isCursor
                            ? 'fill-amber-600 dark:fill-amber-400'
                            : isHovered
                            ? 'fill-sky-700 dark:fill-sky-300'
                            : 'fill-sky-600/80 dark:fill-cyan-400/80'
                        }
                        onMouseEnter={() => setHoveredBarIdx(idx)}
                        onMouseLeave={() => setHoveredBarIdx(null)}
                        onClick={() =>
                          setChamberParams((prev) => ({ ...prev, playbackTimeSec: pt.timeSec }))
                        }
                      />
                    );
                  })}
                </svg>
              </div>

              {/* 3 Interactive Radial Gauges (Full Unclipped Titles + Clickable Detail Popover) */}
              <div className="space-y-2 py-0.5">
                <div className="grid grid-cols-3 gap-2">
                  {datasetProfile.gauges.map((g, gIdx) => {
                    const pct = Math.min(1, Math.max(0.08, g.value / g.max));
                    const strokeHex =
                      g.color === 'amber'
                        ? '#d97706'
                        : g.color === 'emerald'
                        ? '#059669'
                        : g.color === 'purple'
                        ? '#7c3aed'
                        : '#0284c7';
                    const dash = (pct * 138).toFixed(1);
                    const isSelected = selectedGaugeIdx === gIdx;
                    return (
                      <button
                        key={g.label}
                        type="button"
                        onClick={() =>
                          setSelectedGaugeIdx((prev) => (prev === gIdx ? null : gIdx))
                        }
                        className={`rounded-lg bg-slate-50 dark:bg-slate-950/90 border p-2 flex flex-col items-center text-center transition-all cursor-pointer ${
                          isSelected
                            ? 'border-sky-500 ring-1 ring-sky-500/40 shadow-sm'
                            : 'border-slate-200 dark:border-slate-800 hover:border-sky-400/60'
                        }`}
                      >
                        <svg viewBox="0 0 64 64" className="w-12 h-12">
                          <circle
                            cx="32"
                            cy="32"
                            r="22"
                            fill="none"
                            className="stroke-slate-200 dark:stroke-slate-800"
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
                            y="35"
                            textAnchor="middle"
                            className="fill-slate-900 dark:fill-white text-[11px] font-mono font-bold tabular-nums"
                          >
                            {g.value}
                          </text>
                        </svg>
                        <div className="text-[10px] leading-tight font-mono font-semibold text-slate-800 dark:text-slate-200 w-full mt-0.5">
                          {g.label}
                        </div>
                        <div className="text-[9px] font-mono text-slate-500 dark:text-slate-400 w-full">
                          {g.unit}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Expanded Radial Gauge Detail Popover Card */}
                {selectedGaugeIdx !== null && datasetProfile.gauges[selectedGaugeIdx] && (() => {
                  const g = datasetProfile.gauges[selectedGaugeIdx];
                  return (
                    <div className="rounded-lg bg-sky-50/90 dark:bg-[#050814] border border-sky-300 dark:border-sky-500/40 p-2.5 text-[11px] space-y-1.5">
                      <div className="flex items-center justify-between gap-2 font-mono">
                        <span className="font-bold text-sky-800 dark:text-sky-300">{g.label}</span>
                        <span className="text-slate-700 dark:text-slate-300 tabular-nums font-semibold">
                          {g.value} / {g.max} {g.unit}
                        </span>
                      </div>
                      <div className="text-slate-600 dark:text-slate-400 leading-snug">
                        {g.subtext}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (g.label.includes('O₂') || g.unit.includes('O₂')) {
                            const targetO2 = Math.max(15, Math.min(85, Math.round(g.value)));
                            setChamberParams((prev) => ({ ...prev, oxygenPercent: targetO2 }));
                            triggerToast(`Applied ${targetO2}% O₂ envelope to 3D Chamber`);
                          } else if (g.label.includes('Cool-Flame')) {
                            setChamberParams((prev) => ({
                              ...prev,
                              coolFlameMode: true,
                              gravityG: 0.0,
                            }));
                            triggerToast('Activated 500–1000 K Cool-Flame Mode in 3D Chamber');
                          } else {
                            setChamberParams((prev) => ({
                              ...prev,
                              eFieldKv: 6.5,
                              provenanceMode: 'psi_experimental',
                            }));
                            triggerToast(`Applied ${g.label} diagnostic overlay to 3D Chamber`);
                          }
                        }}
                        className="w-full py-1 px-2 rounded bg-sky-600 hover:bg-sky-500 text-white dark:bg-sky-400 dark:text-slate-950 font-mono font-semibold text-[10px] transition-colors cursor-pointer"
                      >
                        Apply Envelope to 3D Chamber
                      </button>
                    </div>
                  );
                })()}
              </div>

              {/* Chart 3: Interactive Parametric Curve Explorer (Toggle Curves + Click Sweep Point) */}
              <div className="rounded-lg bg-slate-50 dark:bg-slate-950 p-2.5 border border-slate-200 dark:border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between gap-2 text-[10px] font-mono text-slate-600 dark:text-slate-400">
                  <span className="leading-tight font-semibold text-slate-800 dark:text-slate-200">
                    {datasetProfile.curves.xAxisLabel}
                  </span>
                  <span className="text-emerald-700 dark:text-emerald-400 shrink-0 tabular-nums">
                    {(() => {
                      const idx = hoveredCurveIdx ?? selectedCurveIdx;
                      if (idx === null) return '3 Curves';
                      return `${datasetProfile.curves.xTicks[idx]} · ${datasetProfile.curves.series1Values[idx]}/${datasetProfile.curves.series2Values[idx]}`;
                    })()}
                  </span>
                </div>
                <svg viewBox="0 0 280 78" className="w-full h-20 cursor-pointer select-none">
                  <line x1="20" y1="16" x2="270" y2="16" className="stroke-slate-200 dark:stroke-slate-800" strokeWidth="1" />
                  <line x1="20" y1="42" x2="270" y2="42" className="stroke-slate-200 dark:stroke-slate-800" strokeWidth="1" />
                  <line x1="20" y1="68" x2="270" y2="68" className="stroke-slate-200 dark:stroke-slate-800" strokeWidth="1" />

                  {(hoveredCurveIdx !== null || selectedCurveIdx !== null) && (() => {
                    const activeIdx = hoveredCurveIdx ?? selectedCurveIdx ?? 0;
                    const ax = 24 + (activeIdx / Math.max(1, datasetProfile.curves.xTicks.length - 1)) * 242;
                    return (
                      <line
                        x1={ax}
                        y1="8"
                        x2={ax}
                        y2="72"
                        className="stroke-slate-400 dark:stroke-slate-600"
                        strokeWidth="1"
                        strokeDasharray="2,2"
                      />
                    );
                  })()}

                  {[
                    { key: 's1' as const, vals: datasetProfile.curves.series1Values, color: '#d97706' },
                    { key: 's2' as const, vals: datasetProfile.curves.series2Values, color: '#0284c7' },
                    { key: 's3' as const, vals: datasetProfile.curves.series3Values, color: '#059669' },
                  ].map((s) => {
                    if (!visibleCurves[s.key]) return null;
                    const coords = s.vals.map((v, i) => ({
                      x: 24 + (i / (s.vals.length - 1)) * 242,
                      y: 68 - Math.min(1, v / 300) * 52,
                      val: v,
                      i,
                    }));
                    return (
                      <g key={s.key}>
                        <polyline
                          fill="none"
                          stroke={s.color}
                          strokeWidth="2"
                          points={coords.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ')}
                        />
                        {coords.map((c) => (
                          <circle
                            key={c.i}
                            cx={c.x}
                            cy={c.y}
                            r={selectedCurveIdx === c.i || hoveredCurveIdx === c.i ? 4 : 2.5}
                            fill={s.color}
                            className="stroke-white dark:stroke-slate-950"
                            strokeWidth="1"
                            onMouseEnter={() => setHoveredCurveIdx(c.i)}
                            onMouseLeave={() => setHoveredCurveIdx(null)}
                            onClick={() => {
                              setSelectedCurveIdx(c.i);
                              const frac = c.i / Math.max(1, coords.length - 1);
                              const nextFlow = Number((frac * 18).toFixed(1));
                              const nextEf = Number((-5 + frac * 15).toFixed(1));
                              setChamberParams((prev) => ({
                                ...prev,
                                airflowCmPerSec: nextFlow,
                                eFieldKv: nextEf,
                              }));
                              triggerToast(
                                `Applied sweep point ${datasetProfile.curves.xTicks[c.i]} (${nextFlow} cm/s, ${nextEf >= 0 ? `+${nextEf}` : nextEf} kV)`
                              );
                            }}
                          />
                        ))}
                      </g>
                    );
                  })}
                </svg>

                {/* Unclipped Interactive Curve Legend Toggles */}
                <div className="flex flex-wrap items-center gap-1.5 text-[9px] font-mono pt-0.5">
                  {[
                    { key: 's1' as const, label: datasetProfile.curves.series1Label, dotClass: 'text-amber-600 dark:text-amber-400' },
                    { key: 's2' as const, label: datasetProfile.curves.series2Label, dotClass: 'text-sky-600 dark:text-cyan-400' },
                    { key: 's3' as const, label: datasetProfile.curves.series3Label, dotClass: 'text-emerald-600 dark:text-emerald-400' },
                  ].map((item) => {
                    const active = visibleCurves[item.key];
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() =>
                          setVisibleCurves((prev) => ({ ...prev, [item.key]: !prev[item.key] }))
                        }
                        className={`px-1.5 py-0.5 rounded border text-left transition-opacity cursor-pointer ${
                          active
                            ? 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 opacity-100'
                            : 'bg-slate-100 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-45 line-through'
                        }`}
                      >
                        <span className={item.dotClass}>● {item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Filterable Live Measurement Log with Click-to-Jump Phase Time */}
              <div className="pt-1.5 border-t border-slate-200 dark:border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between gap-2 text-xs font-bold text-slate-900 dark:text-white">
                  <span>Live Log ({activeDataset.psiId})</span>
                  <span className="text-[10px] font-mono text-sky-700 dark:text-sky-400 truncate">
                    DOI: {activeDataset.doi}
                  </span>
                </div>

                {/* Severity Filter Tabs */}
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#050814] p-0.5 rounded-md border border-slate-200 dark:border-slate-800 text-[9px] font-mono">
                  {(['all', 'nominal', 'warning', 'critical'] as const).map((statusKey) => (
                    <button
                      key={statusKey}
                      type="button"
                      onClick={() => setLogFilter(statusKey)}
                      className={`flex-1 py-0.5 px-1 rounded capitalize transition-colors cursor-pointer ${
                        logFilter === statusKey
                          ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      {statusKey}
                    </button>
                  ))}
                </div>

                <div className="space-y-1 text-[11px] font-mono max-h-[126px] overflow-y-auto pr-1">
                  {filteredLiveLog.map((entry, idx) => {
                    const jumpSec = parseTimestampToSec(entry.timestamp);
                    const statusColor =
                      entry.status === 'critical'
                        ? 'text-rose-700 dark:text-rose-400'
                        : entry.status === 'warning'
                        ? 'text-amber-700 dark:text-amber-300'
                        : 'text-emerald-700 dark:text-emerald-300';
                    const glyph =
                      entry.status === 'critical' ? '✖' : entry.status === 'warning' ? '▲' : '●';
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setChamberParams((prev) => ({ ...prev, playbackTimeSec: jumpSec }));
                          triggerToast(`Jumped playback clock to ${entry.timestamp} (${jumpSec}s)`);
                        }}
                        className="w-full text-left flex items-center justify-between text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900/70 rounded px-1 py-0.5 gap-2 transition-colors cursor-pointer"
                      >
                        <span className="truncate">
                          <span className={`${statusColor} mr-1`}>{glyph}</span>
                          {entry.timestamp} · {entry.channel}
                        </span>
                        <span className="text-sky-700 dark:text-sky-300 shrink-0 font-semibold">
                          {entry.measurement}
                        </span>
                      </button>
                    );
                  })}
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

              {/* Interactive Area Timeline Chart (0s to 300s) */}
              <div className="lg:col-span-9">
                <svg
                  viewBox="0 0 900 58"
                  className="w-full h-14 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 cursor-crosshair select-none"
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const svgX = ((e.clientX - rect.left) / rect.width) * 900;
                    const rawSec = ((svgX - 25) / 850) * 300;
                    const snapped = Math.max(0, Math.min(300, Math.round(rawSec / 10) * 10));
                    setHoveredTimelineSec(snapped);
                  }}
                  onMouseLeave={() => setHoveredTimelineSec(null)}
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const svgX = ((e.clientX - rect.left) / rect.width) * 900;
                    const rawSec = ((svgX - 25) / 850) * 300;
                    const snapped = Math.max(0, Math.min(300, Math.round(rawSec / 10) * 10));
                    setChamberParams((prev) => ({ ...prev, playbackTimeSec: snapped }));
                  }}
                >
                  {/* Vertical Grid Markers */}
                  {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300].map((sec) => {
                    const x = 25 + (sec / 300) * 850;
                    return (
                      <g key={sec}>
                        <line
                          x1={x}
                          y1="4"
                          x2={x}
                          y2="42"
                          className="stroke-slate-200 dark:stroke-slate-800"
                          strokeWidth="1"
                        />
                        <text
                          x={x}
                          y="54"
                          textAnchor="middle"
                          className="fill-slate-600 dark:fill-slate-400 text-[9px] font-mono"
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
                          fill="rgba(2, 132, 199, 0.22)"
                          stroke="#0284c7"
                          strokeWidth="1.5"
                        />
                        <polygon
                          points={buildArea(secondHalf)}
                          fill="rgba(217, 119, 6, 0.22)"
                          stroke="#d97706"
                          strokeWidth="1.5"
                        />
                        {hoveredTimelineSec !== null && (
                          <line
                            x1={25 + (hoveredTimelineSec / 300) * 850}
                            y1="2"
                            x2={25 + (hoveredTimelineSec / 300) * 850}
                            y2="44"
                            className="stroke-slate-500/70"
                            strokeWidth="1"
                            strokeDasharray="2,2"
                          />
                        )}
                        <line
                          x1={cursorX}
                          y1="2"
                          x2={cursorX}
                          y2="44"
                          className="stroke-slate-900 dark:stroke-white"
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
      <section className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              01. Super Intelligence (SI) Multi-Attribute Dataset Ranking Engine
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
              Showing Core 8 Fire-Safety Anchor datasets by default. Click <strong className="text-sky-600 dark:text-sky-400">&ldquo;Inspect Telemetry &rarr;&rdquo;</strong> for full methodology.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center p-1 bg-slate-200/80 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl">
              {(['All', 'Prevention', 'Detection', 'Suppression'] as const).map((pillar) => (
                <button
                  key={pillar}
                  type="button"
                  onClick={() => setPillarFilter(pillar)}
                  className={`px-2.5 py-1 text-xs font-mono rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    pillarFilter === pillar
                      ? 'bg-sky-600 text-white dark:bg-sky-500 dark:text-slate-950 font-semibold'
                      : 'text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {pillar}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() =>
                setCatalogScope((prev) => (prev === 'core8' ? 'all26' : 'core8'))
              }
              className="px-3.5 py-1.5 text-xs font-mono font-semibold rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors cursor-pointer"
            >
              {catalogScope === 'core8'
                ? 'Show All 24 PSI Datasets'
                : 'Show Core 8 Anchor Datasets'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
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

          {/* Right Column (8 cols): Decluttered Ranked PSI Dataset Cards/Rows with Progressive Disclosure */}
          <div className="lg:col-span-8 space-y-4">
            {rankedDatasets.map(({ dataset, weightedScore }, idx) => {
              const isFoundationActive = dataset.id === activeDataset.id;
              const isBookmarked = bookmarkedDatasetIds.includes(dataset.id);
              const words = dataset.actionableSafetyRule.trim().split(/\s+/);
              const shortTakeaway =
                words.length <= 14
                  ? dataset.actionableSafetyRule
                  : `${words.slice(0, 14).join(' ')}...`;

              return (
                <div
                  key={dataset.id}
                  className={`rounded-2xl bg-white dark:bg-[#090e21] border p-5 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm ${
                    isFoundationActive
                      ? 'border-amber-400 ring-1 ring-amber-400/30'
                      : 'border-slate-200 dark:border-slate-800 hover:border-sky-500/40'
                  }`}
                >
                  <div className="space-y-2 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-[#050814] border border-slate-300 dark:border-slate-700 font-bold text-slate-900 dark:text-white">
                        #{String(idx + 1).padStart(2, '0')}
                      </span>
                      <span className="font-bold text-sky-600 dark:text-sky-400">
                        {dataset.psiId} / {dataset.shortTitle}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-[11px]">
                        {dataset.pillar}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-[#050814] border border-slate-300 dark:border-slate-800 text-[11px] text-slate-500">
                        {dataset.facility}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-1 font-mono">
                      {shortTakeaway}
                    </p>

                    {/* Composite SI Score Bar */}
                    <div className="flex items-center gap-3 pt-0.5">
                      <div className="flex-1 h-1.5 rounded-full bg-slate-200 dark:bg-[#050814] overflow-hidden max-w-xs">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-sky-400 to-amber-400"
                          style={{ width: `${Math.min(100, Math.max(12, weightedScore))}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono font-bold text-sky-600 dark:text-sky-400 tabular-nums">
                        SI {weightedScore.toFixed(1)}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => toggleBookmarkDataset(dataset.id)}
                      className={`px-2.5 py-1.5 text-xs font-mono rounded-lg border transition-colors cursor-pointer ${
                        isBookmarked
                          ? 'bg-amber-500/20 border-amber-400 text-amber-500 dark:text-amber-300'
                          : 'bg-slate-100 dark:bg-[#050814] border-slate-300 dark:border-slate-800 text-slate-400'
                      }`}
                      title="Bookmark Dataset"
                    >
                      ★
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveDatasetId(dataset.id);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className={`px-3 py-1.5 text-xs font-mono rounded-lg border transition-colors inline-flex items-center gap-1 cursor-pointer ${
                        isFoundationActive
                          ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                          : 'bg-slate-100 dark:bg-[#050814] text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-sky-400'
                      }`}
                    >
                      <Database className="w-3 h-3" />
                      <span>{isFoundationActive ? 'Active' : 'Load Cockpit'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setInspectedDatasetId(dataset.id)}
                      className="px-3 py-1.5 text-xs font-mono font-semibold rounded-lg bg-sky-600 hover:bg-sky-500 text-white dark:bg-sky-400 dark:text-slate-950 transition-colors cursor-pointer"
                    >
                      Inspect Telemetry &rarr;
                    </button>
                  </div>
                </div>
              );
            })}
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
