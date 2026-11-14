'use client';

import React, { useState } from 'react';
import { X, KeyRound, CheckCircle2, RotateCcw, ShieldCheck } from 'lucide-react';
import {
  getActiveFirebaseConfig,
  saveCustomFirebaseConfig,
  type CustomFirebaseCredentials,
} from '@/backend/firebase';
import { useAstroFlame, ADMIN_EMAIL } from '@/frontend/context/astroflame-context';

export default function FirebaseConfigModal() {
  const {
    isFirebaseModalOpen,
    setIsFirebaseModalOpen,
    user,
    isAdmin,
    adminPreviewMode,
    signInGoogle,
    signOutSession,
    triggerToast,
  } = useAstroFlame();

  const currentConfig = getActiveFirebaseConfig();
  const [apiKey, setApiKey] = useState(currentConfig.apiKey || '');
  const [authDomain, setAuthDomain] = useState(currentConfig.authDomain || '');
  const [projectId, setProjectId] = useState(currentConfig.projectId || '');
  const [appId, setAppId] = useState(currentConfig.appId || '');
  const [firestoreDatabaseId, setFirestoreDatabaseId] = useState(
    currentConfig.firestoreDatabaseId || ''
  );

  if (!isFirebaseModalOpen || !isAdmin) return null;

  const handleSaveCustomKeys = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim() || !projectId.trim() || !appId.trim()) {
      triggerToast('Please provide apiKey, projectId, and appId');
      return;
    }
    const nextConfig: CustomFirebaseCredentials = {
      apiKey: apiKey.trim(),
      authDomain: authDomain.trim() || `${projectId.trim()}.firebaseapp.com`,
      projectId: projectId.trim(),
      appId: appId.trim(),
      firestoreDatabaseId: firestoreDatabaseId.trim() || undefined,
    };
    saveCustomFirebaseConfig(nextConfig);
    triggerToast('Custom Firebase credentials saved.');
    setIsFirebaseModalOpen(false);
  };

  const handleResetToProvisioned = () => {
    saveCustomFirebaseConfig(null);
    const def = getActiveFirebaseConfig();
    setApiKey(def.apiKey);
    setAuthDomain(def.authDomain);
    setProjectId(def.projectId);
    setAppId(def.appId);
    setFirestoreDatabaseId(def.firestoreDatabaseId || '');
    triggerToast('Restored default AstroFlame Firebase configuration');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-xl bg-white dark:bg-[#0b1124] border border-slate-200 dark:border-slate-700 p-6 text-slate-900 dark:text-slate-100 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <KeyRound className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            <h2 className="text-lg font-semibold tracking-tight">
              Admin Firebase Auth Keys &amp; Cloud Firestore Config
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setIsFirebaseModalOpen(false)}
            className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Active Admin Session Panel */}
        <div className="mt-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
                AUTHORIZED ADMINS: {ADMIN_EMAIL} · neelakantak31@gmail.com
              </div>
              <div className="mt-1">
                <div className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>{user?.displayName || 'Pranav & Neela Kantak (Verified Admin)'}</span>
                  <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400">
                    · Admin Role Active
                  </span>
                </div>
                <div className="text-xs font-mono text-slate-600 dark:text-slate-400">
                  {user?.email || ADMIN_EMAIL}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => void signInGoogle('pranavkantak9@gmail.com')}
                className="px-3 py-1.5 text-xs font-medium bg-sky-600 hover:bg-sky-500 dark:bg-sky-500 dark:hover:bg-sky-400 text-white dark:text-slate-950 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                Sign In (pranavkantak9)
              </button>
              <button
                type="button"
                onClick={() => void signInGoogle('neelakantak31@gmail.com')}
                className="px-3 py-1.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                Sign In (neelakantak31)
              </button>
              <button
                type="button"
                onClick={() => void signOutSession()}
                className="px-3 py-1.5 text-xs font-medium bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-300 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                Switch to User
              </button>
            </div>
          </div>
        </div>

        {/* Custom Firebase Credentials Form */}
        <form onSubmit={handleSaveCustomKeys} className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-600 dark:text-slate-400">
              LIVE FIREBASE CREDENTIALS (PROVISIONED OR CUSTOM OVERRIDE)
            </span>
            <button
              type="button"
              onClick={handleResetToProvisioned}
              className="text-xs font-mono text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              Restore Provisioned Config
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono text-slate-600 dark:text-slate-400 mb-1">
                apiKey
              </label>
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-200 focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-600 dark:text-slate-400 mb-1">
                projectId
              </label>
              <input
                type="text"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-200 focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-600 dark:text-slate-400 mb-1">
                authDomain
              </label>
              <input
                type="text"
                value={authDomain}
                onChange={(e) => setAuthDomain(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-200 focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-600 dark:text-slate-400 mb-1">
                appId
              </label>
              <input
                type="text"
                value={appId}
                onChange={(e) => setAppId(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-200 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-600 dark:text-slate-400 mb-1">
              firestoreDatabaseId (Provisioned Enterprise DB ID)
            </label>
            <input
              type="text"
              value={firestoreDatabaseId}
              onChange={(e) => setFirestoreDatabaseId(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-200 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 font-mono">
              <ShieldCheck className="w-4 h-4" />
              <span>Admin-Only Keys ({ADMIN_EMAIL}) · Zero-Trust ABAC</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsFirebaseModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                Close
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-medium text-white dark:text-slate-950 bg-sky-600 hover:bg-sky-500 dark:bg-sky-400 dark:hover:bg-sky-300 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Save Credentials
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
