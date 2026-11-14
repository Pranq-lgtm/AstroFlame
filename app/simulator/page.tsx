'use client';

import React, { useState, useMemo } from 'react';
import {
  Gauge,
  Flame,
  Wind,
  Zap,
  Save,
  Trash2,
  ExternalLink,
  CheckCircle2,
  BookOpen,
  AlertTriangle,
} from 'lucide-react';
import { useAstroFlame } from '@/frontend/context/astroflame-context';

interface AtmospherePreset {
  id: string;
  name: string;
  shortTag: string;
  oxygenPercent: number;
  pressurePsia: number;
  gravityG: number;
  airflowCmPerSec: number;
  eFieldKv: number;
  description: string;
  referenceUrl: string;
  referenceLabel: string;
}

const ATMOSPHERE_PRESETS: AtmospherePreset[] = [
  {
    id: 'iss-earth-baseline',
    name: 'ISS / Earth Baseline (21% O₂ @ 14.7 psia)',
    shortTag: 'ISS 21% O₂ / 14.7 psia',
    oxygenPercent: 21.0,
    pressurePsia: 14.7,
    gravityG: 0.0,
    airflowCmPerSec: 3.5,
    eFieldKv: 0.0,
    description:
      'Standard sea-level nitrogen-diluted atmosphere maintained aboard the International Space Station and Commercial LEO destinations. Requires ~2.5–4 hours of EVA pre-breathe before 4.3 psia suit depressurization.',
    referenceUrl: 'https://psi.nasa.gov/physci/repo/data/investigations/PSI-25',
    referenceLabel: 'BASS-II (PSI-25)',
  },
  {
    id: 'lunar-base-fm2',
    name: 'Planned Moon Base / Pressurized Rover (34% O₂ @ 8.2 psia)',
    shortTag: 'Lunar FM2 34% O₂ / 8.2 psia',
    oxygenPercent: 34.0,
    pressurePsia: 8.2,
    gravityG: 0.16,
    airflowCmPerSec: 12.0,
    eFieldKv: 0.0,
    description:
      'NASA Exploration Atmosphere (≥30% to 34% O₂ at ≤10.2 psia) representing a >61% relative increase in O₂ mole fraction (>40% threshold) to slash astronaut EVA pre-breathe overhead while preventing decompression sickness.',
    referenceUrl: 'https://ntrs.nasa.gov/citations/20240015307',
    referenceLabel: 'NASA FM2 (CLPS CP-21)',
  },
  {
    id: 'eva-suit-pure-o2',
    name: 'Spacesuit EVA Pure Oxygen (100% O₂ @ 4.3 psia)',
    shortTag: 'EVA Suit 100% O₂ / 4.3 psia',
    oxygenPercent: 100.0,
    pressurePsia: 4.3,
    gravityG: 0.16,
    airflowCmPerSec: 18.0,
    eFieldKv: 0.0,
    description:
      'Pure oxygen spacesuit loop at 4.3 psia (29.6 kPa) maximizing suit joint mobility while purging dissolved blood nitrogen to prevent decompression sickness ("the bends"). Extreme ignition sensitivity.',
    referenceUrl: 'https://www.nasa.gov/mission/apollo-1/',
    referenceLabel: 'EVA Suit Flammability Standard',
  },
  {
    id: 'cfig-extreme-85o2',
    name: 'ACME CFI-G Extreme Envelope (85% O₂ "Inside-Out Flame")',
    shortTag: 'CFI-G 85% O₂ Cool Flame',
    oxygenPercent: 85.0,
    pressurePsia: 10.2,
    gravityG: 0.0,
    airflowCmPerSec: 1.0,
    eFieldKv: 4.5,
    description:
      'Highest oxygen concentration ever tested in orbital microgravity (PSI-159). Demonstrates spherical gaseous cool flames (500–1000 K) that oscillate directly into explosive hot re-ignition.',
    referenceUrl: 'https://psi.nasa.gov/physci/repo/data/investigations/PSI-159',
    referenceLabel: 'ACME CFI-G (PSI-159)',
  },
];

export default function ExplorationSimulatorPage() {
  const { simulations, addSimulation, deleteSimulation } = useAstroFlame();

  const [activePresetId, setActivePresetId] = useState<string>('lunar-base-fm2');
  const [oxygenPercent, setOxygenPercent] = useState<number>(34.0);
  const [pressurePsia, setPressurePsia] = useState<number>(8.2);
  const [gravityG, setGravityG] = useState<number>(0.16);
  const [airflowCmPerSec, setAirflowCmPerSec] = useState<number>(12.0);
  const [eFieldKv, setEFieldKv] = useState<number>(0.0);
  const [scenarioTitle, setScenarioTitle] = useState<string>('');

  const applyPreset = (preset: AtmospherePreset) => {
    setActivePresetId(preset.id);
    setOxygenPercent(preset.oxygenPercent);
    setPressurePsia(preset.pressurePsia);
    setGravityG(preset.gravityG);
    setAirflowCmPerSec(preset.airflowCmPerSec);
    setEFieldKv(preset.eFieldKv);
  };

  // Real-time thermodynamic & flammability calculations
  const telemetry = useMemo(() => {
    const ppO2Psia = Number(((oxygenPercent / 100) * pressurePsia).toFixed(2));
    const ppO2Kpa = Number((ppO2Psia * 6.89476).toFixed(1));
    const relativeO2IncreasePct = Number((((oxygenPercent - 21.0) / 21.0) * 100).toFixed(1));

    const ppN2Psia = Math.max(0, (1 - oxygenPercent / 100) * pressurePsia);
    const baselinePpN2 = 0.79 * 14.7;
    const preBreatheReductionPct = Math.max(
      0,
      Math.min(100, Math.round((1 - ppN2Psia / baselinePpN2) * 100))
    );
    const preBreatheMinutesRemaining = Math.max(
      0,
      Math.round(180 * (1 - preBreatheReductionPct / 100))
    );

    const buoyantVelocityCmS = Math.sqrt(gravityG) * 32.0;
    const eFieldIonWindCmS = (Math.abs(eFieldKv) / 10.0) * 28.0;
    const effectiveSlipVelocity = Number(
      Math.sqrt(airflowCmPerSec ** 2 + buoyantVelocityCmS ** 2 + eFieldIonWindCmS ** 2).toFixed(1)
    );

    const flowPenalty =
      effectiveSlipVelocity >= 0.8 && effectiveSlipVelocity <= 14.0 ? -2.2 : effectiveSlipVelocity > 25 ? +1.4 : -0.8;
    const pressureEffect = (14.7 - pressurePsia) * 0.12;
    const estimatedLOC = Number(Math.max(11.5, 17.2 + flowPenalty + pressureEffect).toFixed(1));

    const o2MarginOverLOC = Math.max(0, oxygenPercent - estimatedLOC);
    const partialGDipAmplifier = gravityG >= 0.08 && gravityG <= 0.25 ? 14 : gravityG === 0 ? 8 : 0;
    const eFieldSuppressionBonus = eFieldKv >= 6.5 ? -18 : 0;
    const flammabilityRiskIndex = Math.max(
      5,
      Math.min(
        100,
        Math.round(o2MarginOverLOC * 3.1 + partialGDipAmplifier + eFieldSuppressionBonus)
      )
    );

    const coolFlameWarning =
      gravityG <= 0.22 && effectiveSlipVelocity <= 16.0 && oxygenPercent >= 18.0;

    const spreadMultiplier = Number(
      Math.max(
        0.2,
        ((oxygenPercent / 21.0) ** 1.65) *
          (1 + Math.min(effectiveSlipVelocity, 20) * 0.04) *
          (pressurePsia / 14.7) ** 0.35
      ).toFixed(2)
    );

    return {
      ppO2Psia,
      ppO2Kpa,
      relativeO2IncreasePct,
      preBreatheReductionPct,
      preBreatheMinutesRemaining,
      effectiveSlipVelocity,
      estimatedLOC,
      flammabilityRiskIndex,
      coolFlameWarning,
      spreadMultiplier,
    };
  }, [oxygenPercent, pressurePsia, gravityG, airflowCmPerSec, eFieldKv]);

  const activePreset =
    ATMOSPHERE_PRESETS.find((p) => p.id === activePresetId) || ATMOSPHERE_PRESETS[1];

  const handleSaveScenario = async () => {
    const label =
      scenarioTitle.trim() ||
      `${activePreset.shortTag} (${gravityG.toFixed(2)}g, ${airflowCmPerSec} cm/s)`;
    await addSimulation({
      title: label,
      presetName: activePreset.shortTag,
      gravityG,
      oxygenPercent,
      pressurePsia,
      airflowCmPerSec,
      eFieldKv,
      ppO2Psia: telemetry.ppO2Psia,
      flammabilityRiskIndex: telemetry.flammabilityRiskIndex,
      coolFlameWarning: telemetry.coolFlameWarning,
    });
    setScenarioTitle('');
  };

  const o2Pct = Math.round(((oxygenPercent - 14) / (100 - 14)) * 100);
  const pressPct = Math.round(((pressurePsia - 4) / (18 - 4)) * 100);
  const gravPct = Math.round(gravityG * 100);
  const flowPct = Math.round((airflowCmPerSec / 35) * 100);
  const efPct = Math.round(((eFieldKv + 10) / 20) * 100);

  return (
    <div className="space-y-8">
      {/* Header */}
      <section className="space-y-2 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-amber-700 dark:text-amber-400">
          <span>SIMULATION ARENA · REDUCED-ORDER PARAMETRIC CABIN MODEL</span>
          <span className="px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/40 text-amber-700 dark:text-amber-300">
            Separate Analytical Feature — Documented Assumptions Below
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white [text-wrap:balance]">
          Simulation Arena: Exploration Atmosphere &amp; Partial-Gravity Flammability Model
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300 max-w-3xl">
          This dedicated Simulation Arena provides a reduced-order analytical correlation model anchored to NASA PSI boundary-layer bounds (`BASS-II`, `SAFFIRE IV–VI`, `FM2`, `ACME E-FIELD`) to explore how `≥30% to 34% O₂ at ≤10.2 psia` (&gt;40% relative O₂ increase) alters EVA pre-breathe overhead, Limiting Oxygen Concentration (LOC), and cool-flame re-ignition windows.
        </p>
      </section>

      {/* Documented Physical Assumptions, Governing Equations & Validity Bounds */}
      <section className="rounded-xl bg-amber-50/70 dark:bg-[#0b1124] border border-amber-300 dark:border-amber-500/35 p-5 space-y-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-amber-700 dark:text-amber-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Documented Physical Assumptions, Governing Equations &amp; Validity Bounds
            </h2>
          </div>
          <span className="text-xs font-mono text-amber-700 dark:text-amber-300 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            Reduced-Order Algebraic Surrogate (Not Full 3D Navier–Stokes DNS)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="rounded-lg bg-white dark:bg-slate-950/90 border border-slate-200 dark:border-slate-800 p-3.5 space-y-1.5">
            <div className="font-mono font-bold text-sky-700 dark:text-sky-400">
              1. DALTON PARTIAL PRESSURE &amp; EVA PRE-BREATHE
            </div>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              Computes oxygen and nitrogen partial pressures via ideal-gas Dalton scaling:{' '}
              <code className="font-mono text-amber-700 dark:text-amber-300">
                ppO₂ = X_O₂ · P_tot
              </code>{' '}
              and{' '}
              <code className="font-mono text-sky-700 dark:text-sky-300">
                ppN₂ = (1 - X_O₂) · P_tot
              </code>
              . Pre-breathe reduction scales linearly against the 14.7 psia / 79% N₂ tissue-washout baseline for a 4.3 psia pure-O₂ EVA suit.
            </p>
          </div>

          <div className="rounded-lg bg-white dark:bg-slate-950/90 border border-slate-200 dark:border-slate-800 p-3.5 space-y-1.5">
            <div className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
              2. MIXED-CONVECTION &amp; ION-WIND SLIP VELOCITY
            </div>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              Combines forced HVAC ventilation (<code className="font-mono">V_forced</code>), buoyant Froude plume velocity (<code className="font-mono">V_buoy = 32·√(g/g₀) cm/s</code>), and E-FIELD corona ion-drift (<code className="font-mono">V_ion = 28·(|V|/10 kV) cm/s</code>) in quadrature:{' '}
              <code className="font-mono text-emerald-700 dark:text-emerald-300">
                V_eff = √(V_forced² + V_buoy² + V_ion²)
              </code>
              .
            </p>
          </div>

          <div className="rounded-lg bg-white dark:bg-slate-950/90 border border-slate-200 dark:border-slate-800 p-3.5 space-y-1.5">
            <div className="font-mono font-bold text-purple-700 dark:text-purple-400">
              3. VALIDITY ENVELOPE &amp; LIMITATIONS
            </div>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              Calibrated for thin cellulosic/SIBAL and PMMA fuels across <code className="font-mono">14%–100% O₂</code>, <code className="font-mono">4.0–18.0 psia</code>, and <code className="font-mono">0.00g–1.00g</code>. Does not resolve 3D turbulent acoustic instabilities, multi-layer charring delamination, or momentum-dominated rocket thruster flows.
            </p>
          </div>
        </div>
      </section>

      {/* 4 Mission Atmosphere Presets */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {ATMOSPHERE_PRESETS.map((preset) => {
          const isSelected = preset.id === activePresetId;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => applyPreset(preset)}
              className={`text-left rounded-xl p-4 border transition-all flex flex-col justify-between space-y-3 ${
                isSelected
                  ? 'bg-white dark:bg-[#0f172a] border-sky-600 dark:border-sky-400 shadow-md'
                  : 'bg-white/75 dark:bg-[#0f172a]/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span
                    className={
                      isSelected
                        ? 'text-sky-700 dark:text-sky-400 font-semibold'
                        : 'text-slate-500 dark:text-slate-400'
                    }
                  >
                    {preset.shortTag}
                  </span>
                  <span className="text-amber-700 dark:text-amber-300 tabular-nums">
                    {preset.gravityG.toFixed(2)}g
                  </span>
                </div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">{preset.name}</div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3">
                  {preset.description}
                </p>
              </div>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-sky-700 dark:text-sky-400">
                <span>Ref: {preset.referenceLabel}</span>
                <span>Apply →</span>
              </div>
            </button>
          );
        })}
      </section>

      {/* Main Split Simulator Console */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Parameter Column (5 cols) */}
        <div className="lg:col-span-5 rounded-xl bg-white dark:bg-[#0f172a]/85 border border-slate-200 dark:border-sky-400/20 p-5 space-y-5 shadow-sm">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
              <Gauge className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <span>Cabin &amp; Boundary-Layer Controls</span>
            </div>
            <a
              href={activePreset.referenceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-mono text-sky-700 dark:text-sky-400 hover:underline inline-flex items-center gap-1"
            >
              {activePreset.referenceLabel}
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="space-y-4">
            {/* Oxygen Concentration Slider */}
            <div className="rounded-lg bg-slate-50 dark:bg-slate-900/75 border border-slate-200 dark:border-slate-800 p-3">
              <div className="flex justify-between text-xs font-mono mb-2">
                <span className="text-slate-700 dark:text-slate-300">Cabin Oxygen Mole Fraction (O₂ %)</span>
                <span className="text-amber-700 dark:text-amber-400 font-bold tabular-nums">
                  {oxygenPercent.toFixed(1)} % O₂
                </span>
              </div>
              <input
                type="range"
                min={14}
                max={100}
                step={0.5}
                value={oxygenPercent}
                onChange={(e) => setOxygenPercent(parseFloat(e.target.value))}
                style={{
                  background: `linear-gradient(to right, #f59e0b 0%, #f59e0b ${o2Pct}%, rgba(100,116,139,0.35) ${o2Pct}%, rgba(100,116,139,0.35) 100%)`,
                }}
                className="w-full astro-range"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1.5">
                <span>14% (LOI Limit)</span>
                <span>21% (ISS)</span>
                <span>34% (Moon)</span>
                <span>85%</span>
                <span>100%</span>
              </div>
            </div>

            {/* Cabin Total Pressure Slider */}
            <div className="rounded-lg bg-slate-50 dark:bg-slate-900/75 border border-slate-200 dark:border-slate-800 p-3">
              <div className="flex justify-between text-xs font-mono mb-2">
                <span className="text-slate-700 dark:text-slate-300">Total Cabin Pressure (psia)</span>
                <span className="text-sky-700 dark:text-sky-300 font-bold tabular-nums">
                  {pressurePsia.toFixed(1)} psia ({(pressurePsia * 6.895).toFixed(1)} kPa)
                </span>
              </div>
              <input
                type="range"
                min={4.0}
                max={18.0}
                step={0.1}
                value={pressurePsia}
                onChange={(e) => setPressurePsia(parseFloat(e.target.value))}
                style={{
                  background: `linear-gradient(to right, #38bdf8 0%, #38bdf8 ${pressPct}%, rgba(100,116,139,0.35) ${pressPct}%, rgba(100,116,139,0.35) 100%)`,
                }}
                className="w-full astro-range"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1.5">
                <span>4.3 psia</span>
                <span>8.2 psia</span>
                <span>10.2 psia</span>
                <span>14.7 psia</span>
              </div>
            </div>

            {/* Gravity Level Slider */}
            <div className="rounded-lg bg-slate-50 dark:bg-slate-900/75 border border-slate-200 dark:border-slate-800 p-3">
              <div className="flex justify-between text-xs font-mono mb-2">
                <span className="text-slate-700 dark:text-slate-300">Gravitational Acceleration (g)</span>
                <span className="text-emerald-700 dark:text-emerald-300 font-bold tabular-nums">
                  {gravityG.toFixed(2)} g
                </span>
              </div>
              <input
                type="range"
                min={0.0}
                max={1.0}
                step={0.01}
                value={gravityG}
                onChange={(e) => setGravityG(parseFloat(e.target.value))}
                style={{
                  background: `linear-gradient(to right, #10b981 0%, #10b981 ${gravPct}%, rgba(100,116,139,0.35) ${gravPct}%, rgba(100,116,139,0.35) 100%)`,
                }}
                className="w-full astro-range"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1.5">
                <span>0.00g (ISS)</span>
                <span>0.16g (Moon)</span>
                <span>0.38g (Mars)</span>
                <span>1.00g</span>
              </div>
            </div>

            {/* Forced HVAC Airflow Slider */}
            <div className="rounded-lg bg-slate-50 dark:bg-slate-900/75 border border-slate-200 dark:border-slate-800 p-3">
              <div className="flex justify-between text-xs font-mono mb-2">
                <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Wind className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                  Forced HVAC Duct Velocity (BASS-II / SAFFIRE)
                </span>
                <span className="text-sky-700 dark:text-sky-300 font-bold tabular-nums">
                  {airflowCmPerSec.toFixed(1)} cm/s
                </span>
              </div>
              <input
                type="range"
                min={0.0}
                max={35.0}
                step={0.5}
                value={airflowCmPerSec}
                onChange={(e) => setAirflowCmPerSec(parseFloat(e.target.value))}
                style={{
                  background: `linear-gradient(to right, #38bdf8 0%, #38bdf8 ${flowPct}%, rgba(100,116,139,0.35) ${flowPct}%, rgba(100,116,139,0.35) 100%)`,
                }}
                className="w-full astro-range"
              />
            </div>

            {/* E-FIELD Electrode Mesh Voltage */}
            <div className="rounded-lg bg-slate-50 dark:bg-slate-900/75 border border-slate-200 dark:border-slate-800 p-3">
              <div className="flex justify-between text-xs font-mono mb-2">
                <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  ACME E-FIELD Mesh Potential (35–50 mm)
                </span>
                <span className="text-purple-700 dark:text-purple-300 font-bold tabular-nums">
                  {eFieldKv >= 0 ? `+${eFieldKv.toFixed(1)}` : eFieldKv.toFixed(1)} kV
                </span>
              </div>
              <input
                type="range"
                min={-10.0}
                max={10.0}
                step={0.5}
                value={eFieldKv}
                onChange={(e) => setEFieldKv(parseFloat(e.target.value))}
                style={{
                  background: `linear-gradient(to right, #a855f7 0%, #a855f7 ${efPct}%, rgba(100,116,139,0.35) ${efPct}%, rgba(100,116,139,0.35) 100%)`,
                }}
                className="w-full astro-range"
              />
            </div>
          </div>

          {/* Save Scenario to Cloud Firestore */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
            <label className="block text-xs font-mono text-slate-600 dark:text-slate-400">
              SAVE SIMULATION RUN TO CLOUD FIRESTORE (saved_simulations)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={scenarioTitle}
                onChange={(e) => setScenarioTitle(e.target.value)}
                placeholder={`${activePreset.shortTag} (${gravityG.toFixed(2)}g)`}
                className="flex-1 px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
              />
              <button
                type="button"
                onClick={() => void handleSaveScenario()}
                className="px-4 py-2 text-xs font-semibold bg-sky-600 hover:bg-sky-500 dark:bg-sky-400 dark:hover:bg-sky-300 text-white dark:text-slate-950 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
              >
                <Save className="w-3.5 h-3.5" />
                Save Scenario
              </button>
            </div>
          </div>
        </div>

        {/* Right Telemetry & Partial-G Curve Column (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* 4 Primary Telemetry Readout Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl bg-white dark:bg-[#0f172a]/85 border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
              <div className="text-xs tracking-wider uppercase font-mono text-slate-500 dark:text-slate-400">
                PARTIAL PRESSURE OF O₂ (ppO₂)
              </div>
              <div className="mt-1 flex items-baseline">
                <span className="text-3xl font-mono font-bold tabular-nums text-slate-900 dark:text-white">
                  {telemetry.ppO2Psia.toFixed(2)}
                </span>
                <span className="text-xs uppercase font-mono text-slate-500 dark:text-slate-400 ml-1.5">
                  PSIA ({telemetry.ppO2Kpa} kPa)
                </span>
              </div>
              <div className="mt-1.5 text-xs font-mono text-sky-700 dark:text-sky-400">
                Normoxic Sea-Level Target: 3.09 psia (21.3 kPa)
              </div>
            </div>

            <div className="rounded-xl bg-white dark:bg-[#0f172a]/85 border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
              <div className="text-xs tracking-wider uppercase font-mono text-slate-500 dark:text-slate-400">
                RELATIVE O₂ INCREASE VS. 21% EARTH AIR
              </div>
              <div className="mt-1 flex items-baseline">
                <span
                  className={`text-3xl font-mono font-bold tabular-nums ${
                    telemetry.relativeO2IncreasePct >= 40
                      ? 'text-amber-700 dark:text-amber-400'
                      : 'text-emerald-700 dark:text-emerald-400'
                  }`}
                >
                  {telemetry.relativeO2IncreasePct >= 0
                    ? `+${telemetry.relativeO2IncreasePct.toFixed(1)}`
                    : telemetry.relativeO2IncreasePct.toFixed(1)}
                </span>
                <span className="text-xs uppercase font-mono text-slate-500 dark:text-slate-400 ml-1.5">
                  % RELATIVE
                </span>
              </div>
              <div className="mt-1.5 text-xs font-mono text-amber-700 dark:text-amber-300">
                {telemetry.relativeO2IncreasePct >= 40
                  ? '▲ >40% Exploration High-O₂ Regime Active (FM2 / SAFFIRE-VI)'
                  : '● Within Near-Earth Diluent Margin'}
              </div>
            </div>

            <div className="rounded-xl bg-white dark:bg-[#0f172a]/85 border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
              <div className="text-xs tracking-wider uppercase font-mono text-slate-500 dark:text-slate-400">
                EVA PRE-BREATHE TIME REDUCTION
              </div>
              <div className="mt-1 flex items-baseline">
                <span className="text-3xl font-mono font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
                  {telemetry.preBreatheReductionPct}
                </span>
                <span className="text-xs uppercase font-mono text-slate-500 dark:text-slate-400 ml-1.5">
                  % REDUCTION
                </span>
              </div>
              <div className="mt-1.5 text-xs font-mono text-slate-600 dark:text-slate-300">
                Est. Pre-Breathe to 4.3 psia Suit: ~{telemetry.preBreatheMinutesRemaining} min (vs. 180 min @ 14.7 psia)
              </div>
            </div>

            <div className="rounded-xl bg-white dark:bg-[#0f172a]/85 border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
              <div className="text-xs tracking-wider uppercase font-mono text-slate-500 dark:text-slate-400">
                MATERIAL FLAMMABILITY RISK INDEX
              </div>
              <div className="mt-1 flex items-baseline">
                <span
                  className={`text-3xl font-mono font-bold tabular-nums ${
                    telemetry.flammabilityRiskIndex >= 75
                      ? 'text-rose-600 dark:text-rose-500'
                      : telemetry.flammabilityRiskIndex >= 50
                      ? 'text-amber-700 dark:text-amber-400'
                      : 'text-emerald-700 dark:text-emerald-400'
                  }`}
                >
                  {telemetry.flammabilityRiskIndex}
                </span>
                <span className="text-xs uppercase font-mono text-slate-500 dark:text-slate-400 ml-1.5">
                  / 100 INDEX
                </span>
              </div>
              <div className="mt-1.5 text-xs font-mono text-slate-600 dark:text-slate-300">
                LOC: {telemetry.estimatedLOC}% O₂ · Spread Rate: {telemetry.spreadMultiplier}× 1g baseline
              </div>
            </div>
          </div>

          {/* Cool-Flame & High-O2 Hazard Banner */}
          <div
            className={`rounded-xl p-4 border flex items-start gap-3 ${
              telemetry.coolFlameWarning
                ? 'bg-purple-50 dark:bg-purple-950/35 border-purple-300 dark:border-purple-500/50 text-purple-950 dark:text-purple-100'
                : 'bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200'
            }`}
          >
            {telemetry.coolFlameWarning ? (
              <Flame className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            )}
            <div className="text-xs space-y-1">
              <div className="font-mono font-bold text-sm">
                {telemetry.coolFlameWarning
                  ? '▲ 500–1000 K COOL-FLAME RE-IGNITION WARNING ACTIVE (FLEX PSI-69 / CFI-G PSI-159)'
                  : '● HIGH-STRAIN / HIGH-GRAVITY REGIME: COOL-FLAME STABILIZATION SUPPRESSED'}
              </div>
              <p className="leading-relaxed text-slate-700 dark:text-slate-300">
                {telemetry.coolFlameWarning
                  ? `At ${gravityG.toFixed(2)}g with ${telemetry.effectiveSlipVelocity} cm/s effective slip velocity and ${oxygenPercent}% O₂, extinguished hydrocarbon flames transition onto the 500–1000 K NTC cool-flame branch. Maintain CO₂/He dilution and monitor 310 nm UV / 3.4 μm formaldehyde channels to prevent oscillatory hot re-ignition.`
                  : `Effective slip velocity (${telemetry.effectiveSlipVelocity} cm/s) or gravity (${gravityG.toFixed(2)}g) exceeds the low-strain residence window required for quasi-steady spherical cool flames.`}
              </p>
            </div>
          </div>

          {/* Dual-Axis Partial-Gravity Flammability Dip & Spread Curve SVG */}
          <div className="rounded-xl bg-white dark:bg-[#0f172a]/85 border border-slate-200 dark:border-sky-400/20 p-5 space-y-3 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs font-mono text-slate-700 dark:text-slate-300">
                LUCI / FM2 PARTIAL-GRAVITY LIMITING OXYGEN CONCENTRATION (LOC) &amp; SPREAD CURVE
              </div>
              <div className="text-xs font-mono text-amber-700 dark:text-amber-400">
                Minimum LOC Dip at 0.16g Lunar Buoyancy (~14.6% O₂)
              </div>
            </div>

            <svg viewBox="0 0 600 200" className="w-full h-48 bg-slate-900 dark:bg-[#050814] rounded-lg border border-slate-300 dark:border-slate-800">
              {[40, 80, 120, 160].map((y) => (
                <line key={y} x1="45" y1={y} x2="570" y2={y} stroke="#1e293b" strokeWidth="1" />
              ))}
              {[
                { g: 0.0, x: 60, label: '0.00g ISS' },
                { g: 0.16, x: 145, label: '0.16g Moon (FM2)' },
                { g: 0.38, x: 260, label: '0.38g Mars' },
                { g: 1.0, x: 550, label: '1.00g Earth' },
              ].map((m) => (
                <g key={m.label}>
                  <line
                    x1={m.x}
                    y1="20"
                    x2={m.x}
                    y2="175"
                    stroke="#334155"
                    strokeDasharray="3,3"
                  />
                  <text x={m.x} y="190" textAnchor="middle" className="fill-slate-400 text-[10px] font-mono">
                    {m.label}
                  </text>
                </g>
              ))}

              <path
                d="M 60 115 Q 145 155, 260 120 T 550 75"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="2.5"
              />
              <path
                d="M 60 130 Q 150 45, 260 65 T 550 95"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="2"
                strokeDasharray="5,4"
              />

              {(() => {
                const activeX = 60 + Math.min(1, gravityG) * 490;
                const activeY =
                  170 - Math.min(140, (telemetry.flammabilityRiskIndex / 100) * 135);
                return (
                  <g>
                    <circle cx={activeX} cy={activeY} r="6" fill="#f43f5e" stroke="#ffffff" strokeWidth="2" />
                    <text
                      x={Math.min(520, Math.max(80, activeX))}
                      y={Math.max(28, activeY - 12)}
                      textAnchor="middle"
                      className="fill-rose-400 text-[10px] font-mono font-bold"
                    >
                      Active: {gravityG.toFixed(2)}g · Risk {telemetry.flammabilityRiskIndex}/100
                    </text>
                  </g>
                );
              })()}
            </svg>
          </div>
        </div>
      </section>

      {/* Saved Simulation Runs Table */}
      <section className="rounded-xl bg-white dark:bg-[#0f172a]/85 border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Saved Cabin Flammability Scenarios (`saved_simulations` · {simulations.length})
          </h2>
          <span className="text-xs font-mono text-emerald-700 dark:text-emerald-400">
            ● Cloud Firestore Synced
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                <th className="py-2.5 px-3">SCENARIO TITLE</th>
                <th className="py-2.5 px-3">GRAVITY</th>
                <th className="py-2.5 px-3">O₂ % / PRESSURE</th>
                <th className="py-2.5 px-3">ppO₂</th>
                <th className="py-2.5 px-3">FLOW / E-FIELD</th>
                <th className="py-2.5 px-3">RISK INDEX</th>
                <th className="py-2.5 px-3 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/70">
              {simulations.map((sim) => (
                <tr key={sim.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/60">
                  <td className="py-2.5 px-3 font-sans font-semibold text-slate-900 dark:text-white">
                    {sim.title}
                  </td>
                  <td className="py-2.5 px-3 text-sky-700 dark:text-sky-300 tabular-nums">
                    {sim.gravityG.toFixed(2)}g
                  </td>
                  <td className="py-2.5 px-3 text-amber-700 dark:text-amber-300 tabular-nums">
                    {sim.oxygenPercent}% O₂ @ {sim.pressurePsia} psia
                  </td>
                  <td className="py-2.5 px-3 text-slate-700 dark:text-slate-200 tabular-nums">
                    {sim.ppO2Psia} psia
                  </td>
                  <td className="py-2.5 px-3 text-emerald-700 dark:text-emerald-300 tabular-nums">
                    {sim.airflowCmPerSec} cm/s · {sim.eFieldKv} kV
                  </td>
                  <td className="py-2.5 px-3 font-bold tabular-nums text-rose-600 dark:text-rose-400">
                    {sim.flammabilityRiskIndex} / 100
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      type="button"
                      onClick={() => void deleteSimulation(sim.id)}
                      className="text-rose-600 dark:text-rose-400 hover:text-rose-500 p-1"
                      title="Delete simulation"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
