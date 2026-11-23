import { FirebaseApp, initializeApp } from 'firebase/app';
import { Auth, getAuth } from 'firebase/auth';
import {
  collection,
  doc,
  Firestore,
  getDocs,
  getDocFromServer,
  getFirestore,
  limit,
  query,
} from 'firebase/firestore';
import rawAppletConfig from '../firebase-applet-config.json';

export interface UserFriendlyFirebaseError {
  code: string;
  title: string;
  message: string;
  actionHint: string;
}

function pickConfigValue(envKey: string, fallback?: string): string {
  const envVal = (import.meta.env as Record<string, string | undefined>)[
    envKey
  ];
  if (typeof envVal === 'string' && envVal.trim().length > 0) {
    return envVal.trim();
  }
  return typeof fallback === 'string' ? fallback.trim() : '';
}

const resolvedFirebaseConfig = {
  projectId: pickConfigValue(
    'VITE_FIREBASE_PROJECT_ID',
    rawAppletConfig.projectId
  ),
  appId: pickConfigValue('VITE_FIREBASE_APP_ID', rawAppletConfig.appId),
  apiKey: pickConfigValue('VITE_FIREBASE_API_KEY', rawAppletConfig.apiKey),
  authDomain: pickConfigValue(
    'VITE_FIREBASE_AUTH_DOMAIN',
    rawAppletConfig.authDomain
  ),
  firestoreDatabaseId: pickConfigValue(
    'VITE_FIREBASE_DATABASE_ID',
    rawAppletConfig.firestoreDatabaseId
  ),
  storageBucket: pickConfigValue(
    'VITE_FIREBASE_STORAGE_BUCKET',
    rawAppletConfig.storageBucket
  ),
  messagingSenderId: pickConfigValue(
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    rawAppletConfig.messagingSenderId
  ),
};

function detectMissingConfigError(): UserFriendlyFirebaseError | null {
  const missing: string[] = [];
  if (!resolvedFirebaseConfig.apiKey) missing.push('API Key');
  if (!resolvedFirebaseConfig.authDomain) missing.push('Auth Domain');
  if (
    !resolvedFirebaseConfig.projectId ||
    resolvedFirebaseConfig.projectId === 'remixed-project-id'
  ) {
    missing.push('Project ID');
  }
  if (!resolvedFirebaseConfig.appId) missing.push('App ID');
  if (!resolvedFirebaseConfig.firestoreDatabaseId) {
    missing.push('Firestore Database ID');
  }

  if (missing.length === 0) return null;

  return {
    code: 'config/missing',
    title: 'Falta configuración de Firebase',
    message: `No se encontraron estos datos de Firebase: ${missing.join(', ')}. Sin ellos los pedidos no se guardan en la nube.`,
    actionHint:
      'Verifica que firebase-applet-config.json exista en el proyecto o pega las variables VITE_FIREBASE_* en Vercel.',
  };
}

export const firebaseConfigError: UserFriendlyFirebaseError | null =
  detectMissingConfigError();

export const firebaseProjectInfo = {
  projectId: resolvedFirebaseConfig.projectId,
  authDomain: resolvedFirebaseConfig.authDomain,
  databaseId: resolvedFirebaseConfig.firestoreDatabaseId,
};

let appInstance: FirebaseApp;
let dbInstance: Firestore;
let authInstance: Auth;

try {
  appInstance = initializeApp(resolvedFirebaseConfig);
  dbInstance = resolvedFirebaseConfig.firestoreDatabaseId
    ? getFirestore(appInstance, resolvedFirebaseConfig.firestoreDatabaseId)
    : getFirestore(appInstance);
  authInstance = getAuth(appInstance);
} catch (initError) {
  console.error('Firebase initialization failed:', initError);
  appInstance = initializeApp(
    {
      apiKey: resolvedFirebaseConfig.apiKey || 'missing-api-key',
      authDomain: resolvedFirebaseConfig.authDomain || 'localhost',
      projectId: resolvedFirebaseConfig.projectId || 'missing-project',
      appId: resolvedFirebaseConfig.appId || '1:000:web:000',
    },
    'fallback-init'
  );
  dbInstance = getFirestore(appInstance);
  authInstance = getAuth(appInstance);
}

export const db = dbInstance;
export const auth = authInstance;

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
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  };
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
        auth.currentUser?.providerData.map((provider) => ({
          providerId: provider.providerId,
          displayName: provider.displayName,
          email: provider.email,
          photoUrl: provider.photoURL,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

function extractRawErrorDetails(error: unknown): {
  code: string;
  rawMessage: string;
  path: string | null;
} {
  let code = '';
  let rawMessage = error instanceof Error ? error.message : String(error || '');
  let path: string | null = null;

  if (
    error &&
    typeof error === 'object' &&
    'code' in error &&
    typeof (error as { code?: unknown }).code === 'string'
  ) {
    code = (error as { code: string }).code;
  }

  try {
    const parsed = JSON.parse(rawMessage) as Partial<FirestoreErrorInfo>;
    if (parsed && typeof parsed.error === 'string') {
      rawMessage = parsed.error;
      path = typeof parsed.path === 'string' ? parsed.path : null;
    }
  } catch {
    // Raw message is plain text
  }

  const lower = rawMessage.toLowerCase();
  if (!code) {
    if (lower.includes('operation-not-allowed')) {
      code = 'auth/operation-not-allowed';
    } else if (lower.includes('admin-restricted-operation')) {
      code = 'auth/admin-restricted-operation';
    } else if (lower.includes('unauthorized-domain')) {
      code = 'auth/unauthorized-domain';
    } else if (lower.includes('network-request-failed')) {
      code = 'auth/network-request-failed';
    } else if (
      lower.includes('permission-denied') ||
      lower.includes('missing or insufficient permissions')
    ) {
      code = 'permission-denied';
    } else if (
      lower.includes('the client is offline') ||
      lower.includes('unavailable') ||
      lower.includes('failed to get document because the client is offline')
    ) {
      code = 'unavailable';
    } else if (lower.includes('not-found') || lower.includes('no document to update')) {
      code = 'not-found';
    } else if (lower.includes('quota exceeded') || lower.includes('resource-exhausted')) {
      code = 'resource-exhausted';
    }
  }

  return { code, rawMessage, path };
}

export function formatFirebaseErrorForUser(
  error: unknown,
  contextLabel = 'Sincronización con la nube'
): UserFriendlyFirebaseError {
  if (firebaseConfigError) {
    return firebaseConfigError;
  }

  const { code, rawMessage, path } = extractRawErrorDetails(error);
  const currentHost =
    typeof window !== 'undefined' ? window.location.hostname : 'tu dominio';

  if (
    code === 'auth/operation-not-allowed' ||
    code === 'auth/admin-restricted-operation'
  ) {
    return {
      code,
      title: 'Falta activar el acceso Anónimo en Firebase',
      message:
        'Firebase rechazó la conexión automática del celular/navegador porque el proveedor Anónimo está apagado en tu proyecto.',
      actionHint:
        'Ve a Firebase Console → Authentication → Sign-in method → Agregar proveedor → Anónimo → Activar y Guardar.',
    };
  }

  if (code === 'auth/unauthorized-domain') {
    return {
      code,
      title: 'Dominio de Vercel no autorizado en Firebase',
      message: `Firebase bloqueó la conexión desde "${currentHost}" porque ese dominio aún no está en la lista de dominios autorizados.`,
      actionHint: `Ve a Firebase Console → Authentication → Settings → Authorized domains → Add domain y agrega: ${currentHost}`,
    };
  }

  if (code === 'auth/network-request-failed' || code === 'unavailable') {
    return {
      code,
      title: 'Sin conexión con la nube de Firebase',
      message: `${contextLabel}: no se pudo llegar a los servidores de Firebase. Puede ser internet débil, un bloqueador de anuncios o la base de datos apagada.`,
      actionHint:
        'Revisa tu conexión Wi-Fi/datos móviles y pulsa "Reintentar". Si estás en red corporativa, prueba con datos móviles.',
    };
  }

  if (code === 'resource-exhausted') {
    const upgradeUrl =
      resolvedFirebaseConfig.projectId &&
      resolvedFirebaseConfig.firestoreDatabaseId
        ? `https://console.firebase.google.com/project/${resolvedFirebaseConfig.projectId}/firestore/databases/${resolvedFirebaseConfig.firestoreDatabaseId}/data?openUpgradeDialog=true`
        : 'https://console.firebase.google.com/';
    return {
      code,
      title: 'Límite diario de Firebase alcanzado',
      message:
        'Se alcanzó la cuota gratuita diaria de lecturas o escrituras en Firestore. Se restablece al día siguiente o al ampliar el plan.',
      actionHint: `Puedes revisar la cuota o el plan en Firebase Console: ${upgradeUrl}`,
    };
  }

  if (code === 'permission-denied') {
    if (path?.startsWith('staff_sessions')) {
      return {
        code,
        title: 'Turno de personal no validado en la nube',
        message:
          'Firebase rechazó el inicio de turno porque el usuario o PIN aún no existe en la base de datos de la nube.',
        actionHint:
          'Si es la primera vez que abres la app en la nube, entra primero con el PIN de Administrador (0000) para crear el catálogo y los usuarios en Firestore.',
      };
    }
    return {
      code,
      title: 'Error de permisos en Firestore',
      message: `${contextLabel}: Firebase bloqueó la lectura o escritura${
        path ? ` (${path})` : ''
      }.`,
      actionHint:
        'Verifica que las reglas de Firestore estén publicadas y que en la computadora hayas iniciado turno como Personal o Administrador (PIN 0000).',
    };
  }

  if (code === 'not-found') {
    return {
      code,
      title: 'Base de datos o registro no encontrado',
      message: `${contextLabel}: no se encontró la base de datos "${
        resolvedFirebaseConfig.firestoreDatabaseId || '(default)'
      }" o el documento en Firestore.`,
      actionHint:
        'Verifica en Firebase Console → Firestore Database que la base de datos exista con ese nombre.',
    };
  }

  return {
    code: code || 'firebase/unknown',
    title: `Problema en ${contextLabel}`,
    message: rawMessage || 'Ocurrió un error inesperado al conectar con Firebase.',
    actionHint:
      'Revisa tu conexión a internet y pulsa "Reintentar". Si continúa, revisa Firebase Console.',
  };
}

export async function testConnection(): Promise<{
  ok: boolean;
  error?: UserFriendlyFirebaseError;
}> {
  if (firebaseConfigError) {
    return { ok: false, error: firebaseConfigError };
  }

  try {
    await getDocs(query(collection(db, 'menuItems'), limit(1)));
    return { ok: true };
  } catch (error) {
    const rawMsg = error instanceof Error ? error.message : String(error || '');
    const lower = rawMsg.toLowerCase();
    if (
      lower.includes('the client is offline') ||
      lower.includes('unavailable')
    ) {
      return {
        ok: false,
        error: formatFirebaseErrorForUser(error, 'Conexión inicial con Firestore'),
      };
    }
    return { ok: true };
  }
}

void testConnection();

