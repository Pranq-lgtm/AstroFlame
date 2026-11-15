'use client';

import React, { useState } from 'react';
import {
  Download,
  Trash2,
  Plus,
  Copy,
  Check,
  ShieldCheck,
  KeyRound,
  RefreshCw,
  Lock,
  LogIn,
} from 'lucide-react';
import { useAstroFlame, ADMIN_EMAIL } from '@/frontend/context/astroflame-context';
import { PSI_DATASETS } from '@/backend/psi-datasets';

const FIREBASE_TS_SNIPPET = `// backend/firebase.ts — Provisioned Firebase v10 Auth & Enterprise Firestore
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Connection Validation on Boot
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();`;

const FIRESTORE_RULES_SNIPPET = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} { allow read, write: if false; }

    function isSignedIn() { return request.auth != null; }
    function isVerifiedUser() { return isSignedIn() && request.auth.token.email_verified == true; }
    function isAdmin() { return isVerifiedUser() && request.auth.token.email == '${ADMIN_EMAIL}'; }
    function isValidId(id) { return id is string && id.size() >= 1 && id.size() <= 128 && id.matches('^[a-zA-Z0-9_\\\\-]+$'); }

    // Shared researcher read + owner/admin governance
    match /psi_annotations/{annotationId} {
      allow get: if isSignedIn() && isValidId(annotationId) && (isAdmin() || resource.data.authorUid == request.auth.uid || resource.data.visibility == 'research_shared');
      allow list: if isSignedIn() && (isAdmin() || resource.data.authorUid == request.auth.uid || resource.data.visibility == 'research_shared');
      allow create: if isVerifiedUser() && isValidId(annotationId) && request.resource.data.authorUid == request.auth.uid && request.resource.data.createdAt == request.time;
      allow delete: if isVerifiedUser() && isValidId(annotationId) && (resource.data.authorUid == request.auth.uid || isAdmin());
    }
  }
}`;

export default function AdminCloudConsolePage() {
  const {
    user,
    isAdmin,
    userRole,
    setAdminPreviewMode,
    signInGoogle,
    annotations,
    simulations,
    rankings,
    addAnnotation,
    deleteAnnotation,
    addSimulation,
    deleteSimulation,
    addRankingPreset,
    deleteRankingPreset,
    refreshFirestoreCollections,
    setIsFirebaseModalOpen,
    triggerToast,
  } = useAstroFlame();

  const [activeCollection, setActiveCollection] = useState<
    'psi_annotations' | 'saved_simulations' | 'custom_rankings'
  >('psi_annotations');

  const [quickNote, setQuickNote] = useState<string>('');
  const [copiedBlock, setCopiedBlock] = useState<string | null>(null);

  if (!isAdmin) {
    return (
      <div className="max-w-xl mx-auto my-12 rounded-xl bg-white dark:bg-[#0f172a]/90 border border-slate-200 dark:border-slate-800 p-8 text-center space-y-4 shadow-sm">
        <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-500/15 border border-amber-300 dark:border-amber-500/30 flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6 text-amber-700 dark:text-amber-400" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">
          Administrator Access Required
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          The Cloud Console, Firebase Auth Keys, and Security Rules Admin Panel are restricted to{' '}
          <code className="font-mono text-emerald-700 dark:text-emerald-400">{ADMIN_EMAIL}</code> and{' '}
          <code className="font-mono text-emerald-700 dark:text-emerald-400">neelakantak31@gmail.com</code>. Your current role is{' '}
          <strong className="font-mono text-sky-700 dark:text-sky-400">{userRole}</strong>
          {user ? ` (${user.email})` : ''}.
        </p>
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => void signInGoogle('pranavkantak9@gmail.com')}
            className="px-4 py-2.5 text-xs font-semibold bg-sky-600 hover:bg-sky-500 dark:bg-sky-400 dark:hover:bg-sky-300 text-white dark:text-slate-950 rounded-lg transition-colors flex items-center gap-2"
          >
            <LogIn className="w-4 h-4" />
            Sign In (pranavkantak9@gmail.com)
          </button>
          <button
            type="button"
            onClick={() => void signInGoogle('neelakantak31@gmail.com')}
            className="px-4 py-2.5 text-xs font-mono font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            Sign In (neelakantak31@gmail.com)
          </button>
        </div>
      </div>
    );
  }

  const handleCopyCode = (id: string, code: string) => {
    void navigator.clipboard.writeText(code);
    setCopiedBlock(id);
    triggerToast(`Copied ${id} to clipboard`);
    window.setTimeout(() => setCopiedBlock(null), 2000);
  };

  const handleExportJson = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      project: 'AstroFlame — 2026 NASA Space Apps Challenge',
      admin: user?.email || ADMIN_EMAIL,
      collections: {
        psi_annotations: annotations,
        saved_simulations: simulations,
        custom_rankings: rankings,
      },
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `astroflame-firestore-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    triggerToast('Exported all 3 Firestore collections as JSON');
  };

  const handleQuickAddRecord = async () => {
    if (activeCollection === 'psi_annotations') {
      const ds = PSI_DATASETS[0];
      await addAnnotation({
        datasetId: ds.id,
        datasetTitle: ds.shortTitle,
        pillarTag: ds.pillar,
        hypothesisNote:
          quickNote.trim() ||
          'Verified microgravity opposed-flow LOC drop at 1.5 cm/s forced ventilation in MSG duct.',
      });
      setQuickNote('');
    } else if (activeCollection === 'saved_simulations') {
      await addSimulation({
        title: quickNote.trim() || 'Lunar Gateway Airlock Depressurization Check (34% O2 @ 8.2 psia)',
        presetName: 'Lunar Base FM2',
        gravityG: 0.16,
        oxygenPercent: 34,
        pressurePsia: 8.2,
        airflowCmPerSec: 10.5,
        eFieldKv: 2.0,
        ppO2Psia: 2.79,
        flammabilityRiskIndex: 80,
        coolFlameWarning: true,
      });
      setQuickNote('');
    } else {
      await addRankingPreset(
        quickNote.trim() || 'Custom Multi-Attribute Fire Safety Calibration'
      );
      setQuickNote('');
    }
  };

  const handleSeedAllCollections = async () => {
    const ds = PSI_DATASETS[0];
    await addAnnotation({
      datasetId: ds.id,
      datasetTitle: ds.shortTitle,
      pillarTag: ds.pillar,
      hypothesisNote:
        'BASS-II (PSI-25) baseline initialized: forced duct flow cut to 0.0 cm/s extinguishes sheltered PMMA wake flame.',
    });
    await addSimulation({
      title: 'Lunar Gateway 34% O2 @ 8.2 psia Baseline (0.16g)',
      presetName: 'Lunar Surface Habitat (FM2)',
      gravityG: 0.16,
      oxygenPercent: 34,
      pressurePsia: 8.2,
      airflowCmPerSec: 12.0,
      eFieldKv: 0.0,
      ppO2Psia: 2.79,
      flammabilityRiskIndex: 82,
      coolFlameWarning: false,
    });
    await addRankingPreset('NASA GRC Exploration Fire Safety Baseline');
    triggerToast(
      'Initialized psi_annotations, saved_simulations, and custom_rankings collections!'
    );
  };

  return (
    <div className="space-y-8">
      {/* Admin Header */}
      <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-1.5 max-w-3xl">
          <div className="text-xs font-mono text-emerald-700 dark:text-emerald-400">
            ADMIN PANEL · {user?.email} · CLOUD FIRESTORE &amp; ZERO-TRUST ABAC GOVERNANCE
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white [text-wrap:balance]">
            Administrator Cloud Firestore &amp; Auth Keys Console
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Inspect live documents across <code className="font-mono text-sky-700 dark:text-sky-300">psi_annotations</code>,{' '}
            <code className="font-mono text-sky-700 dark:text-sky-300">saved_simulations</code>, and{' '}
            <code className="font-mono text-sky-700 dark:text-sky-300">custom_rankings</code>, manage Firebase credentials, export JSON archives, and review Firestore ABAC rules.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => void handleSeedAllCollections()}
            className="px-3.5 py-2 text-xs font-mono bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Initialize All 3 Collections
          </button>
          <button
            type="button"
            onClick={() => setIsFirebaseModalOpen(true)}
            className="px-3.5 py-2 text-xs font-mono bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-sky-700 dark:text-sky-300 border border-slate-300 dark:border-slate-700 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <KeyRound className="w-3.5 h-3.5" />
            Manage Firebase Keys / Auth
          </button>
          <button
            type="button"
            onClick={handleExportJson}
            className="px-3.5 py-2 text-xs font-mono bg-sky-600 hover:bg-sky-500 dark:bg-sky-400 dark:hover:bg-sky-300 text-white dark:text-slate-950 font-semibold rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            Export JSON
          </button>
        </div>
      </section>

      {/* Section 1: Live Cloud Firestore Collection Explorer */}
      <section className="rounded-xl bg-white dark:bg-[#0f172a]/85 border border-slate-200 dark:border-sky-400/25 p-5 sm:p-6 space-y-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                { id: 'psi_annotations', label: `psi_annotations (${annotations.length})` },
                { id: 'saved_simulations', label: `saved_simulations (${simulations.length})` },
                { id: 'custom_rankings', label: `custom_rankings (${rankings.length})` },
              ] as const
            ).map((col) => (
              <button
                key={col.id}
                type="button"
                onClick={() => setActiveCollection(col.id)}
                className={`px-3.5 py-1.5 text-xs font-mono rounded-lg transition-colors ${
                  activeCollection === col.id
                    ? 'bg-sky-600 text-white dark:bg-sky-500 dark:text-slate-950 font-semibold'
                    : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-800'
                }`}
              >
                {col.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => void refreshFirestoreCollections()}
            className="px-3 py-1.5 text-xs font-mono text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            Sync Cloud Firestore
          </button>
        </div>

        {/* Quick Create Document Bar */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          <input
            type="text"
            value={quickNote}
            onChange={(e) => setQuickNote(e.target.value)}
            placeholder={
              activeCollection === 'psi_annotations'
                ? 'Enter quick hypothesis note to add to psi_annotations...'
                : activeCollection === 'saved_simulations'
                ? 'Enter simulation scenario title to add to saved_simulations...'
                : 'Enter ranking preset title to add to custom_rankings...'
            }
            className="flex-1 px-3.5 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
          />
          <button
            type="button"
            onClick={() => void handleQuickAddRecord()}
            className="px-4 py-2 text-xs font-mono font-semibold bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 rounded-lg transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Document to {activeCollection}
          </button>
        </div>

        {/* Active Collection Document List */}
        <div className="space-y-3">
          {activeCollection === 'psi_annotations' &&
            annotations.map((docItem) => (
              <div
                key={docItem.id}
                className="rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4 flex flex-wrap items-start justify-between gap-4"
              >
                <div className="space-y-1 max-w-3xl">
                  <div className="text-xs font-mono text-sky-700 dark:text-sky-400">
                    docId: {docItem.id} · dataset: {docItem.datasetTitle} · pillar: {docItem.pillarTag} · source: {docItem.source}
                  </div>
                  <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200">{docItem.hypothesisNote}</p>
                  <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    author: {docItem.authorName} ({docItem.personaRole}) · createdAt: {docItem.createdAtIso}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => void deleteAnnotation(docItem.id)}
                  className="px-2.5 py-1.5 text-xs font-mono text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 border border-rose-300 dark:border-rose-500/30 rounded-lg flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>
            ))}

          {activeCollection === 'saved_simulations' &&
            simulations.map((sim) => (
              <div
                key={sim.id}
                className="rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4 flex flex-wrap items-start justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="text-xs font-mono text-amber-700 dark:text-amber-400">
                    docId: {sim.id} · preset: {sim.presetName} · Risk Index: {sim.flammabilityRiskIndex}/100
                  </div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">{sim.title}</div>
                  <div className="text-xs font-mono text-slate-600 dark:text-slate-300">
                    Gravity: {sim.gravityG}g · O₂: {sim.oxygenPercent}% · Pressure: {sim.pressurePsia} psia (ppO₂: {sim.ppO2Psia} psia) · Flow: {sim.airflowCmPerSec} cm/s · E-FIELD: {sim.eFieldKv} kV
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => void deleteSimulation(sim.id)}
                  className="px-2.5 py-1.5 text-xs font-mono text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 border border-rose-300 dark:border-rose-500/30 rounded-lg flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>
            ))}

          {activeCollection === 'custom_rankings' &&
            rankings.map((rk) => (
              <div
                key={rk.id}
                className="rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4 flex flex-wrap items-start justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="text-xs font-mono text-emerald-700 dark:text-emerald-400">
                    docId: {rk.id} · persona: {rk.personaRole} · topDataset: {rk.topRankedDatasetId}
                  </div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">{rk.presetTitle}</div>
                  <div className="text-xs font-mono text-slate-600 dark:text-slate-300">
                    Weights — Crew: {rk.wCrewFlammability}% · High-O₂: {rk.wHighO2Coverage}% · Detect/Suppress: {rk.wDetectionSuppression}% · Partial-G: {rk.wPartialGTransfer}% · Depth: {rk.wDatasetDepth}%
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => void deleteRankingPreset(rk.id)}
                  className="px-2.5 py-1.5 text-xs font-mono text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 border border-rose-300 dark:border-rose-500/30 rounded-lg flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>
            ))}
        </div>
      </section>

      {/* Section 2: Firebase SDK & Security Rules Inspector */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {[
          {
            id: 'firebase.ts',
            subtitle: 'Provisioned SDK + Connection Prober',
            code: FIREBASE_TS_SNIPPET,
          },
          {
            id: 'firestore.rules',
            subtitle: `Zero-Trust ABAC + Admin (${ADMIN_EMAIL})`,
            code: FIRESTORE_RULES_SNIPPET,
          },
        ].map((block) => (
          <div
            key={block.id}
            className="rounded-xl bg-white dark:bg-[#0f172a]/85 border border-slate-200 dark:border-slate-800 p-4 flex flex-col justify-between space-y-3 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-slate-900 dark:text-white font-mono">{block.id}</div>
                <div className="text-xs text-slate-600 dark:text-slate-400">{block.subtitle}</div>
              </div>
              <button
                type="button"
                onClick={() => handleCopyCode(block.id, block.code)}
                className="px-2.5 py-1 text-xs font-mono bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-sky-700 dark:text-sky-400 border border-slate-300 dark:border-slate-700 rounded-md flex items-center gap-1"
              >
                {copiedBlock === block.id ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy
                  </>
                )}
              </button>
            </div>
            <pre className="p-3 rounded-lg bg-slate-900 dark:bg-[#050814] border border-slate-800 text-[11px] font-mono text-slate-200 overflow-x-auto leading-relaxed">
              <code>{block.code}</code>
            </pre>
          </div>
        ))}
      </section>

      {/* Security Rules Advisory Note */}
      <section className="rounded-xl bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 p-4 flex items-center gap-3 text-xs text-slate-700 dark:text-slate-300">
        <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <div>
          <strong className="text-slate-900 dark:text-white">Security &amp; Production Review Note:</strong> The deployed{' '}
          <code className="font-mono text-sky-700 dark:text-sky-300">firestore.rules</code> enforce default-deny catch-all paths, verified email tokens, verified admin RBAC (<code className="font-mono">{ADMIN_EMAIL}</code>), schema key/length bounds from{' '}
          <code className="font-mono text-sky-700 dark:text-sky-300">firebase-blueprint.json</code>, and query-enforced visibility checks. Always review and harden rules further before broad public deployment.
        </div>
      </section>
    </div>
  );
}
