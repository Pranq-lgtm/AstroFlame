'use client';

import React, { useState } from 'react';
import { ExternalLink, CheckCircle2, Layers } from 'lucide-react';
import ThreeHardwareRacks, {
  HARDWARE_SUBSYSTEMS,
  type HardwareRackType,
} from '@/frontend/components/ThreeHardwareRacks';
import { PSI_DATASETS } from '@/backend/psi-datasets';

export default function IssHardwareRacksPage() {
  const [activeRack, setActiveRack] = useState<HardwareRackType>('CIR');
  const [selectedSubsystemId, setSelectedSubsystemId] = useState<string>('cir-chamber-100l');

  const activeSubsystem =
    HARDWARE_SUBSYSTEMS.find((s) => s.id === selectedSubsystemId) || HARDWARE_SUBSYSTEMS[0];

  const rackInvestigations = PSI_DATASETS.filter((d) => d.facility === activeRack);

  return (
    <div className="space-y-8">
      {/* Header */}
      <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-1.5 max-w-3xl">
          <div className="text-xs font-mono text-sky-700 dark:text-sky-400">
            ISS DESTINY LABORATORY · ORBITAL COMBUSTION HARDWARE ARCHITECTURE
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white [text-wrap:balance]">
            ISS Hardware Racks &amp; Experimental Rigs (CIR, MDCA &amp; MSG)
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Explore interactive 3D Three.js assemblies of the Combustion Integrated Rack (CIR), Multi-user Droplet Combustion Apparatus (MDCA), and Microgravity Science Glovebox (MSG) flow ducts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 text-xs font-mono shrink-0">
          <a
            href="https://ntrs.nasa.gov/citations/20030112139"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-sky-700 dark:text-sky-400 border border-slate-300 dark:border-slate-700 rounded-lg inline-flex items-center gap-1.5"
          >
            CIR Hardware Spec (NTRS)
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <a
            href="https://gipoc.grc.nasa.gov/wp/fcf-cir/mdca/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-purple-700 dark:text-purple-300 border border-slate-300 dark:border-slate-700 rounded-lg inline-flex items-center gap-1.5"
          >
            Glenn MDCA Portal
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <a
            href="https://ntrs.nasa.gov/api/citations/20090017703/downloads/20090017703.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-amber-700 dark:text-amber-400 border border-slate-300 dark:border-slate-700 rounded-lg inline-flex items-center gap-1.5"
          >
            MSG Flow Duct PDF
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </section>

      {/* Interactive 3D Three.js Hardware Racks Viewport */}
      <section>
        <ThreeHardwareRacks
          activeRack={activeRack}
          onSelectRack={setActiveRack}
          selectedSubsystemId={selectedSubsystemId}
          onSelectSubsystem={setSelectedSubsystemId}
        />
      </section>

      {/* Subsystem Telemetry & Engineering Breakdown */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Selected Subsystem Detail Card (5 cols) */}
        <div className="lg:col-span-5 rounded-xl bg-white dark:bg-[#0f172a]/85 border border-slate-200 dark:border-sky-400/25 p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between text-xs font-mono text-sky-700 dark:text-sky-400">
            <span>ACTIVE SUBSYSTEM TELEMETRY</span>
            <span>{activeSubsystem.code}</span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">{activeSubsystem.name}</h2>
          <div className="text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-amber-700 dark:text-amber-300">
            {activeSubsystem.telemetrySpec}
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {activeSubsystem.description}
          </p>
          <div className="rounded-lg bg-emerald-50 dark:bg-slate-900/80 border border-emerald-200 dark:border-slate-800 p-3.5 space-y-1">
            <div className="text-xs font-mono text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>FIRE SAFETY &amp; CONTAINMENT FUNCTION</span>
            </div>
            <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed">
              {activeSubsystem.safetyFunction}
            </p>
          </div>
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="text-xs font-mono text-slate-500 dark:text-slate-400 mb-1.5">
              SUPPORTED PSI INVESTIGATIONS:
            </div>
            <div className="text-xs font-mono text-sky-700 dark:text-sky-300">
              {activeSubsystem.investigations.join(' · ')}
            </div>
          </div>
        </div>

        {/* Right: All Subsystems & Rack Comparison Matrix (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {HARDWARE_SUBSYSTEMS.map((sub) => {
              const isSelected = sub.id === selectedSubsystemId;
              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => {
                    setActiveRack(sub.rack);
                    setSelectedSubsystemId(sub.id);
                  }}
                  className={`text-left rounded-xl p-4 border transition-all space-y-2 ${
                    isSelected
                      ? 'bg-white dark:bg-[#0f172a] border-sky-600 dark:border-sky-400 shadow-md'
                      : 'bg-white/75 dark:bg-[#0f172a]/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-sky-700 dark:text-sky-400 font-semibold">{sub.rack} RACK</span>
                    <span className="text-slate-500 dark:text-slate-400">{sub.code}</span>
                  </div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">{sub.name}</div>
                  <div className="text-[11px] font-mono text-slate-600 dark:text-slate-400 line-clamp-2">
                    {sub.telemetrySpec}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Investigations Executed in Active Rack */}
          <div className="rounded-xl bg-white dark:bg-[#0f172a]/85 border border-slate-200 dark:border-slate-800 p-5 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                <span>
                  PSI Investigations Flown Inside {activeRack} ({rackInvestigations.length} Datasets)
                </span>
              </h3>
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                ISS USOS Destiny Lab
              </span>
            </div>

            <div className="divide-y divide-slate-200 dark:divide-slate-800/80 text-xs">
              {rackInvestigations.map((inv) => (
                <div key={inv.id} className="py-2.5 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="font-mono text-sky-700 dark:text-sky-400 font-semibold mr-2">
                      {inv.psiId}
                    </span>
                    <span className="font-medium text-slate-900 dark:text-white">{inv.shortTitle}</span>
                    <span className="text-slate-500 dark:text-slate-400 ml-2 font-mono">
                      ({inv.facilityDetail})
                    </span>
                  </div>
                  <a
                    href={inv.officialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-sky-700 dark:text-sky-400 hover:underline inline-flex items-center gap-1"
                  >
                    PSI Archive
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
