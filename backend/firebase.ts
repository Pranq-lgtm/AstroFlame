'use client';

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type Auth,
  type User,
} from 'firebase/auth';
import {
  initializeFirestore,
  getFirestore,
  setLogLevel,
  collection,
  doc,
  getDocFromServer,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  Timestamp,
  type Firestore,
} from 'firebase/firestore';
import defaultFirebaseConfig from '../firebase-applet-config.json';

// Suppress @firebase/firestore internal console.error logs so transient WebChannel
// probes in preview iframes never trigger the Next.js 15 Dev Error Overlay.
try {
  setLogLevel('silent');
} catch {
  // ignore
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export interface CustomFirebaseCredentials {
  apiKey: string;
  authDomain: string;
  projectId: string;
  appId: string;
  firestoreDatabaseId?: string;
}

const CUSTOM_CONFIG_STORAGE_KEY = 'astroflame_custom_firebase_config_v1';

export function getActiveFirebaseConfig(): CustomFirebaseCredentials {
  if (typeof window !== 'undefined') {
    try {
      const saved = window.localStorage.getItem(CUSTOM_CONFIG_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<CustomFirebaseCredentials>;
        if (parsed.apiKey && parsed.projectId && parsed.appId) {
          return {
            apiKey: parsed.apiKey,
            authDomain: parsed.authDomain || `${parsed.projectId}.firebaseapp.com`,
            projectId: parsed.projectId,
            appId: parsed.appId,
            firestoreDatabaseId:
              parsed.firestoreDatabaseId || defaultFirebaseConfig.firestoreDatabaseId,
          };
        }
      }
    } catch {
      // Fallback to env or provisioned config
    }
  }
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || defaultFirebaseConfig.apiKey,
    authDomain:
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || defaultFirebaseConfig.authDomain,
    projectId:
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || defaultFirebaseConfig.projectId,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || defaultFirebaseConfig.appId,
    firestoreDatabaseId:
      process.env.NEXT_PUBLIC_FIRESTORE_DATABASE_ID ||
      defaultFirebaseConfig.firestoreDatabaseId,
  };
}

export function saveCustomFirebaseConfig(config: CustomFirebaseCredentials | null): void {
  if (typeof window === 'undefined') return;
  if (!config) {
    window.localStorage.removeItem(CUSTOM_CONFIG_STORAGE_KEY);
  } else {
    window.localStorage.setItem(CUSTOM_CONFIG_STORAGE_KEY, JSON.stringify(config));
  }
}

const activeConfig = getActiveFirebaseConfig();
const targetDbId = activeConfig.firestoreDatabaseId || defaultFirebaseConfig.firestoreDatabaseId;

export const app: FirebaseApp =
  getApps().length === 0 ? initializeApp(activeConfig) : getApp();

function createResilientFirestore(firebaseApp: FirebaseApp, databaseId: string): Firestore {
  try {
    return initializeFirestore(
      firebaseApp,
      {
        experimentalForceLongPolling: true,
      },
      databaseId
    );
  } catch {
    return getFirestore(firebaseApp, databaseId);
  }
}

export const db: Firestore = createResilientFirestore(app, targetDbId);
export const auth: Auth = getAuth(app);

// Validate connection on boot without triggering Next.js console.error overlays
let connectionTested = false;
export async function testConnection(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.info(
        'Cloud Firestore operating in local/offline workspace mode until backend responds.'
      );
      return false;
    }
    // A permission-denied on /test/connection means the client is online and reaching Firestore
    return true;
  }
}

if (typeof window !== 'undefined' && !connectionTested) {
  connectionTested = true;
  void testConnection();
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.warn('Firestore operation fallback:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function signInWithGooglePopup(): Promise<User> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const result = await signInWithPopup(auth, provider);
  return result.user;
}

export async function signOutUser(): Promise<void> {
  await firebaseSignOut(auth);
}

export {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  Timestamp,
  onAuthStateChanged,
};
