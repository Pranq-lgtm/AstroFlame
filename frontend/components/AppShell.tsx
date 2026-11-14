'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Flame,
  Database,
  Gauge,
  Cpu,
  History,
  ShieldCheck,
  Sun,
  Moon,
  KeyRound,
  LogIn,
  LogOut,
  User,
  Sparkles,
} from 'lucide-react';
import {
  PERSONA_LENSES,
  PSI_DATASETS,
  type PersonaRoleId,
} from '@/backend/psi-datasets';
import { useAstroFlame, ADMIN_EMAIL } from '@/frontend/context/astroflame-context';
import AstroFlameLogo from './AstroFlameLogo';
import FirebaseConfigModal from './FirebaseConfigModal';
import SiChatbotDrawer from './SiChatbotDrawer';

const BASE_NAV_ITEMS = [
  { href: '/', label: 'Mission Control', shortLabel: 'Mission', icon: Flame },
  { href: '/datasets', label: 'PSI Datasets', shortLabel: 'Datasets', icon: Database },
  { href: '/simulator', label: 'Simulation Arena', shortLabel: 'Simulator', icon: Gauge },
  { href: '/hardware', label: 'ISS Hardware', shortLabel: 'Hardware', icon: Cpu },
  { href: '/resources', label: 'Incidents & Spinoffs', shortLabel: 'Resources', icon: History },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const {
    personaRole,
    setPersonaRole,
    activeDatasetId,
    setActiveDatasetId,
    theme,
    toggleTheme,
    user,
    isAdmin,
    adminPreviewMode,
    setAdminPreviewMode,
    userRole,
    signInGoogle,
    signOutSession,
    setIsFirebaseModalOpen,
    isCopilotOpen,
    setIsCopilotOpen,
    toastMessage,
  } = useAstroFlame();

  // Guard against benign Turbopack HMR client chunk load rejections in proxied preview iframes
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const msg = String(event.reason?.message || event.reason || '');
      if (
        msg.includes('hmr-client') ||
        msg.includes('[turbopack]/browser/dev/hmr-client') ||
        msg.includes('Failed to load chunk')
      ) {
        event.preventDefault();
      }
    };

    const handleError = (event: ErrorEvent) => {
      const msg = String(event.message || event.error?.message || '');
      if (
        msg.includes('hmr-client') ||
        msg.includes('[turbopack]/browser/dev/hmr-client')
      ) {
        event.preventDefault();
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, []);

  const currentLens =
    PERSONA_LENSES.find((p) => p.id === personaRole) || PERSONA_LENSES[0];

  const mobileNavItems = isAdmin
    ? [
        ...BASE_NAV_ITEMS,
        { href: '/cloud', label: 'Admin & Cloud', shortLabel: 'Admin', icon: ShieldCheck },
      ]
    : BASE_NAV_ITEMS;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 dark:bg-[#050814] dark:text-slate-100 flex flex-col selection:bg-sky-500 selection:text-slate-950 transition-colors duration-200">
      {/* Top Bar Matching Dashboard_UI Reference */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-4 px-4 sm:px-6 py-3 bg-white/95 dark:bg-[#060a17]/95 border-b border-slate-200 dark:border-slate-800/90 backdrop-blur-md">
        {/* Zone 1: Watermark-Free AstroFlame Emblem + Gradient Wordmark */}
        <Link href="/" className="shrink-0">
          <AstroFlameLogo size={38} showWordmark />
        </Link>

        {/* Zone 2: Rounded Navigation Pill Bar (Matching Dashboard_UI) */}
        <nav className="hidden lg:flex items-center gap-1 px-4 py-1.5 rounded-xl bg-slate-100 dark:bg-[#0b1124] border border-slate-300/80 dark:border-slate-800 text-sm font-medium text-slate-600 dark:text-slate-300 shadow-inner">
          {BASE_NAV_ITEMS.map((item) => {
            const isActive =
              item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3.5 py-1.5 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                  isActive
                    ? 'text-cyan-600 dark:text-cyan-300 border-cyan-500 dark:border-cyan-400 font-semibold'
                    : 'border-transparent hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          {isAdmin && (
            <Link
              href="/cloud"
              className={`px-3.5 py-1.5 transition-colors whitespace-nowrap shrink-0 border-b-2 flex items-center gap-1.5 ${
                pathname.startsWith('/cloud')
                  ? 'text-emerald-600 dark:text-emerald-300 border-emerald-500 dark:border-emerald-400 font-semibold'
                  : 'border-transparent text-emerald-700 dark:text-emerald-400 hover:text-emerald-500'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Admin &amp; Cloud
            </Link>
          )}
        </nav>

        {/* Zone 3: Light/Dark Theme Switch + Admin/User Account Controls */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Light / Dark Mode Switch */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="px-3 py-1.5 text-xs font-mono bg-slate-100 dark:bg-[#0b1124] hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span>Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-sky-600" />
                <span>Dark Mode</span>
              </>
            )}
          </button>

          {/* SI Copilot (4Hydrogen) Toggle Button */}
          <button
            type="button"
            onClick={() => setIsCopilotOpen(!isCopilotOpen)}
            className="px-3 py-1.5 text-xs font-mono font-semibold bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 dark:hover:bg-sky-900/70 text-sky-800 dark:text-sky-300 border border-sky-400/70 dark:border-sky-500/60 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            <span>4Hydrogen Copilot</span>
          </button>

          {isAdmin && (
            <Link
              href="/cloud"
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                pathname.startsWith('/cloud')
                  ? 'bg-emerald-600 text-white dark:bg-emerald-400 dark:text-slate-950'
                  : 'bg-emerald-600/90 text-white hover:bg-emerald-500 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border dark:border-emerald-500/50'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Admin Panel
            </Link>
          )}

          {user && !user.isDemoSession ? (
            <button
              type="button"
              onClick={() => void signOutSession()}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void signInGoogle()}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-sky-600 text-white hover:bg-sky-500 dark:bg-sky-400 dark:text-slate-950 dark:hover:bg-sky-300 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
            >
              <LogIn className="w-3.5 h-3.5" />
              Google Sign-In
            </button>
          )}
        </div>
      </header>

      {/* Secondary Foundation Bar: Active PSI Dataset Selector + Persona Lens + Admin RBAC Bar */}
      <div className="bg-white/90 dark:bg-[#080d1d] border-b border-slate-200 dark:border-slate-800/80 px-4 sm:px-6 py-2">
        <div className="max-w-[1440px] mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Left: Foundation PSI Dataset Selector + Audience Role Lens */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="text-xs font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                Foundation PSI Dataset:
              </span>
              <select
                aria-label="Foundation NASA PSI Dataset"
                value={activeDatasetId}
                onChange={(e) => setActiveDatasetId(e.target.value)}
                className="px-2.5 py-1 text-xs font-mono bg-slate-50 dark:bg-[#050814] text-amber-700 dark:text-amber-300 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:border-amber-500 cursor-pointer font-semibold"
              >
                {PSI_DATASETS.map((ds) => (
                  <option key={ds.id} value={ds.id}>
                    [{ds.psiId}] {ds.shortTitle} ({ds.pillar})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-xs font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                Role Lens:
              </span>
              <select
                aria-label="Target Audience Persona Lens"
                value={personaRole}
                onChange={(e) => setPersonaRole(e.target.value as PersonaRoleId)}
                className="px-2.5 py-1 text-xs font-mono bg-slate-50 dark:bg-[#050814] text-sky-700 dark:text-sky-300 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:border-sky-500 cursor-pointer"
              >
                {PERSONA_LENSES.map((lens) => (
                  <option key={lens.id} value={lens.id}>
                    [{lens.badgeCode}] {lens.label}
                  </option>
                ))}
              </select>
            </div>
            <span className="hidden 2xl:inline text-xs text-slate-500 dark:text-slate-400 truncate max-w-[320px]">
              {currentLens.priorityFocus}
            </span>
          </div>

          {/* Right: Admin Verification (`pranavkantak9@gmail.com` & `neelakantak31@gmail.com`) & Conditional Auth Keys Trigger */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Admin Access Toggle for pranavkantak9@gmail.com / neelakantak31@gmail.com RBAC */}
            <label className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#0b1124] border border-slate-300 dark:border-slate-800 cursor-pointer text-xs font-mono">
              <input
                type="checkbox"
                checked={adminPreviewMode}
                onChange={(e) => setAdminPreviewMode(e.target.checked)}
                className="rounded border-slate-400 text-emerald-500 focus:ring-emerald-500"
              />
              <span className="text-slate-700 dark:text-slate-300">
                Admin Mode ({ADMIN_EMAIL} / neelakantak31@gmail.com)
              </span>
            </label>

            {isAdmin ? (
              <button
                type="button"
                onClick={() => setIsFirebaseModalOpen(true)}
                className="px-3 py-1 text-xs font-mono bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/70 text-emerald-800 dark:text-emerald-300 border border-emerald-400 dark:border-emerald-600/70 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 font-semibold"
              >
                <KeyRound className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Auth Keys &amp; Cloud Config</span>
              </button>
            ) : (
              <div className="px-2.5 py-1 text-xs font-mono bg-slate-100 dark:bg-[#0b1124] text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-800 rounded-lg flex items-center gap-1.5 whitespace-nowrap shrink-0">
                <User className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                <span>
                  Role: {userRole} ({user ? user.displayName.split('(')[0].trim() : 'Standard User'})
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Responsive Web Application Workspace */}
      <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-6 py-5 pb-20 lg:pb-10">
        {children}
      </main>

      {/* Mobile & Tablet Responsive Bottom Navigation Bar */}
      <nav
        className={`lg:hidden fixed bottom-0 left-0 right-0 h-14 bg-white/95 dark:bg-[#0b1124]/95 border-t border-slate-200 dark:border-slate-800 grid ${
          isAdmin ? 'grid-cols-6' : 'grid-cols-5'
        } items-center px-1 z-30 backdrop-blur-sm`}
      >
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 ${
                isActive
                  ? 'text-sky-600 dark:text-sky-400 font-semibold'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-[10px] mt-0.5 truncate max-w-[64px]">
                {item.shortLabel}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Editorial Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-900 bg-white dark:bg-[#050814] py-4 px-6 text-xs text-slate-600 dark:text-slate-400">
        <div className="max-w-[1440px] mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <AstroFlameLogo size={22} showWordmark={false} />
            <span>
              AstroFlame — 2026 NASA Space Apps Challenge (&ldquo;Flame in Freefall: SI-Powered Fire Safety Insights from Microgravity Combustion Data&rdquo;)
            </span>
          </div>
          <div className="flex items-center gap-3 font-mono">
            <a
              href="https://psi.nasa.gov/physci/repo"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
            >
              NASA PSI Repository
            </a>
            <span aria-hidden="true">·</span>
            <a
              href="https://www.nasa.gov/glenn/glenn-expertise-space-exploration/physical-sciences-program/combustion-science/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
            >
              NASA Glenn Combustion Science
            </a>
          </div>
        </div>
      </footer>

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-16 lg:bottom-5 right-5 z-50 bg-slate-900 dark:bg-[#0b1124] border border-sky-500/60 text-white px-4 py-2.5 rounded-lg shadow-2xl text-xs font-mono">
          {toastMessage}
        </div>
      )}

      {/* Global Gemini 4 Hydrogen SI Copilot Floating Drawer */}
      <SiChatbotDrawer />

      {isAdmin && <FirebaseConfigModal />}
    </div>
  );
}
