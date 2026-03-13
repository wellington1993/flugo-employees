import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app'
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, type Firestore } from 'firebase/firestore'
import { getAuth, type Auth } from 'firebase/auth'
import { z } from 'zod'

const envSchema = z.object({
  VITE_FIREBASE_API_KEY: z.string().min(1),
  VITE_FIREBASE_PROJECT_ID: z.string().min(1),
  VITE_FIREBASE_AUTH_DOMAIN: z.string().optional(),
  VITE_FIREBASE_STORAGE_BUCKET: z.string().optional(),
  VITE_FIREBASE_MESSAGING_SENDER_ID: z.string().optional(),
  VITE_FIREBASE_APP_ID: z.string().optional(),
})

const resolveEnv = () => {
  const base = import.meta.env ?? {}
  return {
    VITE_FIREBASE_API_KEY: base.VITE_FIREBASE_API_KEY,
    VITE_FIREBASE_PROJECT_ID: base.VITE_FIREBASE_PROJECT_ID,
    VITE_FIREBASE_AUTH_DOMAIN: base.VITE_FIREBASE_AUTH_DOMAIN,
    VITE_FIREBASE_STORAGE_BUCKET: base.VITE_FIREBASE_STORAGE_BUCKET,
    VITE_FIREBASE_MESSAGING_SENDER_ID: base.VITE_FIREBASE_MESSAGING_SENDER_ID,
    VITE_FIREBASE_APP_ID: base.VITE_FIREBASE_APP_ID,
  }
}

const parseEnv = () => {
  try {
    const config = resolveEnv()
    if (!config.VITE_FIREBASE_API_KEY || !config.VITE_FIREBASE_PROJECT_ID) {
      return null
    }
    return envSchema.parse(config)
  } catch (e) {
    if (import.meta.env.DEV || import.meta.env.MODE === 'test') {
      console.warn('[Firebase] Configuração inválida ou ausente.', e)
    }
    return null
  }
}

const env = parseEnv()
export const isFirebaseConfigured = !!env

let app: FirebaseApp
let db: Firestore
let auth: Auth

if (env) {
  const firebaseConfig = {
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || `${env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID,
  }

  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager()
    })
  })
  auth = getAuth(app)
} else {
  // Mocks para evitar erros de runtime em modo offline
  app = {} as FirebaseApp
  db = {} as Firestore
  auth = {} as Auth
}

export { app, db, auth }
