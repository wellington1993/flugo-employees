import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app'
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, type Firestore } from 'firebase/firestore'
import { getAuth, type Auth } from 'firebase/auth'
import { z } from 'zod'

const envSchema = z.object({
  VITE_FIREBASE_API_KEY: z.string().min(1),
  VITE_FIREBASE_PROJECT_ID: z.string().min(1),
})

const parseEnv = () => {
  try {
    const config = {
      VITE_FIREBASE_API_KEY: import.meta.env.VITE_FIREBASE_API_KEY,
      VITE_FIREBASE_PROJECT_ID: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    }
    if (!config.VITE_FIREBASE_API_KEY || !config.VITE_FIREBASE_PROJECT_ID) return null
    return envSchema.parse(config)
  } catch (e) {
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
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    authDomain: `${env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  }

  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager()
    })
  })
  auth = getAuth(app)
} else {
  // Mocks simplificados para não quebrar o app
  app = {} as any
  db = {} as any
  auth = {
    currentUser: null,
    onAuthStateChanged: (cb: any) => {
      cb(null)
      return () => {}
    },
    onIdTokenChanged: (cb: any) => {
      cb(null)
      return () => {}
    },
  } as any
}

export { app, db, auth }
