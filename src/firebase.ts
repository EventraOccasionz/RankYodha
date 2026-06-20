import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCcekn4DdjykUgcXfvbtzQj6YdEhhuCgoI",
  authDomain: "examforge-a295f.firebaseapp.com",
  projectId: "examforge-a295f",
  storageBucket: "examforge-a295f.firebasestorage.app",
  messagingSenderId: "102346844565",
  appId: "1:102346844565:web:1e240b94e6791d51f02e9c"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, "ai-studio-4472a672-6dd1-444f-b116-a1d694b12fb7");
export const auth = getAuth(app);

export async function logActivity(type: string, userName: string, detail: string, value: number = 0): Promise<void> {
  const logId = "log_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
  const payload = {
    logId,
    userName,
    type,
    detail,
    value,
    timestamp: new Date().toISOString()
  };
  try {
    await setDoc(doc(db, "activityLogs", logId), payload);
  } catch (err) {
    console.warn("[logActivity] Non-blocking logger write failed (usually unauthenticated or offline):", err);
  }
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

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.warn('Firestore Error details: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
