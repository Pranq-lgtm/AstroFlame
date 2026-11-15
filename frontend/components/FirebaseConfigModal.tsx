'use client';

import React, { useState } from 'react';
import {
  X,
  KeyRound,
  CheckCircle2,
  RotateCcw,
  ShieldCheck,
  UserCheck,
  Sparkles,
  Mail,
  Lock,
  UserPlus,
  LogIn,
} from 'lucide-react';
import {
  getActiveFirebaseConfig,
  saveCustomFirebaseConfig,
  type CustomFirebaseCredentials,
} from '@/backend/firebase';
import { PERSONA_LENSES, type PersonaRoleId } from '@/backend/psi-datasets';
import { useAstroFlame, ADMIN_EMAIL } from '@/frontend/context/astroflame-context';

export default function FirebaseConfigModal() {
  const {
    isFirebaseModalOpen,
    setIsFirebaseModalOpen,
    authModalTab,
    setAuthModalTab,
    user,
    isAdmin,
    adminPreviewMode,
    setAdminPreviewMode,
    personaRole,
    setPersonaRole,
    signInGoogle,
    signInEmail,
    signUpEmail,
    activateDemoSession,
    signOutSession,
    triggerToast,
  } = useAstroFlame();

  // Standard User Auth Form State
  const [userMode, setUserMode] = useState<'signin' | 'signup'>('signin');
  const [displayName, setDisplayName] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [selectedPersona, setSelectedPersona] = useState<PersonaRoleId>(personaRole);
  const [submitting, setSubmitting] = useState(false);

  // Admin Firebase Credentials State
  const currentConfig = getActiveFirebaseConfig();
  const [apiKey, setApiKey] = useState(currentConfig.apiKey || '');
  const [authDomain, setAuthDomain] = useState(currentConfig.authDomain || '');
  const [projectId, setProjectId] = useState(currentConfig.projectId || '');
  const [appId, setAppId] = useState(currentConfig.appId || '');
  const [firestoreDatabaseId, setFirestoreDatabaseId] = useState(
    currentConfig.firestoreDatabaseId || ''
  );

  if (!isFirebaseModalOpen) return null;

  const handleUserAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim() || !passwordInput.trim()) {
      triggerToast('Please enter your email and password.');
      return;
    }
    setSubmitting(true);
    try {
      if (userMode === 'signup') {
        await signUpEmail({
          displayName: displayName.trim() || emailInput.split('@')[0],
          email: emailInput.trim(),
          password: passwordInput,
          personaRole: selectedPersona,
        });
      } else {
        await signInEmail(emailInput.trim(), passwordInput);
      }
      setPasswordInput('');
    } finally {
      setSubmitting(false);
    }
  };

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
    triggerToast('Restored default AstroFlame Firebase configuration (astroflame-ddc5c)');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-xl rounded-2xl bg-white dark:bg-[#0b1124] border border-slate-200 dark:border-slate-700 p-6 text-slate-900 dark:text-slate-100 shadow-2xl my-8">
        {/* Modal Header + Role Tab Switcher */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAuthModalTab('user')}
              className={`px-3.5 py-1.5 text-xs font-mono font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                authModalTab === 'user'
                  ? 'bg-sky-600 text-white dark:bg-sky-400 dark:text-slate-950'
                  : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>User Login / Sign Up</span>
            </button>
            <button
              type="button"
              onClick={() => setAuthModalTab('admin')}
              className={`px-3.5 py-1.5 text-xs font-mono font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                authModalTab === 'admin'
                  ? 'bg-emerald-600 text-white dark:bg-emerald-400 dark:text-slate-950'
                  : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin Portal</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsFirebaseModalOpen(false)}
            aria-label="Close Auth Modal"
            className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ================================================================= */}
        {/* TAB 1: STANDARD USER LOGIN / SIGN UP (DEFAULT)                    */}
        {/* ================================================================= */}
        {authModalTab === 'user' ? (
          <div className="mt-5 space-y-5">
            {/* 1-Click Judge / Demo User Login Banner */}
            <div className="p-4 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-300 dark:border-sky-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="text-xs font-mono font-bold text-sky-700 dark:text-sky-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>HACKATHON JUDGE &amp; DEMO EVALUATION</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Test saving custom simulations, SI weight presets &amp; PSI dataset annotations in one click.
                </p>
              </div>
              <button
                type="button"
                onClick={activateDemoSession}
                className="px-4 py-2 text-xs font-mono font-bold rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-sm whitespace-nowrap shrink-0 cursor-pointer"
              >
                Instant Demo User Login
              </button>
            </div>

            {/* Continue with Google Button */}
            <button
              type="button"
              onClick={() => void signInGoogle(undefined, 'user')}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 font-semibold text-xs font-mono flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Continue with Google (Firebase Auth)</span>
            </button>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-200 dark:border-slate-800" />
              <span className="shrink-0 mx-3 text-[11px] font-mono text-slate-400">
                OR EMAIL &amp; PASSWORD
              </span>
              <div className="flex-grow border-t border-slate-200 dark:border-slate-800" />
            </div>

            {/* Toggle between Sign In and Create Researcher Account */}
            <div className="grid grid-cols-2 gap-2 p-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setUserMode('signin')}
                className={`py-1.5 text-xs font-mono rounded-md transition-colors cursor-pointer ${
                  userMode === 'signin'
                    ? 'bg-white dark:bg-[#0b1124] text-sky-600 dark:text-sky-400 font-semibold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setUserMode('signup')}
                className={`py-1.5 text-xs font-mono rounded-md transition-colors cursor-pointer ${
                  userMode === 'signup'
                    ? 'bg-white dark:bg-[#0b1124] text-sky-600 dark:text-sky-400 font-semibold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Create Researcher Account
              </button>
            </div>

            <form onSubmit={handleUserAuthSubmit} className="space-y-3.5">
              {userMode === 'signup' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono text-slate-600 dark:text-slate-400 mb-1">
                      Full Name / Callsign
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Dr. Elena Vance"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-slate-600 dark:text-slate-400 mb-1">
                      Domain Persona / Role Lens
                    </label>
                    <select
                      value={selectedPersona}
                      onChange={(e) => {
                        const nextRole = e.target.value as PersonaRoleId;
                        setSelectedPersona(nextRole);
                        setPersonaRole(nextRole);
                      }}
                      className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-sky-700 dark:text-sky-300 focus:outline-none focus:border-sky-500"
                    >
                      {PERSONA_LENSES.map((lens) => (
                        <option key={lens.id} value={lens.id}>
                          [{lens.badgeCode}] {lens.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    <span>Email Address</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="researcher@grc.nasa.gov"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    <span>Password</span>
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between gap-3">
                <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                  Unlocks custom simulations, SI presets &amp; PSI dataset bookmarks
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-mono font-semibold rounded-lg bg-sky-600 hover:bg-sky-500 text-white dark:bg-sky-400 dark:text-slate-950 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {userMode === 'signup' ? (
                    <>
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Create Researcher Account</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-3.5 h-3.5" />
                      <span>Sign In</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* ================================================================= */
          /* TAB 2: ADMIN PORTAL & FIREBASE CREDENTIALS                        */
          /* ================================================================= */
          <div className="mt-5 space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
                    AUTHORIZED ADMINS: {ADMIN_EMAIL} · neelakantak31@gmail.com
                  </div>
                  <div className="mt-1">
                    <div className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>{user?.displayName || 'Pranav & Neela Kantak'}</span>
                      <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400">
                        · {isAdmin ? 'Admin Role Active' : 'Standard User Role'}
                      </span>
                    </div>
                  </div>
                </div>

                <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-[#050814] border border-slate-300 dark:border-slate-700 cursor-pointer text-xs font-mono">
                  <input
                    type="checkbox"
                    checked={adminPreviewMode}
                    onChange={(e) => setAdminPreviewMode(e.target.checked)}
                    className="rounded border-slate-400 text-emerald-500 focus:ring-emerald-500"
                  />
                  <span>Admin Mode Active</span>
                </label>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => void signInGoogle('pranavkantak9@gmail.com', 'admin')}
                  className="px-3 py-1.5 text-xs font-medium bg-sky-600 hover:bg-sky-500 dark:bg-sky-500 dark:hover:bg-sky-400 text-white dark:text-slate-950 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Admin Sign-In (pranavkantak9)
                </button>
                <button
                  type="button"
                  onClick={() => void signInGoogle('neelakantak31@gmail.com', 'admin')}
                  className="px-3 py-1.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Admin Sign-In (neelakantak31)
                </button>
                <button
                  type="button"
                  onClick={() => void signOutSession()}
                  className="px-3 py-1.5 text-xs font-medium bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-300 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Switch to Standard User
                </button>
              </div>
            </div>

            {/* Custom Firebase Credentials Form */}
            <form onSubmit={handleSaveCustomKeys} className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-emerald-500" />
                  <span>LIVE FIREBASE CREDENTIALS (astroflame-ddc5c)</span>
                </span>
                <button
                  type="button"
                  onClick={handleResetToProvisioned}
                  className="text-xs font-mono text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  Restore Default Config
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
                  firestoreDatabaseId (Leave blank for astroflame-ddc5c default DB)
                </label>
                <input
                  type="text"
                  placeholder="(default)"
                  value={firestoreDatabaseId}
                  onChange={(e) => setFirestoreDatabaseId(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-200 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 font-mono">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Admin-Only Keys · Zero-Trust ABAC</span>
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium text-white dark:text-slate-950 bg-sky-600 hover:bg-sky-500 dark:bg-sky-400 dark:hover:bg-sky-300 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Save Credentials
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
