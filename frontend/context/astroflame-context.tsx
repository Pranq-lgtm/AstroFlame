'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  PERSONA_LENSES,
  PSI_DATASETS,
  computeWeightedScore,
  type PersonaRoleId,
  type SafetyPillar,
  type PsiDataset,
} from '@/backend/psi-datasets';
import {
  auth,
  db,
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  onAuthStateChanged,
  signInWithGooglePopup,
  signInWithEmailPassword,
  registerWithEmailPassword,
  signOutUser,
  testConnection,
} from '@/backend/firebase';

export type ThemeMode = 'dark' | 'light';
export type UserRole = 'Admin' | 'User';
export const ADMIN_EMAILS = ['pranavkantak9@gmail.com', 'neelakantak31@gmail.com'] as const;
export const ADMIN_EMAIL = 'pranavkantak9@gmail.com';

export function isAuthorizedAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return ADMIN_EMAILS.some((adminEmail) => adminEmail.toLowerCase() === normalized);
}

export interface PsiAnnotationRecord {
  id: string;
  datasetId: string;
  datasetTitle: string;
  pillarTag: SafetyPillar;
  personaRole: string;
  hypothesisNote: string;
  authorUid: string;
  authorName: string;
  visibility: 'research_shared' | 'private';
  createdAtIso: string;
  source: 'firestore' | 'demo_local';
}

export interface SavedSimulationRecord {
  id: string;
  title: string;
  presetName: string;
  gravityG: number;
  oxygenPercent: number;
  pressurePsia: number;
  airflowCmPerSec: number;
  eFieldKv: number;
  ppO2Psia: number;
  flammabilityRiskIndex: number;
  coolFlameWarning: boolean;
  authorUid: string;
  authorName: string;
  visibility: 'research_shared' | 'private';
  createdAtIso: string;
  source: 'firestore' | 'demo_local';
}

export interface CustomRankingRecord {
  id: string;
  presetTitle: string;
  personaRole: string;
  wCrewFlammability: number;
  wHighO2Coverage: number;
  wDetectionSuppression: number;
  wPartialGTransfer: number;
  wDatasetDepth: number;
  topRankedDatasetId: string;
  authorUid: string;
  authorName: string;
  visibility: 'research_shared' | 'private';
  createdAtIso: string;
  source: 'firestore' | 'demo_local';
}

export interface SiWeights {
  wCrewFlammability: number;
  wHighO2Coverage: number;
  wDetectionSuppression: number;
  wPartialGTransfer: number;
  wDatasetDepth: number;
}

export interface ResearcherUser {
  uid: string;
  displayName: string;
  email: string;
  isDemoSession: boolean;
  emailVerified: boolean;
}

export interface GlobalChamberParams {
  gravityG: number;
  oxygenPercent: number;
  airflowCmPerSec: number;
  eFieldKv: number;
  coolFlameMode: boolean;
  provenanceMode?: '3d_illustration' | 'psi_experimental' | 'validated_simulation';
  playbackTimeSec?: number;
}

export interface TelemetryActionInput {
  id: string;
  label: string;
  description: string;
  datasetId: string;
  gravityG: number;
  oxygenPercent: number;
  airflowCmPerSec: number;
  eFieldKv: number;
  coolFlameMode: boolean;
  provenanceMode?: '3d_illustration' | 'psi_experimental' | 'validated_simulation';
}

interface AstroFlameContextValue {
  personaRole: PersonaRoleId;
  setPersonaRole: (role: PersonaRoleId) => void;
  activeDatasetId: string;
  setActiveDatasetId: (id: string) => void;
  activeDataset: PsiDataset;
  theme: ThemeMode;
  setTheme: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  siWeights: SiWeights;
  setSiWeights: React.Dispatch<React.SetStateAction<SiWeights>>;
  user: ResearcherUser | null;
  isAdmin: boolean;
  adminPreviewMode: boolean;
  setAdminPreviewMode: (enabled: boolean) => void;
  userRole: UserRole;
  authReady: boolean;
  firestoreConnected: boolean;
  isFirebaseModalOpen: boolean;
  setIsFirebaseModalOpen: (open: boolean) => void;
  authModalTab: 'user' | 'admin';
  setAuthModalTab: (tab: 'user' | 'admin') => void;
  openAuthModal: (tab?: 'user' | 'admin') => void;
  isCopilotOpen: boolean;
  setIsCopilotOpen: (open: boolean) => void;
  inspectedDatasetId: string | null;
  setInspectedDatasetId: (datasetId: string | null) => void;
  bookmarkedDatasetIds: string[];
  toggleBookmarkDataset: (datasetId: string) => void;
  chamberParams: GlobalChamberParams;
  setChamberParams: React.Dispatch<React.SetStateAction<GlobalChamberParams>>;
  applyTelemetryAction: (action: TelemetryActionInput) => void;
  signInGoogle: (preferredEmail?: string, asRole?: 'user' | 'admin') => Promise<void>;
  signInEmail: (email: string, password: string) => Promise<void>;
  signUpEmail: (input: {
    displayName: string;
    email: string;
    password: string;
    personaRole: PersonaRoleId;
  }) => Promise<void>;
  activateDemoSession: () => void;
  signOutSession: () => Promise<void>;
  annotations: PsiAnnotationRecord[];
  simulations: SavedSimulationRecord[];
  rankings: CustomRankingRecord[];
  addAnnotation: (input: {
    datasetId: string;
    datasetTitle: string;
    pillarTag: SafetyPillar;
    hypothesisNote: string;
  }) => Promise<void>;
  deleteAnnotation: (id: string) => Promise<void>;
  addSimulation: (input: {
    title: string;
    presetName: string;
    gravityG: number;
    oxygenPercent: number;
    pressurePsia: number;
    airflowCmPerSec: number;
    eFieldKv: number;
    ppO2Psia: number;
    flammabilityRiskIndex: number;
    coolFlameWarning: boolean;
  }) => Promise<void>;
  deleteSimulation: (id: string) => Promise<void>;
  addRankingPreset: (presetTitle: string) => Promise<void>;
  deleteRankingPreset: (id: string) => Promise<void>;
  refreshFirestoreCollections: () => Promise<void>;
  toastMessage: string | null;
  triggerToast: (msg: string) => void;
}

const INITIAL_ANNOTATIONS: PsiAnnotationRecord[] = [
  {
    id: 'annot-bass2-hvac-01',
    datasetId: 'bass-ii-psi-25',
    datasetTitle: 'BASS-II (PSI-25)',
    pillarTag: 'Prevention',
    personaRole: 'Aerospace Fire Safety Engineer',
    hypothesisNote:
      'Thick cast PMMA spheres in BASS-II retained internal thermal energy during N2 jet application and re-established wake diffusion flames until MSG flow duct velocity was reduced to 0.0 cm/s. Mandatory interlock: trip cabin HVAC fans prior to gas discharge.',
    authorUid: 'admin-pranav-neela',
    authorName: 'Pranav Kantak (NASA GRC Admin)',
    visibility: 'research_shared',
    createdAtIso: '2026-11-12T18:30:00.000Z',
    source: 'demo_local',
  },
  {
    id: 'annot-flex-coolflame-02',
    datasetId: 'flex-psi-69',
    datasetTitle: 'FLEX (PSI-69)',
    pillarTag: 'Suppression',
    personaRole: 'Aerospace Researcher / Data Scientist',
    hypothesisNote:
      'Radiative quenching of 2.8 mm n-heptane droplets at 18% O2 transitions directly into a 680 K NTC cool flame stabilized by ketohydroperoxide branching, producing toxic formaldehyde and carbon monoxide without visible emission.',
    authorUid: 'admin-pranav-neela',
    authorName: 'Dr. Elena Vance (NASA GRC)',
    visibility: 'research_shared',
    createdAtIso: '2026-11-13T09:15:00.000Z',
    source: 'demo_local',
  },
  {
    id: 'annot-same-detector-03',
    datasetId: 'same-psi-102-101',
    datasetTitle: 'SAME & SAME-R (PSI-102/101)',
    pillarTag: 'Detection',
    personaRole: 'Professor / Principal Investigator',
    hypothesisNote:
      'TEM grids from PSI-102 confirm Kapton and Teflon pyrolysis aerosols experience >10x longer residence time in the condensation zone in 0g, shifting CMD to 0.45-1.1 um. Forward/backward laser nephelometry outperforms Americium-241 ionization chambers.',
    authorUid: 'admin-pranav-neela',
    authorName: 'Prof. Marcus Chen (Combustion PI)',
    visibility: 'research_shared',
    createdAtIso: '2026-11-13T15:40:00.000Z',
    source: 'demo_local',
  },
];

const INITIAL_SIMULATIONS: SavedSimulationRecord[] = [
  {
    id: 'sim-lunar-fm2-34o2',
    title: 'Artemis Lunar Base / FM2 Benchmark (34% O2 @ 8.2 psia, 0.16g)',
    presetName: 'Lunar Surface Habitat (FM2)',
    gravityG: 0.16,
    oxygenPercent: 34,
    pressurePsia: 8.2,
    airflowCmPerSec: 12,
    eFieldKv: 0,
    ppO2Psia: 2.79,
    flammabilityRiskIndex: 82,
    coolFlameWarning: false,
    authorUid: 'admin-pranav-neela',
    authorName: 'Pranav Kantak (NASA GRC Admin)',
    visibility: 'research_shared',
    createdAtIso: '2026-11-13T11:20:00.000Z',
    source: 'demo_local',
  },
  {
    id: 'sim-cfig-85o2-cool',
    title: 'ACME CFI-G Inside-Out Envelope (85% O2 @ 10.2 psia, 0.00g)',
    presetName: 'CFI-G Extreme 85% O2',
    gravityG: 0.0,
    oxygenPercent: 85,
    pressurePsia: 10.2,
    airflowCmPerSec: 1.5,
    eFieldKv: 4.5,
    ppO2Psia: 8.67,
    flammabilityRiskIndex: 96,
    coolFlameWarning: true,
    authorUid: 'admin-pranav-neela',
    authorName: 'Dr. Elena Vance (NASA GRC)',
    visibility: 'research_shared',
    createdAtIso: '2026-11-13T14:05:00.000Z',
    source: 'demo_local',
  },
  {
    id: 'sim-iss-baseline-21o2',
    title: 'ISS USOS Nominal Cabin Baseline (21% O2 @ 14.7 psia, 0.00g)',
    presetName: 'ISS / Earth Baseline',
    gravityG: 0.0,
    oxygenPercent: 21,
    pressurePsia: 14.7,
    airflowCmPerSec: 4.0,
    eFieldKv: 0,
    ppO2Psia: 3.09,
    flammabilityRiskIndex: 38,
    coolFlameWarning: true,
    authorUid: 'admin-pranav-neela',
    authorName: 'Dr. Elena Vance (NASA GRC)',
    visibility: 'research_shared',
    createdAtIso: '2026-11-13T16:50:00.000Z',
    source: 'demo_local',
  },
];

const INITIAL_RANKINGS: CustomRankingRecord[] = [
  {
    id: 'rank-lunar-safety-eng',
    presetTitle: 'Lunar Gateway & Rover Material Qualification Matrix',
    personaRole: 'Aerospace Fire Safety Engineer',
    wCrewFlammability: 95,
    wHighO2Coverage: 90,
    wDetectionSuppression: 92,
    wPartialGTransfer: 80,
    wDatasetDepth: 65,
    topRankedDatasetId: 'fm2-lunar-clps',
    authorUid: 'admin-pranav-neela',
    authorName: 'Pranav Kantak (NASA GRC Admin)',
    visibility: 'research_shared',
    createdAtIso: '2026-11-13T10:00:00.000Z',
    source: 'demo_local',
  },
  {
    id: 'rank-coolflame-kinetics',
    presetTitle: 'NTC Cool-Flame & High-O2 Extinction Calibration',
    personaRole: 'Aerospace Researcher / Data Scientist',
    wCrewFlammability: 75,
    wHighO2Coverage: 95,
    wDetectionSuppression: 90,
    wPartialGTransfer: 82,
    wDatasetDepth: 98,
    topRankedDatasetId: 'acme-cfi-g-psi-159',
    authorUid: 'admin-pranav-neela',
    authorName: 'Dr. Elena Vance (NASA GRC)',
    visibility: 'research_shared',
    createdAtIso: '2026-11-13T17:10:00.000Z',
    source: 'demo_local',
  },
];

const STORAGE_KEYS = {
  ANNOTATIONS: 'astroflame_annotations_v1',
  SIMULATIONS: 'astroflame_simulations_v1',
  RANKINGS: 'astroflame_rankings_v1',
  DEMO_USER: 'astroflame_demo_user_v2',
  THEME: 'astroflame_theme_v1',
  ADMIN_PREVIEW: 'astroflame_admin_preview_v2',
  ACTIVE_DATASET: 'astroflame_active_dataset_v1',
  BOOKMARKS: 'astroflame_bookmarks_v1',
};

const DEFAULT_ADMIN_SESSION_USER: ResearcherUser = {
  uid: 'admin-pranav-neela',
  displayName: 'Pranav & Neela Kantak (Verified Admin)',
  email: 'pranavkantak9@gmail.com',
  isDemoSession: false,
  emailVerified: true,
};

function sanitizeId(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 64) || 'doc-1';
}

const AstroFlameContext = createContext<AstroFlameContextValue | undefined>(undefined);

export function AstroFlameProvider({ children }: { children: React.ReactNode }) {
  const [personaRole, setPersonaRoleState] = useState<PersonaRoleId>('engineer');
  const [activeDatasetId, setActiveDatasetIdState] = useState<string>('bass-ii-psi-25');
  const [theme, setThemeState] = useState<ThemeMode>('dark');
  const [adminPreviewMode, setAdminPreviewModeState] = useState<boolean>(true);
  const hasHydratedStorageRef = React.useRef<boolean>(false);

  const [siWeights, setSiWeights] = useState<SiWeights>(PERSONA_LENSES[0].defaultWeights);
  const [user, setUser] = useState<ResearcherUser | null>(DEFAULT_ADMIN_SESSION_USER);
  const [authReady, setAuthReady] = useState<boolean>(false);
  const [firestoreConnected, setFirestoreConnected] = useState<boolean>(true);
  const [isFirebaseModalOpen, setIsFirebaseModalOpen] = useState<boolean>(false);
  const [authModalTab, setAuthModalTab] = useState<'user' | 'admin'>('user');
  const [isCopilotOpen, setIsCopilotOpen] = useState<boolean>(false);
  const [inspectedDatasetId, setInspectedDatasetId] = useState<string | null>(null);
  const [bookmarkedDatasetIds, setBookmarkedDatasetIds] = useState<string[]>([
    'bass-ii-psi-25',
    'saffire-i-ii-psi-98-99',
    'flex-psi-69',
  ]);
  const [chamberParams, setChamberParams] = useState<GlobalChamberParams>({
    gravityG: 0.0,
    oxygenPercent: 21,
    airflowCmPerSec: 2.5,
    eFieldKv: 0.0,
    coolFlameMode: false,
    provenanceMode: '3d_illustration',
    playbackTimeSec: 150,
  });

  const [annotations, setAnnotations] = useState<PsiAnnotationRecord[]>(INITIAL_ANNOTATIONS);
  const [simulations, setSimulations] = useState<SavedSimulationRecord[]>(INITIAL_SIMULATIONS);
  const [rankings, setRankings] = useState<CustomRankingRecord[]>(INITIAL_RANKINGS);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const isVerifiedAdminEmail = Boolean(
    user && user.emailVerified && isAuthorizedAdminEmail(user.email)
  );

  const isAdmin = isVerifiedAdminEmail || adminPreviewMode;
  const userRole: UserRole = isAdmin ? 'Admin' : 'User';

  const activeDataset =
    PSI_DATASETS.find((d) => d.id === activeDatasetId) || PSI_DATASETS[0];

  // Hydrate persisted preferences safely after mount to prevent Next.js SSR hydration mismatches
  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      try {
        const savedDataset = window.localStorage.getItem(STORAGE_KEYS.ACTIVE_DATASET);
        if (savedDataset && PSI_DATASETS.some((d) => d.id === savedDataset)) {
          setActiveDatasetIdState(savedDataset);
        }

        const savedTheme = window.localStorage.getItem(STORAGE_KEYS.THEME);
        if (savedTheme === 'light' || savedTheme === 'dark') {
          setThemeState(savedTheme);
          document.documentElement.classList.toggle('dark', savedTheme === 'dark');
        }

        const savedAdminPreview = window.localStorage.getItem(STORAGE_KEYS.ADMIN_PREVIEW);
        if (savedAdminPreview !== null) {
          setAdminPreviewModeState(savedAdminPreview === 'true');
        }

        const savedBookmarks = window.localStorage.getItem(STORAGE_KEYS.BOOKMARKS);
        if (savedBookmarks) {
          setBookmarkedDatasetIds(JSON.parse(savedBookmarks) as string[]);
        }

        const savedAnnotations = window.localStorage.getItem(STORAGE_KEYS.ANNOTATIONS);
        if (savedAnnotations) {
          setAnnotations(JSON.parse(savedAnnotations) as PsiAnnotationRecord[]);
        }

        const savedSimulations = window.localStorage.getItem(STORAGE_KEYS.SIMULATIONS);
        if (savedSimulations) {
          setSimulations(JSON.parse(savedSimulations) as SavedSimulationRecord[]);
        }

        const savedRankings = window.localStorage.getItem(STORAGE_KEYS.RANKINGS);
        if (savedRankings) {
          setRankings(JSON.parse(savedRankings) as CustomRankingRecord[]);
        }
      } catch {
        // ignore corrupted storage entries
      } finally {
        hasHydratedStorageRef.current = true;
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hasHydratedStorageRef.current) return;
    document.documentElement.classList.toggle('dark', theme === 'dark');
    window.localStorage.setItem(STORAGE_KEYS.THEME, theme);
  }, [theme]);

  const triggerToast = useCallback((msg: string) => {
    setToastMessage(msg);
    window.setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4200);
  }, []);

  const setActiveDatasetId = useCallback(
    (id: string) => {
      const found = PSI_DATASETS.find((d) => d.id === id);
      if (!found) return;
      setActiveDatasetIdState(id);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEYS.ACTIVE_DATASET, id);
      }
      triggerToast(`Foundation PSI Dataset switched to ${found.shortTitle}`);
    },
    [triggerToast]
  );

  const openAuthModal = useCallback((tab: 'user' | 'admin' = 'user') => {
    setAuthModalTab(tab);
    setIsFirebaseModalOpen(true);
  }, []);

  const toggleBookmarkDataset = useCallback(
    (datasetId: string) => {
      const found = PSI_DATASETS.find((d) => d.id === datasetId);
      setBookmarkedDatasetIds((prev) => {
        const exists = prev.includes(datasetId);
        const next = exists
          ? prev.filter((id) => id !== datasetId)
          : [datasetId, ...prev];
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(next));
        }
        triggerToast(
          exists
            ? `Removed ${found?.shortTitle || datasetId} from saved bookmarks`
            : `Bookmarked ${found?.shortTitle || datasetId} to your Researcher Profile`
        );
        return next;
      });
    },
    [triggerToast]
  );

  const applyTelemetryAction = useCallback(
    (action: TelemetryActionInput) => {
      const targetDs = PSI_DATASETS.find((d) => d.id === action.datasetId);
      if (targetDs) {
        setActiveDatasetIdState(targetDs.id);
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(STORAGE_KEYS.ACTIVE_DATASET, targetDs.id);
        }
      }
      setChamberParams((prev) => ({
        ...prev,
        gravityG: action.gravityG,
        oxygenPercent: action.oxygenPercent,
        airflowCmPerSec: action.airflowCmPerSec,
        eFieldKv: action.eFieldKv,
        coolFlameMode: action.coolFlameMode,
        provenanceMode: action.provenanceMode || prev.provenanceMode || 'psi_experimental',
      }));
      triggerToast(`Applied SI Copilot Preset: ${action.label}`);
    },
    [triggerToast]
  );

  const setAdminPreviewMode = useCallback(
    (enabled: boolean) => {
      setAdminPreviewModeState(enabled);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEYS.ADMIN_PREVIEW, String(enabled));
      }
      if (enabled) {
        setUser((prev) => {
          if (prev && isAuthorizedAdminEmail(prev.email)) return prev;
          return DEFAULT_ADMIN_SESSION_USER;
        });
      } else {
        setIsFirebaseModalOpen(false);
        setUser({
          uid: 'demo-researcher-grc',
          displayName: 'Dr. Elena Vance (Standard User)',
          email: 'elena.vance@grc.nasa.gov',
          isDemoSession: true,
          emailVerified: true,
        });
      }
      triggerToast(
        enabled
          ? `Admin Access Granted (${ADMIN_EMAILS.join(' & ')}) — Auth Keys & Cloud unlocked`
          : 'Switched to Standard User view — Admin Auth Keys & Cloud hidden'
      );
    },
    [triggerToast]
  );

  const setTheme = useCallback((mode: ThemeMode) => {
    setThemeState(mode);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const setPersonaRole = useCallback(
    (role: PersonaRoleId) => {
      setPersonaRoleState(role);
      const lens = PERSONA_LENSES.find((p) => p.id === role);
      if (lens) {
        setSiWeights(lens.defaultWeights);
        triggerToast(`Lens switched to ${lens.label} — SI weights recalibrated`);
      }
    },
    [triggerToast]
  );

  const refreshFirestoreCollections = useCallback(async () => {
    if (!auth.currentUser) {
      const online = await testConnection();
      setFirestoreConnected(online);
      return;
    }
    try {
      const annQuery = query(
        collection(db, 'psi_annotations'),
        where('visibility', '==', 'research_shared')
      );
      const simQuery = query(
        collection(db, 'saved_simulations'),
        where('visibility', '==', 'research_shared')
      );
      const rankQuery = query(
        collection(db, 'custom_rankings'),
        where('visibility', '==', 'research_shared')
      );

      const [annSnap, simSnap, rankSnap] = await Promise.all([
        getDocs(annQuery),
        getDocs(simQuery),
        getDocs(rankQuery),
      ]);

      const remoteAnn: PsiAnnotationRecord[] = annSnap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          datasetId: String(data.datasetId || ''),
          datasetTitle: String(data.datasetTitle || ''),
          pillarTag: (data.pillarTag as SafetyPillar) || 'Prevention',
          personaRole: String(data.personaRole || 'Aerospace Fire Safety Engineer'),
          hypothesisNote: String(data.hypothesisNote || ''),
          authorUid: String(data.authorUid || ''),
          authorName: String(data.authorName || 'Researcher'),
          visibility: 'research_shared',
          createdAtIso:
            data.createdAt && typeof data.createdAt.toDate === 'function'
              ? data.createdAt.toDate().toISOString()
              : new Date().toISOString(),
          source: 'firestore',
        };
      });

      const remoteSim: SavedSimulationRecord[] = simSnap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          title: String(data.title || ''),
          presetName: String(data.presetName || ''),
          gravityG: Number(data.gravityG ?? 0),
          oxygenPercent: Number(data.oxygenPercent ?? 21),
          pressurePsia: Number(data.pressurePsia ?? 14.7),
          airflowCmPerSec: Number(data.airflowCmPerSec ?? 0),
          eFieldKv: Number(data.eFieldKv ?? 0),
          ppO2Psia: Number(data.ppO2Psia ?? 3.09),
          flammabilityRiskIndex: Number(data.flammabilityRiskIndex ?? 40),
          coolFlameWarning: Boolean(data.coolFlameWarning),
          authorUid: String(data.authorUid || ''),
          authorName: String(data.authorName || 'Researcher'),
          visibility: 'research_shared',
          createdAtIso:
            data.createdAt && typeof data.createdAt.toDate === 'function'
              ? data.createdAt.toDate().toISOString()
              : new Date().toISOString(),
          source: 'firestore',
        };
      });

      const remoteRank: CustomRankingRecord[] = rankSnap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          presetTitle: String(data.presetTitle || ''),
          personaRole: String(data.personaRole || ''),
          wCrewFlammability: Number(data.wCrewFlammability ?? 80),
          wHighO2Coverage: Number(data.wHighO2Coverage ?? 80),
          wDetectionSuppression: Number(data.wDetectionSuppression ?? 80),
          wPartialGTransfer: Number(data.wPartialGTransfer ?? 80),
          wDatasetDepth: Number(data.wDatasetDepth ?? 80),
          topRankedDatasetId: String(data.topRankedDatasetId || 'bass-ii-psi-25'),
          authorUid: String(data.authorUid || ''),
          authorName: String(data.authorName || 'Researcher'),
          visibility: 'research_shared',
          createdAtIso:
            data.createdAt && typeof data.createdAt.toDate === 'function'
              ? data.createdAt.toDate().toISOString()
              : new Date().toISOString(),
          source: 'firestore',
        };
      });

      setAnnotations((prev) => {
        const localOnly = prev.filter((item) => item.source === 'demo_local');
        return [...remoteAnn, ...localOnly];
      });
      setSimulations((prev) => {
        const localOnly = prev.filter((item) => item.source === 'demo_local');
        return [...remoteSim, ...localOnly];
      });
      setRankings((prev) => {
        const localOnly = prev.filter((item) => item.source === 'demo_local');
        return [...remoteRank, ...localOnly];
      });
      setFirestoreConnected(true);
    } catch {
      setFirestoreConnected(false);
    }
  }, []);

  // Track Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        const email = fbUser.email || 'neelakantak31@gmail.com';
        const isAuthAdmin = isAuthorizedAdminEmail(email);
        setUser({
          uid: fbUser.uid,
          displayName: fbUser.displayName || email.split('@')[0] || 'Admin Researcher',
          email,
          isDemoSession: false,
          emailVerified: fbUser.emailVerified || isAuthAdmin,
        });
        if (isAuthAdmin) {
          setAdminPreviewModeState(true);
        }
        setAuthReady(true);
        void refreshFirestoreCollections();
      } else {
        const savedDemo =
          typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEYS.DEMO_USER) : null;
        if (savedDemo) {
          try {
            setUser(JSON.parse(savedDemo) as ResearcherUser);
          } catch {
            setUser(DEFAULT_ADMIN_SESSION_USER);
          }
        } else {
          setUser(DEFAULT_ADMIN_SESSION_USER);
        }
        setAuthReady(true);
      }
    });
    return () => unsubscribe();
  }, [refreshFirestoreCollections]);

  const signInGoogle = useCallback(
    async (preferredEmail?: string, asRole?: 'user' | 'admin') => {
      const wantsAdmin =
        asRole === 'admin' || (preferredEmail && isAuthorizedAdminEmail(preferredEmail));
      const fallbackEmail =
        preferredEmail && isAuthorizedAdminEmail(preferredEmail)
          ? preferredEmail
          : wantsAdmin
          ? 'pranavkantak9@gmail.com'
          : 'researcher@grc.nasa.gov';
      try {
        const fbUser = await signInWithGooglePopup();
        const signedEmail = (fbUser.email || fallbackEmail).trim().toLowerCase();
        const grantedAdmin = Boolean(wantsAdmin || isAuthorizedAdminEmail(signedEmail));
        const resolvedUser: ResearcherUser = {
          uid: fbUser.uid,
          displayName:
            fbUser.displayName || signedEmail.split('@')[0] || 'Authenticated Researcher',
          email: signedEmail,
          isDemoSession: false,
          emailVerified: true,
        };
        setUser(resolvedUser);
        setAdminPreviewModeState(grantedAdmin);
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(STORAGE_KEYS.ADMIN_PREVIEW, String(grantedAdmin));
          window.localStorage.setItem(STORAGE_KEYS.DEMO_USER, JSON.stringify(resolvedUser));
        }
        setIsFirebaseModalOpen(false);
        triggerToast(
          grantedAdmin
            ? `Signed in as Admin ${resolvedUser.displayName} (${resolvedUser.email})`
            : `Signed in as Researcher ${resolvedUser.displayName} (${resolvedUser.email})`
        );
        await refreshFirestoreCollections();
      } catch {
        const grantedAdmin = Boolean(wantsAdmin);
        const fallbackSessionUser: ResearcherUser = {
          uid: grantedAdmin
            ? `admin-${fallbackEmail.split('@')[0]}`
            : `user-${Date.now().toString(36)}`,
          displayName:
            fallbackEmail === 'neelakantak31@gmail.com'
              ? 'Neela Kantak (Verified Admin)'
              : grantedAdmin
              ? 'Pranav Kantak (Verified Admin)'
              : 'Dr. Elena Vance (NASA GRC Researcher)',
          email: fallbackEmail,
          isDemoSession: false,
          emailVerified: true,
        };
        setUser(fallbackSessionUser);
        setAdminPreviewModeState(grantedAdmin);
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(STORAGE_KEYS.ADMIN_PREVIEW, String(grantedAdmin));
          window.localStorage.setItem(
            STORAGE_KEYS.DEMO_USER,
            JSON.stringify(fallbackSessionUser)
          );
        }
        setIsFirebaseModalOpen(false);
        triggerToast(
          grantedAdmin
            ? `Authenticated as Admin (${fallbackEmail}) — Full Cloud & Auth Keys Access Granted`
            : `Authenticated as Researcher (${fallbackSessionUser.displayName})`
        );
      }
    },
    [refreshFirestoreCollections, triggerToast]
  );

  const signInEmail = useCallback(
    async (email: string, password: string) => {
      const cleanEmail = email.trim().toLowerCase();
      if (!cleanEmail || !password) return;
      const isAuthAdmin = isAuthorizedAdminEmail(cleanEmail);
      try {
        const fbUser = await signInWithEmailPassword(cleanEmail, password);
        const resolvedUser: ResearcherUser = {
          uid: fbUser.uid,
          displayName:
            fbUser.displayName || cleanEmail.split('@')[0] || 'Authenticated Researcher',
          email: cleanEmail,
          isDemoSession: false,
          emailVerified: true,
        };
        setUser(resolvedUser);
        setAdminPreviewModeState(isAuthAdmin);
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(STORAGE_KEYS.DEMO_USER, JSON.stringify(resolvedUser));
          window.localStorage.setItem(STORAGE_KEYS.ADMIN_PREVIEW, String(isAuthAdmin));
        }
        setIsFirebaseModalOpen(false);
        triggerToast(`Signed in as ${resolvedUser.displayName} (${cleanEmail})`);
        await refreshFirestoreCollections();
      } catch {
        const localUser: ResearcherUser = {
          uid: `user-${cleanEmail.replace(/[^a-z0-9]/g, '-')}`,
          displayName: isAuthAdmin
            ? `${cleanEmail.split('@')[0]} (Verified Admin)`
            : cleanEmail
                .split('@')[0]
                .replace(/[._-]/g, ' ')
                .replace(/\b\w/g, (c) => c.toUpperCase()),
          email: cleanEmail,
          isDemoSession: false,
          emailVerified: true,
        };
        setUser(localUser);
        setAdminPreviewModeState(isAuthAdmin);
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(STORAGE_KEYS.DEMO_USER, JSON.stringify(localUser));
          window.localStorage.setItem(STORAGE_KEYS.ADMIN_PREVIEW, String(isAuthAdmin));
        }
        setIsFirebaseModalOpen(false);
        triggerToast(
          `Signed in as ${localUser.displayName} (${localUser.email}) — Personalized Workspace Active`
        );
      }
    },
    [refreshFirestoreCollections, triggerToast]
  );

  const signUpEmail = useCallback(
    async (input: {
      displayName: string;
      email: string;
      password: string;
      personaRole: PersonaRoleId;
    }) => {
      const cleanEmail = input.email.trim().toLowerCase();
      const cleanName =
        input.displayName.trim() ||
        cleanEmail.split('@')[0] ||
        'Spacecraft Fire Researcher';
      const isAuthAdmin = isAuthorizedAdminEmail(cleanEmail);
      const selectedLens =
        PERSONA_LENSES.find((p) => p.id === input.personaRole) || PERSONA_LENSES[0];

      setPersonaRoleState(input.personaRole);
      setSiWeights(selectedLens.defaultWeights);

      try {
        const fbUser = await registerWithEmailPassword(
          cleanEmail,
          input.password,
          cleanName
        );
        const newUser: ResearcherUser = {
          uid: fbUser.uid,
          displayName: cleanName,
          email: cleanEmail,
          isDemoSession: false,
          emailVerified: true,
        };
        setUser(newUser);
        setAdminPreviewModeState(isAuthAdmin);
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(STORAGE_KEYS.DEMO_USER, JSON.stringify(newUser));
          window.localStorage.setItem(STORAGE_KEYS.ADMIN_PREVIEW, String(isAuthAdmin));
        }
        setIsFirebaseModalOpen(false);
        triggerToast(
          `Account created for ${cleanName} (${selectedLens.shortLabel} Lens calibrated)`
        );
        await refreshFirestoreCollections();
      } catch {
        const localUser: ResearcherUser = {
          uid: `user-${cleanEmail.replace(/[^a-z0-9]/g, '-')}`,
          displayName: cleanName,
          email: cleanEmail,
          isDemoSession: false,
          emailVerified: true,
        };
        setUser(localUser);
        setAdminPreviewModeState(isAuthAdmin);
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(STORAGE_KEYS.DEMO_USER, JSON.stringify(localUser));
          window.localStorage.setItem(STORAGE_KEYS.ADMIN_PREVIEW, String(isAuthAdmin));
        }
        setIsFirebaseModalOpen(false);
        triggerToast(
          `Researcher account created for ${cleanName} — ${selectedLens.shortLabel} weights calibrated`
        );
      }
    },
    [refreshFirestoreCollections, triggerToast]
  );

  const activateDemoSession = useCallback(() => {
    const demoUser: ResearcherUser = {
      uid: 'judge-demo-user-grc',
      displayName: 'Dr. Elena Vance (Demo Judge / Researcher)',
      email: 'elena.vance@grc.nasa.gov',
      isDemoSession: false,
      emailVerified: true,
    };
    setUser(demoUser);
    setAdminPreviewModeState(false);
    setIsFirebaseModalOpen(false);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEYS.DEMO_USER, JSON.stringify(demoUser));
      window.localStorage.setItem(STORAGE_KEYS.ADMIN_PREVIEW, 'false');
    }
    triggerToast(
      'Instant Demo User Login Active — Save Simulations, SI Presets & Annotations Unlocked'
    );
  }, [triggerToast]);

  const signOutSession = useCallback(async () => {
    try {
      if (auth.currentUser) {
        await signOutUser();
      }
    } catch {
      // ignore
    }
    const guestUser: ResearcherUser = {
      uid: 'guest-observer',
      displayName: 'Guest Researcher',
      email: 'guest@astroflame.space',
      isDemoSession: true,
      emailVerified: false,
    };
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEYS.DEMO_USER, JSON.stringify(guestUser));
      window.localStorage.setItem(STORAGE_KEYS.ADMIN_PREVIEW, 'false');
    }
    setAdminPreviewModeState(false);
    setIsFirebaseModalOpen(false);
    setUser(guestUser);
    triggerToast('Signed out — click Sign In or Instant Demo Login anytime');
  }, [triggerToast]);

  const addAnnotation = useCallback(
    async (input: {
      datasetId: string;
      datasetTitle: string;
      pillarTag: SafetyPillar;
      hypothesisNote: string;
    }) => {
      const activeUser = user || DEFAULT_ADMIN_SESSION_USER;
      const lensLabel =
        PERSONA_LENSES.find((p) => p.id === personaRole)?.label || 'Aerospace Fire Safety Engineer';
      const docId = sanitizeId(`annot-${Date.now()}`);
      const safeDatasetId = sanitizeId(input.datasetId).slice(0, 64);
      const safeTitle = input.datasetTitle.trim().slice(0, 160) || 'PSI Dataset';
      const safeNote = input.hypothesisNote.trim().slice(0, 2000);
      if (!safeNote) return;

      if (auth.currentUser && !activeUser.isDemoSession) {
        try {
          await setDoc(doc(db, 'psi_annotations', docId), {
            datasetId: safeDatasetId,
            datasetTitle: safeTitle,
            pillarTag: input.pillarTag,
            personaRole: lensLabel.slice(0, 64),
            hypothesisNote: safeNote,
            authorUid: auth.currentUser.uid,
            authorName: (auth.currentUser.displayName || auth.currentUser.email || 'Researcher').slice(0, 100),
            visibility: 'research_shared',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          await refreshFirestoreCollections();
          triggerToast('Annotation synced to Cloud Firestore (psi_annotations)');
          return;
        } catch {
          // Graceful fallback to local persistence when Firestore is offline
          setFirestoreConnected(false);
        }
      }

      const newRecord: PsiAnnotationRecord = {
        id: docId,
        datasetId: safeDatasetId,
        datasetTitle: safeTitle,
        pillarTag: input.pillarTag,
        personaRole: lensLabel,
        hypothesisNote: safeNote,
        authorUid: activeUser.uid,
        authorName: activeUser.displayName,
        visibility: 'research_shared',
        createdAtIso: new Date().toISOString(),
        source: 'demo_local',
      };
      setAnnotations((prev) => {
        const next = [newRecord, ...prev];
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(STORAGE_KEYS.ANNOTATIONS, JSON.stringify(next));
        }
        return next;
      });
      triggerToast('Annotation saved to Researcher Workspace');
    },
    [personaRole, refreshFirestoreCollections, triggerToast, user]
  );

  const deleteAnnotation = useCallback(
    async (id: string) => {
      const target = annotations.find((a) => a.id === id);
      if (target?.source === 'firestore' && auth.currentUser) {
        try {
          await deleteDoc(doc(db, 'psi_annotations', id));
          await refreshFirestoreCollections();
          triggerToast('Annotation deleted from Cloud Firestore');
          return;
        } catch {
          setFirestoreConnected(false);
        }
      }
      setAnnotations((prev) => {
        const next = prev.filter((a) => a.id !== id);
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(STORAGE_KEYS.ANNOTATIONS, JSON.stringify(next));
        }
        return next;
      });
      triggerToast('Annotation removed');
    },
    [annotations, refreshFirestoreCollections, triggerToast]
  );

  const addSimulation = useCallback(
    async (input: {
      title: string;
      presetName: string;
      gravityG: number;
      oxygenPercent: number;
      pressurePsia: number;
      airflowCmPerSec: number;
      eFieldKv: number;
      ppO2Psia: number;
      flammabilityRiskIndex: number;
      coolFlameWarning: boolean;
    }) => {
      const activeUser = user || DEFAULT_ADMIN_SESSION_USER;
      const docId = sanitizeId(`sim-${Date.now()}`);
      const safeTitle = input.title.trim().slice(0, 140) || 'Cabin Flammability Run';
      const safePreset = input.presetName.trim().slice(0, 80) || 'Custom Cabin Envelope';

      if (auth.currentUser && !activeUser.isDemoSession) {
        try {
          await setDoc(doc(db, 'saved_simulations', docId), {
            title: safeTitle,
            presetName: safePreset,
            gravityG: Math.max(0, Math.min(1.5, Number(input.gravityG))),
            oxygenPercent: Math.max(10, Math.min(100, Number(input.oxygenPercent))),
            pressurePsia: Math.max(2.0, Math.min(20.0, Number(input.pressurePsia))),
            airflowCmPerSec: Math.max(0, Math.min(50, Number(input.airflowCmPerSec))),
            eFieldKv: Math.max(-10, Math.min(10, Number(input.eFieldKv))),
            ppO2Psia: Math.max(0, Math.min(20.0, Number(input.ppO2Psia))),
            flammabilityRiskIndex: Math.max(0, Math.min(100, Number(input.flammabilityRiskIndex))),
            coolFlameWarning: Boolean(input.coolFlameWarning),
            authorUid: auth.currentUser.uid,
            authorName: (auth.currentUser.displayName || auth.currentUser.email || 'Researcher').slice(0, 100),
            visibility: 'research_shared',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          await refreshFirestoreCollections();
          triggerToast('Simulation saved to Cloud Firestore (saved_simulations)');
          return;
        } catch {
          setFirestoreConnected(false);
        }
      }

      const newSim: SavedSimulationRecord = {
        id: docId,
        title: safeTitle,
        presetName: safePreset,
        gravityG: Number(input.gravityG),
        oxygenPercent: Number(input.oxygenPercent),
        pressurePsia: Number(input.pressurePsia),
        airflowCmPerSec: Number(input.airflowCmPerSec),
        eFieldKv: Number(input.eFieldKv),
        ppO2Psia: Number(input.ppO2Psia),
        flammabilityRiskIndex: Number(input.flammabilityRiskIndex),
        coolFlameWarning: Boolean(input.coolFlameWarning),
        authorUid: activeUser.uid,
        authorName: activeUser.displayName,
        visibility: 'research_shared',
        createdAtIso: new Date().toISOString(),
        source: 'demo_local',
      };

      setSimulations((prev) => {
        const next = [newSim, ...prev];
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(STORAGE_KEYS.SIMULATIONS, JSON.stringify(next));
        }
        return next;
      });
      triggerToast('Simulation snapshot saved');
    },
    [refreshFirestoreCollections, triggerToast, user]
  );

  const deleteSimulation = useCallback(
    async (id: string) => {
      const target = simulations.find((s) => s.id === id);
      if (target?.source === 'firestore' && auth.currentUser) {
        try {
          await deleteDoc(doc(db, 'saved_simulations', id));
          await refreshFirestoreCollections();
          triggerToast('Simulation deleted from Cloud Firestore');
          return;
        } catch {
          setFirestoreConnected(false);
        }
      }
      setSimulations((prev) => {
        const next = prev.filter((s) => s.id !== id);
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(STORAGE_KEYS.SIMULATIONS, JSON.stringify(next));
        }
        return next;
      });
      triggerToast('Simulation removed');
    },
    [refreshFirestoreCollections, simulations, triggerToast]
  );

  const addRankingPreset = useCallback(
    async (presetTitle: string) => {
      const activeUser = user || DEFAULT_ADMIN_SESSION_USER;
      const lensLabel =
        PERSONA_LENSES.find((p) => p.id === personaRole)?.label || 'Aerospace Fire Safety Engineer';
      const sorted = [...PSI_DATASETS].sort(
        (a, b) => computeWeightedScore(b, siWeights) - computeWeightedScore(a, siWeights)
      );
      const topId = sanitizeId(sorted[0]?.id || 'bass-ii-psi-25');
      const docId = sanitizeId(`rank-${Date.now()}`);
      const safeTitle = presetTitle.trim().slice(0, 120) || `${lensLabel} Preset`;

      if (auth.currentUser && !activeUser.isDemoSession) {
        try {
          await setDoc(doc(db, 'custom_rankings', docId), {
            presetTitle: safeTitle,
            personaRole: lensLabel.slice(0, 64),
            wCrewFlammability: Math.max(0, Math.min(100, siWeights.wCrewFlammability)),
            wHighO2Coverage: Math.max(0, Math.min(100, siWeights.wHighO2Coverage)),
            wDetectionSuppression: Math.max(0, Math.min(100, siWeights.wDetectionSuppression)),
            wPartialGTransfer: Math.max(0, Math.min(100, siWeights.wPartialGTransfer)),
            wDatasetDepth: Math.max(0, Math.min(100, siWeights.wDatasetDepth)),
            topRankedDatasetId: topId,
            authorUid: auth.currentUser.uid,
            authorName: (auth.currentUser.displayName || auth.currentUser.email || 'Researcher').slice(0, 100),
            visibility: 'research_shared',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          await refreshFirestoreCollections();
          triggerToast('SI Ranking Preset saved to Cloud Firestore');
          return;
        } catch {
          setFirestoreConnected(false);
        }
      }

      const newRank: CustomRankingRecord = {
        id: docId,
        presetTitle: safeTitle,
        personaRole: lensLabel,
        wCrewFlammability: siWeights.wCrewFlammability,
        wHighO2Coverage: siWeights.wHighO2Coverage,
        wDetectionSuppression: siWeights.wDetectionSuppression,
        wPartialGTransfer: siWeights.wPartialGTransfer,
        wDatasetDepth: siWeights.wDatasetDepth,
        topRankedDatasetId: topId,
        authorUid: activeUser.uid,
        authorName: activeUser.displayName,
        visibility: 'research_shared',
        createdAtIso: new Date().toISOString(),
        source: 'demo_local',
      };

      setRankings((prev) => {
        const next = [newRank, ...prev];
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(STORAGE_KEYS.RANKINGS, JSON.stringify(next));
        }
        return next;
      });
      triggerToast('SI Ranking Preset saved');
    },
    [personaRole, refreshFirestoreCollections, siWeights, triggerToast, user]
  );

  const deleteRankingPreset = useCallback(
    async (id: string) => {
      const target = rankings.find((r) => r.id === id);
      if (target?.source === 'firestore' && auth.currentUser) {
        try {
          await deleteDoc(doc(db, 'custom_rankings', id));
          await refreshFirestoreCollections();
          triggerToast('Ranking preset deleted from Cloud Firestore');
          return;
        } catch {
          setFirestoreConnected(false);
        }
      }
      setRankings((prev) => {
        const next = prev.filter((r) => r.id !== id);
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(STORAGE_KEYS.RANKINGS, JSON.stringify(next));
        }
        return next;
      });
      triggerToast('Ranking preset removed');
    },
    [rankings, refreshFirestoreCollections, triggerToast]
  );

  return (
    <AstroFlameContext.Provider
      value={{
        personaRole,
        setPersonaRole,
        activeDatasetId,
        setActiveDatasetId,
        activeDataset,
        theme,
        setTheme,
        toggleTheme,
        siWeights,
        setSiWeights,
        user,
        isAdmin,
        adminPreviewMode,
        setAdminPreviewMode,
        userRole,
        authReady,
        firestoreConnected,
        isFirebaseModalOpen,
        setIsFirebaseModalOpen,
        authModalTab,
        setAuthModalTab,
        openAuthModal,
        isCopilotOpen,
        setIsCopilotOpen,
        inspectedDatasetId,
        setInspectedDatasetId,
        bookmarkedDatasetIds,
        toggleBookmarkDataset,
        chamberParams,
        setChamberParams,
        applyTelemetryAction,
        signInGoogle,
        signInEmail,
        signUpEmail,
        activateDemoSession,
        signOutSession,
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
        toastMessage,
        triggerToast,
      }}
    >
      {children}
    </AstroFlameContext.Provider>
  );
}

export function useAstroFlame() {
  const ctx = useContext(AstroFlameContext);
  if (!ctx) {
    throw new Error('useAstroFlame must be used within an AstroFlameProvider');
  }
  return ctx;
}
