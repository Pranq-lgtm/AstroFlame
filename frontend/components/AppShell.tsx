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
  Info,
  ExternalLink,
  Bookmark,
} from 'lucide-react';
import {
  PERSONA_LENSES,
  PSI_DATASETS,
  type PersonaRoleId,
} from '@/backend/psi-datasets';
import { useAstroFlame } from '@/frontend/context/astroflame-context';
import AstroFlameLogo from './AstroFlameLogo';
import FirebaseConfigModal from './FirebaseConfigModal';
import SiChatbotDrawer from './SiChatbotDrawer';
import DatasetTelemetryDrawer from './DatasetTelemetryDrawer';

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
    userRole,
    openAuthModal,
    activateDemoSession,
    signOutSession,
    isCopilotOpen,
    setIsCopilotOpen,
    bookmarkedDatasetIds,
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

  const handleScrollToAbout = (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById('about');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const userInitials = (user?.displayName || 'Researcher')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  return (
    <div className="min-h-dvh overflow-x-hidden overflow-y-auto bg-slate-100 text-slate-900 dark:bg-[#050814] dark:text-slate-100 flex flex-col selection:bg-sky-500 selection:text-slate-950 transition-colors duration-200">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-4 px-4 sm:px-6 py-3 bg-white/95 dark:bg-[#060a17]/95 border-b border-slate-200 dark:border-slate-800/90 backdrop-blur-md">
        {/* Zone 1: Watermark-Free AstroFlame Emblem + Gradient Wordmark */}
        <Link href="/" className="shrink-0">
          <AstroFlameLogo size={38} showWordmark />
        </Link>

        {/* Zone 2: Rounded Navigation Pill Bar + Smooth-Scroll About Link */}
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
          <a
            href="#about"
            onClick={handleScrollToAbout}
            className="px-3.5 py-1.5 transition-colors whitespace-nowrap shrink-0 border-b-2 border-transparent hover:text-sky-600 dark:hover:text-sky-300 flex items-center gap-1"
          >
            <Info className="w-3.5 h-3.5" />
            <span>About</span>
          </a>
        </nav>

        {/* Zone 3: Theme Switch + Copilot + Clean User Profile Pill & Auth Trigger */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Light / Dark Mode Switch */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="px-2.5 py-1.5 text-xs font-mono bg-slate-100 dark:bg-[#0b1124] hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden xl:inline">Light</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-sky-600" />
                <span className="hidden xl:inline">Dark</span>
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
            <span className="hidden sm:inline">4Hydrogen Copilot</span>
          </button>

          {/* User Profile Pill */}
          <button
            type="button"
            onClick={() => openAuthModal(isAdmin ? 'admin' : 'user')}
            title="Open User & Admin Authentication Portal"
            className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-[#0b1124] hover:bg-slate-200/80 dark:hover:bg-slate-900 border border-slate-300 dark:border-slate-700 flex items-center gap-2 transition-colors cursor-pointer"
          >
            <span className="w-6 h-6 rounded-full bg-sky-500/20 border border-sky-400/50 text-sky-700 dark:text-sky-300 text-[11px] font-mono font-bold flex items-center justify-center shrink-0">
              {userInitials || 'U'}
            </span>
            <span className="hidden md:flex flex-col items-start leading-tight text-left">
              <span className="text-xs font-semibold text-slate-900 dark:text-white truncate max-w-[130px]">
                {user?.displayName.split('(')[0].trim() || 'Guest Researcher'}
              </span>
              <span className="text-[10px] font-mono text-sky-700 dark:text-sky-400">
                {currentLens.badgeCode} · {userRole}
              </span>
            </span>
          </button>

          {/* Sign In / Sign Out Action */}
          {user && !user.isDemoSession ? (
            <button
              type="button"
              onClick={() => void signOutSession()}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => openAuthModal('user')}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-sky-600 text-white hover:bg-sky-500 dark:bg-sky-400 dark:text-slate-950 dark:hover:bg-sky-300 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </header>

      {/* Secondary Foundation Bar: Active PSI Dataset Selector + Persona Lens + Quick Auth Controls */}
      <div className="bg-white/90 dark:bg-[#080d1d] border-b border-slate-200 dark:border-slate-800/80 px-4 sm:px-6 py-2">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
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
          </div>

          {/* Right: 1-Click Judge Demo User Login + Bookmarks Count + Admin Portal Button */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-1 text-xs font-mono rounded-lg bg-slate-100 dark:bg-[#0b1124] border border-slate-300 dark:border-slate-800 text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
              <Bookmark className="w-3 h-3 fill-current" />
              <span>{bookmarkedDatasetIds.length} Saved</span>
            </span>

            <button
              type="button"
              onClick={activateDemoSession}
              className="px-2.5 py-1 text-xs font-mono font-semibold rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-800 dark:text-amber-300 border border-amber-400/50 transition-colors cursor-pointer"
            >
              1-Click Judge Demo Login
            </button>

            <button
              type="button"
              onClick={() => openAuthModal('user')}
              className="px-2.5 py-1 text-xs font-mono bg-slate-100 dark:bg-[#0b1124] hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-800 rounded-lg flex items-center gap-1.5 cursor-pointer"
            >
              <User className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              <span>User / Role Portal</span>
            </button>

            <button
              type="button"
              onClick={() => openAuthModal('admin')}
              className="px-2.5 py-1 text-xs font-mono bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/70 text-emerald-800 dark:text-emerald-300 border border-emerald-400 dark:border-emerald-600/70 rounded-lg transition-colors flex items-center gap-1.5 font-semibold cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Admin Auth Keys</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Responsive Web Application Workspace with Generous Breathing Room & Safe-Area Clearance */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 md:px-10 py-10 md:py-14 pb-36 md:pb-28 scroll-pb-32">
        {children}

        {/* Isolated & Elevated Global #about Section Above Fixed Nav Bar */}
        <section
          id="about"
          className="relative z-10 mt-16 mb-28 pb-12 scroll-mt-24 rounded-2xl bg-white dark:bg-[#090e21] border border-slate-300 dark:border-slate-800 p-6 md:p-8 shadow-lg space-y-6"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <AstroFlameLogo size={36} showWordmark={false} />
              <div>
                <div className="text-xs font-mono uppercase tracking-wider text-sky-600 dark:text-sky-400">
                  ABOUT ASTROFLAME · 2026 NASA SPACE APPS CHALLENGE
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Flame in Freefall: SI-Powered Fire Safety Insights from Microgravity Combustion Data
                </h2>
              </div>
            </div>

            <a
              href="https://astroflame-ddc5c.web.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white dark:bg-sky-400 dark:text-slate-950 text-xs font-mono font-bold inline-flex items-center gap-1.5 self-start md:self-auto shrink-0"
            >
              <span>Live App: astroflame-ddc5c.web.app</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* 3-Element KPI Cards Inside About Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-xl bg-slate-50 dark:bg-[#050814] border border-slate-200 dark:border-slate-800 p-5 space-y-1.5">
              <div className="text-xs font-mono tracking-wider uppercase text-slate-400">
                GROUNDED PSI ARCHIVES
              </div>
              <div className="text-2xl md:text-3xl font-mono font-bold text-amber-500">
                8 Core + 16 Extended
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Includes CLPS FM2 &amp; Glenn LUCI 0.16g lunar benchmarks.
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 dark:bg-[#050814] border border-slate-200 dark:border-slate-800 p-5 space-y-1.5">
              <div className="text-xs font-mono tracking-wider uppercase text-slate-400">
                SI SYNTHESIS ENGINE
              </div>
              <div className="text-2xl md:text-3xl font-mono font-bold text-sky-400">
                Gemini 4 Hydrogen
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Role-calibrated insights across 5 aerospace researcher personas.
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 dark:bg-[#050814] border border-slate-200 dark:border-slate-800 p-5 space-y-1.5">
              <div className="text-xs font-mono tracking-wider uppercase text-slate-400">
                CLOUD &amp; AUTHENTICATION
              </div>
              <div className="text-2xl md:text-3xl font-mono font-bold text-emerald-400">
                User + Admin RBAC
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Firebase Auth &amp; Cloud Firestore on astroflame-ddc5c.
              </div>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-slate-600 dark:text-slate-400">
            <div>
              Lead Maintainers &amp; Verified Admins: Pranav Kantak (pranavkantak9@gmail.com) &amp; Neela Kantak (neelakantak31@gmail.com)
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <a
                href="https://psi.nasa.gov/physci/repo"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sky-600 dark:text-sky-400 hover:underline inline-flex items-center gap-1"
              >
                <span>NASA PSI Repository</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <a
                href="https://www.nasa.gov/glenn/glenn-expertise-space-exploration/physical-sciences-program/combustion-science/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-600 dark:text-amber-400 hover:underline inline-flex items-center gap-1"
              >
                <span>NASA Glenn Combustion Science</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <a
                href="https://github.com/Pranq-lgtm/AstroFlame"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
              >
                <span>GitHub: Pranq-lgtm/AstroFlame</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </section>

        {/* Explicit Visual Spacer Ensuring #about Clears Fixed Navigation Bar on All Viewports */}
        <div className="h-20 md:h-12 w-full shrink-0" aria-hidden="true" />
      </main>

      {/* Mobile & Tablet Responsive Bottom Navigation Bar */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/95 dark:bg-[#0b1124]/95 border-t border-slate-200 dark:border-slate-800 grid grid-cols-6 items-center px-1 z-30 backdrop-blur-sm"
      >
        {BASE_NAV_ITEMS.map((item) => {
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
              <span className="text-[10px] mt-0.5 truncate max-w-[60px]">
                {item.shortLabel}
              </span>
            </Link>
          );
        })}
        <a
          href="#about"
          onClick={handleScrollToAbout}
          className="flex flex-col items-center justify-center py-1 text-slate-500 dark:text-slate-400 hover:text-sky-400"
        >
          <Info className="w-4 h-4" />
          <span className="text-[10px] mt-0.5 truncate max-w-[60px]">About</span>
        </a>
      </nav>

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-20 lg:bottom-5 right-5 z-50 bg-slate-900 dark:bg-[#0b1124] border border-sky-500/60 text-white px-4 py-2.5 rounded-lg shadow-2xl text-xs font-mono">
          {toastMessage}
        </div>
      )}

      {/* Global Gemini 4 Hydrogen SI Copilot Floating Drawer */}
      <SiChatbotDrawer />

      {/* Slide-Over Dataset Telemetry & Annotation Inspector Drawer */}
      <DatasetTelemetryDrawer />

      {/* Unified User & Admin Authentication Modal */}
      <FirebaseConfigModal />
    </div>
  );
}
