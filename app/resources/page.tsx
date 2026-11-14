'use client';

import React, { useState } from 'react';
import {
  ExternalLink,
  AlertOctagon,
  ShieldAlert,
  Award,
  BookOpen,
  Video,
} from 'lucide-react';
import { HISTORICAL_INCIDENTS, NASA_SPINOFFS } from '@/backend/psi-datasets';

export default function ResourcesAndIncidentsPage() {
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>(
    HISTORICAL_INCIDENTS[0].id
  );
  const [spinoffFilter, setSpinoffFilter] = useState<string>('All');

  const activeIncident =
    HISTORICAL_INCIDENTS.find((i) => i.id === selectedIncidentId) || HISTORICAL_INCIDENTS[0];

  const filteredSpinoffs =
    spinoffFilter === 'All'
      ? NASA_SPINOFFS
      : NASA_SPINOFFS.filter((s) => s.category === spinoffFilter);

  return (
    <div className="space-y-10">
      {/* Header */}
      <section className="space-y-2 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="text-xs font-mono text-rose-700 dark:text-rose-400">
          SPACEFLIGHT FIRE FORENSICS · TERRESTRIAL NASA SPIN-OFFS · ARCHIVAL MONOGRAPHS
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white [text-wrap:balance]">
          Historical Spaceflight Fire Incidents &amp; Terrestrial NASA Spin-Off Technologies
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300 max-w-3xl">
          Trace how historical cabin emergencies (Apollo 1, Apollo 13, Space Station Mir, and deep-space cislunar smoke telemetry) shaped modern microgravity combustion research and saved lives on Earth through verified NASA Spin-Off technologies.
        </p>
      </section>

      {/* Section 1: Interactive Timeline of Spaceflight Fire Hazards */}
      <section className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <AlertOctagon className="w-5 h-5 text-rose-600 dark:text-rose-500" />
            <span>01. Interactive Forensic Timeline of Spaceflight Fire Hazards</span>
          </h2>
          <span className="text-xs font-mono text-slate-600 dark:text-slate-400">
            Select an event to inspect root-cause combustion physics &amp; engineering overrides
          </span>
        </div>

        {/* Timeline Selector Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {HISTORICAL_INCIDENTS.map((inc) => {
            const isSelected = inc.id === selectedIncidentId;
            return (
              <button
                key={inc.id}
                type="button"
                onClick={() => setSelectedIncidentId(inc.id)}
                className={`text-left rounded-xl p-4 border transition-all space-y-2 ${
                  isSelected
                    ? 'bg-white dark:bg-[#0f172a] border-rose-600 dark:border-rose-500 shadow-md'
                    : 'bg-white/75 dark:bg-[#0f172a]/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-rose-700 dark:text-rose-400 font-semibold">{inc.date}</span>
                  <span className="text-slate-500 dark:text-slate-400">{inc.gravity}</span>
                </div>
                <div className="text-base font-bold text-slate-900 dark:text-white">{inc.mission}</div>
                <div className="text-xs font-mono text-amber-700 dark:text-amber-300 truncate">
                  {inc.atmosphere}
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Incident Deep Forensic Card */}
        <div className="rounded-xl bg-white dark:bg-[#0f172a]/90 border border-rose-300 dark:border-rose-500/35 p-6 space-y-4 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <div className="text-xs font-mono text-rose-700 dark:text-rose-400">
                {activeIncident.date} · {activeIncident.location} · {activeIncident.severity}
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                {activeIncident.mission}
              </h3>
              <div className="text-xs font-mono text-amber-700 dark:text-amber-300 mt-1">
                Atmosphere: {activeIncident.atmosphere} · Gravity: {activeIncident.gravity}
              </div>
            </div>

            <a
              href={activeIncident.officialUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 text-xs font-mono font-semibold bg-rose-600 hover:bg-rose-500 dark:bg-rose-500 dark:hover:bg-rose-400 text-white dark:text-slate-950 rounded-lg transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              Official NASA Mission Archive
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs sm:text-sm">
            <div className="rounded-lg bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 p-4 space-y-1.5">
              <div className="text-xs font-mono text-slate-500 dark:text-slate-400">INCIDENT SUMMARY</div>
              <p className="text-slate-800 dark:text-slate-200 leading-relaxed">{activeIncident.summary}</p>
            </div>

            <div className="rounded-lg bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 p-4 space-y-1.5">
              <div className="text-xs font-mono text-amber-700 dark:text-amber-400">
                ROOT-CAUSE COMBUSTION PHYSICS
              </div>
              <p className="text-slate-800 dark:text-slate-200 leading-relaxed">
                {activeIncident.rootCausePhysics}
              </p>
            </div>

            <div className="rounded-lg bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 p-4 space-y-1.5">
              <div className="text-xs font-mono text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>MODERN DESIGN &amp; PSI LESSON</span>
              </div>
              <p className="text-slate-800 dark:text-slate-200 leading-relaxed">
                {activeIncident.modernDesignLesson}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Terrestrial Spin-Off Showcase & Official NASA Reference Links */}
      <section className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-sky-600 dark:text-sky-400" />
              <span>02. Verified NASA Terrestrial Fire Safety Spin-Offs &amp; Official Archives</span>
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              How orbital fire prevention, smoke discrimination, and astronaut thermal protection protect firefighters and mines on Earth.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-200/80 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg">
            {[
              'All',
              'Prevention & Thermal Gear',
              'Detection & Sensors',
              'Suppression & Breathing Systems',
              'Video & Archival Guides',
            ].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSpinoffFilter(cat)}
                className={`px-2.5 py-1 text-xs font-mono rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  spinoffFilter === cat
                    ? 'bg-sky-600 text-white dark:bg-sky-500 dark:text-slate-950 font-semibold'
                    : 'text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {cat === 'All' ? 'All Spin-Offs' : cat.split('&')[0].trim()}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSpinoffs.map((spinoff) => (
            <div
              key={spinoff.id}
              className="rounded-xl bg-white dark:bg-[#0f172a]/85 border border-slate-200 dark:border-slate-800 hover:border-sky-400/50 transition-colors p-5 flex flex-col justify-between space-y-4 shadow-sm"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-sky-700 dark:text-sky-400 font-semibold">
                    {spinoff.spinoffCode}
                  </span>
                  <span className="text-emerald-700 dark:text-emerald-400">
                    {spinoff.keyMetric}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">{spinoff.title}</h3>
                <div className="text-xs font-mono text-amber-700 dark:text-amber-300/90">
                  Origin: {spinoff.nasaOrigin}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {spinoff.terrestrialImpact}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                  {spinoff.category}
                </span>
                <a
                  href={spinoff.officialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-mono text-sky-700 dark:text-sky-400 hover:underline inline-flex items-center gap-1"
                >
                  {spinoff.category === 'Video & Archival Guides' ? (
                    spinoff.id === 'sciencecasts-video' ? (
                      <>
                        <Video className="w-3.5 h-3.5" />
                        Watch NASA Video
                      </>
                    ) : (
                      <>
                        <BookOpen className="w-3.5 h-3.5" />
                        Open NASA PDF
                      </>
                    )
                  ) : (
                    <>
                      Official NASA Spinoff
                      <ExternalLink className="w-3 h-3" />
                    </>
                  )}
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
