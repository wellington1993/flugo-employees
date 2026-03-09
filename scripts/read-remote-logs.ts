import { initializeApp } from 'firebase/app'
import { getFirestore, collection, getDocs, query, orderBy, limit } from 'firebase/firestore'
import * as dotenv from 'dotenv'

dotenv.config()

const config = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
}

async function readRemoteLogs() {
  console.log('--- LENDO LOGS DE ERRO DA VERCEL ---')
  try {
    const app = initializeApp(config)
    const db = getFirestore(app)
    const logRef = collection(db, 'app_logs')
    const q = query(logRef, orderBy('timestamp', 'desc'), limit(5))
    
    const snapshot = await getDocs(q)
    if (snapshot.empty) {
      console.log('Nenhum log de erro encontrado no banco.')
      return
    }

    snapshot.forEach(doc => {
      const data = doc.data()
      console.log(`[${new Date(data.timestamp).toLocaleString()}] ${data.context}: ${data.message}`)
      console.log(`UA: ${data.userAgent}\n`)
    })
  } catch (err: any) {
    console.error('Falha ao ler logs:', err.message)
  }
}

readRemoteLogs()
